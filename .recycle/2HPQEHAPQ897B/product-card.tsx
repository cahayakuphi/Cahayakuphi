'use client';
import {useState} from 'react';
import {Plus,Check,Coffee,Utensils,GlassWater,Citrus,CupSoda,ShoppingBasket} from 'lucide-react';
import type {Product} from '@/lib/catalog';
import {formatIDR} from '@/lib/catalog';
import {useCart} from './cart-provider';
import {useLanguage} from './use-language';
export function ProductCard({product}:{product:Product}) {
 const {add}=useCart(); const {lang}=useLanguage(); const [choices,setChoices]=useState<Record<string,string>>({}); const [added,setAdded]=useState(false);
 const options=product.options||[]; const extras=product.extras||[];
 const selected=[...options.flatMap(g=>{const choiceId=choices[g.id]||g.choices[0]?.id;const choice=g.choices.find(c=>c.id===choiceId);return choice?[{kind:'variant' as const,group:g.id,choice:choice.id,extra:choice.extra}]:[];}),...extras.flatMap(g=>(choices[g.id]||'').split(',').filter(Boolean).flatMap(id=>{const choice=g.choices.find(c=>c.id===id);return choice?[{kind:'extra' as const,group:g.id,choice:choice.id,extra:choice.extra}]:[];}))];
 const category=(product.category.name||'').toLocaleLowerCase('id');
 const Icon=category.includes('kopi')?Coffee:category.includes('makan')?Utensils:category.includes('jus')?GlassWater:category.includes('teh')?Citrus:category.includes('squash')?CupSoda:ShoppingBasket;
 return <article className="card flex flex-col overflow-hidden">
  <div className="relative mb-0 flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#f5e8d9] to-[#e6cfb5]">
   {product.imageUrl?<img src={product.imageUrl} alt={product.name[lang]} loading="lazy" className="h-full w-full object-cover"/>:<Icon aria-hidden="true" className="h-14 w-14 text-[#795239]" strokeWidth={1.35}/>}
  </div>
  <div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{product.name[lang]}</h3>{product.tag&&<span className="pill">{lang==='id'?'Favorit':'Popular'}</span>}</div>
   <p className="mt-2 min-h-[48px] text-sm leading-6 muted">{product.description[lang]}</p>
   {options.map(g=><label key={g.id} className="mt-3 block text-xs font-bold">{g.label[lang]}{g.required&&' *'}<select required={g.required!==false} className="input mt-1 py-2 text-sm font-normal" value={choices[g.id]||g.choices[0]?.id||''} onChange={e=>setChoices(v=>({...v,[g.id]:e.target.value}))}>{g.choices.map(c=><option key={c.id} value={c.id}>{c.label[lang]}{c.extra?` (+${formatIDR(c.extra)})`:''}</option>)}</select></label>)}
   {extras.map(g=><fieldset key={g.id} className="mt-3"><legend className="text-xs font-bold">{g.label[lang]}{g.required&&' *'}</legend><div className="mt-2 grid gap-2">{g.choices.map(c=><label key={c.id} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={(choices[g.id]||'').split(',').includes(c.id)} onChange={e=>setChoices(v=>{const ids=(v[g.id]||'').split(',').filter(Boolean);const next=e.target.checked?[...ids,c.id]:ids.filter(id=>id!==c.id);return {...v,[g.id]:next.join(',')}})}/><span>{c.label[lang]}{c.extra?` (+${formatIDR(c.extra)})`:''}</span></label>)}</div></fieldset>)}
   <div className="mt-auto flex items-center justify-between gap-2 pt-5"><strong>{formatIDR(product.price+selected.reduce((a,c)=>a+c.extra,0))}</strong><button disabled={product.available===false} className="btn btn-primary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>{add(product,selected);setAdded(true);setTimeout(()=>setAdded(false),1000)}}>{product.available===false?null:added?<Check size={17}/>:<Plus size={17}/>}<span className="text-sm">{product.available===false?(lang==='id'?'Habis':'Sold out'):added?(lang==='id'?'Ditambahkan':'Added'):(lang==='id'?'Tambah':'Add')}</span></button></div>
  </div></article>;
}
