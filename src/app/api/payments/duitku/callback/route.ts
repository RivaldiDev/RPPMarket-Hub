import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { markOrderPaidAndCredit } from '@/features/wallet/ledger';
import { db } from '@/libs/DB';
import { getTransactionStatus, isDuitkuConfigured } from '@/libs/duitku/client';
import { safeEqualHex, signCallback } from '@/libs/duitku/signature';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { orders, paymentEvents } from '@/models/Schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function parseForm(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) {
      data[key] = String(value ?? '');
    }
    return data;
  }
  const form = await request.formData();
  const data: Record<string, string> = {};
  form.forEach((value, key) => {
    data[key] = String(value);
  });
  return data;
}

/**
 * Duitku payment callback.
 * - Verify merchantCode + MD5 signature (constant-time)
 * - Match amount
 * - resultCode 00 → mark paid once + credit wallet
 * - resultCode 01 → mark failed (only from pending)
 * - Idempotent
 */
export async function POST(request: Request) {
  try {
    const body = await parseForm(request);
    const merchantCode = body.merchantCode || '';
    const amount = body.amount || '';
    const merchantOrderId = body.merchantOrderId || '';
    const signature = body.signature || '';
    const resultCode = body.resultCode || '';
    const reference = body.reference || '';
    const paymentCode = body.paymentCode || body.paymentMethod || '';

    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      return new NextResponse('bad_parameter', { status: 400 });
    }

    if (!isDuitkuConfigured()) {
      logger.error('Duitku callback received but gateway not configured');
      return new NextResponse('not_configured', { status: 503 });
    }

    if (!constantTimeStringEqual(merchantCode, Env.DUITKU_MERCHANT_CODE)) {
      logger.warn('Duitku callback merchantCode mismatch');
      return new NextResponse('invalid_merchant', { status: 400 });
    }

    const expected = signCallback(
      Env.DUITKU_MERCHANT_CODE,
      amount,
      merchantOrderId,
      Env.DUITKU_API_KEY,
    );
    const signatureValid = safeEqualHex(signature, expected);

    // Reject before any DB write: unauthenticated callers must not be able
    // to grow payment_events with arbitrary payloads.
    if (!signatureValid) {
      logger.warn(`Duitku callback invalid signature ${merchantOrderId}`);
      return new NextResponse('invalid_signature', { status: 400 });
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.merchantOrderId, merchantOrderId))
      .limit(1);
    const order = orderRows[0];

    if (!order) {
      // Acknowledge so Duitku stops retrying unknown ids
      logger.warn(`Duitku callback unknown order ${merchantOrderId}`);
      return new NextResponse('OK', { status: 200 });
    }

    await db.insert(paymentEvents).values({
      orderId: order.id,
      source: 'callback',
      payload: sanitizeCallbackPayload(body),
      signatureValid: 1,
    });

    const amountIdr = Number.parseInt(amount, 10);
    if (!Number.isInteger(amountIdr) || amountIdr !== order.totalIdr) {
      logger.warn(
        `Duitku amount mismatch ${merchantOrderId} expected=${order.totalIdr} got=${amount}`,
      );
      return new NextResponse('amount_mismatch', { status: 400 });
    }

    if (resultCode === '00') {
      // Defense in depth: independently confirm with transactionStatus.
      // A reachable gateway that says "not paid" blocks the credit; an
      // unreachable gateway does not (signature already verified).
      try {
        const status = await getTransactionStatus(merchantOrderId);
        await db.insert(paymentEvents).values({
          orderId: order.id,
          source: 'status_check',
          payload: status as unknown as Record<string, unknown>,
          signatureValid: 1,
        });
        if (status.statusCode && status.statusCode !== '00') {
          logger.error(
            `Duitku status check contradicts callback ${merchantOrderId}: statusCode=${status.statusCode}`,
          );
          return new NextResponse('status_mismatch', { status: 500 });
        }
      } catch (error) {
        logger.warn(
          `Duitku status check failed: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }

      try {
        const result = await markOrderPaidAndCredit({
          orderId: order.id,
          amountIdr: order.totalIdr,
          reference,
          paymentMethod: paymentCode || order.paymentMethod || undefined,
        });
        logger.info(
          `Duitku paid ${merchantOrderId} alreadyPaid=${result.alreadyPaid} credited=${result.credited}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'credit_failed';
        logger.error(`Duitku credit failed ${merchantOrderId}: ${message}`);
        if (message === 'amount_mismatch') {
          return new NextResponse('amount_mismatch', { status: 400 });
        }
        return new NextResponse('credit_failed', { status: 500 });
      }
    } else if (resultCode === '01' && order.status === 'pending_payment') {
      await db
        .update(orders)
        .set({
          status: 'failed',
          duitkuReference: reference || order.duitkuReference,
          paymentMethod: paymentCode || order.paymentMethod,
        })
        .where(eq(orders.id, order.id));
      logger.info(`Duitku failed ${merchantOrderId} resultCode=${resultCode}`);
    } else {
      logger.info(
        `Duitku callback ignored ${merchantOrderId} resultCode=${resultCode} status=${order.status}`,
      );
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    logger.error(
      `Duitku callback error: ${error instanceof Error ? error.message : 'unknown'}`,
    );
    return new NextResponse('server_error', { status: 500 });
  }
}

function sanitizeCallbackPayload(
  body: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    out[key] = value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  return out;
}

function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
