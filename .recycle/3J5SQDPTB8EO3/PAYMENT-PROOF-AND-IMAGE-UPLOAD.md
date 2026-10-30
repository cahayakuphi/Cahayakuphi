# Bukti pembayaran dan unggah foto

## Perubahan source
- Pelanggan dapat mengirim bukti transfer/QRIS melalui halaman `/track` setelah memasukkan kode pesanan dan token rahasia.
- Endpoint memvalidasi token SHA-256, metode pembayaran, status pesanan, tipe file, dan ukuran maksimal 5 MB.
- Bukti disimpan pada bucket privat `payment-proofs`; admin memperoleh signed URL yang berlaku 5 menit.
- Dashboard admin menampilkan daftar bukti yang menunggu verifikasi dan tombol terima/tolak.
- Endpoint admin `/api/admin/menu/image` menerima foto produk untuk bucket publik `product-images` dan memasang URL ke produk. Endpoint tersedia untuk dihubungkan ke kontrol unggah pada form menu.

## Prasyarat Supabase
Jalankan `database/payment-proof-storage.sql` pada SQL Editor proyek Supabase yang digunakan. Script menambah `payments.proof_storage_path`, indeks unik `payments.order_id`, bucket privat bukti pembayaran, dan bucket publik foto produk. Pastikan tabel payments memang hanya memiliki satu baris pembayaran per pesanan sebelum membuat indeks unik.

## Keamanan
- Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di variabel `NEXT_PUBLIC_*`.
- Bukti pembayaran tidak memakai public URL. Admin mendapat signed URL berumur 5 menit.
- Unggah dan verifikasi pembayaran melalui server route; akses admin dicek terhadap sesi Supabase dan `admin_users.active`.
- Upload foto produk harus dilakukan dengan token admin.

## Catatan verifikasi
Arsip ZIP telah diperiksa integritasnya. Build Next.js dan alur upload/verifikasi end-to-end belum dapat dinyatakan lulus; perlu install dependensi, deploy, jalankan migrasi SQL, lalu uji dengan satu pesanan uji sebelum `accepting_orders` diaktifkan.
