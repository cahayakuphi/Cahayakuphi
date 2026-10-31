# Admin categories and inventory

- Admin menu API now supports category creation and category activation/deactivation.
- Admin menu UI includes category management.
- `/admin/stock` records stock-in, stock-out, and stock correction and shows the latest 150 stock movements.
- `/api/admin/stock` validates the admin session and delegates stock mutation to `admin_adjust_product_stock`.
- The SQL function uses a row lock, validates an active admin, updates `products.stock_quantity`, and inserts a stock movement in the same transaction.
- The migration was applied to the connected Supabase project. The SQL is included for documentation and separate deployments.

## Verification status

- Confirmed the function exists in Supabase with `SECURITY DEFINER` and the expected argument signature.
- No real stock movement has been executed against a live product, to avoid changing the cafe's inventory without a specific item and quantity approved by the owner.
- `npm install` timed out in this environment, so TypeScript and Next.js production build are not verified.
- The admin route checks the Supabase session with `auth.getUser()` and checks `admin_users.active` before using the server-side service key.
