'use server';

import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { checkoutFormSchema } from '@/features/orders/validators';
import { getActiveProductByStoreAndSlug } from '@/features/products/queries';
import { getStoreBySlug } from '@/features/stores/queries';
import { db } from '@/libs/DB';
import { createInquiry, isDuitkuConfigured } from '@/libs/duitku/client';
import { Env } from '@/libs/Env';
import { MAX_ORDER_TOTAL_IDR } from '@/libs/hub/constants';
import { logger } from '@/libs/Logger';
import { orders, paymentEvents } from '@/models/Schema';
import {
  getBaseUrl,
  isMockPaymentsAllowed,
  isSafePaymentRedirectUrl,
} from '@/utils/Helpers';

type CheckoutResult
  = | { ok: true; paymentUrl: string; merchantOrderId: string; mock?: boolean }
    | { ok: false; error: string };

/**
 * Create pending order + Duitku inquiry (or mock payment URL in allowed envs).
 * Price always from DB — never trust client amount.
 */
async function createCheckoutAndPay(
  storeSlug: string,
  productSlug: string,
  formData: FormData,
): Promise<CheckoutResult> {
  try {
    if (!isValidPathSlug(storeSlug) || !isValidPathSlug(productSlug)) {
      return { ok: false, error: 'invalid_path' };
    }

    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return { ok: false, error: 'store_not_found' };
    }

    const product = await getActiveProductByStoreAndSlug(store.id, productSlug);
    if (!product) {
      return { ok: false, error: 'product_not_found' };
    }

    const parsed = checkoutFormSchema.safeParse({
      buyerName: formData.get('buyerName'),
      buyerEmail: formData.get('buyerEmail'),
      buyerPhone: formData.get('buyerPhone') || '',
      quantity: formData.get('quantity') || 1,
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || 'invalid_input',
      };
    }

    const { buyerName, buyerEmail, buyerPhone, quantity } = parsed.data;
    const unitPriceIdr = product.priceIdr;
    const totalIdr = unitPriceIdr * quantity;
    if (
      !Number.isInteger(totalIdr)
      || totalIdr <= 0
      || totalIdr > MAX_ORDER_TOTAL_IDR
    ) {
      return { ok: false, error: 'invalid_amount' };
    }

    const merchantOrderId = `RPP_${randomUUID().replaceAll('-', '')}`;
    const paymentMethod = Env.DUITKU_DEFAULT_PAYMENT_METHOD || 'SP';

    const [order] = await db
      .insert(orders)
      .values({
        storeId: store.id,
        productId: product.id,
        buyerEmail,
        buyerName,
        buyerPhone: buyerPhone || null,
        quantity,
        unitPriceIdr,
        totalIdr,
        status: 'pending_payment',
        merchantOrderId,
        paymentMethod,
        metadata: {
          storeSlug,
          productSlug,
          productTitle: product.title,
        },
      })
      .returning();

    if (!order) {
      return { ok: false, error: 'order_create_failed' };
    }

    const baseUrl = getBaseUrl();
    const callbackUrl = `${baseUrl}/api/payments/duitku/callback`;
    const returnUrl = `${baseUrl}/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    if (!isDuitkuConfigured()) {
      if (!isMockPaymentsAllowed()) {
        await db
          .update(orders)
          .set({ status: 'failed' })
          .where(eq(orders.id, order.id));
        return { ok: false, error: 'duitku_not_configured' };
      }

      await db.insert(paymentEvents).values({
        orderId: order.id,
        source: 'inquiry',
        payload: { mock: true, totalIdr, merchantOrderId },
        signatureValid: 0,
      });

      logger.info(`Checkout mock mode merchantOrderId=${merchantOrderId}`);

      return {
        ok: true,
        mock: true,
        merchantOrderId,
        paymentUrl: `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&mock=1`,
      };
    }

    try {
      const inquiry = await createInquiry({
        paymentAmount: totalIdr,
        paymentMethod,
        merchantOrderId,
        productDetails: `${product.title} x${quantity}`.slice(0, 255),
        email: buyerEmail,
        customerVaName: buyerName,
        phoneNumber: buyerPhone || undefined,
        callbackUrl,
        returnUrl,
        itemDetails: [
          {
            name: product.title.slice(0, 100),
            price: unitPriceIdr,
            quantity,
          },
        ],
      });

      if (inquiry.reference) {
        await db
          .update(orders)
          .set({ duitkuReference: inquiry.reference })
          .where(eq(orders.id, order.id));
      }

      await db.insert(paymentEvents).values({
        orderId: order.id,
        source: 'inquiry',
        payload: inquiry as unknown as Record<string, unknown>,
        signatureValid: 1,
      });

      if (!inquiry.paymentUrl || !isSafePaymentRedirectUrl(inquiry.paymentUrl)) {
        logger.error(`Unsafe or missing Duitku paymentUrl for ${merchantOrderId}`);
        await db
          .update(orders)
          .set({ status: 'failed' })
          .where(eq(orders.id, order.id));
        return { ok: false, error: 'payment_url_invalid' };
      }

      return {
        ok: true,
        merchantOrderId,
        paymentUrl: inquiry.paymentUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'inquiry_failed';
      logger.error(`Duitku inquiry failed: ${message}`);

      await db.insert(paymentEvents).values({
        orderId: order.id,
        source: 'inquiry',
        payload: { error: message },
        signatureValid: 0,
      });

      await db
        .update(orders)
        .set({ status: 'failed' })
        .where(eq(orders.id, order.id));

      return { ok: false, error: 'inquiry_failed' };
    }
  } catch (error) {
    // Never surface raw driver/DB error text to the public checkout page.
    logger.error(
      `Checkout failed: ${error instanceof Error ? error.message : 'unknown'}`,
    );
    return { ok: false, error: 'checkout_failed' };
  }
}

/** Form action: create checkout then redirect to payment (or back with error). */
export async function createCheckoutAndRedirect(
  storeSlug: string,
  productSlug: string,
  formData: FormData,
) {
  const result = await createCheckoutAndPay(storeSlug, productSlug, formData);
  if (!result.ok) {
    redirect(
      `/${storeSlug}/p/${productSlug}?error=${encodeURIComponent(result.error)}`,
    );
  }
  if (!isSafePaymentRedirectUrl(result.paymentUrl)) {
    redirect(
      `/${storeSlug}/p/${productSlug}?error=${encodeURIComponent('payment_url_invalid')}`,
    );
  }
  redirect(result.paymentUrl);
}

function isValidPathSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}
