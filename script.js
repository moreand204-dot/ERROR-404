import {collection,collectionGroup,onSnapshot,query,orderBy,limit,doc,setDoc,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {db,$,esc,store,onStore,getPrefs,brandHTML,favs,saveFavs} from "./core.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
mountHeader({search:true,page:'index'});mountFooter();hydrate();
$("#heroSearchBtn").innerHTML=ic("search");

const box=$("#apps"),empty=`<div class="empty-state">${ic('folder')}<span>لا يوجد محتوى مطابق</span></div>`;
let allApps=[],rstats={};
const avg=id=>rstats[id]?rstats[id].sum/rstats[id].n:0;
const TITLES={all:'أحدث المحتوى',latest:'الأحدث',popular:'الأكثر تحميلاً',rating:'الأعلى تقييماً',fav:'المفضلة'};

function appCard(s){const a=s.data(),ext=extOf(a).toUpperCase(),r=rstats[s.id],fv=favs().has(s.id);
 return `<article class="app-card" data-category="${esc(a.category||'أخرى')}"><button class="fav-btn" data-fav="${s.id}" aria-label="المفضلة">${ic('heart',fv?'fav-on':'')}</button><div class="app-icon">${tile(a)}</div><h3 title="${esc(a.name)}">${esc(a.name||"عنصر")}</h3><div class="rating-row">${r?`${ic('star','on')}<b>${avg(s.id).toFixed(1)}</b><span>(${r.n})</span>`:`<span class="muted">بدون تقييم</span>`}</div><div class="ext-tag">${kindLabel(a)}${ext?` · ${esc(ext)}`:''}</div><p>${esc(a.category||"تطبيقات")}${a.size?` · ${esc(a.size)}`:''}</p><button data-app-download="${s.id}">${ic('download')}تحميل</button></article>`}

function renderApps(){
 const q=($('#mainSearch')?.value||$('#heroSearch')?.value||'').trim().toLowerCase();
 const active=$('.chip.active')?.dataset.filter||'all',f=favs();
 let list=allApps.filter(s=>{const a=s.data();const text=`${a.name||''} ${a.category||''} ${a.description||''} ${a.fileName||''}`.toLowerCase();
  if(q&&!text.includes(q))return false;
  if(active==='all'||active==='latest')return true;
  if(active==='popular')return Number(a.downloads||0)>0;
  if(active==='rating')return !!rstats[s.id];
  if(active==='fav')return f.has(s.id);
  return a.category===active});
 const p=getPrefs();const mode=active==='popular'||active==='rating'?active:(active==='all'?(p.sort==='store'?store.defaultSort:p.sort):'latest');
 if(mode==='popular')list=[...list].sort((x,y)=>Number(y.data().downloads||0)-Number(x.data().downloads||0));
 if(mode==='rating')list=[...list].sort((x,y)=>avg(y.id)-avg(x.id)||(rstats[y.id]?.n||0)-(rstats[x.id]?.n||0));
 $('#listTitle').firstChild.textContent=(TITLES[active]||active)+' ';
 box.innerHTML=list.length?list.map(appCard).join(''):(active==='fav'?`<div class="empty-state">${ic('heart')}<span>لسه ما ضفتش حاجة للمفضلة</span></div>`:empty);
 document.querySelectorAll('[data-app-download]').forEach(b=>b.onclick=()=>location.href=`app.html?id=${encodeURIComponent(b.dataset.appDownload)}`);
 document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{const s=favs();s.has(b.dataset.fav)?s.delete(b.dataset.fav):s.add(b.dataset.fav);saveFavs(s);renderApps()});
 $('#liveCount').textContent=allApps.length;$('#liveCount2').textContent=allApps.length;
}

$("#miniSearchBtn").onclick=()=>doSearch();
function doSearch(){$('.section-head')?.scrollIntoView({behavior:'smooth',block:'start'});renderApps()}
["#mainSearch","#heroSearch"].forEach(sel=>{const el=$(sel);el?.addEventListener('input',()=>{const o=sel==='#mainSearch'?$('#heroSearch'):$('#mainSearch');if(o)o.value=el.value;renderApps()});el?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()})});
const setChip=f=>document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.filter===f));
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{setChip(b.dataset.filter);renderApps()});
document.querySelectorAll('.nav a[data-f]').forEach(a=>a.onclick=e=>{e.preventDefault();setChip(a.dataset.f);renderApps();$('#appsSection').scrollIntoView({behavior:'smooth'});document.body.classList.remove('menu-open')});
document.querySelectorAll('.category-link').forEach(b=>b.onclick=()=>{setChip(b.dataset.category);renderApps();$('#apps')?.scrollIntoView({behavior:'smooth'})});
$('#showAll').onclick=()=>{setChip('all');renderApps()};
$('#exploreBtn').onclick=()=>$('#appsSection').scrollIntoView({behavior:'smooth'});
const qp=new URLSearchParams(location.search);if(qp.get('f')||qp.get('cat'))setChip(qp.get('f')||qp.get('cat'));

onStore(s=>{$('#heroWelcome').textContent=s.welcome;$('#heroTitle').innerHTML=`${brandHTML(s.storeName,'strong')} ${esc(s.storeSub)}`;$('#heroTagline').textContent=s.tagline;document.title=`${s.storeName} ${s.storeSub} — متجر التطبيقات والملفات`;renderApps()});

try{onSnapshot(query(collection(db,'apps'),orderBy('createdAt','desc'),limit(100)),snap=>{allApps=snap.docs;renderApps()},e=>{console.error(e);box.innerHTML=empty})}catch(e){console.error(e)}
// تقييمات كل العناصر لحظيًا (متوسط كل عنصر)
onSnapshot(collectionGroup(db,'reviews'),snap=>{const m={};snap.forEach(d=>{const r=d.data();const k=r.appId;if(!k)return;m[k]=m[k]||{sum:0,n:0};m[k].sum+=Number(r.rating)||0;m[k].n++});rstats=m;$('#liveReviews').textContent=snap.size;renderApps()},()=>{});
(async()=>{try{await setDoc(doc(db,'stats','global'),{visitors:increment(1),updatedAt:serverTimestamp()},{merge:true})}catch(e){console.warn('stats',e)}})();
onSnapshot(doc(db,'stats','global'),snap=>{const s=snap.exists()?snap.data():{};$('#liveVisitors').textContent=Number(s.visitors||0).toLocaleString('en-US')});
