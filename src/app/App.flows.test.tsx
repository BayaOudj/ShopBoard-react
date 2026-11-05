import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const catalog: unknown = JSON.parse(await readFile(resolve(process.cwd(), 'public/api/products.json'), 'utf8'))
beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.stubEnv('VITE_API_BASE_URL', '')
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async () => Response.json(catalog)))
})

async function start() {
  const user = userEvent.setup()
  const view = render(<StrictMode><App /></StrictMode>)
  await screen.findByRole('article', { name: 'Everyday Tote' })
  return { user, ...view }
}
const region = () => screen.getByRole('region', { name: 'Good things, all in one place.' })

describe('migrated shopping flows', () => {
  it('combines search and category filters and recovers from no matches', async () => {
    const { user } = await start()
    expect(within(region()).getAllByRole('article')).toHaveLength(15)
    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'tote')
    expect(within(region()).getAllByRole('article')).toHaveLength(2)
    await user.click(within(screen.getByRole('group', { name: 'Filter products by category' })).getByRole('button', { name: 'Shoes' }))
    expect(screen.getByRole('heading', { name: 'No products match these filters' })).toBeInTheDocument()
    expect(within(region()).queryByRole('article')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    expect(within(region()).getAllByRole('article')).toHaveLength(15)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('preserves sorting and names-only view while collection and reset actions clear the correct filters', async () => {
    const { user } = await start()
    await user.click(screen.getByRole('checkbox', { name: 'Names only' }))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'expensive')
    await user.click(screen.getByRole('checkbox', { name: 'Under $50' }))
    await user.click(screen.getByRole('button', { name: /^Slow Mornings/ }))
    expect(screen.getByRole('checkbox', { name: 'Under $50' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Names only' })).toBeChecked()
    expect(screen.getByLabelText('Sort by')).toHaveValue('expensive')
    const list = screen.getByRole('list', { name: 'Product names' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getAllByRole('button')[0]).toHaveTextContent('Wool Scarf')
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(within(screen.getByRole('list', { name: 'Product names' })).getAllByRole('listitem')).toHaveLength(15)
    expect(screen.getByLabelText('Sort by')).toHaveValue('expensive')
    expect(screen.getByRole('checkbox', { name: 'Names only' })).toBeChecked()
  })

  it('synchronizes card/detail colors and adds the chosen variant to the persisted cart', async () => {
    const { user } = await start()
    const card = screen.getByRole('article', { name: 'Leather Tote Bag' })
    await user.click(within(card).getByRole('radio', { name: 'Black for Leather Tote Bag' }))
    expect(within(card).getByRole('img')).toHaveAttribute('src', '/images/products/1-black.jpg')
    const trigger = within(card).getByRole('button', { name: 'Leather Tote Bag' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Leather Tote Bag' })
    expect(within(dialog).getByRole('radio', { name: 'Black for Leather Tote Bag' })).toBeChecked()
    await user.click(within(dialog).getByRole('radio', { name: 'Tan for Leather Tote Bag' }))
    expect(within(card).getByRole('radio', { name: 'Tan for Leather Tote Bag' })).toBeChecked()
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/images/products/1-tan.jpg')
    await user.click(within(dialog).getByRole('button', { name: 'Add Leather Tote Bag to cart' }))
    await user.click(within(dialog).getByRole('button', { name: 'Close product details' }))
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Cart 1' })).toBeEnabled()
    await waitFor(() => expect(JSON.parse(localStorage.getItem('shopboard-cart-v1') ?? '{}')).toEqual({ '1::Tan': 1 }))
  })

  it('updates cart quantity, reviews the order, removes the item, and preserves an empty cart', async () => {
    const { user } = await start()
    await user.click(within(screen.getByRole('article', { name: 'Everyday Tote' })).getByRole('button', { name: 'Add Everyday Tote to cart' }))
    await user.click(screen.getByRole('button', { name: 'Cart 1' }))
    const cart = screen.getByRole('dialog', { name: 'Your shopping cart' })
    const quantity = within(cart).getByRole('spinbutton', { name: 'Quantity for Everyday Tote, Sage' })
    fireEvent.change(quantity, { target: { value: '2' } })
    expect(quantity).toHaveValue(2)
    expect(within(cart).getByText('$48')).toBeInTheDocument()
    fireEvent.change(quantity, { target: { value: '0' } })
    expect(quantity).toHaveValue(2)
    await user.click(within(cart).getByRole('button', { name: 'Review order' }))
    expect(within(cart).getByRole('heading', { name: 'Your order review' })).toHaveFocus()
    fireEvent.change(quantity, { target: { value: '3' } })
    expect(within(cart).queryByRole('heading', { name: 'Your order review' })).not.toBeInTheDocument()
    await user.click(within(cart).getByRole('button', { name: 'Remove Everyday Tote, Sage, from cart' }))
    expect(within(cart).getByRole('button', { name: 'Review order' })).toBeDisabled()
    expect(within(cart).getByRole('button', { name: 'Close shopping cart' })).toHaveFocus()
    await waitFor(() => expect(localStorage.getItem('shopboard-cart-v1')).toBe('{}'))
  })

  it('restores and migrates saved carts without double counting under StrictMode', async () => {
    localStorage.setItem('shopboard-cart-v1', JSON.stringify({ 1: 2, '1::Brown': 3, '2::Sage': 1, '1::Purple': 4 }))
    const { user, unmount } = await start()
    expect(screen.getByRole('button', { name: 'Cart 6' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('article', { name: 'Leather Tote Bag' })).getByRole('button', { name: 'Add Leather Tote Bag to cart' }))
    expect(screen.getByRole('button', { name: 'Cart 7' })).toBeInTheDocument()
    await waitFor(() => expect(JSON.parse(localStorage.getItem('shopboard-cart-v1') ?? '{}')).toEqual({ '1::Brown': 6, '2::Sage': 1 }))
    unmount()
    await start()
    expect(screen.getByRole('button', { name: 'Cart 7' })).toBeInTheDocument()
  })

  it('enforces the maximum quantity and handles missing product photos', async () => {
    localStorage.setItem('shopboard-cart-v1', JSON.stringify({ '1::Brown': 99 }))
    const { user } = await start()
    const card = screen.getByRole('article', { name: 'Leather Tote Bag' })
    await user.click(within(card).getByRole('button', { name: 'Add Leather Tote Bag to cart' }))
    expect(screen.getByRole('button', { name: 'Cart 99' })).toBeInTheDocument()
    expect(screen.getByText('Maximum quantity is 99 per product.')).toBeInTheDocument()
    fireEvent.error(within(card).getByRole('img'))
    expect(within(card).getByText('Photo unavailable')).toBeInTheDocument()
  })

  it('renders real catalog analytics and opens product details from the table', async () => {
    const { user } = await start()
    expect(document.getElementById('overview-value')).toHaveTextContent('$931')
    expect(screen.getByRole('img', { name: /Product mix: Bags, 5; Shoes, 4; Accessories, 4/ })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Product prices, categories/ })
    expect(within(table).getAllByRole('row')).toHaveLength(16)
    await user.click(within(table).getByRole('button', { name: 'Silver Watch' }))
    expect(screen.getByRole('dialog', { name: 'Silver Watch' })).toBeInTheDocument()
  })

  it('validates registration as a local demo without making an account request', async () => {
    const { user } = await start()
    const form = screen.getByRole('form', { name: 'Join the ShopBoard community' })
    const requests = vi.mocked(fetch).mock.calls.length
    await user.click(within(form).getByRole('button', { name: 'Create account' }))
    expect(within(form).getByRole('status')).toHaveTextContent('Demo form')
    await user.type(within(form).getByLabelText('Full name'), 'Test Visitor')
    await user.type(within(form).getByLabelText('Email address'), 'test@example.com')
    await user.type(within(form).getByLabelText('Password'), 'sample-password')
    await user.click(within(form).getByRole('button', { name: 'Create account' }))
    expect(within(form).getByRole('status')).toHaveTextContent('Your details passed validation')
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(requests)
    expect(localStorage.getItem('shopboard-cart-v1')).not.toContain('sample-password')
  })
})
