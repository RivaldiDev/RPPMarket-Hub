import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { getStoreByOwnerUserId } from '@/features/stores/queries';
import {
  ensureWallet,
  listLedgerForStore,
  listWithdrawsForStore,
} from '@/features/wallet/ledger';
import {
  getWithdrawLimits,
  requestWithdrawAction,
} from '@/features/wallet/withdraw-actions';
import { requireUserId } from '@/libs/hub/auth';
import { computeWithdrawFee } from '@/libs/hub/constants';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/utils/Helpers';

export default async function WalletPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { locale } = await props.params;
  const { error, ok } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SellerWalletPage' });
  const userId = await requireUserId();
  const store = await getStoreByOwnerUserId(userId);
  const limits = await getWithdrawLimits();

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

  const wallet = await ensureWallet(store.id);
  const withdraws = await listWithdrawsForStore(store.id);
  const ledger = await listLedgerForStore(store.id, 20);
  const example = computeWithdrawFee(100_000, limits.feeBps);

  return (
    <>
      <TitleBar title={t('title_bar')} description={t('title_bar_description')} />

      {error && (
        <div className="
          mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3
          py-2 text-sm text-destructive
        "
        >
          {error}
        </div>
      )}
      {ok && (
        <div className="
          mb-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2
          text-sm text-primary
        "
        >
          {t('withdraw_success')}
        </div>
      )}

      <div className="
        grid gap-4
        sm:grid-cols-3
      "
      >
        <div className="rpp-card p-5">
          <p className="text-xs text-muted-foreground">{t('available_label')}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            Rp
            {' '}
            {wallet.availableIdr.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rpp-card p-5">
          <p className="text-xs text-muted-foreground">{t('pending_label')}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            Rp
            {' '}
            {wallet.pendingIdr.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rpp-card p-5">
          <p className="text-xs text-muted-foreground">{t('fee_label')}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {(limits.feeBps / 100).toFixed(0)}
            %
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('fee_example', {
              gross: '100.000',
              fee: example.feeIdr.toLocaleString('id-ID'),
              net: example.netIdr.toLocaleString('id-ID'),
            })}
          </p>
        </div>
      </div>

      <form
        action={requestWithdrawAction}
        className="
          rpp-card mt-6 grid gap-3 p-6
          md:grid-cols-2
        "
      >
        <h2 className="
          text-lg font-semibold
          md:col-span-2
        "
        >
          {t('withdraw_title')}
        </h2>
        <input
          name="amountIdr"
          type="number"
          min={limits.minIdr}
          required
          placeholder={t('amount')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="bankName"
          required
          placeholder={t('bank_name')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="bankAccountNumber"
          required
          placeholder={t('bank_account')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="bankAccountName"
          required
          placeholder={t('bank_holder')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className={cn(buttonVariants(), 'rpp-press w-fit')}>
          {t('withdraw_submit')}
        </button>
        <p className="
          text-xs text-muted-foreground
          md:col-span-2
        "
        >
          {t('min_withdraw', { amount: limits.minIdr.toLocaleString('id-ID') })}
        </p>
      </form>

      <div className="
        mt-6 grid gap-4
        lg:grid-cols-2
      "
      >
        <section className="rpp-card p-6">
          <h3 className="font-semibold">{t('withdraw_history')}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {withdraws.length === 0 && (
              <li className="text-muted-foreground">{t('empty_withdraws')}</li>
            )}
            {withdraws.map(w => (
              <li
                key={w.id}
                className="
                  flex justify-between gap-3 border-b border-border/70 py-2
                "
              >
                <span>
                  Rp
                  {' '}
                  {w.amountIdr.toLocaleString('id-ID')}
                  {' '}
                  (
                  {w.status}
                  )
                </span>
                <span className="text-muted-foreground">
                  fee
                  {' '}
                  {w.feeIdr.toLocaleString('id-ID')}
                  {' · net '}
                  {w.netIdr.toLocaleString('id-ID')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rpp-card p-6">
          <h3 className="font-semibold">{t('ledger_history')}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {ledger.length === 0 && (
              <li className="text-muted-foreground">{t('empty_ledger')}</li>
            )}
            {ledger.map(entry => (
              <li
                key={entry.id}
                className="
                  flex justify-between gap-3 border-b border-border/70 py-2
                "
              >
                <span>{entry.type}</span>
                <span className="tabular-nums">
                  {entry.amountIdr.toLocaleString('id-ID')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
