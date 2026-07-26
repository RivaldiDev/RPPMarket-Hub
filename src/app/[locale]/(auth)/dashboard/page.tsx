import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export default async function DashboardIndexPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'DashboardIndexPage',
  });

  const cards = [
    {
      href: '/dashboard/store',
      title: t('card_store_title'),
      description: t('card_store_description'),
    },
    {
      href: '/dashboard/products',
      title: t('card_products_title'),
      description: t('card_products_description'),
    },
    {
      href: '/dashboard/orders',
      title: t('card_orders_title'),
      description: t('card_orders_description'),
    },
    {
      href: '/dashboard/wallet',
      title: t('card_wallet_title'),
      description: t('card_wallet_description'),
    },
  ] as const;

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="
        mb-8 rounded-2xl border border-primary/15 bg-primary/5 p-6
      "
      >
        <h2 className="text-lg font-semibold tracking-tight">
          {t('message_state_title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t('message_state_description')}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t('message_state_alternative')}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">
          {t('max_message')}
        </p>
        <Link
          href="/dashboard/store"
          className={cn(buttonVariants(), 'rpp-press mt-5')}
        >
          {t('cta_store')}
        </Link>
      </div>

      <div className="
        grid gap-4
        sm:grid-cols-2
      "
      >
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="
              rpp-card rpp-press block p-5 transition-colors
              hover:border-primary/30
            "
          >
            <h3 className="font-semibold tracking-tight">{card.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
