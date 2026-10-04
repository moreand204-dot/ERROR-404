// رفع الملفات على Google Drive الخاص بالمستخدم نفسه (نطاق drive.file فقط: يشوف الملفات اللي رفعها التطبيق بس)
const DRIVE_CLIENT_ID="660209763876-4aochiriq3vsl5beo1rifqlctemn1dck.apps.googleusercontent.com";
const DRIVE_SCOPE="https://www.googleapis.com/auth/drive.file";
let tokenClient=null,accessToken=null;
const loadGIS=()=>new Promise((res,rej)=>{if(window.google?.accounts?.oauth2)return res();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=res;s.onerror=()=>rej(new Error('تعذر تحميل Google Identity Services.'));document.head.appendChild(s)});
export async function authorizeDrive(){
 await loadGIS();
 if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:DRIVE_CLIENT_ID,scope:DRIVE_SCOPE,callback:()=>{}});
 return new Promise((resolve,reject)=>{
  tokenClient.callback=r=>{if(r.error)return reject(new Error(r.error_description||r.error));accessToken=r.access_token;resolve(accessToken)};
  tokenClient.requestAccessToken({prompt:accessToken?'':'consent'})})}
async function driveFetch(url,options={}){
 if(!accessToken)await authorizeDrive();
 const go=()=>fetch(url,{...options,headers:{Authorization:`Bearer ${accessToken}`,...(options.headers||{})}});
 let res=await go();if(res.status===401){await authorizeDrive();res=await go()}
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error?.message||`Google Drive error ${res.status}`);return data}
export async function uploadToDrive(file,onProgress=()=>{}){
 if(!accessToken)await authorizeDrive();
 const meta={name:file.name,mimeType:file.type||'application/octet-stream'};
 const init=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':meta.mimeType,'X-Upload-Content-Length':String(file.size)},body:JSON.stringify(meta)});
 if(!init.ok)throw new Error((await init.text())||`تعذر بدء رفع Google Drive (${init.status})`);
 const session=init.headers.get('Location');if(!session)throw new Error('Google Drive لم يرجع رابط جلسة الرفع.');
 const result=await new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('PUT',session,true);x.setRequestHeader('Content-Type',meta.mimeType);
  x.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100))};
  x.onload=()=>{if(x.status>=200&&x.status<300){try{resolve(JSON.parse(x.responseText))}catch{reject(new Error('استجابة غير صالحة من Google Drive.'))}}else reject(new Error(`فشل رفع الملف إلى Google Drive (${x.status})`))};
  x.onerror=()=>reject(new Error('انقطع الاتصال أثناء الرفع.'));x.onabort=()=>reject(new Error('تم إلغاء الرفع.'));x.send(file)});
 try{await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}/permissions?supportsAllDrives=true`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'reader',type:'anyone'})})}
 catch(e){throw new Error('تم رفع الملف لكن تعذر جعله متاحًا للزوار: '+e.message)}
 return {id:result.id,downloadURL:`https://drive.usercontent.google.com/download?id=${encodeURIComponent(result.id)}&export=download&confirm=t`}}
export async function deleteDriveFile(id){if(!id)return;await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,{method:'DELETE'})}
