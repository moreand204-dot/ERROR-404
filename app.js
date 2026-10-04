import {doc,onSnapshot,updateDoc,increment,serverTimestamp,collection,query,orderBy,limit,setDoc,deleteDoc,getDoc,getDocs} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {db,$,esc,safeUrl,store,onStore,onUser,currentUser,isStaff,roleOfUid,badgeHTML,getProfile,avatar,toast,favs,saveFavs,timeAgo,tsMs} from "./core.js";
import {ic,tile,extOf,kindLabel} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
mountHeader({page:'app'});mountFooter();
const rawId=new URLSearchParams(location.search).get('id')||'';const id=/^[A-Za-z0-9_-]{5,40}$/.test(rawId)?rawId:'';
const box=$('#appBox'),rbox=$('#reviewsBox');
let shots=[],appData=null,reviews=[],user=null,myReview=null,pickRating=0,formInit=false;

const shotsHTML=()=>shots.length?`<div class="shots-title">لقطات الشاشة</div><div class="shots">${shots.map((d,i)=>`<img src="${esc(d)}" alt="" loading="lazy" decoding="async" data-shot="${i}">`).join('')}</div>`:'';
document.body.insertAdjacentHTML('beforeend',`<div class="lightbox" id="lb" hidden><button class="lb-close" aria-label="إغلاق">${ic('x')}</button><button class="lb-prev" aria-label="السابق">${ic('arrowR')}</button><img id="lbImg" alt=""><button class="lb-next" aria-label="التالي">${ic('arrowL')}</button></div>`);
let lbI=0;const lb=$('#lb'),lbShow=i=>{lbI=(i+shots.length)%shots.length;$('#lbImg').src=shots[lbI];lb.hidden=false};
document.addEventListener('click',e=>{const t=e.target.closest('[data-shot]');if(t){lbShow(+t.dataset.shot);return}if(e.target.closest('.lb-close')||e.target===lb)lb.hidden=true;else if(e.target.closest('.lb-prev'))lbShow(lbI+1);else if(e.target.closest('.lb-next'))lbShow(lbI-1)});
document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')lb.hidden=true;if(e.key==='ArrowLeft')lbShow(lbI-1);if(e.key==='ArrowRight')lbShow(lbI+1)});
const starRow=(v,cls='')=>[1,2,3,4,5].map(i=>ic('star',(i<=Math.round(v)?'on ':'')+cls)).join('');

if(!id){box.innerHTML='<h1>404</h1><p>الرابط غير صحيح.</p>'}
else{
 getDocs(query(collection(db,'apps',id,'shots'),orderBy('order'),limit(10))).then(sn=>{shots=sn.docs.map(d=>d.data().data).filter(Boolean);const w=$('#shotsWrap');if(w)w.innerHTML=shotsHTML()}).catch(()=>{});
 onSnapshot(doc(db,'apps',id),snap=>{
  if(!snap.exists()){box.innerHTML='<h1>404 NOT FOUND</h1><p>العنصر غير موجود أو تم حذفه.</p>';rbox.hidden=true;return}
  const a=appData=snap.data(),ext=extOf(a).toUpperCase(),isFile=a.kind==='file',fv=favs().has(id);
  document.title=`${a.name||'ERROR 404'} — ERROR 404`;
  const meta=[kindLabel(a)+(ext?` ${ext}`:''),a.version?`الإصدار ${a.version}`:'',a.size||'',a.category||''].filter(Boolean).map(esc).join(' · ');
  box.innerHTML=`<div class="app-detail"><div class="app-icon app-icon-large">${tile(a)}</div><div class="live-pill">${ic('live')}متاح الآن</div><h1>${esc(a.name)}</h1><div class="detail-rating" id="detailRating"></div><p class="app-meta">${meta}</p>${a.uploaderUid&&a.uploaderName?`<p class="app-meta uploader">نُشر بواسطة <a href="profile.html?uid=${encodeURIComponent(a.uploaderUid)}">${esc(a.uploaderName)}</a> <span id="upBadge">${badgeHTML(roleOfUid(a.uploaderUid)||a.uploaderRole||null)}</span></p>`:''}<p class="app-description">${esc(a.description||'لا يوجد وصف بعد.')}</p><div id="shotsWrap">${shotsHTML()}</div><div class="app-actions"><a id="download" class="download-main" href="${esc(safeUrl(a.downloadURL)||'#')}" target="_blank" rel="noopener">${ic('download')}${isFile?'تحميل الملف':'تحميل التطبيق'}</a><button class="back-main" id="favBtn">${ic('heart',fv?'fav-on':'')}${fv?'في المفضلة':'أضف للمفضلة'}</button><button class="back-main" id="shareBtn">${ic('share')}مشاركة</button><a class="back-main" href="index.html">${ic('arrowR')}العودة للمتجر</a></div><div class="download-info" id="dlInfo" hidden></div>${/^[a-f0-9]{64}$/.test(a.sha256||'')?`<div class="hash-box"><b>SHA-256</b><code>${esc(a.sha256)}</code><a href="https://www.virustotal.com/gui/file/${esc(a.sha256)}" target="_blank" rel="noopener noreferrer">${ic('shield')}فحص على VirusTotal</a></div>`:''}<div class="download-info">عدد التحميلات: <b>${Number(a.downloads||0).toLocaleString()}</b></div></div>`;
  paintRating();rbox.hidden=!store.reviewsOn;
  const direct=a.driveFileId?`https://drive.usercontent.google.com/download?id=${encodeURIComponent(a.driveFileId)}&export=download&confirm=t`:(a.downloadURL||'');
  $('#download')?.addEventListener('click',async e=>{
   e.preventDefault();if(!direct){alert('رابط التحميل غير متوفر حاليًا.');return}
   // تحميل مباشر داخل نفس الصفحة بدون فتح صفحة درايف (iframe مخفي)
   let fr=$('#dlFrame');if(!fr){fr=document.createElement('iframe');fr.id='dlFrame';fr.style.display='none';document.body.append(fr)}fr.src=direct;
   const info=$('#dlInfo');if(info){info.hidden=false;info.innerHTML=`بدأ التحميل... لو ما بدأش خلال ثواني <a href="${esc(safeUrl(a.downloadURL)||direct)}" target="_blank" rel="noopener">اضغط هنا</a>`}
   try{await updateDoc(doc(db,'apps',id),{downloads:increment(1),updatedAt:serverTimestamp()})}catch{}
  });
  $('#favBtn').onclick=()=>{const s=favs();s.has(id)?s.delete(id):s.add(id);saveFavs(s);const on=s.has(id);$('#favBtn').innerHTML=`${ic('heart',on?'fav-on':'')}${on?'في المفضلة':'أضف للمفضلة'}`};
  $('#shareBtn').onclick=async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:a.name,url});else{await navigator.clipboard.writeText(url);toast('تم نسخ الرابط','ok')}}catch{}};
 });

 onSnapshot(query(collection(db,'apps',id,'reviews'),orderBy('updatedAt','desc'),limit(100)),snap=>{
  reviews=snap.docs.map(d=>({id:d.id,...d.data()}));myReview=user?reviews.find(r=>r.uid===user.uid)||null:null;
  paintRating();renderSummary();renderList();if(!formInit){renderForm();formInit=true}},()=>{});
 onUser(u=>{user=u;myReview=u?reviews.find(r=>r.uid===u.uid)||null:null;pickRating=myReview?.rating||0;renderForm();renderList()});
 onStore(()=>{const ub=$('#upBadge');if(ub&&appData)ub.innerHTML=badgeHTML(roleOfUid(appData.uploaderUid)||appData.uploaderRole||null);rbox.hidden=!(store.reviewsOn&&appData);if(reviews.length)renderList()});
}

function paintRating(){const el=$('#detailRating');if(!el)return;const n=reviews.length;
 el.innerHTML=n?`<span class="stars">${starRow(reviews.reduce((s,r)=>s+r.rating,0)/n)}</span><b>${(reviews.reduce((s,r)=>s+r.rating,0)/n).toFixed(1)}</b><span class="muted">(${n} تقييم)</span>`:`<span class="muted">لا توجد تقييمات بعد</span>`}

function renderSummary(){const n=reviews.length,avg=n?reviews.reduce((s,r)=>s+r.rating,0)/n:0;
 const bars=[5,4,3,2,1].map(k=>{const c=reviews.filter(r=>r.rating===k).length;return `<div class="bar-row"><span>${k}</span>${ic('star','on')}<div class="bar"><i style="width:${n?c/n*100:0}%"></i></div><em>${c}</em></div>`}).join('');
 $('#revSummary').innerHTML=`<div class="big-score"><b>${n?avg.toFixed(1):'0.0'}</b><div class="stars">${starRow(avg)}</div><small>${n} تقييم</small></div><div class="bars">${bars}</div>`}

function renderForm(){const f=$('#revForm');
 if(!user){f.innerHTML=`<div class="login-hint">${ic('user')}<span>سجّل الدخول لإضافة تقييمك وتعليقك.</span><button class="admin-btn primary" id="revLogin">تسجيل الدخول</button></div>`;$('#revLogin').onclick=()=>window.openAuth?.();return}
 pickRating=pickRating||myReview?.rating||0;
 f.innerHTML=`<h3>${myReview?'تعديل تقييمك':'أضف تقييمك'}</h3><div class="star-pick" id="starPick">${[1,2,3,4,5].map(i=>`<button type="button" data-r="${i}" aria-label="${i}">${ic('star',i<=pickRating?'on':'')}</button>`).join('')}</div><textarea id="revText" maxlength="500" placeholder="اكتب تعليقك (اختياري)...">${esc(myReview?.text||'')}</textarea><div class="rev-actions"><button class="admin-btn primary" id="revSave">${ic('check')}${myReview?'تحديث التقييم':'نشر التقييم'}</button>${myReview?`<button class="admin-btn danger" id="revDel">${ic('trash')}حذف تقييمي</button>`:''}<span class="muted" id="revMsg"></span></div>`;
 document.querySelectorAll('#starPick button').forEach(b=>b.onclick=()=>{pickRating=+b.dataset.r;document.querySelectorAll('#starPick button').forEach(x=>x.innerHTML=ic('star',+x.dataset.r<=pickRating?'on':''))});
 $('#revSave').onclick=saveReview;$('#revDel')?.addEventListener('click',delMine)}

async function saveReview(){
 if(!pickRating){$('#revMsg').textContent='اختار عدد النجوم الأول.';return}
 const btn=$('#revSave');btn.disabled=true;
 try{const p=await getProfile(user.uid,{name:user.displayName,photoURL:user.photoURL});
  await setDoc(doc(db,'apps',id,'reviews',user.uid),{appId:id,uid:user.uid,rating:pickRating,text:$('#revText').value.trim().slice(0,500),name:p.name.slice(0,40),photoURL:(p.photoURL||'').slice(0,60000),createdAt:myReview?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()});
  toast('تم حفظ تقييمك','ok');formInit=false}
 catch(e){$('#revMsg').textContent='تعذر الحفظ: '+e.message}finally{btn.disabled=false}}
async function delMine(){if(!confirm('حذف تقييمك؟'))return;try{await deleteDoc(doc(db,'apps',id,'reviews',user.uid));pickRating=0;formInit=false;toast('تم حذف تقييمك')}catch(e){toast('تعذر الحذف','err')}}

async function renderList(){const l=$('#revList');
 if(!reviews.length){l.innerHTML=`<div class="n-empty">${ic('message')}<span>كن أول من يقيّم</span></div>`;return}
 const ps=await Promise.all(reviews.map(r=>getProfile(r.uid,{name:r.name,photoURL:r.photoURL})));
 l.innerHTML=reviews.map((r,i)=>{const p=ps[i],can=user&&(user.uid===r.uid||isStaff());
  return `<article class="review"><a href="profile.html?uid=${encodeURIComponent(r.uid)}">${avatar(p)}</a><div class="r-body"><div class="r-top"><a href="profile.html?uid=${encodeURIComponent(r.uid)}"><b>${esc(p.name)}</b></a>${badgeHTML(roleOfUid(r.uid))}<span class="stars sm">${starRow(r.rating)}</span><small>${timeAgo(tsMs(r.updatedAt))}</small>${can&&user.uid!==r.uid?`<button class="r-del" data-del="${esc(r.uid)}" aria-label="حذف">${ic('trash')}</button>`:''}</div>${r.text?`<p>${esc(r.text)}</p>`:''}</div></article>`}).join('');
 l.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف هذا التقييم؟'))return;try{await deleteDoc(doc(db,'apps',id,'reviews',b.dataset.del));toast('تم الحذف')}catch{toast('تعذر الحذف','err')}})}
