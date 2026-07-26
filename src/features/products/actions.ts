'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getProductById,
  getProductByStoreAndSlug,
} from '@/features/products/queries';
import { productFormSchema } from '@/features/products/validators';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { db } from '@/libs/DB';
import { requireUserId } from '@/libs/hub/auth';
import { products } from '@/models/Schema';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function requireOwnedStore() {
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);
  if (!store) {
    redirect('/dashboard/products?error=store_required');
  }
  return store;
}

function revalidateProductPaths(storeSlug: string, productSlug?: string) {
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/store');
  revalidatePath(`/${storeSlug}`);
  if (productSlug) {
    revalidatePath(`/${storeSlug}/p/${productSlug}`);
  }
}

export async function createProductAction(formData: FormData): Promise<void> {
  const store = await requireOwnedStore();
  const parsed = productFormSchema.safeParse({
    title: formString(formData, 'title'),
    slug: formString(formData, 'slug'),
    description: formString(formData, 'description'),
    priceIdr: formString(formData, 'priceIdr'),
    imageUrl: formString(formData, 'imageUrl'),
    status: formString(formData, 'status') || 'draft',
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/products?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || 'invalid_input',
      )}`,
    );
  }

  const data = parsed.data;
  const clash = await getProductByStoreAndSlug(store.id, data.slug);
  if (clash) {
    redirect('/dashboard/products?error=slug_taken');
  }

  await db.insert(products).values({
    storeId: store.id,
    title: data.title,
    slug: data.slug,
    description: data.description || null,
    priceIdr: data.priceIdr,
    imageUrl: data.imageUrl || null,
    status: data.status,
  });

  revalidateProductPaths(store.slug, data.slug);
  redirect('/dashboard/products?ok=1');
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const store = await requireOwnedStore();
  const productId
    = formString(formData, 'productId') || formString(formData, 'id');
  const existing = await getProductById(productId);
  if (!existing || existing.storeId !== store.id) {
    redirect('/dashboard/products?error=not_found');
  }

  const parsed = productFormSchema.safeParse({
    title: formString(formData, 'title'),
    slug: formString(formData, 'slug'),
    description: formString(formData, 'description'),
    priceIdr: formString(formData, 'priceIdr'),
    imageUrl: formString(formData, 'imageUrl'),
    status: formString(formData, 'status') || existing.status,
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/products?error=${encodeURIComponent(
        parsed.error.issues[0]?.message || 'invalid_input',
      )}`,
    );
  }

  const data = parsed.data;
  if (data.slug !== existing.slug) {
    const clash = await getProductByStoreAndSlug(store.id, data.slug);
    if (clash) {
      redirect('/dashboard/products?error=slug_taken');
    }
  }

  await db
    .update(products)
    .set({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      priceIdr: data.priceIdr,
      imageUrl: data.imageUrl || null,
      status: data.status,
    })
    .where(and(eq(products.id, existing.id), eq(products.storeId, store.id)));

  revalidateProductPaths(store.slug, data.slug);
  redirect('/dashboard/products?ok=1');
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  const store = await requireOwnedStore();
  const productId
    = formString(formData, 'productId') || formString(formData, 'id');
  const existing = await getProductById(productId);
  if (!existing || existing.storeId !== store.id) {
    redirect('/dashboard/products?error=not_found');
  }

  await db
    .update(products)
    .set({ status: 'archived' })
    .where(and(eq(products.id, existing.id), eq(products.storeId, store.id)));

  revalidateProductPaths(store.slug, existing.slug);
  redirect('/dashboard/products?ok=1');
}
