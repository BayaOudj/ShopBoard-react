import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '../../products/model/products.types'
import { useCart } from './useCart'
import { storageKey } from '../model/cart.persistence'

const products: Product[] = [
  { id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 },
]
interface Props {
  catalog: Product[] | null
}
beforeEach(() => localStorage.clear())

describe('cart restoration and persistence', () => {
  it('waits for a valid nonempty catalog before writing any saved data', async () => {
    const original = JSON.stringify({ 1: 2, '1::Brown': 3 })
    localStorage.setItem(storageKey, original)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const initialProps: Props = { catalog: null }
    const { result, rerender } = renderHook(
      ({ catalog }: Props) => useCart(catalog),
      { initialProps, wrapper: StrictMode },
    )
    expect(result.current.ready).toBe(false)
    expect(write).not.toHaveBeenCalled()
    rerender({ catalog: [] })
    expect(localStorage.getItem(storageKey)).toBe(original)
    expect(write).not.toHaveBeenCalled()
    rerender({ catalog: products })
    expect(result.current.count).toBe(5)
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toEqual({
        '1::Brown': 5,
      }),
    )
    const writes = write.mock.calls.length
    rerender({ catalog: products })
    expect(write).toHaveBeenCalledTimes(writes)
    rerender({ catalog: null })
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toEqual({
      '1::Brown': 5,
    })
  })

  it('does not double-migrate legacy quantities under StrictMode', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ 1: 2, '1::Brown': 3 }))
    const { result } = renderHook(() => useCart(products), {
      wrapper: StrictMode,
    })
    expect(result.current.count).toBe(5)
    act(() => result.current.add(products[0], 'Brown'))
    expect(result.current.count).toBe(6)
    act(() => result.current.setQuantity('1::Brown', 2))
    expect(result.current.subtotal).toBe(178)
    act(() => result.current.remove('1::Brown'))
    expect(result.current.count).toBe(0)
    await waitFor(() => expect(localStorage.getItem(storageKey)).toBe('{}'))
  })

  it('keeps the cart usable when storage is malformed or unavailable', () => {
    localStorage.setItem(storageKey, '{broken')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useCart(products))
    expect(result.current.count).toBe(0)
    act(() => result.current.add(products[0], 'Black'))
    expect(result.current.count).toBe(1)
    expect(result.current.subtotal).toBe(89)
  })

  it('handles denied storage reads without crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError')
    })
    const { result } = renderHook(() => useCart(products))
    expect(result.current.ready).toBe(true)
    expect(result.current.count).toBe(0)
  })
})
