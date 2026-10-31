-- CAHAYA KUPHI — migrasi harga varian menjadi harga jual final
-- JALANKAN SATU KALI sebelum deploy versi yang memakai harga final varian.
-- Migrasi ini mengubah nilai lama (harga tambahan) menjadi harga final:
-- harga produk + price_delta lama. Jangan jalankan ulang setelah varian baru dibuat.

begin;

update public.variant_options vo
set price_delta = p.price + coalesce(vo.price_delta, 0)
from public.product_variants pv
join public.products p on p.id = pv.product_id
where vo.variant_id = pv.id;

comment on column public.variant_options.price_delta is
  'Harga jual final untuk varian produk (bukan selisih harga).';

commit;
