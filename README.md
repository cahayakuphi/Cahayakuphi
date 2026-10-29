# Cahaya Kuphi Resto & Cafe — ordering website starter

Starter MVP for a bilingual (ID/EN) cafe ordering website using Next.js, TypeScript, Tailwind CSS and Supabase. Designed for deployment to Vercel.

## What's included
- Responsive landing page, menu filtering, cart and checkout UI
- Indonesian/English toggle
- Product options with example price additions
- Order API that saves to Supabase before redirecting to WhatsApp
- Secure tracking-token concept (code + random token)
- Initial database schema and sample menu seed
- Initial admin dashboard placeholder and deployment configuration template

## Important current limitations
This is an initial development scaffold, not a finished production ordering system. Menu cards currently use a sample in-code catalog; database seed prices are examples. Product options shown in the demo UI are not yet server-priced from Supabase option tables. Delivery fee is not yet included in the persisted total, and the admin dashboard is only a placeholder. Inventory confirmation/cancellation transactions, complete server-side admin authorization/CRUD, payment verification UI, rate limiting, and scheduled expiry processing must be completed and tested before accepting real orders. The order API expires requests after 30 minutes as a provisional default; make this configurable before launch. Do not deploy as a live store until these items are implemented.

## Requirements
- Node.js 20+ recommended
- Supabase project
- Vercel account for deployment

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Add Supabase Project URL, anon key, and **server-only** service role key. Never expose the service role key in browser code.
3. In Supabase SQL Editor, review and run `database/schema.sql`.
4. Set `accepting_orders` only after checkout, admin auth, pricing, and stock controls are production-ready.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Visit `http://localhost:3000`.

## Admin login (initial UI)

The header includes a Login Admin link and `/login` uses Supabase Auth email/password. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel, then create the single admin account in Supabase Auth (do not add public sign-up). The current dashboard is a protected UI scaffold only; server-side authorization and RLS policies must be completed before production.

## Business configuration supplied by the owner
- Admin WhatsApp (international format): `6282269696845`
- Flat delivery fee: `Rp5.000`
- Cafe address: `Sumber Batu, Meureubo, Aceh Barat`
- Operating hours: every day, `09:00–12:00 WIB`
- Vercel deployment: use a `*.vercel.app` subdomain first

After `database/schema.sql`, run `database/production-config.sql` in Supabase SQL Editor to store these values. This migration deliberately keeps `accepting_orders = false` until the production acceptance tests pass. The current checkout route does not yet read the delivery fee from settings, so this SQL alone does not make delivery totals production-correct.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public/anon key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only privileged key
- `NEXT_PUBLIC_ADMIN_WHATSAPP`: admin number in international format without `+`, e.g. `62812...` (fill only when known)

## Vercel deployment
Import the repository into Vercel, configure the same environment variables, deploy to a temporary `*.vercel.app` subdomain, and test with non-production orders first. Supabase database and storage are separate services from Vercel. Free-plan quotas and terms can change; review current provider limits before launch.

## Release status — NOT production-ready yet
The supplied source code is still a development scaffold. Do not enable live ordering until all blockers below are resolved and tested. Configuring the business settings does not mean the site is deployed or connected to Supabase.

## Before production launch
- Implement real admin authentication and server-side authorization
- Add and test RLS policies for public menu reads and admin-only changes
- Recalculate all prices/options/delivery fee server-side from trusted database records
- Add transaction/RPC for stock recheck + decrement when confirming orders; restore exactly once on cancellation
- Implement expiry/cancellation server-side and protect against duplicate confirmations
- Implement admin CRUD for products, variants, extras, stock, orders, settings and payment status
- Ensure QRIS/bank transfer is marked paid only after manual verification
- Configure the real WhatsApp admin number, delivery fee, cafe address, and opening hours
- Add rate limiting, input validation, privacy notice, backups/export and end-to-end tests
- Test mobile layout, concurrent stock confirmation, failed WhatsApp handoff, and expired orders
