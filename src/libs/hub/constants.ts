/**
 * Paths reserved so store slugs cannot collide with app routes / locales.
 */
const RESERVED_STORE_SLUGS = new Set([
  'dashboard',
  'sign-in',
  'sign-up',
  'onboarding',
  'api',
  'payments',
  'admin',
  'id',
  'en',
  'fr',
  'monitoring',
  '_next',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'store',
  'stores',
  'seller',
  'sellers',
  'rpp',
  'rppmarket',
  'hub',
  'wallet',
  'checkout',
  'docs',
  'blog',
  'about',
  'pricing',
  'faq',
  'features',
]);

const STORE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidStoreSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 48) {
    return false;
  }
  if (!STORE_SLUG_REGEX.test(slug)) {
    return false;
  }
  if (RESERVED_STORE_SLUGS.has(slug)) {
    return false;
  }
  return true;
}

/**
 * Hard cap on a single order total (integer IDR). Keeps totals far below
 * both Duitku's practical limits and Number.MAX_SAFE_INTEGER.
 */
export const MAX_ORDER_TOTAL_IDR = 1_000_000_000;

/** Platform withdraw fee in basis points. 500 = 5%. */
export const DEFAULT_WITHDRAW_FEE_BPS = 500;

/** Minimum withdraw amount in IDR. */
export const DEFAULT_MIN_WITHDRAW_IDR = 50_000;

/**
 * Compute platform fee and net payout for a withdraw.
 * All values are integer IDR.
 */
export function computeWithdrawFee(
  amountIdr: number,
  feeBps: number = DEFAULT_WITHDRAW_FEE_BPS,
): { feeIdr: number; netIdr: number } {
  if (!Number.isInteger(amountIdr) || amountIdr <= 0) {
    throw new Error('invalid_amount');
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error('invalid_fee_bps');
  }
  const feeIdr = Math.floor((amountIdr * feeBps) / 10_000);
  const netIdr = amountIdr - feeIdr;
  return { feeIdr, netIdr };
}
