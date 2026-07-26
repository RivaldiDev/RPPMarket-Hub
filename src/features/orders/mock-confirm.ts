'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { markOrderPaidAndCredit } from '@/features/wallet/ledger';
import { db } from '@/libs/DB';
import { isDuitkuConfigured } from '@/libs/duitku/client';
import { orders, paymentEvents } from '@/models/Schema';
import { isMockPaymentsAllowed } from '@/utils/Helpers';

/**
 * Dev/mock helper: confirm payment only when mock mode is allowed
 * and Duitku is not configured.
 */
export async function mockConfirmPaymentAction(formData: FormData) {
  const merchantOrderId = String(formData.get('merchantOrderId') || '');
  if (!merchantOrderId || !/^RPP_[a-zA-Z0-9]+$/.test(merchantOrderId)) {
    redirect('/payments/return?error=missing_order');
  }

  if (isDuitkuConfigured()) {
    redirect(
      `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&error=duitku_configured`,
    );
  }

  if (!isMockPaymentsAllowed()) {
    redirect(
      `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&error=mock_disabled`,
    );
  }

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.merchantOrderId, merchantOrderId))
    .limit(1);
  const order = rows[0];
  if (!order) {
    redirect(
      `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&error=order_not_found`,
    );
  }

  if (order.status !== 'pending_payment') {
    redirect(
      `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&mock=1`,
    );
  }

  await db.insert(paymentEvents).values({
    orderId: order.id,
    source: 'callback',
    payload: { mock: true, resultCode: '00' },
    signatureValid: 1,
  });

  await markOrderPaidAndCredit({
    orderId: order.id,
    amountIdr: order.totalIdr,
    reference: 'MOCK',
    paymentMethod: 'MOCK',
  });

  revalidatePath('/payments/return');
  revalidatePath('/dashboard/wallet');
  revalidatePath('/dashboard/orders');
  redirect(
    `/payments/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}&mock=1`,
  );
}
