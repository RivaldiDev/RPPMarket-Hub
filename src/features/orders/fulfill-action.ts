'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { db } from '@/libs/DB';
import { requireUserId } from '@/libs/hub/auth';
import { orders } from '@/models/Schema';

const orderIdSchema = z.string().uuid();

/**
 * Seller: mark a paid order as manually fulfilled (delivery sent outside
 * the automatic delivery content, e.g. custom files or account handover).
 */
export async function markOrderFulfilledAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);
  if (!store) {
    redirect('/dashboard/orders?error=store_required');
  }

  const parsedId = orderIdSchema.safeParse(formData.get('orderId'));
  if (!parsedId.success) {
    redirect('/dashboard/orders?error=not_found');
  }

  const updated = await db
    .update(orders)
    .set({ status: 'fulfilled_manual' })
    .where(
      and(
        eq(orders.id, parsedId.data),
        eq(orders.storeId, store.id),
        eq(orders.status, 'paid'),
      ),
    )
    .returning({ id: orders.id });

  if (!updated[0]) {
    redirect('/dashboard/orders?error=not_paid');
  }

  revalidatePath('/dashboard/orders');
  redirect('/dashboard/orders?ok=1');
}
