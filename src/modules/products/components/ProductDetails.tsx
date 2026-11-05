import type { Product } from '../model/products.types'
import type { RefObject } from 'react'
import { Dialog } from '../../../shared/ui/Dialog'
import { SafeImage } from '../../../shared/ui/SafeImage'
import { money } from '../../../shared/lib/money'
import { getProductImage } from '../model/products.images'
import { PurchaseControls } from './PurchaseControls'
import styles from './Products.module.css'

export function ProductDetails({ product, color, onColor, onAdd, onClose, fallbackFocus, cartReady }: {
  product: Product | null; color: string; onColor: (product: Product, color: string) => void; onAdd: (product: Product, color: string) => void;
  onClose: () => void; fallbackFocus: RefObject<HTMLElement | null>; cartReady: boolean
}) {
  return <Dialog id="product-dialog" open={product !== null} onClose={onClose} labelledBy="detail-name" describedBy="detail-description" fallbackFocus={fallbackFocus}>
    {product && <div className={styles.detailLayout}>
      <button id="close-product" type="button" className={styles.close} aria-label="Close product details" onClick={onClose}>✕</button>
      <SafeImage {...getProductImage(product, color)} id="detail-image" className={styles.detailImage} width={800} height={900} />
      <div className={styles.detailCopy}><p id="detail-category" className={styles.eyebrow}>{product.category}</p><h2 id="detail-name">{product.name}</h2><p id="detail-price" className={styles.detailPrice}>{money(product.price)}</p>
        <p id="detail-description">{product.description || `${product.name} is part of our ${product.category.toLowerCase()} collection. Explore this everyday essential and add it to your cart.`}</p>
        <p className={styles.disclosure}>Demo listing · Representative photo. AI-generated colour previews for this demo listing. Actual materials, colours, and stock have not been verified.</p>
        <div id="detail-actions"><PurchaseControls product={product} color={color} onColor={onColor} onAdd={onAdd} disabled={!cartReady} /></div>
      </div>
    </div>}
  </Dialog>
}
