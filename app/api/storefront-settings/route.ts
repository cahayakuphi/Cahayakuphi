import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Pengaturan toko belum tersedia.'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from('store_settings').select('store_name,accepting_orders,logo_url,banner_url,banner_title,banner_subtitle,enabled_payment_methods,enabled_order_types,delivery_fee').eq('id',1).maybeSingle();
 if(error||!data)return NextResponse.json({error:'Pengaturan toko belum tersedia.'},{status:503});
 return NextResponse.json(data,{headers:{'Cache-Control':'no-store, max-age=0'}});
}
