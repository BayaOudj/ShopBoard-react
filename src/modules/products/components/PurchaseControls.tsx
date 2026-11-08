import { useShop } from '../hooks/useShop'
import { useId } from 'react'
import type { Product } from '../model/products.types'
import { colorSwatches, getColors } from '../model/products.colors'
import { Button } from '../../../shared/ui/Button'
import styles from './Products.module.css'

export function PurchaseControls({ product }: { product: Product }) {
  const { colorFor, changeColor, cart } = useShop()
  const color = colorFor(product)
  const group = useId()
  return (
    <div className={styles.purchase}>
      <fieldset className={styles.colors}>
        <legend>Colour: {color}</legend>
        <div className={styles.swatches}>
          {getColors(product).map((option) => (
            <label key={option} className={styles.swatch} title={option}>
              <input
                type="radio"
                name={group}
                value={option}
                checked={color === option}
                aria-label={`${option} for ${product.name}`}
                onChange={() => changeColor(product, option)}
              />
              <span
                className={styles.dot}
                style={{ background: colorSwatches[option] ?? '#e5d9bc' }}
                aria-hidden="true"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <Button
        disabled={!cart.ready}
        aria-label={`Add ${product.name} to cart`}
        onClick={() => cart.add(product, color)}
      >
        Add to cart +
      </Button>
    </div>
  )
}
