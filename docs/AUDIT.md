# ShopBoard audit — 2026-11-08

## Checklist and evidence

| Requirement                         | Implementation / verification                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck, lint, formatting, build  | `npm run check` runs these plus Vitest; Oxlint warnings fail the check. Prettier owns source/config/docs formatting.                                                                                                                                                                                             |
| Commit rejected on any failed check | Tracked executable `.githooks/pre-commit`, activated with `npm run prepare` (also run after install). `test:hooks` invokes real Git commits in an isolated temporary repo, forces each check to fail individually, proves no commit exists, and proves the all-pass path. Project files/index are not committed. |
| Delay, failure, empty base URLs     | Vite dev/preview middleware supports `/delay/3000`, `/fail/500`, `/empty` before `/api/products.json` or `/api/products/:id.json`. `.env.example` documents use. `test:states` launches actual environment-configured servers and exercises each in Chrome.                                                      |
| Loading isolation                   | Three-second API delay leaves overview hero and navigation available while metrics suspend. Routes keep the shared shell.                                                                                                                                                                                        |
| Failure/retry isolation             | HTTP 500 produces the section fallback and a working retry request. Retry remains an error while the base URL deliberately forces 500. Community stays available.                                                                                                                                                |
| Empty states                        | Empty API shows “No products yet”, distinct from search no-matches; empty cart/checkout, missing product, and 404 have separate feedback.                                                                                                                                                                        |
| Persistence safety                  | All three API-mode browser tests preserve a seeded saved cart. Reducer/persistence tests also cover invalid/legacy data, unavailable storage, quantities, and StrictMode restoration.                                                                                                                            |
| Console                             | Both browser commands fail on Console warnings. Unexpected runtime/React errors fail; deliberate failed HTTP requests and their caught-error diagnostics are identified as expected. No warning-suppression code was added.                                                                                      |
| Lazy routes and history             | Normal production browser test checks checkout is not requested on overview, direct product/cart/404 URLs, refresh restoration, and back/forward.                                                                                                                                                                |
| Checkout                            | One Zod schema, react-hook-form resolver, local shadcn/ui source, associated errors, first-invalid focus, accessible demo completion, no personal data request/storage.                                                                                                                                          |

## Available notes and lessons reviewed

Reviewed the user's four-part task, subsequent verification checklist, AGENTS.md,
README.md, docs/MIGRATION.md, and the implementation/verification notes from this
conversation. No separate lesson or personal-notes files were found in the
checkout. External course materials or personal notes were not provided, so this
audit does not claim to verify them.

The current implementation applies the task's ownership rules: one Context owner
for cart/catalog/colors, derived totals/counts/filtered results, page-local filters
and form state, actions for shared mutations, and direct Context consumption in
purchase controls. Router loaders start outside rendering; page data uses stable
promises and Suspense, with useSyncExternalStore for catalog subscriptions.
Effects synchronize external systems (persistence, keyboard events, timers, focus).
Router test fixtures dispose history listeners after each test. Vitest limits
concurrent workers to two to bound jsdom memory use alongside Chrome, retaining
all assertions, isolation, and existing timeouts.

No additional global store, backend, payment service, or duplicate catalog state
was introduced. The remaining cart memo keeps the validated persistence snapshot
stable across unrelated renders rather than optimizing speculative computation.

The user's multi-page task supersedes the historical migration's anchor-only and
modal-only navigation requirements. The remaining migration history is retained
as history, not a second specification of current routes.

## Repository purpose and cleanup

Removed obsolete single-page sidebar implementation, section-observer hook and
scroll-selection tests, modal detail/cart components and styles, unused native
Dialog infrastructure, and the superseded effect-based product-loading hook and
its tests. Replacement catalog-resource tests cover pending/success/error/empty,
one request per resource, subscriptions/unsubscriptions, and retired responses.
Removed unused modal/sidebar CSS and dialog-only shortcut plumbing. The smaller
test count reflects removal of replaced behavior, not ignored or disabled tests.

Remaining file groups have concrete purposes:

- `src/app`: shared composition, routes, lazy page adapters, error handling, shell,
  and integration tests.
- `src/modules`: product/cart/checkout/dashboard/community behavior, owned state,
  domain logic, API validation, CSS Modules, and behavior tests.
- `src/shared`: HTTP/configuration, reusable controls/images/toasts, styles, and
  local shadcn/ui source with its MIT attribution.
- `public`: canonical demo catalog, favicon, and 45 product color images used by
  the product image mapping (asset tests verify every referenced image).
- `scripts`: generated single-product API and local test controls, browser checks,
  environment-mode orchestration, and isolated Git-hook verification.
- Root configs: Vite, strict TypeScript, Vitest, Oxlint, Prettier, npm/lockfile,
  Node version, env example, ignore rules, and the tracked commit hook.
- Docs: newcomer setup/routes/component tree, current coding rules, historical
  migration decisions, and this evidence-based audit.

Dependencies/build output, local environment files, test screenshots, logs, and
browser profiles are excluded from the tracked source tree. Generated product JSON
is emitted into ignored `dist/` from the canonical catalog.

## Anonymous GitHub review

Read the public GitHub repository metadata and recursive `main` tree without
credentials at https://github.com/BayaOudj/ShopBoard-react. It is public. The
published tree at `6f136c4fe448086a44effae23d14d2c802463d4c` contained 139 files,
with no tracked node_modules, dist, coverage, logs, or private `.env` file.

That published commit is the earlier single-page application. The multi-page
implementation and this audit are local, uncommitted work; the newer routes and
quality-gate files are not on GitHub yet. No commit or push was performed as part
of this audit. A stranger cannot review these local changes until they are
committed and pushed.

## Final verification results

- `npm run check`: passed typecheck, zero-warning Oxlint, Prettier format check,
  all 59 current tests across 13 test files, and production build.
- `npm run test:hooks`: five deliberately failed gates each rejected a commit;
  the all-pass case accepted one, entirely within a disposable fixture repository.
- `npm run test:states`: passed actual `/delay/3000`, `/fail/500`, and `/empty`
  environment-configured browser runs, including cart safety and zero warnings.
- `APP_URL=http://127.0.0.1:5181/ npm run test:browser`: passed against the final
  production preview, including shopping, lazy loading, direct URLs, history,
  refresh persistence, checkout, four widths, retry, zero Console warnings, and
  zero unexpected runtime errors.
- Earlier unconstrained parallel jsdom execution hit test timeouts. The final run
  passed with two workers and explicit router-fixture disposal; no assertions or
  timeouts were relaxed and no failing test was disabled.
