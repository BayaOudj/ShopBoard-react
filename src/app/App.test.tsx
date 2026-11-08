import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderShop as renderApp } from '../test/renderShop'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const product = {
        id: 1,
        name: 'Leather Tote Bag',
        category: 'Bags',
        price: 89,
      }
      return Response.json(
        String(input).includes('/products/') ? product : [product],
      )
    }),
  )
})
describe('multi-page shell', () => {
  it('keeps the shell and overview available while catalog metrics suspend', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockImplementation(() => new Promise<Response>(() => {})),
    )
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Your everyday, elevated.' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('status'),
    ).toHaveTextContent('Loading this section')
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Skip to content' }),
    ).toHaveAttribute('href', '#main')
  })
  it('navigates between lazy pages and retains one catalog request', async () => {
    const user = userEvent.setup()
    renderApp()
    const nav = await screen.findByRole('navigation', {
      name: 'Main navigation',
    })
    await user.click(within(nav).getByRole('link', { name: 'Products' }))
    expect(
      await screen.findByRole('article', { name: 'Leather Tote Bag' }),
    ).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(within(nav).getByRole('link', { name: 'Community' }))
    expect(
      await screen.findByRole('form', { name: 'Join the ShopBoard community' }),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('renders 404 within the shared shell', async () => {
    window.history.replaceState(null, '', '/missing')
    renderApp()
    expect(
      await screen.findByRole('heading', { name: '404 — Page not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument()
  })
  it('loads one product selected by the URL ID and handles missing products', async () => {
    window.history.replaceState(null, '', '/products/1')
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Leather Tote Bag' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add Leather Tote Bag to cart' }),
    ).toBeInTheDocument()
  })
  it('keeps community usable when catalog requests fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('Offline')),
    )
    window.history.replaceState(null, '', '/community')
    renderApp()
    expect(
      await screen.findByRole('form', { name: 'Join the ShopBoard community' }),
    ).toBeInTheDocument()
  })
})
