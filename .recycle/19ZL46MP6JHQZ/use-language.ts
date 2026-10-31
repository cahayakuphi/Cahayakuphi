'use client';
import {useEffect,useState} from 'react';
export function useLanguage(){const [lang,setLang]=useState<'id'|'en'>('id');useEffect(()=>{const saved=localStorage.getItem('ck-lang');if(saved==='en'||saved==='id')setLang(saved)},[]);const toggle=()=>setLang(old=>{const next=old==='id'?'en':'id';localStorage.setItem('ck-lang',next);return next});return {lang,toggle};}