import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {getFirestore,collection,onSnapshot,query,orderBy,limit,doc,setDoc,increment,serverTimestamp,getDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",authDomain:"ourstory-f33db.firebaseapp.com",projectId:"ourstory-f33db",storageBucket:"ourstory-f33db.firebasestorage.app",messagingSenderId:"685629313835",appId:"1:685629313835:web:fb06292932019eabc56b6e",measurementId:"G-9TBR9QFHQR"};
const ADMIN_EMAIL="moreand458@gmail.com";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const icons={
 sun:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
 moon:`<svg viewBox="0 0 24 24"><path d="M20.8 14.1A8.5 8.5 0 0 1 9.9 3.2 8.6 8.6 0 1 0 20.8 14.1Z"/></svg>`,
 user:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
 menu:`<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
 search:`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
 shield:`<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-5"/></svg>`
};
const social={
 telegram:{url:"https://t.me/br_kan242",label:"تلجرام",icon:`<svg viewBox="0 0 24 24"><path d="m21 3-3.2 18-6.7-5-3.5 3.3.6-5.3L3 11.8 21 3Z"/><path d="m8.2 13.1 9.1-6.2-7 7.2"/></svg>`},
 whatsapp:{url:"https://whatsapp.com/channel/0029VbBbvWcJ3jv1T55BmR0f",label:"واتساب",icon:`<svg viewBox="0 0 24 24"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z"/><path d="M8.4 8.2c.3-.6.6-.6 1-.6h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.7.8c.7 1.2 1.6 2 2.8 2.6l.7-.7c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.3.3.6-.2 1-1 1.6-1.9 1.6-2.1 0-5.9-3.1-6.8-5.9-.4-1.1-.2-1.6.5-1.9Z"/></svg>`},
 youtube:{url:"https://youtube.com/@escanor_soft-1?si=NQXfvUay8ZvzBBzB",label:"يوتيوب",icon:`<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10 9 5 3-5 3V9Z"/></svg>`},
 contact:{url:"https://t.me/E_S_C_A_10",label:"تواصل تلجرام",icon:`<svg viewBox="0 0 24 24"><path d="M21 3 3 10l7 3 3 7 8-17Z"/><path d="m10 13 5-5"/></svg>`}
};
const appIcons={
 wa:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#20c96b"/><circle cx="50" cy="49" r="29" fill="#fff"/><path d="M34 78l5-14c-5-5-8-11-8-18 0-15 12-27 27-27s27 12 27 27-12 27-27 27c-5 0-10-1-14-4z" fill="#20c96b"/><path d="M41 39c2 9 8 16 17 19l5-5c1-1 2-1 4 0l5 2c2 1 2 3 1 5-2 5-7 7-12 6-15-3-24-12-27-27-1-5 1-10 6-12 2-1 4 0 5 2l2 5c1 2 1 3-1 5z" fill="#fff"/></svg>`,
 tg:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#2aabee"/><path d="M77 24L65 77c-1 4-4 5-7 3L44 68l-7 7c-1 1-2 2-4 2l1-15 27-25c1-1-1-2-3-1L25 55 11 51c-3-1-3-4 1-6l61-24c3-1 5 1 4 3z" fill="#fff"/></svg>`,
 tt:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#080808"/><path d="M57 18v42a13 13 0 1 1-11-13v10a5 5 0 1 0 3 5V18h8c1 8 6 13 14 15v9c-6-1-11-4-14-8z" fill="#fff"/></svg>`,
 mc:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#69a83a"/><path d="M15 25h70v50H15z" fill="#8a5b32"/><path d="M15 25h70v19H15z" fill="#62a13a"/><path d="M20 45h60v30H20z" fill="#7a4e2a"/><path d="M30 52h15v12H30zm25 8h15v12H55z" fill="#4d7d2f"/></svg>`,
 za:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#59bd1f"/><path d="M27 25h46v10L42 65h31v10H27V65l31-30H27z" fill="#fff"/></svg>`,
 cc:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#f5f5f5"/><path d="M28 25h44v50H28z" fill="#111"/><path d="M38 35h25v8H38zm0 13h25v8H38zm0 13h18v8H38z" fill="#fff"/> </svg>`
};
const categoryIcons={"ألعاب":"🎮","تطبيقات":"▦","أدوات":"🔧","تواصل اجتماعي":"◉","ترفيه":"▶","تعديل الصور":"▣","تعليم":"▤","أخرى":"•••"};
function iconFor(a){const n=(a.name||"").toLowerCase();if(n.includes("whatsapp"))return appIcons.wa;if(n.includes("telegram"))return appIcons.tg;if(n.includes("tiktok"))return appIcons.tt;if(n.includes("minecraft"))return appIcons.mc;if(n.includes("zarchiver"))return appIcons.za;if(n.includes("capcut"))return appIcons.cc;return `<div class="code-app-icon">${categoryIcons[a.category]||"◈"}</div>`;}
function appCard(s){const a=s.data();return `<article class="app-card" data-category="${esc(a.category||'أخرى')}"><div class="app-icon">${iconFor(a)}</div><h3 title="${esc(a.name)}">${esc(a.name||"تطبيق")}</h3><div class="rating">★ ${esc(a.rating||"4.8")}</div><p>${esc(a.category||"تطبيقات")} · ${esc(a.size||"")}</p><button data-app-download="${s.id}">تحميل ↧</button></article>`;}

const box=$("#apps"),empty=`<div class="empty-state">◈ لا توجد تطبيقات منشورة حتى الآن</div>`;
let allApps=[];
function renderApps(){const q=(document.querySelector('#mainSearch')?.value||document.querySelector('#heroSearch')?.value||'').trim().toLowerCase();const active=document.querySelector('.chip.active')?.dataset.filter||'all';const filtered=allApps.filter(s=>{const a=s.data();const text=`${a.name||''} ${a.category||''} ${a.description||''}`.toLowerCase();return (!q||text.includes(q))&&(active==='all'||a.category===active||(active==='latest'&&true)||(active==='popular'&&Number(a.downloads||0)>0));});box.innerHTML=filtered.length?filtered.map(appCard).join(''):empty;document.querySelectorAll('[data-app-download]').forEach(b=>b.onclick=()=>location.href=`app.html?id=${encodeURIComponent(b.dataset.appDownload)}`);document.querySelector('#liveCount').textContent=allApps.length;document.querySelector('#liveCount2').textContent=allApps.length;}

const themeBtn=$("#theme");const setThemeIcon=()=>themeBtn.innerHTML=document.documentElement.classList.contains("light")?icons.moon:icons.sun;themeBtn.onclick=()=>{document.documentElement.classList.toggle("light");localStorage.theme=document.documentElement.classList.contains("light")?"light":"dark";setThemeIcon()};if(localStorage.theme==="light")document.documentElement.classList.add("light");setThemeIcon();
$("#menu").innerHTML=icons.menu;$("#menu").onclick=()=>document.body.classList.toggle("menu-open");
$("#miniSearchBtn").innerHTML=icons.search;$("#heroSearchBtn").innerHTML=icons.search;
function doSearch(){document.querySelector('.section-head')?.scrollIntoView({behavior:'smooth',block:'start'});renderApps()}["#mainSearch","#heroSearch"].forEach(sel=>{const el=$(sel);el?.addEventListener('input',renderApps);el?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()})});

document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderApps()});
document.querySelectorAll('[data-nav-filter]').forEach(b=>b.onclick=()=>{const f=b.dataset.navFilter;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.filter===f));renderApps()});
document.querySelectorAll('.category-link').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));const f=b.dataset.category;const c=document.querySelector(`.chip[data-filter="${CSS.escape(f)}"]`);if(c)c.classList.add('active');renderApps();document.querySelector('#apps')?.scrollIntoView({behavior:'smooth'})});

const modal=$("#authModal"),authStatus=$("#authStatus"),loginBtn=$("#loginBtn");$("#authIcon").innerHTML=icons.user;loginBtn.innerHTML=icons.user;function openAuth(){modal.classList.add('show');modal.setAttribute('aria-hidden','false')}function closeAuth(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}document.querySelectorAll('[data-close-auth]').forEach(x=>x.onclick=closeAuth);loginBtn.onclick=openAuth;

const firebaseReady=true;
onAuthStateChanged(auth,async user=>{if(user){try{await setDoc(doc(db,'users',user.uid),{email:user.email,name:user.displayName||'',photoURL:user.photoURL||'',lastLogin:serverTimestamp()},{merge:true})}catch{}authStatus.innerHTML=`تم تسجيل الدخول: <b>${esc(user.email)}</b>${user.email===ADMIN_EMAIL?`<br><span class="admin-badge">${icons.shield} حساب الأدمن</span><br><a href="admin.html" class="logout-btn" style="display:inline-block;text-decoration:none">لوحة الأدمن</a>`:''}<br><button id="logoutBtn" class="logout-btn">تسجيل الخروج</button>`;$("#logoutBtn")?.addEventListener('click',()=>signOut(auth))}else authStatus.textContent=''});
$("#googleLogin").onclick=async()=>{authStatus.textContent='جاري تسجيل الدخول...';try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){authStatus.textContent=e.code==='auth/popup-closed-by-user'?'تم إغلاق نافذة تسجيل الدخول.':'فشل تسجيل الدخول: '+e.message}};

// Real-time store: every publish/delete/update appears without refreshing the page.
try{onSnapshot(query(collection(db,'apps'),orderBy('createdAt','desc'),limit(100)),snap=>{allApps=snap.docs;renderApps()},e=>{console.error(e);box.innerHTML=empty})}catch(e){console.error(e)}
(async()=>{try{await setDoc(doc(db,'stats','global'),{visitors:increment(1),updatedAt:serverTimestamp()},{merge:true})}catch(e){console.warn('stats',e)}})();

onSnapshot(doc(db,'stats','global'),snap=>{const s=snap.exists()?snap.data():{};document.querySelector('#liveVisitors').textContent=Number(s.visitors||0).toLocaleString('en-US')});
