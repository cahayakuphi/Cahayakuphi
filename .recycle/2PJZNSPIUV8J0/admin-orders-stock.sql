-- Tambahan migrasi untuk API admin. Jalankan setelah align-existing-database.sql.
-- Tidak membuka akses langsung tabel kepada anon/authenticated.
begin;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_admin_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders%rowtype;
  it record;
  updated_order jsonb;
begin
  if not exists (
    select 1 from public.admin_users a
    where a.user_id = p_admin_user_id and a.active = true
  ) then
    raise exception 'ADMIN_FORBIDDEN';
  end if;
  if p_new_status not in ('confirmed','processing','ready_for_pickup','out_for_delivery','completed','cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.order_status = p_new_status then
    return jsonb_build_object('id',o.id,'order_code',o.order_code,'order_status',o.order_status,'unchanged',true);
  end if;
  if o.order_status in ('cancelled','completed','expired') then
    raise exception 'ORDER_TERMINAL_STATUS';
  end if;
  if p_new_status = 'confirmed' and o.order_status <> 'pending_confirmation' then
    raise exception 'INVALID_TRANSITION';
  end if;
  if p_new_status in ('processing','ready_for_pickup','out_for_delivery','completed') and o.order_status not in ('confirmed','processing','ready_for_pickup','out_for_delivery') then
    raise exception 'INVALID_TRANSITION';
  end if;

  -- Stock baru dipotong saat admin pertama kali mengonfirmasi pesanan.
  if p_new_status = 'confirmed' then
    for it in
      select oi.product_id, sum(oi.quantity)::integer as qty
      from public.order_items oi
      where oi.order_id = o.id and oi.product_id is not null
      group by oi.product_id
      order by oi.product_id
    loop
      update public.products p
      set stock_quantity = p.stock_quantity - it.qty, updated_at = now()
      where p.id = it.product_id and p.track_stock = true and p.stock_quantity >= it.qty;
      if not found then
        if exists (select 1 from public.products p where p.id = it.product_id and p.track_stock = false) then
          continue;
        end if;
        raise exception 'INSUFFICIENT_STOCK';
      end if;
      insert into public.stock_movements(product_id, order_id, movement_type, quantity, note)
      values (it.product_id, o.id, 'order_confirmed', it.qty, 'Stok dikurangi saat pesanan dikonfirmasi');
    end loop;
  end if;

  -- Pembatalan mengembalikan stok hanya untuk produk yang tercatat dipotong,
  -- dan hanya sekali karena status pesanan dikunci serta terminal setelah batal.
  if p_new_status = 'cancelled' then
    for it in
      select sm.product_id, sum(sm.quantity)::integer as qty
      from public.stock_movements sm
      where sm.order_id = o.id and sm.movement_type = 'order_confirmed' and sm.product_id is not null
      group by sm.product_id
      order by sm.product_id
    loop
      update public.products p set stock_quantity = p.stock_quantity + it.qty, updated_at = now()
      where p.id = it.product_id;
      insert into public.stock_movements(product_id, order_id, movement_type, quantity, note)
      values (it.product_id, o.id, 'order_cancelled', it.qty, 'Stok dikembalikan karena pesanan dibatalkan');
    end loop;
  end if;

  update public.orders set order_status = p_new_status, updated_at = now()
  where id = o.id returning to_jsonb(orders) into updated_order;
  return updated_order;
end;
$$;

revoke all on function public.admin_update_order_status(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_update_order_status(uuid,text,uuid) to service_role;
commit;
