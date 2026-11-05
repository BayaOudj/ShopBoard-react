import { Brand } from './Brand'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Brand compact />
      <p>A little more intention. A little more everyday joy.</p>
      <small>© 2026 Shopboard</small>
    </footer>
  )
}
