import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderShop as renderApp } from '../test/renderShop'
const catalog: unknown = JSON.parse(
  await readFile(resolve(process.cwd(), 'public/api/products.json'), 'utf8'),
)
beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/products')
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).includes('/products/1.json') && Array.isArray(catalog))
        return Response.json(
          catalog.find(
            (item: unknown) =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              item.id === 1,
          ),
        )
      return Response.json(catalog)
    }),
  )
})
async function start() {
  const user = userEvent.setup()
  const view = renderApp()
  await screen.findByRole('article', { name: 'Everyday Tote' })
  return { user, ...view }
}
const nav = () => screen.getByRole('navigation', { name: 'Main navigation' })
describe('routed shopping flows', () => {
  it('combines filters, recovers from no matches, and retains sort/view on reset', async () => {
    const { user } = await start()
    await user.type(screen.getByRole('searchbox'), 'tote')
    expect(screen.getAllByRole('article')).toHaveLength(2)
    await user.click(screen.getByLabelText('Names only'))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'expensive')
    await user.click(
      within(
        screen.getByRole('group', { name: 'Filter products by category' }),
      ).getByRole('button', { name: 'Shoes' }),
    )
    expect(
      screen.getByRole('heading', { name: 'No products match these filters' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Collection controls' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Names only')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Under $50')).not.toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0],
    )
    expect(
      screen.getByRole('group', { name: 'Collection controls' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByLabelText('Names only')).toBeChecked()
    expect(screen.getByLabelText('Sort by')).toHaveValue('expensive')
    expect(
      within(screen.getByRole('list', { name: 'Product names' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(15)
  })
  it('shares colors and cart across product routes, community, and refresh', async () => {
    const { user, unmount } = await start()
    const card = screen.getByRole('article', { name: 'Leather Tote Bag' })
    await user.click(
      within(card).getByRole('radio', { name: 'Black for Leather Tote Bag' }),
    )
    await user.click(
      within(card).getByRole('button', { name: 'Leather Tote Bag' }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Leather Tote Bag',
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: 'Black for Leather Tote Bag' }),
    ).toBeChecked()
    await user.click(
      screen.getByRole('button', { name: 'Add Leather Tote Bag to cart' }),
    )
    await user.click(within(nav()).getByRole('link', { name: 'Community' }))
    expect(
      await screen.findByRole('form', { name: 'Join the ShopBoard community' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cart 1' })).toBeInTheDocument()
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('shopboard-cart-v1') ?? '{}'),
      ).toEqual({ '1::Black': 1 }),
    )
    unmount()
    window.history.replaceState(null, '', '/cart')
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Leather Tote Bag · Black' }),
    ).toBeInTheDocument()
    const quantity = screen.getByRole('spinbutton')
    fireEvent.change(quantity, { target: { value: '2' } })
    expect(quantity).toHaveValue(2)
    fireEvent.change(quantity, { target: { value: '0' } })
    expect(quantity).toHaveValue(2)
    await user.click(
      screen.getByRole('button', { name: 'Remove Leather Tote Bag, Black' }),
    )
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument()
  })
  it('migrates legacy storage once and respects the quantity limit', async () => {
    localStorage.setItem(
      'shopboard-cart-v1',
      JSON.stringify({ 1: 2, '1::Brown': 97, '1::Purple': 9 }),
    )
    const { user } = await start()
    expect(screen.getByRole('button', { name: 'Cart 99' })).toBeInTheDocument()
    await user.click(
      within(
        screen.getByRole('article', { name: 'Leather Tote Bag' }),
      ).getByRole('button', { name: 'Add Leather Tote Bag to cart' }),
    )
    expect(
      screen.getByText('Maximum quantity is 99 per product.'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('shopboard-cart-v1') ?? '{}'),
      ).toEqual({ '1::Brown': 99 }),
    )
  })
  it('validates checkout, focuses the first invalid field, and completes without sending personal information', async () => {
    localStorage.setItem('shopboard-cart-v1', JSON.stringify({ '1::Brown': 1 }))
    window.history.replaceState(null, '', '/checkout')
    const user = userEvent.setup()
    renderApp()
    const form = await screen.findByRole('form', { name: 'Checkout' })
    await user.click(
      within(form).getByRole('button', { name: 'Complete demo checkout' }),
    )
    expect(
      await screen.findByText('Enter your full name (at least 2 characters).'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveFocus()
    expect(screen.getByLabelText('Full name')).toHaveAttribute(
      'aria-describedby',
      'name-error',
    )
    for (const [label, value] of [
      ['Full name', 'Test Buyer'],
      ['Email', 'test@example.com'],
      ['Street address', '123 Sample Street'],
      ['City', 'Istanbul'],
      ['Postal code', '34000'],
      ['Country', 'Türkiye'],
    ])
      await user.type(screen.getByLabelText(label), value)
    const requests = vi.mocked(fetch).mock.calls.length
    await user.click(
      within(form).getByRole('button', { name: 'Complete demo checkout' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Demo checkout complete' }),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(requests)
    expect(localStorage.getItem('shopboard-cart-v1')).not.toContain(
      'Sample Street',
    )
  })
  it('handles empty catalogs distinctly from no matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json([])),
    )
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'No products yet' }),
    ).toBeInTheDocument()
  })
  it('recovers from a catalog failure without overwriting saved carts', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('shopboard-cart-v1', '{"1::Brown":2}')
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockRejectedValueOnce(new Error('Offline'))
        .mockImplementation(async (input) => {
          if (
            String(input).includes('/products/1.json') &&
            Array.isArray(catalog)
          )
            return Response.json(
              catalog.find(
                (item: unknown) =>
                  typeof item === 'object' &&
                  item !== null &&
                  'id' in item &&
                  item.id === 1,
              ),
            )
          return Response.json(catalog)
        }),
    )
    const user = userEvent.setup()
    renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This section could not load',
    )
    expect(localStorage.getItem('shopboard-cart-v1')).toBe('{"1::Brown":2}')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('article', { name: 'Everyday Tote' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cart 2' })).toBeInTheDocument()
    spy.mockRestore()
  })
})

it('retries a failed individual product request within the shared shell', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  let attempts = 0
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).includes('/products/1.json')) {
        attempts += 1
        if (attempts === 1) return new Response('', { status: 503 })
        return Response.json({
          id: 1,
          name: 'Leather Tote Bag',
          category: 'Bags',
          price: 89,
        })
      }
      return Response.json(catalog)
    }),
  )
  window.history.replaceState(null, '', '/products/1')
  const user = userEvent.setup()
  renderApp()
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(
    screen.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Leather Tote Bag' }),
  ).toBeInTheDocument()
  expect(attempts).toBe(2)
  spy.mockRestore()
})
