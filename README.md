<div align="center">

# RPP Market Hub

**Multi-seller digital store hub for Indonesia. One link per store, Duitku payments, 5% fee on withdraw.**

[![GitHub](https://img.shields.io/badge/Source_Code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RivaldiDev/RPPMarket-Hub)

[Overview](#overview) · [Features](#features) · [Getting Started](#getting-started) · [Architecture](#architecture)

</div>

---

## Overview

RPP Market Hub is a **hub, not a marketplace directory**. Sellers each get a shareable storefront at `/{store-slug}` — buyers arrive only through shared links. The platform charges no subscription: revenue is a flat **5% fee on withdraw**. Payments flow through **Duitku** (VA · QRIS · e-wallet), credited to a per-store wallet with an append-only ledger.

Bahasa Indonesia by default, English via `/en`.

## Features

| Area | What it does |
| --- | --- |
| **Storefront** | Share-only store pages `/{slug}` with product grid and checkout at `/{slug}/p/{productSlug}`. No public directory. |
| **Payments** | Duitku integration with signed callbacks, amount matching, and idempotent order crediting. |
| **Wallet** | Per-store IDR wallet, append-only ledger, withdraw requests (min Rp 50.000, 5% fee). |
| **Seller Dashboard** | Store setup, product CRUD, order list, wallet and withdraw management. |
| **Admin** | Withdraw review and mark-paid flow, gated by `PLATFORM_ADMIN_USER_IDS`. |
| **Auth** | Clerk personal accounts — one store per user. |
| **i18n** | `id` default + `en`, exact key parity, powered by next-intl. |

## Getting Started

Requirements: Node.js 24+, npm, a Clerk application, and a Postgres database (PGLite dev server included).

```bash
git clone https://github.com/RivaldiDev/RPPMarket-Hub.git
cd RPPMarket-Hub
npm install
copy .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, create a store, add a product, then open `/{your-slug}` to test checkout. Without Duitku keys, mock payment confirmation is available in development only.

### Environment

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-domain.com

DUITKU_MERCHANT_CODE=...
DUITKU_API_KEY=...
DUITKU_BASE_URL=https://sandbox.duitku.com
PLATFORM_WITHDRAW_FEE_BPS=500
PLATFORM_MIN_WITHDRAW_IDR=50000
PLATFORM_ADMIN_USER_IDS=user_...
```

## Architecture

```
src/
├── app/
│   ├── [locale]/(marketing)/     # Hub landing page
│   ├── [locale]/(auth)/dashboard # Seller dashboard + admin
│   ├── [locale]/(storefront)/    # Public store + checkout
│   ├── [locale]/payments/return  # Payment return page
│   └── api/payments/duitku       # Signed payment callback
├── features/
│   ├── stores/ products/ orders/ # Server actions + validators
│   └── wallet/                   # Ledger, withdraw, fee logic
├── libs/
│   ├── duitku/                   # Signature + gateway client
│   └── hub/                      # Domain constants + helpers
└── models/Schema.ts              # Drizzle schema (stores → ledger)
```

### Verify

```bash
npm run check:types
npm run check:i18n
npx vitest run --project unit
npm run build:next
```

---

<div align="center">

![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Built by [RivaldiDev](https://github.com/RivaldiDev)**

</div>
