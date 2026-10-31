import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  const checks = { url: Boolean(url), anonKey: Boolean(anon), serviceRoleKey: Boolean(service), session: Boolean(token) };
  if (!url || !anon || !service) return NextResponse.json({ ok: false, code: 'SERVER_ENV_MISSING', checks, message: 'Konfigurasi Supabase di Vercel belum lengkap. Pastikan URL, anon key, dan service role key sudah diisi pada Environment Variables lalu redeploy.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!token) return NextResponse.json({ ok: false, code: 'SESSION_MISSING', checks, message: 'Sesi login tidak ditemukan. Silakan login ulang.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ ok: false, code: 'SESSION_INVALID', checks, message: 'Token login tidak valid atau kedaluwarsa. Silakan keluar lalu login kembali.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: admin, error: adminError } = await db.from('admin_users').select('user_id,active').eq('user_id', data.user.id).maybeSingle();
  if (adminError) return NextResponse.json({ ok: false, code: 'ADMIN_TABLE_ERROR', checks, message: 'Tidak dapat membaca tabel admin_users. Pastikan migrasi admin sudah dijalankan dan periksa log Supabase.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  if (!admin?.active) return NextResponse.json({ ok: false, code: 'ADMIN_NOT_ACTIVE', checks, message: 'Akun berhasil login, tetapi belum memiliki akses admin aktif. Tambahkan UID akun ke tabel admin_users dengan active = true.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ ok: true, code: 'READY', checks, user: { email: data.user.email || null } }, { headers: { 'Cache-Control': 'no-store' } });
}
