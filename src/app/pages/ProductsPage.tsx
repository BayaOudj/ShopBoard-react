import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CatalogSection } from '../../modules/products/components/CatalogSection'
import { useCatalogFilters } from '../../modules/products/hooks/useCatalogFilters'
import { useCatalog, useShop } from '../../modules/products/hooks/useShop'
import { COLLECTIONS } from '../../modules/products/model/products.collections'
import { useProductSearchShortcut } from '../hooks/useProductSearchShortcut'
export default function ProductsPage() {
  const products = useCatalog()
  const shop = useShop()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const controls = useCatalogFilters()
  const search = useRef<HTMLInputElement>(null)
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#search-products') search.current?.focus()
  }, [hash])
  useProductSearchShortcut(search)
  const collection = COLLECTIONS.find(
    (item) => item.id === params.get('collection'),
  )
  const effectiveControls = collection
    ? {
        ...controls,
        filters: { ...controls.filters, collection },
        resetFilters: () => {
          controls.resetFilters()
          void navigate('/products')
        },
      }
    : controls
  return (
    <CatalogSection
      sectionRef={null}
      searchRef={search}
      controls={effectiveControls}
      state={
        products.length ? { status: 'success', products } : { status: 'empty' }
      }
      onRetry={shop.retry}
    />
  )
}
