import { describe, expect, it } from 'vitest'
import { catalogStats } from './dashboard.logic'

describe('catalog statistics', () => {
  it('calculates only catalog values and excludes exactly $50 from the budget count', () => {
    const stats = catalogStats([
      { id: 1, name: 'Bag', category: 'Bags', price: 49 },
      { id: 2, name: 'Shoes', category: 'Shoes', price: 50 },
    ])
    expect(stats).toMatchObject({
      count: 2,
      total: 99,
      average: 49.5,
      underFifty: 1,
    })
    expect(
      stats.categories.find((category) => category.name === 'Bags'),
    ).toMatchObject({ count: 1, value: 49 })
  })
  it('has valid zero values and no invented average for an empty catalog', () => {
    expect(catalogStats([])).toMatchObject({
      count: 0,
      total: 0,
      average: null,
      underFifty: 0,
    })
    expect(
      catalogStats([]).categories.every(
        (category) => category.count === 0 && category.value === 0,
      ),
    ).toBe(true)
  })
})
