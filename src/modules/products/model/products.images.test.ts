import { describe, expect, it } from 'vitest'
import { getProductImage } from './products.images'
import { variantKey } from './products.colors'

describe('pure product variant helpers', () => {
  it('derives independent image paths and alt text for each color', () => {
    const bag = { id: 1, name: 'Leather Tote Bag' }
    expect(getProductImage(bag, 'Black')).toEqual({
      src: '/images/products/1-black.jpg',
      alt: 'Leather Tote Bag in Black — AI-generated product preview',
    })
    expect(getProductImage(bag, 'Tan').src).toBe('/images/products/1-tan.jpg')
    expect(
      getProductImage({ id: 'featured-1', name: 'Slow Morning Mug' }, 'Sage')
        .src,
    ).toBe('/images/products/featured-1-sage.jpg')
    expect(getProductImage(bag).src).toBe('/images/products/1-brown.jpg')
  })

  it('falls back for invalid colors and preserves the persisted variant-key format', () => {
    expect(
      getProductImage({ id: 1, name: 'Leather Tote Bag' }, 'Purple').src,
    ).toBe('/images/products/1-brown.jpg')
    expect(variantKey({ id: 1 }, 'Brown')).toBe('1::Brown')
    expect(variantKey({ id: 'featured-0' }, 'Sage')).toBe('featured-0::Sage')
  })
})
