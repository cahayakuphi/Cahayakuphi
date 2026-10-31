# Varian dan tambahan menu

Pembaruan ini mendukung pilihan varian (misalnya panas/dingin atau ukuran) dan tambahan (misalnya topping) yang memiliki perubahan harga.

## Migrasi database

1. Pastikan tabel `public.products.id` bertipe `uuid`, sesuai API katalog dan pesanan pada rilis ini.
2. Jalankan `database/menu-options-migration.sql` di Supabase SQL Editor.
3. Tambahkan grup varian ke `product_variants`, lalu pilihan ke `variant_options`.
4. Tambahkan grup tambahan ke `product_extras`, lalu pilihan ke `product_extra_options`.
5. Isi `price_delta` sebagai tambahan harga dalam rupiah. Gunakan `is_active=false` untuk menyembunyikan pilihan tanpa menghapus riwayat.

API publik mengambil pilihan aktif. Saat pesanan dibuat, server memeriksa kembali ID grup/pilihan dan menghitung ulang harga dari database. Harga dari browser tidak dipercaya.

Catatan: rilis ini menambahkan pembacaan pilihan dan validasi harga saat checkout. Pengelolaan varian/tambahan melalui halaman admin belum termasuk dalam pembaruan ini.

## Pengelolaan dari dashboard admin

Setelah migrasi tabel selesai, buka Dashboard Admin → Kelola menu. Setiap produk kini memiliki bagian **Varian & tambahan** untuk membuat grup pilihan dan memasukkan opsi dengan harga tambahan. Opsi dapat dinonaktifkan dan diaktifkan kembali tanpa menghapus riwayatnya. Pastikan migrasi `database/menu-options-migration.sql` sudah dijalankan sebelum membuka bagian ini.
