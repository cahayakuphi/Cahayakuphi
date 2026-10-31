# Admin & storefront commerce update

## Included
- Admin dashboard now surfaces direct management cards for products/categories, storefront appearance and online-store settings, stock, and sales reports.
- Product manager supports create, edit, activate/deactivate, delete (soft-archive fallback when historical order rows prevent deletion), image upload, and stock management.
- Category manager supports create, rename, activate/deactivate, and delete only when no product references it.
- Store settings support store on/off, delivery/pickup availability, cash/transfer/QRIS availability, logo and banner upload, banner title/subtitle, business details, delivery fee, and opening hours.
- Checkout reads enabled order types and payment methods; server validates those settings again when creating an order.
- Store header and home hero use configured logo/banner copy.
- Pastel orange/cream palette and dashboard quick links.

## Required database migration
Run `database/storefront-customization.sql` once in the Supabase SQL Editor. It adds store identity/banner fields and enabled channel arrays, and creates the public `product-images` bucket for catalogue/logo/banner assets. The bucket is public for image reads; all uploads go through server routes that validate the authenticated active admin and restrict image MIME/size.

## Deployment
Deploy the full `cklatest` project. Keep the three Supabase environment variables configured on Vercel. Redeploy after changing environment variables.

## Important verification notes
- Do not turn online ordering on until the migration is applied and checkout/payment/stock flows are tested on the deployed project.
- Hard deletion of products is attempted first. If historical order references block deletion, the product is archived by setting `active=false` to preserve order history.
- Build could not be verified in this environment because `npm install` timed out. TypeScript/TSX syntax transpilation was checked separately; this is not a substitute for a Next.js production build.
