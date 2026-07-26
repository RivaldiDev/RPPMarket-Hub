import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { createCheckoutAndRedirect } from '@/features/orders/actions';
import { getActiveProductByStoreAndSlug } from '@/features/products/queries';
import { getStoreBySlug } from '@/features/stores/queries';
import { isValidStoreSlug } from '@/libs/hub/constants';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

type ProductPageProps = {
  params: Promise<{ locale: string; storeSlug: string; productSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

/** Buyer-fixable error codes with dedicated messages; the rest map to generic. */
const KNOWN_CHECKOUT_ERRORS = new Set([
  'buyer_email_invalid',
  'quantity_max',
  'invalid_amount',
  'inquiry_failed',
]);

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { locale, storeSlug, productSlug } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Storefront' });
  if (!isValidStoreSlug(storeSlug)) {
    return { title: t('not_found_title') };
  }
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    return { title: t('not_found_title') };
  }
  const product = await getActiveProductByStoreAndSlug(store.id, productSlug);
  if (!product) {
    return { title: t('not_found_title') };
  }
  return {
    title: `${product.title} | ${store.name} | RPP Market`,
    description: product.description || t('meta_description', { store: store.name }),
  };
}

export default async function ProductCheckoutPage(props: ProductPageProps) {
  const { locale, storeSlug, productSlug } = await props.params;
  const { error } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Storefront' });

  if (!isValidStoreSlug(storeSlug)) {
    notFound();
  }
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }
  const product = await getActiveProductByStoreAndSlug(store.id, productSlug);
  if (!product) {
    notFound();
  }

  const checkoutAction = createCheckoutAndRedirect.bind(
    null,
    store.slug,
    product.slug,
  );

  return (
    <div className="rpp-shell min-h-screen">
      <main className="
        mx-auto grid max-w-5xl gap-8 px-4 py-10
        sm:px-6
        lg:grid-cols-2
      "
      >
        <section className="rpp-card p-6">
          <Link
            href={`/${store.slug}`}
            className="
              text-sm text-primary
              hover:underline
            "
          >
            ←
            {' '}
            {store.name}
          </Link>
          {product.imageUrl && (
            // eslint-disable-next-line next/no-img-element -- seller-hosted remote image, domains unknown ahead of time
            <img
              src={product.imageUrl}
              alt={product.title}
              className="
                mt-4 aspect-4/3 w-full rounded-xl border border-border
                object-cover
              "
            />
          )}
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{product.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {product.description || t('no_description')}
          </p>
          <p className="mt-6 text-3xl font-bold tabular-nums">
            Rp
            {' '}
            {product.priceIdr.toLocaleString('id-ID')}
          </p>
        </section>

        <section className="rpp-card p-6">
          <h2 className="text-lg font-semibold">{t('checkout_title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('checkout_hint')}</p>

          {error && (
            <div className="
              mt-4 rounded-lg border border-destructive/30 bg-destructive/10
              px-3 py-2 text-sm text-destructive
            "
            >
              {t(
                (KNOWN_CHECKOUT_ERRORS.has(error)
                  ? `error_${error}`
                  : 'error_generic') as never,
              )}
            </div>
          )}

          <form action={checkoutAction} className="mt-6 space-y-3">
            <div>
              <label className="text-sm font-medium" htmlFor="buyerName">
                {t('buyer_name')}
              </label>
              <input
                id="buyerName"
                name="buyerName"
                required
                className="
                  mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm
                "
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="buyerEmail">
                {t('buyer_email')}
              </label>
              <input
                id="buyerEmail"
                name="buyerEmail"
                type="email"
                required
                className="
                  mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm
                "
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="buyerPhone">
                {t('buyer_phone')}
              </label>
              <input
                id="buyerPhone"
                name="buyerPhone"
                className="
                  mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm
                "
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="quantity">
                {t('quantity')}
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={99}
                defaultValue={1}
                className="
                  mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm
                "
              />
            </div>
            <button
              type="submit"
              className={cn(buttonVariants({ size: 'lg' }), 'rpp-press w-full')}
            >
              {t('pay_now')}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
