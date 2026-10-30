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
  if (!url || !anon || !db) return { error: 'Konfigurasi server Supabase belum lengkap. Periksa NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY di Vercel.', status: 503 as const };
  if (!token) return { error: 'Token sesi tidak ditemukan. Silakan login ulang.', status: 401 as const };
  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { error: 'Sesi admin tidak valid.', status: 401 as const };
  const { data: admin, error: adminError } = await db.from('admin_users').select('user_id').eq('user_id', data.user.id).eq('active', true).maybeSingle();
  if (adminError || !admin) return { error: 'Akun ini tidak memiliki akses admin.', status: 403 as const };
  return { db };
}
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url), from = url.searchParams.get('from') || '', to = url.searchParams.get('to') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return NextResponse.json({ error: 'Rentang tanggal tidak valid.' }, { status: 400 });
  const start = new Date(`${from}T00:00:00+07:00`).toISOString();
  const end = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86400000).toISOString();
  const { data: orders, error } = await auth.db.from('orders').select('id,order_code,order_status,payment_status,payment_method,total_amount,created_at,order_items(id,product_name,quantity,line_total)').gte('created_at', start).lt('created_at', end).order('created_at', { ascending: false }).limit(5000);
  if (error) { console.error('admin report query failed:', error.message); return NextResponse.json({ error: 'Laporan gagal dimuat. Periksa struktur tabel pesanan.' }, { status: 500 }); }
  const rows = orders || [], completed = rows.filter((o: any) => o.order_status === 'completed');
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of completed as any[]) for (const item of (order.order_items || []) as any[]) {
    const key = item.product_name || 'Menu', current = productMap.get(key) || { name: key, quantity: 0, revenue: 0 };
    current.quantity += Number(item.quantity) || 0; current.revenue += Number(item.line_total) || 0; productMap.set(key, current);
  }
  const byStatus: Record<string, number> = {};
  for (const order of rows as any[]) byStatus[order.order_status] = (byStatus[order.order_status] || 0) + 1;
  const revenue = completed.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
  return NextResponse.json({ period: { from, to }, summary: { orderCount: rows.length, completedCount: completed.length, cancelledCount: rows.filter((o: any) => ['cancelled','expired'].includes(o.order_status)).length, pendingCount: rows.filter((o: any) => o.order_status === 'pending_confirmation').length, revenue, averageOrder: completed.length ? Math.round(revenue / completed.length) : 0, paidCount: completed.filter((o: any) => o.payment_status === 'paid').length }, byStatus, topProducts: [...productMap.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,20), recentCompleted: completed.slice(0,20).map((o:any)=>({orderCode:o.order_code,createdAt:o.created_at,total:o.total_amount,paymentStatus:o.payment_status,paymentMethod:o.payment_method})) }, { headers: { 'Cache-Control': 'no-store' } });
}
