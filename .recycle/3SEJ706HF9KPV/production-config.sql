-- Cahaya Kuphi production business settings (run AFTER database/schema.sql).
-- This records the business details supplied by the owner.
-- Orders intentionally remain disabled until the full production acceptance checklist passes.

insert into public.store_settings
  (id, store_name, whatsapp_admin, cafe_address, delivery_fee, accepting_orders,
   payment_instructions_id, payment_instructions_en, updated_at)
values
  (1, 'Cahaya Kuphi Resto & Cafe', '6282269696845',
   'Sumber Batu, Meureubo, Aceh Barat', 5000, false,
   'Pembayaran transfer/QRIS akan diinformasikan setelah pesanan diperiksa admin. Jangan transfer sebelum menerima instruksi resmi.',
   'Bank transfer/QRIS instructions will be provided after the order is reviewed by the admin. Do not pay before receiving official instructions.',
   now())
on conflict (id) do update set
  store_name = excluded.store_name,
  whatsapp_admin = excluded.whatsapp_admin,
  cafe_address = excluded.cafe_address,
  delivery_fee = excluded.delivery_fee,
  -- Keep orders disabled until the release checklist is passed and owner explicitly enables them.
  accepting_orders = false,
  payment_instructions_id = excluded.payment_instructions_id,
  payment_instructions_en = excluded.payment_instructions_en,
  updated_at = now();

-- PostgreSQL DOW: 0=Sunday ... 6=Saturday. Open every day 09:00-12:00 WIB.
insert into public.store_hours (weekday, is_open, opens_at, closes_at)
values
  (0, true, '09:00', '12:00'),
  (1, true, '09:00', '12:00'),
  (2, true, '09:00', '12:00'),
  (3, true, '09:00', '12:00'),
  (4, true, '09:00', '12:00'),
  (5, true, '09:00', '12:00'),
  (6, true, '09:00', '12:00')
on conflict (weekday) do update set
  is_open = excluded.is_open,
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at;
