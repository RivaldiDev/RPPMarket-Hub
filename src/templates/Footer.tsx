import { useTranslations } from 'next-intl';
import { CenteredFooter } from '@/features/landing/CenteredFooter';
import { Section } from '@/features/landing/Section';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';
import { Logo } from './Logo';

export const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <Section className="pt-8 pb-12">
      <CenteredFooter
        logo={<Logo />}
        name={AppConfig.name}
        iconList={null}
        legalLinks={(
          <>
            <li>
              <Link href="/terms">{t('terms_of_service')}</Link>
            </li>
            <li>
              <Link href="/privacy">{t('privacy_policy')}</Link>
            </li>
            <li>
              <a href={`mailto:${AppConfig.email.support}`}>{t('contact')}</a>
            </li>
          </>
        )}
      >
        <li>
          <a href="#features">{t('product')}</a>
        </li>
        <li>
          <a href="#pricing">{t('pricing')}</a>
        </li>
        <li>
          <a href="#faq">{t('faq')}</a>
        </li>
        <li>
          <Link href="/sign-up">{t('start')}</Link>
        </li>
      </CenteredFooter>
    </Section>
  );
};
