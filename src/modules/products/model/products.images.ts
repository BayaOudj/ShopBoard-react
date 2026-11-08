import type { Product, ProductImage } from './products.types'
import { getColors } from './products.colors'

// React owns selection state; this helper only derives the image for a given color.
export function getProductImage(
  product: Pick<Product, 'id' | 'name'>,
  color = getColors(product)[0],
): ProductImage {
  const validColor = getColors(product).includes(color)
    ? color
    : getColors(product)[0]
  return {
    src: `/images/products/${product.id}-${validColor.toLowerCase()}.jpg`,
    alt: `${product.name} in ${validColor} — AI-generated product preview`,
  }
}
