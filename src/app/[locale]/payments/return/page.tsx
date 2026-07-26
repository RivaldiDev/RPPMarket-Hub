import { eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AutoRefresh } from '@/components/AutoRefresh';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { mockConfirmPaymentAction } from '@/features/orders/mock-confirm';
import { db } from '@/libs/DB';
import { isDuitkuConfigured } from '@/libs/duitku/client';
import { Link } from '@/libs/I18nNavigation';
import { orders, products } from '@/models/Schema';
import { cn, isMockPaymentsAllowed } from '@/utils/Helpers';

type ReturnPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ merchantOrderId?: string; mock?: string; error?: string }>;
};

/** Only these error codes are rendered; anything else shows the generic message. */
const KNOWN_ERRORS = new Set([
  'missing_order',
  'order_not_found',
  'duitku_configured',
  'mock_disabled',
]);

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
  let product = null as typeof products.$inferSelect | null;
  if (merchantOrderId && /^RPP_[a-zA-Z0-9]+$/.test(merchantOrderId)) {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.merchantOrderId, merchantOrderId))
      .limit(1);
    order = rows[0] ?? null;

    if (order) {
      const productRows = await db
        .select()
        .from(products)
        .where(eq(products.id, order.productId))
        .limit(1);
      product = productRows[0] ?? null;
    }
  }

  const isPaid = Boolean(
    order && (order.status === 'paid' || order.status === 'fulfilled_manual'),
  );
  const isPending = Boolean(order && order.status === 'pending_payment');

  const canMockConfirm = Boolean(
    order
    && mock === '1'
    && !isDuitkuConfigured()
    && isMockPaymentsAllowed()
    && order.status === 'pending_payment',
  );

  const errorKey = error
    ? KNOWN_ERRORS.has(error)
      ? error
      : 'generic'
    : null;

  return (
    <div className="rpp-shell min-h-screen">
      <div className="rpp-mesh" aria-hidden="true" />
      {isPending && <AutoRefresh intervalMs={5000} />}
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rpp-card p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>

          {errorKey && (
            <p className="mt-4 text-sm text-destructive">
              {t(`error_${errorKey}` as never)}
            </p>
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
              {product && (
                <div className="
                  flex justify-between gap-4 border-b border-border py-2
                "
                >
                  <span className="text-muted-foreground">{t('product')}</span>
                  <span className="font-medium">{product.title}</span>
                </div>
              )}
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
                <span className="font-medium uppercase">
                  {isPaid ? t('status_paid') : order.status === 'pending_payment' ? t('status_pending') : t('status_failed')}
                </span>
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

          {isPending && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t('pending_refresh_hint')}
            </p>
          )}

          {isPaid && (
            <div className="
              mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left
            "
            >
              <h2 className="text-sm font-semibold">{t('delivery_title')}</h2>
              {product?.deliveryContent
                ? (
                    <p className="
                      mt-2 text-sm wrap-break-word whitespace-pre-wrap
                    "
                    >
                      {product.deliveryContent}
                    </p>
                  )
                : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('delivery_manual_hint')}
                    </p>
                  )}
              <p className="mt-3 text-xs text-muted-foreground">
                {t('delivery_keep_page')}
              </p>
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
