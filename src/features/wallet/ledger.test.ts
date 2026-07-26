import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/DB', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const client = new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './migrations' });
  return { db };
});

vi.mock('@/libs/Env', () => ({
  Env: {
    PLATFORM_WITHDRAW_FEE_BPS: 500,
    PLATFORM_MIN_WITHDRAW_IDR: 50_000,
  },
}));

const { db } = await import('@/libs/DB');
const {
  ledgerEntries,
  orders,
  products,
  stores,
  wallets,
} = await import('@/models/Schema');
const {
  markOrderPaidAndCredit,
  markWithdrawPaid,
  rejectWithdraw,
  requestWithdraw,
} = await import('./ledger');

/** Ledger invariant: available = Σ(order_credit, withdraw_hold, withdraw_release, adjust, refund). */
const AVAILABLE_TYPES = new Set([
  'order_credit',
  'withdraw_hold',
  'withdraw_release',
  'adjust',
  'refund',
]);

async function seedStoreWithOrder(totalIdr: number, slugSeed: string) {
  const [store] = await db
    .insert(stores)
    .values({
      ownerUserId: `user_${slugSeed}`,
      slug: `store-${slugSeed}`,
      name: 'Test Store',
      status: 'active',
    })
    .returning();
  const [product] = await db
    .insert(products)
    .values({
      storeId: store!.id,
      slug: `product-${slugSeed}`,
      title: 'Test Product',
      priceIdr: totalIdr,
      status: 'active',
    })
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      storeId: store!.id,
      productId: product!.id,
      buyerEmail: 'buyer@example.com',
      quantity: 1,
      unitPriceIdr: totalIdr,
      totalIdr,
      status: 'pending_payment',
      merchantOrderId: `RPP_${slugSeed}`,
    })
    .returning();
  return { store: store!, order: order! };
}

async function getWallet(storeId: string) {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.storeId, storeId))
    .limit(1);
  return wallet!;
}

async function assertLedgerInvariant(storeId: string) {
  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.storeId, storeId));
  const sum = entries
    .filter(entry => AVAILABLE_TYPES.has(entry.type))
    .reduce((acc, entry) => acc + entry.amountIdr, 0);
  const wallet = await getWallet(storeId);

  expect(sum).toBe(wallet.availableIdr);
}

let seed = 0;

beforeEach(() => {
  seed += 1;
});

describe('money path (PGlite integration)', () => {
  it('credits a paid order exactly once (idempotent)', async () => {
    const { store, order } = await seedStoreWithOrder(100_000, `a${seed}`);

    const first = await markOrderPaidAndCredit({
      orderId: order.id,
      amountIdr: 100_000,
    });

    expect(first).toEqual({ alreadyPaid: false, credited: true });

    const second = await markOrderPaidAndCredit({
      orderId: order.id,
      amountIdr: 100_000,
    });

    expect(second.credited).toBe(false);

    const wallet = await getWallet(store.id);

    expect(wallet.availableIdr).toBe(100_000);
    expect(wallet.lifetimeEarnedIdr).toBe(100_000);

    await assertLedgerInvariant(store.id);
  });

  it('rejects amount mismatch', async () => {
    const { order } = await seedStoreWithOrder(100_000, `b${seed}`);

    await expect(
      markOrderPaidAndCredit({ orderId: order.id, amountIdr: 50_000 }),
    ).rejects.toThrow('amount_mismatch');
  });

  it('credits a late payment on a failed order', async () => {
    const { store, order } = await seedStoreWithOrder(75_000, `c${seed}`);
    await db
      .update(orders)
      .set({ status: 'failed' })
      .where(eq(orders.id, order.id));

    const result = await markOrderPaidAndCredit({
      orderId: order.id,
      amountIdr: 75_000,
    });

    expect(result.credited).toBe(true);

    const wallet = await getWallet(store.id);

    expect(wallet.availableIdr).toBe(75_000);
  });

  it('holds gross on withdraw and enforces balance', async () => {
    const { store, order } = await seedStoreWithOrder(200_000, `d${seed}`);
    await markOrderPaidAndCredit({ orderId: order.id, amountIdr: 200_000 });

    const result = await requestWithdraw({
      storeId: store.id,
      amountIdr: 100_000,
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountName: 'Seller',
    });

    expect(result.feeIdr).toBe(5_000);
    expect(result.netIdr).toBe(95_000);
    expect(result.availableIdr).toBe(100_000);
    expect(result.pendingIdr).toBe(100_000);

    await assertLedgerInvariant(store.id);

    await expect(
      requestWithdraw({
        storeId: store.id,
        amountIdr: 150_000,
        bankName: 'BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'Seller',
      }),
    ).rejects.toThrow('insufficient_balance');
  });

  it('mark paid consumes pending and records net in lifetime withdrawn', async () => {
    const { store, order } = await seedStoreWithOrder(200_000, `e${seed}`);
    await markOrderPaidAndCredit({ orderId: order.id, amountIdr: 200_000 });
    const withdraw = await requestWithdraw({
      storeId: store.id,
      amountIdr: 100_000,
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountName: 'Seller',
    });

    await markWithdrawPaid(withdraw.withdrawRequestId, 'admin_1');

    const wallet = await getWallet(store.id);

    expect(wallet.pendingIdr).toBe(0);
    expect(wallet.availableIdr).toBe(100_000);
    expect(wallet.lifetimeWithdrawnIdr).toBe(95_000);

    await assertLedgerInvariant(store.id);

    // Second mark-paid must fail: no longer pending.
    await expect(
      markWithdrawPaid(withdraw.withdrawRequestId, 'admin_1'),
    ).rejects.toThrow('not_pending');
  });

  it('reject releases the hold back to available', async () => {
    const { store, order } = await seedStoreWithOrder(200_000, `f${seed}`);
    await markOrderPaidAndCredit({ orderId: order.id, amountIdr: 200_000 });
    const withdraw = await requestWithdraw({
      storeId: store.id,
      amountIdr: 100_000,
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountName: 'Seller',
    });

    await rejectWithdraw(withdraw.withdrawRequestId, 'admin_1', 'bad account');

    const wallet = await getWallet(store.id);

    expect(wallet.availableIdr).toBe(200_000);
    expect(wallet.pendingIdr).toBe(0);
    expect(wallet.lifetimeWithdrawnIdr).toBe(0);

    await assertLedgerInvariant(store.id);
  });

  it('supports balances beyond int4 range (bigint columns)', async () => {
    const bigTotal = 900_000_000;
    const { store } = await seedStoreWithOrder(bigTotal, `g${seed}`);

    // Three big orders → lifetime beyond 2^31.
    for (let i = 0; i < 3; i += 1) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.storeId, store.id))
        .limit(1);
      const [order] = await db
        .insert(orders)
        .values({
          storeId: store.id,
          productId: product!.id,
          buyerEmail: 'buyer@example.com',
          quantity: 1,
          unitPriceIdr: bigTotal,
          totalIdr: bigTotal,
          status: 'pending_payment',
          merchantOrderId: `RPP_big_${seed}_${i}`,
        })
        .returning();
      await markOrderPaidAndCredit({ orderId: order!.id, amountIdr: bigTotal });
    }

    const wallet = await getWallet(store.id);

    expect(wallet.availableIdr).toBe(2_700_000_000);
    expect(wallet.lifetimeEarnedIdr).toBe(2_700_000_000);

    await assertLedgerInvariant(store.id);
  });
});
