# Website audit report

Audit date: 2026-10-19. This report distinguishes checks run locally from checks that require a working database, credentials, or live services. No production environment file was inspected or used. `.env.test` contains only loopback URLs and has no database listener available at `localhost:5432`.

## Summary by requested area

| # | Result | Findings |
|---|---|---|
| 1. Pages | Partial | Production build discovered the App Router pages and completed. Playwright verified 11 representative public routes (home, shop, about, contact, blog, oncology, legal pages, and English/Portuguese Brazil export pages) return 200, have one H1/title/description/canonical, no horizontal overflow at 1366 and 390 widths, and no obvious placeholder tokens like `undefined`/`null`. A fabricated URL returned 404. Full sitemap and every dynamic product/category/blog URL were not crawled. TODOs remain (listed below). |
| 2. Links | Not run | No depth-2 crawl or external HEAD sweep was completed. |
| 3. Navigation | Not run | Public route rendering was tested; menu interactions, search, category filtering, sort, pagination, product detail, breadcrumbs, and back navigation were not exercised. |
| 4. Enquiry list | Blocked | No test database is listening. No create/update/delete enquiry writes or persistence verification were attempted. |
| 5. Forms | Partial / blocked | Filled honeypot now returns 400. The database-backed form submissions, 429 threshold, Resend failure persistence, upload size/type checks, and newsletter save were not exercised without the test database and Blob configuration. |
| 6. Admin | Blocked | Basic-auth middleware is present, but credentialed admin/API actions and database CRUD/status/CSV flows were not exercised. |
| 7. Import | Partial / blocked | Unit tests cover CSV, TSV, XLSX, JSON parsing and Google Sheets URL validation (including rejecting non-Google hosts). Database dry-run/import, repeat import counts, sheet fetch/webhook, and upload size/error paths were not run. |
| 8. Controlled products | Partial | The shared filter passed 21 unit cases, including all requested blocked terms and normal-medicine allow cases. Database, sitemap, and complete JSON-LD scans were not run. The public route test found no price or cart/checkout action on its sampled pages. |
| 9. SEO | Partial | Sampled pages have unique titles/descriptions and canonical links; global Open Graph/Twitter metadata was added, and Brazil language alternates are configured. Sitemap/robots contents, every country page's text similarity, five-FAQ content, and schema validity were not verified. Country-page JSON-LD and genuinely unique destination copy remain gaps. |
| 10. Accessibility | Partial | axe-core ran on 11 representative public routes in desktop and mobile projects: no serious or critical violations were reported. Dark-mode contrast, keyboard paths, focus trap/Escape behavior, and all dynamic page types were not fully tested. |
| 11. Security | Partial | CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options, and Permissions-Policy are configured in `next.config.ts`. No complete auth, injection, upload, error-stack, cookie, or client-bundle secret scan was performed. `npm audit` reports 9 high and 3 moderate advisories after the Vitest upgrade; see below. |
| 12. Performance | Not run | Lighthouse was not run; there are no before/after Lighthouse scores. Build output reports 103 kB shared first-load JS and 177 kB for home, but that is not a Lighthouse substitute. |
| 13. Responsive | Partial | Automated overflow checks passed at desktop 1366x800 and mobile 390x844 for sampled routes. The requested 30 screenshots at six widths were not produced or visually reviewed. |
| 14. Error states | Partial | Custom 404, root error boundary, and loading state were added. The bad-URL 404 was tested. Database outage, slow network, empty shop, and missing-product-image placeholder scenarios were not exhaustively exercised. |
| 15. Code | Partial | `npm run lint`, `npm run typecheck`, and `npm run build` completed successfully with no lint/type/build errors. Unit tests: 25 passed. Playwright reported all 24 sampled desktop/mobile tests passing, but its Windows process did not exit cleanly after printing the completed test cases; therefore the aggregate `npm run check` did not return a confirmed zero exit code in this environment. `npm audit fix` was attempted without force; remaining advisories are documented below. |

## Fixes made

- Public pages now use safe database fallbacks when no database is configured; enquiry and subscription writes return a clear 503 instead of crashing when the database configuration is absent.
- The production `build` script no longer runs `prisma migrate deploy` as a side effect. Separate test migration/seed commands read only `.env.test` and guard both `SITE_URL=localhost` and a localhost database whose name contains `test`.
- The homepage hero renders exactly one H1 rather than one H1 for every carousel slide.
- A populated honeypot is rejected with HTTP 400 instead of being reported as a successful submission.
- Added unique page metadata for static public routes, global Open Graph/Twitter metadata, and customer-facing not-found/error/loading states.
- Added Playwright projects for desktop (1366x800) and mobile (390x844), axe checks for sampled public route types, unit coverage for the controlled-product filter and import parsers/Google Sheet URL validation, and safe synthetic import fixtures.
- Updated Vitest to v5 after npm audit identified critical issues in the earlier test-runner dependency tree. `npm audit fix` removed the critical advisories without forcing major framework downgrades.
- Corrected the no-cart browser assertion: the original matcher falsely treated the explanatory phrase “No prices or checkout” as an actual checkout feature.

## Test evidence

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; Next.js generated 35 pages/routes.
- `npm run test:unit`: 25 tests passed across controlled-product and import parsing suites.
- Playwright: 24 sampled public route/404 cases printed as passing (12 desktop, 12 mobile); the runner hung during Windows shutdown after those results, so aggregate exit status is not confirmed.
- Chromium installation completed.
- Test database availability probe: `localhost:5432` returned `TcpTestSucceeded: False`. The guarded migration and seed commands were both attempted against only `ashutosh_pharma_test` at localhost and failed because no PostgreSQL server is listening. No database writes occurred and no other database was contacted.
- Audit after non-forced `npm audit fix`: 12 advisories (9 high, 3 moderate, 0 critical). High advisories include Prisma 6's `deepmerge-ts`, Next 15's PostCSS dependency, and ESLint's `braces` dependency. npm's suggested automatic fixes require major-version changes; no forced framework downgrade was applied.

## Remaining TODOs and client inputs

- Verify and replace the business email, company history/capability copy, postal/contact details, drug licence number, and all regulatory/compliance claims with client documents.
- Replace the four `TODO` metric values in `src/config/site.ts` only with client-verified figures.
- Populate `src/data/manufacturers.ts` with manufacturers the client actually distributes; add only client-supplied certificates/logos under `public/certs`.
- Complete and legally review Terms, Refund policy, Privacy, and Returns content.
- Review the draft export-market content and regulator references country by country; add five approved, country-specific FAQs and distinct destination copy. Country pages currently contain repeated draft language and are not ready as final SEO landing pages.
- Add client-approved blog posts and real catalogue records/images. Do not interpret the synthetic test fixture as a commercial product.
- Confirm real Resend sender/recipient credentials and private Blob configuration before enabling live submissions/uploads.

## Manual/live checks still required

- Start an isolated PostgreSQL database named for tests, put only its loopback URL in `.env.test`, then run `npm run db:migrate:test`, `npm run db:seed:test`, and database-backed admin/enquiry/import tests.
- Verify real email delivery and persisted enquiries when Resend fails; verify private document upload/download and file rejection.
- Test WhatsApp on a phone, Safari on iPhone, Google Sheet sync with the real secret and a controlled test sheet, and live DNS/HTTPS/security headers.
- Run the requested sitemap/link crawl, 30 responsive screenshots and visual inspection, dark-mode/keyboard checks, injection/error response checks, and Lighthouse for home/shop/product/country pages on a production server.
- Revisit the remaining npm audit advisories when compatible patched upstream versions are available; avoid major dependency changes without a compatibility test plan.

## Lighthouse scores

Not measured. No before/after scores are available; Lighthouse was not run in this pass.

## 2026-10-25 production-readiness follow-up

This follow-up reviewed the performance/reliability changes in the working tree. It did not use the values in `.env.local` to connect to a database or service.

### Priority findings

| Priority | Finding and impact | Smallest practical next step |
|---|---|---|
| P0 before public launch | Business, regulatory, legal, catalogue, and country-page content still needs client and qualified regulatory review, as listed above. Incorrect claims or products could create regulatory and commercial risk. | Complete the client-review checklist with source documents; preserve the shared controlled-product filter and Rx licence requirement. |
| P1 before production rollout | Seven additive PostgreSQL indexes are in the new migration but have not been applied or measured against a populated database. Production query plans, table sizes, and Neon connection limits are unknown. | Rehearse the migration on a staging clone, inspect `EXPLAIN (ANALYZE, BUFFERS)` for the actual catalogue/enquiry queries, then schedule deployment with a current backup and monitor index build/DB load. |
| P1 before production rollout | Vercel and Neon environment configuration, backups/PITR, alerts, and integration delivery are not verifiable from this checkout. | Confirm pooled runtime URL, direct migration URL, function timeouts, Neon pool limits, backup retention, and alerts in the provider consoles; run staging enquiry/email/upload flows. |
| P2 | The enquiry throttle uses a database count before insert. Concurrent requests can race the five-per-hour limit, and the configured Vercel forwarded-IP behavior has not been exercised in a deployed request. | Verify the observed IP header in staging and, if abuse risk warrants a strict ceiling, serialize the per-IP count/insert or use a platform rate-limit feature backed by shared storage. |
| P2 | Dependency advisory status could not be refreshed because the npm registry audit endpoint was unreachable. | Rerun `npm audit --omit=dev --audit-level=high` from an environment with registry access and review compatible fixes before upgrading frameworks. |

### Changes in this follow-up

- Added short-lived shared caching for public catalogue/blog reads, bounded catalogue page sizes, and invalidation hooks after admin/import changes.
- Added query indexes, bounded request-body parsing, safer DB failure responses, DB-backed enquiry throttling, bounded Resend wait, and an app liveness endpoint.
- Added local-only k6 and Node smoke-load scenarios. The smoke runner refuses non-local hosts; tests should still use a test-only app configuration.
- Added `.env.example` with placeholders only and updated setup/deployment guidance. `.env.local` remains ignored and was not added to Git.

### Verification evidence from this follow-up

- `npm run typecheck`: passed.
- `npm run test:unit`: 28 tests passed across 3 files.
- `npm run db:validate`: passed with dummy loopback connection strings; no database connection or migration was made.
- ESLint on `src/app` and `src/lib`: passed. A full-root ESLint invocation was slow to initialize in this Windows workspace; the scoped source lint completed successfully.
- `npm run build`: passed; Next.js compiled and generated 36 routes with database access disabled and dummy loopback URLs.
- Local production-server smoke load: 5 workers for 15.1 seconds, 229 requests, 15.16 requests/second, 0 errors, all HTTP 200; aggregate p50 202 ms, p95 850 ms, p99 1,337 ms. Runner RSS was 72.8 MiB. Home p95 was 929 ms and shop p95 was 850 ms. This is a small local, database-disabled smoke run, not a capacity benchmark or a prediction of Vercel/Neon performance.
- `npm audit` did not return advisory data because the registry endpoint was unreachable.
- Playwright previously printed 24 passing desktop/mobile cases but did not exit cleanly; its aggregate exit status remains unconfirmed. A test database and provider credentials were not available for database-backed/admin/integration tests.

### Deployment status

The audit changes were committed and pushed to GitHub `main` as `962f3ff`. No production database migration, production load test, or provider-console change was performed. A GitHub push may trigger an automatically connected deployment; check Vercel's deployment status and logs. Do not describe the service as production-ready until staging migration/integration checks, dependency review, and the P0 client review are complete.
