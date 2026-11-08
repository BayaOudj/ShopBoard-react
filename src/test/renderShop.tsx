import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { afterEach } from 'vitest'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { shopRoutes } from '../app/routes'

const routers = new Set<ReturnType<typeof createBrowserRouter>>()
afterEach(() => {
  for (const router of routers) router.dispose()
  routers.clear()
})

// Start loaders before rendering and dispose history listeners after every test.
export function renderShop() {
  const router = createBrowserRouter(shopRoutes)
  routers.add(router)
  const view = render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
  return {
    ...view,
    unmount: () => {
      view.unmount()
      router.dispose()
      routers.delete(router)
    },
  }
}
