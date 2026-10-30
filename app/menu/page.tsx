'use client';
import { useLanguage } from '@/components/use-language';
import { PublicMenu } from '@/components/public-menu';
export default function MenuPage(){const {lang}=useLanguage();return <main className="container py-12"><span className="eyebrow">CAHAYA KUPHI</span><h1 className="section-title mt-3">{lang==='id'?'Menu kami':'Our menu'}</h1><p className="mt-3 max-w-xl leading-7 muted">{lang==='id'?'Pilihan kopi, minuman segar, dan hidangan favorit yang disiapkan untuk Anda.':'Coffee, refreshing drinks, and favourite dishes prepared for you.'}</p><PublicMenu /></main>}
