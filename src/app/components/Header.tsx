import { Link } from 'react-router-dom'
import { useId } from 'react'
import { PersonIcon } from '../../shared/ui/PersonIcon'
import { navigation } from '../navigation'
import type { SectionId } from '../navigation'
import styles from './Header.module.css'

export function Header({
  activeSection,
  count,
  cartReady,
  onCart,
  searchReady,
  productCount,
  pageTitle,
}: {
  pageTitle?: string
  activeSection: SectionId
  count: number
  cartReady: boolean
  onCart: () => void
  searchReady: boolean
  productCount: number | null
}) {
  const noticeId = useId()
  const titleId = useId()
  const current =
    pageTitle ??
    navigation.find((item) => item.id === activeSection)?.label ??
    'Overview'

  return (
    <>
      <header className={styles.header}>
        <span className={styles.location}>
          <span className={styles.workspaceLabel}>
            Workspace{' '}
            <span className={styles.separator} aria-hidden="true">
              /
            </span>{' '}
          </span>
          <strong>{current}</strong>
        </span>
        <div className={styles.actions}>
          <Link
            className={styles.search}
            to="/products#search-products"
            aria-disabled={!searchReady}
            onClick={(event) => {
              if (!searchReady) event.preventDefault()
            }}
          >
            <span aria-hidden="true">⌕</span> Search products <kbd>/</kbd>
          </Link>
          <button
            className={styles.notification}
            type="button"
            popoverTarget={noticeId}
            aria-label="Workspace notifications"
          >
            <span aria-hidden="true">♧</span>
            <span className={styles.dot} />
          </button>
          <button
            id="open-cart"
            className={styles.cart}
            type="button"
            disabled={!cartReady}
            onClick={onCart}
          >
            Cart <span id="cart-count">{count}</span>
          </button>
          <Link
            className={styles.avatar}
            to="/community"
            aria-label="Join Shopboard"
          >
            <PersonIcon />
          </Link>
        </div>
      </header>
      <aside
        className={styles.notices}
        id={noticeId}
        popover="auto"
        aria-labelledby={titleId}
      >
        <h2 id={titleId}>You&apos;re all caught up</h2>
        <p>
          {productCount === null
            ? 'Your catalog is loading.'
            : `Explore ${productCount} thoughtfully selected products and three collections.`}
        </p>
        <p className={styles.muted}>
          This demo has no live order or account notifications.
        </p>
        <button
          className={styles.dismiss}
          type="button"
          popoverTarget={noticeId}
          popoverTargetAction="hide"
        >
          Dismiss
        </button>
      </aside>
    </>
  )
}
