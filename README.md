# Cahaya Kuphi Resto & Cafe — ordering website

Next.js 14 + TypeScript + Tailwind + Supabase starter, prepared for Vercel deployment.

## Business configuration
- Name: Cahaya Kuphi Resto & Cafe
- WhatsApp: `6282269696845`
- Address: Sumber Batu, Meureubo, Aceh Barat
- Delivery fee: Rp5.000 (read from `store_settings`)
- Store hours configured in Supabase: daily 09:00–12:00 WIB
- Public order acceptance must remain disabled until end-to-end checks are complete.

## Environment variables
Set in Vercel → Project → Settings → Environment Variables for the environments you use:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret key. Never use the `NEXT_PUBLIC_` prefix for this key.

Redeploy after changing environment variables. The admin account must be created manually in Supabase Authentication and its auth UID must be present as an active row in `public.admin_users`. No public sign-up flow is included.

## Database setup
Use the supplied migrations in this order only if not already applied:
1. `database/schema.sql` is the legacy starter schema and is **not compatible** with the database shape currently used by the project. Do not run it against the already-configured database.
2. `database/fix-menu-catalog.sql` ensures catalog slug/photo columns and fills missing slugs.
3. `database/menu-options-migration.sql` creates variant/extra option tables.
4. `database/align-existing-database.sql` and `database/admin-orders-stock.sql` are historical alignment/order migrations; inspect current database state and do not rerun blindly.

Always back up the database first and inspect SQL before running. Do not run migrations twice if already applied; `CREATE OR REPLACE FUNCTION` is safe to replace that function, but seed/update statements may refresh the eight demo products. Replace demo data with the cafe's verified menu before launch.

## Admin pages
- `/login`: Supabase email/password login.
- `/admin`: order list and status workflow.
- `/admin/menu`: create menu items, edit prices and stock tracking, toggle availability. Server routes validate the Supabase access token and check active membership in `admin_users` before using the server-side service key.

## Current limitations — NOT production-ready
- The build and end-to-end flow have not been verified in this environment because dependency installation timed out.
- Menu management currently supports base products only; product variants, option groups, extras/toppings, and per-variant inventory UI are not complete.
- Payment verification UI and full reporting/settings CRUD are not complete.
- The public catalog is loaded from Supabase through `/api/menu`. If the options migration is absent, base products can still display without variants/extras.
- Rate limiting, expiry processing, payment workflows, production RLS/security review, and concurrent-stock acceptance tests remain required.
- Do not enable real order acceptance until build, admin authorization, order creation/tracking, stock deduction/restoration, and payment verification are tested end to end.

## Local development
```bash
npm install
npm run dev
```
Use Node.js 20+. Do not commit `.env.local` or any secret key.

## Admin diagnostics update

Lihat `release/ADMIN-DIAGNOSTICS-AND-DEPLOY.md` untuk pemeriksaan environment Vercel dan akses admin. Endpoint `/api/admin/health` membedakan konfigurasi server, sesi, dan hak akses tanpa membocorkan secret. Untuk memeriksa skema database yang sudah ada tanpa mengubahnya, jalankan `database/diagnose-existing-schema.sql` dan gunakan hasilnya sebelum menerapkan migrasi penyelarasan.
