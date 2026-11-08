import { Component } from 'react'
import type { ReactNode } from 'react'
import styles from './AppErrorBoundary.module.css'

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.fallback}>
          <h1>Something went wrong</h1>
          <p>
            The workspace could not be displayed. Reload the page to try again.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
