AI Fashion Store is a personal side project: a small e-commerce experience for apparel that lets you try outfits on with AI, manage inventory, and explore modern Next.js patterns. It’s meant for learning and showing what I like to build, not as a polished production store.

Core features:
- Product catalog with filters, PDP gallery, cart, wishlist, and a test checkout path.
- AI try-on: upload a photo, render on-model looks via OpenAI/Stability/Replicate; Supabase-backed storage with safety toggles and quotas.
- Auth: NextAuth (credentials + OAuth), JWT sessions, admin gating, CSRF/rate-limit middleware.
- Admin: price/stock edits and product photo uploads; checkout decrements stock transactionally.
- UX polish: hero/landing, profile/orders, accessibility tweaks, SEO metadata, sitemap, custom 404/500.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tech Highlights
- Next.js App Router with custom error/404 pages and dynamic product/AI routes.
- NextAuth (credentials + OAuth) with JWT sessions, admin gating, CSRF checks, and rate limiting middleware.
- Stripe test checkout slot + zod-validated APIs and shared Postgres client.
- Supabase storage for uploads/AI assets; AI try-on pipeline (OpenAI/Stability/Replicate) with safety toggles.
- Sentry-ready (add DSN) logging hooks; `sharp`-based image hygiene and size/MIME guards.
- SEO/a11y: OpenGraph/Twitter meta, sitemap, focus styles and ARIA on key controls.

## Demo Script (local)
1) Env: set `POSTGRES_URL`, `AUTH_SECRET`/`NEXTAUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`, `ADMIN_EMAILS`, AI keys, Supabase keys, and `STRIPE_TEST_KEY` (placeholder).
2) Install & run: `npm install` then `npm run dev`.
3) Auth: sign up/sign in (or OAuth). To use `/admin`, the signed-in email must appear in `ADMIN_EMAILS`.
4) AI looks: open a product, upload a photo, run try-on (ensure AI env + storage). Note the daily cap banner.
5) Checkout: add items to cart, go through checkout (Stripe test slot), verify order + stock decrement.
6) Admin edits: visit `/admin`, adjust price/stock inline, upload a product photo, refresh product page to see updates.

## Environment Variables
Copy `.env.local.example` to `.env.local` and fill in the values below:

| Key | Purpose | Required | Example |
| --- | --- | --- | --- |
| POSTGRES_URL | Database connection | Yes | postgres://user:pass@host:5432/db |
| AUTH_SECRET / NEXTAUTH_SECRET | NextAuth JWT/session encryption | Yes | (32-byte hex) |
| NEXTAUTH_URL | Base URL for NextAuth callbacks | Dev recommended | http://localhost:3000 |
| ADMIN_EMAILS | Comma list of admin emails for `/admin` | Optional | you@example.com,other@example.com |
| NEXT_PUBLIC_BASE_URL | Used in metadata/sitemap | Yes | http://localhost:3000 |
| NEXT_PUBLIC_AI_IMAGES_DAILY_CAP | UI display of AI daily cap | Optional | 20 |
| NEXT_PUBLIC_MAX_UPLOAD_BYTES | Upload size limit (bytes) | Optional | 5242880 |
| SUPABASE_URL | Storage (optional) | Optional | https://xyz.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service key | Optional | (secret) |
| SUPABASE_BUCKET | Storage bucket | Optional | ai-images |
| OPENAI_API_KEY | AI generation | Optional | sk-... |
| STABILITY_API_KEY | AI generation | Optional | ... |
| REPLICATE_API_TOKEN | AI try-on (VITON) | Optional | ... |
| STRIPE_TEST_KEY | Stripe test-mode checkout slot | Optional | sk_test_... |
| SENTRY_DSN | Error reporting | Optional | https://... |
