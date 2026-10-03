import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {getFirestore,collection,onSnapshot,query,orderBy,limit,doc,setDoc,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";

const firebaseConfig={apiKey:"AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",authDomain:"ourstory-f33db.firebaseapp.com",projectId:"ourstory-f33db",storageBucket:"ourstory-f33db.firebasestorage.app",messagingSenderId:"685629313835",appId:"1:685629313835:web:fb06292932019eabc56b6e",measurementId:"G-9TBR9QFHQR"};
const ADMIN_EMAIL="moreand458@gmail.com";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const social=[
 {k:"telegram",url:"https://t.me/br_kan242",label:"تلجرام"},
 {k:"whatsapp",url:"https://whatsapp.com/channel/0029VbBbvWcJ3jv1T55BmR0f",label:"واتساب"},
 {k:"youtube",url:"https://youtube.com/@escanor_soft-1?si=NQXfvUay8ZvzBBzB",label:"يوتيوب"},
 {k:"send",url:"https://t.me/E_S_C_A_10",label:"تواصل تلجرام"}
];
hydrate();
$("#socials").innerHTML=social.map(s=>`<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">${ic(s.k)}</a>`).join("");

function appCard(s){const a=s.data(),ext=extOf(a).toUpperCase();
 return `<article class="app-card" data-category="${esc(a.category||'أخرى')}"><div class="app-icon">${tile(a)}</div><h3 title="${esc(a.name)}">${esc(a.name||"عنصر")}</h3><div class="ext-tag">${kindLabel(a)}${ext?` · ${esc(ext)}`:''}</div><p>${esc(a.category||"تطبيقات")}${a.size?` · ${esc(a.size)}`:''}</p><button data-app-download="${s.id}">${ic('download')}تحميل</button></article>`}

const box=$("#apps"),empty=`<div class="empty-state">${ic('folder')}<span>لا يوجد محتوى منشور حتى الآن</span></div>`;
let allApps=[];
function renderApps(){
 const q=($('#mainSearch')?.value||$('#heroSearch')?.value||'').trim().toLowerCase();
 const active=$('.chip.active')?.dataset.filter||'all';
 let list=allApps.filter(s=>{const a=s.data();const text=`${a.name||''} ${a.category||''} ${a.description||''} ${a.fileName||''}`.toLowerCase();return (!q||text.includes(q))&&(active==='all'||active==='latest'||a.category===active||(active==='popular'&&Number(a.downloads||0)>0))});
 if(active==='popular')list=[...list].sort((x,y)=>Number(y.data().downloads||0)-Number(x.data().downloads||0));
 box.innerHTML=list.length?list.map(appCard).join(''):empty;
 document.querySelectorAll('[data-app-download]').forEach(b=>b.onclick=()=>location.href=`app.html?id=${encodeURIComponent(b.dataset.appDownload)}`);
 $('#liveCount').textContent=allApps.length;$('#liveCount2').textContent=allApps.length;
}

const themeBtn=$("#theme");const setThemeIcon=()=>themeBtn.innerHTML=ic(document.documentElement.classList.contains("light")?"moon":"sun");
themeBtn.onclick=()=>{document.documentElement.classList.toggle("light");localStorage.theme=document.documentElement.classList.contains("light")?"light":"dark";setThemeIcon()};
if(localStorage.theme==="light")document.documentElement.classList.add("light");setThemeIcon();
$("#menu").innerHTML=ic("menu");$("#menu").onclick=()=>document.body.classList.toggle("menu-open");
$("#miniSearchBtn").innerHTML=ic("search");$("#heroSearchBtn").innerHTML=ic("search");
function doSearch(){$('.section-head')?.scrollIntoView({behavior:'smooth',block:'start'});renderApps()}
["#mainSearch","#heroSearch"].forEach(sel=>{const el=$(sel);el?.addEventListener('input',renderApps);el?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()})});

const setChip=f=>{document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.filter===f))};
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{setChip(b.dataset.filter);renderApps()});
document.querySelectorAll('[data-nav-filter]').forEach(b=>b.onclick=()=>{setChip(b.dataset.navFilter);renderApps()});
document.querySelectorAll('.category-link').forEach(b=>b.onclick=()=>{setChip(b.dataset.category);renderApps();$('#apps')?.scrollIntoView({behavior:'smooth'})});
$('#showAll').onclick=()=>{setChip('all');renderApps()};
$('#exploreBtn').onclick=()=>$('#appsSection').scrollIntoView({behavior:'smooth'});

const modal=$("#authModal"),authStatus=$("#authStatus"),loginBtn=$("#loginBtn");
$("#authIcon").innerHTML=ic("user");loginBtn.innerHTML=ic("user");
function openAuth(){modal.classList.add('show');modal.setAttribute('aria-hidden','false')}
function closeAuth(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
document.querySelectorAll('[data-close-auth]').forEach(x=>x.onclick=closeAuth);loginBtn.onclick=openAuth;

onAuthStateChanged(auth,async user=>{
 if(user){try{await setDoc(doc(db,'users',user.uid),{email:user.email,name:user.displayName||'',photoURL:user.photoURL||'',lastLogin:serverTimestamp()},{merge:true})}catch{}
  authStatus.innerHTML=`تم تسجيل الدخول: <b>${esc(user.email)}</b>${user.email===ADMIN_EMAIL?`<br><span class="admin-badge">${ic('shield')}حساب الأدمن</span><br><a href="admin.html" class="logout-btn" style="display:inline-block;text-decoration:none">لوحة الأدمن</a>`:''}<br><button id="logoutBtn" class="logout-btn">تسجيل الخروج</button>`;
  $("#logoutBtn")?.addEventListener('click',()=>signOut(auth))}
 else authStatus.textContent=''});
$("#googleLogin").onclick=async()=>{authStatus.textContent='جاري تسجيل الدخول...';try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){authStatus.textContent=e.code==='auth/popup-closed-by-user'?'تم إغلاق نافذة تسجيل الدخول.':'فشل تسجيل الدخول: '+e.message}};

try{onSnapshot(query(collection(db,'apps'),orderBy('createdAt','desc'),limit(100)),snap=>{allApps=snap.docs;renderApps()},e=>{console.error(e);box.innerHTML=empty})}catch(e){console.error(e)}
(async()=>{try{await setDoc(doc(db,'stats','global'),{visitors:increment(1),updatedAt:serverTimestamp()},{merge:true})}catch(e){console.warn('stats',e)}})();
onSnapshot(doc(db,'stats','global'),snap=>{const s=snap.exists()?snap.data():{};$('#liveVisitors').textContent=Number(s.visitors||0).toLocaleString('en-US')});
