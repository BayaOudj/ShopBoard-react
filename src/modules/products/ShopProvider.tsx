import { useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { loadCatalog } from './api/catalog.resource'
import { ShopContext } from './hooks/useShop'
import type { Product } from './model/products.types'
import { useCart } from '../cart/hooks/useCart'
import { Toast } from '../../shared/ui/Toast'
import { useToast } from '../../shared/ui/useToast'
import { variantKey } from './model/products.colors'
import { getColors } from './model/products.colors'

function useShopOwner(initial: ReturnType<typeof loadCatalog>) {
  const [resource, setResource] = useState(initial)
  const products = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
  )
  const [colors, setColors] = useState<Record<string, string>>({})
  const cart = useCart(products)
  const toast = useToast()
  return {
    productCount: products?.length ?? null,
    message: toast.message,
    promise: resource.promise,
    cart: {
      ...cart,
      add: (product: Product, color: string) => {
        if (!cart.ready) return
        if ((cart.cart[variantKey(product, color)] ?? 0) >= 99) {
          toast.notify('Maximum quantity is 99 per product.')
          return
        }
        cart.add(product, color)
        toast.notify(`${product.name} (${color}) added to your cart.`)
      },
    },
    retry: () => setResource(loadCatalog()),
    colorFor: (product: Product) =>
      colors[String(product.id)] ?? getColors(product)[0],
    changeColor: (product: Product, color: string) => {
      if (getColors(product).includes(color))
        setColors((previous) => ({ ...previous, [String(product.id)]: color }))
    },
  }
}
export function ShopProvider({
  initial,
  children,
}: {
  initial: ReturnType<typeof loadCatalog>
  children: ReactNode
}) {
  const shop = useShopOwner(initial)
  return (
    <ShopContext.Provider value={shop}>
      {children}
      <Toast message={shop.message} />
    </ShopContext.Provider>
  )
}
