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
    const { data: existing } = await db.from('payments').select('id').eq('order_id', order.id).maybeSingle();
    const payment = { order_id: order.id, payment_method: order.payment_method, amount: order.total_amount, status: 'pending', proof_storage_path: path, reference_note: 'Bukti diunggah pelanggan', verified_by: null, verified_at: null, updated_at: new Date().toISOString() };
    const result = existing ? await db.from('payments').update(payment).eq('id', existing.id) : await db.from('payments').insert(payment);
    if (result.error) { await db.storage.from('payment-proofs').remove([path]); console.error('payment record:', result.error.message); return fail('Data pembayaran gagal disimpan.', 500); }
    await db.from('orders').update({ payment_status: 'pending_verification', updated_at: new Date().toISOString() }).eq('id', order.id);
    return NextResponse.json({ success: true, message: 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.' });
  } catch { return fail('Permintaan unggah tidak dapat diproses.', 400); }
}
