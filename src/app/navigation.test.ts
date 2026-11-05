import { describe, expect, it } from 'vitest'
import { sectionForScroll } from './navigation'
import type { SectionPosition } from './navigation'

describe('active section selection', () => {
  const positions: SectionPosition[] = [
    { id: 'hero', top: -300, bottom: -150 },
    { id: 'collections', top: -90, bottom: 110 },
    { id: 'products', top: 110, bottom: 430 },
    { id: 'catalog-insights', top: 430, bottom: 750 },
    { id: 'register', top: 750, bottom: 1070 },
  ]

  it('uses all section positions instead of the last section visibility event', () => {
    expect(sectionForScroll(positions, false, '#collections', 1100)).toBe('products')
    expect(positions[0]?.id).toBe('hero')
  })

  it('keeps a requested visible anchor when several anchors share the page bottom', () => {
    expect(sectionForScroll(positions, true, '#catalog-insights', 1100)).toBe('catalog-insights')
    expect(sectionForScroll(positions, true, '#register', 1100)).toBe('register')
  })

  it('selects the last section when scrolling to the bottom without a visible anchor', () => {
    expect(sectionForScroll(positions, true, '#hero', 1100)).toBe('register')
    expect(sectionForScroll(positions, true, '', 1100)).toBe('register')
  })
})
