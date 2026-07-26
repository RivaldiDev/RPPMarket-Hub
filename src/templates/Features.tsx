import { useTranslations } from 'next-intl';
import { RevealGroup } from '@/components/motion/RevealGroup';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

const icons = {
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  pay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 14h.01" />
      <path d="M2 9l2-4h16l2 4" />
    </svg>
  ),
  fee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 10a3 3 0 00-6 0c0 3 6 1.5 6 4.5a3 3 0 01-6 0" />
    </svg>
  ),
  i18n: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 010 18" />
      <path d="M12 3a15 15 0 000 18" />
    </svg>
  ),
} as const;

export const Features = () => {
  const t = useTranslations('Features');

  const items = [
    { key: 'feature1', icon: icons.store },
    { key: 'feature2', icon: icons.link },
    { key: 'feature3', icon: icons.pay },
    { key: 'feature4', icon: icons.wallet },
    { key: 'feature5', icon: icons.fee },
    { key: 'feature6', icon: icons.i18n },
  ] as const;

  return (
    <Section
      id="features"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <RevealGroup className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2
        lg:grid-cols-3 lg:gap-5
      "
      >
        {items.map(item => (
          <FeatureCard
            key={item.key}
            icon={item.icon}
            title={t(`${item.key}_title`)}
          >
            {t(`${item.key}_description`)}
          </FeatureCard>
        ))}
      </RevealGroup>
    </Section>
  );
};
