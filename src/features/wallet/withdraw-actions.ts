'use server';

import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import {
  markWithdrawPaid,
  rejectWithdraw,
  requestWithdraw,
} from '@/features/wallet/ledger';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { isPlatformAdmin, requireUserId } from '@/libs/hub/auth';
import { withdrawRequests } from '@/models/Schema';

const withdrawSchema = z.object({
  amountIdr: z.coerce
    .number()
    .int()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER),
  bankName: z.string().trim().min(2).max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^\d+$/, 'bank_account_digits'),
  bankAccountName: z.string().trim().min(2).max(80),
});

const withdrawIdSchema = z.string().uuid();

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

async function requireAdminAndWithdrawId(formData: FormData): Promise<{
  userId: string;
  withdrawId: string;
}> {
  const userId = await requireUserId();
  if (!isPlatformAdmin(userId)) {
    redirect('/dashboard?error=forbidden');
  }

  const parsed = withdrawIdSchema.safeParse(formData.get('withdrawId'));
  if (!parsed.success) {
    redirect('/dashboard/admin/withdrawals?error=invalid_id');
  }

  return { userId, withdrawId: parsed.data };
}

/** Admin: mark withdraw as paid after manual bank transfer. */
export async function adminMarkWithdrawPaidAction(formData: FormData) {
  const { userId, withdrawId } = await requireAdminAndWithdrawId(formData);

  try {
    await markWithdrawPaid(withdrawId, userId);
  } catch {
    redirect('/dashboard/admin/withdrawals?error=update_failed');
  }

  revalidatePath('/dashboard/admin/withdrawals');
  revalidatePath('/dashboard/wallet');
  redirect('/dashboard/admin/withdrawals?ok=1');
}

/** Admin: reject a pending withdraw and release the hold back to available. */
export async function adminRejectWithdrawAction(formData: FormData) {
  const { userId, withdrawId } = await requireAdminAndWithdrawId(formData);
  const note = String(formData.get('note') || '');

  try {
    await rejectWithdraw(withdrawId, userId, note);
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
  if (store.status === 'suspended') {
    redirect('/dashboard/wallet?error=store_suspended');
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
    const message
      = error instanceof Error && /^[\w.-]+$/.test(error.message)
        ? error.message
        : 'withdraw_failed';
    redirect(`/dashboard/wallet?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/dashboard/wallet');
  redirect('/dashboard/wallet?ok=1');
}
