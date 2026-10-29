import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { products as demoCatalog } from '@/lib/catalog';

export const runtime = 'nodejs';
const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });
function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
const clean = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = body?.mode;
    const customer = body?.customer ?? {};
    const items = body?.items;
    if (!['delivery', 'pickup'].includes(mode) || !clean(customer.name, 120) || !clean(customer.phone, 40) ||
      !Array.isArray(items) || items.length < 1 || items.length > 30) {
      return jsonError('Data pesanan belum lengkap atau tidak valid.', 400);
    }
    if (mode === 'delivery' && !clean(customer.address, 1000)) return jsonError('Alamat delivery wajib diisi.', 400);
    if (!['cash', 'transfer', 'qris'].includes(customer.payment)) return jsonError('Metode pembayaran tidak valid.', 400);

    const supabase = db();
    if (!supabase) return jsonError('Supabase belum dikonfigurasi di server.', 503);
    const uniqueSlugs = [...new Set(items.map((i: any) => String(i?.productId ?? '')))];
    if (uniqueSlugs.some((id: string) => !/^[a-z0-9-]{1,80}$/.test(id))) return jsonError('Menu pesanan tidak valid.', 400);
    for (const item of items) {
      if (!Number.isInteger(item?.quantity) || item.quantity < 1 || item.quantity > 20 || !Array.isArray(item.choices)) {
        return jsonError('Jumlah atau pilihan menu tidak valid.', 400);
      }
    }

    const [{ data: settings, error: settingsError }, { data: dbProducts, error: productError }] = await Promise.all([
      supabase.from('store_settings').select('store_name,whatsapp,address,delivery_fee,accepting_orders').eq('id', 1).maybeSingle(),
      supabase.from('products').select('id,slug,name,name_en,price,active,track_stock,stock_quantity').in('slug', uniqueSlugs),
    ]);
    if (settingsError || !settings) return jsonError('Pengaturan toko belum tersedia.', 503);
    if (!settings.accepting_orders) return jsonError('Penerimaan pesanan online sedang dinonaktifkan. Silakan hubungi admin Cahaya Kuphi.', 503);
    if (productError || !dbProducts || dbProducts.length !== uniqueSlugs.length) return jsonError('Sebagian menu belum tersedia di database.', 409);

    let subtotal = 0;
    const snapshots: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; options: unknown[]; line_total: number }> = [];
    for (const item of items) {
      const product = dbProducts.find((p: any) => p.slug === item.productId);
      const demoProduct = demoCatalog.find(p => p.id === item.productId);
      if (!product || !product.active || !demoProduct) return jsonError('Salah satu menu sedang tidak tersedia.', 409);
      let optionDelta = 0;
      const optionSnapshot: unknown[] = [];
      for (const choice of item.choices) {
        const group = clean(choice?.group, 80);
        const choiceId = clean(choice?.choice, 80);
        const allowedGroup = demoProduct.options?.find(o => o.label.id === group);
        const allowedChoice = allowedGroup?.choices.find(c => c.id === choiceId);
        if (!allowedChoice || Number(choice?.extra) !== allowedChoice.extra) return jsonError('Pilihan menu tidak valid. Silakan perbarui keranjang.', 400);
        optionDelta += allowedChoice.extra;
        optionSnapshot.push({ group, choice: choiceId, extra: allowedChoice.extra });
      }
      const unitPrice = Number(product.price) + optionDelta;
      const lineTotal = unitPrice * item.quantity;
      if (!Number.isSafeInteger(unitPrice) || !Number.isSafeInteger(lineTotal) || lineTotal < 0) return jsonError('Harga menu tidak valid.', 400);
      subtotal += lineTotal;
      snapshots.push({ product_id: product.id, product_name: product.name, quantity: item.quantity, unit_price: unitPrice, options: optionSnapshot, line_total: lineTotal });
    }
    const deliveryFee = mode === 'delivery' ? Number(settings.delivery_fee) : 0;
    if (!Number.isSafeInteger(deliveryFee) || deliveryFee < 0) return jsonError('Ongkir toko belum valid.', 503);
    const total = subtotal + deliveryFee;
    if (!Number.isSafeInteger(total)) return jsonError('Total pesanan tidak valid.', 400);

    const orderCode = `CK-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const trackingToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(trackingToken));
    const trackingHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const orderRow = {
      order_code: orderCode,
      tracking_token_hash: trackingHash,
      customer_name: clean(customer.name, 120),
      customer_whatsapp: clean(customer.phone, 40),
      fulfillment_type: mode,
      delivery_address: mode === 'delivery' ? clean(customer.address, 1000) : null,
      delivery_landmark: mode === 'delivery' ? clean(customer.landmark, 250) || null : null,
      payment_method: customer.payment,
      payment_status: 'unpaid',
      order_status: 'pending_confirmation',
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: total,
      notes: clean(customer.notes, 1000) || null,
      expires_at: expiresAt,
    };

    // RPC inserts order and items in one database transaction.
    const { data: orderId, error: createError } = await supabase.rpc('create_order_request', {
      p_order: orderRow,
      p_items: snapshots,
    });
    if (createError || !orderId) {
      console.error('create_order_request failed:', createError?.message);
      return jsonError('Pesanan belum dapat disimpan. Periksa migrasi database atau hubungi admin.', 500);
    }
    return NextResponse.json({ orderCode, total, subtotal, deliveryFee, trackingToken, expiresAt, storeWhatsApp: settings.whatsapp }, { status: 201 });
  } catch {
    return jsonError('Permintaan tidak dapat diproses.', 400);
  }
}
