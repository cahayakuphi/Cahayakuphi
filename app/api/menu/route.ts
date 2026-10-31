import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Menu sedang tidak tersedia.' }, { status: 503 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db
    .from('products')
    .select('id,slug,category_id,name,name_en,description,description_en,price,image_url,active,track_stock,stock_quantity,categories(id,name,name_en,active)')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Public menu query failed:', error.message);
    return NextResponse.json({ error: 'Menu sedang tidak tersedia.' }, { status: 503 });
  }

  const rows = (data || []).filter((p: any) => p.categories?.active !== false);
  const productIds = rows.map((p: any) => p.id);
  // The public catalogue must remain usable even before optional variant/extra
  // tables are migrated. Option configuration is loaded when available.
  let variantRows: any[] = [];
  let extraRows: any[] = [];
  if (productIds.length) {
    const [variants, extras] = await Promise.all([
      db.from('product_variants').select('id,product_id,name_id,name_en,is_required,sort_order,variant_options(id,label_id,label_en,price_delta,is_active,sort_order)').in('product_id', productIds).order('sort_order'),
      db.from('product_extras').select('id,product_id,name_id,name_en,is_required,sort_order,product_extra_options(id,label_id,label_en,price_delta,is_active)').in('product_id', productIds).order('sort_order'),
    ]);
    if (variants.error || extras.error) {
      // Do not turn a missing optional options migration into a blank menu.
      console.warn('Menu options unavailable; serving base catalogue:', variants.error?.message || extras.error?.message);
    } else {
      variantRows = variants.data || [];
      extraRows = extras.data || [];
    }
  }
  const categories = Array.from(new Map(rows.map((p: any) => [p.category_id, {
    id: p.category_id,
    name: p.categories?.name || 'Lainnya',
    name_en: p.categories?.name_en || p.categories?.name || 'Other',
  }])).values());

  const products = rows.map((p: any) => ({
    id: p.slug,
    name: { id: p.name, en: p.name_en || p.name },
    description: { id: p.description || '', en: p.description_en || p.description || '' },
    category: { id: p.category_id, en: p.categories?.name_en || p.categories?.name || 'Other', name: p.categories?.name || 'Lainnya' },
    price: p.price,
    imageUrl: p.image_url || null,
    available: !p.track_stock || p.stock_quantity > 0,
    options: variantRows.filter((g: any) => g.product_id === p.id).map((g: any) => ({
      id: g.id, required: g.is_required,
      label: { id: g.name_id, en: g.name_en || g.name_id },
      choices: (g.variant_options || []).filter((o: any) => o.is_active).sort((a: any,b: any) => a.sort_order-b.sort_order).map((o: any) => ({ id: o.id, label: { id: o.label_id, en: o.label_en || o.label_id }, extra: Number(o.price_delta || 0) })),
    })),
    extras: extraRows.filter((g: any) => g.product_id === p.id).map((g: any) => ({
      id: g.id, required: g.is_required,
      label: { id: g.name_id, en: g.name_en || g.name_id },
      choices: (g.product_extra_options || []).filter((o: any) => o.is_active).sort((a: any,b: any) => (a.sort_order || 0)-(b.sort_order || 0)).map((o: any) => ({ id: o.id, label: { id: o.label_id, en: o.label_en || o.label_id }, extra: Number(o.price_delta || 0) })),
    })),
  }));

  return NextResponse.json({ products, categories }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
