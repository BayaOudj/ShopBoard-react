import type { Product } from './products.types'
// Sample color options for the demo catalog, pending supplier inventory.
const productColors: Record<string, [string, ...string[]]> = {
  1: ['Brown', 'Black', 'Tan'],
  2: ['Sage', 'Sand', 'Black'],
  3: ['Terracotta', 'Black', 'Cream'],
  4: ['White', 'Cream', 'Black'],
  5: ['Red', 'Black', 'Blue'],
  6: ['Tan', 'Brown', 'Black'],
  7: ['Oat', 'Rose', 'Charcoal'],
  8: ['Silver', 'Gold', 'Black'],
  9: ['Black', 'Tortoiseshell', 'Brown'],
  10: ['Brown', 'Olive', 'Black'],
  11: ['Olive', 'Black', 'Navy'],
  12: ['Brown', 'Black', 'Tan'],
  'featured-0': ['Sage', 'Natural', 'Black'],
  'featured-1': ['Oat', 'White', 'Sage'],
  'featured-2': ['Terracotta', 'Sage', 'Cream'],
}

export function getColors(product: Pick<Product, 'id'>): [string, ...string[]] {
  return Object.hasOwn(productColors, product.id)
    ? productColors[product.id]
    : ['Natural']
}

export function variantKey(product: Pick<Product, 'id'>, color: string) {
  return `${product.id}::${color}`
}

export const colorSwatches: Record<string, string> = {
  Brown: '#75482f',
  Black: '#222323',
  Tan: '#c4925d',
  Sage: '#939d81',
  Sand: '#cbb797',
  Terracotta: '#b85f42',
  Cream: '#efe5ce',
  White: '#ffffff',
  Red: '#b52032',
  Blue: '#255cb7',
  Oat: '#d2c3aa',
  Rose: '#c7828d',
  Charcoal: '#515252',
  Silver: 'linear-gradient(135deg, #8c9397, #eff0f1 48%, #969da1)',
  Gold: 'linear-gradient(135deg, #ac8032, #f3d889 48%, #bc913f)',
  Tortoiseshell:
    'radial-gradient(ellipse at 30% 30%, #37251b 0 18%, transparent 22%), radial-gradient(ellipse at 75% 70%, #4a2d1d 0 20%, transparent 25%), #ab7134',
  Olive: '#626c43',
  Navy: '#293b54',
  Natural: '#e5d9bc',
}
