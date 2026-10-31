# Status kesiapan produksi — Cahaya Kuphi

Status: **belum boleh menerima pesanan publik sampai uji end-to-end pada deployment selesai**.

## Yang sudah diverifikasi
- Skema live `store_settings` sudah memiliki kolom logo, banner, metode pembayaran, dan jenis pesanan.
- Bucket publik `product-images` sudah tersedia untuk gambar katalog/logo/banner.
- RPC live `create_order_request` tersedia untuk menyimpan order dan item dalam satu transaksi.
- RPC live `admin_update_order_status` dan `admin_adjust_product_stock` tersedia.
- Migrasi bucket privat `payment-proofs`, kolom bukti pembayaran, RPC `customer_submit_payment_proof`, dan RPC `admin_verify_payment` telah diterapkan ke project Supabase Cahaya Kuphi.
- Status order live yang benar adalah `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`, dan `expired`.

## Sebelum produksi
1. Pastikan Vercel memakai project Supabase yang sama dan tiga environment variables tersedia: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Deploy source ZIP terbaru.
3. Jalankan build produksi (`npm install` lalu `npm run build`) pada CI/Vercel. Build belum berhasil diverifikasi di lingkungan audit karena `npm install` timeout.
4. Pastikan semua nama menu, kategori, harga, foto, varian, opsi, extra, dan stok sudah merupakan data resmi. Data contoh tidak otomatis menjadi katalog final.
5. Uji login admin dan pastikan akun non-admin ditolak.
6. Uji CRUD kategori/menu, upload foto, logo/banner, jam operasional, metode pembayaran, dan jenis pesanan.
7. Uji checkout delivery dan pickup, validasi ongkir, pilihan varian/extra, token pelacakan, dan konfirmasi pesanan.
8. Uji transfer/QRIS: unggah bukti, lihat signed URL di admin, verifikasi dan tolak pembayaran; pastikan status `payments` dan `orders` konsisten.
9. Uji stok cukup/tidak cukup, konfirmasi bersamaan, pembatalan, dan pastikan stok tidak terpotong atau dikembalikan dua kali.
10. Uji laporan penjualan dan semua halaman admin di perangkat mobile.
11. Pertahankan `store_settings.accepting_orders=false` sampai seluruh uji di atas lolos.

## Catatan audit
- Pemeriksaan sintaks TypeScript/TSX bukan pengganti `next build` atau uji browser.
- Belum dilakukan transaksi uji nyata pada data produksi; jangan membuat order palsu di database produksi tanpa rencana pembersihan yang aman.
- Supabase Security Advisor menampilkan RLS aktif tanpa policy pada 12 tabel. Akses aplikasi saat ini dirancang melalui server API dengan service role dan pemeriksaan admin; jangan memberikan grant/policy publik untuk menghilangkan peringatan ini tanpa merancang ulang aksesnya.
- Security Advisor juga memperingatkan perlindungan kata sandi bocor belum aktif. Pertimbangkan mengaktifkannya di Supabase Auth.
- Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke variabel `NEXT_PUBLIC_*` atau membagikan nilainya.
