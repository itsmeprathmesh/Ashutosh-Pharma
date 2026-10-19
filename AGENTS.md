# Ashutosh Pharma B2B pharmaceutical export website

Client: Ashutosh Pharma, Nagpur, India. WhatsApp: +91 80438 21323.
Verify GST, IEC, and drug licence numbers against client documents before publishing them.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS, server components by default.
- Prisma 6 with Neon PostgreSQL. `DATABASE_URL` is pooled; `DIRECT_URL` is direct and used for migrations.
- Vercel Blob for images, Resend for email, hosted on Vercel.
- Admin protected by HTTP Basic Authentication using `ADMIN_USER` and `ADMIN_PASS`.
- Never write files to local disk at runtime or keep rate-limit state in memory; use the database.
- In Next.js 15, `params` and `searchParams` are Promises and must be awaited.

## Hard rules

1. Never publish anabolic steroids, testosterone, nandrolone, trenbolone, growth hormone or HGH, zopiclone, modafinil, tramadol, or any other controlled or abuse-prone product. Imports and admin saves must use the shared controlled-product filter and report skipped items.
2. The site is B2B only: no cart and no public prices. Prescription (Rx) products require an importer licence number on the enquiry.
3. Patent-restricted products, including tirzepatide and Mounjaro, are enquiry-only and must not be offered where that would infringe a patent.
4. Never claim approvals or certifications the client has not provided. Mark unverified regulatory claims with `TODO` for human review.
5. SEO targets licensed importers and B2B buyers, never consumer “buy online” phrases.
6. Never commit `.env` files, API keys, or passwords.
