// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { loadCatalog } from './catalog.resource'
const product = { id: 1, name: 'Tote', category: 'Bags', price: 89 }

describe('catalog resource', () => {
  it('owns one request and notifies subscribers when validated data arrives', async () => {
    let complete: (response: Response) => void = () => {
      throw Error('Request not started')
    }
    const request = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve
        }),
    )
    vi.stubGlobal('fetch', request)
    const resource = loadCatalog()
    const listener = vi.fn()
    resource.subscribe(listener)
    expect(resource.getSnapshot()).toBeNull()
    complete(Response.json([product]))
    expect(await resource.promise).toEqual([product])
    expect(resource.getSnapshot()).toEqual([product])
    expect(listener).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledOnce()
  })
  it('does not notify a retired subscriber or replace a newer resource', async () => {
    let complete: (response: Response) => void = () => {
      throw Error('Request not started')
    }
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              complete = resolve
            }),
        )
        .mockResolvedValue(Response.json([])),
    )
    const old = loadCatalog()
    const listener = vi.fn()
    const unsubscribe = old.subscribe(listener)
    unsubscribe()
    const current = loadCatalog()
    await current.promise
    complete(Response.json([product]))
    await old.promise
    expect(current.getSnapshot()).toEqual([])
    expect(listener).not.toHaveBeenCalled()
  })
  it('distinguishes failed data from an empty successful result', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('', { status: 500 }))
        .mockResolvedValue(Response.json([])),
    )
    const failed = loadCatalog()
    await expect(failed.promise).rejects.toMatchObject({ status: 500 })
    expect(failed.getSnapshot()).toBeNull()
    const empty = loadCatalog()
    await expect(empty.promise).resolves.toEqual([])
    expect(empty.getSnapshot()).toEqual([])
  })
})
