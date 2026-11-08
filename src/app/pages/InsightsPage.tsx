import { useNavigate } from 'react-router-dom'
import { CatalogInsights } from '../../modules/dashboard/components/CatalogInsights'
import { useCatalog } from '../../modules/products/hooks/useShop'
export default function InsightsPage() {
  const products = useCatalog()
  const navigate = useNavigate()
  return (
    <CatalogInsights
      sectionRef={null}
      products={products}
      loaded
      onDetails={(product) =>
        navigate(`/products/${encodeURIComponent(product.id)}`)
      }
    />
  )
}
