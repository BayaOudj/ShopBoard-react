import { useNavigate } from 'react-router-dom'
import { CollectionsSection } from '../../modules/products/components/CollectionsSection'
export default function CollectionsPage() {
  const navigate = useNavigate()
  return (
    <CollectionsSection
      sectionRef={null}
      disabled={false}
      onSelect={(collection) =>
        navigate(`/products?collection=${collection.id}`)
      }
    />
  )
}
