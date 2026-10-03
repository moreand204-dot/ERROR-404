import {getFirestore,collection,doc,getDoc,setDoc,addDoc,updateDoc,getDocs,query,orderBy,limit,serverTimestamp,deleteDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {auth,db,ADMIN_EMAIL,esc,safeUrl,STORE_DEF,setPrefs,timeAgo,tsMs} from "./core.js";
import {signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {ic,hydrate,tile,extOf,kindLabel} from "./icons.js";

const DRIVE_CLIENT_ID="660209763876-4aochiriq3vsl5beo1rifqlctemn1dck.apps.googleusercontent.com";
const DRIVE_SCOPE="https://www.googleapis.com/auth/drive.file";
const $=id=>document.getElementById(id);
const themeIcon=()=>$('theme').innerHTML=ic(document.documentElement.classList.contains('light')?'moon':'sun');function theme(){setPrefs({theme:document.documentElement.classList.contains('light')?'dark':'light'});themeIcon()}themeIcon();$('theme').onclick=theme;hydrate();
$('shieldIcon').innerHTML=ic('shield');
$('apk').onchange=()=>{const f=$('apk').files[0];if(!f){$('apkName').textContent="لم يتم اختيار ملف";return}
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
  return {id:result.id,downloadURL:`https://drive.google.com/uc?export=download&id=${encodeURIComponent(result.id)}`};
}
async function deleteDriveFile(fileId){if(!fileId)return;await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,{method:'DELETE'});}

onAuthStateChanged(auth,async user=>{
 if(!user){$('adminLogin').hidden=false;$('dashboard').hidden=true;return}
 if(user.email!==ADMIN_EMAIL){$('adminLogin').hidden=false;$('dashboard').hidden=true;$('loginStatus').textContent="هذا الحساب ليس حساب الأدمن.";await signOut(auth);return}
 $('adminLogin').hidden=true;$('dashboard').hidden=false;$('adminEmail').textContent=user.email;
 await setDoc(doc(db,"users",user.uid),{email:user.email,name:user.displayName||"",photoURL:user.photoURL||"",lastLogin:serverTimestamp()},{merge:true});
 await refresh();
});


// ===== أيقونة العنصر: تصغير الصورة إلى 192px وتخزينها مع بيانات العنصر =====
let editId=null,editData=null,iconData; // undefined = بدون تغيير، '' = إزالة، نص = صورة جديدة
const cache={};
function makeIcon(file){return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const S=192,c=document.createElement('canvas');c.width=c.height=S;const m=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);URL.revokeObjectURL(url);res(c.toDataURL('image/webp',.85))};img.onerror=()=>rej(new Error('تعذر قراءة الصورة'));img.src=url})}
function showIcon(src){$('iconPreview').innerHTML=src?`<img src="${esc(src)}" alt="">`:ic('image');$('iconName').textContent=src?'تم اختيار الصورة':'بدون صورة — سيتم استخدام أيقونة حسب نوع الملف'}
$('iconFile').onchange=async()=>{const f=$('iconFile').files[0];if(!f)return;try{iconData=await makeIcon(f);showIcon(iconData)}catch(e){$('uploadStatus').textContent=e.message}};
$('iconClear').onclick=()=>{iconData='';$('iconFile').value='';showIcon('')};
function resetForm(){$('appForm').reset();editId=null;editData=null;iconData=undefined;showIcon('');$('apkName').textContent='اضغط هنا لاختيار الملف';$('formTitle').textContent='إضافة عنصر';$('uploadBtnText').textContent='رفع ونشر';$('cancelEdit').hidden=true;$('notifyWrap').hidden=false;$('uploadProgress').classList.remove('show');$('uploadPercent').classList.remove('show')}
$('cancelEdit').onclick=()=>{resetForm();$('uploadStatus').textContent=''};
function startEdit(id){const a=cache[id];if(!a)return;resetForm();editId=id;editData=a;
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
 const users=await getDocs(query(collection(db,"users"),limit(1000)));$('mUsers').textContent=users.size;$('usersTable').innerHTML=[...users.docs].map(s=>{const u=s.data();return `<tr><td>${esc(u.email)}</td><td>${esc(u.name)}</td><td>${u.lastLogin?.toDate?u.lastLogin.toDate().toLocaleString("ar-EG"):"-"}</td></tr>`}).join("")||`<tr><td colspan="3">لا يوجد مستخدمون.</td></tr>`;
 const statsDoc=await getDoc(doc(db,"stats","global"));$('mVisitors').textContent=statsDoc.exists()?Number(statsDoc.data().visitors||0).toLocaleString():"0";
 fillNotifApps();loadNotifs();
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeApp(b.dataset.delete));
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>startEdit(b.dataset.edit));
}
async function removeApp(id){if(!confirm("حذف العنصر وملفه من Google Drive؟"))return;try{const found=await getDoc(doc(db,"apps",id));const a=found.exists()?found.data():null;if(a?.driveFileId)await deleteDriveFile(a.driveFileId);await deleteDoc(doc(db,"apps",id));if(editId===id)resetForm();await refresh();}catch(e){alert("فشل الحذف: "+e.message)}}

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
   Object.assign(data,{downloadURL:drive.downloadURL,driveFileId:drive.id,fileName:file.name,mimeType:file.type||'application/octet-stream',ext:file.name.includes('.')?file.name.split('.').pop().toLowerCase():''});
   if(!data.size)data.size=`${(file.size/1048576).toFixed(1)} MB`;
  }
  status.textContent='جاري النشر...';
  let id=editId;
  if(editId){await updateDoc(doc(db,'apps',editId),data);if(file&&editData?.driveFileId){try{await deleteDriveFile(editData.driveFileId)}catch{}}}
  else{const d=await addDoc(collection(db,'apps'),{...data,iconURL:iconData||'',downloads:0,createdAt:serverTimestamp()});id=d.id;
   if($('notifyNew').checked){try{await addDoc(collection(db,'notifications'),{title:data.kind==='file'?'ملف جديد في المتجر':'تطبيق جديد في المتجر',body:data.name+(data.description?' — '+data.description.slice(0,80):''),appId:id,createdAt:serverTimestamp()})}catch(e){console.warn('notify',e)}}}
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
 try{await addDoc(collection(db,'notifications'),n);$('nStatus').textContent='تم إرسال الإشعار.';$('nTitle').value=$('nBody').value=$('nLink').value='';loadNotifs()}catch(e){$('nStatus').textContent='فشل: '+e.message}};

// ===== إعدادات المتجر =====
const SF={storeName:'sStoreName',storeSub:'sStoreSub',welcome:'sWelcome',tagline:'sTagline',defaultSort:'sSort',footerText:'sFooter',announceText:'sAnnText',announceLink:'sAnnLink',telegram:'sTelegram',whatsapp:'sWhatsapp',youtube:'sYoutube',contact:'sContact'};
async function loadStore(){let s={...STORE_DEF};try{const d=await getDoc(doc(db,'settings','store'));if(d.exists())s={...s,...d.data()}}catch{}
 Object.entries(SF).forEach(([k,id])=>$(id).value=s[k]??'');$('sReviews').checked=s.reviewsOn!==false;$('sAnnOn').checked=!!s.announceOn}
$('storeForm').onsubmit=async e=>{e.preventDefault();const d={};Object.entries(SF).forEach(([k,id])=>d[k]=$(id).value.trim());
 ['announceLink','telegram','whatsapp','youtube','contact'].forEach(k=>d[k]=d[k]?safeUrl(d[k]):'');
 d.reviewsOn=$('sReviews').checked;d.announceOn=$('sAnnOn').checked;d.updatedAt=serverTimestamp();
 try{await setDoc(doc(db,'settings','store'),d,{merge:true});$('sStatus').textContent='تم حفظ إعدادات المتجر.'}catch(err){$('sStatus').textContent='فشل الحفظ: '+err.message}};
loadStore();
