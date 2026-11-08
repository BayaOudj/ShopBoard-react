import type { Product } from '../../products/model/products.types'
import { COLLECTIONS } from '../../products/model/products.collections'
import { catalogStats } from '../model/dashboard.logic'
import { money } from '../../../shared/lib/money'
import styles from './Dashboard.module.css'

export function DashboardOverview({
  products,
  loaded,
}: {
  products: Product[]
  loaded: boolean
}) {
  const stats = catalogStats(products)
  const metrics = [
    [
      'Products',
      String(stats.count).padStart(2, '0'),
      'Thoughtfully selected essentials',
      '▦',
    ],
    [
      'Collections',
      String(COLLECTIONS.length).padStart(2, '0'),
      'Edits for the way you live',
      '▱',
    ],
    [
      'Average price',
      stats.average === null ? '—' : money(stats.average),
      'Across the complete catalog',
      '↗',
    ],
    [
      'Under $50',
      String(stats.underFifty).padStart(2, '0'),
      'Small upgrades, lovely prices',
      '✧',
    ],
  ]
  const max = Math.max(0, ...stats.categories.map((category) => category.value))
  const stops = stats.categories.map((category, index) => {
    const before = stats.categories
      .slice(0, index)
      .reduce((sum, item) => sum + item.count, 0)
    const start = stats.count ? (before / stats.count) * 360 : 0
    const end = stats.count
      ? ((before + category.count) / stats.count) * 360
      : 0
    return `${category.color} ${start}deg ${end}deg`
  })
  return (
    <section
      hidden={!loaded}
      className={styles.overview}
      aria-label="Catalog overview"
    >
      <div id="overview-metrics" className={styles.metricGrid}>
        {metrics.map(([label, value, note, icon]) => (
          <article key={label} className={styles.metric}>
            <h2>{label}</h2>
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
            <p className={styles.number}>{value}</p>
            <p className={styles.caption}>{note}</p>
          </article>
        ))}
      </div>
      <div className={styles.analytics}>
        <article className={styles.valuePanel} aria-labelledby="value-title">
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>THE BIG PICTURE</p>
              <h2 id="value-title">A well-balanced collection.</h2>
            </div>
            <span className={styles.pill}>Catalog value</span>
          </div>
          <p id="overview-value" className={styles.large}>
            {money(stats.total)}
          </p>
          <p className={styles.caption}>
            Combined price of one of each product · USD
          </p>
          <div id="value-chart" className={styles.bars}>
            {stats.categories.map((category) => (
              <div key={category.name} className={styles.barRow}>
                <span>{category.name}</span>
                <span className={styles.track}>
                  <span
                    className={styles.fill}
                    style={{
                      width: `${max ? (category.value / max) * 100 : 0}%`,
                      background: `linear-gradient(90deg,#ffffff50,${category.color})`,
                    }}
                  />
                </span>
                <strong>{money(category.value)}</strong>
              </div>
            ))}
          </div>
          <details className={styles.chartData}>
            <summary>View chart data</summary>
            <table>
              <caption>Catalog price totals by category</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Products</th>
                  <th scope="col">Total price</th>
                </tr>
              </thead>
              <tbody>
                {stats.categories.map((category) => (
                  <tr key={category.name}>
                    <th scope="row">{category.name}</th>
                    <td>{category.count}</td>
                    <td>{money(category.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </article>
        <article className={styles.mixPanel} aria-labelledby="mix-title">
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>A LITTLE OF EVERYTHING</p>
              <h2 id="mix-title">The product mix</h2>
            </div>
            <span aria-hidden="true">↗</span>
          </div>
          <div
            id="mix-chart"
            className={styles.donut}
            style={{
              background: stats.count
                ? `conic-gradient(${stops.join(',')})`
                : '#e6e4ed',
            }}
            role="img"
            aria-label={`Product mix: ${stats.categories.map((category) => `${category.name}, ${category.count}`).join('; ')}`}
          >
            <span>
              <strong>{stats.count}</strong>
              <span>products</span>
            </span>
          </div>
          <ul className={styles.legend}>
            {stats.categories.map((category) => (
              <li key={category.name}>
                <span
                  className={styles.legendDot}
                  style={{ background: category.color }}
                  aria-hidden="true"
                />
                <span>{category.name}</span>
                <strong>{category.count}</strong>
              </li>
            ))}
          </ul>
          <p className={styles.caption}>
            Based on the current catalog, across all collections.
          </p>
        </article>
      </div>
    </section>
  )
}
