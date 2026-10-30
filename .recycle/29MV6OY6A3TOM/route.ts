import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
function serverDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
async function requireAdmin(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = req.headers.get('authorization') || '', token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const db = serverDb();
  if (!url || !anon || !db || !token) return { error: 'Sesi admin tidak valid.', status: 401 as const };
  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) return { error: 'Sesi admin tidak valid.', status: 401 as const };
  const { data: admin, error } = await db.from('admin_users').select('user_id').eq('user_id', userData.user.id).eq('active', true).maybeSingle();
  if (error || !admin) return { error: 'Akun ini tidak memiliki akses admin.', status: 403 as const };
  return { db, userId: userData.user.id };
}
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.db.from('orders').select('id,order_code,customer_name,customer_whatsapp,fulfillment_type,delivery_address,delivery_landmark,payment_method,payment_status,order_status,subtotal,delivery_fee,total_amount,notes,created_at,expires_at,order_items(id,product_name,quantity,unit_price,options,line_total)').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'Pesanan gagal dimuat.' }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Format permintaan tidak valid.' }, { status: 400 }); }
  const id = typeof body?.orderId === 'string' ? body.orderId : '', status = typeof body?.status === 'string' ? body.status : '';
  const allowed = ['confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
  if (!/^[0-9a-f-]{36}$/i.test(id) || !allowed.includes(status)) return NextResponse.json({ error: 'Status atau pesanan tidak valid.' }, { status: 400 });
  const { data, error } = await auth.db.rpc('admin_update_order_status', { p_order_id: id, p_new_status: status, p_admin_user_id: auth.userId });
  if (error) {
    console.error('admin_update_order_status failed:', error.message);
    return NextResponse.json({ error: error.message.includes('INSUFFICIENT_STOCK') ? 'Stok tidak mencukupi. Pesanan belum dikonfirmasi.' : 'Status pesanan gagal diubah. Periksa status pesanan dan migrasi database.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, order: data });
}
