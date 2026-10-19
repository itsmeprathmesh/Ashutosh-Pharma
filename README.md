# Ashutosh Pharma website

B2B pharmaceutical export enquiry website for licensed importers, hospitals, and distributors. The site uses Next.js 15, PostgreSQL, Prisma 6, Resend, and Vercel Blob.

## Local setup

1. Copy `.env.example` to `.env` and set the PostgreSQL, admin, Resend, and Blob values. Do not commit `.env`.
2. Install dependencies with `npm install`.
3. Run the initial database migration with `npx prisma migrate deploy` after `DATABASE_URL` and `DIRECT_URL` point to a reachable PostgreSQL database.
4. Start the site with `npm run dev`.

The `npm run build` command generates the Prisma client, applies pending migrations, then builds Next.js. A PostgreSQL database must be reachable for this command.

## Product and enquiry administration

- `/admin` is protected by HTTP Basic Authentication. Use a long random `ADMIN_PASS` and deploy with HTTPS.
- `/admin/products` supports product edits and publication controls. Saves run the shared controlled-product filter.
- `/admin/import` previews and imports CSV, XLSX, and JSON files, or a Google Sheet shared as view-only. The import API is limited to 4 MB per request; image files upload directly to a configured public Vercel Blob store.
- Product images should be named with the product slug, such as `tenofovir-disoproxil-fumarate-tablets.jpg`.
- Google Sheets auto-sync uses `SHEET_URL` and `IMPORT_SECRET` at `/api/import/webhook`.

## Environment variables

See `.env.example` for the full list. `DATABASE_URL` should be the pooled Neon connection string; `DIRECT_URL` should be the direct connection string used by Prisma migrations. Set `NEXT_PUBLIC_SITE_URL` to the local or deployed site URL. Configure `RESEND_API_KEY`, `RESEND_FROM`, `OWNER_EMAIL`, and `BLOB_READ_WRITE_TOKEN` before enabling those integrations.

## Client review required before launch

- Replace TODO copy and verify the business email, address, licence number, company history, and all product details against client documents.
- Have a qualified pharmaceutical regulatory professional review the export country pages and clear their TODOs.
- Do not publish controlled or abuse-prone products. Prescription enquiries require an importer licence number. Patent-restricted products remain enquiry-only where permitted.
- Publish no unsupported approval or certification claims. The site is B2B only and has no public prices or consumer cart.
