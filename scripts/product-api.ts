import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

interface DemoRequest {
  path: string
  delay: number
  failure: number | null
  empty: boolean
}

export function parseDemoRequest(path: string): DemoRequest | null {
  const delay = /^\/delay\/(\d+)(\/api\/.*)$/.exec(path)
  const failure = /^\/fail\/(\d+)(\/api\/.*)$/.exec(path)
  const empty = path.startsWith('/empty/api/')
  const apiPath =
    delay?.[2] ?? failure?.[2] ?? (empty ? path.slice('/empty'.length) : path)
  if (!/^\/api\/products(?:\/[^/]+)?\.json$/.test(apiPath)) return null
  const status = failure ? Number(failure[1]) : null
  if (status !== null && (status < 400 || status > 599)) return null
  const milliseconds = Number(delay?.[1] ?? 0)
  if (milliseconds > 10_000) return null
  return { path: apiPath, delay: milliseconds, failure: status, empty }
}

// These explicitly local test controls are shared by dev and production preview.
// Production output contains only the normal catalog and product JSON assets.
export function productApi(): Plugin {
  async function entries() {
    const data: unknown = JSON.parse(
      await readFile(
        new URL('../public/api/products.json', import.meta.url),
        'utf8',
      ),
    )
    if (!Array.isArray(data)) throw new Error('Invalid demo catalog')
    return data.map((product: unknown) => {
      if (
        !product ||
        typeof product !== 'object' ||
        !('id' in product) ||
        (typeof product.id !== 'string' && typeof product.id !== 'number')
      )
        throw new Error('Invalid product ID')
      return {
        file: `api/products/${encodeURIComponent(product.id)}.json`,
        product,
        body: JSON.stringify(product),
      }
    })
  }

  async function respond(request: DemoRequest, response: ServerResponse) {
    const products = await entries()
    const product = products.find((item) => `/${item.file}` === request.path)
    const catalog = request.path === '/api/products.json'
    const status =
      request.failure ?? (catalog || (product && !request.empty) ? 200 : 404)
    const body = request.failure
      ? { message: `Demo HTTP ${status}` }
      : catalog
        ? request.empty
          ? []
          : products.map((item) => item.product)
        : request.empty || !product
          ? { message: 'Product not found' }
          : product.product
    const send = () => {
      if (response.destroyed) return
      response.statusCode = status
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Cache-Control', 'no-store')
      response.end(JSON.stringify(body))
    }
    if (request.delay) {
      const timer = setTimeout(send, request.delay)
      response.once('close', () => clearTimeout(timer))
    } else send()
  }

  const middleware = (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const parsed = parseDemoRequest(request.url?.split('?')[0] ?? '')
    if (!parsed) {
      next()
      return
    }
    void respond(parsed, response).catch(next)
  }

  return {
    name: 'shopboard-static-product-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
    async generateBundle() {
      for (const product of await entries())
        this.emitFile({
          type: 'asset',
          fileName: product.file,
          source: product.body,
        })
    },
  }
}
