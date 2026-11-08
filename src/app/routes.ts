import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import Layout from './components/ShopLayout'
import { loadCatalog } from '../modules/products/api/catalog.resource'
import { getProduct } from '../modules/products/api/products.api'
const Overview = lazy(() => import('./pages/OverviewPage'))
const Products = lazy(() => import('./pages/ProductsPage'))
const Product = lazy(() => import('./pages/ProductPage'))
const Collections = lazy(() => import('./pages/CollectionsPage'))
const Insights = lazy(() => import('./pages/InsightsPage'))
const Community = lazy(() => import('./pages/CommunityPage'))
const Cart = lazy(() => import('./pages/CartPage'))
const Checkout = lazy(
  () => import('../modules/checkout/components/CheckoutPage'),
)
const NotFound = lazy(() => import('./pages/NotFoundPage'))
export const shopRoutes: RouteObject[] = [
  {
    path: '/',
    shouldRevalidate: () => false,
    loader: () => ({ catalog: loadCatalog() }),
    Component: Layout,
    HydrateFallback: () => null,
    children: [
      { index: true, Component: Overview },
      { path: 'products', Component: Products },
      {
        path: 'products/:id',
        loader: ({ params, request }) => {
          const product = getProduct(params.id ?? '', request.signal)
          void product.catch(() => {})
          return { product }
        },
        Component: Product,
      },
      { path: 'collections', Component: Collections },
      { path: 'insights', Component: Insights },
      { path: 'community', Component: Community },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: '*', Component: NotFound },
    ],
  },
]
