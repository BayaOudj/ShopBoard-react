import { useEffect, useRef } from 'react'
import {
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useRevalidator,
  useNavigate,
} from 'react-router-dom'
import { ShopProvider } from '../../modules/products/ShopProvider'
import { loadCatalog } from '../../modules/products/api/catalog.resource'
import { useShop } from '../../modules/products/hooks/useShop'
import { SectionBoundary } from './SectionBoundary'
import { Footer } from './Footer'
import { Header } from './Header'
import type { SectionId } from '../navigation'
import { Brand } from './Brand'
import styles from '../App.module.css'
import sidebar from './Sidebar.module.css'
const links = [
  ['/', 'Overview'],
  ['/products', 'Products'],
  ['/collections', 'Collections'],
  ['/insights', 'Catalog insights'],
  ['/community', 'Community'],
]

export default function Layout() {
  const data: { catalog: ReturnType<typeof loadCatalog> } = useLoaderData()
  return (
    <ShopProvider initial={data.catalog}>
      <Shell />
    </ShopProvider>
  )
}
function Shell() {
  const { cart, retry, productCount } = useShop()
  const navigate = useNavigate()
  const location = useLocation()
  const revalidator = useRevalidator()
  const main = useRef<HTMLElement>(null)
  useEffect(() => {
    main.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
    if (!location.hash) main.current?.focus({ preventScroll: true })
  }, [location.pathname, location.hash])
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <aside className={sidebar.sidebar}>
        <Brand />
        <p className={sidebar.caption}>YOUR WORKSPACE</p>
        <nav className={sidebar.navigation} aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={styles.workspace}>
        <Header
          pageTitle={
            location.pathname === '/cart'
              ? 'Cart'
              : location.pathname === '/checkout'
                ? 'Checkout'
                : undefined
          }
          activeSection={sectionForPath(location.pathname)}
          count={cart.count}
          cartReady={cart.ready}
          onCart={() => {
            void navigate('/cart')
          }}
          searchReady
          productCount={productCount}
        />
        <main ref={main} id="main" className={styles.main} tabIndex={-1}>
          <SectionBoundary
            key={location.pathname}
            retry={async () => {
              retry()
              await revalidator.revalidate()
            }}
          >
            <Outlet />
          </SectionBoundary>
        </main>
        <Footer />
      </div>
    </div>
  )
}

function sectionForPath(path: string): SectionId {
  if (path.startsWith('/products')) return 'products'
  if (path === '/collections') return 'collections'
  if (path === '/insights') return 'catalog-insights'
  if (path === '/community') return 'register'
  return 'hero'
}
