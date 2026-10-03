import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

export const firebaseConfig={apiKey:"AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",authDomain:"ourstory-f33db.firebaseapp.com",projectId:"ourstory-f33db",storageBucket:"ourstory-f33db.firebasestorage.app",messagingSenderId:"685629313835",appId:"1:685629313835:web:fb06292932019eabc56b6e",measurementId:"G-9TBR9QFHQR"};
export const ADMIN_EMAIL="moreand458@gmail.com";
export const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);

export const $=(s,r=document)=>r.querySelector(s);
export const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
export const safeUrl=u=>{try{const x=new URL(String(u||''),location.href);return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
export const brandHTML=(name,tag='b')=>{const w=String(name||'').trim().split(/\s+/);const last=w.pop()||'';return `${esc(w.join(' '))}${w.length?' ':''}<${tag}>${esc(last)}</${tag}>`};

/* ===== تفضيلات المستخدم (محلية) ===== */
export const ACCENTS=[
 {id:'blue',label:'أزرق',c:['#087dff','#00b7ff']},{id:'green',label:'أخضر',c:['#12b76a','#2ee59d']},
 {id:'purple',label:'بنفسجي',c:['#7c4dff','#b197ff']},{id:'red',label:'أحمر',c:['#ef4444','#ff8a8a']},
 {id:'gold',label:'ذهبي',c:['#f5a300','#ffd31a']},{id:'pink',label:'وردي',c:['#e5398f','#ff8fc8']}];
const DEF={theme:'dark',accent:'blue',density:'normal',sort:'store',notify:'on'};
export const getPrefs=()=>{let p={};try{p=JSON.parse(localStorage.prefs||'{}')}catch{}if(!p.theme&&localStorage.theme==='light')p.theme='light';return {...DEF,...p}};
export function applyPrefs(){const p=getPrefs(),r=document.documentElement;
 const light=p.theme==='light'||(p.theme==='auto'&&matchMedia('(prefers-color-scheme: light)').matches);
 r.classList.toggle('light',light);const a=(ACCENTS.find(x=>x.id===p.accent)||ACCENTS[0]).c;
 r.style.setProperty('--blue',a[0]);r.style.setProperty('--cyan',a[1]);r.dataset.density=p.density}
export function setPrefs(x){localStorage.prefs=JSON.stringify({...getPrefs(),...x});applyPrefs()}
applyPrefs();matchMedia('(prefers-color-scheme: light)').addEventListener?.('change',applyPrefs);

/* ===== إعدادات المتجر (من الأدمن) ===== */
export const STORE_DEF={storeName:'ERROR 404',storeSub:'NOT FOUND',welcome:'مرحباً بك في متجر',tagline:'مكان واحد — جميع تطبيقاتك وملفاتك المفضلة',announceOn:false,announceText:'',announceLink:'',reviewsOn:true,defaultSort:'latest',footerText:'ليس متجرًا رسميًا لأي من التطبيقات',telegram:'https://t.me/br_kan242',whatsapp:'https://whatsapp.com/channel/0029VbBbvWcJ3jv1T55BmR0f',youtube:'https://youtube.com/@escanor_soft-1?si=NQXfvUay8ZvzBBzB',contact:'https://t.me/E_S_C_A_10'};
export let store={...STORE_DEF};
const storeCbs=[];let storeStarted=false;
export function onStore(cb){storeCbs.push(cb);if(storeStarted){cb(store);return}storeStarted=true;
 const fire=()=>storeCbs.forEach(f=>f(store));
 onSnapshot(doc(db,'settings','store'),s=>{store={...STORE_DEF,...(s.exists()?s.data():{})};fire()},()=>fire())}

/* ===== المستخدم الحالي ===== */
export let currentUser=null;const userCbs=[];let authReady=false;
onAuthStateChanged(auth,async u=>{currentUser=u;
 if(u){try{await setDoc(doc(db,'users',u.uid),{email:u.email,name:u.displayName||'',photoURL:u.photoURL||'',lastLogin:serverTimestamp()},{merge:true})}catch{}}
 authReady=true;userCbs.forEach(f=>f(u))});
export function onUser(cb){userCbs.push(cb);if(authReady)cb(currentUser)}
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const logout=()=>signOut(auth);
export const isAdmin=u=>!!u&&u.email===ADMIN_EMAIL;

/* ===== البروفايل العام ===== */
const pcache=new Map();
export async function getProfile(uid,fb={}){
 if(pcache.has(uid))return pcache.get(uid);let d={};
 try{const s=await getDoc(doc(db,'profiles',uid));if(s.exists())d=s.data()}catch{}
 const p={name:d.name||fb.name||'مستخدم',bio:d.bio||'',photoURL:d.photoURL||fb.photoURL||''};pcache.set(uid,p);return p}
export async function saveProfile(user,{name,bio,photoURL}){
 await setDoc(doc(db,'profiles',user.uid),{name,bio,photoURL,updatedAt:serverTimestamp()});
 try{await setDoc(doc(db,'users',user.uid),{name},{merge:true})}catch{}
 pcache.delete(user.uid);document.dispatchEvent(new Event('profilechange'))}
export const avatar=(p,cls='')=>p.photoURL?`<span class="avatar ${cls}"><img src="${esc(p.photoURL)}" alt="" referrerpolicy="no-referrer"></span>`:`<span class="avatar ${cls}">${esc((p.name||'?').trim().charAt(0).toUpperCase())}</span>`;

/* ===== أدوات ===== */
export function toast(msg,type=''){let h=$('#toasts');if(!h){h=document.createElement('div');h.id='toasts';document.body.append(h)}
 const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;h.append(t);setTimeout(()=>t.classList.add('out'),3200);setTimeout(()=>t.remove(),3700)}
export function resizeImage(file,S=192,q=.85){return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);
 img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=S;const m=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);URL.revokeObjectURL(url);res(c.toDataURL('image/webp',q))};
 img.onerror=()=>rej(new Error('تعذر قراءة الصورة'));img.src=url})}
export function timeAgo(ms){const s=Math.max(1,Math.floor((Date.now()-ms)/1000));if(s<60)return 'الآن';const m=Math.floor(s/60);if(m<60)return `منذ ${m} د`;const h=Math.floor(m/60);if(h<24)return `منذ ${h} س`;const d=Math.floor(h/24);if(d<30)return `منذ ${d} يوم`;return new Date(ms).toLocaleDateString('ar-EG')}
export const tsMs=x=>x?.toMillis?.()||Date.now();
export const favs=()=>{try{return new Set(JSON.parse(localStorage.favs||'[]'))}catch{return new Set()}};
export const saveFavs=s=>{localStorage.favs=JSON.stringify([...s])};

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
