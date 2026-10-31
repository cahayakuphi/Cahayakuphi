import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { SiteHeader } from '@/components/site-header';
import { MobileNav } from '@/components/mobile-nav';
export const metadata: Metadata = { title: 'Cahaya Kuphi Resto & Cafe', description: 'Menu dan pemesanan Cahaya Kuphi Resto & Cafe.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body><CartProvider><SiteHeader />{children}<MobileNav /><footer className="mt-20 mb-20 border-t border-[#eadfd4] bg-white py-8"><div className="container flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><strong>Cahaya Kuphi Resto & Cafe</strong><p className="mt-1 text-sm muted">Tempat singgah untuk rasa yang istimewa.</p></div><p className="text-xs muted">© {new Date().getFullYear()} Cahaya Kuphi</p></div></footer></CartProvider></body></html>; }