import { useEffect, useRef } from 'react'
import type { Ref, RefObject } from 'react'
import type { LoadState } from '../model/products.types'
import { CATEGORIES } from '../model/products.collections'
import { selectProducts } from '../model/products.logic'
import type { useCatalogFilters } from '../hooks/useCatalogFilters'
import { CatalogFeedback } from './CatalogFeedback'
import { Link } from 'react-router-dom'
import { ProductCard } from './ProductCard'
import { money } from '../../../shared/lib/money'
import styles from './Products.module.css'

export interface CatalogSectionProps {
  state: LoadState
  onRetry: () => void
  sectionRef: Ref<HTMLElement>
  searchRef: RefObject<HTMLInputElement | null>
  controls: ReturnType<typeof useCatalogFilters>
  categoryRef?: RefObject<HTMLButtonElement | null>
}

export function CatalogSection({
  state,
  onRetry,
  sectionRef,
  searchRef,
  controls,
  categoryRef,
}: CatalogSectionProps) {
  const localCategory = useRef<HTMLButtonElement>(null)
  const firstCategory = categoryRef ?? localCategory
  const retryFocus = useRef(false)
  const { filters, namesOnly, setNamesOnly, updateFilters, resetFilters } =
    controls
  const ready = state.status === 'success' && state.products.length > 0
  useEffect(() => {
    if (ready && retryFocus.current) {
      retryFocus.current = false
      firstCategory.current?.focus({ preventScroll: true })
    }
  }, [ready, firstCategory])
  const products = state.status === 'success' ? state.products : []
  const visible = selectProducts(products, filters)
  const hasFilters = Boolean(
    filters.collection ||
    filters.category !== 'All' ||
    filters.query ||
    filters.underFifty,
  )
  const clearFilters = () => {
    resetFilters()
    firstCategory.current?.focus({ preventScroll: true })
  }
  return (
    <section
      id="products"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="products-title"
      aria-busy={state.status === 'loading'}
      data-load-state={state.status}
      tabIndex={-1}
    >
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>THE SHOPBOARD EDIT</p>
          <h2 id="products-title">Good things, all in one place.</h2>
        </div>
        <p>{products.length} good finds. AI-generated product previews.</p>
      </div>
      <div
        id="category-filters"
        className={styles.categoryFilters}
        role="group"
        aria-label="Filter products by category"
      >
        {['All', ...CATEGORIES].map((category, index) => (
          <button
            ref={index === 0 ? firstCategory : undefined}
            key={category}
            type="button"
            data-category={category}
            aria-pressed={filters.category === category}
            disabled={!ready}
            onClick={() => updateFilters({ category })}
          >
            {category === 'All' ? 'Shop all' : category}
          </button>
        ))}
      </div>
      <div className={styles.activeFilters}>
        <p id="active-collection">
          {filters.collection
            ? `Collection: ${filters.collection.name}`
            : 'Browsing all collections'}
        </p>
        {ready && hasFilters && (
          <button id="reset-filters" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
      <form
        id="product-search"
        className={styles.search}
        role="search"
        aria-label="Search collection"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="search-products">Search products</label>
        <div className={styles.searchField}>
          <input
            ref={searchRef}
            id="search-products"
            type="search"
            name="q"
            placeholder="Search all products…"
            autoComplete="off"
            aria-controls="catalog-grid product-names"
            disabled={!ready}
            value={filters.query}
            onChange={(event) =>
              updateFilters({ query: event.currentTarget.value })
            }
          />
          <button
            id="clear-search"
            type="button"
            disabled={!ready || !filters.query}
            onClick={() => {
              updateFilters({ query: '' })
              searchRef.current?.focus()
            }}
          >
            Clear
          </button>
        </div>
      </form>
      {ready && visible.length > 0 && (
        <div
          className={styles.catalogControls}
          role="group"
          aria-label="Collection controls"
        >
          <label className={styles.option}>
            <input
              id="names-only"
              type="checkbox"
              checked={namesOnly}
              disabled={!ready}
              onChange={(event) => setNamesOnly(event.currentTarget.checked)}
            />
            Names only
          </label>
          <label className={styles.option}>
            <input
              id="under-fifty"
              type="checkbox"
              checked={filters.underFifty}
              disabled={!ready}
              onChange={(event) =>
                updateFilters({ underFifty: event.currentTarget.checked })
              }
            />
            Under $50
          </label>
          <div className={styles.sort}>
            <label htmlFor="product-sort">Sort by</label>
            <select
              id="product-sort"
              disabled={!ready}
              value={filters.sort}
              onChange={(event) =>
                updateFilters({
                  sort:
                    event.currentTarget.value === 'expensive'
                      ? 'expensive'
                      : event.currentTarget.value === 'original'
                        ? 'original'
                        : 'cheapest',
                })
              }
            >
              <option value="cheapest">Price: low to high</option>
              <option value="expensive">Price: high to low</option>
              <option value="original">Featured order</option>
            </select>
          </div>
        </div>
      )}
      {(!ready || visible.length === 0) && (
        <CatalogFeedback
          state={state}
          onRetry={() => {
            retryFocus.current = true
            onRetry()
          }}
          visibleCount={visible.length}
          onClearFilters={clearFilters}
        />
      )}
      {ready && (
        <p id="catalog-summary" className={styles.summary} role="status">
          {visible.length} of {products.length} products · Shown total:{' '}
          {money(visible.reduce((sum, product) => sum + product.price, 0))} ·
          All products total:{' '}
          {money(products.reduce((sum, product) => sum + product.price, 0))}
        </p>
      )}
      {ready && !namesOnly && visible.length > 0 && (
        <div
          id="catalog-grid"
          className={styles.grid}
          aria-labelledby="products-title"
        >
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      {ready && namesOnly && visible.length > 0 && (
        <ul
          id="product-names"
          className={styles.names}
          aria-label="Product names"
        >
          {visible.map((product) => (
            <li key={product.id}>
              <Link
                className={styles.nameButton}
                aria-label={`View details for ${product.name}`}
                to={`/products/${encodeURIComponent(product.id)}`}
              >
                {product.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
