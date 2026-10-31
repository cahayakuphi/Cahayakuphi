# Laporan Penjualan Admin

- Halaman: `/admin/reports` (akses admin aktif diperlukan).
- Rentang tanggal memakai kalender WIB (UTC+7) dan difilter berdasarkan `orders.created_at`.
- Omzet dan menu terlaris hanya menghitung pesanan berstatus `completed`.
- Jumlah pesanan masuk mencakup seluruh status dalam periode; pembatalan mencakup `cancelled` dan `expired`.
- Ekspor CSV tersedia dari halaman laporan.

Catatan: tanggal laporan adalah tanggal pesanan dibuat, bukan tanggal pesanan diselesaikan. Jika dibutuhkan laporan akuntansi berdasarkan tanggal pembayaran/penyelesaian, tabel `orders` perlu menyimpan `completed_at` atau timestamp pembayaran terverifikasi.
