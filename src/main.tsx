import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { AppErrorBoundary } from './app/components/AppErrorBoundary'
import './shared/styles/tokens.css'
import './shared/styles/global.css'

const root = document.getElementById('root')
if (!root) throw new Error('The React root element is missing.')

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
)
