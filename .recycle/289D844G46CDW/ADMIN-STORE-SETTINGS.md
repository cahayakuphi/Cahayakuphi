# Pengaturan toko admin

Penambahan halaman `/admin/settings` dan API `/api/admin/settings`.

Fitur:
- Membaca dan memperbarui nama usaha, WhatsApp, alamat, dan biaya pengantaran.
- Mengatur jam buka/tutup per hari (WIB) melalui `store_hours`.
- Menampilkan status penerimaan pesanan secara read-only. `accepting_orders` tidak dapat diubah dari halaman ini sampai alur checkout dan stok diuji.
- Seluruh endpoint memvalidasi bearer session melalui Supabase Auth dan memeriksa `admin_users.active` di server.

Tidak ada migration database baru; halaman menggunakan tabel `store_settings` dan `store_hours` yang telah ada.
