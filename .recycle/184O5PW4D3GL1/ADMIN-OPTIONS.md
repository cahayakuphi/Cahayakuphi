# Admin pengelolaan varian dan tambahan

Setelah `database/menu-options-migration.sql` dijalankan, dashboard **Admin → Kelola menu** menampilkan panel **Varian & tambahan** pada setiap produk.

- Buat grup varian untuk pilihan tunggal (contoh: Suhu, Ukuran).
- Buat grup tambahan untuk pilihan yang dapat dipilih lebih dari satu (contoh: Topping).
- Isi nama Indonesia dan Inggris.
- Atur apakah grup wajib dipilih.
- Tambahkan pilihan beserta tambahan harga dalam rupiah.
- Nonaktifkan/aktifkan pilihan tanpa menghapus catatan pesanan lama.

Harga pada katalog dan checkout diverifikasi kembali oleh server berdasarkan ID pilihan yang aktif di database. Jangan memberikan akses `service_role` ke browser.
