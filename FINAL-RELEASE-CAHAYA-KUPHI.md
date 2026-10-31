# Cahaya Kuphi — paket pembaruan terpadu

## Isi pembaruan
- Varian produk dibuat langsung dari kartu menu tanpa mengisi nama grup. Setiap varian menyimpan harga jual final, misalnya Americano: Hot Rp15.000 dan Ice Rp18.000.
- Harga varian digunakan konsisten di katalog, keranjang, ringkasan checkout, dan validasi server saat membuat pesanan.
- Tambahan produk tetap memakai biaya tambahan (misalnya ekstra sambal).
- Tombol simpan harga/stok menampilkan status menyimpan, sukses, atau gagal. Data admin diperbarui dari respons API.
- Katalog memuat data terbaru tanpa cache, refresh saat tab kembali aktif, dan pemeriksaan berkala.
- Pencarian produk, filter kategori horizontal, dan navigasi bawah pada layar HP.

## Migrasi database wajib
Sebelum deploy kode ini, jalankan `variant-prices-final-migration.sql` satu kali di Supabase SQL Editor. Script ini mengubah data varian lama dari format harga tambahan menjadi harga jual final. Jangan jalankan ulang setelah deploy.

## Contoh input Americano
1. Buka Admin → Kelola Menu.
2. Di bagian Varian Harga & Tambahan, isi `Hot`, English `Hot`, harga `15000`, lalu Tambah Varian.
3. Isi `Ice`, English `Iced`, harga `18000`, lalu Tambah Varian.
4. Katalog menampilkan satu produk Americano dengan pilihan Hot/Ice; harga berubah sesuai varian.

## Verifikasi yang masih harus dilakukan setelah deploy
- Jalankan migrasi SQL satu kali.
- Pastikan variabel Supabase di Vercel tetap tersedia.
- Jalankan `npm install` lalu `npm run build`.
- Uji tambah/ubah harga varian, simpan harga dan stok, pencarian katalog, keranjang, serta checkout uji.
- Uji checkout transfer/QRIS dengan pembayaran belum diverifikasi agar pesanan tidak bisa dikonfirmasi.

Paket ini belum dinyatakan production-tested karena build dan transaksi live belum dijalankan terhadap project Supabase/Vercel milik toko.
