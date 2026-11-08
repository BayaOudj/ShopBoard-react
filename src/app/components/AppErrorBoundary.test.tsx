import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

function BrokenFeature(): never {
  throw new Error('Unexpected rendering failure')
}

describe('application error fallback', () => {
  it('provides a recovery action when a descendant cannot render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <AppErrorBoundary>
        <BrokenFeature />
      </AppErrorBoundary>,
    )
    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeEnabled()
  })
})
