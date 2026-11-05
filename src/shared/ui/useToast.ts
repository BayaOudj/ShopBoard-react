import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notify = useCallback((text: string) => {
    if (timer.current !== null) clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(''), 4500)
  }, [])
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
  return { message, notify }
}
