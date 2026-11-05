import { useEffect, useMemo, useReducer } from 'react'
import type { Product } from '../../products/model/products.types'
import { cartCount, cartReducer, lineItems, subtotal } from '../model/cart.logic'
import type { Cart } from '../model/cart.types'
import { decodeCart, readStoredCart, saveCart } from '../model/cart.persistence'

const emptyProducts: Product[] = []
export function useCart(catalog: Product[] | null) {
  const [saved, dispatch] = useReducer(cartReducer, undefined, readStoredCart)
  const products = catalog ?? emptyProducts
  const ready = products.length > 0
  // A stable validated snapshot prevents unrelated UI renders from rewriting storage.
  const cart = useMemo<Cart>(() => ready ? decodeCart(saved, products) : {}, [saved, products, ready])
  useEffect(() => { if (ready) saveCart(cart) }, [cart, ready])
  const items = lineItems(cart, products)
  return {
    ready, cart, items, count: cartCount(cart), subtotal: subtotal(items),
    add: (product: Product, color: string) => { if (ready) dispatch({ type: 'add', products, product, color }) },
    remove: (id: string) => { if (ready) dispatch({ type: 'remove', products, id }) },
    setQuantity: (id: string, quantity: number) => { if (ready) dispatch({ type: 'quantity', products, id, quantity }) },
  }
}
