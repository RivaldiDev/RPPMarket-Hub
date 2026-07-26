'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getStoreByOwnerUserId,
  getStoreBySlugAny,
} from '@/features/stores/queries';
import { storeFormSchema } from '@/features/stores/validators';
import { db } from '@/libs/DB';
import { requireUserId } from '@/libs/hub/auth';
import { revalidateLocalizedPath } from '@/libs/hub/revalidate';
import { stores, wallets } from '@/models/Schema';

/** True for Postgres unique-constraint violations (concurrent slug race). */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
  );
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

/**
 * Create or update the signed-in user's single store (MVP: one store per user).
 * On create also inserts a wallet row (availableIdr=0).
 */
export async function upsertStoreAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = storeFormSchema.safeParse({
    name: formString(formData, 'name'),
    slug: formString(formData, 'slug'),
    description: formString(formData, 'description'),
    status: formString(formData, 'status') || 'draft',
    logoUrl: formString(formData, 'logoUrl'),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/store?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || 'invalid_input',
      )}`,
    );
  }

  const data = parsed.data;
  const existingOwned = await getStoreByOwnerUserId(userId);
  const slugOwner = await getStoreBySlugAny(data.slug);

  if (slugOwner && slugOwner.ownerUserId !== userId) {
    redirect('/dashboard/store?error=slug_taken');
  }

  try {
    if (existingOwned) {
      await db
        .update(stores)
        .set({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          status: data.status,
          logoUrl: data.logoUrl || null,
        })
        .where(eq(stores.id, existingOwned.id));
    } else {
      const [created] = await db
        .insert(stores)
        .values({
          ownerUserId: userId,
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          status: data.status,
          logoUrl: data.logoUrl || null,
        })
        .returning();

      if (!created) {
        redirect('/dashboard/store?error=create_failed');
      }

      await db.insert(wallets).values({
        storeId: created.id,
        availableIdr: 0,
        pendingIdr: 0,
        lifetimeEarnedIdr: 0,
        lifetimeWithdrawnIdr: 0,
      }).onConflictDoNothing();
    }
  } catch (error) {
    // Concurrent submit lost the check-then-write race on a unique index.
    if (isUniqueViolation(error)) {
      redirect('/dashboard/store?error=slug_taken');
    }
    throw error;
  }

  revalidatePath('/dashboard/store');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard');
  revalidateLocalizedPath(`/${data.slug}`);
  if (existingOwned && existingOwned.slug !== data.slug) {
    revalidateLocalizedPath(`/${existingOwned.slug}`);
  }

  redirect('/dashboard/store?ok=1');
}
