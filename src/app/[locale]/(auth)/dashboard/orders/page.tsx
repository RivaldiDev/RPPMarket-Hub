import { desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import { db } from '@/libs/DB';
import { requireUserId } from '@/libs/hub/auth';
import { Link } from '@/libs/I18nNavigation';
import { orders } from '@/models/Schema';
import { cn } from '@/utils/Helpers';

export default async function OrdersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SellerOrdersPage' });
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);

  if (!store) {
    return (
      <>
        <TitleBar title={t('title_bar')} description={t('title_bar_description')} />
        <div className="rpp-card p-6 text-sm text-muted-foreground">
          {t('need_store')}
          <div className="mt-4">
            <Link
              href="/dashboard/store"
              className={cn(buttonVariants(), `rpp-press`)}
            >
              {t('go_store')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.storeId, store.id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <>
      <TitleBar title={t('title_bar')} description={t('title_bar_description')} />
      <div className="rpp-card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">{t('col_order')}</th>
              <th className="px-4 py-3 font-medium">{t('col_buyer')}</th>
              <th className="px-4 py-3 font-medium">{t('col_amount')}</th>
              <th className="px-4 py-3 font-medium">{t('col_status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {t('empty')}
                </td>
              </tr>
            )}
            {rows.map(order => (
              <tr key={order.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-mono text-xs">{order.merchantOrderId}</td>
                <td className="px-4 py-3">
                  <div>{order.buyerName || '—'}</div>
                  <div className="text-xs text-muted-foreground">{order.buyerEmail}</div>
                </td>
                <td className="px-4 py-3 tabular-nums">
                  Rp
                  {' '}
                  {order.totalIdr.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 uppercase">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
