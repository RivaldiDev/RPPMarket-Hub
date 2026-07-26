import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/libs/I18nNavigation';

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

const SECTION_KEYS = [
  'service',
  'seller',
  'buyer',
  'fees',
  'payments',
  'liability',
  'changes',
] as const;

export async function generateMetadata(props: TermsPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TermsPage' });
  return { title: t('meta_title'), description: t('meta_description') };
}

export default async function TermsPage(props: TermsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TermsPage' });

  return (
    <div className="rpp-shell min-h-screen">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link
          href="/"
          className="
            text-sm text-primary
            hover:underline
          "
        >
          ←
          {' '}
          {t('back_home')}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('updated')}</p>

        <div className="mt-10 space-y-8">
          {SECTION_KEYS.map((key, index) => (
            <section key={key}>
              <h2 className="text-lg font-semibold">
                {index + 1}
                {'. '}
                {t(`${key}_title`)}
              </h2>
              <p className="mt-2 text-sm/relaxed text-muted-foreground">
                {t(`${key}_body`)}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
