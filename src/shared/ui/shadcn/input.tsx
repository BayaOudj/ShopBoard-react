// Adapted from shadcn/ui Input (MIT), styled with the project's CSS Modules.
import type { ComponentProps } from 'react'
import styles from './controls.module.css'
export function Input({
  className = '',
  type,
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={`${styles.input} ${className}`}
      {...props}
    />
  )
}
