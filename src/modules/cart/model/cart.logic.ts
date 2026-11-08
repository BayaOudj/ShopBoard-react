import type { Product } from '../../products/model/products.types'
import { getColors, variantKey } from '../../products/model/products.colors'
import { decodeCart } from './cart.persistence'
import type { Cart, CartAction, CartLine } from './cart.types'

export function cartCount(cart: Cart) {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
}
export function lineItems(
  cart: Cart,
  products: readonly Product[],
): CartLine[] {
  return products.flatMap((product) =>
    getColors(product).flatMap((color) => {
      const id = variantKey(product, color)
      const qty = cart[id]
      return qty
        ? [{ id, product, color, qty, lineTotal: qty * product.price }]
        : []
    }),
  )
}
export function subtotal(items: readonly { lineTotal: number }[]) {
  return items.reduce((sum, item) => sum + item.lineTotal, 0)
}

export function cartReducer(saved: unknown, action: CartAction): unknown {
  const cart = decodeCart(saved, action.products)
  if (action.type === 'add') {
    if (
      !action.products.some((product) => product.id === action.product.id) ||
      !getColors(action.product).includes(action.color)
    )
      return saved
    const key = variantKey(action.product, action.color)
    return { ...cart, [key]: Math.min(99, (cart[key] ?? 0) + 1) }
  }
  if (action.type === 'remove') {
    const next = { ...cart }
    delete next[action.id]
    return next
  }
  if (
    !Number.isInteger(action.quantity) ||
    action.quantity < 1 ||
    action.quantity > 99 ||
    !Object.hasOwn(cart, action.id)
  )
    return saved
  return { ...cart, [action.id]: action.quantity }
}
