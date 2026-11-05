import { useId } from 'react'
import type { Product } from '../model/products.types'
import { colorSwatches, getColors } from '../model/products.colors'
import { Button } from '../../../shared/ui/Button'
import styles from './Products.module.css'

export interface PurchaseControlsProps {
  product: Product
  color: string
  onColor: (product: Product, color: string) => void
  onAdd: (product: Product, color: string) => void
  disabled?: boolean
}

export function PurchaseControls({ product, color, onColor, onAdd, disabled = false }: PurchaseControlsProps) {
  const group = useId()
  return <div className={styles.purchase}>
    <fieldset className={styles.colors}>
      <legend>Colour: {color}</legend>
      <div className={styles.swatches}>{getColors(product).map(option => <label key={option} className={styles.swatch} title={option}>
        <input type="radio" name={group} value={option} checked={color === option} aria-label={`${option} for ${product.name}`}
          onChange={() => onColor(product, option)} />
        <span className={styles.dot} style={{ background: colorSwatches[option] ?? '#e5d9bc' }} aria-hidden="true" />
      </label>)}</div>
    </fieldset>
    <Button disabled={disabled} aria-label={`Add ${product.name} to cart`} onClick={() => onAdd(product, color)}>Add to cart +</Button>
  </div>
}
