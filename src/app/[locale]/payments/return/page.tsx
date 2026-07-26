import { eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { mockConfirmPaymentAction } from '@/features/orders/mock-confirm';
import { db } from '@/libs/DB';
import { isDuitkuConfigured } from '@/libs/duitku/client';
import { Link } from '@/libs/I18nNavigation';
import { orders } from '@/models/Schema';
import { cn, isMockPaymentsAllowed } from '@/utils/Helpers';

type ReturnPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ merchantOrderId?: string; mock?: string; error?: string }>;
};

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) {
    return '***';
  }
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

export default async function PaymentReturnPage(props: ReturnPageProps) {
  const { locale } = await props.params;
  const { merchantOrderId, mock, error } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PaymentsReturn' });

  let order = null as typeof orders.$inferSelect | null;
  if (merchantOrderId && /^RPP_[a-zA-Z0-9]+$/.test(merchantOrderId)) {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.merchantOrderId, merchantOrderId))
      .limit(1);
    order = rows[0] ?? null;
  }

  const canMockConfirm = Boolean(
    order
    && mock === '1'
    && !isDuitkuConfigured()
    && isMockPaymentsAllowed()
    && order.status === 'pending_payment',
  );

  return (
    <div className="rpp-shell min-h-screen">
      <div className="rpp-mesh" aria-hidden="true" />
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rpp-card p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

          {!merchantOrderId && (
            <p className="mt-6 text-sm text-destructive">{t('missing_order')}</p>
          )}

          {merchantOrderId && !order && (
            <p className="mt-6 text-sm text-muted-foreground">{t('order_not_found')}</p>
          )}

          {order && (
            <div className="mt-6 space-y-2 text-sm">
              <div className="
                flex justify-between gap-4 border-b border-border py-2
              "
              >
                <span className="text-muted-foreground">{t('order_id')}</span>
                <span className="font-mono text-xs">{order.merchantOrderId}</span>
              </div>
              <div className="
                flex justify-between gap-4 border-b border-border py-2
              "
              >
                <span className="text-muted-foreground">{t('amount')}</span>
                <span className="font-semibold tabular-nums">
                  Rp
                  {' '}
                  {order.totalIdr.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="
                flex justify-between gap-4 border-b border-border py-2
              "
              >
                <span className="text-muted-foreground">{t('status')}</span>
                <span className="font-medium uppercase">{order.status}</span>
              </div>
              {order.buyerEmail && (
                <div className="
                  flex justify-between gap-4 border-b border-border py-2
                "
                >
                  <span className="text-muted-foreground">{t('buyer')}</span>
                  <span>{maskEmail(order.buyerEmail)}</span>
                </div>
              )}
            </div>
          )}

          {canMockConfirm && merchantOrderId && (
            <form action={mockConfirmPaymentAction} className="mt-6">
              <input type="hidden" name="merchantOrderId" value={merchantOrderId} />
              <button
                type="submit"
                className={cn(buttonVariants(), `rpp-press w-full`)}
              >
                {t('mock_confirm')}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">{t('mock_hint')}</p>
            </form>
          )}

          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'outline' }), `
              rpp-press mt-6 inline-flex
            `)}
          >
            {t('back_hub')}
          </Link>
        </div>
      </main>
    </div>
  );
}
