import { getProductImage } from '../model/products.images'
import { PurchaseControls } from './PurchaseControls'
import type { PurchaseControlsProps } from './PurchaseControls'
import { SafeImage } from '../../../shared/ui/SafeImage'
import { money } from '../../../shared/lib/money'
import styles from './Products.module.css'

interface ProductCardProps extends PurchaseControlsProps { onDetails: (product: PurchaseControlsProps['product']) => void }

export function ProductCard({ onDetails, ...props }: ProductCardProps) {
  const { product, color } = props
  const photo = getProductImage(product, color)
  return <article className={styles.card} data-product-id={product.id} aria-labelledby={`product-${product.id}-title`}
    onClick={event => { if (event.target instanceof Element && !event.target.closest('button, a, input, select, label, fieldset')) onDetails(product) }}>
    <button type="button" className={styles.photoButton} aria-label={`View details for ${product.name}`} aria-haspopup="dialog" onClick={() => onDetails(product)}>
      <div className={styles.art}><SafeImage {...photo} width={800} height={900} loading="lazy" decoding="async" data-product-id={product.id} /></div>
    </button>
    <div className={styles.productHeading}><h3 id={`product-${product.id}-title`}><button type="button" className={styles.nameButton} onClick={() => onDetails(product)} aria-haspopup="dialog">{product.name}</button></h3><p>{money(product.price)}</p></div>
    <span className={styles.category}>{product.category}</span>
    <PurchaseControls {...props} />
  </article>
}
