import { Link } from 'react-router-dom'
import styles from './Brand.module.css'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className={`${styles.brand} ${compact ? styles.compact : ''}`}
      to="/"
      aria-label="Shopboard home"
    >
      {!compact && (
        <span className={styles.mark} aria-hidden="true">
          ▦
        </span>
      )}
      shopboard<span className={styles.period}>.</span>
    </Link>
  )
}
