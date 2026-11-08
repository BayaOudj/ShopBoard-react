export type ProductId = string | number

export interface Product {
  id: ProductId
  name: string
  price: number
  category: string
  description?: string
}

export interface Collection {
  id: string
  name: string
  description: string
  image: string
  productIds: ProductId[]
}

export interface ProductImage {
  src: string
  alt: string
}

export type ProductSort = 'cheapest' | 'expensive' | 'original'

export interface ProductFilters {
  query: string
  category: string
  collection: Collection | null
  underFifty: boolean
  sort: ProductSort
}

export type LoadState =
  | { status: 'loading' }
  | { status: 'success'; products: Product[] }
  | { status: 'error'; message: string }
  | { status: 'empty' }
