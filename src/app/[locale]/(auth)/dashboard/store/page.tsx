import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { upsertStoreAction } from '@/features/stores/actions';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { requireUserId } from '@/libs/hub/auth';
import { cn } from '@/utils/Helpers';

export default async function StoreSettingsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { locale } = await props.params;
  const { error, ok } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SellerStorePage' });
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);

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
        action={upsertStoreAction}
        className="rpp-card mx-auto max-w-2xl space-y-4 p-6"
      >
        <div>
          <label className="text-sm font-medium" htmlFor="name">{t('field_name')}</label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={store?.name ?? ''}
            className="
              mt-1 w-full rounded-lg border border-border bg-background px-3
              py-2 text-sm
            "
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="slug">{t('field_slug')}</label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/</span>
            <input
              id="slug"
              name="slug"
              required
              defaultValue={store?.slug ?? ''}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="
                w-full rounded-lg border border-border bg-background px-3 py-2
                font-mono text-sm
              "
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t('field_slug_help')}</p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="description">{t('field_description')}</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={store?.description ?? ''}
            className="
              mt-1 w-full rounded-lg border border-border bg-background px-3
              py-2 text-sm
            "
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="status">{t('field_status')}</label>
          <select
            id="status"
            name="status"
            defaultValue={store?.status ?? 'draft'}
            className="
              mt-1 w-full rounded-lg border border-border bg-background px-3
              py-2 text-sm
            "
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="logoUrl">{t('field_logo')}</label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={store?.logoUrl ?? ''}
            className="
              mt-1 w-full rounded-lg border border-border bg-background px-3
              py-2 text-sm
            "
          />
        </div>

        <button type="submit" className={cn(buttonVariants(), 'rpp-press')}>
          {store ? t('save') : t('create')}
        </button>

        {store && (
          <p className="text-sm text-muted-foreground">
            {store.status === 'active' ? t('public_link') : t('not_public_until_active')}
            {' '}
            <a className="font-mono text-primary underline" href={`/${store.slug}`}>
              /
              {store.slug}
            </a>
          </p>
        )}
      </form>
    </>
  );
}
