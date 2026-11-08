import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return (
    <section>
      <h1>404 — Page not found</h1>
      <p>This page does not exist.</p>
      <Link to="/products">Browse products</Link>
    </section>
  )
}
