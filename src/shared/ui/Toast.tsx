import styles from './Toast.module.css'
export function Toast({ message }: { message: string }) {
  return (
    <p
      id="cart-status"
      role="status"
      aria-live="polite"
      className={message ? styles.toast : 'sr-only'}
    >
      {message}
    </p>
  )
}
