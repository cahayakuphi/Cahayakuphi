-- Applied to the connected Supabase project on 2026-10-30.
-- Run only on a separate project after reviewing the schema and permissions.
CREATE OR REPLACE FUNCTION public.admin_adjust_product_stock(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_note text,
  p_admin_user_id uuid
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_stock integer; next_stock integer; movement_qty integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id=p_admin_user_id AND a.active=true) THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF p_movement_type NOT IN ('in','out','adjustment') OR p_quantity IS NULL OR p_quantity < 1 THEN RAISE EXCEPTION 'INVALID_STOCK_CHANGE'; END IF;
  SELECT stock_quantity INTO current_stock FROM public.products WHERE id=p_product_id AND track_stock=true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRACKED_PRODUCT_NOT_FOUND'; END IF;
  IF p_movement_type='in' THEN next_stock:=current_stock+p_quantity; movement_qty:=p_quantity;
  ELSIF p_movement_type='out' THEN IF current_stock<p_quantity THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK'; END IF; next_stock:=current_stock-p_quantity; movement_qty:=p_quantity;
  ELSE next_stock:=p_quantity; movement_qty:=abs(next_stock-current_stock); IF movement_qty=0 THEN RETURN current_stock; END IF; END IF;
  UPDATE public.products SET stock_quantity=next_stock,updated_at=now() WHERE id=p_product_id;
  INSERT INTO public.stock_movements(product_id,movement_type,quantity,note) VALUES(p_product_id,p_movement_type,movement_qty,CASE WHEN p_movement_type='adjustment' THEN concat(coalesce(p_note,''),' [koreksi dari ',current_stock,' menjadi ',next_stock,']') ELSE p_note END);
  RETURN next_stock;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_product_stock(uuid,text,integer,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_product_stock(uuid,text,integer,text,uuid) TO service_role;
