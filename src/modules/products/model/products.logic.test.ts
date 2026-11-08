import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { filterProducts, selectProducts } from './products.logic'

const sample = [
  {
    id: '1',
    name: 'Stone Vase',
    price: 48,
    category: 'Ceramics',
    blurb: '',
    swatch: '#DCEAF5',
  },
  {
    id: '2',
    name: 'Linen Throw',
    price: 86,
    category: 'Textile',
    blurb: '',
    swatch: '#F8E6D8',
  },
]

describe('filterProducts', () => {
  it('returns all when query is empty', () => {
    assert.equal(filterProducts(sample, '').length, 2)
    assert.equal(filterProducts(sample, '   ').length, 2)
  })

  it('filters by name case-insensitively', () => {
    const result = filterProducts(sample, 'vase')
    assert.deepEqual(
      result.map((p) => p.id),
      ['1'],
    )
  })

  it('filters by category', () => {
    const result = filterProducts(sample, 'textile')
    assert.deepEqual(
      result.map((p) => p.id),
      ['2'],
    )
  })

  it('returns empty array when nothing matches', () => {
    assert.deepEqual(filterProducts(sample, 'xyz'), [])
  })
})

describe('catalog selection', () => {
  const products = [
    { id: 'bag-1', name: 'Everyday Bag', category: 'Bags', price: 49 },
    { id: 'bag-2', name: 'Travel Bag', category: 'Bags', price: 50 },
    { id: 'bag-3', name: 'Mini Bag', category: 'Bags', price: 24 },
    { id: 'mug', name: 'Morning Mug', category: 'Home', price: 18 },
  ]
  const defaults = {
    query: '',
    category: 'All',
    collection: null,
    underFifty: false,
    sort: 'original' as const,
  }

  it('combines collection, category, search, and strict under-$50 filtering', () => {
    const visible = selectProducts(products, {
      ...defaults,
      query: ' BAG ',
      category: 'Bags',
      collection: {
        id: 'travel',
        name: 'Travel',
        description: '',
        image: '',
        productIds: ['bag-1', 'bag-2', 'mug'],
      },
      underFifty: true,
    })
    assert.deepEqual(
      visible.map((product) => product.id),
      ['bag-1'],
    )
  })

  it('sorts both ways while preserving the original featured order', () => {
    const originalIds = products.map((product) => product.id)
    assert.deepEqual(
      selectProducts(products, { ...defaults, sort: 'cheapest' }).map(
        (product) => product.price,
      ),
      [18, 24, 49, 50],
    )
    assert.deepEqual(
      selectProducts(products, { ...defaults, sort: 'expensive' }).map(
        (product) => product.price,
      ),
      [50, 49, 24, 18],
    )
    assert.deepEqual(
      selectProducts(products, defaults).map((product) => product.id),
      originalIds,
    )
    assert.deepEqual(
      products.map((product) => product.id),
      originalIds,
    )
  })

  it('returns no matches when the selected filters do not overlap', () => {
    assert.deepEqual(
      selectProducts(products, { ...defaults, category: 'Bags', query: 'mug' }),
      [],
    )
  })
})
