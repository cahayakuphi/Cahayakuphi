# Verifikasi pembayaran atomik

## Perubahan
- Verifikasi pembayaran admin dipindahkan ke RPC PostgreSQL `admin_verify_payment`.
- Baris pembayaran dan pesanan dikunci (`FOR UPDATE`) selama perubahan.
- Status pembayaran dan `orders.payment_status` berubah dalam satu transaksi database.
- RPC memeriksa admin aktif dan menolak pembayaran yang sudah diproses atau pesanan yang dibatalkan/kedaluwarsa.
- Eksekusi RPC hanya diberikan kepada `service_role`; endpoint tetap memverifikasi access token dan status admin sebelum pemanggilan.

## Penerapan
1. Pastikan migrasi `database/payment-proof-storage.sql` sudah diterapkan.
2. Terapkan `database/admin-payment-verification.sql` pada proyek Supabase yang digunakan aplikasi.
3. Deploy ulang aplikasi.
4. Uji dengan pesanan uji transfer/QRIS: unggah bukti, verifikasi, lalu pastikan `payments.status` dan `orders.payment_status` berubah bersamaan. Uji juga penolakan dan pesanan yang dibatalkan.

Belum ada klaim pengujian transaksi end-to-end. Jangan aktifkan penerimaan pesanan publik sebelum seluruh skenario lolos.
