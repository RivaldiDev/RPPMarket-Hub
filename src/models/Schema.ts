import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * RPP Market Hub domain schema
 * Multi-seller digital store hub — not a personal single-store app.
 */

export const storeStatusEnum = pgEnum('store_status', [
  'draft',
  'active',
  'suspended',
]);

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'paid',
  'failed',
  'expired',
  'cancelled',
  'fulfilled_manual',
]);

export const ledgerTypeEnum = pgEnum('ledger_type', [
  'order_credit',
  'withdraw_hold',
  'withdraw_fee',
  'withdraw_payout',
  'adjust',
  'refund',
]);

export const withdrawStatusEnum = pgEnum('withdraw_status', [
  'pending',
  'approved',
  'paid',
  'rejected',
  'cancelled',
]);

export const paymentEventSourceEnum = pgEnum('payment_event_source', [
  'inquiry',
  'callback',
  'status_check',
  'redirect',
]);

/** One digital storefront owned by a reseller/agent. */
export const stores = pgTable(
  'stores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerUserId: text('owner_user_id').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    themeJson: jsonb('theme_json'),
    status: storeStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex('stores_slug_uidx').on(table.slug),
    // MVP: one store per seller account.
    uniqueIndex('stores_owner_user_id_uidx').on(table.ownerUserId),
  ],
);

/** Product listing on a store (MVP: listing + checkout only). */
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    priceIdr: integer('price_idr').notNull(),
    currency: text('currency').notNull().default('IDR'),
    imageUrl: text('image_url'),
    status: productStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex('products_store_slug_uidx').on(table.storeId, table.slug)],
);

/** Buyer order against one product (MVP single-item). */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    buyerEmail: text('buyer_email').notNull(),
    buyerName: text('buyer_name'),
    buyerPhone: text('buyer_phone'),
    quantity: integer('quantity').notNull().default(1),
    unitPriceIdr: integer('unit_price_idr').notNull(),
    totalIdr: integer('total_idr').notNull(),
    status: orderStatusEnum('status').notNull().default('pending_payment'),
    merchantOrderId: text('merchant_order_id').notNull(),
    duitkuReference: text('duitku_reference'),
    paymentMethod: text('payment_method'),
    paidAt: timestamp('paid_at', { mode: 'date' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex('orders_merchant_order_id_uidx').on(table.merchantOrderId)],
);

export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  source: paymentEventSourceEnum('source').notNull(),
  payload: jsonb('payload'),
  signatureValid: integer('signature_valid').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/** Per-store wallet balances (IDR integers). */
export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    availableIdr: integer('available_idr').notNull().default(0),
    pendingIdr: integer('pending_idr').notNull().default(0),
    lifetimeEarnedIdr: integer('lifetime_earned_idr').notNull().default(0),
    lifetimeWithdrawnIdr: integer('lifetime_withdrawn_idr').notNull().default(0),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex('wallets_store_id_uidx').on(table.storeId)],
);

/** Append-only money ledger. */
export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    type: ledgerTypeEnum('type').notNull(),
    amountIdr: integer('amount_idr').notNull(),
    balanceAfterIdr: integer('balance_after_idr').notNull(),
    refType: text('ref_type'),
    refId: text('ref_id'),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Prevent double credit / double hold for the same business reference.
    uniqueIndex('ledger_store_type_ref_uidx').on(
      table.storeId,
      table.type,
      table.refType,
      table.refId,
    ),
  ],
);

/** Withdraw request with 5% platform fee. */
export const withdrawRequests = pgTable('withdraw_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  amountIdr: integer('amount_idr').notNull(),
  feeIdr: integer('fee_idr').notNull(),
  netIdr: integer('net_idr').notNull(),
  status: withdrawStatusEnum('status').notNull().default('pending'),
  bankName: text('bank_name'),
  bankAccountNumber: text('bank_account_number'),
  bankAccountName: text('bank_account_name'),
  adminNote: text('admin_note'),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

/** Platform key/value settings (fee bps, min withdraw, etc.). */
export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(),
  valueJson: jsonb('value_json').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** Kept for boilerplate compatibility; unused by hub domain. */
export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
