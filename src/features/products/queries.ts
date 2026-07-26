import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { products } from '@/models/Schema';

export async function listProductsByStoreId(storeId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt));
}

/** Public catalog: active products for a store. */
export async function listActiveProductsByStoreId(storeId: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.storeId, storeId), eq(products.status, 'active')))
    .orderBy(desc(products.createdAt));
}

export async function getProductById(productId: string) {
  if (!productId) {
    return null;
  }
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return product ?? null;
}

export async function getProductByStoreAndSlug(storeId: string, slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, storeId), eq(products.slug, slug)))
    .limit(1);

  return product ?? null;
}

/** Storefront checkout: active product only. */
export async function getActiveProductByStoreAndSlug(
  storeId: string,
  slug: string,
) {
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.slug, slug),
        eq(products.status, 'active'),
      ),
    )
    .limit(1);

  return product ?? null;
}
