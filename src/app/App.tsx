import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { shopRoutes } from './routes'

// Router loaders start outside React rendering, once for the app lifetime.
const router = createBrowserRouter(shopRoutes)

export default function App() {
  return <RouterProvider router={router} />
}
