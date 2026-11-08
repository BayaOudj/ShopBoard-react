import { getApiBaseUrl } from '../config/env'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function resolveApiUrl(path: string | URL): string {
  const value = String(path)
  if (/^https?:\/\//.test(value)) return value
  const base = getApiBaseUrl()
  return base ? `${base}/${value.replace(/^\/+/, '')}` : value
}

// Transport returns unknown. Feature APIs validate data before exposing domain types.
export async function fetchJson(
  path: string | URL,
  options: RequestInit = {},
): Promise<unknown> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  const response = await fetch(resolveApiUrl(path), { ...options, headers })
  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`.trim(),
      response.status,
    )
  }
  if (
    response.status === 204 ||
    response.status === 205 ||
    options.method?.toUpperCase() === 'HEAD'
  ) {
    return undefined
  }
  const body = await response.text()
  if (!body.trim()) return undefined
  const data: unknown = JSON.parse(body)
  return data
}
