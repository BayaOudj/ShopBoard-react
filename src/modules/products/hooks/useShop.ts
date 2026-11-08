import { createContext, useContext, use } from 'react'
import type { Product } from '../model/products.types'
import type { useCart } from '../../cart/hooks/useCart'
interface Shop {
  productCount: number | null
  promise: Promise<Product[]>
  cart: ReturnType<typeof useCart>
  retry: () => void
  colorFor: (product: Product) => string
  changeColor: (product: Product, color: string) => void
}
export const ShopContext = createContext<Shop | null>(null)
export function useShop() {
  const shop = useContext(ShopContext)
  if (!shop) throw new Error('ShopProvider is required')
  return shop
}
export function useCatalog() {
  return use(useShop().promise)
}
