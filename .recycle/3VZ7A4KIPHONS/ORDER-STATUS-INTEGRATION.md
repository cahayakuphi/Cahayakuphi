# Order status integration fix

This release aligns the web application with the live Supabase `orders_order_status_check` constraint.

Allowed values: `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`, `expired`.

Changes:
- Checkout now creates orders with `pending`.
- Admin order API accepts only transitions supported by the database RPC.
- Admin dashboard labels and actions use the same database status values.
- Stock deduction remains performed by the server-side `admin_update_order_status` RPC when status becomes `confirmed`; cancellation restores recorded `out` movements once.

Deploy this source to Vercel after reviewing it. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not enable order acceptance until a controlled test order has verified checkout, confirmation, stock deduction, cancellation, and restoration.

Build and live end-to-end tests have not been run in this environment.
