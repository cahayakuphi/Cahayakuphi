-- Jalankan sekali di Supabase SQL Editor untuk fitur identitas dan kanal toko.
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS banner_title text,
  ADD COLUMN IF NOT EXISTS banner_subtitle text,
  ADD COLUMN IF NOT EXISTS enabled_payment_methods jsonb NOT NULL DEFAULT '["cash","transfer","qris"]'::jsonb,
  ADD COLUMN IF NOT EXISTS enabled_order_types jsonb NOT NULL DEFAULT '["delivery","pickup"]'::jsonb;

UPDATE public.store_settings SET
  enabled_payment_methods = COALESCE(enabled_payment_methods, '["cash","transfer","qris"]'::jsonb),
  enabled_order_types = COALESCE(enabled_order_types, '["delivery","pickup"]'::jsonb)
WHERE id = 1;

-- Bucket publik hanya untuk aset tampilan dan foto katalog; upload dilakukan server setelah validasi admin.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];
