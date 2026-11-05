import { StrictMode } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(() => { /* Keep shell-only tests in the loading state. */ })))
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('React workspace shell', () => {
  it('provides real destinations for every navigation link and the skip link', () => {
    render(<StrictMode><App /></StrictMode>)
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    for (const link of within(navigation).getAllByRole('link')) {
      const id = link.getAttribute('href')?.slice(1)
      expect(id).toBeTruthy()
      expect(document.getElementById(id ?? '')).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your everyday, elevated.')
    expect(screen.queryByRole('button', { name: /Count is/ })).not.toBeInTheDocument()
  })

  it('updates the active navigation and breadcrumb when a section is chosen', async () => {
    const user = userEvent.setup()
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    const products = within(navigation).getByRole('link', { name: 'Products' })
    await user.click(products)
    expect(products).toHaveAttribute('aria-current', 'location')
    expect(within(navigation).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('banner')).toHaveTextContent('Workspace / Products')
    expect(within(navigation).getAllByRole('link').filter(link => link.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('restores navigation from URL changes, including browser back to the page root', async () => {
    window.history.replaceState(null, '', '/#register')
    render(<StrictMode><App /></StrictMode>)
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(navigation).getByRole('link', { name: 'Community' })).toHaveAttribute('aria-current', 'location')
    await act(async () => {
      window.history.replaceState(null, '', '/#collections')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('banner')).toHaveTextContent('Collections')
    await act(async () => {
      window.history.replaceState(null, '', '/')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(within(navigation).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'location')
  })

  it('exposes an accessible native notifications popover and person account link', () => {
    render(<App />)
    const trigger = screen.getByRole('button', { name: 'Workspace notifications' })
    const panelId = trigger.getAttribute('popovertarget')
    const panel = document.getElementById(panelId ?? '')
    expect(panel).toHaveAttribute('popover', 'auto')
    expect(panel).toHaveTextContent('This demo has no live order or account notifications.')
    expect(screen.getByRole('button', { name: 'Dismiss', hidden: true })).toHaveAttribute('popovertarget', panelId)
    expect(screen.getByRole('link', { name: 'Join Shopboard' })).toHaveAttribute('href', '#register')
  })

  it('keeps shopping disabled until the catalog is loaded, while community is available', () => {
    render(<App />)
    expect(screen.queryByText('Coming next')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cart 0' })).toBeDisabled()
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeDisabled()
    expect(screen.getByRole('form', { name: 'Join the ShopBoard community' })).toBeInTheDocument()
  })

  it('loads the catalog through the app owner and enables shopping', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async () => Response.json([
      { id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 },
    ])))
    render(<StrictMode><App /></StrictMode>)
    expect(await screen.findByRole('article', { name: 'Leather Tote Bag' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cart 0' })).toBeEnabled()
  })

})
