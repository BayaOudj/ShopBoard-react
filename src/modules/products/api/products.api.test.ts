// @vitest-environment node
import { access, readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProducts } from './products.api'
import { COLLECTIONS } from '../model/products.collections'
import { getColors } from '../model/products.colors'
import { getProductImage } from '../model/products.images'

const catalog: unknown = JSON.parse(await readFile(new URL('../../../../public/api/products.json', import.meta.url), 'utf8'))
const sample = { id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 }
beforeEach(() => { vi.stubEnv('VITE_API_BASE_URL', '') })

describe('validated product API', () => {
  it('preserves the real catalog, collection membership, and every color image', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(catalog)))
    const products = await getProducts()
    expect(products).toEqual(catalog)
    expect(products).toHaveLength(15)
    expect(products.reduce((sum, product) => sum + product.price, 0)).toBe(931)
    for (const collection of COLLECTIONS) {
      expect(collection.productIds.every(id => products.some(product => product.id === id))).toBe(true)
    }
    for (const product of products) {
      for (const color of getColors(product)) {
        const image = getProductImage(product, color)
        await access(new URL(`../../../../public${image.src}`, import.meta.url))
        expect(image.alt).toContain(product.name)
        expect(image.alt).toContain(color)
      }
    }
  })

  it('accepts an empty array as a valid catalog', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json([])))
    expect(await getProducts()).toEqual([])
  })

  it('rejects incorrect shapes and invalid domain fields', async () => {
    for (const body of [null, { products: [sample] }, [{}], [{ ...sample, price: '89' }], [{ ...sample, price: -1 }], [{ ...sample, id: '' }], [{ ...sample, name: '' }], [{ ...sample, description: 12 }]]) {
      vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)))
      await expect(getProducts()).rejects.toThrow('invalid product data')
    }
  })

  it('rejects numeric/string ID collisions that would break saved cart keys', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json([sample, { ...sample, id: '1' }])))
    await expect(getProducts()).rejects.toThrow('duplicate product IDs')
  })

  it('does not interpret an empty HTTP body as an empty product array', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(getProducts()).rejects.toThrow('invalid product data')
  })

  it('forwards the caller signal and propagates HTTP errors for retry', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('Unavailable', { status: 503 }))
    vi.stubGlobal('fetch', transport)
    const controller = new AbortController()
    await expect(getProducts(controller.signal)).rejects.toMatchObject({ status: 503 })
    expect(transport.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })
})
