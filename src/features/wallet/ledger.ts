import { and, desc, eq } from 'drizzle-orm';
import { computeWithdrawFee } from '@/features/wallet/fee';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import {
  ledgerEntries,
  orders,
  wallets,
  withdrawRequests,
} from '@/models/Schema';

export type RequestWithdrawParams = {
  storeId: string;
  amountIdr: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

export type RequestWithdrawResult = {
  withdrawRequestId: string;
  amountIdr: number;
  feeIdr: number;
  netIdr: number;
  availableIdr: number;
  pendingIdr: number;
};

function assertPositiveIntegerIdr(amountIdr: number, label = 'amountIdr'): void {
  if (!Number.isInteger(amountIdr) || amountIdr <= 0) {
    throw new Error(`invalid_${label}`);
  }
}

/** Get or create the wallet row for a store. */
export async function ensureWallet(storeId: string) {
  if (!storeId?.trim()) {
    throw new Error('storeId is required');
  }

  const [existing] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.storeId, storeId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(wallets)
    .values({
      storeId,
      availableIdr: 0,
      pendingIdr: 0,
      lifetimeEarnedIdr: 0,
      lifetimeWithdrawnIdr: 0,
    })
    .returning();

  if (!created) {
    throw new Error('wallet_create_failed');
  }

  return created;
}

/** Recent ledger entries for a store (newest first). */
export async function listLedgerForStore(storeId: string, limit = 50) {
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.storeId, storeId))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(limit);
}

/** Recent withdraw requests for a store (newest first). */
export async function listWithdrawsForStore(storeId: string, limit = 50) {
  return db
    .select()
    .from(withdrawRequests)
    .where(eq(withdrawRequests.storeId, storeId))
    .orderBy(desc(withdrawRequests.createdAt))
    .limit(limit);
}

/**
 * Mark order paid (idempotent) then credit store wallet once.
 */
export async function markOrderPaidAndCredit(input: {
  orderId: string;
  amountIdr: number;
  reference?: string;
  paymentMethod?: string;
}): Promise<{ alreadyPaid: boolean; credited: boolean }> {
  assertPositiveIntegerIdr(input.amountIdr);

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .limit(1);

    if (!order) {
      throw new Error('order_not_found');
    }
    if (order.totalIdr !== input.amountIdr) {
      throw new Error('amount_mismatch');
    }
    if (order.status === 'paid') {
      return { alreadyPaid: true, credited: false };
    }

    // Conditional update: only one concurrent callback wins the race.
    const updatedOrders = await tx
      .update(orders)
      .set({
        status: 'paid',
        paidAt: new Date(),
        duitkuReference: input.reference ?? order.duitkuReference,
        paymentMethod: input.paymentMethod ?? order.paymentMethod,
      })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'pending_payment')))
      .returning({ id: orders.id });

    if (!updatedOrders[0]) {
      return { alreadyPaid: true, credited: false };
    }

    const existing = await tx
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.storeId, order.storeId),
          eq(ledgerEntries.refType, 'order'),
          eq(ledgerEntries.refId, order.id),
          eq(ledgerEntries.type, 'order_credit'),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return { alreadyPaid: false, credited: false };
    }

    let [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.storeId, order.storeId))
      .limit(1);

    if (!wallet) {
      const [created] = await tx
        .insert(wallets)
        .values({
          storeId: order.storeId,
          availableIdr: 0,
          pendingIdr: 0,
          lifetimeEarnedIdr: 0,
          lifetimeWithdrawnIdr: 0,
        })
        .returning();
      if (!created) {
        throw new Error('wallet_create_failed');
      }
      wallet = created;
    }

    const nextAvailable = wallet.availableIdr + order.totalIdr;
    const nextLifetime = wallet.lifetimeEarnedIdr + order.totalIdr;

    await tx
      .update(wallets)
      .set({
        availableIdr: nextAvailable,
        lifetimeEarnedIdr: nextLifetime,
      })
      .where(eq(wallets.id, wallet.id));

    await tx.insert(ledgerEntries).values({
      storeId: order.storeId,
      type: 'order_credit',
      amountIdr: order.totalIdr,
      balanceAfterIdr: nextAvailable,
      refType: 'order',
      refId: order.id,
      note: `Paid ${order.merchantOrderId}`,
    });

    return { alreadyPaid: false, credited: true };
  });
}

/**
 * Request a withdraw: holds full amount from available → pending,
 * records fee (platform 5% default), creates withdraw_requests row.
 */
export async function requestWithdraw(
  params: RequestWithdrawParams,
): Promise<RequestWithdrawResult> {
  const {
    storeId,
    amountIdr,
    bankName,
    bankAccountNumber,
    bankAccountName,
  } = params;

  assertPositiveIntegerIdr(amountIdr);

  if (!storeId?.trim()) {
    throw new Error('storeId is required');
  }
  if (!bankName?.trim() || !bankAccountNumber?.trim() || !bankAccountName?.trim()) {
    throw new Error('bank details are required');
  }

  const minWithdraw = Env.PLATFORM_MIN_WITHDRAW_IDR;
  if (amountIdr < minWithdraw) {
    throw new Error(`amount_below_minimum_${minWithdraw}`);
  }

  const feeBps = Env.PLATFORM_WITHDRAW_FEE_BPS;
  const { feeIdr, netIdr } = computeWithdrawFee(amountIdr, feeBps);

  return db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.storeId, storeId))
      .limit(1);

    if (!wallet) {
      throw new Error('wallet_not_found');
    }

    if (wallet.availableIdr < amountIdr) {
      throw new Error('insufficient_balance');
    }

    const nextAvailable = wallet.availableIdr - amountIdr;
    const nextPending = wallet.pendingIdr + amountIdr;

    // Optimistic concurrency: only succeed if available balance still matches.
    const [updated] = await tx
      .update(wallets)
      .set({
        availableIdr: nextAvailable,
        pendingIdr: nextPending,
      })
      .where(
        and(
          eq(wallets.id, wallet.id),
          eq(wallets.availableIdr, wallet.availableIdr),
        ),
      )
      .returning();

    if (!updated) {
      throw new Error('insufficient_balance');
    }

    const [request] = await tx
      .insert(withdrawRequests)
      .values({
        storeId,
        amountIdr,
        feeIdr,
        netIdr,
        status: 'pending',
        bankName,
        bankAccountNumber,
        bankAccountName,
      })
      .returning();

    if (!request) {
      throw new Error('withdraw_request_insert_failed');
    }

    // Hold full gross amount out of available balance
    await tx.insert(ledgerEntries).values({
      storeId,
      type: 'withdraw_hold',
      amountIdr: -amountIdr,
      balanceAfterIdr: nextAvailable,
      refType: 'withdraw',
      refId: request.id,
      note: `Withdraw hold ${request.id}`,
    });

    // Fee snapshot (informational; net is paid later on approval)
    if (feeIdr > 0) {
      await tx.insert(ledgerEntries).values({
        storeId,
        type: 'withdraw_fee',
        amountIdr: -feeIdr,
        balanceAfterIdr: nextAvailable,
        refType: 'withdraw',
        refId: request.id,
        note: `Platform fee ${feeBps} bps on withdraw ${request.id}`,
      });
    }

    return {
      withdrawRequestId: request.id,
      amountIdr,
      feeIdr,
      netIdr,
      availableIdr: updated.availableIdr,
      pendingIdr: updated.pendingIdr,
    };
  });
}
