-- Atomic payment verification. Apply after the payment-proof-storage.sql migration.
-- API verifies the Supabase access token and active admin before calling this RPC.
create or replace function public.admin_verify_payment(
  p_payment_id uuid,
  p_new_status text,
  p_admin_user_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
begin
  if p_new_status not in ('verified', 'rejected') then
    raise exception 'Invalid payment status';
  end if;

  if not exists (
    select 1 from public.admin_users a
    where a.user_id = p_admin_user_id and a.active = true
  ) then
    raise exception 'Admin access denied';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_payment.status <> 'pending' then raise exception 'Payment already reviewed'; end if;

  select * into v_order
  from public.orders
  where id = v_payment.order_id
  for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.order_status in ('cancelled', 'expired') then
    raise exception 'Order can no longer be paid';
  end if;
  if v_order.payment_status not in ('pending_verification', 'unpaid') then
    raise exception 'Order payment state has changed';
  end if;

  update public.payments
  set status = p_new_status,
      verified_by = p_admin_user_id,
      verified_at = now(),
      updated_at = now()
  where id = p_payment_id;

  update public.orders
  set payment_status = case when p_new_status = 'verified' then 'paid' else 'rejected' end,
      updated_at = now()
  where id = v_order.id;
end;
$function$;

revoke execute on function public.admin_verify_payment(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_verify_payment(uuid, text, uuid) to service_role;
