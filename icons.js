// كل الأيقونات مرسومة بالكود (SVG) — بدون إيموجي ولا رموز نصية
const P={
home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
download:'<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
upload:'<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
arrowL:'<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
arrowR:'<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.2 1.8 2.5C10.5 8.5 11 5.5 12 3Z"/>',
bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
gamepad:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/>',
grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>',
sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
play:'<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
book:'<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z"/><path d="M6 18h13v3H6a2 2 0 0 1-2-2"/>',
dots:'<circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/>',
folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
file:'<path d="M6 3h8l5 5v13H6V3Z"/><path d="M14 3v5h5"/>',
doc:'<path d="M6 3h8l5 5v13H6V3Z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
archive:'<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
music:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
video:'<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
box:'<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
code:'<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
skull:'<path d="M12 3a8 8 0 0 0-8 8c0 2.5 1 4.2 3 5.5V20h10v-3.5c2-1.3 3-3 3-5.5a8 8 0 0 0-8-8Z"/><circle cx="9" cy="11.5" r="1.6"/><circle cx="15" cy="11.5" r="1.6"/><path d="M10 20v-2M14 20v-2"/>',
trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
pencil:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',
external:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
live:'<circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="8"/>',
heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M20.8 14.1A8.5 8.5 0 0 1 9.9 3.2 8.6 8.6 0 1 0 20.8 14.1Z"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-5"/>',
telegram:'<path d="m21 3-3.2 18-6.7-5-3.5 3.3.6-5.3L3 11.8 21 3Z"/><path d="m8.2 13.1 9.1-6.2-7 7.2"/>',
whatsapp:'<path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z"/><path d="M8.4 8.2c.3-.6.6-.6 1-.6h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.7.8c.7 1.2 1.6 2 2.8 2.6l.7-.7c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.3.3.6-.2 1-1 1.6-1.9 1.6-2.1 0-5.9-3.1-6.8-5.9-.4-1.1-.2-1.6.5-1.9Z"/>',
youtube:'<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
send:'<path d="M21 3 3 10l7 3 3 7 8-17Z"/><path d="m10 13 5-5"/>'
};
export const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||P.file}</svg>`;
export const hydrate=(root=document)=>root.querySelectorAll('[data-ic]').forEach(el=>{el.innerHTML=ic(el.dataset.ic)});

export const CATEGORY_ICONS={"ألعاب":"gamepad","تطبيقات":"grid","أدوات":"sliders","تواصل اجتماعي":"users","ترفيه":"play","تعديل الصور":"image","تعليم":"book","ملفات":"folder","أخرى":"dots"};
const EXT_ICONS={apk:'box',zip:'archive',rar:'archive','7z':'archive',tar:'archive',gz:'archive',pdf:'doc',doc:'doc',docx:'doc',txt:'doc',xls:'doc',xlsx:'doc',ppt:'doc',pptx:'doc',jpg:'image',jpeg:'image',png:'image',gif:'image',webp:'image',mp3:'music',wav:'music',ogg:'music',m4a:'music',mp4:'video',mkv:'video',avi:'video',mov:'video',webm:'video',js:'code',py:'code',json:'code',html:'code',css:'code',cpp:'code',java:'code',sh:'code'};
export const extOf=a=>String(a.ext||(a.fileName&&a.fileName.includes('.')?a.fileName.split('.').pop():'')||(a.kind?'':'apk')).toLowerCase();
export const kindLabel=a=>a.kind==='file'?'ملف':'برنامج';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const brand={
wa:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#20c96b"/><circle cx="50" cy="49" r="29" fill="#fff"/><path d="M34 78l5-14c-5-5-8-11-8-18 0-15 12-27 27-27s27 12 27 27-12 27-27 27c-5 0-10-1-14-4z" fill="#20c96b"/><path d="M41 39c2 9 8 16 17 19l5-5c1-1 2-1 4 0l5 2c2 1 2 3 1 5-2 5-7 7-12 6-15-3-24-12-27-27-1-5 1-10 6-12 2-1 4 0 5 2l2 5c1 2 1 3-1 5z" fill="#fff"/></svg>',
tg:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#2aabee"/><path d="M77 24L65 77c-1 4-4 5-7 3L44 68l-7 7c-1 1-2 2-4 2l1-15 27-25c1-1-1-2-3-1L25 55 11 51c-3-1-3-4 1-6l61-24c3-1 5 1 4 3z" fill="#fff"/></svg>',
tt:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#080808"/><path d="M57 18v42a13 13 0 1 1-11-13v10a5 5 0 1 0 3 5V18h8c1 8 6 13 14 15v9c-6-1-11-4-14-8z" fill="#fff"/></svg>',
mc:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#69a83a"/><path d="M15 25h70v50H15z" fill="#8a5b32"/><path d="M15 25h70v19H15z" fill="#62a13a"/><path d="M20 45h60v30H20z" fill="#7a4e2a"/><path d="M30 52h15v12H30zm25 8h15v12H55z" fill="#4d7d2f"/></svg>',
za:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#59bd1f"/><path d="M27 25h46v10L42 65h31v10H27V65l31-30H27z" fill="#fff"/></svg>',
cc:'<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#f5f5f5"/><path d="M28 25h44v50H28z" fill="#111"/><path d="M38 35h25v8H38zm0 13h25v8H38zm0 13h18v8H38z" fill="#fff"/></svg>'};
const brandFor=n=>{n=(n||'').toLowerCase();return n.includes('whatsapp')?brand.wa:n.includes('telegram')?brand.tg:n.includes('tiktok')?brand.tt:n.includes('minecraft')?brand.mc:n.includes('zarchiver')?brand.za:n.includes('capcut')?brand.cc:''};

// أيقونة العنصر: صورة مرفوعة > أيقونة ماركة معروفة > أيقونة حسب نوع الملف
export function tile(a){
  if(a.iconURL)return `<img src="${esc(a.iconURL)}" alt="" loading="lazy">`;
  const b=brandFor(a.name);if(b)return b;
  const e=extOf(a);const name=EXT_ICONS[e]||(a.kind==='file'?'file':CATEGORY_ICONS[a.category]||'box');
  return `<div class="code-app-icon">${ic(name)}${e?`<em>${esc(e.slice(0,4))}</em>`:''}</div>`;
}
