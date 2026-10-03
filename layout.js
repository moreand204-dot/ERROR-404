import {$,esc,safeUrl,brandHTML,store,onStore,getPrefs,setPrefs,onUser,login,logout,isAdmin,getProfile,avatar} from "./core.js";
import {ic,hydrate} from "./icons.js";
import {initNotifications} from "./notify.js";

export function mountHeader({search=false,page=''}={}){
 const el=document.getElementById('siteHeader');el.className='site-header';
 const nav=[['index.html','الرئيسية','','home'],['index.html#appsSection','المتجر','all',''],['index.html?f=popular#appsSection','الأكثر تحميلاً','popular',''],['index.html?f=rating#appsSection','الأعلى تقييماً','rating',''],['index.html?f=fav#appsSection','المفضلة','fav',''],['settings.html','الإعدادات','','settings']];
 el.innerHTML=`<div class="header-inner"><a class="brand" href="index.html"><img src="assets/icon-96.png" alt="" width="38" height="38"><span id="brandSpan"></span></a>
 <nav class="nav">${nav.map(n=>`<a href="${n[0]}" ${n[2]?`data-f="${n[2]}"`:''} class="${(page==='index'&&n[3]==='home')||(page===n[3]&&n[3]!=='home')?'active':''}">${n[1]}</a>`).join('')}</nav>
 <div class="header-tools">
 ${search?`<div class="search-mini"><input id="mainSearch" placeholder="ابحث عن تطبيق أو ملف..." aria-label="البحث"><button id="miniSearchBtn" aria-label="بحث">${ic('search')}</button></div>`:''}
 <button class="icon-btn" id="theme" aria-label="تغيير المظهر"></button>
 <div class="pop-wrap"><button class="icon-btn" id="bellBtn" aria-label="الإشعارات">${ic('bell')}<i class="badge-dot" id="bellBadge" hidden></i></button><div class="pop notif-pop" id="notifPop" hidden></div></div>
 <div class="pop-wrap"><button class="icon-btn avatar-btn" id="userBtn" aria-label="الحساب">${ic('user')}</button><div class="pop user-pop" id="userPop" hidden></div></div>
 <button class="icon-btn menu-btn" id="menu" aria-label="القائمة">${ic('menu')}</button></div></div>`;
 const ann=document.createElement('a');ann.id='announce';ann.className='announce';ann.hidden=true;el.after(ann);
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="authModal" aria-hidden="true"><div class="modal-backdrop" data-close-auth></div><section class="auth-card" role="dialog" aria-modal="true"><button class="modal-close" data-close-auth aria-label="إغلاق">${ic('x')}</button><div class="auth-icon">${ic('user')}</div><h2>تسجيل الدخول</h2><p class="auth-sub">سجّل الدخول بحساب Google لإنشاء بروفايلك وإضافة تقييماتك.</p><button class="google-btn" id="googleLogin"><span class="google-mark">G</span>تسجيل الدخول باستخدام Google</button><div class="auth-status" id="authStatus"></div></section></div>`);

 const themeIcon=()=>$('#theme').innerHTML=ic(document.documentElement.classList.contains('light')?'moon':'sun');
 $('#theme').onclick=()=>{setPrefs({theme:document.documentElement.classList.contains('light')?'dark':'light'});themeIcon()};themeIcon();
 $('#menu').onclick=()=>document.body.classList.toggle('menu-open');

 const modal=$('#authModal');
 const openAuth=()=>{modal.classList.add('show');modal.setAttribute('aria-hidden','false')},closeAuth=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true')};
 document.querySelectorAll('[data-close-auth]').forEach(x=>x.onclick=closeAuth);
 $('#googleLogin').onclick=async()=>{$('#authStatus').textContent='جاري تسجيل الدخول...';try{await login();$('#authStatus').textContent=''}catch(e){$('#authStatus').textContent=e.code==='auth/popup-closed-by-user'?'تم إغلاق نافذة تسجيل الدخول.':'فشل تسجيل الدخول: '+e.message}};
 window.openAuth=openAuth;

 const pops=[['#bellBtn','#notifPop'],['#userBtn','#userPop']];
 pops.forEach(([b,p])=>$(b).addEventListener('click',e=>{e.stopPropagation();if(b==='#userBtn'&&!window.__user){openAuth();return}
  pops.forEach(([,q])=>{if(q!==p)$(q).hidden=true});$(p).hidden=!$(p).hidden}));
 document.addEventListener('click',e=>{if(!e.target.closest('.pop'))pops.forEach(([,q])=>$(q).hidden=true)});

 async function renderUser(u){window.__user=u;const btn=$('#userBtn'),pop=$('#userPop');
  if(!u){btn.innerHTML=ic('user');pop.innerHTML='';return}
  const p=await getProfile(u.uid,{name:u.displayName,photoURL:u.photoURL});
  btn.innerHTML=avatar(p);
  pop.innerHTML=`<div class="pop-head">${avatar(p,'lg')}<div><b>${esc(p.name)}</b><small>${esc(u.email||'')}</small></div></div><a href="profile.html">${ic('user')}ملفي الشخصي</a><a href="settings.html">${ic('gear')}الإعدادات</a>${isAdmin(u)?`<a href="admin.html">${ic('shield')}لوحة الأدمن</a>`:''}<button id="logoutBtn">${ic('logout')}تسجيل الخروج</button>`;
  $('#logoutBtn').onclick=()=>logout()}
 onUser(u=>{renderUser(u);if(u)closeAuth()});
 document.addEventListener('profilechange',()=>renderUser(window.__user));

 onStore(s=>{
  $('#brandSpan').innerHTML=`${brandHTML(s.storeName)}<small>${esc(s.storeSub)}</small>`;
  const a=$('#announce');a.hidden=!(s.announceOn&&s.announceText);a.innerHTML=`${ic('megaphone')}<span>${esc(s.announceText)}</span>`;
  const u=safeUrl(s.announceLink);if(u){a.href=u;a.target='_blank';a.rel='noopener'}else a.removeAttribute('href')});
 initNotifications();
}

export function mountFooter(){
 const f=document.getElementById('siteFooter');f.className='footer';
 f.innerHTML=`<div class="foot-brand"><b>${ic('skull')}<span id="fName"></span></b><small>All rights reserved © 2026</small></div><div class="social-links" id="socials"></div><div><span id="fText"></span> ${ic('heart','heart')}</div>`;
 onStore(s=>{$('#fName').textContent=`${s.storeName} ${s.storeSub}`;$('#fText').textContent=s.footerText;
  $('#socials').innerHTML=[['telegram','تلجرام',s.telegram],['whatsapp','واتساب',s.whatsapp],['youtube','يوتيوب',s.youtube],['send','تواصل',s.contact]].filter(x=>safeUrl(x[2])).map(x=>`<a href="${esc(safeUrl(x[2]))}" target="_blank" rel="noopener" aria-label="${x[1]}" title="${x[1]}">${ic(x[0])}</a>`).join('')});
}
