import styles from './Shopping.module.css'
import { use } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { useShop } from '../../modules/products/hooks/useShop'
import { PurchaseControls } from '../../modules/products/components/PurchaseControls'
import { SafeImage } from '../../shared/ui/SafeImage'
import { getProductImage } from '../../modules/products/model/products.images'
import { money } from '../../shared/lib/money'
import type { getProduct } from '../../modules/products/api/products.api'
export default function ProductPage() {
  const data: { product: ReturnType<typeof getProduct> } = useLoaderData()
  const product = use(data.product)
  const shop = useShop()
  if (!product)
    return (
      <section>
        <h1>Product not found</h1>
        <Link to="/products">Back to products</Link>
      </section>
    )
  const color = shop.colorFor(product)
  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/products">
        ← All products
      </Link>
      <div className={styles.details}>
        <SafeImage
          className={styles.photo}
          {...getProductImage(product, color)}
          width={600}
          height={600}
        />
        <div className={styles.copy}>
          <p>{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <p className={styles.price}>{money(product.price)}</p>
          <p className={styles.note}>
            Demo listing · Representative colour previews; stock is unverified.
          </p>
          <PurchaseControls product={product} />
          <Link className={styles.back} to="/cart">
            View cart →
          </Link>
        </div>
      </div>
    </section>
  )
}
