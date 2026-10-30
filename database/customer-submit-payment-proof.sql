-- Apply after payment-proof-storage.sql.
-- The API validates the tracking token and uploads the file before calling this RPC.
-- This function atomically creates/updates the payment record and order payment state.
create or replace function public.customer_submit_payment_proof(
  p_order_id uuid,
  p_storage_path text,
  p_payment_method text,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  if p_payment_method not in ('transfer', 'qris')
     or p_amount < 0
     or p_storage_path is null
     or length(p_storage_path) > 500
     or p_storage_path not like p_order_id::text || '/%' then
    raise exception 'Invalid payment proof data';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_method <> p_payment_method
     or v_order.total_amount <> p_amount then
    raise exception 'Payment details changed';
  end if;
  if v_order.order_status in ('cancelled', 'expired')
     or v_order.payment_status in ('paid', 'rejected') then
    raise exception 'Order cannot accept payment proof';
  end if;

  select * into v_payment
  from public.payments
  where order_id = p_order_id
  for update;

  if found then
    if v_payment.status <> 'pending' then
      raise exception 'Payment already reviewed';
    end if;
    update public.payments
    set payment_method = p_payment_method,
        amount = p_amount,
        proof_storage_path = p_storage_path,
        reference_note = 'Bukti diunggah pelanggan',
        updated_at = now()
    where id = v_payment.id;
  else
    insert into public.payments (
      order_id, payment_method, amount, status,
      proof_storage_path, reference_note
    ) values (
      p_order_id, p_payment_method, p_amount, 'pending',
      p_storage_path, 'Bukti diunggah pelanggan'
    );
  end if;

  update public.orders
  set payment_status = 'pending_verification', updated_at = now()
  where id = p_order_id;
end;
$function$;

revoke execute on function public.customer_submit_payment_proof(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.customer_submit_payment_proof(uuid, text, text, integer) to service_role;
