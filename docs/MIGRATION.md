# Shopboard React migration plan

## Scope and starting point

- Reference application: /Users/mac/CodeHub/shopboard. Keep it unchanged.
- New application: /Users/mac/shopboard-react.
- Original checkpoint: 866a211, Save working Shopboard before React migration.
- Target is the same working product and visual design implemented through React,
  not a new design, new backend, or new authentication/payment integration.
- The React starter uses React 19, Vite 8, TypeScript 7, and Oxlint. Keep its
  existing React plugin and linter, with hooks/exhaustive dependency checks enabled.
- Preserve the original API boundary: a shared client requests /api/products.json.
  This is a static JSON demo catalog served over HTTP, not a live inventory service.
- This plan precedes application-feature implementation. Tooling setup may be
  completed first; the Vite starter UI remains until the shell phase.

## Behavior that must survive

1. Fifteen products with the same numeric/string IDs, prices, categories, descriptions,
   local images, and three preview colors each. Three collections with identical
   product membership. Currency remains whole-dollar USD.
2. Combined collection/category/search/strict-under-$50 filters. Collection selection
   resets category, search, and price filter; selecting it again deselects it.
   Clear filters resets collection/category/search/price without resetting sorting
   or the names-only view. Search matches name/category case-insensitively.
3. Low/high price sorting and original featured order without mutating the catalog.
   Names-only mode still opens details. Summary displays visible/total count and prices.
4. Loading, success, error/retry, and empty-catalog feedback. No matches has distinct
   feedback, and clearing filters reveals loaded products without another request.
5. Selected color stays synchronized between cards and details, survives catalog
   rerenders during the session, and determines the variant added to the cart.
6. Cart counts quantities, preserves separate colors, enforces integer quantities
   1–99, removes via Remove, and calculates correct line/subtotals. Invalid quantity
   edits restore the previous value. Order review is a demo and places no order.
7. Storage key shopboard-cart-v1 and the id::color line format remain compatible.
   Legacy product-ID-only entries migrate to the first valid color and cap at 99.
   Invalid/malformed saved entries and unavailable storage cannot break the UI.
   Failed/empty catalog loads must never erase stored carts.
8. Native modal keyboard/Escape/focus behavior; product opens from image/name/card
   surface, without intercepting purchase controls. Closing restores focus appropriately.
9. Catalog-derived metrics, category price chart, mix donut/legend, accessible chart
   data, and product table. Empty data produces no invalid averages or chart values.
10. Community form labels and native validation (name >=2, valid email, password >=8),
    optional updates checkbox, and local demo confirmation. No real account is created.
11. Responsive sidebar/mobile navigation, active section/breadcrumb, / search shortcut,
    notifications popover, person avatars, toast announcements, skip link, footer,
    gradient motion, hover/entrance effects, and reduced-motion behavior.

## React architecture

```text
src/
  main.tsx                       # createRoot + StrictMode
  app/
    App.tsx                      # composition, application-owned selected product
    components/                  # shell/header/sidebar/overview hero/footer
    hooks/useSectionNavigation.ts
    providers/AppProviders.tsx   # only real shared owners, no placeholder providers
  modules/
    products/
      api/products.api.ts
      model/                     # Product/LoadState/filter types, pure selection,
                                 # collections, colors, image path helpers
      hooks/                     # catalog loading and catalog filter state
      components/                # catalog, controls, cards, collections, details
    cart/
      model/                     # types, calculations, reducer, persistence
      hooks/                     # provider and consumer hook for one cart owner
      components/                # dialog, rows, summary, order review, add action
    dashboard/
      model/                     # pure catalog-derived statistics
      components/                # metrics, charts, data table
    registration/
      components/RegistrationSection.tsx
  shared/
    api/client.ts
    config/env.ts                # only needed configuration
    ui/                          # reusable dialog, toast provider, person icon,
                                 # button/panel only when useful
    styles/                      # tokens/reset/typography and motion preferences
  test/setup.ts
public/
  api/products.json
  images/products/               # preserve every existing image filename
```

Use CSS Modules for component styles. Extract tokens/global primitives from the old
stylesheet and distribute component rules without changing the visual results.
Preserve current anchors (#hero, #products, #collections, #catalog-insights,
#register). No router is needed for this single-page application.

## Reuse versus rewrite

| Original | React target and treatment |
| --- | --- |
| shared/api/client.ts | Reuse HTTP behavior, add AbortSignal support through its existing options and explicit decoding/error handling. |
| products.api.ts | Reuse response validation and duplicate-ID checks in the feature API. |
| products.logic.ts / types | Reuse pure functions and types under products/model. |
| collections / colors | Reuse domain values, IDs, variant keys, and swatches unchanged. |
| products.images.ts | Reuse path/alt helpers; replace the module Map and DOM image updates with React-owned selected-color state. |
| products.load.ts | Replace callbacks into imperative render functions with an abortable React loading hook, stale-result protection, and retry. |
| products.ui.ts | Replace createElement/listeners with JSX and controlled filter/view state. |
| products.controls/details.ts | React purchase controls and detail dialog with shared selected-color owner. Use useId for independent radio groups. |
| cart.logic.ts / types | Reuse pure calculations and contracts. |
| cart.state.ts | Extract pure decoding/migration + guarded storage access. Replace mutable module state with reducer/context and a restoration guard. |
| cart.ui.ts | React dialog/rows/review. Compose purchase actions through app callbacks rather than UI-module circular dependencies. |
| dashboard.ui.ts | Separate pure statistics from JSX charts/table. App hook owns active-section observation and search shortcut. |
| registration.ui.ts | React form with the same native validation/demo semantics. |
| shared/ui/toast.ts | React toast provider with one announcement region and timer cleanup. |
| index.html | Move visible app markup into components; keep root, metadata, and entry script. |
| shared/ui/styles.css | Extract global tokens/reset and component CSS Modules; maintain animations and breakpoints. |
| existing Node tests | Port assertions to Vitest beside relevant model/API files; add React behavior tests for stateful UI. |

## State ownership

- Load the catalog once in an app-owned products hook and pass the result to
  collections, catalog, cart validation, and dashboard. Do not independently fetch
  the same catalog from every feature.
- Keep one selected-color mapping keyed by product ID; cards/details consume it.
  Selection is session-only, matching the existing behavior.
- Keep one cart reducer/provider. Restore storage only once a nonempty catalog is
  available. Persist only after restoration has completed. Effect setup/cleanup
  in StrictMode must not reset or double-migrate cart entries.
- Keep filter/view state in the products feature. Derive visible products and
  totals during render using pure selection logic.
- Keep selected product/dialog open state in application composition; pass handlers
  to catalog and dashboard instead of importing private feature components.
- Toast provider owns feedback state and timeout. Use refs for focus/dialog APIs,
  not DOM-based rendering. Avoid duplicate window listeners/observers.
- Guard duplicate user submissions. Abort obsolete loads and ignore cancelled results;
  never turn a cancellation into a visible request error. Correct StrictMode behavior
  matters more than forcing development request counts to equal production counts.

## Phases and acceptance

### 0. Environment and plan

Populate AGENTS.md, enable explicit TypeScript strictness, configure Vitest +
Testing Library, pin Node, preserve Oxlint and React plugin, and add scripts.
Acceptance: starter typecheck/lint/build pass; testing setup is configured. Do not
add meaningless tests or allow passing with no tests to claim coverage.

### 1. React shell and styles

Implement App composition, shell/header/sidebar, person icon, hero/footer, native
navigation/popover, shared tokens/global styles, and CSS Modules. Preserve anchors
and responsive spacing. Introduce shared dialog/toast components when first used.
Acceptance: React shell visually matches original desktop/mobile design; nav,
keyboard focus, and reduced-motion behavior checked; relevant shell tests pass.

### 2. Catalog transport and loading

Copy catalog JSON and product image files. Reuse types/API validation/client and
pure catalog logic. Add catalog hook with loading/retry/cancellation, both empty
conditions, and shared loaded state.
Acceptance: real JSON request, delayed load, HTTP failure/retry, invalid JSON/shape,
empty result, stale results, and unmount/StrictMode behavior verified.

### 3. Collections and catalog

Implement collection cards, filters, search, price toggle, sort, names-only mode,
cards, summary, and clear actions. Keep original filter-reset semantics.
Acceptance: combined filters, exact $50 exclusion, non-mutating sort, names-only
view, clear/reset behavior, and no-match recovery tests pass.

### 4. Details and preview colors

Implement accessible detail dialog and purchase/color controls. Synchronize preview
selection through state, retain alt text and representative-image disclosures.
Acceptance: card/details color synchronization, per-product independence, radio
keyboard behavior, Escape/close/focus restoration, and image paths verified.

### 5. Cart and persistence

Implement reducer/context, validated storage migration, add/remove/quantity actions,
cart dialog, subtotal/count, review, and toasts. Wire real purchase controls.
Acceptance: original calculation tests plus React interactions, reload persistence,
legacy migration, invalid storage, storage failure, max quantity, dialog focus,
no data loss on load failure, and StrictMode persistence tests pass.

### 6. Dashboard and community

Implement metrics/charts/legend/data table, links from table to details, active
navigation observation, keyboard shortcut, community form, and notifications copy.
Acceptance: $931 catalog total, 15 products, three collections, eight products under
$50, category values/counts, zero-data charts, form validation/demo feedback, and
keyboard navigation verified. No real sales/auth/payment claims introduced.

### 7. Parity and production validation

Compare original and React layouts side by side; test 375, 768, 1024, and 1440px,
long text, modal scrolling, keyboard-only navigation, reduced motion, and image
loading. Exercise the production build and verify /api/products.json and assets.
Run check, inspect browser runtime/React warnings, remove unused Vite starter code
only after replacement works, and document remaining limitations.
Acceptance: complete behavior checklist passes; original source remains unchanged.

## Safeguards and limitations

- Original and React sites on different ports have different localStorage origins.
  Preserving the key/format preserves compatibility when the React app replaces the
  original on the same origin; it does not transfer a browser cart between ports.
- Preserve static asset paths; do not substitute an unrelated remote catalog.
- No real accounts, backend inventory, payments, or order creation exist to migrate.
- Use browser test profiles/fixtures, not the user's real cart, for destructive checks.
- Commit working phases in the new repository when Git is initialized. Do not
  overwrite the original repository or publish/deploy as part of migration.

## Current status

Phase 0 completed on 2026-11-05:

- Populated the previously empty AGENTS.md with portable React rules and local
  Oxlint/reference-project instructions.
- Installed Vitest, jsdom, React Testing Library, jest-dom, and user-event.
- Added src/test/setup.ts, vitest.config.ts, scripts, .nvmrc, and artifact/env ignores.
- Enabled explicit TypeScript strict mode and Oxlint exhaustive-deps errors.
- Preserved the generated React plugin, starter UI, and existing configuration.
- Typecheck, Oxlint, and production build passed. Vitest configuration and test
  discovery loaded successfully. There are no feature tests yet; no test-pass
  claim is made and passWithNoTests is not enabled.
- The original reference project's Git working tree remains clean.
- The new React directory has no Git repository yet; no commits have been created.

Phase 1 completed on 2026-11-05:

- Replaced the Vite starter with src/app/App.tsx and a StrictMode React entry.
- Added shell/header/sidebar/hero/footer components, shared person icon, and an
  application error boundary. Updated metadata and the favicon to Shopboard.
- Extracted typography/reset/tokens and animated pastel background into shared
  styles; components use scoped CSS Modules.
- Preserved all five anchor destinations, active navigation, breadcrumbs, native
  popover open/dismiss/Escape behavior, skip-link keyboard focus, and person links.
- Section activity uses React state, DOM refs, passive scroll/resize listeners, and
  requestAnimationFrame throttling with cleanup. Regression coverage handles several
  anchors landing at the same maximum scroll offset.
- Added explicitly marked pending-feature sections. Cart is disabled, and the
  header's Products link navigates to the product section. Search and the / shortcut
  will be added when the real search controls exist.
- Removed unused Vite starter source/assets after the replacement checks passed.
  A temporary recovery copy was kept under /private/tmp/shopboard-react-vite-starter-backup.
- Typecheck, Oxlint without warnings, nine meaningful tests, and production build
  passed. Real-browser checks passed for navigation/breadcrumbs, keyboard popover
  controls, skip-link focus, 375/768/1024/1440px layouts, reduced motion, and absence
  of runtime exceptions. The shell does not modify persisted cart data.
- Preview: http://localhost:5180/ while the development server is running.
- Original reference working tree remains clean. No publishing or Git commits were
  performed in the React folder; it still has no initialized Git repository.

Phase 2 completed on 2026-11-05:

- Copied public/api/products.json and all 45 preview images byte-for-byte from the
  reference. The catalog remains a static JSON demo served over HTTP, not a live
  inventory backend. Product data, IDs, colors, and collection membership remain intact.
- Added shared/api/client.ts as the only application fetch caller. It supports
  headers and AbortSignal, preserves HTTP status errors, handles empty/HEAD/no-content
  responses, and surfaces non-JSON or malformed responses for feature error handling.
  Transport returns unknown rather than pretending a generic validates runtime data.
- Added centralized public API base configuration and .env.example. Same-origin is
  the working default; an optional configured backend must implement the endpoint.
- Ported product types, pure selection logic, collections, colors, and image helpers
  into modules/products/model. Image helpers have no mutable module selection Map;
  React-owned preview selection will be implemented in Phase 4.
- Added validated products.api.ts and an app-owned useProducts hook. Cleanup aborts
  requests, stale/cancelled results cannot change state, and duplicate retry clicks
  are guarded. Loading errors and empty responses never touch saved cart data.
- Replaced the Products placeholder with live catalog feedback: loading, connected
  product count, error/Try again, and No products yet. A separately tested no-match
  feedback variant is ready for Phase 3 filters; no fake search controls were added.
  Retry keeps keyboard focus on the feedback heading.
- Added separate TypeScript test configuration so filesystem-based asset checks
  have Node types while browser application code retains browser-only globals.
- Typecheck, lint without warnings, all 45 tests across nine files, and production
  build passed. Hook tests exercise delayed/empty/failing responses, retry guards,
  unmount cancellation, StrictMode replay, and deliberately stale late responses.
- Browser checks verified HTTP 503 retry, malformed JSON and invalid response shapes,
  empty catalogs, keyboard feedback focus, saved-cart safety, unchanged shell
  behavior, responsive layouts, and absence of runtime exceptions/React console errors.
- Production preview verified one catalog response per load, HTTP 200 JSON with all
  original fields/IDs, all 45 image files served successfully, and mobile layout.
- Original reference working tree remains clean; no publishing or Git changes were
  made to the original. The React folder still has no Git repository initialized.

Phases 3–7 completed on 2026-11-05:

### Phase 3: collections and interactive catalog

- Added controlled filter/view state and derived selection through the original
  pure logic. Search, category/collection filtering, strict under-$50 matching,
  sorting, names-only view, summaries, and clear/reset behaviors are working.
- Collection selection clears category/search/budget while retaining sort and view;
  clearing all filters likewise retains sort/view. Collection/reset actions restore
  useful category focus, matching the original behavior.
- Added real collection/product cards with intact local imagery, stable IDs, and
  accessible controls. No-match feedback is now connected to real filters.

### Phase 4: details and synchronized colors

- Added a reusable native Dialog and product detail component. JSX/state replaces
  DOM-based rendering. Native modal keyboard trapping, Escape, close, and focus
  restoration are verified in the production browser.
- The app owns one selected-color mapping. Cards and details use the same color,
  preview, radio state, and variant when adding to cart. Radio groups use useId.
- Added image fallback and text wrapping for missing images and long product names.
  Product IDs containing the variant delimiter are rejected at the API boundary.

### Phase 5: cart and persistence

- Added a pure reducer, quantity/price calculations, validated decoding/migration,
  guarded storage access, and an app-owned cart hook. A context/provider was not
  necessary: app composition passes the single owner's data and actions to features.
- Initialization snapshots saved data without writing it. A stable validated cart
  is derived only with a valid nonempty catalog, and only then persisted. This
  avoids destructive defaults and duplicate legacy migration under StrictMode.
- Preserved storage key/format, legacy product-only keys, per-color lines, 99 limits,
  integer-only quantities, separate Remove actions, badge, totals, and demo review.
- Cart rows keep controlled quantity edits and useful focus after removal; changing
  items invalidates a prior review. Toast handling is centralized in shared/ui.
- Storage read/write failures leave a usable in-memory cart; loading failures and
  empty catalogs leave stored data intact.

### Phase 6: dashboard and community

- Added pure catalog statistics and React metrics/charts/legend/data table. The
  original $931 total, 15 products, three collections, eight budget products, and
  category values/counts are preserved. Empty charts have no invalid values.
- Product-table entries open the same detail dialog. Restored product search in
  the header and the / shortcut without interrupting input editing or modals.
- Restored the community form and native validation/demo confirmation. No account
  request is made and passwords are not stored. Notifications remain explicitly
  demo workspace information, with no invented live-order backend.

### Phase 7: parity and production verification

- All 64 tests across 13 files pass. Strict typecheck, Oxlint without warnings,
  and the production build pass. Existing API/loading/state tests remain active.
- Added integration coverage for search/filter recovery, collection reset rules,
  card/detail colors, variants, quantities, review, persistence/reload, StrictMode
  legacy migration, maximum quantity, photos, analytics, and registration.
- Added scripts/verify-browser.mjs and npm run test:browser for repeatable checks
  against a separately launched Chromium debugging profile and production preview.
  The test profile's prior cart is preserved/restored; real user data is not used.
- Real-browser checks passed for complete shopping, HTTP failures/retry, empty
  catalogs, malformed JSON/shapes, saved-cart safety, native modal focus and Escape,
  mobile dialog sizing/scrolling, native form constraints, image fallback, long
  names, 375/768/1024/1440px layouts, reduced motion, and accessible input labels.
- No runtime exceptions or React console errors were reported. Desktop/mobile
  screenshots were inspected against the original layout and visual direction.
- Removed obsolete migration placeholders and clarified the feedback CSS Module.
  No new runtime libraries were needed beyond the existing React/Vite stack.
- The original project remains untouched. No Git initialization, commits, pushes,
  publishing, backend integration, authentication, or payment work was performed.

## Final status

All eight phases (0–7) are complete. Development preview: http://localhost:5180/.
Production preview: http://localhost:5181/ while the respective servers are running.
See README.md for installation, configuration, check commands, and browser testing.

Remaining product limitations match the original demo: static JSON catalog,
unverified stock, no real account creation, no payments, and no order placement.
Browser localStorage belongs to its origin; compatible cart format does not copy
saved data between different development ports automatically.
