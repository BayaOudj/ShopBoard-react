import type { Ref } from 'react'
import type { Collection } from '../model/products.types'
import { COLLECTIONS } from '../model/products.collections'
import { SafeImage } from '../../../shared/ui/SafeImage'
import styles from './Products.module.css'

export function CollectionsSection({ sectionRef, selectedId, disabled, onSelect }: {
  sectionRef: Ref<HTMLElement>; selectedId?: string; disabled: boolean; onSelect: (collection: Collection) => void
}) {
  return <section id="collections" ref={sectionRef} className={styles.section} aria-labelledby="collections-title" tabIndex={-1}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>GOOD THINGS, TOGETHER</p><h2 id="collections-title">Curated for your everyday.</h2></div><p>Thoughtful edits for the way you live.</p></div>
    <div id="collection-grid" className={styles.collectionGrid}>{COLLECTIONS.map(collection => <button key={collection.id} type="button" className={styles.collectionCard} data-collection={collection.id} aria-pressed={selectedId === collection.id} disabled={disabled} onClick={() => onSelect(collection)}>
      <SafeImage src={collection.image} alt="" width={500} height={350} loading="lazy" />
      <span className={styles.collectionCopy}><span className={styles.collectionName}>{collection.name}</span><span className={styles.collectionDescription}>{collection.description}</span><span className={styles.collectionAction}>Explore {collection.productIds.length} pieces ↗</span></span>
    </button>)}</div>
  </section>
}
