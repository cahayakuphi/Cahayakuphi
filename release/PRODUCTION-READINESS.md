# Production readiness status

Status: **NOT READY FOR PUBLIC ORDERS**.

Completed in this release-prep iteration:
- Order API uses the current database column names (`price`, `name`, `active`, `customer_whatsapp`, `fulfillment_type`, etc.).
- Server computes item prices from database base prices and validates any demo-catalog option delta rather than trusting client-supplied prices.
- Delivery fee is read from `store_settings`; pickup has no delivery fee.
- Order and order-item creation uses a database RPC so both inserts run in one transaction.
- Tracking tokens remain random and only their SHA-256 hashes are stored.
- Added `database/align-existing-database.sql` to add stable slugs, seed clearly labelled sample catalog rows, and create the atomic order RPC.

Still required before production:
- Run and verify `database/align-existing-database.sql` in the correct Supabase project.
- Replace sample catalog rows and prices with the cafe's approved real menu.
- Implement and server-protect admin order/menu/stock/settings CRUD; the current admin page is a placeholder.
- Implement stock deduction/restoration atomically on admin confirmation/cancellation, including concurrency protections.
- Implement rate limiting, input-size limits, and operational logging/monitoring for public endpoints.
- Confirm environment variables, install dependencies, run a production build, and execute end-to-end tests against a non-production Supabase project.
- Verify privacy, tracking UX, payment verification, and accessibility on mobile.
- Keep `store_settings.accepting_orders = false` until all checks pass.

No deployment has been performed. The app must not be advertised as production-ready yet.
