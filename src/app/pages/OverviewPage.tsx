import { Hero } from '../components/Hero'
import { DashboardOverview } from '../../modules/dashboard/components/DashboardOverview'
import { useCatalog, useShop } from '../../modules/products/hooks/useShop'
import { SectionBoundary } from '../components/SectionBoundary'
function Metrics() {
  return <DashboardOverview products={useCatalog()} loaded />
}
export default function OverviewPage() {
  const { retry } = useShop()
  return (
    <>
      <Hero sectionRef={null} />
      <SectionBoundary retry={retry}>
        <Metrics />
      </SectionBoundary>
    </>
  )
}
