import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
function serverDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
async function requireAdmin(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const db = serverDb();
  if (!url || !anon || !db || !token) return { error: 'Sesi admin tidak valid.', status: 401 as const };
  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { error: 'Sesi admin tidak valid.', status: 401 as const };
  const { data: admin, error: adminError } = await db.from('admin_users').select('user_id').eq('user_id', data.user.id).eq('active', true).maybeSingle();
  if (adminError || !admin) return { error: 'Akun ini tidak memiliki akses admin.', status: 403 as const };
  return { db };
}
const clean = (v: unknown, max = 160) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const slugify = (v: string) => v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.db.from('products').select('id,slug,category_id,name,name_en,description,description_en,price,image_url,active,track_stock,stock_quantity,categories(name,name_en)').order('name');
  if (error) return NextResponse.json({ error: 'Menu gagal dimuat. Pastikan kolom slug sudah ditambahkan.' }, { status: 500 });
  const { data: categories, error: categoryError } = await auth.db.from('categories').select('id,slug,name,name_en,active').order('sort_order');
  if (categoryError) return NextResponse.json({ error: 'Kategori gagal dimuat.' }, { status: 500 });
  return NextResponse.json({ products: data || [], categories: categories || [] });
}
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 }); }
  const name = clean(b?.name), nameEn = clean(b?.name_en), categoryId = clean(b?.category_id, 64);
  const price = Number(b?.price);
  if (!name || !nameEn || !/^[0-9a-f-]{36}$/i.test(categoryId) || !Number.isSafeInteger(price) || price < 0 || price > 100000000) {
    return NextResponse.json({ error: 'Nama menu, nama Inggris, kategori, atau harga tidak valid.' }, { status: 400 });
  }
  const imageUrl = clean(b?.image_url, 2000);
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return NextResponse.json({ error: 'URL foto harus menggunakan HTTPS.' }, { status: 400 });
  const baseSlug = slugify(clean(b?.slug) || name);
  if (!baseSlug) return NextResponse.json({ error: 'Slug menu tidak valid.' }, { status: 400 });
  const { data: existing, error: checkError } = await auth.db.from('products').select('id').eq('slug', baseSlug).maybeSingle();
  if (checkError) return NextResponse.json({ error: 'Gagal memeriksa slug menu.' }, { status: 500 });
  if (existing) return NextResponse.json({ error: 'Slug menu sudah digunakan. Ubah nama menu.' }, { status: 409 });
  const { data, error } = await auth.db.from('products').insert({ slug: baseSlug, category_id: categoryId, name, name_en: nameEn, description: clean(b?.description, 1000) || null, description_en: clean(b?.description_en, 1000) || null, image_url: imageUrl || null, price, active: b?.active !== false, track_stock: b?.track_stock === true, stock_quantity: Math.max(0, Math.floor(Number(b?.stock_quantity) || 0)) }).select('id,slug,category_id,name,name_en,description,description_en,price,image_url,active,track_stock,stock_quantity').single();
  if (error) { console.error('admin menu create failed:', error.message); return NextResponse.json({ error: 'Menu gagal disimpan. Periksa kategori dan struktur database.' }, { status: 500 }); }
  return NextResponse.json({ product: data }, { status: 201 });
}
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 }); }
  const id = clean(b?.id, 64);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'ID menu tidak valid.' }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b?.active === 'boolean') patch.active = b.active;
  if (b?.image_url !== undefined) { const image = clean(b.image_url, 2000); if (image && !/^https:\/\//i.test(image)) return NextResponse.json({ error: 'URL foto harus menggunakan HTTPS.' }, { status: 400 }); patch.image_url = image || null; }
  if (b?.price !== undefined) {
    const price = Number(b.price);
    if (!Number.isSafeInteger(price) || price < 0 || price > 100000000) return NextResponse.json({ error: 'Harga tidak valid.' }, { status: 400 });
    patch.price = price;
  }
  if (b?.track_stock !== undefined) {
    if (typeof b.track_stock !== 'boolean') return NextResponse.json({ error: 'Pengaturan stok tidak valid.' }, { status: 400 });
    patch.track_stock = b.track_stock;
  }
  if (b?.stock_quantity !== undefined) {
    const q = Number(b.stock_quantity);
    if (!Number.isSafeInteger(q) || q < 0 || q > 100000000) return NextResponse.json({ error: 'Jumlah stok tidak valid.' }, { status: 400 });
    patch.stock_quantity = q;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 });
  patch.updated_at = new Date().toISOString();
  const { data, error } = await auth.db.from('products').update(patch).eq('id', id).select('id,slug,name,name_en,price,active,track_stock,stock_quantity').maybeSingle();
  if (error) { console.error('admin menu update failed:', error.message); return NextResponse.json({ error: 'Menu gagal diperbarui.' }, { status: 500 }); }
  if (!data) return NextResponse.json({ error: 'Menu tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ product: data });
}
