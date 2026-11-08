import type { Product, ProductFilters } from './products.types'

export function filterProducts<T extends { name: string; category: string }>(
  products: readonly T[],
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return products
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  )
}

// Filter and sort copies so the catalog's featured order stays intact.
export function selectProducts(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const collectionProducts = filters.collection
    ? products.filter((product) =>
        filters.collection?.productIds.includes(product.id),
      )
    : products
  const categoryProducts =
    filters.category === 'All'
      ? collectionProducts
      : collectionProducts.filter(
          (product) => product.category === filters.category,
        )
  const matches = filterProducts(categoryProducts, filters.query)
  const visible = filters.underFifty
    ? matches.filter((product) => product.price < 50)
    : [...matches]
  if (filters.sort === 'cheapest') visible.sort((a, b) => a.price - b.price)
  if (filters.sort === 'expensive') visible.sort((a, b) => b.price - a.price)
  return visible
}
