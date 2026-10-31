-- Cahaya Kuphi: perbaikan kolom katalog agar API /api/menu dapat membaca produk.
-- Backup database terlebih dahulu. Aman dijalankan berulang kali.
begin;

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists image_url text;
alter table public.categories add column if not exists slug text;

-- Isi slug yang masih kosong. Tambahkan potongan UUID untuk mencegah benturan nama.
update public.products
set slug = trim(both '-' from regexp_replace(lower(coalesce(name, 'menu')), '[^a-z0-9]+', '-', 'g'))
           || '-' || left(replace(id::text, '-', ''), 6)
where slug is null or btrim(slug) = '';

update public.categories
set slug = trim(both '-' from regexp_replace(lower(coalesce(name, 'kategori')), '[^a-z0-9]+', '-', 'g'))
           || '-' || left(replace(id::text, '-', ''), 6)
where slug is null or btrim(slug) = '';

create unique index if not exists products_slug_unique on public.products(slug) where slug is not null;
create unique index if not exists categories_slug_unique on public.categories(slug) where slug is not null;

commit;
