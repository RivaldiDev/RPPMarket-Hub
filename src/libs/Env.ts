import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    DUITKU_MERCHANT_CODE: z.string().optional().default(''),
    DUITKU_API_KEY: z.string().optional().default(''),
    DUITKU_BASE_URL: z.string().url().default('https://sandbox.duitku.com'),
    DUITKU_DEFAULT_PAYMENT_METHOD: z.string().optional().default('SP'),
    PLATFORM_WITHDRAW_FEE_BPS: z.coerce.number().int().default(500),
    PLATFORM_MIN_WITHDRAW_IDR: z.coerce.number().int().default(50_000),
    PLATFORM_ADMIN_USER_IDS: z.string().optional().default(''),
    /**
     * Explicitly allow mock payments outside normal non-prod default.
     * Never enable in production unless you understand free-credit risk.
     */
    ALLOW_MOCK_PAYMENTS: z.enum(['true', 'false']).optional().default('false'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_LOGGING_LEVEL: z
      .enum(['error', 'info', 'debug', 'warning', 'trace', 'fatal'])
      .default('info'),
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DUITKU_MERCHANT_CODE: process.env.DUITKU_MERCHANT_CODE,
    DUITKU_API_KEY: process.env.DUITKU_API_KEY,
    DUITKU_BASE_URL: process.env.DUITKU_BASE_URL,
    DUITKU_DEFAULT_PAYMENT_METHOD: process.env.DUITKU_DEFAULT_PAYMENT_METHOD,
    PLATFORM_WITHDRAW_FEE_BPS: process.env.PLATFORM_WITHDRAW_FEE_BPS,
    PLATFORM_MIN_WITHDRAW_IDR: process.env.PLATFORM_MIN_WITHDRAW_IDR,
    PLATFORM_ADMIN_USER_IDS: process.env.PLATFORM_ADMIN_USER_IDS,
    ALLOW_MOCK_PAYMENTS: process.env.ALLOW_MOCK_PAYMENTS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL,
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN:
      process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN,
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST:
      process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
});
