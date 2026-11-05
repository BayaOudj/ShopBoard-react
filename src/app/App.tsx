import { useRef, useState } from 'react'
import { CatalogSection } from '../modules/products/components/CatalogSection'
import { CollectionsSection } from '../modules/products/components/CollectionsSection'
import { ProductDetails } from '../modules/products/components/ProductDetails'
import { useProducts } from '../modules/products/hooks/useProducts'
import { useCatalogFilters } from '../modules/products/hooks/useCatalogFilters'
import { getColors, variantKey } from '../modules/products/model/products.colors'
import type { Collection, Product } from '../modules/products/model/products.types'
import { useCart } from '../modules/cart/hooks/useCart'
import { CartDialog } from '../modules/cart/components/CartDialog'
import { DashboardOverview } from '../modules/dashboard/components/DashboardOverview'
import { CatalogInsights } from '../modules/dashboard/components/CatalogInsights'
import { RegistrationSection } from '../modules/registration/components/RegistrationSection'
import { Toast } from '../shared/ui/Toast'
import { useToast } from '../shared/ui/useToast'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Sidebar } from './components/Sidebar'
import { useSectionNavigation } from './hooks/useSectionNavigation'
import { useProductSearchShortcut } from './hooks/useProductSearchShortcut'
import styles from './App.module.css'

const emptyProducts: Product[] = []

export default function App() {
  const catalog = useProducts()
  const products = catalog.state.status === 'success' ? catalog.state.products : emptyProducts
  const loaded = catalog.state.status === 'success' || catalog.state.status === 'empty'
  const controls = useCatalogFilters()
  const cart = useCart(catalog.state.status === 'success' ? products : null)
  const toast = useToast()
  const search = useRef<HTMLInputElement>(null)
  const firstCategory = useRef<HTMLButtonElement>(null)
  const catalogElement = useRef<HTMLElement>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const { activeSection, navigate, registerSection } = useSectionNavigation()
  useProductSearchShortcut(search, selectedProduct !== null || cartOpen)

  const colorFor = (product: Product) => Object.hasOwn(selectedColors, String(product.id)) ? selectedColors[String(product.id)] : getColors(product)[0]
  const changeColor = (product: Product, color: string) => {
    if (getColors(product).includes(color)) setSelectedColors(current => ({ ...current, [String(product.id)]: color }))
  }
  const addProduct = (product: Product, color: string) => {
    if (!cart.ready) return
    if ((cart.cart[variantKey(product, color)] ?? 0) >= 99) { toast.notify('Maximum quantity is 99 per product.'); return }
    cart.add(product, color)
    toast.notify(`${product.name} (${color}) added to your cart. ${cart.count + 1} items in total.`)
  }
  const chooseCollection = (collection: Collection) => {
    controls.selectCollection(collection)
    navigate('products')
    catalogElement.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    firstCategory.current?.focus({ preventScroll: true })
  }

  return <div className={styles.shell}>
    <a className={styles.skipLink} href="#main">Skip to content</a>
    <Sidebar activeSection={activeSection} onNavigate={navigate} />
    <div className={styles.workspace}>
      <Header activeSection={activeSection} count={cart.count} cartReady={cart.ready} onCart={() => setCartOpen(true)} searchReady={catalog.state.status === 'success'} productCount={loaded ? products.length : null} />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Hero sectionRef={registerSection('hero')} />
        <DashboardOverview products={products} loaded={loaded} />
        <CollectionsSection sectionRef={registerSection('collections')} selectedId={controls.filters.collection?.id} disabled={!cart.ready} onSelect={chooseCollection} />
        <CatalogSection categoryRef={firstCategory} sectionRef={element => { catalogElement.current = element; registerSection('products')(element) }} state={catalog.state} onRetry={catalog.retry} searchRef={search} controls={controls} colorFor={colorFor} onColor={changeColor} onAdd={addProduct} onDetails={setSelectedProduct} cartReady={cart.ready} />
        <CatalogInsights sectionRef={registerSection('catalog-insights')} products={products} loaded={loaded} onDetails={setSelectedProduct} />
        <RegistrationSection sectionRef={registerSection('register')} />
      </main>
      <Footer />
    </div>
    <Toast message={toast.message} />
    <ProductDetails product={selectedProduct} color={selectedProduct ? colorFor(selectedProduct) : ''} onColor={changeColor} onAdd={addProduct} onClose={() => setSelectedProduct(null)} fallbackFocus={search} cartReady={cart.ready} />
    <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} items={cart.items} subtotal={cart.subtotal} onQuantity={cart.setQuantity} onRemove={item => { cart.remove(item.id); toast.notify(`${item.product.name} (${item.color}) removed from your cart.`) }} />
  </div>
}
