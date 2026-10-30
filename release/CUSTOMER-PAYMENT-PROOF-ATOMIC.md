# Atomic customer payment-proof submission

This release changes the customer proof-upload endpoint to use the `customer_submit_payment_proof` database RPC. The payment row and `orders.payment_status` are now updated in one database transaction, preventing a successful payment-row write from leaving the order stuck in its previous payment state.

## Required Supabase migrations
Apply in this order:
1. `database/payment-proof-storage.sql`
2. `database/customer-submit-payment-proof.sql`
3. `database/admin-payment-verification.sql`

The application uploads the image to the private `payment-proofs` bucket using the server-only service role. It then calls the RPC. If the RPC fails, the API attempts to remove the newly uploaded object.

## Test before opening online orders
- Submit transfer proof with a valid tracking code/token.
- Confirm `payments.status = pending` and `orders.payment_status = pending_verification`.
- Confirm a second pending proof replaces the path without creating duplicate payment rows.
- Confirm admin verification changes both payment and order state.
- Confirm invalid tokens cannot upload or change order state.
- Confirm cancelled/expired orders cannot submit proof.

Online order acceptance must remain disabled until these tests and stock-transition tests pass.
