import styles from './Brand.module.css'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`${styles.brand} ${compact ? styles.compact : ''}`} href="#hero" aria-label="Shopboard home">
      {!compact && <span className={styles.mark} aria-hidden="true">▦</span>}
      shopboard<span className={styles.period}>.</span>
    </a>
  )
}
