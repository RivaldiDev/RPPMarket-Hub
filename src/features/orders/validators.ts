import { z } from 'zod';

export const checkoutFormSchema = z.object({
  buyerName: z
    .string()
    .trim()
    .min(1, 'buyer_name_required')
    .max(80, 'buyer_name_too_long'),
  buyerEmail: z
    .string()
    .trim()
    .email('buyer_email_invalid')
    .max(160, 'buyer_email_too_long'),
  buyerPhone: z
    .string()
    .trim()
    .max(32, 'buyer_phone_too_long')
    .optional()
    .or(z.literal('')),
  quantity: z.coerce
    .number()
    .int('quantity_invalid')
    .min(1, 'quantity_min')
    .max(99, 'quantity_max')
    .default(1),
});
