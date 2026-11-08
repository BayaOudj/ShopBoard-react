import styles from './Shopping.module.css'
import { Link } from 'react-router-dom'
import { useCatalog, useShop } from '../../modules/products/hooks/useShop'
import { money } from '../../shared/lib/money'
export default function CartPage() {
  useCatalog()
  const { cart } = useShop()
  return (
    <section className={styles.page}>
      <h1>Your shopping cart</h1>
      {!cart.items.length ? (
        <p>
          Your cart is empty.{' '}
          <Link to="/products">Find something you love.</Link>
        </p>
      ) : (
        <>
          <ul className={styles.items}>
            {cart.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <h2>
                  {item.product.name} · {item.color}
                </h2>
                <label>
                  Quantity{' '}
                  <input
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    value={item.qty}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber
                      if (Number.isInteger(value) && value >= 1 && value <= 99)
                        cart.setQuantity(item.id, value)
                    }}
                  />
                </label>
                <span>{money(item.lineTotal)}</span>
                <button type="button" onClick={() => cart.remove(item.id)}>
                  Remove {item.product.name}, {item.color}
                </button>
              </li>
            ))}
          </ul>
          <p>Subtotal: {money(cart.subtotal)}</p>
          <Link className={styles.action} to="/checkout">
            Continue to checkout
          </Link>
        </>
      )}
    </section>
  )
}
