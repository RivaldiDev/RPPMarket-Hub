import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import {
  adminMarkWithdrawPaidAction,
  adminRejectWithdrawAction,
  listPendingWithdrawsAdmin,
} from '@/features/wallet/withdraw-actions';
import { isPlatformAdmin, requireUserId } from '@/libs/hub/auth';
import { cn } from '@/utils/Helpers';

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminWithdrawalsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { locale } = await props.params;
  const { error, ok } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminWithdrawalsPage' });

  const userId = await requireUserId();
  if (!isPlatformAdmin(userId)) {
    notFound();
  }

  const pending = await listPendingWithdrawsAdmin();

  return (
    <>
      <TitleBar title={t('title_bar')} description={t('title_bar_description')} />
      <div className="rpp-card p-6">
        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}
        {ok && (
          <p className="mb-4 text-sm text-primary">{t('marked_paid')}</p>
        )}

        <h2 className="text-lg font-semibold">{t('pending_title')}</h2>
        {pending.length === 0
          ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('empty')}</p>
            )
          : (
              <ul className="mt-4 divide-y divide-border/70">
                {pending.map(w => (
                  <li key={w.id} className="py-4 text-sm">
                    <div className="
                      flex flex-wrap items-start justify-between gap-3
                    "
                    >
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{w.id}</p>
                        <p className="mt-1 font-semibold tabular-nums">
                          {formatIdr(w.amountIdr)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('net')}
                          {': '}
                          {formatIdr(w.netIdr)}
                          {' · '}
                          {t('fee')}
                          {': '}
                          {formatIdr(w.feeIdr)}
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          {w.bankName}
                          {' · '}
                          {w.bankAccountName}
                          {' · '}
                          {w.bankAccountNumber}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('store_id')}
                          {': '}
                          {w.storeId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="
                          rounded-full bg-amber-500/15 px-2 py-0.5 text-xs
                          font-medium text-amber-800
                          dark:text-amber-200
                        "
                        >
                          {w.status}
                        </span>
                        <form action={adminMarkWithdrawPaidAction}>
                          <input type="hidden" name="withdrawId" value={w.id} />
                          <button
                            type="submit"
                            className={cn(buttonVariants({ size: 'sm' }), `
                              rpp-press
                            `)}
                          >
                            {t('mark_paid')}
                          </button>
                        </form>
                        <form action={adminRejectWithdrawAction}>
                          <input type="hidden" name="withdrawId" value={w.id} />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ size: 'sm', variant: 'outline' }),
                              'rpp-press',
                            )}
                          >
                            {t('reject')}
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        <p className="mt-6 text-xs text-muted-foreground">{t('manual_note')}</p>
      </div>
    </>
  );
}
