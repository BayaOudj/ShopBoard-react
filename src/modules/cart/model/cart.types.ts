import type { Product } from '../../products/model/products.types'
export type Cart = Record<string, number>
export interface CartLine {
  id: string
  product: Product
  color: string
  qty: number
  lineTotal: number
}
export type CartAction =
  | {
      type: 'add'
      products: readonly Product[]
      product: Product
      color: string
    }
  | {
      type: 'quantity'
      products: readonly Product[]
      id: string
      quantity: number
    }
  | { type: 'remove'; products: readonly Product[]; id: string }
