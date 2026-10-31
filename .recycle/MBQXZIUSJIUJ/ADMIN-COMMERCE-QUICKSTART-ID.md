# Panduan singkat admin Cahaya Kuphi

1. Login melalui `/login`.
2. Di dashboard, gunakan kartu **Menu & kategori** untuk tambah, ubah, nonaktifkan, atau hapus produk/kategori.
3. Gunakan **Tampilan & toko online** untuk mengganti logo/banner, teks banner, jam buka, ongkir, pilihan pembayaran, tipe pesanan, serta status toko online.
4. Gunakan **Stok & inventaris** untuk menyesuaikan stok dan melihat riwayat.
5. Migrasi storefront, pembayaran, dan RPC harus sudah diterapkan pada project Supabase yang digunakan. Lihat `release/PRODUCTION-READINESS.md` untuk urutan dan pemeriksaan.
6. Deploy source terbaru ke Vercel dan pastikan tiga environment variables Supabase terpasang di server.
7. Uji semua proses dengan pesanan percobaan sebelum mengaktifkan toko online.

Jangan aktifkan penerimaan pesanan publik sampai checkout, bukti pembayaran, verifikasi admin, dan transisi stok selesai diuji di deployment yang aktif.
