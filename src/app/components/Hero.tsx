import type { Ref } from 'react'
import styles from './Hero.module.css'

export function Hero({ sectionRef }: { sectionRef: Ref<HTMLElement> }) {
  return (
    <section ref={sectionRef} id="hero" className={styles.hero} aria-labelledby="hero-title" tabIndex={-1}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>A FRESH PERSPECTIVE</p>
        <h1 id="hero-title">Your everyday, <em>elevated.</em></h1>
        <p>A little clarity. A lot of possibility. Welcome to your Shopboard overview.</p>
      </div>
      <a className={styles.button} href="#products">Explore products <span aria-hidden="true">↗</span></a>
    </section>
  )
}
