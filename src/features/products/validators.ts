import { z } from 'zod';
import { isSafeHttpUrl } from '@/utils/Helpers';

const productStatusSchema = z.enum(['draft', 'active', 'archived']);

const productSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'invalid_slug' });

export const productFormSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: productSlugSchema,
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  priceIdr: z.coerce.number().int().min(1000).max(100_000_000),
  imageUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(value => !value || isSafeHttpUrl(value), {
      message: 'invalid_image_url',
    }),
  deliveryContent: z.string().trim().max(10_000).optional().or(z.literal('')),
  status: productStatusSchema.default('draft'),
});
