import {db,esc,safeUrl,toast,getPrefs,timeAgo,tsMs,$} from "./core.js";
import {ic} from "./icons.js";
import {collection,query,orderBy,limit,onSnapshot} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const supported=()=>'Notification' in window;
export const permission=()=>supported()?Notification.permission:'unsupported';
export async function askPermission(){return supported()?await Notification.requestPermission():'unsupported'}
const linkOf=n=>n.appId?`app.html?id=${encodeURIComponent(n.appId)}`:(safeUrl(n.link)||'index.html');
export async function showSystem(n){
 try{const reg=await navigator.serviceWorker?.ready;
  const o={body:n.body||'',icon:'assets/icon-192.png',badge:'assets/icon-192.png',tag:n.id||'n',dir:'rtl',lang:'ar',data:{url:linkOf(n)}};
  reg?reg.showNotification(n.title||'ERROR 404',o):new Notification(n.title||'ERROR 404',o)}catch{}}

export function initNotifications(){
 const btn=$('#bellBtn'),pop=$('#notifPop'),badge=$('#bellBadge');if(!btn)return;
 if(!localStorage.n_seen)localStorage.n_seen=Date.now();
 if(!localStorage.n_shown)localStorage.n_shown=Date.now();
 let items=[],first=true;
 const unreadCount=()=>items.filter(n=>tsMs(n.createdAt)>+localStorage.n_seen).length;
 function footer(){const p=permission();
  if(p==='unsupported')return '';
  if(p==='default')return `<button class="n-enable" id="nEnable">${ic('bell')}تفعيل إشعارات الجهاز</button>`;
  if(p==='denied')return `<div class="n-note">الإشعارات محجوبة من إعدادات المتصفح لهذا الموقع.</div>`;
  return `<div class="n-note">${ic('check')}إشعارات الجهاز مفعلة</div>`}
 function render(){const seen=+localStorage.n_seen,u=unreadCount();
  badge.hidden=!u;badge.textContent=u>9?'9+':u;
  pop.innerHTML=`<div class="pop-title"><b>الإشعارات</b><a href="settings.html">${ic('gear')}</a></div><div class="n-list">${items.length?items.map(n=>`<a class="n-item ${tsMs(n.createdAt)>seen?'unread':''}" href="${esc(linkOf(n))}"><i>${ic(n.appId?'bolt':'megaphone')}</i><div><b>${esc(n.title)}</b><p>${esc(n.body||'')}</p><small>${timeAgo(tsMs(n.createdAt))}</small></div></a>`).join(''):`<div class="n-empty">${ic('bell')}<span>لا توجد إشعارات بعد</span></div>`}</div>${footer()}`;
  $('#nEnable')?.addEventListener('click',async()=>{const r=await askPermission();if(r==='granted')toast('تم تفعيل إشعارات الجهاز','ok');render()})}
 btn.addEventListener('click',()=>{render();localStorage.n_seen=Date.now();setTimeout(()=>{badge.hidden=true},50)});
 onSnapshot(query(collection(db,'notifications'),orderBy('createdAt','desc'),limit(30)),snap=>{
  items=snap.docs.map(d=>({id:d.id,...d.data()}));
  const shown=+localStorage.n_shown,fresh=items.filter(n=>tsMs(n.createdAt)>shown).slice(0,3);
  if(fresh.length&&getPrefs().notify!=='off'){
   fresh.forEach(n=>{if(document.hidden){if(permission()==='granted')showSystem(n)}else toast(`${n.title}: ${n.body||''}`,'info')})}
  if(items.length)localStorage.n_shown=Math.max(shown,...items.map(n=>tsMs(n.createdAt)));
  first=false;render()},()=>{});
}
