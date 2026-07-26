import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { computeWithdrawFee } from '@/features/wallet/fee';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import {
  ledgerEntries,
  orders,
  wallets,
  withdrawRequests,
} from '@/models/Schema';

/**
 * Ledger invariant — the `available` balance journal:
 *
 *   wallets.available_idr = Σ amount_idr over types
 *     (order_credit, withdraw_hold, withdraw_release, adjust, refund)
 *
 * withdraw_payout / withdraw_fee entries document consumption of the
 * pending* hold at payout time; their amounts never touch `available`
 * and are excluded from the reconciliation sum above.
 *
 * All balance mutations use SQL-level increments (`SET x = x + …`) with
 * guard predicates, never read-modify-write from JS, so concurrent
 * credits/withdraws cannot lose updates.
 */

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

/** Get or create the wallet row for a store (race-safe via unique index). */
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

  // Concurrent creation loses to wallets_store_id_uidx — re-select after.
  await db
    .insert(wallets)
    .values({
      storeId,
      availableIdr: 0,
      pendingIdr: 0,
      lifetimeEarnedIdr: 0,
      lifetimeWithdrawnIdr: 0,
    })
    .onConflictDoNothing();

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.storeId, storeId))
    .limit(1);

  if (!wallet) {
    throw new Error('wallet_create_failed');
  }

  return wallet;
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
 * Accepts late payments: `failed` orders (e.g. expired VA paid after the
 * failure callback) still transition to paid — Duitku has collected the
 * money either way, and the seller must be credited.
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
    if (order.status === 'paid' || order.status === 'fulfilled_manual') {
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
      .where(
        and(
          eq(orders.id, order.id),
          inArray(orders.status, ['pending_payment', 'failed', 'expired']),
        ),
      )
      .returning({ id: orders.id });

    if (!updatedOrders[0]) {
      return { alreadyPaid: true, credited: false };
    }

    const wallet = await ensureWalletTx(tx, order.storeId);

    // Ledger unique index (store, type, refType, refId) is the hard
    // idempotency backstop; the conditional order update above already
    // guarantees a single winner.
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        storeId: order.storeId,
        type: 'order_credit',
        amountIdr: order.totalIdr,
        // Placeholder; fixed below from the atomic RETURNING value.
        balanceAfterIdr: 0,
        refType: 'order',
        refId: order.id,
        note: `Paid ${order.merchantOrderId}`,
      })
      .onConflictDoNothing()
      .returning({ id: ledgerEntries.id });

    if (!entry) {
      // Ledger row already exists — order was credited before.
      return { alreadyPaid: false, credited: false };
    }

    const [updatedWallet] = await tx
      .update(wallets)
      .set({
        availableIdr: sql`${wallets.availableIdr} + ${order.totalIdr}`,
        lifetimeEarnedIdr: sql`${wallets.lifetimeEarnedIdr} + ${order.totalIdr}`,
      })
      .where(eq(wallets.id, wallet.id))
      .returning({ availableIdr: wallets.availableIdr });

    if (!updatedWallet) {
      throw new Error('wallet_update_failed');
    }

    await tx
      .update(ledgerEntries)
      .set({ balanceAfterIdr: updatedWallet.availableIdr })
      .where(eq(ledgerEntries.id, entry.id));

    return { alreadyPaid: false, credited: true };
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureWalletTx(tx: Tx, storeId: string) {
  const [existing] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.storeId, storeId))
    .limit(1);

  if (existing) {
    return existing;
  }

  await tx
    .insert(wallets)
    .values({
      storeId,
      availableIdr: 0,
      pendingIdr: 0,
      lifetimeEarnedIdr: 0,
      lifetimeWithdrawnIdr: 0,
    })
    .onConflictDoNothing();

  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.storeId, storeId))
    .limit(1);

  if (!wallet) {
    throw new Error('wallet_create_failed');
  }

  return wallet;
}

/**
 * Request a withdraw: holds full gross amount from available → pending,
 * records the platform fee on the request row, writes one withdraw_hold
 * ledger entry (−gross). The fee is materialized at payout time.
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
    const wallet = await ensureWalletTx(tx, storeId);

    // Atomic hold: succeeds only if available still covers the amount,
    // regardless of concurrent credits or withdraws.
    const [updated] = await tx
      .update(wallets)
      .set({
        availableIdr: sql`${wallets.availableIdr} - ${amountIdr}`,
        pendingIdr: sql`${wallets.pendingIdr} + ${amountIdr}`,
      })
      .where(
        and(
          eq(wallets.id, wallet.id),
          sql`${wallets.availableIdr} >= ${amountIdr}`,
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

    // Hold full gross amount out of available balance.
    await tx.insert(ledgerEntries).values({
      storeId,
      type: 'withdraw_hold',
      amountIdr: -amountIdr,
      balanceAfterIdr: updated.availableIdr,
      refType: 'withdraw',
      refId: request.id,
      note: `Withdraw hold ${request.id}`,
    });

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

/**
 * Admin: mark a pending withdraw as paid after the manual bank transfer.
 * Consumes the pending hold (gross), records payout (−net) and platform
 * fee (−fee) ledger entries against the hold, and adds the net amount to
 * lifetime withdrawn.
 */
export async function markWithdrawPaid(
  withdrawId: string,
  adminUserId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(withdrawRequests)
      .where(eq(withdrawRequests.id, withdrawId))
      .limit(1);

    if (!req) {
      throw new Error('not_found');
    }

    const updated = await tx
      .update(withdrawRequests)
      .set({
        status: 'paid',
        processedAt: new Date(),
        adminNote: `Marked paid by ${adminUserId}`,
      })
      .where(
        and(
          eq(withdrawRequests.id, withdrawId),
          eq(withdrawRequests.status, 'pending'),
        ),
      )
      .returning({ id: withdrawRequests.id });

    if (!updated[0]) {
      throw new Error('not_pending');
    }

    const [wallet] = await tx
      .update(wallets)
      .set({
        pendingIdr: sql`${wallets.pendingIdr} - ${req.amountIdr}`,
        lifetimeWithdrawnIdr: sql`${wallets.lifetimeWithdrawnIdr} + ${req.netIdr}`,
      })
      .where(
        and(
          eq(wallets.storeId, req.storeId),
          sql`${wallets.pendingIdr} >= ${req.amountIdr}`,
        ),
      )
      .returning({ availableIdr: wallets.availableIdr });

    if (!wallet) {
      // Pending hold missing — refuse to mark paid over inconsistent state.
      throw new Error('wallet_inconsistent');
    }

    // Pending-consumption records; available is unchanged by these.
    await tx.insert(ledgerEntries).values([
      {
        storeId: req.storeId,
        type: 'withdraw_payout' as const,
        amountIdr: -req.netIdr,
        balanceAfterIdr: wallet.availableIdr,
        refType: 'withdraw',
        refId: req.id,
        note: `Payout ${req.id} (net)`,
      },
      {
        storeId: req.storeId,
        type: 'withdraw_fee' as const,
        amountIdr: -req.feeIdr,
        balanceAfterIdr: wallet.availableIdr,
        refType: 'withdraw',
        refId: req.id,
        note: `Platform fee on withdraw ${req.id}`,
      },
    ]);
  });
}

/**
 * Admin: reject a pending withdraw and release the held gross amount
 * back to the store's available balance.
 */
export async function rejectWithdraw(
  withdrawId: string,
  adminUserId: string,
  note?: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(withdrawRequests)
      .where(eq(withdrawRequests.id, withdrawId))
      .limit(1);

    if (!req) {
      throw new Error('not_found');
    }

    const updated = await tx
      .update(withdrawRequests)
      .set({
        status: 'rejected',
        processedAt: new Date(),
        adminNote: note?.trim()
          ? `Rejected by ${adminUserId}: ${note.trim()}`.slice(0, 500)
          : `Rejected by ${adminUserId}`,
      })
      .where(
        and(
          eq(withdrawRequests.id, withdrawId),
          eq(withdrawRequests.status, 'pending'),
        ),
      )
      .returning({ id: withdrawRequests.id });

    if (!updated[0]) {
      throw new Error('not_pending');
    }

    const [wallet] = await tx
      .update(wallets)
      .set({
        availableIdr: sql`${wallets.availableIdr} + ${req.amountIdr}`,
        pendingIdr: sql`${wallets.pendingIdr} - ${req.amountIdr}`,
      })
      .where(
        and(
          eq(wallets.storeId, req.storeId),
          sql`${wallets.pendingIdr} >= ${req.amountIdr}`,
        ),
      )
      .returning({ availableIdr: wallets.availableIdr });

    if (!wallet) {
      throw new Error('wallet_inconsistent');
    }

    await tx.insert(ledgerEntries).values({
      storeId: req.storeId,
      type: 'withdraw_release',
      amountIdr: req.amountIdr,
      balanceAfterIdr: wallet.availableIdr,
      refType: 'withdraw',
      refId: req.id,
      note: `Withdraw ${req.id} rejected — hold released`,
    });
  });
}
