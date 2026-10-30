# Status kesiapan produksi — Cahaya Kuphi

Status: **belum siap menerima pesanan nyata**.

## Yang sudah dikerjakan di paket ini
- API checkout memakai kolom database aktual dan menghitung harga dari database, bukan menerima total dari browser.
- Penyimpanan order dan order items dilakukan melalui RPC transaksional.
- API admin memvalidasi token Supabase di server serta memeriksa `admin_users.active`.
- Dashboard awal menampilkan pesanan dan mengirim perubahan status ke API server.
- SQL tambahan menyediakan transisi status dengan penguncian pesanan, pengurangan stok saat konfirmasi, serta pengembalian stok saat pembatalan.

## Wajib diuji sebelum produksi
1. Jalankan `database/align-existing-database.sql` sekali jika belum pernah dijalankan, lalu `database/admin-orders-stock.sql`.
2. Verifikasi kolom dan constraint tabel `stock_movements`, `orders`, `order_items`, dan status yang diizinkan di proyek Supabase yang sebenarnya.
3. Tambahkan/konfirmasi seluruh menu, kategori, harga, foto, varian, opsi, extra, dan stok resmi. Produk contoh dalam SQL hanya data demo.
4. Uji login admin dengan akun terdaftar dan akun non-admin; API harus menolak akun non-admin.
5. Uji stok cukup/tidak cukup, dua konfirmasi bersamaan, pembatalan, dan pastikan stok tidak terpotong/dikembalikan dua kali.
6. Uji checkout delivery/pickup, ongkir, pilihan menu, token pelacakan, dan data pelanggan.
7. Lengkapi CRUD menu, pengaturan toko, laporan, serta verifikasi pembayaran transfer/QRIS.
8. Jalankan `npm install` dan `npm run build`; hasil build belum diverifikasi dalam lingkungan ini.
9. Pastikan `store_settings.accepting_orders=false` sampai semua uji selesai.

Jangan pernah mengisi `SUPABASE_SERVICE_ROLE_KEY` ke variabel `NEXT_PUBLIC_*` atau membagikan nilainya.
