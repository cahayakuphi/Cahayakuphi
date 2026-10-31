import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { coffee: { 50:'#f8f3ed',100:'#eee1d2',200:'#dfc4a6',300:'#c69d72',400:'#a9764a',500:'#865633',600:'#6d4228',700:'#54321f',800:'#3b2419',900:'#26170f' } } } }, plugins: [] };
export default config;