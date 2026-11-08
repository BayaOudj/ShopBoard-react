import { describe, expect, it } from 'vitest'
import { checkoutSchema } from './checkout.schema'
const valid = {
  name: 'Test Buyer',
  email: 'test@example.com',
  address: '123 Sample Street',
  city: 'Istanbul',
  postalCode: '34000',
  country: 'Türkiye',
}
describe('checkout schema', () => {
  it('normalizes whitespace and accepts international addresses', () => {
    expect(checkoutSchema.parse({ ...valid, name: ' Test Buyer ' }).name).toBe(
      'Test Buyer',
    )
    expect(
      checkoutSchema.safeParse({
        ...valid,
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom',
      }).success,
    ).toBe(true)
  })
  it('rejects missing fields, invalid email, whitespace, and excessive input', () => {
    for (const change of [
      { name: ' ' },
      { email: 'broken' },
      { address: '123' },
      { city: '' },
      { country: '' },
      { postalCode: '' },
      { name: 'x'.repeat(101) },
    ])
      expect(checkoutSchema.safeParse({ ...valid, ...change }).success).toBe(
        false,
      )
  })
})
