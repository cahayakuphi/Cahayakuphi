-- Cahaya Kuphi: varian dan tambahan menu untuk skema produk UUID yang dipakai API saat ini.
-- Jalankan di Supabase SQL Editor setelah memastikan tabel products memiliki kolom id UUID.
begin;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_id text not null,
  name_en text not null default '',
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.variant_options (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  label_id text not null,
  label_en text not null default '',
  price_delta integer not null default 0 check (price_delta >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_extras (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_id text not null,
  name_en text not null default '',
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_extra_options (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.product_extras(id) on delete cascade,
  label_id text not null,
  label_en text not null default '',
  price_delta integer not null default 0 check (price_delta >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists variant_options_variant_id_idx on public.variant_options(variant_id);
create index if not exists product_extras_product_id_idx on public.product_extras(product_id);
alter table public.product_extra_options add column if not exists sort_order integer not null default 0;
create index if not exists product_extra_options_extra_id_idx on public.product_extra_options(extra_id);

alter table public.product_variants enable row level security;
alter table public.variant_options enable row level security;
alter table public.product_extras enable row level security;
alter table public.product_extra_options enable row level security;
revoke all on public.product_variants, public.variant_options, public.product_extras, public.product_extra_options from anon, authenticated;
grant all on public.product_variants, public.variant_options, public.product_extras, public.product_extra_options to service_role;

commit;
