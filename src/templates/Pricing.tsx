import { CheckIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/Reveal';
import { RevealGroup } from '@/components/motion/RevealGroup';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export const Pricing = () => {
  const t = useTranslations('Pricing');

  const features = [
    t('feature_store'),
    t('feature_products'),
    t('feature_checkout'),
    t('feature_duitku'),
    t('feature_wallet'),
    t('feature_fee'),
  ];

  return (
    <Section
      id="pricing"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <RevealGroup className="
        mx-auto grid max-w-4xl gap-5
        md:grid-cols-[1.1fr_0.9fr]
      "
      >
        <Reveal as="article" className="rpp-card relative overflow-hidden p-8">
          <div
            className="
              pointer-events-none absolute -top-16 -right-16 size-40
              rounded-full bg-primary/15 blur-2xl
            "
            aria-hidden="true"
          />
          <div className="
            text-sm font-semibold tracking-wide text-primary uppercase
          "
          >
            {t('model_badge')}
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">
            {t('model_title')}
          </h3>
          <p className="mt-2 text-muted-foreground">{t('model_description')}</p>

          <div className="mt-8 flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight">5%</span>
            <span className="mb-2 text-sm text-muted-foreground">
              {t('fee_caption')}
            </span>
          </div>

          <ul className="mt-8 space-y-3">
            {features.map(feature => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <span className="
                  mt-0.5 rounded-full bg-primary/10 p-1 text-primary
                "
                >
                  <CheckIcon className="size-3.5" />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: 'lg' }), `
              rpp-press mt-8 w-full
              sm:w-auto
            `)}
          >
            {t('button_text')}
          </Link>
        </Reveal>

        <Reveal
          as="div"
          className="rpp-card flex flex-col justify-between bg-muted/50 p-8"
        >
          <div>
            <h3 className="text-lg font-semibold">{t('note_title')}</h3>
            <p className="mt-2 text-sm/relaxed text-muted-foreground">
              {t('note_body')}
            </p>
          </div>

          <div className="
            mt-8 rounded-xl border border-border bg-card p-4 text-sm
          "
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t('example_gross')}</span>
              <span className="font-medium tabular-nums">Rp 100.000</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t('example_fee')}</span>
              <span className="font-medium text-primary tabular-nums">− Rp 5.000</span>
            </div>
            <div className="
              mt-3 flex items-center justify-between gap-3 border-t
              border-border pt-3
            "
            >
              <span className="font-medium">{t('example_net')}</span>
              <span className="text-lg font-bold tabular-nums">Rp 95.000</span>
            </div>
          </div>
        </Reveal>
      </RevealGroup>
    </Section>
  );
};
