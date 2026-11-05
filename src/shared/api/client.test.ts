// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson } from './client'

beforeEach(() => { vi.stubEnv('VITE_API_BASE_URL', '') })

describe('shared HTTP client', () => {
  it('decodes JSON and forwards the cancellation signal and request headers', async () => {
    const controller = new AbortController()
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ready: true }))
    vi.stubGlobal('fetch', transport)
    expect(await fetchJson('/api/check', { signal: controller.signal, headers: { 'X-Request': 'example' } })).toEqual({ ready: true })
    const [url, options] = transport.mock.calls[0] ?? []
    expect(url).toBe('/api/check')
    expect(options?.signal).toBe(controller.signal)
    const headers = new Headers(options?.headers)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('X-Request')).toBe('example')
  })

  it('joins relative and absolute base URLs without dropping their path prefix', async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([]))
    vi.stubGlobal('fetch', transport)
    vi.stubEnv('VITE_API_BASE_URL', '/backend/')
    await fetchJson('/api/products.json')
    expect(transport.mock.calls[0]?.[0]).toBe('/backend/api/products.json')
    vi.stubEnv('VITE_API_BASE_URL', 'https://catalog.example.test/backend/')
    await fetchJson('/api/products.json')
    expect(transport.mock.calls[1]?.[0]).toBe('https://catalog.example.test/backend/api/products.json')
  })

  it('rejects invalid base configuration before making a request', async () => {
    const transport = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', transport)
    for (const base of ['ftp://catalog.example.test', 'https://user:password@example.test', '/backend?token=example', '//example.test']) {
      vi.stubEnv('VITE_API_BASE_URL', base)
      await expect(fetchJson('/products')).rejects.toThrow()
    }
    expect(transport).not.toHaveBeenCalled()
  })

  it('preserves HTTP status when an error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('<h1>Unavailable</h1>', { status: 503 })))
    await expect(fetchJson('/api/check')).rejects.toMatchObject({ name: 'ApiError', status: 503 })
    expect(new ApiError('Unavailable', 503)).toBeInstanceOf(Error)
  })

  it('handles no-content, HEAD, and empty successful responses', async () => {
    const transport = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 205 }))
      .mockResolvedValueOnce(new Response(''))
      .mockResolvedValueOnce(new Response('not read for a HEAD request'))
    vi.stubGlobal('fetch', transport)
    expect(await fetchJson('/resource')).toBeUndefined()
    expect(await fetchJson('/resource')).toBeUndefined()
    expect(await fetchJson('/resource')).toBeUndefined()
    expect(await fetchJson('/resource', { method: 'HEAD' })).toBeUndefined()
  })

  it('surfaces malformed successful JSON rather than accepting bad data', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('{bad json')))
    await expect(fetchJson('/api/check')).rejects.toBeInstanceOf(SyntaxError)
  })

  it('does not add a JSON content type to uploads or overwrite an explicit Accept header', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ uploaded: true }))
    vi.stubGlobal('fetch', transport)
    const body = new FormData()
    body.append('name', 'example')
    await fetchJson('/upload', { method: 'POST', body, headers: { Accept: 'application/problem+json' } })
    const options = transport.mock.calls[0]?.[1]
    expect(options?.body).toBe(body)
    expect(new Headers(options?.headers).has('Content-Type')).toBe(false)
    expect(new Headers(options?.headers).get('Accept')).toBe('application/problem+json')
  })

  it('propagates network and cancellation errors to the caller', async () => {
    const failure = new TypeError('Network unavailable')
    const aborted = new DOMException('Request aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValueOnce(failure).mockRejectedValueOnce(aborted))
    await expect(fetchJson('/api/check')).rejects.toBe(failure)
    await expect(fetchJson('/api/check')).rejects.toBe(aborted)
  })
})
