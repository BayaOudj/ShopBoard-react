import type { Collection } from './products.types'

export const COLLECTIONS: Collection[] = [
  {
    id: 'everyday',
    name: 'Everyday Essentials',
    description: 'Small upgrades for the things you do every day.',
    image: '/images/products/featured-0-sage.jpg',
    productIds: ['featured-0', 'featured-2', 1, 3, 4, 7, 8, 9, 12],
  },
  {
    id: 'on-the-go',
    name: 'On the Go',
    description: 'Pack light. Go a little further.',
    image: '/images/products/10-olive.jpg',
    productIds: [1, 2, 3, 4, 5, 9, 10, 11],
  },
  {
    id: 'slow-mornings',
    name: 'Slow Mornings',
    description: 'A warm cup, a fresh page, a moment for yourself.',
    image: '/images/products/featured-1-oat.jpg',
    productIds: ['featured-1', 'featured-2', 7],
  },
]

export const CATEGORIES = [
  'Bags',
  'Shoes',
  'Accessories',
  'Home & Living',
  'Stationery',
]
