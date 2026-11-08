import { getProducts } from './products.api'
import type { Product } from '../model/products.types'

// Created by a router loader or retry action, never by a component render.
export function loadCatalog() {
  let snapshot: Product[] | null = null
  const listeners = new Set<() => void>()
  const promise = getProducts().then((products) => {
    snapshot = products
    listeners.forEach((listener) => listener())
    return products
  })
  void promise.catch(() => {})
  return {
    promise,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
