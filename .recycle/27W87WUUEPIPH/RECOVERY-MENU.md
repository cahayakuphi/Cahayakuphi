# Pemulihan katalog menu Cahaya Kuphi

Screenshot `/menu` yang menampilkan “Menu belum dapat ditampilkan” berarti request ke `/api/menu` menerima respons gagal. Pembaruan ini mengubah API agar tabel varian/tambahan yang belum tersedia tidak lagi mematikan seluruh katalog. Menu dasar tetap dapat tampil; opsi akan muncul setelah migrasi opsi berhasil.

## Langkah penerapan

1. Di Supabase, buat backup database terlebih dahulu.
2. Buka SQL Editor dan jalankan `database/fix-menu-catalog.sql`.
   - Memastikan `products.slug`, `products.image_url`, dan `categories.slug` tersedia.
   - Mengisi slug kosong secara unik tanpa menghapus data produk.
3. Jalankan `database/menu-options-migration.sql` bila fitur varian dan extras ingin digunakan. File ini membuat tabel opsi dan menambahkan `sort_order` yang diperlukan dashboard admin.
4. Di GitHub, unggah/perbarui seluruh source dari ZIP ini ke repository yang terhubung ke Vercel.
5. Pastikan Environment Variables Vercel berisi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`. Kunci service role hanya di server, tanpa awalan `NEXT_PUBLIC_`.
6. Redeploy Vercel.
7. Buka `/api/menu` langsung. Jika berhasil, respons JSON berisi `products` dan `categories`. Setelah itu buka `/menu`.

## Jika masih gagal

Buka Vercel → Project → Deployments → deployment terbaru → Functions → `/api/menu` → Logs. Cari `Public menu query failed`. Pesan database di log akan menunjukkan kolom/tabel/relasi yang belum sesuai. Jangan kirim service-role key atau password. Kirim teks error log saja.

## Penting

- Bila `/api/menu` mengembalikan `products: []`, API sudah berjalan tetapi belum ada produk aktif dengan kategori aktif. Tambahkan/aktifkan produk dari dashboard admin.
- Bila respons 503, periksa Environment Variables dan log fungsi.
- Jangan aktifkan penerimaan pesanan online sebelum checkout, status pesanan, stok, dan pembayaran diuji end-to-end.
