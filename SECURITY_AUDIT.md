# Security & QC audit — RPP Market Hub
Date: 2026-07-23
Scope: auth, payments, storefront, wallet, dashboard actions, headers, residual hardening

## Critical / High — fixed (pass 1 + pass 2)

| ID | Finding | Severity | Fix |
|---|---|---|---|
| S1 | Mock payment free-credit if Duitku keys missing in prod | Critical | `isMockPaymentsAllowed()` blocks production unless `ALLOW_MOCK_PAYMENTS=true` |
| S2 | Open redirect via Duitku `paymentUrl` | High | `isSafePaymentRedirectUrl()` relative + `*.duitku.com` https only |
| S3 | Callback missing merchantCode binding | High | constant-time merchantCode compare |
| S4 | Seller could set `suspended` | Medium | form schema `draft\|active` only |
| S5 | Unsafe logo/image URL schemes | Medium | `isSafeHttpUrl()` https (+ localhost http) |
| S6 | Concurrent paid callbacks double-credit | High | conditional pending→paid + ledger unique index |
| S7 | Non-00 callbacks marked failed | Medium | only `resultCode=01` fails |
| S8 | Credit failure returned 200 | Medium | 500 so Duitku retries |
| S9 | Missing security headers | Medium | CSP/XFO/nosniff/referrer/permissions |
| S10 | Raw gateway errors to buyer | Low | generic `inquiry_failed` |
| S11 | No DB unique on order_credit refs | High | `ledger_store_type_ref_uidx` migration 0002 |
| S12 | Withdraw race overdraft | High | optimistic concurrency on available balance |
| S13 | Multiple stores per user possible | Medium | unique index `stores_owner_user_id_uidx` |
| S14 | Return page full email leak | Medium | mask email + order id pattern gate |
| S15 | Admin withdraw read-only only | Medium | `adminMarkWithdrawPaidAction` + UI button |

## QC feature matrix

| Feature | Authz | Validation | Race/Idempotency | Status |
|---|---|---|---|---|
| Store upsert | owner | zod + reserved slug | owner unique | OK |
| Product CRUD | owner store | zod + ownership | store+slug unique | OK |
| Checkout | public | price from DB | merchantOrderId unique | OK |
| Duitku callback | HMAC+merchant | amount match | paid conditional + ledger uidx | OK |
| Mock confirm | env gate | order pattern | pending only | OK |
| Wallet withdraw | owner | min+fee 5% | available optimistic lock | OK |
| Admin withdrawals | PLATFORM_ADMIN | UUID id | pending→paid conditional | OK |
| Storefront | public active | slug validation | — | OK |
| Return page | public unguessable id | pattern + mask PII | — | OK |

## Residual risks (accepted)

1. **No rate limiting** on checkout/callback — edge/WAF later.
2. **No CAPTCHA** on public checkout.
3. **CSP still allows unsafe-inline/eval** for Clerk/Next.
4. **Auto disbursement** deferred (manual bank transfer + admin mark paid).
5. **Return page** still public by merchantOrderId (unguessable, not buyer-session bound).
6. **Operator env hygiene** (Clerk/Duitku/DB secrets).

## Migrations
- `0001_huge_leech.sql` — domain tables
- `0002_left_ravenous.sql` — ledger unique + owner unique

## Verify
- `npm run check:types`
- `npm run check:i18n`
- unit: signature, fee, constants, helpers
- `npm run build:next`

## Goal status
Deep security audit + feature QC **complete for MVP money path**. Remaining items are infrastructure/ops deferred risks, not open critical code bugs.
