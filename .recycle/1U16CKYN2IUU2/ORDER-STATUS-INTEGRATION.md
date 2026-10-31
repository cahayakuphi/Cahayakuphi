# Order status integration

The active database order statuses are `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`, and `expired`.

The tracking page and sales report now use those exact values. Payment tracking labels use `unpaid`, `pending_verification`, `paid`, and `rejected`.

## Verification notes
- Static search confirms the old order status identifiers are no longer used in active `app/` source.
- The Supabase status transition RPC was previously deployed, but live order/stock transaction tests have not been run because the project currently has no order records.
- `npm install` did not complete in the build environment; therefore a Next.js production build and TypeScript compilation are not certified.
- Keep online order acceptance disabled until a controlled test order, admin confirmation, stock deduction, cancellation, and stock restoration have all been verified.
