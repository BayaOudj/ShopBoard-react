import type { Product } from '../../products/model/products.types'
import { getColors, variantKey } from '../../products/model/products.colors'
import type { Cart } from './cart.types'

export const storageKey = 'shopboard-cart-v1'
const validQuantity = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= 99

export function decodeCart(saved: unknown, products: readonly Product[]): Cart {
  const cart: Cart = {}
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return cart
  for (const product of products) {
    for (const color of getColors(product)) {
      const key = variantKey(product, color)
      const quantity: unknown = Object.hasOwn(saved, key)
        ? Reflect.get(saved, key)
        : undefined
      if (validQuantity(quantity)) cart[key] = quantity
    }
    const legacy: unknown = Object.hasOwn(saved, product.id)
      ? Reflect.get(saved, String(product.id))
      : undefined
    if (validQuantity(legacy)) {
      const key = variantKey(product, getColors(product)[0])
      cart[key] = Math.min(99, (cart[key] ?? 0) + legacy)
    }
  }
  return cart
}

export function readStoredCart(): unknown {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? 'null',
    )
    return value
  } catch {
    return null
  }
}
export function saveCart(cart: Cart): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart))
  } catch {
    /* The in-memory cart remains usable. */
  }
}
