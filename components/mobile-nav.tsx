'use client';
import Link from 'next/link';
import { Home, Search, ClipboardList, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCart } from './cart-provider';
import { useLanguage } from './use-language';
export function MobileNav() {
  const path = usePathname();
  const { count } = useCart();
  const { lang } = useLanguage();
  const items = [
    { href: '/', label: lang === 'id' ? 'Beranda' : 'Home', icon: Home },
    { href: '/menu', label: lang === 'id' ? 'Menu' : 'Menu', icon: Search },
    { href: '/track', label: lang === 'id' ? 'Pesanan' : 'Orders', icon: ClipboardList },
    { href: '/cart', label: lang === 'id' ? 'Keranjang' : 'Cart', icon: ShoppingBag },
  ];
  return <nav className="mobile-nav" aria-label="Navigasi utama">
    {items.map(item => { const Icon = item.icon; const active = path === item.href || (item.href !== '/' && path.startsWith(item.href)); return <Link key={item.href} href={item.href} className={active ? 'mobile-nav-item active' : 'mobile-nav-item'}>
      <span className="mobile-nav-icon"><Icon size={20}/>{item.href === '/cart' && count > 0 && <i>{count > 9 ? '9+' : count}</i>}</span>
      <span>{item.label}</span>
    </Link>; })}
  </nav>;
}
