import { ApiError, fetchJson } from '../../../shared/api/client'
import type { Product } from '../model/products.types'

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false
  if (
    !('id' in value) ||
    !('name' in value) ||
    !('price' in value) ||
    !('category' in value)
  )
    return false
  return (
    ((typeof value.id === 'string' &&
      value.id.trim().length > 0 &&
      !value.id.includes('::')) ||
      (typeof value.id === 'number' && Number.isFinite(value.id))) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.category === 'string' &&
    value.category.trim().length > 0 &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    (!('description' in value) ||
      value.description === undefined ||
      typeof value.description === 'string')
  )
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  // This preserves the original static demo catalog; no live backend is implied.
  const data = await fetchJson('/api/products.json', { signal })
  if (!Array.isArray(data) || !data.every(isProduct)) {
    throw new Error('The server returned invalid product data.')
  }
  if (new Set(data.map((product) => String(product.id))).size !== data.length) {
    throw new Error('The server returned duplicate product IDs.')
  }
  return data
}

export async function getProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product | undefined> {
  let data: unknown
  try {
    data = await fetchJson(`/api/products/${encodeURIComponent(id)}.json`, {
      signal,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
  if (!isProduct(data) || String(data.id) !== id)
    throw new Error('The server returned invalid product data.')
  return data
}
