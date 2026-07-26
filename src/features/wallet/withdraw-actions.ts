'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { requestWithdraw } from '@/features/wallet/ledger';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { isPlatformAdmin, requireUserId } from '@/libs/hub/auth';
import { wallets, withdrawRequests } from '@/models/Schema';

const withdrawSchema = z.object({
  amountIdr: z.coerce.number().int().min(1),
  bankName: z.string().trim().min(2).max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^\d+$/, 'bank_account_digits'),
  bankAccountName: z.string().trim().min(2).max(80),
});

export async function getWithdrawLimits() {
  return {
    feeBps: Env.PLATFORM_WITHDRAW_FEE_BPS,
    minIdr: Env.PLATFORM_MIN_WITHDRAW_IDR,
  };
}

/** Admin: list pending withdraws for PLATFORM_ADMIN_USER_IDS. */
export async function listPendingWithdrawsAdmin() {
  const userId = await requireUserId();
  if (!isPlatformAdmin(userId)) {
    throw new Error('forbidden');
  }
  return db
    .select()
    .from(withdrawRequests)
    .where(eq(withdrawRequests.status, 'pending'))
    .orderBy(desc(withdrawRequests.createdAt))
    .limit(100);
}

/**
 * Admin: mark withdraw as paid after manual bank transfer.
 */
export async function adminMarkWithdrawPaidAction(formData: FormData) {
  const userId = await requireUserId();
  if (!isPlatformAdmin(userId)) {
    redirect('/dashboard?error=forbidden');
  }

  const withdrawId = String(formData.get('withdrawId') || '');
  if (!/^[0-9a-f-]{36}$/i.test(withdrawId)) {
    redirect('/dashboard/admin/withdrawals?error=invalid_id');
  }

  try {
    await db.transaction(async (tx) => {
      const [req] = await tx
        .select()
        .from(withdrawRequests)
        .where(eq(withdrawRequests.id, withdrawId))
        .limit(1);

      if (!req || req.status !== 'pending') {
        throw new Error('not_pending');
      }

      const updated = await tx
        .update(withdrawRequests)
        .set({
          status: 'paid',
          processedAt: new Date(),
          adminNote: `Marked paid by ${userId}`,
        })
        .where(
          and(
            eq(withdrawRequests.id, withdrawId),
            eq(withdrawRequests.status, 'pending'),
          ),
        )
        .returning();

      if (!updated[0]) {
        throw new Error('not_pending');
      }

      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.storeId, req.storeId))
        .limit(1);

      if (wallet) {
        await tx
          .update(wallets)
          .set({
            pendingIdr: Math.max(0, wallet.pendingIdr - req.amountIdr),
            lifetimeWithdrawnIdr: wallet.lifetimeWithdrawnIdr + req.amountIdr,
          })
          .where(eq(wallets.id, wallet.id));
      }
    });
  } catch {
    redirect('/dashboard/admin/withdrawals?error=update_failed');
  }

  revalidatePath('/dashboard/admin/withdrawals');
  revalidatePath('/dashboard/wallet');
  redirect('/dashboard/admin/withdrawals?ok=1');
}

export async function requestWithdrawAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);
  if (!store) {
    redirect('/dashboard/wallet?error=store_required');
  }

  const parsed = withdrawSchema.safeParse({
    amountIdr: formData.get('amountIdr'),
    bankName: formData.get('bankName'),
    bankAccountNumber: formData.get('bankAccountNumber'),
    bankAccountName: formData.get('bankAccountName'),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/wallet?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || 'invalid_input',
      )}`,
    );
  }

  if (parsed.data.amountIdr < Env.PLATFORM_MIN_WITHDRAW_IDR) {
    redirect('/dashboard/wallet?error=below_min_withdraw');
  }

  try {
    await requestWithdraw({
      storeId: store.id,
      ...parsed.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'withdraw_failed';
    redirect(`/dashboard/wallet?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/dashboard/wallet');
  redirect('/dashboard/wallet?ok=1');
}
