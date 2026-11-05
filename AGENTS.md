# Project instructions

Build the user's requested application with Vite, React, and TypeScript. These
instructions are defaults for a fresh project, not a specification for a particular
product. The user's requirements determine features, design, and integrations.

## Work approach

- Inspect package.json, configuration, and relevant code before editing. Preserve
  working behavior and the user's unrelated changes.
- For substantial features, briefly explain the approach, then implement and verify
  it. Ask only when a missing decision materially affects scope, behavior, or access
  to an external service; continue independent work where possible.
- Build complete user flows. Buttons, navigation, forms, and feedback must have
  meaningful behavior. Clearly identify demo behavior and unavailable integrations.
- Prefer simple, readable solutions. Add dependencies or abstractions only for a
  concrete need; reuse installed capabilities and compatible stable packages.
- Explain meaningful changes, verification results, and remaining limitations.
  Report checks actually performed; distinguish passing checks from assumptions.

## Stack and tooling

- Use function components and hooks for normal UI; a small class-based error
  boundary is an acceptable exception. Use .tsx for JSX and .ts for non-JSX code.
- Keep TypeScript strict. Narrow unknown external data; do not use any, unchecked
  casts, or compiler/lint suppressions to conceal errors.
- Keep React StrictMode enabled and follow the Rules of Hooks. Keep the scaffold's
  hooks and refresh lint rules enabled; do not suppress dependency warnings.
- Use npm and one package-lock.json. Keep dependencies and the lockfile in sync.
- Keep a supported Node LTS version pinned in .nvmrc. Do not replace the generated
  Vite/TypeScript configuration wholesale when a small adjustment suffices.

## Architecture: features and shared infrastructure

- Organize by feature under src/modules/<feature>/, not global folders containing
  every application's component, hook, or service.
- src/main.tsx mounts React. src/app/ composes the application shell, providers,
  route configuration when needed, and application-level error handling.
- A feature may contain components/, hooks/, api/, and model/ as needed. model/
  holds feature types and pure domain logic. Keep tests beside the code they test.
  Do not create empty folders or require every feature to use every layer.
- src/shared/ contains genuinely reusable UI, HTTP infrastructure, configuration,
  and styling. Shared code must not import application or feature code.
- Dependencies flow from app to modules to shared; app may also use shared.
  Compose features through props/providers at the app level where practical.
  When features must collaborate directly, use a small explicit public interface;
  avoid circular dependencies and imports into another feature's private files.
- Business logic must work without React or the DOM. Domain types belong to their
  feature; transport schemas and domain models may differ and require mapping.
- Start with relative imports. If aliases become useful, configure them consistently
  in Vite, TypeScript, and tests. Avoid broad barrel exports and forwarding files.

## React components and state

- Render through JSX, props, and state. Do not render React-owned content through
  innerHTML, createElement, querySelector, or replaceChildren.
- Use refs for imperative browser APIs such as focus, scrolling, and native dialogs.
- Keep components focused and extract meaningful repeated UI or behavior, not every
  element. Use stable domain IDs as keys; never generate random keys during render.
- Keep state close to its owner. Share it through props first; use context/reducers
  for state genuinely shared across a feature or application. Do not add a global
  state library by default.
- Keep one source of truth. Derive filters, totals, and other computed values during
  rendering; do not synchronize redundant state through effects.
- Keep rendering pure. Do not mutate props/state, perform requests, write storage,
  or cause other side effects during render.
- Use effects for external synchronization. Include actual dependencies and clean
  up timers, subscriptions, observers, and requests. Cancel or ignore stale results.
  Effects must remain correct across setup, cleanup, and repeated setup in StrictMode.
- Put user-triggered operations in event handlers. Prevent duplicate mutations;
  do not repeat non-idempotent operations automatically in mount effects.
- Provide an app-level error boundary with a useful fallback for unexpected render
  failures. Handle request and event errors explicitly; an error boundary does not
  replace those flows.
- Add memoization only when a demonstrated performance problem justifies it.

## APIs, asynchronous behavior, and persistence

- src/shared/api/client.ts is the only application file that directly calls fetch.
  Feature api/ files call this client; components and hooks call feature APIs.
- The client handles URL/configuration, HTTP status errors, cancellation signals,
  and response decoding, including empty responses where applicable. It must not
  assume every response has JSON or add JSON headers to FormData uploads.
- Validate untrusted responses at feature API boundaries and map them to domain
  models. TypeScript generics do not validate runtime data.
- Represent request states explicitly: idle when needed, loading, success, and error.
  Treat an empty loaded collection separately from zero filtered results. Expose
  accessible loading feedback and a meaningful retry action for recoverable errors.
- Handle pending, success, and failure for mutations too. Preserve user input and
  previously valid data where appropriate; avoid duplicate submissions.
- Avoid stale updates and unnecessary duplicate loads. Use a feature data hook for
  simple loading; adopt a server-state library only when caching/revalidation needs
  justify it. Do not maintain two competing sources for the same server data.
- Keep API URLs in centralized configuration. Never invent a working backend,
  authentication, or payment service. If no backend exists, use clearly identified
  fixtures/mock services where suitable and state what is still unconnected.
- Keep localStorage access in the owning feature's persistence layer. Validate and
  version saved data, tolerate storage failures, and finish restoration before
  persisting initial defaults. Never erase saved data because a request failed.
- Browser code and VITE_* variables are public. Keep secrets on the backend;
  document required public variables in .env.example. Do not store passwords or
  sensitive authentication credentials in localStorage.

## UI, accessibility, and styling

- Follow the user's design brief. Do not impose a dashboard, palette, or aesthetic
  from another project. Build shared primitives when they have actual reuse.
- Use semantic HTML and native controls first. Every input needs an accessible
  label; icon-only buttons need an accessible name. Set button types explicitly.
- Validate forms and connect field errors to their inputs; browser-side validation
  improves usability but does not replace backend validation.
- Preserve keyboard operation, visible focus, useful error messages, live feedback,
  and dialog focus management. Do not communicate state through color alone.
- Default to CSS Modules for components and feature styles. Put global reset,
  typography, and design tokens in src/shared/styles/. Avoid broad global selectors
  that accidentally restyle unrelated components; no !important.
- Use mobile-first layouts with min-width media queries, responsive sizing,
  sufficient contrast, usable touch targets, and prefers-reduced-motion support.
- Use navigation appropriate to the app: anchors for sections, a router when
  distinct navigable screens need URLs. Preserve browser back/forward behavior.
  Configure and verify hosting fallback when using client-side URL routing.
- Handle broken/missing images, long text, empty content, and narrow screens.

## Verification and completion

- Use Vitest for logic and React Testing Library for component behavior. Test
  important user outcomes and regressions with accessible queries and user-event;
  do not test private hook variables or require snapshots for every component.
- Mock HTTP at the test boundary; cover relevant success, loading, error/retry,
  empty, cancellation/stale results, validation, and persistence behavior.
- Use browser checks for core flows and responsive layouts. Add repeatable browser
  tests when the risk or complexity warrants them; jsdom cannot prove layout works.
- Provide scripts for dev, build, preview, typecheck, lint, test, test:watch, and
  check. npm test must run once; npm run check must fail if any required check fails.
- Run typecheck, lint, relevant tests, and the production build before completion.
  Investigate runtime errors and React warnings. Never weaken checks or hide failed
  tests merely to report success. State any check that could not be performed.
- Keep fixtures, test browser state, and generated artifacts separate from real user
  data. Document setup and unusual implementation choices that future work needs.

## Current project tooling

- This Vite scaffold uses Oxlint rather than ESLint. Keep Oxlint and enable its
  React hook rules, exhaustive-deps, and refresh checks. Do not install a second
  linter solely to match a generic setup example.
- Original reference: /Users/mac/CodeHub/shopboard. Keep that folder unchanged.
- Follow docs/MIGRATION.md for phased feature migration and parity requirements.
