import { describe, expect, it } from 'vitest'
import type { Product } from '../../products/model/products.types'
import { cartCount, cartReducer, lineItems, subtotal } from './cart.logic'
import { decodeCart } from './cart.persistence'

const products: Product[] = [
  { id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 },
  { id: 2, name: 'Canvas Backpack', category: 'Bags', price: 49 },
]

describe('cart domain and compatibility', () => {
  it('keeps color variants separate and calculates quantities, line prices, and subtotal', () => {
    const cart = { '1::Brown': 2, '1::Black': 1, '2::Sage': 1 }
    expect(cartCount(cart)).toBe(4)
    const items = lineItems(cart, products)
    expect(items.map((item) => [item.id, item.qty, item.lineTotal])).toEqual([
      ['1::Brown', 2, 178],
      ['1::Black', 1, 89],
      ['2::Sage', 1, 49],
    ])
    expect(subtotal(items)).toBe(316)
  })

  it('migrates old product-only keys once and caps a merged variant at 99', () => {
    const restored = decodeCart(
      { 1: 3, '1::Brown': 98, '1::Black': 2 },
      products,
    )
    expect(restored).toEqual({ '1::Brown': 99, '1::Black': 2 })
    expect(decodeCart(restored, products)).toEqual(restored)
  })

  it('rejects malformed quantities, unknown products, and unavailable colors', () => {
    expect(
      decodeCart(
        {
          '1::Brown': '2',
          '1::Black': 1.5,
          '1::Tan': 100,
          '1::Purple': 2,
          '999::Black': 3,
          '2::Sage': 0,
        },
        products,
      ),
    ).toEqual({})
    for (const saved of [null, [], 'invalid', 12])
      expect(decodeCart(saved, products)).toEqual({})
  })

  it('adds immutably and guards maximum quantity even for repeated actions', () => {
    const initial = { '1::Brown': 98 }
    const action = {
      type: 'add' as const,
      product: products[0],
      color: 'Brown',
      products,
    }
    const next = cartReducer(initial, action)
    expect(next).toEqual({ '1::Brown': 99 })
    expect(cartReducer(next, action)).toEqual(next)
    expect(initial).toEqual({ '1::Brown': 98 })
  })

  it('rejects invalid quantity edits and removes only the specified variant', () => {
    const initial = { '1::Brown': 2, '1::Black': 3 }
    for (const quantity of [0, -1, 1.5, 100, NaN])
      expect(
        cartReducer(initial, {
          type: 'quantity',
          products,
          id: '1::Brown',
          quantity,
        }),
      ).toBe(initial)
    expect(
      cartReducer(initial, {
        type: 'quantity',
        products,
        id: '1::Brown',
        quantity: 4,
      }),
    ).toEqual({ '1::Brown': 4, '1::Black': 3 })
    expect(
      cartReducer(initial, { type: 'remove', products, id: '1::Brown' }),
    ).toEqual({ '1::Black': 3 })
  })
})
