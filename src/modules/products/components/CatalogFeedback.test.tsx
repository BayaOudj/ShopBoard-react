import { MemoryRouter } from 'react-router-dom'
import { ShopProvider } from '../ShopProvider'
import { useRef } from 'react'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import type { LoadState } from '../model/products.types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogFeedback } from './CatalogFeedback'
import { CatalogSection } from './CatalogSection'

const products = [
  { id: 1, name: 'Leather Tote Bag', category: 'Bags', price: 89 },
]

function Harness({ state }: { state: LoadState }) {
  const controls = useCatalogFilters()
  const search = useRef<HTMLInputElement>(null)
  return (
    <MemoryRouter>
      <ShopProvider
        initial={{
          promise: Promise.resolve(products),
          getSnapshot: () => products,
          subscribe: () => () => {},
        }}
      >
        <CatalogSection
          state={state}
          onRetry={() => {}}
          sectionRef={null}
          searchRef={search}
          controls={controls}
        />
      </ShopProvider>
    </MemoryRouter>
  )
}

describe('catalog feedback', () => {
  it('announces loading and then the number of loaded products', () => {
    const retry = vi.fn()
    const { rerender } = render(
      <CatalogFeedback state={{ status: 'loading' }} onRetry={retry} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading products…')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    rerender(
      <CatalogFeedback
        state={{ status: 'success', products }}
        onRetry={retry}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('1 product loaded')
  })

  it('lets the user retry an error and keeps keyboard focus on feedback', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    render(
      <CatalogFeedback
        state={{
          status: 'error',
          message: 'Could not load products. Please try again.',
        }}
        onRetry={retry}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('heading', { name: 'Products could not be loaded' }),
    ).toHaveFocus()
  })

  it('distinguishes an empty loaded catalog from a search with no matches', () => {
    const retry = vi.fn()
    const { rerender } = render(
      <CatalogFeedback
        state={{ status: 'empty' }}
        visibleCount={0}
        onRetry={retry}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'No products yet' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
    rerender(
      <CatalogFeedback
        state={{ status: 'success', products }}
        visibleCount={0}
        onRetry={retry}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'No products match these filters' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('No products yet')).not.toBeInTheDocument()
  })

  it('offers filter recovery without treating no matches as a failed request', async () => {
    const user = userEvent.setup()
    const clear = vi.fn()
    const retry = vi.fn()
    render(
      <CatalogFeedback
        state={{ status: 'success', products }}
        visibleCount={0}
        onRetry={retry}
        onClearFilters={clear}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(clear).toHaveBeenCalledOnce()
    expect(retry).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument()
  })

  it('marks the catalog region busy only while a request is loading', () => {
    const { rerender } = render(<Harness state={{ status: 'loading' }} />)
    expect(
      screen.getByRole('region', { name: 'Good things, all in one place.' }),
    ).toHaveAttribute('aria-busy', 'true')
    rerender(<Harness state={{ status: 'success', products }} />)
    expect(
      screen.getByRole('region', { name: 'Good things, all in one place.' }),
    ).toHaveAttribute('aria-busy', 'false')
  })
})
