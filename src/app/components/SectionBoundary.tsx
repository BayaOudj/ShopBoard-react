import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'
class RetryBoundary extends Component<
  { children: ReactNode; retry: () => void | Promise<void> },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <section role="alert">
        <h2>This section could not load</h2>
        <p>Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            void Promise.resolve(this.props.retry()).then(() =>
              this.setState({ failed: false }),
            )
          }}
        >
          Try again
        </button>
        <button type="button" onClick={() => window.location.reload()}>
          Reload application
        </button>
      </section>
    ) : (
      this.props.children
    )
  }
}
export function SectionBoundary({
  children,
  retry,
}: {
  children: ReactNode
  retry: () => void | Promise<void>
}) {
  return (
    <RetryBoundary retry={retry}>
      <Suspense fallback={<p role="status">Loading this section…</p>}>
        {children}
      </Suspense>
    </RetryBoundary>
  )
}
