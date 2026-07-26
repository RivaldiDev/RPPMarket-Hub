import { useTranslations } from 'next-intl';
import { Section } from '@/features/landing/Section';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');

  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <Section
      id="how-it-works"
      className="bg-muted/40"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="
        grid gap-4
        md:grid-cols-2
        xl:grid-cols-4
      "
      >
        {steps.map((step, index) => (
          <article key={step} className="rpp-card relative p-6">
            <div className="mb-4 flex items-center justify-between">
              <span
                className="
                  flex size-10 items-center justify-center rounded-full
                  bg-primary/10 text-sm font-bold text-primary
                "
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {index < steps.length - 1 && (
                <span
                  className="
                    hidden h-px flex-1 bg-border
                    xl:ml-3 xl:block
                  "
                  aria-hidden="true"
                />
              )}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              {t(`${step}_title`)}
            </h3>
            <p className="mt-2 text-sm/relaxed text-muted-foreground">
              {t(`${step}_description`)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
};
