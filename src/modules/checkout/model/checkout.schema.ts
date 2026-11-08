import { z } from 'zod'
export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter your full name (at least 2 characters).')
    .max(100, 'Use 100 characters or fewer.'),
  email: z.email('Enter a valid email address.'),
  address: z
    .string()
    .trim()
    .min(5, 'Enter your street address.')
    .max(200, 'Use 200 characters or fewer.'),
  city: z
    .string()
    .trim()
    .min(2, 'Enter your city.')
    .max(100, 'Use 100 characters or fewer.'),
  postalCode: z
    .string()
    .trim()
    .min(2, 'Enter your postal code.')
    .max(20, 'Use 20 characters or fewer.'),
  country: z
    .string()
    .trim()
    .min(2, 'Enter your country.')
    .max(100, 'Use 100 characters or fewer.'),
})
export type CheckoutValues = z.infer<typeof checkoutSchema>
