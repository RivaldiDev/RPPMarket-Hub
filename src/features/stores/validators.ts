import { z } from 'zod';
import { isValidStoreSlug } from '@/libs/hub/constants';
import { isSafeHttpUrl } from '@/utils/Helpers';

const storeStatusSchema = z.enum(['draft', 'active']);

const storeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(48)
  .refine(isValidStoreSlug, { message: 'invalid_or_reserved_slug' });

/** Sellers can only set draft/active — suspended is platform-only. */
export const storeFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: storeSlugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  status: storeStatusSchema.default('draft'),
  logoUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(value => !value || isSafeHttpUrl(value), {
      message: 'invalid_logo_url',
    }),
});
