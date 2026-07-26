import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import {
  archiveProductAction,
  createProductAction,
  updateProductAction,
} from '@/features/products/actions';
import { listProductsByStoreId } from '@/features/products/queries';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { requireUserId } from '@/libs/hub/auth';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export default async function ProductsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { locale } = await props.params;
  const { error, ok } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SellerProductsPage' });
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);
  const items = store ? await listProductsByStoreId(store.id) : [];

  if (!store) {
    return (
      <>
        <TitleBar title={t('title_bar')} description={t('title_bar_description')} />
        <div className="rpp-card p-6">
          <p className="text-sm text-muted-foreground">{t('need_store')}</p>
          <Link
            href="/dashboard/store"
            className={cn(buttonVariants(), 'rpp-press mt-4 inline-flex')}
          >
            {t('go_store')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar title={t('title_bar')} description={t('title_bar_description')} />

      {error && (
        <div className="
          mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3
          py-2 text-sm text-destructive
        "
        >
          {error}
        </div>
      )}
      {ok && (
        <div className="
          mb-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2
          text-sm text-primary
        "
        >
          {t('saved')}
        </div>
      )}

      <form
        action={createProductAction}
        className="
          rpp-card mb-6 grid gap-3 p-6
          md:grid-cols-2
        "
      >
        <h2 className="
          text-lg font-semibold
          md:col-span-2
        "
        >
          {t('create_title')}
        </h2>
        <input
          name="title"
          required
          placeholder={t('field_title')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="slug"
          required
          placeholder={t('field_slug')}
          className="
            rounded-lg border border-border px-3 py-2 font-mono text-sm
          "
        />
        <input
          name="priceIdr"
          required
          type="number"
          min={1000}
          step={1}
          placeholder={t('field_price')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue="active"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
        <input
          name="imageUrl"
          type="url"
          placeholder={t('field_image')}
          className="
            rounded-lg border border-border px-3 py-2 text-sm
            md:col-span-2
          "
        />
        <textarea
          name="description"
          rows={3}
          placeholder={t('field_description')}
          className="
            rounded-lg border border-border px-3 py-2 text-sm
            md:col-span-2
          "
        />
        <button type="submit" className={cn(buttonVariants(), 'rpp-press w-fit')}>
          {t('create')}
        </button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rpp-card p-6 text-sm text-muted-foreground">{t('empty')}</div>
        )}

        {items.map(item => (
          <div
            key={item.id}
            className="rpp-card space-y-4 p-5"
          >
            <div className="
              flex flex-col gap-3
              sm:flex-row sm:items-center sm:justify-between
            "
            >
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-muted-foreground">
                  /
                  {store.slug}
                  /p/
                  {item.slug}
                  {' · '}
                  Rp
                  {' '}
                  {item.priceIdr.toLocaleString('id-ID')}
                  {' · '}
                  {item.status}
                </div>
              </div>
              <div className="flex gap-2">
                {item.status === 'active' && (
                  <a
                    href={`/${store.slug}/p/${item.slug}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), `
                      rpp-press
                    `)}
                  >
                    {t('view')}
                  </a>
                )}
                <form action={archiveProductAction}>
                  <input type="hidden" name="productId" value={item.id} />
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), `
                      rpp-press
                    `)}
                  >
                    {t('archive')}
                  </button>
                </form>
              </div>
            </div>

            <form
              action={updateProductAction}
              className="
                grid gap-2 border-t border-border/70 pt-4
                md:grid-cols-2
              "
            >
              <input type="hidden" name="productId" value={item.id} />
              <input
                name="title"
                required
                defaultValue={item.title}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="slug"
                required
                defaultValue={item.slug}
                className="
                  rounded-lg border border-border px-3 py-2 font-mono text-sm
                "
              />
              <input
                name="priceIdr"
                required
                type="number"
                min={1000}
                defaultValue={item.priceIdr}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select
                name="status"
                defaultValue={item.status}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
              <input
                name="imageUrl"
                type="url"
                defaultValue={item.imageUrl ?? ''}
                className="
                  rounded-lg border border-border px-3 py-2 text-sm
                  md:col-span-2
                "
              />
              <textarea
                name="description"
                rows={2}
                defaultValue={item.description ?? ''}
                className="
                  rounded-lg border border-border px-3 py-2 text-sm
                  md:col-span-2
                "
              />
              <button
                type="submit"
                className={cn(buttonVariants({ size: 'sm' }), `rpp-press w-fit`)}
              >
                {t('save')}
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
