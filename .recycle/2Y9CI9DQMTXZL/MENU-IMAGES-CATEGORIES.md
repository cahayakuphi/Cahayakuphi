# Menu Dinamis: Foto Produk dan Kategori

Pembaruan ini:
- Filter kategori pelanggan memakai UUID kategori, bukan nama kategori.
- Foto produk dibaca dari kolom `products.image_url`.
- Admin dapat menyimpan URL foto HTTPS saat membuat produk atau memperbarui foto produk.
- Kartu menu menampilkan foto jika tersedia dan ikon Lucide jika belum ada foto.

## Persyaratan database
Kolom `products.image_url` harus tersedia (tipe `text`). Skema dasar Cahaya Kuphi yang digunakan proyek ini sudah mendefinisikan kolom tersebut. Jika database Anda belum memilikinya, jalankan SQL berikut di Supabase SQL Editor:

```sql
alter table public.products add column if not exists image_url text;
```

URL gambar harus HTTPS dan dapat diakses publik oleh browser. Tidak ada bucket Storage yang dibuat otomatis dalam pembaruan ini.

## Catatan verifikasi
Build Next.js perlu dijalankan di lingkungan proyek setelah dependensi terpasang:

```bash
npm install
npm run build
```
