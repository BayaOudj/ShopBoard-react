import { useState } from 'react'
import type { Ref } from 'react'
import { Button } from '../../../shared/ui/Button'
import styles from './Registration.module.css'

export function RegistrationSection({ sectionRef }: { sectionRef: Ref<HTMLElement> }) {
  const [submitted, setSubmitted] = useState(false)
  return <section id="register" ref={sectionRef} className={styles.register} aria-labelledby="register-title" tabIndex={-1}>
    <div><p className={styles.eyebrow}>MAKE YOURSELF AT HOME</p><h2 id="register-title">A good thing,<br /><em>shared.</em></h2><p>Create your ShopBoard account and be first to hear about new essentials and fresh collections.</p><span className={styles.flower} aria-hidden="true">✳</span></div>
    <form id="register-form" className={styles.form} aria-labelledby="form-title" onSubmit={event => { event.preventDefault(); if (event.currentTarget.checkValidity()) setSubmitted(true) }}>
      <h3 id="form-title">Join the ShopBoard community</h3>
      <label htmlFor="name">Full name</label><input id="name" name="name" type="text" autoComplete="name" required minLength={2} placeholder="Your full name" />
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-help" placeholder="Create a password" />
      <small id="password-help">Use at least 8 characters.</small>
      <label className={styles.checkbox}><input id="updates" name="updates" type="checkbox" />Send me occasional news and collection updates.</label>
      <Button type="submit">Create account <span aria-hidden="true">↗</span></Button>
      <p id="register-status" role="status">{submitted ? 'Your details passed validation. This demo does not create an account or send your information.' : 'Demo form — no account will be created.'}</p>
    </form>
  </section>
}
