import { useEffect, useRef, useState } from 'react'
import { Dialog } from '../../../shared/ui/Dialog'
import { Button } from '../../../shared/ui/Button'
import { SafeImage } from '../../../shared/ui/SafeImage'
import { money } from '../../../shared/lib/money'
import { getProductImage } from '../../products/model/products.images'
import type { CartLine } from '../model/cart.types'
import styles from './Cart.module.css'

interface CartDialogProps {
  open: boolean; onClose: () => void; items: CartLine[]; subtotal: number;
  onQuantity: (id: string, quantity: number) => void; onRemove: (item: CartLine) => void
}

export function CartDialog({ open, onClose, items, subtotal, onQuantity, onRemove }: CartDialogProps) {
  const [reviewSnapshot, setReviewSnapshot] = useState<string | null>(null)
  const close = useRef<HTMLButtonElement>(null)
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const signature = JSON.stringify(items.map(item => [item.id, item.qty, item.lineTotal]))
  const reviewing = items.length > 0 && reviewSnapshot === signature
  useEffect(() => { if (reviewing) reviewHeading.current?.focus() }, [reviewing])
  return <Dialog id="cart-dialog" open={open} onClose={onClose} labelledBy="cart-title" compact>
    <div className={styles.content}>
      <div className={styles.heading}><h2 id="cart-title">Your shopping cart</h2><button ref={close} id="close-cart" type="button" className={styles.close} aria-label="Close shopping cart" onClick={onClose}>✕</button></div>
      {items.length === 0 && <p id="cart-empty" className={styles.note}>Your cart is empty. Find something you love in the collection.</p>}
      <ul id="cart-items" className={styles.items}>{items.map(item => <li key={item.id} className={styles.item}>
        <SafeImage {...getProductImage(item.product, item.color)} className={styles.photo} width={80} height={80} />
        <h3>{item.product.name} · {item.color}</h3><p>{money(item.product.price)} each · {money(item.lineTotal)}</p>
        <div className={styles.quantity}><label htmlFor={`quantity-${item.id}`}>Quantity</label><input id={`quantity-${item.id}`} type="number" min={1} max={99} step={1} value={item.qty} aria-label={`Quantity for ${item.product.name}, ${item.color}`} onChange={event => { const value = event.currentTarget.valueAsNumber; if (Number.isInteger(value) && value >= 1 && value <= 99) onQuantity(item.id, value) }} />
          <button className={styles.remove} type="button" aria-label={`Remove ${item.product.name}, ${item.color}, from cart`} onClick={() => { onRemove(item); close.current?.focus() }}>Remove</button>
        </div>
      </li>)}</ul>
      <div className={styles.totals}><span>Subtotal</span><strong id="cart-subtotal">{money(subtotal)}</strong></div>
      <p className={styles.note}>Demo shop · No payment will be collected or order placed. Shipping and tax are not calculated.</p>
      <Button id="review-order" className={styles.fullWidth} disabled={items.length === 0} onClick={() => setReviewSnapshot(signature)}>Review order <span aria-hidden="true">↗</span></Button>
      {reviewing && <section id="order-review" className={styles.review} aria-labelledby="review-title"><h3 id="review-title" ref={reviewHeading} tabIndex={-1}>Your order review</h3><p id="review-summary">{items.map(item => `${item.qty} × ${item.product.name} (${item.color})`).join('; ')}. Subtotal {money(subtotal)}.</p><p>These products are demo listings. Online purchasing will be available after the store is connected to payments and inventory.</p><Button id="continue-shopping" onClick={onClose}>Continue shopping</Button></section>}
    </div>
  </Dialog>
}
