import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { listActiveProductsByStoreId } from '@/features/products/queries';
import { getStoreBySlug } from '@/features/stores/queries';
import { isValidStoreSlug } from '@/libs/hub/constants';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

type StorefrontPageProps = {
  params: Promise<{ locale: string; storeSlug: string }>;
};

export async function generateMetadata(
  props: StorefrontPageProps,
): Promise<Metadata> {
  const { locale, storeSlug } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Storefront' });
  const store = isValidStoreSlug(storeSlug)
    ? await getStoreBySlug(storeSlug)
    : null;

  if (!store) {
    return { title: t('not_found_title') };
  }

  return {
    title: t('meta_title', { store: store.name }),
    description: store.description || t('meta_description', { store: store.name }),
  };
}

export default async function StorefrontPage(props: StorefrontPageProps) {
  const { locale, storeSlug } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Storefront' });

  if (!isValidStoreSlug(storeSlug)) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  const items = await listActiveProductsByStoreId(store.id);

  return (
    <div className="rpp-shell min-h-screen">

      <header className="border-b border-border/70 bg-card/70 backdrop-blur-md">
        <div className="
          mx-auto flex max-w-5xl items-center justify-between p-4
          sm:px-6
        "
        >
          <div className="flex items-start gap-3">
            {store.logoUrl && (
              // eslint-disable-next-line next/no-img-element -- seller-hosted remote logo, domains unknown ahead of time
              <img
                src={store.logoUrl}
                alt=""
                className="
                  size-12 shrink-0 rounded-xl border border-border object-cover
                "
              />
            )}
            <div>
              <p className="
                text-xs font-medium tracking-wide text-primary uppercase
              "
              >
                {t('powered_by')}
              </p>
              <h1 className="text-lg font-semibold tracking-tight">{store.name}</h1>
              {store.description && (
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  {store.description}
                </p>
              )}
            </div>
          </div>
          <span className="
            rounded-full bg-primary/10 px-3 py-1 text-xs font-medium
            text-primary
          "
          >
            {`/${store.slug}`}
          </span>
        </div>
      </header>

      <main className="
        mx-auto max-w-5xl px-4 py-10
        sm:px-6
      "
      >
        {items.length === 0
          ? (
              <div className="
                rpp-card p-8 text-center text-sm text-muted-foreground
              "
              >
                {t('empty_products')}
              </div>
            )
          : (
              <div className="
                grid gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
              >
                {items.map(product => (
                  <article
                    key={product.id}
                    className="rpp-card flex flex-col p-5"
                  >
                    {product.imageUrl
                      ? (
                          // eslint-disable-next-line next/no-img-element -- seller-hosted remote image, domains unknown ahead of time
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            loading="lazy"
                            className="
                              mb-3 aspect-4/3 w-full rounded-xl border
                              border-border object-cover
                            "
                          />
                        )
                      : (
                          <div className="mb-3 aspect-4/3 rounded-xl bg-muted" />
                        )}
                    <h2 className="font-semibold tracking-tight">{product.title}</h2>
                    <p className="
                      mt-1 line-clamp-2 text-sm text-muted-foreground
                    "
                    >
                      {product.description || t('no_description')}
                    </p>
                    <div className="
                      mt-auto flex items-center justify-between pt-4
                    "
                    >
                      <span className="font-semibold tabular-nums">
                        Rp
                        {' '}
                        {product.priceIdr.toLocaleString('id-ID')}
                      </span>
                      <Link
                        href={`/${store.slug}/p/${product.slug}`}
                        className={cn(buttonVariants({ size: 'sm' }), `
                          rpp-press
                        `)}
                      >
                        {t('buy')}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
      </main>
    </div>
  );
}
