import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('Layanan pembayaran belum tersedia.', 503);
  try {
    const form = await req.formData();
    const code = String(form.get('code') || '').trim().toUpperCase();
    const token = String(form.get('token') || '');
    const file = form.get('proof');
    if (!/^CK-[A-F0-9]{8}$/.test(code) || token.length < 40 || token.length > 200 || !(file instanceof File)) return fail('Data bukti pembayaran tidak valid.', 400);
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) return fail('File harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.', 400);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data: order, error } = await db.from('orders').select('id,order_code,payment_method,payment_status,total_amount,order_status,tracking_token_hash').eq('order_code', code).eq('tracking_token_hash', hash).maybeSingle();
    if (error || !order) return fail('Pesanan tidak ditemukan atau token salah.', 404);
    if (!['transfer','qris'].includes(order.payment_method)) return fail('Bukti hanya diperlukan untuk transfer atau QRIS.', 400);
    if (['paid','rejected'].includes(order.payment_status) || order.order_status === 'cancelled') return fail('Pembayaran pesanan ini tidak dapat diubah.', 409);
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${order.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await db.storage.from('payment-proofs').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { console.error('payment proof upload:', uploadError.message); return fail('Bukti gagal diunggah. Pastikan konfigurasi Storage sudah diterapkan.', 503); }
    const { error: submitError } = await db.rpc('customer_submit_payment_proof', {
      p_order_id: order.id,
      p_storage_path: path,
      p_payment_method: order.payment_method,
      p_amount: order.total_amount,
    });
    if (submitError) {
      await db.storage.from('payment-proofs').remove([path]);
      console.error('payment proof submit:', submitError.message);
      const conflict = /cannot accept payment proof|already reviewed|details changed/i.test(submitError.message || '');
      return fail(conflict ? 'Pesanan sudah tidak dapat menerima bukti pembayaran.' : 'Data pembayaran gagal disimpan. Pastikan migrasi database sudah diterapkan.', conflict ? 409 : 500);
    }
    return NextResponse.json({ success: true, message: 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.' });
  } catch { return fail('Permintaan unggah tidak dapat diproses.', 400); }
}
