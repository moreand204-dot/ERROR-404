import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,setDoc,addDoc,getDocs,query,orderBy,limit,serverTimestamp,deleteDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo",authDomain:"ourstory-f33db.firebaseapp.com",projectId:"ourstory-f33db",storageBucket:"ourstory-f33db.firebasestorage.app",messagingSenderId:"685629313835",appId:"1:685629313835:web:fb06292932019eabc56b6e",measurementId:"G-9TBR9QFHQR"};
const ADMIN_EMAIL="moreand458@gmail.com";
const DRIVE_CLIENT_ID="660209763876-4aochiriq3vsl5beo1rifqlctemn1dck.apps.googleusercontent.com";
const DRIVE_SCOPE="https://www.googleapis.com/auth/drive.file";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id); const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const shield=`<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-5"/></svg>`;
const sun=`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const moon=`<svg viewBox="0 0 24 24"><path d="M20.8 14.1A8.5 8.5 0 0 1 9.9 3.2 8.6 8.6 0 1 0 20.8 14.1Z"/></svg>`;
function theme(){document.documentElement.classList.toggle("light");localStorage.theme=document.documentElement.classList.contains("light")?"light":"dark";$('theme').innerHTML=document.documentElement.classList.contains("light")?moon:sun} if(localStorage.theme==="light")document.documentElement.classList.add("light");$('theme').innerHTML=document.documentElement.classList.contains("light")?moon:sun;$('theme').onclick=theme;
$('shieldIcon').innerHTML=shield;
$('apk').onchange=()=>{const f=$('apk').files[0];$('apkName').textContent=f?`${f.name} — ${(f.size/1024/1024).toFixed(1)} MB`:"لم يتم اختيار ملف"};
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
  const meta={name:file.name,mimeType:'application/vnd.android.package-archive'};
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

async function refresh(){
 const apps=await getDocs(query(collection(db,"apps"),orderBy("createdAt","desc"),limit(100)));
 let downloads=0,rows="",stats="";
 apps.forEach(s=>{const a=s.data();downloads+=Number(a.downloads||0);const link=`app.html?id=${encodeURIComponent(s.id)}`;rows+=`<tr><td>${esc(a.name)}</td><td>${esc(a.version)}</td><td>${Number(a.downloads||0).toLocaleString()}</td><td><a class="admin-btn" href="${link}" target="_blank">فتح</a> <button class="admin-btn danger" data-delete="${s.id}">حذف</button></td></tr>`;stats+=`<tr><td>${esc(a.name)}</td><td>${Number(a.downloads||0).toLocaleString()}</td><td><a href="${link}">${link}</a></td></tr>`});
 $('appsTable').innerHTML=rows||`<tr><td colspan="4">لا توجد تطبيقات بعد.</td></tr>`;$('statsApps').innerHTML=stats||`<tr><td colspan="3">لا توجد بيانات.</td></tr>`;$('mApps').textContent=apps.size;$('mDownloads').textContent=downloads.toLocaleString();
 const users=await getDocs(query(collection(db,"users"),limit(1000)));$('mUsers').textContent=users.size;$('usersTable').innerHTML=[...users.docs].map(s=>{const u=s.data();return `<tr><td>${esc(u.email)}</td><td>${esc(u.name)}</td><td>${u.lastLogin?.toDate?u.lastLogin.toDate().toLocaleString("ar-EG"):"-"}</td></tr>`}).join("")||`<tr><td colspan="3">لا يوجد مستخدمون.</td></tr>`;
 const statsDoc=await getDoc(doc(db,"stats","global"));$('mVisitors').textContent=statsDoc.exists()?Number(statsDoc.data().visitors||0).toLocaleString():"0";
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeApp(b.dataset.delete));
}
async function removeApp(id){if(!confirm("حذف التطبيق وملف APK من Google Drive؟"))return;try{const found=await getDoc(doc(db,"apps",id));const a=found.exists()?found.data():null;if(a?.driveFileId)await deleteDriveFile(a.driveFileId);await deleteDoc(doc(db,"apps",id));await refresh();}catch(e){alert("فشل الحذف: "+e.message)}}

$('appForm').onsubmit=async e=>{
 e.preventDefault();const file=$('apk').files[0];if(!file)return;
 if(!file.name.toLowerCase().endsWith('.apk')){$('uploadStatus').textContent="اختار ملف APK فقط.";return;}
 const status=$('uploadStatus'),btn=$("uploadBtn"),progress=$("uploadProgress"),bar=$("uploadBar"),percent=$("uploadPercent");
 try{
   btn.disabled=true;btn.style.opacity='.65';progress.classList.add('show');percent.classList.add('show');bar.style.width='0%';percent.textContent='0%';status.textContent='جاري الاتصال بـ Google Drive...';await authorizeDrive();
   status.textContent='جاري رفع APK إلى Google Drive...';
   const drive=await uploadToDrive(file,n=>{bar.style.width=n+'%';percent.textContent=n+'%';status.textContent=`جاري رفع APK إلى Google Drive... ${n}%`});
   status.textContent='تم الرفع، جاري نشر التطبيق لحظيًا...';bar.style.width='100%';percent.textContent='100%';
   const d=await addDoc(collection(db,"apps"),{name:$('appName').value.trim(),version:$('appVersion').value.trim(),size:$('appSize').value.trim()||`${(file.size/1024/1024).toFixed(1)} MB`,category:$('appCategory').value,description:$('appDescription').value.trim(),downloadURL:drive.downloadURL,driveFileId:drive.id,downloads:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   status.innerHTML=`<b>✓ تم نشر التطبيق فعليًا.</b> <a href="app.html?id=${d.id}" target="_blank">فتح صفحة التطبيق</a>`;e.target.reset();$('apkName').textContent='لم يتم اختيار ملف';await refresh();
 }catch(err){status.textContent='فشل الرفع: '+err.message}
 finally{btn.disabled=false;btn.style.opacity='1'}
};
