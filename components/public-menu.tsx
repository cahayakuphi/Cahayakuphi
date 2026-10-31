'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';
import { useLanguage } from '@/components/use-language';

type Category = { id: string; name: string; name_en: string };
export function PublicMenu({ featured = false }: { featured?: boolean }) {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let firstLoad = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/menu', { cache: 'no-store' });
        if (!response.ok) throw new Error('menu_unavailable');
        const data = await response.json();
        if (!alive) return;
        setProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setFailed(false);
      } catch {
        if (alive && firstLoad) setFailed(true);
      } finally {
        if (alive && firstLoad) { setLoading(false); firstLoad = false; }
      }
    };
    void refresh();
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    return () => { alive = false; window.clearInterval(interval); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, []);

  const visible = useMemo(() => {
    const list = category === 'all' ? products : products.filter(p => p.category.id === category);
    return featured ? list.slice(0, 4) : list;
  }, [category, featured, products]);

  if (loading) return <div className="py-8 text-sm muted">{lang === 'id' ? 'Memuat menu...' : 'Loading menu...'}</div>;
  if (failed) return <div className="card p-8 text-center muted">{lang === 'id' ? 'Menu belum dapat ditampilkan. Silakan coba kembali.' : 'The menu is temporarily unavailable. Please try again.'}</div>;
  if (!products.length) return <div className="card p-8 text-center muted">{lang === 'id' ? 'Menu pilihan kami akan segera hadir.' : 'Our menu will be available soon.'}</div>;

  return <>
    {!featured && <div className="my-7 flex flex-wrap gap-2">
      <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-coffee-700 text-white' : 'bg-white border border-[#eadfd4]'}`}>{lang === 'id' ? 'Semua' : 'All'}</button>
      {categories.map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`rounded-full px-4 py-2 text-sm font-bold ${category === c.id ? 'bg-coffee-700 text-white' : 'bg-white border border-[#eadfd4]'}`}>{lang === 'id' ? c.name : c.name_en}</button>)}
    </div>}
    <div className={`grid gap-5 ${featured ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {visible.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
    {!featured && !visible.length && <div className="card p-8 text-center muted">{lang === 'id' ? 'Belum ada menu dalam kategori ini.' : 'No items in this category yet.'}</div>}
  </>;
}
