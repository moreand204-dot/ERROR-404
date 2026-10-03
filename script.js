import {collection,collectionGroup,onSnapshot,query,orderBy,limit,doc,setDoc,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {db,$,esc,store,onStore,getPrefs,brandHTML,favs,saveFavs} from "./core.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
mountHeader({search:true,page:'index'});mountFooter();hydrate();
$("#heroSearchBtn").innerHTML=ic("search");

const box=$("#apps"),stripsBox=$("#strips");
let allApps=[],rstats={},shown=24,loaded=false,timer,lastPage=0;
const avg=id=>rstats[id]?rstats[id].sum/rstats[id].n:0;
const TITLES={all:'كل المحتوى',latest:'الأحدث',popular:'الأكثر تحميلاً',rating:'الأعلى تقييماً',fav:'المفضلة'};
const pageSize=()=>Math.max(6,Number(store.pageSize)||24);
const schedule=()=>{clearTimeout(timer);timer=setTimeout(renderAll,60)};

function card(s,f){const a=s.data(),ext=extOf(a).toUpperCase(),r=rstats[s.id],fv=f.has(s.id);
 return `<article class="app-card" data-id="${s.id}"><button class="fav-btn" data-fav="${s.id}" aria-label="المفضلة">${ic('heart',fv?'fav-on':'')}</button><div class="app-icon">${tile(a)}</div><h3 title="${esc(a.name)}">${esc(a.name||"عنصر")}</h3><div class="rating-row">${r?`${ic('star','on')}<b>${avg(s.id).toFixed(1)}</b><span>(${r.n})</span>`:`<span class="muted">بدون تقييم</span>`}</div><div class="ext-tag">${kindLabel(a)}${ext?` · ${esc(ext)}`:''}</div><p>${esc(a.category||"تطبيقات")}${a.size?` · ${esc(a.size)}`:''}</p><button class="dl-btn">${ic('download')}تحميل</button></article>`}

const getFilter=()=>$('.chip.active')?.dataset.filter||'all';
const getQuery=()=>($('#mainSearch')?.value||$('#heroSearch')?.value||'').trim().toLowerCase();
const byPopular=list=>[...list].sort((x,y)=>Number(y.data().downloads||0)-Number(x.data().downloads||0));
const byRating=list=>[...list].sort((x,y)=>avg(y.id)-avg(x.id)||(rstats[y.id]?.n||0)-(rstats[x.id]?.n||0));

function renderStrips(f){
 const active=getFilter();
 if(!(store.stripsOn&&getPrefs().strips!=='off'&&active==='all'&&!getQuery()&&allApps.length)){stripsBox.innerHTML='';return}
 const n=Math.max(3,Number(store.stripCount)||8);
 const defs=[['bolt','الأحدث','latest',allApps.slice(0,n)],
  ['flame','الأكثر تحميلاً','popular',byPopular(allApps.filter(s=>Number(s.data().downloads||0)>0)).slice(0,n)],
  ['star','الأعلى تقييماً','rating',byRating(allApps.filter(s=>rstats[s.id])).slice(0,n)]];
 stripsBox.innerHTML=defs.filter(d=>d[3].length).map(d=>`<section class="strip"><div class="section-head"><h2 class="strip-title">${ic(d[0])}${d[1]}</h2><a href="#appsSection" data-go="${d[2]}">عرض الكل ${ic('arrowL')}</a></div><div class="strip-row">${d[3].map(s=>card(s,f)).join('')}</div></section>`).join('')}

function renderAll(){
 const q=getQuery(),active=getFilter(),f=favs();
 if(!loaded){return}
 let list=allApps.filter(s=>{const a=s.data();
  if(q&&!`${a.name||''} ${a.category||''} ${a.description||''} ${a.fileName||''}`.toLowerCase().includes(q))return false;
  if(active==='all'||active==='latest')return true;
  if(active==='popular')return Number(a.downloads||0)>0;
  if(active==='rating')return !!rstats[s.id];
  if(active==='fav')return f.has(s.id);
  return a.category===active});
 const p=getPrefs(),mode=active==='popular'||active==='rating'?active:(active==='all'?(p.sort==='store'?store.defaultSort:p.sort):'latest');
 if(mode==='popular')list=byPopular(list);else if(mode==='rating')list=byRating(list);
 renderStrips(f);
 $('#listTitle').firstChild.textContent=(TITLES[active]||active)+' ';
 box.innerHTML=list.length?list.slice(0,shown).map(s=>card(s,f)).join(''):`<div class="empty-state">${ic(active==='fav'?'heart':'folder')}<span>${active==='fav'?'لسه ما ضفتش حاجة للمفضلة':'لا يوجد محتوى مطابق'}</span></div>`;
 $('#moreWrap').hidden=list.length<=shown;
 $('#liveCount').textContent=allApps.length;$('#liveCount2').textContent=allApps.length}

// أحداث بالتفويض: أسرع وأخف من ربط كل زرار لوحده
document.addEventListener('click',e=>{
 const fv=e.target.closest('[data-fav]');
 if(fv){const s=favs(),id=fv.dataset.fav;s.has(id)?s.delete(id):s.add(id);saveFavs(s);
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b=>b.innerHTML=ic('heart',s.has(id)?'fav-on':''));if(getFilter()==='fav')schedule();return}
 const go=e.target.closest('[data-go]');if(go){e.preventDefault();setFilter(go.dataset.go);return}
 const c=e.target.closest('.app-card');if(c&&c.dataset.id)location.href=`app.html?id=${encodeURIComponent(c.dataset.id)}`});

function setFilter(f){document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.filter===f));shown=pageSize();renderAll();$('#appsSection').scrollIntoView({behavior:'smooth'})}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x===b));shown=pageSize();renderAll()});
document.querySelectorAll('.nav a[data-f]').forEach(a=>a.onclick=e=>{e.preventDefault();setFilter(a.dataset.f);document.body.classList.remove('menu-open')});
document.querySelectorAll('.category-link').forEach(b=>b.onclick=()=>setFilter(b.dataset.category));
$('#showAll').onclick=e=>{e.preventDefault();setFilter('all')};
$('#exploreBtn').onclick=()=>$('#appsSection').scrollIntoView({behavior:'smooth'});
$('#moreBtn').onclick=()=>{shown+=pageSize();renderAll()};

let st;const onSearch=src=>{const o=src.id==='mainSearch'?$('#heroSearch'):$('#mainSearch');if(o)o.value=src.value;clearTimeout(st);st=setTimeout(()=>{shown=pageSize();renderAll()},120)};
["#mainSearch","#heroSearch"].forEach(sel=>{const el=$(sel);el?.addEventListener('input',()=>onSearch(el));el?.addEventListener('keydown',e=>{if(e.key==='Enter')$('#appsSection').scrollIntoView({behavior:'smooth'})})});
$('#miniSearchBtn')?.addEventListener('click',()=>$('#appsSection').scrollIntoView({behavior:'smooth'}));
const qp=new URLSearchParams(location.search),initF=qp.get('f')||qp.get('cat');
if(initF)document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.filter===initF));

onStore(s=>{if(pageSize()!==lastPage){lastPage=pageSize();shown=lastPage}
 $('#heroWelcome').textContent=s.welcome;$('#heroTitle').innerHTML=`${brandHTML(s.storeName,'strong')} ${esc(s.storeSub)}`;$('#heroTagline').textContent=s.tagline;
 document.title=`${s.storeName} ${s.storeSub} — متجر التطبيقات والملفات`;
 $('#heroSec').hidden=s.heroOn===false;$('#statsPanel').hidden=s.statsOn===false;schedule()});

try{onSnapshot(query(collection(db,'apps'),orderBy('createdAt','desc'),limit(150)),snap=>{allApps=snap.docs;loaded=true;schedule()},e=>{console.error(e);loaded=true;schedule()})}catch(e){console.error(e)}
onSnapshot(collectionGroup(db,'reviews'),snap=>{const m={};snap.forEach(d=>{const r=d.data(),k=r.appId;if(!k)return;m[k]=m[k]||{sum:0,n:0};m[k].sum+=Number(r.rating)||0;m[k].n++});rstats=m;$('#liveReviews').textContent=snap.size;schedule()},()=>{});
(async()=>{try{await setDoc(doc(db,'stats','global'),{visitors:increment(1),updatedAt:serverTimestamp()},{merge:true})}catch(e){console.warn('stats',e)}})();
onSnapshot(doc(db,'stats','global'),snap=>{const s=snap.exists()?snap.data():{};$('#liveVisitors').textContent=Number(s.visitors||0).toLocaleString('en-US')});
