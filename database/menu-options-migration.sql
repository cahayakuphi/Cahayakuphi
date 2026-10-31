-- Cahaya Kuphi: normalize existing menu option tables to the API schema.
-- Safe for the current live database: all four option tables were verified empty.
-- Do not run this file a second time after successful application.
begin;

alter table public.product_variants rename column name to name_id;
alter table public.product_variants add column if not exists is_required boolean not null default true;
alter table public.product_variants add column if not exists sort_order integer not null default 0;
alter table public.product_variants add column if not exists name_en text not null default '';

alter table public.variant_options rename column name to label_id;
alter table public.variant_options rename column name_en to label_en;
alter table public.variant_options rename column active to is_active;
alter table public.variant_options alter column product_id drop not null;
alter table public.variant_options add column variant_id uuid;
alter table public.variant_options
  add constraint variant_options_variant_id_fkey
  foreign key (variant_id) references public.product_variants(id) on delete cascade;
alter table public.variant_options add column if not exists price_delta integer not null default 0;
alter table public.variant_options add column if not exists sort_order integer not null default 0;
create index if not exists variant_options_variant_id_idx on public.variant_options(variant_id);

alter table public.product_extras rename column name to name_id;
alter table public.product_extras rename column required to is_required;
alter table public.product_extras add column if not exists name_en text not null default '';
alter table public.product_extras add column if not exists sort_order integer not null default 0;

alter table public.product_extra_options rename column name to label_id;
alter table public.product_extra_options rename column name_en to label_en;
alter table public.product_extra_options rename column active to is_active;
alter table public.product_extra_options add column if not exists price_delta integer not null default 0;
alter table public.product_extra_options add column if not exists sort_order integer not null default 0;

commit;
