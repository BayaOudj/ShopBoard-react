import { useCallback, useEffect, useRef, useState } from 'react'
import { getProducts } from '../api/products.api'
import type { LoadState } from '../model/products.types'

export function useProducts() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const requestPending = useRef(true)

  useEffect(() => {
    const controller = new AbortController()
    requestPending.current = true

    void getProducts(controller.signal).then(products => {
      if (!controller.signal.aborted) {
        setState(products.length ? { status: 'success', products } : { status: 'empty' })
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setState({ status: 'error', message: 'Could not load products. Please try again.' })
      }
    }).finally(() => {
      if (!controller.signal.aborted) requestPending.current = false
    })

    return () => {
      controller.abort()
    }
  }, [attempt])

  const retry = useCallback(() => {
    if (requestPending.current) return
    requestPending.current = true
    setState({ status: 'loading' })
    setAttempt(previous => previous + 1)
  }, [])

  return { state, retry }
}
