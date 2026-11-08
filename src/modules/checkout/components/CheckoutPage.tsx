import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCatalog, useShop } from '../../products/hooks/useShop'
import { checkoutSchema } from '../model/checkout.schema'
import type { CheckoutValues } from '../model/checkout.schema'
import { Input } from '../../../shared/ui/shadcn/input'
import { Label } from '../../../shared/ui/shadcn/label'
import { Button } from '../../../shared/ui/shadcn/button'
import { money } from '../../../shared/lib/money'
import styles from './Checkout.module.css'
const fields: {
  name: keyof CheckoutValues
  label: string
  autoComplete: string
  type?: string
}[] = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', autoComplete: 'email', type: 'email' },
  { name: 'address', label: 'Street address', autoComplete: 'street-address' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
]
export default function CheckoutPage() {
  useCatalog()
  const { cart } = useShop()
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const confirmationRef = useRef<HTMLElement>(null)
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
    mode: 'onBlur',
  })
  async function submit(values: CheckoutValues) {
    setConfirmation(
      `Thanks, ${values.name}. Your demo checkout is complete. No payment was collected and no order was placed.`,
    )
    requestAnimationFrame(() => confirmationRef.current?.focus())
  }
  if (confirmation)
    return (
      <section ref={confirmationRef} tabIndex={-1} className={styles.layout}>
        <h1>Demo checkout complete</h1>
        <p role="status">{confirmation}</p>
        <p>Your cart is preserved.</p>
        <Link to="/products">Continue shopping</Link>
      </section>
    )
  if (!cart.items.length)
    return (
      <section>
        <h1>Checkout</h1>
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      </section>
    )
  return (
    <section className={styles.layout}>
      <h1>Checkout</h1>
      <p>
        Demo checkout. No payment details are needed. Your information stays on
        this page and is never sent or saved.
      </p>
      <aside className={styles.summary} aria-label="Order summary">
        <h2>Order summary</h2>
        <ul>
          {cart.items.map((item) => (
            <li key={item.id}>
              {item.qty} × {item.product.name} ({item.color}) —{' '}
              {money(item.lineTotal)}
            </li>
          ))}
        </ul>
        <strong>Subtotal {money(cart.subtotal)}</strong>
        <p>Shipping and tax are not calculated.</p>
        <Link to="/cart">Edit cart</Link>
      </aside>
      <form
        noValidate
        className={styles.form}
        aria-label="Checkout"
        onSubmit={(event) => {
          void form.handleSubmit(submit)(event)
        }}
      >
        <p>All fields are required.</p>
        <div className={styles.fields}>
          {fields.map((field) => {
            const error = form.formState.errors[field.name]
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type ?? 'text'}
                  autoComplete={field.autoComplete}
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  {...form.register(field.name)}
                />
                {error && (
                  <p id={`${field.name}-error`} className={styles.error}>
                    {error.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? 'Completing…'
            : 'Complete demo checkout'}
        </Button>
      </form>
    </section>
  )
}
