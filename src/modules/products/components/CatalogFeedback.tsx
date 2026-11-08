import { useRef } from 'react'
import type { LoadState } from '../model/products.types'
import styles from './CatalogFeedback.module.css'

interface CatalogFeedbackProps {
  state: LoadState
  onRetry: () => void
  visibleCount?: number
  onClearFilters?: () => void
}

export function CatalogFeedback({
  state,
  onRetry,
  visibleCount,
  onClearFilters,
}: CatalogFeedbackProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  let title: string
  let message: string
  const empty =
    state.status === 'empty' ||
    (state.status === 'success' && state.products.length === 0)
  const noMatches =
    state.status === 'success' &&
    state.products.length > 0 &&
    visibleCount === 0

  if (state.status === 'loading') {
    title = 'Loading products…'
    message = 'Your collection is on its way.'
  } else if (state.status === 'error') {
    title = 'Products could not be loaded'
    message = state.message
  } else if (empty) {
    title = 'No products yet'
    message = 'Check back soon for new additions to the collection.'
  } else if (noMatches) {
    title = 'No products match these filters'
    message = 'Try another search or clear your filters to see all products.'
  } else {
    const count = state.status === 'success' ? state.products.length : 0
    title = `${count} ${count === 1 ? 'product' : 'products'} loaded`
    message = 'Browse the collection and find your everyday essentials.'
  }

  return (
    <div className={styles.panel}>
      <div role="status" aria-live="polite" aria-atomic="true">
        <h3 ref={heading} tabIndex={-1}>
          {title}
        </h3>
        <p>{message}</p>
      </div>
      {state.status === 'error' && (
        <button
          id="retry-products"
          className={styles.action}
          type="button"
          onClick={() => {
            heading.current?.focus({ preventScroll: true })
            onRetry()
          }}
        >
          Try again
        </button>
      )}
      {noMatches && onClearFilters && (
        <button
          className={styles.action}
          type="button"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
