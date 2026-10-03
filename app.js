import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getFirestore,doc,onSnapshot,updateDoc,increment,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";
const firebaseConfig={apiKey:"AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",authDomain:"ourstory-f33db.firebaseapp.com",projectId:"ourstory-f33db",storageBucket:"ourstory-f33db.firebasestorage.app",messagingSenderId:"685629313835",appId:"1:685629313835:web:fb06292932019eabc56b6e",measurementId:"G-9TBR9QFHQR"};
const db=getFirestore(initializeApp(firebaseConfig));
const id=new URLSearchParams(location.search).get('id');
const box=document.querySelector('#appBox');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
hydrate();
if(!id){box.innerHTML='<h1>404</h1><p>الرابط غير صحيح.</p>'}
else{onSnapshot(doc(db,'apps',id),snap=>{
  if(!snap.exists()){box.innerHTML='<h1>404 NOT FOUND</h1><p>العنصر غير موجود أو تم حذفه.</p>';return}
  const a=snap.data(),ext=extOf(a).toUpperCase(),isFile=a.kind==='file';
  document.title=`${a.name||'ERROR 404'} — ERROR 404`;
  const meta=[kindLabel(a)+(ext?` ${ext}`:''),a.version?`الإصدار ${a.version}`:'',a.size||'',a.category||''].filter(Boolean).map(esc).join(' · ');
  box.innerHTML=`<div class="app-detail"><div class="app-icon app-icon-large">${tile(a)}</div><div class="live-pill">${ic('live')}متاح الآن</div><h1>${esc(a.name)}</h1><p class="app-meta">${meta}</p><p class="app-description">${esc(a.description||'لا يوجد وصف بعد.')}</p><div class="app-actions"><a id="download" class="download-main" href="${esc(a.downloadURL||'#')}" target="_blank" rel="noopener">${ic('download')}${isFile?'تحميل الملف':'تحميل التطبيق'}</a><a class="back-main" href="index.html">${ic('arrowR')}العودة للمتجر</a></div><div class="download-info">عدد التحميلات: <b>${Number(a.downloads||0).toLocaleString()}</b></div></div>`;
  document.querySelector('#download')?.addEventListener('click',async e=>{
    if(!a.downloadURL){e.preventDefault();alert('رابط التحميل غير متوفر حاليًا.');return}
    try{await updateDoc(doc(db,'apps',id),{downloads:increment(1),updatedAt:serverTimestamp()})}catch{}
  });
})}
