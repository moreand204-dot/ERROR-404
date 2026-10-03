import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

/*
  ضع بيانات مشروع Firebase هنا من:
  Firebase Console → Project settings → Your apps → Web app
*/
const firebaseConfig = {
  apiKey: "AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",
  authDomain: "ourstory-f33db.firebaseapp.com",
  projectId: "ourstory-f33db",
  storageBucket: "ourstory-f33db.firebasestorage.app",
  messagingSenderId: "685629313835",
  appId: "1:685629313835:web:fb06292932019eabc56b6e",
  measurementId: "G-9TBR9QFHQR"
};

const ADMIN_EMAIL = "moreand458@gmail.com";

const icons = {
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 14.1A8.5 8.5 0 0 1 9.9 3.2 8.6 8.6 0 1 0 20.8 14.1Z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-5"/></svg>`
};

const apps=[
  ["WhatsApp Plus","4.8","75 MB","wa"],
  ["Telegram Plus","4.7","68 MB","tg"],
  ["TikTok Mod","4.6","120 MB","tt"],
  ["Minecraft","4.5","210 MB","mc"],
  ["ZArchiver","4.7","12 MB","za"],
  ["CapCut Pro","4.6","150 MB","cc"]
];

const appSvgs = {
  wa:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#20c96b"/><circle cx="50" cy="49" r="29" fill="#fff"/><path d="M34 78l5-14c-5-5-8-11-8-18 0-15 12-27 27-27s27 12 27 27-12 27-27 27c-5 0-10-1-14-4z" fill="#20c96b"/><path d="M41 39c2 9 8 16 17 19l5-5c1-1 2-1 4 0l5 2c2 1 2 3 1 5-2 5-7 7-12 6-15-3-24-12-27-27-1-5 1-10 6-12 2-1 4 0 5 2l2 5c1 2 1 3-1 5z" fill="#fff"/></svg>`,
  tg:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#2aabee"/><path d="M77 24L65 77c-1 4-4 5-7 3L44 68l-7 7c-1 1-2 2-4 2l1-15 27-25c1-1-1-2-3-1L25 55 11 51c-3-1-3-4 1-6l61-24c3-1 5 1 4 3z" fill="#fff"/></svg>`,
  tt:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#080808"/><path d="M57 18v42a13 13 0 1 1-11-13v10a5 5 0 1 0 3 5V18h8c1 8 6 13 14 15v9c-6-1-11-4-14-8z" fill="#fff"/></svg>`,
  mc:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#69a83a"/><path d="M15 25h70v50H15z" fill="#8a5b32"/><path d="M15 25h70v19H15z" fill="#62a13a"/><path d="M20 45h60v30H20z" fill="#7a4e2a"/><path d="M30 52h15v12H30zm25 8h15v12H55z" fill="#4d7d2f"/></svg>`,
  za:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#59bd1f"/><path d="M27 25h46v10L42 65h31v10H27V65l31-30H27z" fill="#fff"/></svg>`,
  cc:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#f5f5f5"/><path d="M28 25h44v50H28z" fill="#111"/><path d="M38 35h25v8H38zm0 13h25v8H38zm0 13h18v8H38z" fill="#fff"/></svg>`
};

const box=document.querySelector("#apps");
box.innerHTML=apps.map(a=>`<article class="app-card">
<div class="app-icon">${appSvgs[a[3]]}</div>
<h3>${a[0]}</h3><div class="rating">★ ${a[1]}</div><p>تطبيقات · ${a[2]}</p>
<button>تحميل</button></article>`).join("");

const themeBtn=document.querySelector("#theme");
const setThemeIcon=()=>themeBtn.innerHTML=document.documentElement.classList.contains("light")?icons.moon:icons.sun;
themeBtn.onclick=()=>{document.documentElement.classList.toggle("light");localStorage.theme=document.documentElement.classList.contains("light")?"light":"dark";setThemeIcon()};
if(localStorage.theme==="light")document.documentElement.classList.add("light");
setThemeIcon();

document.querySelector("#menu").innerHTML=icons.menu;
document.querySelector("#menu").onclick=()=>document.body.classList.toggle("menu-open");

const modal=document.querySelector("#authModal");
const authStatus=document.querySelector("#authStatus");
const loginBtn=document.querySelector("#loginBtn");
const authIcon=document.querySelector("#authIcon");
const googleLogin=document.querySelector("#googleLogin");
authIcon.innerHTML=icons.user;
loginBtn.innerHTML=icons.user;

function openAuth(){ modal.classList.add("show"); modal.setAttribute("aria-hidden","false"); }
function closeAuth(){ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); }
document.querySelectorAll("[data-close-auth]").forEach(x=>x.onclick=closeAuth);
loginBtn.onclick=openAuth;

let auth=null;
let firebaseReady=false;
try {
  if (!firebaseConfig.apiKey.includes("PUT_")) {
    const app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    const db=getFirestore(app);
    firebaseReady=true;
    try {
      await setDoc(doc(db,"stats","global"),{visitors:increment(1),updatedAt:serverTimestamp()},{merge:true});
      const snap=await getDocs(query(collection(db,"apps"),orderBy("createdAt","desc"),limit(12)));
      if(!snap.empty){
        box.innerHTML=[...snap.docs].map(s=>{const a=s.data();return `<article class="app-card"><div class="app-icon" style="background:#087dff18;border:1px solid #0c3157;color:#00b7ff;font-size:22px;font-weight:800">${String(a.name||"A")[0]}</div><h3>${a.name||"تطبيق"}</h3><div class="rating">★ ${a.rating||"4.8"}</div><p>${a.category||"تطبيقات"} · ${a.size||""}</p><button data-app-download="${s.id}">تحميل</button></article>`}).join("");
        document.querySelectorAll("[data-app-download]").forEach(b=>b.onclick=async()=>{const id=b.dataset.appDownload;window.location.href=`app.html?id=${encodeURIComponent(id)}`;});
      }
    } catch(e) { console.warn("Firestore home load:",e); }
    onAuthStateChanged(auth,async user=>{
      if(user){
        try { await setDoc(doc(db,"users",user.uid),{email:user.email,name:user.displayName||"",photoURL:user.photoURL||"",lastLogin:serverTimestamp()},{merge:true}); } catch(e) {}
        loginBtn.innerHTML=icons.user;
        loginBtn.title=user.email===ADMIN_EMAIL?"حساب الأدمن":"الحساب";
        authStatus.innerHTML=`تم تسجيل الدخول: <b>${user.email}</b>${user.email===ADMIN_EMAIL?`<br><span class="admin-badge">${icons.shield} حساب الأدمن</span><br><a href="admin.html" class="logout-btn" style="display:inline-block;text-decoration:none">لوحة الأدمن</a>`:""}<br><button id="logoutBtn" class="logout-btn">تسجيل الخروج</button>`;
        const logout=document.querySelector("#logoutBtn");
        if(logout) logout.onclick=()=>signOut(auth);
      } else {
        authStatus.textContent="";
      }
    });
  } else {
    authStatus.innerHTML="أضف إعدادات Firebase في <b>script.js</b> أولاً.";
  }
} catch(e) {
  authStatus.textContent="تعذر تهيئة Firebase. راجع إعدادات المشروع.";
  console.error(e);
}

googleLogin.onclick=async()=>{
  if(!firebaseReady){authStatus.textContent="Firebase غير مُعد بعد. ضع بيانات Web App في script.js.";return;}
  authStatus.textContent="جاري تسجيل الدخول...";
  try{
    const provider=new GoogleAuthProvider();
    await signInWithPopup(auth,provider);
  }catch(e){
    authStatus.textContent=e.code==="auth/popup-closed-by-user"?"تم إغلاق نافذة تسجيل الدخول.":"فشل تسجيل الدخول: "+e.message;
  }
};
