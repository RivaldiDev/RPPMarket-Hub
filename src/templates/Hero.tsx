import { ArrowRightIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

const StorePreview = () => {
  const t = useTranslations('HeroPreview');

  return (
    <div className="
      relative mx-auto max-w-md
      lg:max-w-none
    "
    >
      <div className="rpp-card overflow-hidden p-0 shadow-lg">
        <div className="
          flex items-center gap-2 border-b border-border/80 bg-muted/40 px-4
          py-3
        "
        >
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 truncate text-xs text-muted-foreground">
            rppmarket.com/toko-anda
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t('store_name')}</div>
              <div className="text-xs text-muted-foreground">{t('store_tagline')}</div>
            </div>
            <span className="
              rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium
              text-primary
            "
            >
              {t('badge')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="rounded-xl border border-border/80 bg-surface p-3"
              >
                <div className="mb-3 aspect-4/3 rounded-lg bg-muted" />
                <div className="h-2.5 w-4/5 rounded-full bg-muted-foreground/15" />
                <div className="mt-2 h-2 w-1/2 rounded-full bg-primary/25" />
              </div>
            ))}
          </div>

          <div className="
            rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm
          "
          >
            <div className="font-medium text-foreground">{t('checkout_title')}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {t('checkout_hint')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="
      relative pt-16 pb-10
      sm:pt-20 sm:pb-16
    "
    >
      <CenteredHero
        banner={(
          <span
            className="
              inline-flex items-center gap-2 rounded-full border
              border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium
              text-primary
            "
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {t('badge')}
          </span>
        )}
        title={t.rich('title', {
          important: chunks => (
            <span className="text-primary italic">{chunks}</span>
          ),
        })}
        description={t('description')}
        buttons={(
          <>
            <Link
              className={cn(buttonVariants({ size: 'lg' }), 'rpp-press')}
              href="/sign-up"
            >
              {t('primary_button')}
              <ArrowRightIcon className="ml-1 size-4" />
            </Link>

            <a
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'rpp-press',
              )}
              href="#how-it-works"
            >
              {t('secondary_button')}
            </a>
          </>
        )}
        preview={<StorePreview />}
      />

      <dl className="
        mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4
        sm:grid-cols-4
      "
      >
        {(['stat1', 'stat2', 'stat3', 'stat4'] as const).map(key => (
          <div
            key={key}
            className="
              rounded-xl border border-border/70 bg-card p-4 text-center
            "
          >
            <dt className="text-xs text-muted-foreground">{t(`${key}_label`)}</dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight">{t(`${key}_value`)}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
};
