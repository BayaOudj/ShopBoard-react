import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useProductSearchShortcut(search: RefObject<HTMLInputElement | null>, dialogOpen: boolean) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (dialogOpen || event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey ||
        target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) return
      if (!search.current || search.current.disabled) return
      event.preventDefault()
      search.current.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [search, dialogOpen])
}
