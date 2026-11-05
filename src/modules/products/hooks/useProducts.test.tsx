import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProducts } from './useProducts'

const catalog = [{ id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 }]

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

beforeEach(() => { vi.stubEnv('VITE_API_BASE_URL', '') })

describe('React catalog loading', () => {
  it('shows loading until the HTTP response resolves, then exposes validated products', async () => {
    const response = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(response.promise))
    const { result } = renderHook(useProducts)
    expect(result.current.state.status).toBe('loading')
    await act(async () => { response.resolve(Response.json(catalog)) })
    expect(result.current.state).toEqual({ status: 'success', products: catalog })
  })

  it('represents a successfully loaded empty array as the empty state', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json([])))
    const { result } = renderHook(useProducts)
    await waitFor(() => expect(result.current.state.status).toBe('empty'))
  })

  it('retries a failed request and ignores duplicate retry clicks while loading', async () => {
    const retryResponse = deferred<Response>()
    const transport = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('Unavailable', { status: 503 }))
      .mockReturnValueOnce(retryResponse.promise)
    vi.stubGlobal('fetch', transport)
    const { result } = renderHook(useProducts)
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => { result.current.retry(); result.current.retry() })
    expect(result.current.state.status).toBe('loading')
    expect(transport).toHaveBeenCalledTimes(2)
    await act(async () => { retryResponse.resolve(Response.json(catalog)) })
    expect(result.current.state.status).toBe('success')
  })

  it('shows a recoverable error for invalid responses without leaking payloads', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({ unexpected: 'payload' })))
    const { result } = renderHook(useProducts)
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'Could not load products. Please try again.' }))
  })

  it('aborts requests on unmount and safely ignores late network failures', async () => {
    const pending = deferred<Response>()
    const transport = vi.fn<typeof fetch>().mockReturnValue(pending.promise)
    vi.stubGlobal('fetch', transport)
    const { unmount } = renderHook(useProducts)
    const signal = transport.mock.calls[0]?.[1]?.signal
    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
    await act(async () => { pending.reject(new TypeError('Late failure')) })
  })

  it('aborts StrictMode replay requests and prevents stale responses replacing the current catalog', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    const transport = vi.fn<typeof fetch>().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    vi.stubGlobal('fetch', transport)
    const { result } = renderHook(useProducts, { wrapper: StrictMode })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(transport.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    expect(transport.mock.calls[1]?.[1]?.signal?.aborted).toBe(false)
    await act(async () => { second.resolve(Response.json(catalog)) })
    expect(result.current.state).toEqual({ status: 'success', products: catalog })
    await act(async () => { first.resolve(Response.json([])) })
    expect(result.current.state).toEqual({ status: 'success', products: catalog })
  })

  it('does not turn a cancelled StrictMode request into a user-visible error', async () => {
    const current = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'))
      .mockReturnValueOnce(current.promise))
    const { result } = renderHook(useProducts, { wrapper: StrictMode })
    await act(async () => {})
    expect(result.current.state.status).toBe('loading')
    await act(async () => { current.resolve(Response.json(catalog)) })
    expect(result.current.state.status).toBe('success')
  })
})
