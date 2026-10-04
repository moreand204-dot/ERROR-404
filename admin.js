import {Timestamp,where,arrayUnion,arrayRemove,getFirestore,collection,doc,getDoc,setDoc,addDoc,updateDoc,getDocs,query,orderBy,limit,serverTimestamp,deleteDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {auth,db,ADMIN_EMAIL,esc,safeUrl,STORE_DEF,setPrefs,timeAgo,tsMs,resizeFit,onUser,currentRole,isStaff,store,onStore} from "./core.js";
import {signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";

const DRIVE_CLIENT_ID="660209763876-4aochiriq3vsl5beo1rifqlctemn1dck.apps.googleusercontent.com";
const DRIVE_SCOPE="https://www.googleapis.com/auth/drive.file";
const $=id=>document.getElementById(id);
const themeIcon=()=>$('theme').innerHTML=ic(document.documentElement.classList.contains('light')?'moon':'sun');function theme(){setPrefs({theme:document.documentElement.classList.contains('light')?'dark':'light'});themeIcon()}themeIcon();$('theme').onclick=theme;hydrate();
$('shieldIcon').innerHTML=ic('shield');
const DANGER=['exe','bat','cmd','scr','msi','vbs','ps1','com','jar','dll','sh'];
let hashPromise=Promise.resolve('');
async function sha256(file){const b=await file.arrayBuffer();const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
$('apk').onchange=()=>{const f=$('apk').files[0];if(!f){$('apkName').textContent="لم يتم اختيار ملف";hashPromise=Promise.resolve('');return}
 const ex=f.name.includes('.')?f.name.split('.').pop().toLowerCase():'';
 if(DANGER.includes(ex)&&!confirm(`الملف من نوع .${ex} قابل للتنفيذ على الكمبيوتر. متأكد إنك تريد رفعه؟`)){$('apk').value='';$('apkName').textContent='تم إلغاء الاختيار';return}
 hashPromise=f.size<=120*1048576?sha256(f).catch(()=>''):Promise.resolve('');
 $('apkName').textContent=`${f.name} — ${(f.size/1024/1024).toFixed(1)} MB`;
 const ext=f.name.includes('.')?f.name.split('.').pop().toLowerCase():'';
 if(!$('appName').value.trim())$('appName').value=f.name.replace(/\.[^.]+$/,'');
 $('appSize').value=f.size>=1048576?`${(f.size/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(f.size/1024))} KB`;
 $('appKind').value=ext==='apk'?'app':'file';$('appCategory').value=ext==='apk'?'تطبيقات':'ملفات'};
document.querySelectorAll("[data-tab]").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".admin-side button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$(btn.dataset.tab).classList.add("active")});
$('adminGoogle').onclick=async()=>{try{$('loginStatus').textContent="جاري تسجيل الدخول...";await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){$('loginStatus').textContent="فشل تسجيل الدخول: "+e.message}};
$('logout').onclick=()=>signOut(auth);

let driveTokenClient=null,driveAccessToken=null,driveReady=false;
function loadDriveIdentity(){return new Promise((resolve,reject)=>{if(window.google?.accounts?.oauth2)return resolve();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('تعذر تحميل Google Identity Services.'));document.head.appendChild(s);});}
async function authorizeDrive(){
  await loadDriveIdentity();
  if(!driveTokenClient){driveTokenClient=google.accounts.oauth2.initTokenClient({client_id:DRIVE_CLIENT_ID,scope:DRIVE_SCOPE,callback:r=>{if(r.error){driveReady=false;return;}driveAccessToken=r.access_token;driveReady=true;}});}
  return new Promise((resolve,reject)=>{
    const old=driveTokenClient.callback; driveTokenClient.callback=(r)=>{driveTokenClient.callback=old;if(r.error)return reject(new Error(r.error_description||r.error));driveAccessToken=r.access_token;driveReady=true;resolve(r.access_token)};
    driveTokenClient.requestAccessToken({prompt:driveAccessToken?'':'consent'});
  });
}
async function driveFetch(url,options={}){if(!driveAccessToken)await authorizeDrive();let res=await fetch(url,{...options,headers:{Authorization:`Bearer ${driveAccessToken}`,...(options.headers||{})}});if(res.status===401){driveAccessToken=await authorizeDrive();res=await fetch(url,{...options,headers:{Authorization:`Bearer ${driveAccessToken}`,...(options.headers||{})}});}const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error?.message||`Google Drive error ${res.status}`);return data;}
async function uploadToDrive(file,onProgress){
  if(!driveAccessToken)await authorizeDrive();
  const meta={name:file.name,mimeType:file.type||'application/octet-stream'};
  const init=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',{method:'POST',headers:{Authorization:`Bearer ${driveAccessToken}`,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':meta.mimeType,'X-Upload-Content-Length':String(file.size)},body:JSON.stringify(meta)});
  if(!init.ok)throw new Error((await init.text())||`تعذر بدء رفع Google Drive (${init.status})`);
  const session=init.headers.get('Location'); if(!session)throw new Error('Google Drive لم يرجع رابط جلسة الرفع.');
  const result=await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('PUT',session,true);xhr.setRequestHeader('Content-Type',meta.mimeType);xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));};xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300){try{resolve(JSON.parse(xhr.responseText))}catch{reject(new Error('استجابة غير صالحة من Google Drive.'))}}else reject(new Error(`فشل رفع APK إلى Google Drive (${xhr.status})`))};xhr.onerror=()=>reject(new Error('انقطع الاتصال أثناء رفع APK.'));xhr.onabort=()=>reject(new Error('تم إلغاء الرفع.'));xhr.send(file)});
  // Make the created APK downloadable by visitors.
  try{await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}/permissions?supportsAllDrives=true`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'reader',type:'anyone'})});}catch(e){throw new Error('تم رفع الملف لكن تعذر جعله متاحًا للزوار: '+e.message)}
  return {id:result.id,downloadURL:`https://drive.usercontent.google.com/download?id=${encodeURIComponent(result.id)}&export=download&confirm=t`};
}
async function deleteDriveFile(fileId){if(!fileId)return;await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,{method:'DELETE'});}

// ===== خروج تلقائي عند الخمول + سجل النشاط =====
let idleT;const IDLE=30*60*1000;
const bump=()=>{clearTimeout(idleT);idleT=setTimeout(()=>{alert('تم تسجيل الخروج تلقائيًا بعد 30 دقيقة بدون نشاط.');signOut(auth)},IDLE)};
['click','keydown','touchstart','mousemove'].forEach(ev=>addEventListener(ev,()=>{if(auth.currentUser)bump()},{passive:true}));
async function logAdmin(action,detail=''){try{await addDoc(collection(db,'audit'),{action,detail:String(detail).slice(0,300),email:auth.currentUser?.email||'',at:serverTimestamp()})}catch(e){console.warn('audit',e)}}
async function loadAudit(){try{const s=await getDocs(query(collection(db,'audit'),orderBy('at','desc'),limit(30)));$('auditList').innerHTML=s.docs.map(d=>{const a=d.data();return `<div class="audit-row"><b>${esc(a.action)}</b><span>${esc(a.detail||'')}</span><span>${a.at?.toDate?a.at.toDate().toLocaleString('ar-EG'):''}</span></div>`}).join('')||'<div class="audit-row"><span>لا يوجد نشاط مسجّل بعد.</span></div>'}catch{}}
const isOwner=()=>currentRole==='owner';
onUser(async user=>{
 if(!user){clearTimeout(idleT);$('adminLogin').hidden=false;$('dashboard').hidden=true;return}
 if(!isStaff()){$('adminLogin').hidden=false;$('dashboard').hidden=true;$('loginStatus').textContent="هذا الحساب ليس أدمن. اطلب من المالك يضيفك.";await signOut(auth);return}
 bump();
 $('adminLogin').hidden=true;$('dashboard').hidden=false;$('adminEmail').textContent=user.email;
 const rb=$('roleBadge');rb.textContent=isOwner()?'المالك':'أدمن';rb.className='role-badge '+currentRole;
 document.querySelectorAll('[data-owner]').forEach(el=>{el.hidden=!isOwner()});
 if(isOwner()){try{await setDoc(doc(db,'settings','store'),{adminUid:user.uid},{merge:true})}catch{}}
 if(!sessionStorage.adminLogged){sessionStorage.adminLogged='1';logAdmin(isOwner()?'دخول المالك':'دخول أدمن',navigator.userAgent.slice(0,120))}
 await refresh();loadAudit();loadDevReqs();loadSubs();if(isOwner())loadAdmins();
});


// ===== أيقونة العنصر: تصغير الصورة إلى 192px وتخزينها مع بيانات العنصر =====
let shotsExisting=[],shotsNew=[],shotsDel=new Set();
let editId=null,editData=null,iconData; // undefined = بدون تغيير، '' = إزالة، نص = صورة جديدة
const cache={};
function makeIcon(file){return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const S=192,c=document.createElement('canvas');c.width=c.height=S;const m=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);URL.revokeObjectURL(url);res(c.toDataURL('image/webp',.85))};img.onerror=()=>rej(new Error('تعذر قراءة الصورة'));img.src=url})}
function showIcon(src){$('iconPreview').innerHTML=src?`<img src="${esc(src)}" alt="">`:ic('image');$('iconName').textContent=src?'تم اختيار الصورة':'بدون صورة — سيتم استخدام أيقونة حسب نوع الملف'}
$('iconFile').onchange=async()=>{const f=$('iconFile').files[0];if(!f)return;try{iconData=await makeIcon(f);showIcon(iconData)}catch(e){$('uploadStatus').textContent=e.message}};
$('iconClear').onclick=()=>{iconData='';$('iconFile').value='';showIcon('')};
const MAXSHOTS=8;
function paintShots(){const ex=shotsExisting.filter(s=>!shotsDel.has(s.id));
 const t=(d,k)=>`<div class="shot-t"><img src="${esc(d)}" alt=""><button type="button" data-sx="${k}" aria-label="حذف">${ic('x')}</button></div>`;
 $('shotsEdit').innerHTML=ex.map(s=>t(s.data,'e:'+s.id)).join('')+shotsNew.map((d,i)=>t(d,'n:'+i)).join('');
 $('shotsInfo').textContent=`${ex.length+shotsNew.length}/${MAXSHOTS}`;
 $('shotsEdit').querySelectorAll('[data-sx]').forEach(b=>b.onclick=()=>{const[k,v]=b.dataset.sx.split(':');if(k==='e')shotsDel.add(v);else shotsNew.splice(+v,1);paintShots()})}
$('shotsFile').onchange=async()=>{const files=[...$('shotsFile').files];$('shotsFile').value='';
 for(const f of files){if(shotsExisting.filter(s=>!shotsDel.has(s.id)).length+shotsNew.length>=MAXSHOTS)break;try{shotsNew.push(await resizeFit(f,1000,.72))}catch(e){$('uploadStatus').textContent=e.message}}paintShots()};
function resetForm(){shotsExisting=[];shotsNew=[];shotsDel=new Set();paintShots();$('appForm').reset();editId=null;editData=null;iconData=undefined;showIcon('');$('apkName').textContent='اضغط هنا لاختيار الملف';$('formTitle').textContent='إضافة عنصر';$('uploadBtnText').textContent='رفع ونشر';$('cancelEdit').hidden=true;$('notifyWrap').hidden=false;$('uploadProgress').classList.remove('show');$('uploadPercent').classList.remove('show')}
$('cancelEdit').onclick=()=>{resetForm();$('uploadStatus').textContent=''};
async function startEdit(id){const a=cache[id];if(!a)return;resetForm();editId=id;editData=a;
 try{const sn=await getDocs(query(collection(db,'apps',id,'shots'),orderBy('order')));shotsExisting=sn.docs.map(d=>({id:d.id,data:d.data().data}));paintShots()}catch{}
 $('appName').value=a.name||'';$('appVersion').value=a.version||'';$('appSize').value=a.size||'';$('appCategory').value=a.category||'أخرى';$('appKind').value=a.kind||'app';$('appDescription').value=a.description||'';
 showIcon(a.iconURL||'');$('apkName').textContent=`الملف الحالي: ${a.fileName||'ملف'} — اختر ملفًا جديدًا فقط إذا أردت استبداله`;
 $('formTitle').textContent='تعديل العنصر';$('uploadBtnText').textContent='حفظ التعديلات';$('cancelEdit').hidden=false;$('notifyWrap').hidden=true;
 document.querySelectorAll('.admin-side button,.tab').forEach(x=>x.classList.remove('active'));document.querySelector('[data-tab="appsTab"]').classList.add('active');$('appsTab').classList.add('active');$('appForm').scrollIntoView({behavior:'smooth'})}

async function refresh(){
 const apps=await getDocs(query(collection(db,"apps"),orderBy("createdAt","desc"),limit(100)));
 let downloads=0,rows="",stats="";
 apps.forEach(s=>{const a=s.data();cache[s.id]=a;downloads+=Number(a.downloads||0);const link=`app.html?id=${encodeURIComponent(s.id)}`;
  rows+=`<tr><td><div class="thumb">${tile(a)}</div></td><td>${esc(a.name)}</td><td><span class="badge">${kindLabel(a)}${extOf(a)?' '+esc(extOf(a).toUpperCase()):''}</span></td><td>${Number(a.downloads||0).toLocaleString()}</td><td><div class="row-actions"><a class="admin-btn" href="${link}" target="_blank">${ic('external')}فتح</a><button class="admin-btn" data-edit="${s.id}">${ic('pencil')}تعديل</button><button class="admin-btn danger" data-delete="${s.id}">${ic('trash')}حذف</button></div></td></tr>`;
  stats+=`<tr><td>${esc(a.name)}</td><td>${Number(a.downloads||0).toLocaleString()}</td><td><a href="${link}">${link}</a></td></tr>`});
 $('appsTable').innerHTML=rows||`<tr><td colspan="5">لا يوجد محتوى بعد.</td></tr>`;$('statsApps').innerHTML=stats||`<tr><td colspan="3">لا توجد بيانات.</td></tr>`;$('mApps').textContent=apps.size;$('mDownloads').textContent=downloads.toLocaleString();
 if(isOwner()){const users=await getDocs(query(collection(db,"users"),limit(1000)));$('mUsers').textContent=users.size;$('usersTable').innerHTML=[...users.docs].map(s=>{const u=s.data();return `<tr><td>${esc(u.email)}</td><td>${esc(u.name)}</td><td>${u.lastLogin?.toDate?u.lastLogin.toDate().toLocaleString("ar-EG"):"-"}</td></tr>`}).join("")||`<tr><td colspan="3">لا يوجد مستخدمون.</td></tr>`}else{$('mUsers').textContent='—'}
 const statsDoc=await getDoc(doc(db,"stats","global"));$('mVisitors').textContent=statsDoc.exists()?Number(statsDoc.data().visitors||0).toLocaleString():"0";
 fillNotifApps();loadNotifs();
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeApp(b.dataset.delete));
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>startEdit(b.dataset.edit));
}
async function removeApp(id){if(!confirm("حذف العنصر؟ (وملفه من Google Drive لو أنت اللي رفعته)"))return;try{const found=await getDoc(doc(db,"apps",id));const a=found.exists()?found.data():null;let driveMsg='';if(a?.driveFileId){try{await deleteDriveFile(a.driveFileId)}catch(e){driveMsg=' (الملف على Drive بتاع حساب تاني فمتحذفش، احذفه من حساب صاحبه)'}}try{const sh=await getDocs(query(collection(db,'apps',id,'shots'),limit(10)));for(const d of sh.docs)await deleteDoc(d.ref)}catch{}await deleteDoc(doc(db,"apps",id));await logAdmin('حذف عنصر',a?.name||id);if(editId===id)resetForm();await refresh();if(driveMsg)alert('تم حذف العنصر'+driveMsg)}catch(e){alert("فشل الحذف: "+e.message)}}

$('appForm').onsubmit=async e=>{
 e.preventDefault();const file=$('apk').files[0];
 const status=$('uploadStatus'),btn=$("uploadBtn"),progress=$("uploadProgress"),bar=$("uploadBar"),percent=$("uploadPercent");
 if(!editId&&!file){status.textContent="اختار ملف الأول.";return}
 try{
  btn.disabled=true;btn.style.opacity='.65';
  const data={name:$('appName').value.trim(),version:$('appVersion').value.trim(),size:$('appSize').value.trim(),category:$('appCategory').value,kind:$('appKind').value,description:$('appDescription').value.trim(),updatedAt:serverTimestamp()};
  if(iconData!==undefined)data.iconURL=iconData;
  if(file){
   progress.classList.add('show');percent.classList.add('show');bar.style.width='0%';percent.textContent='0%';
   status.textContent='جاري الاتصال بـ Google Drive...';await authorizeDrive();
   status.textContent='جاري رفع الملف إلى Google Drive...';
   const drive=await uploadToDrive(file,n=>{bar.style.width=n+'%';percent.textContent=n+'%';status.textContent=`جاري رفع الملف... ${n}%`});
   bar.style.width='100%';percent.textContent='100%';
   data.sha256=await hashPromise;
   Object.assign(data,{downloadURL:drive.downloadURL,driveFileId:drive.id,fileName:file.name,mimeType:file.type||'application/octet-stream',ext:file.name.includes('.')?file.name.split('.').pop().toLowerCase():''});
   if(!data.size)data.size=`${(file.size/1048576).toFixed(1)} MB`;
  }
  status.textContent='جاري النشر...';
  let id=editId;
  if(editId){await updateDoc(doc(db,'apps',editId),data);if(file&&editData?.driveFileId){try{await deleteDriveFile(editData.driveFileId)}catch{}}}
  else{const d=await addDoc(collection(db,'apps'),{...data,iconURL:iconData||'',downloads:0,uploaderUid:auth.currentUser.uid,uploaderName:(auth.currentUser.displayName||auth.currentUser.email||'').slice(0,60),createdAt:serverTimestamp()});id=d.id;
   if($('notifyNew').checked){try{await addDoc(collection(db,'notifications'),{title:data.kind==='file'?'ملف جديد في المتجر':'تطبيق جديد في المتجر',body:data.name+(data.description?' — '+data.description.slice(0,80):''),appId:id,createdAt:serverTimestamp()})}catch(e){console.warn('notify',e)}}}
  await logAdmin(editId?'تعديل عنصر':'نشر عنصر',data.name);
  status.textContent='جاري حفظ اللقطات...';
  for(const sid of shotsDel){try{await deleteDoc(doc(db,'apps',id,'shots',sid))}catch{}}
  let k=0;for(const d of shotsNew){await addDoc(collection(db,'apps',id,'shots'),{data:d,order:Date.now()+(k++),createdAt:serverTimestamp()})}
  status.innerHTML=`<b>تم ${editId?'حفظ التعديلات':'النشر'} بنجاح.</b> <a href="app.html?id=${id}" target="_blank">فتح الصفحة</a>`;
  resetForm();await refresh();
 }catch(err){status.textContent='فشل العملية: '+err.message}
 finally{btn.disabled=false;btn.style.opacity='1'}
};

// ===== الإشعارات =====
function fillNotifApps(){$('nApp').innerHTML='<option value="">بدون</option>'+Object.entries(cache).map(([k,a])=>`<option value="${esc(k)}">${esc(a.name)}</option>`).join('')}
async function loadNotifs(){const s=await getDocs(query(collection(db,'notifications'),orderBy('createdAt','desc'),limit(30)));
 $('nTable').innerHTML=s.docs.map(d=>{const n=d.data();return `<tr><td>${esc(n.title)}</td><td>${esc((n.body||'').slice(0,60))}</td><td><button class="admin-btn danger" data-ndel="${d.id}">${ic('trash')}حذف</button></td></tr>`}).join('')||'<tr><td colspan="3">لا توجد إشعارات.</td></tr>';
 document.querySelectorAll('[data-ndel]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف الإشعار؟'))return;await deleteDoc(doc(db,'notifications',b.dataset.ndel));loadNotifs()})}
$('nSend').onclick=async()=>{const title=$('nTitle').value.trim(),body=$('nBody').value.trim();if(!title){$('nStatus').textContent='اكتب عنوان الإشعار.';return}
 const n={title:title.slice(0,80),body:body.slice(0,200),createdAt:serverTimestamp()};const app=$('nApp').value,link=safeUrl($('nLink').value);if(app)n.appId=app;else if(link)n.link=link;
 try{await addDoc(collection(db,'notifications'),n);logAdmin('إرسال إشعار',n.title);$('nStatus').textContent='تم إرسال الإشعار.';$('nTitle').value=$('nBody').value=$('nLink').value='';loadNotifs()}catch(e){$('nStatus').textContent='فشل: '+e.message}};

// ===== إعدادات المتجر =====
const SF={storeName:'sStoreName',storeSub:'sStoreSub',welcome:'sWelcome',tagline:'sTagline',defaultSort:'sSort',footerText:'sFooter',announceText:'sAnnText',announceLink:'sAnnLink',telegram:'sTelegram',whatsapp:'sWhatsapp',youtube:'sYoutube',contact:'sContact'};
async function loadStore(){let s={...STORE_DEF};try{const d=await getDoc(doc(db,'settings','store'));if(d.exists())s={...s,...d.data()}}catch{}
 Object.entries(SF).forEach(([k,id])=>$(id).value=s[k]??'');$('sReviews').checked=s.reviewsOn!==false;$('sStrips').checked=s.stripsOn!==false;$('sHero').checked=s.heroOn!==false;$('sStats').checked=s.statsOn!==false;$('sPage').value=String(s.pageSize||24);$('sStripN').value=String(s.stripCount||8);$('sAnnOn').checked=!!s.announceOn}
$('storeForm').onsubmit=async e=>{e.preventDefault();if(!isOwner())return;const d={};Object.entries(SF).forEach(([k,id])=>d[k]=$(id).value.trim());
 ['announceLink','telegram','whatsapp','youtube','contact'].forEach(k=>d[k]=d[k]?safeUrl(d[k]):'');
 d.reviewsOn=$('sReviews').checked;d.stripsOn=$('sStrips').checked;d.heroOn=$('sHero').checked;d.statsOn=$('sStats').checked;d.pageSize=+$('sPage').value;d.stripCount=+$('sStripN').value;d.announceOn=$('sAnnOn').checked;d.updatedAt=serverTimestamp();d.adminUid=auth.currentUser.uid;
 try{await setDoc(doc(db,'settings','store'),d,{merge:true});logAdmin('تعديل إعدادات المتجر');$('sStatus').textContent='تم حفظ إعدادات المتجر.'}catch(err){$('sStatus').textContent='فشل الحفظ: '+err.message}};
onUser(()=>{if(isOwner())loadStore()});

// ===== النسخ الاحتياطي والاسترجاع =====
const encV=v=>v&&typeof v.toMillis==='function'?{__ts:v.toMillis()}:Array.isArray(v)?v.map(encV):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encV(x)])):v;
const decV=v=>v&&typeof v==='object'?('__ts' in v?Timestamp.fromMillis(Number(v.__ts)||0):Array.isArray(v)?v.map(decV):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decV(x)]))):v;
$('bkExport').onclick=async()=>{const st=$('bkStatus');st.textContent='جاري تجهيز النسخة...';
 try{const apps=await getDocs(query(collection(db,'apps'),limit(200)));const out={version:1,exportedAt:new Date().toISOString(),apps:[],settings:null,notifications:[]};
  for(const d of apps.docs){const sh=await getDocs(query(collection(db,'apps',d.id,'shots'),limit(10)));out.apps.push({id:d.id,data:encV(d.data()),shots:sh.docs.map(s=>({id:s.id,data:encV(s.data())}))})}
  const se=await getDoc(doc(db,'settings','store'));out.settings=se.exists()?encV(se.data()):null;
  const nt=await getDocs(query(collection(db,'notifications'),limit(50)));out.notifications=nt.docs.map(n=>({id:n.id,data:encV(n.data())}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:'application/json'}));a.download=`error404-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  st.textContent=`تم تصدير ${out.apps.length} عنصر.`;logAdmin('تصدير نسخة احتياطية',`${out.apps.length} عنصر`)}
 catch(e){st.textContent='فشل التصدير: '+e.message}};
$('bkFile').onchange=async()=>{const f=$('bkFile').files[0];$('bkFile').value='';if(!f||!isOwner())return;const st=$('bkStatus');
 try{const o=JSON.parse(await f.text());if(!o||o.version!==1||!Array.isArray(o.apps))throw new Error('ملف النسخة غير صالح');
  const idOk=x=>/^[A-Za-z0-9_-]{5,40}$/.test(String(x));
  if(!confirm(`استرجاع ${o.apps.length} عنصر؟ العناصر الموجودة بنفس المعرّف هتتبدّل.`))return;
  st.textContent='جاري الاسترجاع...';let n=0;
  for(const a of o.apps){if(!idOk(a.id)||!a.data)continue;await setDoc(doc(db,'apps',a.id),decV(a.data));
   for(const s of (a.shots||[]).slice(0,10)){if(idOk(s.id)&&s.data)await setDoc(doc(db,'apps',a.id,'shots',s.id),decV(s.data))}n++}
  if(o.settings)await setDoc(doc(db,'settings','store'),decV(o.settings));
  st.textContent=`تم استرجاع ${n} عنصر.`;logAdmin('استرجاع نسخة احتياطية',`${n} عنصر`);await refresh()}
 catch(e){st.textContent='فشل الاسترجاع: '+e.message}};

// ===== إدارة الأدمنز (المالك فقط) =====
async function loadAdmins(){
 try{const s=await getDocs(query(collection(db,'roles'),limit(100)));
  $('admTable').innerHTML=s.docs.map(d=>{const r=d.data();return `<tr><td>${esc(r.name||'-')}</td><td dir="ltr">${esc(r.email)}</td><td dir="ltr">${esc(r.grantedBy||'')}</td><td><button class="admin-btn danger" data-revoke="${esc(d.id)}" data-em="${esc(r.email)}">${ic('trash')}إزالة</button></td></tr>`}).join('')||'<tr><td colspan="4">لا يوجد أدمنز بعد.</td></tr>';
  document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=()=>revokeAdmin(b.dataset.revoke,b.dataset.em))}catch(e){console.warn(e)}}
$('admAdd').onclick=async()=>{
 if(!isOwner())return;const st=$('admStatus'),email=$('admEmail').value.trim().toLowerCase();
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){st.textContent='اكتب إيميل صحيح.';return}
 if(email===ADMIN_EMAIL){st.textContent='ده حساب المالك بالفعل.';return}
 try{const q=await getDocs(query(collection(db,'users'),where('email','==',email),limit(1)));
  if(q.empty){st.textContent='مش لاقي حساب بالإيميل ده. لازم الشخص يسجّل دخول للمتجر مرة على الأقل.';return}
  const u=q.docs[0],ud=u.data();
  if(!confirm(`إضافة ${email} كأدمن؟ هيقدر ينشر ويعدّل ويحذف العناصر.`))return;
  await setDoc(doc(db,'roles',u.id),{role:'admin',email,name:String(ud.name||'').slice(0,200),grantedBy:auth.currentUser.email,grantedAt:serverTimestamp()});
  await setDoc(doc(db,'settings','store'),{adminUids:arrayUnion(u.id)},{merge:true});
  await logAdmin('إضافة أدمن',email);$('admEmail').value='';st.textContent='تمت إضافة الأدمن.';loadAdmins()}
 catch(e){st.textContent='فشل: '+e.message}};
async function revokeAdmin(uid,email){
 if(!isOwner()||!confirm(`إزالة صلاحية الأدمن من ${email}؟`))return;
 try{await deleteDoc(doc(db,'roles',uid));await setDoc(doc(db,'settings','store'),{adminUids:arrayRemove(uid)},{merge:true});await logAdmin('إزالة أدمن',email);loadAdmins()}
 catch(e){alert('فشل: '+e.message)}}

// ===== مراجعة طلبات المطورين وطلبات النشر (المالك والأدمن) =====
const reqCache={},subCache={};
const fmtT=x=>x?.toDate?x.toDate().toLocaleString('ar-EG'):'';
async function loadDevReqs(){
 try{const s=await getDocs(query(collection(db,'devRequests'),limit(100)));
  const rows=s.docs.map(d=>({id:d.id,...d.data()}));rows.forEach(r=>reqCache[r.id]=r);
  const pend=rows.filter(r=>r.status==='pending').sort((a,b)=>tsMs(a.createdAt)-tsMs(b.createdAt));
  const c=$('cntReq');c.textContent=pend.length;c.hidden=!pend.length;
  $('reqList').innerHTML=pend.map(r=>`<div class="review-card"><div class="rc-head"><div><b>${esc(r.name)}</b><small dir="ltr">${esc(r.email)} · ${fmtT(r.createdAt)}</small></div></div><div class="rc-body"><b>اللي هينشره:</b>\n${esc(r.plan)}${r.contact?`\n<b>تواصل:</b> ${esc(r.contact)}`:''}</div><div class="rc-actions"><button class="admin-btn primary" data-rok="${esc(r.id)}">${ic('check')}موافقة</button><button class="admin-btn danger" data-rno="${esc(r.id)}">${ic('x')}رفض</button></div></div>`).join('')||`<div class="n-empty"><span>مفيش طلبات جديدة</span></div>`;
  $('reqList').querySelectorAll('[data-rok]').forEach(b=>b.onclick=()=>approveReq(b.dataset.rok));
  $('reqList').querySelectorAll('[data-rno]').forEach(b=>b.onclick=()=>rejectReq(b.dataset.rno));
  const dv=await getDocs(query(collection(db,'roles'),where('role','==','developer'),limit(100)));
  $('devTable').innerHTML=dv.docs.map(d=>{const r=d.data();return `<tr><td>${esc(r.name||'-')}</td><td dir="ltr">${esc(r.email)}</td><td><button class="admin-btn danger" data-rev="${esc(d.id)}" data-em="${esc(r.email)}">${ic('trash')}سحب الصفة</button></td></tr>`}).join('')||'<tr><td colspan="3">لا يوجد مطورون بعد.</td></tr>';
  $('devTable').querySelectorAll('[data-rev]').forEach(b=>b.onclick=()=>revokeDev(b.dataset.rev,b.dataset.em));
 }catch(e){console.warn('devreq',e)}}
async function approveReq(uid){const r=reqCache[uid];if(!r||!confirm(`قبول ${r.name} كمطوّر؟`))return;
 try{const me=auth.currentUser.email;
  await setDoc(doc(db,'roles',uid),{role:'developer',email:r.email,name:String(r.name||'').slice(0,200),grantedBy:me,grantedAt:serverTimestamp()});
  await setDoc(doc(db,'devs',uid),{name:String(r.name||'').slice(0,60),at:serverTimestamp()});
  await updateDoc(doc(db,'devRequests',uid),{status:'approved',note:'',reviewedBy:me,updatedAt:serverTimestamp()});
  await logAdmin('قبول مطوّر',r.email);loadDevReqs()}catch(e){alert('فشل: '+e.message)}}
async function rejectReq(uid){const r=reqCache[uid];if(!r)return;const note=prompt('سبب الرفض (هيظهر للشخص):','');if(note===null)return;
 try{await updateDoc(doc(db,'devRequests',uid),{status:'rejected',note:note.trim().slice(0,300),reviewedBy:auth.currentUser.email,updatedAt:serverTimestamp()});await logAdmin('رفض طلب مطوّر',r.email);loadDevReqs()}catch(e){alert('فشل: '+e.message)}}
async function revokeDev(uid,email){if(!confirm(`سحب صفة المطوّر من ${email}؟`))return;
 try{await deleteDoc(doc(db,'roles',uid));try{await deleteDoc(doc(db,'devs',uid))}catch{}
  try{await updateDoc(doc(db,'devRequests',uid),{status:'rejected',note:'تم سحب صفة المطوّر.',reviewedBy:auth.currentUser.email,updatedAt:serverTimestamp()})}catch{}
  await logAdmin('سحب صفة مطوّر',email);loadDevReqs()}catch(e){alert('فشل: '+e.message)}}

const subCard=(r,pending)=>`<div class="review-card"><div class="rc-head"><div class="thumb">${tile(r)}</div><div><b>${esc(r.name)}</b><small>بواسطة ${esc(r.ownerName)} · ${fmtT(r.createdAt)}</small></div></div>
 <div class="rc-meta"><span>${esc(r.kind==='file'?'ملف':'برنامج')}</span><span>${esc(r.category)}</span><span>${esc(r.size||'')}</span>${r.version?`<span>v${esc(r.version)}</span>`:''}<span>${esc((r.ext||'').toUpperCase())}</span></div>
 ${r.description?`<div class="rc-body">${esc(r.description)}</div>`:''}
 ${/^[a-f0-9]{64}$/.test(r.sha256||'')?`<div class="rc-hash">SHA-256: ${esc(r.sha256)}</div>`:'<div class="rc-hash">بدون بصمة (الملف أكبر من 120MB أو لم تُحسب)</div>'}
 <div id="sh_${esc(r.id)}" class="rc-shots"></div>
 <div class="rc-actions"><a class="admin-btn" href="${esc(safeUrl(r.downloadURL)||'#')}" target="_blank" rel="noopener noreferrer">${ic('download')}تحميل للفحص</a>${/^[a-f0-9]{64}$/.test(r.sha256||'')?`<a class="admin-btn" href="https://www.virustotal.com/gui/file/${esc(r.sha256)}" target="_blank" rel="noopener noreferrer">${ic('shield')}VirusTotal</a>`:''}<button class="admin-btn" data-shots="${esc(r.id)}">${ic('image')}اللقطات</button>
 ${pending?`<button class="admin-btn primary" data-sok="${esc(r.id)}">${ic('check')}موافقة ونشر</button><button class="admin-btn danger" data-sno="${esc(r.id)}">${ic('x')}رفض</button>`:`<span class="pill ${r.status==='approved'?'ok':'bad'}">${r.status==='approved'?'تم النشر':'مرفوض'}</span>`}</div></div>`;
async function loadSubs(){
 try{const s=await getDocs(query(collection(db,'submissions'),limit(50)));
  const rows=s.docs.map(d=>({id:d.id,...d.data()}));rows.forEach(r=>subCache[r.id]=r);
  const pend=rows.filter(r=>r.status==='pending').sort((a,b)=>tsMs(a.createdAt)-tsMs(b.createdAt));
  const done=rows.filter(r=>r.status!=='pending').sort((a,b)=>tsMs(b.updatedAt)-tsMs(a.updatedAt)).slice(0,10);
  const c=$('cntSub');c.textContent=pend.length;c.hidden=!pend.length;
  $('subList').innerHTML=pend.map(r=>subCard(r,true)).join('')||`<div class="n-empty"><span>مفيش طلبات نشر جديدة</span></div>`;
  $('subDone').innerHTML=done.map(r=>subCard(r,false)).join('')||`<div class="n-empty"><span>لا يوجد</span></div>`;
  document.querySelectorAll('[data-shots]').forEach(b=>b.onclick=()=>showSubShots(b.dataset.shots));
  document.querySelectorAll('[data-sok]').forEach(b=>b.onclick=()=>approveSub(b.dataset.sok));
  document.querySelectorAll('[data-sno]').forEach(b=>b.onclick=()=>rejectSub(b.dataset.sno));
 }catch(e){console.warn('subs',e)}}
async function showSubShots(sid){const el=$('sh_'+sid);if(!el)return;
 try{const s=await getDocs(query(collection(db,'submissions',sid,'shots'),orderBy('order'),limit(10)));el.innerHTML=s.docs.map(d=>`<img src="${esc(d.data().data)}" alt="">`).join('')||'<small class="muted">لا توجد لقطات.</small>'}catch{el.textContent='تعذر تحميل اللقطات.'}}
async function approveSub(sid){const r=subCache[sid];if(!r||!confirm(`نشر "${r.name}" في المتجر؟ تأكد إنك فحصت الملف.`))return;
 try{const me=auth.currentUser.email;
  const ref=await addDoc(collection(db,'apps'),{name:r.name,kind:r.kind,category:r.category,description:r.description||'',version:r.version||'',size:r.size||'',iconURL:r.iconURL||'',downloadURL:r.downloadURL,driveFileId:r.driveFileId,fileName:r.fileName,mimeType:r.mimeType,ext:r.ext,sha256:r.sha256||'',downloads:0,uploaderUid:r.ownerUid,uploaderName:r.ownerName,uploaderRole:'developer',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  try{const sh=await getDocs(query(collection(db,'submissions',sid,'shots'),orderBy('order'),limit(10)));for(const d of sh.docs)await addDoc(collection(db,'apps',ref.id,'shots'),{data:d.data().data,order:d.data().order,createdAt:serverTimestamp()})}catch(e){console.warn('shots copy',e)}
  await updateDoc(doc(db,'submissions',sid),{status:'approved',appId:ref.id,note:'',reviewedBy:me,updatedAt:serverTimestamp()});
  try{await addDoc(collection(db,'notifications'),{title:r.kind==='file'?'ملف جديد في المتجر':'تطبيق جديد في المتجر',body:r.name+(r.description?' — '+r.description.slice(0,80):''),appId:ref.id,createdAt:serverTimestamp()})}catch{}
  await logAdmin('قبول ونشر طلب مطوّر',`${r.name} / ${r.ownerName}`);await refresh();loadSubs()}catch(e){alert('فشل النشر: '+e.message)}}
async function rejectSub(sid){const r=subCache[sid];if(!r)return;const note=prompt('سبب الرفض (هيظهر للمطوّر):','');if(note===null)return;
 try{await updateDoc(doc(db,'submissions',sid),{status:'rejected',note:note.trim().slice(0,300),reviewedBy:auth.currentUser.email,updatedAt:serverTimestamp()});await logAdmin('رفض طلب نشر',`${r.name} / ${r.ownerName}`);loadSubs()}catch(e){alert('فشل: '+e.message)}}
