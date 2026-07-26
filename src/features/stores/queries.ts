import { and, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { stores } from '@/models/Schema';

export async function getStoreByOwnerUserId(ownerUserId: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerUserId, ownerUserId))
    .limit(1);

  return store ?? null;
}

/** Public storefront lookup — only active stores. */
export async function getStoreBySlug(slug: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.slug, slug), eq(stores.status, 'active')))
    .limit(1);

  return store ?? null;
}

/** Dashboard / admin lookup — any status. */
export async function getStoreBySlugAny(slug: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  return store ?? null;
}
