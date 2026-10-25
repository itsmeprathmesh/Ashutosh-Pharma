# Ashutosh Pharma website

B2B pharmaceutical export enquiry website for licensed importers, hospitals, and distributors. The site uses Next.js 15, PostgreSQL, Prisma 6, Resend, and Vercel Blob.

## Local setup

1. Copy `.env.example` to `.env.local` and set the PostgreSQL, admin, Resend, and Blob values. Do not commit environment files.
2. Install dependencies with `npm install`.
3. Run database migrations with `npx prisma migrate deploy` after `DATABASE_URL` and `DIRECT_URL` point to the intended PostgreSQL database. Do not run migrations against production until reviewed and backed up.
4. Start the site with `npm run dev`.

The `npm run build` command generates the Prisma client and builds Next.js. It does not apply database migrations. A PostgreSQL database must be reachable for database-backed runtime features.

## Product and enquiry administration

- `/admin` is protected by HTTP Basic Authentication. Use a long random `ADMIN_PASS` and deploy with HTTPS.
- `/admin/products` supports product edits and publication controls. Saves run the shared controlled-product filter.
- `/admin/import` previews and imports CSV, XLSX, and JSON files, or a Google Sheet shared as view-only. The import API is limited to 4 MB per request; image files upload directly to a configured public Vercel Blob store.
- Product images should be named with the product slug, such as `tenofovir-disoproxil-fumarate-tablets.jpg`.
- Google Sheets auto-sync uses `SHEET_URL` and `IMPORT_SECRET` at `/api/import/webhook`.

## Environment variables

See `.env.example` for the full list. `DATABASE_URL` should be the pooled Neon connection string; `DIRECT_URL` should be the direct connection string used by Prisma migrations. The sample URLs include short connection/pool wait limits; size the pool against Neon’s connection budget and Vercel’s maximum concurrent functions. Set `NEXT_PUBLIC_SITE_URL` to the local or deployed site URL. Configure `RESEND_API_KEY`, `RESEND_FROM`, `OWNER_EMAIL`, and the public/private Blob tokens before enabling those integrations.

## Load testing

Install the k6 CLI, start the built app locally on port 3100 with a test-only database (or database access disabled) and no production credentials, then run `npm run test:load`. The scenario exercises read-only public pages and search with up to 10 virtual users. It refuses non-local `BASE_URL` values, but the local app could still connect to an external database if configured that way. Do not use production credentials or run against production without explicit approval. `npm run test:load:smoke` provides a shorter Node-based local run when k6 is unavailable. Check Vercel function and Neon metrics separately when testing a staging deployment.

## Runtime and scaling

The app is designed for Vercel serverless/managed Next.js hosting with Neon pooled `DATABASE_URL`; migrations use `DIRECT_URL`. Public catalogue and blog data use short-lived Next.js shared cache entries and are invalidated by admin product actions and catalogue imports. The `/api/health` route is a process liveness check only; it does not certify database or integration readiness. Add platform alerts for function errors, latency, database connections, storage, and email delivery before launch.

## Client review required before launch

- Replace TODO copy and verify the business email, address, licence number, company history, and all product details against client documents.
- Have a qualified pharmaceutical regulatory professional review the export country pages and clear their TODOs.
- Do not publish controlled or abuse-prone products. Prescription enquiries require an importer licence number. Patent-restricted products remain enquiry-only where permitted.
- Publish no unsupported approval or certification claims. The site is B2B only and has no public prices or consumer cart.
