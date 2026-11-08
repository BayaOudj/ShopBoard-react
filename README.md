# ShopBoard React

A multi-page Vite, React, and strict TypeScript demo shop with a static catalog,
persistent cart, and validated demo checkout.

## Setup

Use the Node LTS version in `.nvmrc`, then:

```sh
npm ci
npm run dev -- --port 5173
```

Open http://localhost:5173. Optional public API configuration is in `.env.example`.
The default is the bundled same-origin static demo API. An external API must
support both the catalog and single-product contracts below. Never add secrets
to `VITE_*` variables.

## Routes

All pages share the sidebar, header, cart access, footer, and skip link. Page
modules are imported only when opened using `React.lazy`; React Router preserves
URLs and browser back/forward navigation.

| URL                                  | Page                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| `/`                                  | Overview, catalog metrics                                             |
| `/products`                          | Search, combined filters, sort, names-only view, variant controls     |
| `/products?collection=slow-mornings` | Catalog scoped to a collection; collection links supply the actual ID |
| `/products/:id`                      | One product fetched by its encoded ID, or product-not-found feedback  |
| `/collections`                       | Three collection links                                                |
| `/insights`                          | Category charts, accessible chart data, product table                 |
| `/community`                         | Local demo registration                                               |
| `/cart`                              | Quantities, variant lines, removal, subtotal, checkout link           |
| `/checkout`                          | Validated delivery form and local demo confirmation                   |
| any unmatched URL                    | 404 within the shared layout                                          |

## Component tree and ownership

```text
StrictMode
└─ AppErrorBoundary
   └─ App → RouterProvider
      └─ ShopLayout
         └─ ShopProvider (Context)
            ├─ Shell
            │  ├─ Brand + route navigation
            │  ├─ Header (cart count, search, notifications)
            │  ├─ main → SectionBoundary → Suspense → Outlet
            │  │  ├─ OverviewPage → Hero + SectionBoundary → DashboardOverview
            │  │  ├─ ProductsPage → CatalogSection → ProductCard → PurchaseControls
            │  │  ├─ ProductPage → PurchaseControls
            │  │  ├─ CollectionsPage → CollectionsSection
            │  │  ├─ InsightsPage → CatalogInsights
            │  │  ├─ CommunityPage → RegistrationSection
            │  │  ├─ CartPage
            │  │  ├─ CheckoutPage → react-hook-form + Zod + shadcn/ui controls
            │  │  └─ NotFoundPage
            │  └─ Footer
            └─ Toast
```

Context is sufficient for this focused shared state: one provider owns the cart
reducer, catalog resource, and selected colors across routes. A second state
library would add no required capability. Consumers use `useShop()` actions;
no intermediate components forward shared state. The cart's `useCart` hook and
products' `useShop` hook are the explicit cross-feature interfaces.

The catalog resource owns one validated result and its stable promise.
`useSyncExternalStore` subscribes the cart to that result without an effect that
copies API data into React state. Pages read the same promise with React `use`.
Request work starts in route loaders or retry handlers. The detail loader requests
its own single-product resource and passes the router's cancellation signal.
Retired catalog resources have no subscribers, so late responses cannot replace
the current catalog. There is no render-triggered fetching.

Cart count, line items, subtotals, filtered products, and metrics are derived.
Filters/view controls belong to the catalog page. Checkout fields and confirmation
belong to checkout. Effects remain for external work such as guarded persistence,
keyboard listeners, toast timers, and focus management.

## Loading, errors, persistence

Each route has a Suspense fallback and retryable Error Boundary; the overview also
isolates its metrics, leaving the hero and navigation available during slow or
failed requests. Retry creates a new catalog resource and revalidates the product
loader. A separate reload action recovers failed JavaScript chunks or unexpected
application failures. Empty catalogs, no search matches, empty carts, unknown
products, and unknown routes have distinct feedback.

The cart retains `shopboard-cart-v1`, `id::color` entries, legacy migration, and
integer quantities 1–99. Restoration precedes persistence. Failed/empty catalog
loads do not erase saved carts; unavailable storage falls back to memory. Browser
storage belongs to its origin, so different development ports have separate carts.

## Checkout and shadcn/ui

`checkout.schema.ts` is the single source of field validation. react-hook-form uses
`zodResolver`, validates on blur/submission, associates errors with inputs, focuses
the first invalid field, and prevents duplicate submissions while pending.
International city/country and postal code formats are allowed. Completion focuses
the confirmation and preserves the cart.

The local shadcn/ui Input, Radix Label, and Slot/CVA Button source is adapted to
CSS Modules and the existing visual design, following the
[shadcn/ui form integration](https://ui.shadcn.com/docs/forms/react-hook-form).
These source-owned controls live in `src/shared/ui/shadcn/`; they need no second
styling framework. See the adjacent license.

No personal checkout information is sent or persisted. This demo has no payment,
order, authentication, stock, shipping, or tax backend. Registration creates no
account. Cart prices remain demo catalog prices.

## Static API and hosting

`GET /api/products.json` returns the canonical 15-product catalog.
`GET /api/products/:id.json` returns one product. The small Vite plugin in
`scripts/product-api.ts` serves single-product JSON during development and emits
15 JSON assets during production builds, generated from the canonical catalog.
Do not edit generated `dist/` assets. `src/shared/api/client.ts` is the only app
file that calls fetch; product API boundaries validate responses and IDs.

For production, serve `dist/` and rewrite application paths such as `/checkout`
and `/products/1` to `/index.html`. Serve `/api/*` and `/assets/*` as static files
**before** that fallback; missing API/assets must return HTTP 404, never HTML.
Vite preview supports SPA deep links. Arbitrary external hosts need the same rules.
The browser check verifies direct URLs, refreshes, and a missing product.

## Verification

```sh
npm run typecheck
npm run lint        # warnings fail too
npm run format:check
npm run format      # apply the shared formatting rules
npm test
npm run build
npm run check       # typecheck, lint, format, tests, build; fail on any error
npm run test:watch
npm run preview -- --port 5181
```

Vitest/Testing Library cover domain logic, API validation, cancellation, retries,
cart migration/storage failures, filters, cross-page variants/cart, checkout
validation and completion, loading isolation, and the 404 page. Lazy route tests
allow five seconds for dynamic imports on slower parallel test workers.

For browser checks, launch Chrome with a dedicated temporary profile and debugging
port, then point the script at a running dev server or production preview:

```sh
APP_URL=http://localhost:5181/ BROWSER_DEBUG_URL=http://127.0.0.1:9224 npm run test:browser
```

The script preserves the profile's prior cart, checks lazy loading, shopping,
refresh restoration, checkout accessibility/completion, 375/768/1024/1440px
layouts, missing routes/products, delayed requests, retry, and runtime errors.
Its screenshot is written to the operating system temporary directory. Use a
dedicated test profile; never attach it to a real shopping session.

Migration history: [docs/MIGRATION.md](docs/MIGRATION.md). The new multi-page
requirements supersede that document's original single-page/anchor-only design.

## Commit checks and API state exercises

`npm ci` activates the tracked `.githooks/pre-commit` through `prepare`.
For an existing install, run `npm run prepare`. The hook runs `npm run check`:
a failed typecheck, lint (including warnings), formatting check, test, or build
stops the commit. `npm run test:hooks` proves each failure and the all-pass path
in a disposable repository without committing or staging project files. Like
all local Git hooks, this can be bypassed explicitly with Git's `--no-verify`.

To exercise loading, failure, and empty API states, set **one** value in a local,
ignored `.env.local`, then restart `npm run dev`:

```dotenv
VITE_API_BASE_URL=/delay/3000
# or /fail/500
# or /empty
```

- `/delay/3000` delays catalog and individual-product responses by three seconds.
- `/fail/500` returns HTTP 500. Retry makes a new request; it continues to fail
  until this base URL is cleared. Other independent pages remain usable.
- `/empty` returns an empty catalog and product-not-found for individual IDs.

Saved carts survive all three modes. Clear `.env.local` or the variable and restart
to restore the normal API. These controls work in development and Vite preview;
they are not deployed production API assets. To test a configured production build,
set the variable when building, then use Vite preview.

With an isolated Chrome debugging profile running, `npm run test:states` starts
three temporary Vite servers with the actual environment values and verifies their
browser states, retry requests, saved-cart safety, and Console warnings. It stops
the servers afterward. The standard browser test also fails on Console warnings.
Expected HTTP errors and React's caught-error diagnostics during deliberate
`/fail/500` tests are distinguished from unintended runtime errors.

See [docs/AUDIT.md](docs/AUDIT.md) for the task checklist, available-notes review,
repository cleanup, and the distinction between local work and published GitHub.
