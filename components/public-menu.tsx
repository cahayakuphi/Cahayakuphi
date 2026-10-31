'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';
import { useLanguage } from '@/components/use-language';

type Category = { id: string; name: string; name_en: string };
export function PublicMenu({ featured = false }: { featured?: boolean }) {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
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
    const normalized = query.trim().toLocaleLowerCase(lang === 'id' ? 'id' : 'en');
    let list = category === 'all' ? products : products.filter(p => p.category.id === category);
    if (normalized) list = list.filter(p => [p.name.id, p.name.en, p.description.id, p.description.en, p.category.name, p.category.name_en].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalized));
    return featured && !normalized ? list.slice(0, 4) : list;
  }, [category, featured, lang, products, query]);

  if (loading) return <div className="py-8 text-sm muted">{lang === 'id' ? 'Memuat menu...' : 'Loading menu...'}</div>;
  if (failed) return <div className="card p-8 text-center muted">{lang === 'id' ? 'Menu belum dapat ditampilkan. Silakan coba kembali.' : 'The menu is temporarily unavailable. Please try again.'}</div>;
  if (!products.length) return <div className="card p-8 text-center muted">{lang === 'id' ? 'Menu pilihan kami akan segera hadir.' : 'Our menu will be available soon.'}</div>;

  return <>
    <div className={`menu-tools ${featured ? 'mb-5' : 'mt-7 mb-5'}`}>
      <label className="search-field">
        <Search size={19} aria-hidden="true" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === 'id' ? 'Cari kopi, makanan, minuman...' : 'Search coffee, food, drinks...'} aria-label={lang === 'id' ? 'Cari produk' : 'Search products'} />
        {query && <button type="button" onClick={() => setQuery('')} aria-label={lang === 'id' ? 'Hapus pencarian' : 'Clear search'}><X size={17}/></button>}
      </label>
      {!featured && <div className="mt-4 flex items-center gap-2 text-xs font-bold muted"><SlidersHorizontal size={14}/>{lang === 'id' ? 'Jelajahi kategori' : 'Browse categories'}</div>}
      <div className="category-scroller mt-3">
        <button onClick={() => setCategory('all')} className={`category-chip ${category === 'all' ? 'active' : ''}`}>{lang === 'id' ? 'Semua' : 'All'}</button>
        {categories.map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`category-chip ${category === c.id ? 'active' : ''}`}>{lang === 'id' ? c.name : c.name_en}</button>)}
      </div>
    </div>
    {query && <p className="mb-4 text-sm muted">{lang === 'id' ? `${visible.length} produk ditemukan untuk “${query}”` : `${visible.length} products found for “${query}”`}</p>}
    <div className={`grid gap-4 sm:gap-5 ${featured ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {visible.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
    {!visible.length && <div className="empty-search"><Search size={28}/><strong>{lang === 'id' ? 'Produk tidak ditemukan' : 'No products found'}</strong><span>{lang === 'id' ? 'Coba kata kunci atau kategori lain.' : 'Try another keyword or category.'}</span><button className="btn btn-secondary mt-2" onClick={() => { setQuery(''); setCategory('all'); }}>{lang === 'id' ? 'Hapus filter' : 'Clear filters'}</button></div>}
    {!featured && !visible.length && !query && <div className="card p-8 text-center muted">{lang === 'id' ? 'Belum ada menu dalam kategori ini.' : 'No items in this category yet.'}</div>}
  </>;
}
