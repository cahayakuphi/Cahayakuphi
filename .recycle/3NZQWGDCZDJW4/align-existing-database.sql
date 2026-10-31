-- Jalankan di Supabase SQL Editor setelah backup/export.
-- Menyelaraskan database yang sudah dibuat tanpa menghapus kolom atau tabel.
begin;

alter table public.categories add column if not exists slug text;
create unique index if not exists categories_slug_unique on public.categories(slug) where slug is not null;
alter table public.products add column if not exists slug text;
create unique index if not exists products_slug_unique on public.products(slug) where slug is not null;

-- Seed kategori demo. Data ini perlu diganti/ditambah sesuai menu resmi cafe sebelum go-live.
insert into public.categories (id, slug, name, name_en, active, sort_order)
values
  (gen_random_uuid(), 'kopi', 'Kopi', 'Coffee', true, 1),
  (gen_random_uuid(), 'teh', 'Teh', 'Tea', true, 2),
  (gen_random_uuid(), 'jus', 'Jus', 'Juice', true, 3),
  (gen_random_uuid(), 'makanan', 'Makanan', 'Meals', true, 4),
  (gen_random_uuid(), 'camilan', 'Camilan', 'Snacks', true, 5),
  (gen_random_uuid(), 'squash', 'Squash', 'Squash', true, 6)
on conflict (slug) where slug is not null do nothing;

insert into public.products
  (id, slug, category_id, name, name_en, description, description_en, price, image_url, active, track_stock, stock_quantity)
select gen_random_uuid(), v.slug, c.id, v.name, v.name_en, v.description, v.description_en, v.price, null, true, false, 0
from (values
  ('kopi-sanger','kopi','Kopi Sanger','Sanger Coffee','Kopi espresso dengan perpaduan susu yang lembut dan rasa kopi yang seimbang.','Espresso blended with smooth milk for a balanced coffee flavour.',18000),
  ('americano','kopi','Americano','Americano','Kopi hitam dengan karakter rasa yang bersih dan menyegarkan.','Clean, refreshing black coffee with a bold character.',16000),
  ('lemon-tea','teh','Lemon Tea','Lemon Tea','Teh dengan sentuhan lemon yang segar.','Refreshing tea with a bright hint of lemon.',12000),
  ('jus-alpukat','jus','Jus Alpukat','Avocado Juice','Jus alpukat lembut dengan rasa creamy dan nikmat.','Creamy avocado juice with a rich, smooth taste.',18000),
  ('ayam-penyet','makanan','Ayam Penyet','Smashed Fried Chicken','Ayam goreng dengan sambal dan pelengkap.','Fried chicken served with sambal and accompaniments.',25000),
  ('nasi-goreng-kampung','makanan','Nasi Goreng Kampung','Village-Style Fried Rice','Nasi goreng berbumbu khas.','Seasoned fried rice with a savoury flavour.',22000),
  ('kentang-goreng','camilan','Kentang Goreng','French Fries','Kentang goreng renyah.','Crispy fries, a perfect snack.',15000),
  ('strawberry-squash','squash','Strawberry Squash','Strawberry Squash','Minuman soda rasa stroberi yang menyegarkan.','A fizzy strawberry drink that is refreshing.',16000)
) as v(slug,category_slug,name,name_en,description,description_en,price)
join public.categories c on c.slug = v.category_slug
on conflict (slug) where slug is not null do update set
  category_id = excluded.category_id,
  name = excluded.name,
  name_en = excluded.name_en,
  description = excluded.description,
  description_en = excluded.description_en,
  price = excluded.price,
  active = true,
  updated_at = now();

-- Atomic creation: order and line items succeed or fail together.
create or replace function public.create_order_request(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order_id uuid;
  item jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Invalid order items';
  end if;
  insert into public.orders (
    order_code, tracking_token_hash, customer_name, customer_whatsapp,
    fulfillment_type, delivery_address, delivery_landmark, payment_method,
    payment_status, order_status, subtotal, delivery_fee, total_amount, notes, expires_at
  ) values (
    p_order->>'order_code', p_order->>'tracking_token_hash', p_order->>'customer_name',
    p_order->>'customer_whatsapp', p_order->>'fulfillment_type', p_order->>'delivery_address',
    p_order->>'delivery_landmark', p_order->>'payment_method', p_order->>'payment_status',
    p_order->>'order_status', (p_order->>'subtotal')::integer, (p_order->>'delivery_fee')::integer,
    (p_order->>'total_amount')::integer, p_order->>'notes', (p_order->>'expires_at')::timestamptz
  ) returning id into new_order_id;

  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, options, line_total)
    values (
      new_order_id, (item->>'product_id')::uuid, item->>'product_name',
      (item->>'quantity')::integer, (item->>'unit_price')::integer,
      coalesce(item->'options', '[]'::jsonb), (item->>'line_total')::integer
    );
  end loop;
  return new_order_id;
end;
$$;

revoke all on function public.create_order_request(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order_request(jsonb, jsonb) to service_role;

commit;
