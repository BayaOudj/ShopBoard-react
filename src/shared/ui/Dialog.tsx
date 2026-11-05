import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import styles from './Dialog.module.css'

interface DialogProps {
  id: string
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy?: string
  compact?: boolean
  fallbackFocus?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function Dialog({ id, open, onClose, labelledBy, describedBy, compact = false, fallbackFocus, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const fallback = fallbackFocus?.current
    const previous = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      const target = previous?.isConnected ? previous : fallback
      target?.focus({ preventScroll: true })
    }
  }, [open, fallbackFocus])

  return <dialog ref={ref} id={id} className={`${styles.dialog} ${compact ? styles.compact : ''}`}
    aria-labelledby={labelledBy} aria-describedby={describedBy}
    onCancel={event => { event.preventDefault(); onClose() }}>{children}</dialog>
}
