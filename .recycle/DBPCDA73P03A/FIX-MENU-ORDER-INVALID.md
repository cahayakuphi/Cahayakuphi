# Perbaikan error "Menu pesanan tidak valid"

## Penyebab
Endpoint katalog publik sebelumnya tidak mengambil kolom `products.slug`, tetapi tetap mengirim `p.slug` sebagai `product.id`. Akibatnya id produk dari `/api/menu` menjadi `undefined`, lalu endpoint checkout menolaknya dengan pesan "Menu pesanan tidak valid".

## Perbaikan
- Menambahkan kolom `slug` pada SELECT endpoint `/api/menu`.
- ID katalog yang dikirim ke keranjang sekarang berasal dari slug database yang benar.
- Tidak ada perubahan database yang diperlukan untuk perbaikan ini.

## Setelah deploy
1. Deploy ulang source ini ke Vercel.
2. Buka `/api/menu` dan pastikan setiap `products[].id` berisi slug, misalnya `americano` atau `ayam-penyet`.
3. Tambahkan satu menu ke keranjang dan coba checkout. Penerimaan pesanan tetap bergantung pada `store_settings.accepting_orders`.
