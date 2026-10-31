# Perbaikan diagnostik admin Cahaya Kuphi

## Mengapa dashboard sebelumnya menampilkan “Sesi admin tidak valid”
Versi sebelumnya menggabungkan beberapa kondisi menjadi satu pesan. Kondisi tersebut termasuk variabel server Supabase yang belum lengkap, token login yang tidak valid, serta masalah pemeriksaan hak akses. Akibatnya, pesan di layar tidak menunjukkan langkah perbaikan yang benar.

## Variabel Vercel yang wajib tersedia
Buka Vercel → Project → Settings → Environment Variables. Pastikan ketiga variabel ini tersedia pada Production (dan Preview jika digunakan):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL dari Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key dari Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — secret/service_role key dari Supabase. Variabel ini harus server-only dan TIDAK boleh memakai awalan `NEXT_PUBLIC_`.

Setelah mengubah environment variables, lakukan Redeploy. Jangan mengirim atau menempelkan nilai key ke chat, GitHub, atau source code.

## Pemeriksaan akses
Dashboard sekarang memanggil `/api/admin/health` sebelum memuat pesanan. Endpoint hanya mengembalikan status pemeriksaan, bukan nilai rahasia. Kode status yang mungkin muncul:

- `SERVER_ENV_MISSING`: satu atau lebih environment variables server belum tersedia.
- `SESSION_MISSING` / `SESSION_INVALID`: token tidak ada, tidak valid, atau kedaluwarsa; login ulang.
- `ADMIN_TABLE_ERROR`: database tidak dapat membaca `admin_users`; periksa struktur tabel dan log Supabase.
- `ADMIN_NOT_ACTIVE`: UID pengguna belum terdaftar sebagai admin aktif.
- `READY`: konfigurasi dan akses admin lolos pemeriksaan.

## Menambahkan akun admin
Ambil User UID dari Supabase → Authentication → Users. Jalankan SQL berikut dengan UID yang benar:

```sql
insert into public.admin_users (user_id, active)
values ('GANTI_DENGAN_USER_UID', true)
on conflict (user_id) do update set active = true;
```

Pastikan tabel `admin_users` memiliki kolom `user_id uuid` dan `active boolean`.

## Batas verifikasi
Build Next.js belum dapat dijalankan di lingkungan pembuatan paket karena `npm install --no-audit --no-fund` mengalami timeout. Uji integrasi terhadap project Supabase dan deployment Vercel milik pemilik project juga belum dilakukan. Jangan mengaktifkan penerimaan pesanan sampai checkout, stok, dan alur admin diuji.
