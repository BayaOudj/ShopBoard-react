import type { Product } from '../../products/model/products.types'
import { CATEGORIES } from '../../products/model/products.collections'
const colors = ['#a994ed', '#80c7d8', '#e9a5ca', '#9ac5aa', '#e6b79d']
export function catalogStats(products: readonly Product[]) {
  const total = products.reduce((sum, product) => sum + product.price, 0)
  return {
    count: products.length,
    total,
    average: products.length ? total / products.length : null,
    underFifty: products.filter((product) => product.price < 50).length,
    categories: CATEGORIES.map((name, index) => {
      const items = products.filter((product) => product.category === name)
      return {
        name,
        count: items.length,
        value: items.reduce((sum, item) => sum + item.price, 0),
        color: colors[index] ?? '#a994ed',
      }
    }),
  }
}
