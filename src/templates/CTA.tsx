import { ArrowRightIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CTABanner } from '@/features/landing/CTABanner';
import { Section } from '@/features/landing/Section';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export const CTA = () => {
  const t = useTranslations('CTA');

  return (
    <Section className="pt-8">
      <CTABanner
        title={t('title')}
        description={t('description')}
        buttons={(
          <Link
            className={cn(
              buttonVariants({
                variant: 'secondary',
                size: 'lg',
              }),
              `
                rpp-press bg-white text-foreground
                hover:bg-white/90
              `,
            )}
            href="/sign-up"
          >
            {t('button_text')}
            <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        )}
      />
    </Section>
  );
};
