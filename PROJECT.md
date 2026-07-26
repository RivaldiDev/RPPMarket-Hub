# RPP Market Hub — implementation status

## Product
Multi-agent **digital store hub** (not personal single-store).

- Storefront: `/{storeSlug}` share-only (no public directory)
- Payments: **Duitku** (HMAC-SHA256 callback)
- Platform fee: **5% flat on withdraw** (`PLATFORM_WITHDRAW_FEE_BPS=500`)
- i18n: **id** default + **en**, localeDetection on

## Active path
`C:\Users\rival\Documents\Ngoding\RPPMarket-Hub`

Do **not** continue legacy `RPPMarket` / `RPPMarket-Vercel` for this product.

## Implemented (MVP money path)
1. Domain schema + migration `migrations/0001_huge_leech.sql`
   - stores, products, orders, wallets, ledger_entries, withdraw_requests, payment_events
2. Duitku
   - signature helpers + tests
   - inquiry client
   - callback `POST /api/payments/duitku/callback`
   - mock confirm when keys missing
3. Seller dashboard
   - store upsert
   - product create/update/archive
   - orders list
   - wallet + withdraw request (fee 5%)
4. Storefront
   - `/{slug}` product grid
   - `/{slug}/p/{productSlug}` checkout
5. Return page `/payments/return`
6. SEO robots + sitemap (hub + active stores/products)
7. Middleware: personal auth (no org lock), payment API excluded

## Local flow
1. Copy `.env.example` → `.env` (Clerk + DATABASE_URL required)
2. `npm run db:migrate` (or drizzle migrate against DATABASE_URL)
3. `npm run dev`
4. Sign in → Dashboard → create store (status active) → add product → open `/{slug}` → checkout
5. Without Duitku keys: mock confirm on return page credits wallet
6. Wallet → request withdraw (min IDR 50_000, fee 5%)

## Env
- `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_BASE_URL`
- `DUITKU_DEFAULT_PAYMENT_METHOD` (default `SP`)
- `PLATFORM_WITHDRAW_FEE_BPS=500`
- `PLATFORM_MIN_WITHDRAW_IDR=50000`
- `PLATFORM_ADMIN_USER_IDS` (optional)

## Verify
- `npm run check:types`
- `npm run check:i18n`
- unit tests: hub constants, duitku signature, fee, helpers
- `npm run build:next`

## Deferred
- Auto disbursement (Duitku transfer)
- Product delivery automation
- Public store directory
- Custom domains
