-- Jalankan di Supabase SQL Editor. Hanya membaca metadata, tidak mengubah data.
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'admin_users','categories','products','product_variants','variant_options',
    'product_extras','product_extra_options','orders','order_items','payments',
    'stock_movements','store_settings','store_hours'
  )
order by table_name, ordinal_position;

select routine_name, data_type
from information_schema.routines
where specific_schema = 'public'
  and routine_name in ('create_order_request','admin_update_order_status')
order by routine_name;
