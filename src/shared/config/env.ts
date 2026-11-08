export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
  if (!configured) return ''
  if (configured.includes('?') || configured.includes('#')) {
    throw new Error('API base URL must not contain a query or fragment.')
  }
  if (configured.startsWith('/') && !configured.startsWith('//')) {
    return configured.replace(/\/+$/, '')
  }
  const url = new URL(configured)
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'API base URL must be an HTTP(S) URL without embedded credentials.',
    )
  }
  return configured.replace(/\/+$/, '')
}
