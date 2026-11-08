import { useState } from 'react'
import type { Collection, ProductFilters } from '../model/products.types'

export function useCatalogFilters() {
  const [filters, setFilters] = useState<ProductFilters>({
    query: '',
    category: 'All',
    collection: null,
    underFifty: false,
    sort: 'cheapest',
  })
  const [namesOnly, setNamesOnly] = useState(false)
  const updateFilters = (patch: Partial<ProductFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  const resetFilters = () =>
    setFilters((current) => ({
      ...current,
      query: '',
      category: 'All',
      collection: null,
      underFifty: false,
    }))
  const selectCollection = (collection: Collection) =>
    setFilters((current) => ({
      ...current,
      collection: current.collection?.id === collection.id ? null : collection,
      category: 'All',
      query: '',
      underFifty: false,
    }))
  return {
    filters,
    namesOnly,
    setNamesOnly,
    updateFilters,
    resetFilters,
    selectCollection,
  }
}
