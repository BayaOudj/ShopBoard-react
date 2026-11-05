# Shopboard React

Completed React migration of the Shopboard demo. The original reference application
at /Users/mac/CodeHub/shopboard is unchanged. Read AGENTS.md for coding rules and
[docs/MIGRATION.md](docs/MIGRATION.md) for the migration history and parity checklist.

## Run locally

Use the Node version pinned in .nvmrc. Install with npm ci, then run:

```sh
npm run dev -- --port 5180 --strictPort
```

Open http://localhost:5180/. The original site can continue running on its own port.

## Implemented behavior

- Responsive liquid-glass shell, sidebar/mobile navigation, active breadcrumbs,
  person avatars, notifications popover, search shortcut, and reduced motion.
- Original 15-product catalog, three collections, 45 images, combined filtering,
  search, price sorting, names-only view, summaries, and both empty messages.
- Native accessible detail/cart dialogs, synchronized color previews, separate
  cart variants, quantities 1–99, removal, subtotal, order review, and toasts.
- Compatible shopboard-cart-v1 storage with legacy migration, validation, guarded
  persistence, and an in-memory fallback when storage is unavailable.
- Catalog metrics, price/category charts, an accessible chart-data table, and
  product-table links to details.
- Community registration with original browser validation and local demo feedback.

Product data remains static JSON served over HTTP. Registration creates no account;
order review places no order, and payments/live inventory are not connected.
Browser storage is isolated by origin: changing the development port does not
transfer a cart automatically. The compatible key/format supports replacing the
original app on the same production origin without inventing a new storage format.

## Architecture

```text
src/
  app/                      # composition, shell, navigation/search hooks
  modules/
    products/               # api, model, hooks, components
    cart/                   # model/reducer/persistence, hook, components
    dashboard/              # pure statistics and chart/table components
    registration/           # registration component
  shared/
    api/client.ts           # the only application fetch call
    config/env.ts           # public API base configuration
    lib/                    # shared formatting
    ui/                     # buttons, native dialogs, image fallback, toasts
    styles/                 # design tokens and global typography/reset
  test/setup.ts
public/
  api/products.json
  images/products/
scripts/verify-browser.mjs
```

The app owns one catalog-loading hook, one cart hook/reducer, and one color-selection
mapping. Features receive data/actions through application composition. Components
use CSS Modules. The HTTP client returns unknown; the product API validates it.
Aborted or stale requests cannot overwrite the latest catalog state. Cart storage
is not written until a valid nonempty catalog is available.

Leave VITE_API_BASE_URL empty for the bundled same-origin catalog. See .env.example
for public configuration. Only override it for a backend implementing the same
endpoint/response contract; cross-origin servers require appropriate CORS. Restart
Vite after changing local env files. Never put secrets in VITE_* variables.

## Automated checks

```sh
npm run check
```

This runs strict typecheck, Oxlint, all Vitest/React Testing Library tests, and the
production build. The application and tests use separate TypeScript configurations
so Node-based fixture/asset checks do not expose Node globals to browser code.

Other commands: npm test, npm run test:watch, npm run lint, npm run typecheck,
npm run build, and npm run preview.

## Repeatable production-browser verification

Start the production server in one terminal:

```sh
npm run build
npm run preview -- --port 5181 --strictPort
```

Launch a SEPARATE headless Chromium profile with remote debugging in another terminal.
For Chrome on macOS, for example:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-first-run --remote-debugging-port=9223 --user-data-dir=/private/tmp/shopboard-react-test-browser about:blank
```

Use an isolated test profile, not your normal signed-in browser. If the port is
already in use, reuse the isolated test instance or choose a different debug port.
Then, from this project in a third terminal:

```sh
npm run test:browser
```

APP_URL defaults to http://localhost:5181/ and BROWSER_DEBUG_URL defaults to
http://127.0.0.1:9223. Both can be supplied as environment variables. The script
uses Node's native WebSocket/CDP support; no browser-test package is required.
It preserves/restores the test profile's prior cart and writes desktop/mobile
screenshots to the OS temporary directory.

The browser checks cover real HTTP loading/errors/retry/empty results, complete
shopping and persistence flows, native dialog focus/Escape, original quantities
and variant rules, registration validation, image fallback, long names, four
viewport sizes, accessible labels, reduced motion, and runtime/React errors.

## Verification status

All migration phases (0–7) are complete. Strict typecheck, lint without warnings,
64 automated tests, production build, and the production-browser verification
passed. The original reference working tree remains clean. Nothing was deployed
or pushed as part of this migration.
