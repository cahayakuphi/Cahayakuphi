-- Selaraskan RPC status pesanan dengan skema Cahaya Kuphi yang berjalan.
-- Status orders yang didukung: pending, confirmed, preparing, ready, completed, cancelled, expired.
-- Stok dipotong saat konfirmasi dan dikembalikan saat pembatalan.
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_admin_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  o public.orders%rowtype;
  it record;
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = p_admin_user_id AND a.active = true
  ) THEN
    RAISE EXCEPTION 'ADMIN_FORBIDDEN';
  END IF;

  IF p_new_status NOT IN ('confirmed','preparing','ready','completed','cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF o.order_status = p_new_status THEN
    RETURN jsonb_build_object('id',o.id,'order_code',o.order_code,'order_status',o.order_status,'unchanged',true);
  END IF;
  IF o.order_status IN ('cancelled','completed','expired') THEN
    RAISE EXCEPTION 'ORDER_TERMINAL_STATUS';
  END IF;
  IF p_new_status = 'confirmed' AND o.order_status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;
  IF p_new_status = 'confirmed' AND o.payment_method IN ('transfer','qris') AND o.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'PAYMENT_NOT_VERIFIED';
  END IF;
  IF p_new_status = 'confirmed' AND o.payment_method IN ('transfer','qris') AND o.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'PAYMENT_NOT_VERIFIED';
  END IF;
  IF p_new_status IN ('preparing','ready','completed')
     AND o.order_status NOT IN ('confirmed','preparing','ready') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  IF p_new_status = 'confirmed' THEN
    FOR it IN
      SELECT product_id, sum(quantity)::integer AS qty
      FROM public.order_items
      WHERE order_id = o.id AND product_id IS NOT NULL
      GROUP BY product_id ORDER BY product_id
    LOOP
      UPDATE public.products
      SET stock_quantity = stock_quantity - it.qty, updated_at = now()
      WHERE id = it.product_id AND track_stock = true AND stock_quantity >= it.qty;
      IF NOT FOUND THEN
        IF EXISTS (SELECT 1 FROM public.products WHERE id = it.product_id AND track_stock = false) THEN
          CONTINUE;
        END IF;
        RAISE EXCEPTION 'INSUFFICIENT_STOCK';
      END IF;
      INSERT INTO public.stock_movements(product_id,order_id,movement_type,quantity,note)
      VALUES(it.product_id,o.id,'out',it.qty,'Order confirmed: stock deducted');
    END LOOP;
  END IF;

  IF p_new_status = 'cancelled' THEN
    FOR it IN
      SELECT sm.product_id, sum(sm.quantity)::integer AS qty
      FROM public.stock_movements sm
      WHERE sm.order_id = o.id
        AND sm.movement_type = 'out'
        AND sm.note = 'Order confirmed: stock deducted'
        AND NOT EXISTS (
          SELECT 1 FROM public.stock_movements sr
          WHERE sr.order_id = o.id AND sr.product_id = sm.product_id AND sr.movement_type = 'return'
        )
      GROUP BY sm.product_id ORDER BY sm.product_id
    LOOP
      UPDATE public.products SET stock_quantity = stock_quantity + it.qty, updated_at = now()
      WHERE id = it.product_id;
      INSERT INTO public.stock_movements(product_id,order_id,movement_type,quantity,note)
      VALUES(it.product_id,o.id,'return',it.qty,'Order cancelled: stock restored');
    END LOOP;
  END IF;

  UPDATE public.orders SET order_status = p_new_status, updated_at = now()
  WHERE id = o.id RETURNING to_jsonb(orders) INTO result;
  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid,text,uuid) TO service_role;
COMMIT;
