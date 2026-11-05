import type { Ref } from 'react'
import type { Product } from '../../products/model/products.types'
import { getColors } from '../../products/model/products.colors'
import { money } from '../../../shared/lib/money'
import styles from './Dashboard.module.css'

export function CatalogInsights({ products, loaded, sectionRef, onDetails }: { products: Product[]; loaded: boolean; sectionRef: Ref<HTMLElement>; onDetails: (product: Product) => void }) {
  return <section id="catalog-insights" hidden={!loaded} ref={sectionRef} className={styles.insights} aria-labelledby="insights-title" tabIndex={-1}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>BEHIND THE COLLECTION</p><h2 id="insights-title">Catalog at a glance</h2></div><span className={styles.pill}>{products.length} demo listings</span></div>
    <div className={styles.tableWrap}><table className={styles.catalogTable}><caption>Product prices, categories, and available preview colours. Stock is unverified.</caption><thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">Preview colours</th><th scope="col">Listing</th></tr></thead>
      <tbody id="insights-products">{products.map(product => <tr key={product.id}><th scope="row"><button type="button" aria-haspopup="dialog" onClick={() => onDetails(product)}>{product.name}</button></th><td>{product.category}</td><td>{money(product.price)}</td><td>{getColors(product).join(' · ')}</td><td>Demo listing</td></tr>)}</tbody>
    </table></div><p className={styles.caption}>Catalog insights describe demo listings. Sales, customer, order, and stock data are not connected.</p>
  </section>
}
