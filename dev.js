import {doc,getDoc,setDoc,updateDoc,addDoc,deleteDoc,collection,query,where,limit,getDocs,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {db,$,esc,onUser,currentRole,isStaff,getProfile,resizeImage,resizeFit,toast,badgeHTML,timeAgo,tsMs,auth} from "./core.js";
import {ic,hydrate,tile} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
import {authorizeDrive,uploadToDrive,deleteDriveFile} from "./drive.js";
mountHeader({page:'dev'});mountFooter();hydrate();
const box=$('#devBox');
const MSG_SENT='تم إرسال طلبك للإدارة، جاري فحص الطلب';
const DANGER=['exe','bat','cmd','scr','msi','vbs','ps1','com','jar','dll','sh','js','vbe','wsf','lnk','reg'];
const CATS=['تطبيقات','ألعاب','أدوات','ملفات','ترفيه','تعليم','تواصل اجتماعي','تعديل الصور','أخرى'];

onUser(async u=>{
 if(!u){box.innerHTML=`<div class="login-hint big">${ic('code')}<h2>حساب المطوّر</h2><span>سجّل الدخول أولًا لتقديم طلب مطوّر.</span><button class="admin-btn primary" id="dLogin">تسجيل الدخول</button></div>`;$('#dLogin').onclick=()=>window.openAuth?.();return}
 if(isStaff()){box.innerHTML=`<div class="login-hint big">${ic('shield')}<h2>أنت من الإدارة</h2><span>تنشر مباشرة من لوحة الأدمن، ومن هناك تراجع طلبات المطورين وطلبات النشر.</span><a class="admin-btn primary" href="admin.html">فتح لوحة الأدمن</a></div>`;return}
 if(currentRole==='developer')return renderDev(u);
 renderRequest(u);
});

/* ===== طلب التحوّل لمطوّر ===== */
async function renderRequest(u){
 let r=null;try{const s=await getDoc(doc(db,'devRequests',u.uid));if(s.exists())r=s.data()}catch{}
 if(r&&r.status==='pending'){box.innerHTML=`<div class="login-hint big">${ic('clock')}<h2>${MSG_SENT}</h2><span>هنراجع طلبك ونرد عليك هنا. تقدر ترجع لهذه الصفحة في أي وقت لمعرفة القرار.</span></div><div class="req-plan"><b>طلبك:</b><p>${esc(r.plan)}</p></div>`;return}
 if(r&&r.status==='approved'){box.innerHTML=`<div class="login-hint big">${ic('check')}<h2>تمت الموافقة على طلبك</h2><span>حدّث الصفحة لتفعيل لوحة المطوّر.</span><button class="admin-btn primary" onclick="location.reload()">تحديث</button></div>`;return}
 const rejected=r&&r.status==='rejected';
 box.innerHTML=`<h2 class="p-title">${ic('code')}حساب المطوّر</h2>
 <div class="notice">المطوّر المعتمد يقدر ينشر برامج وملفات في المتجر. كل عملية نشر بتتفحص من الإدارة قبل ما تظهر للناس. قدّم طلبك واكتب إيه اللي هتنشره.</div>
 ${rejected?`<div class="req-rejected">${ic('x')}<div><b>تم رفض طلبك السابق</b><p>${esc(r.note||'بدون سبب مذكور.')}</p><small>تقدر تعدّل وتقدّم من جديد.</small></div></div>`:''}
 <div class="field"><label>إيه اللي هتنشره؟ (نوع البرامج أو الملفات، وهل هي من تطويرك؟)</label><textarea id="rPlan" maxlength="600" placeholder="مثال: بطوّر أدوات وألعاب أندرويد وعايز أنشرها هنا...">${esc(rejected?r.plan:'')}</textarea><small class="muted" id="rCnt">0/600</small></div>
 <div class="field"><label>وسيلة تواصل (اختياري: تلجرام أو رابط أعمالك)</label><input id="rContact" maxlength="200" value="${esc(rejected?r.contact||'':'')}"></div>
 <div class="form-actions"><button class="admin-btn primary" id="rSend">${ic('send')}إرسال الطلب للإدارة</button></div><div class="status" id="rStatus"></div>`;
 const upd=()=>$('#rCnt').textContent=`${$('#rPlan').value.length}/600`;$('#rPlan').oninput=upd;upd();
 $('#rSend').onclick=async()=>{const plan=$('#rPlan').value.trim(),contact=$('#rContact').value.trim();
  if(plan.length<10){$('#rStatus').textContent='اكتب تفاصيل أكتر (10 حروف على الأقل).';return}
  const btn=$('#rSend');btn.disabled=true;
  try{const p=await getProfile(u.uid,{name:u.displayName,photoURL:u.photoURL});const name=p.name.slice(0,60);
   if(rejected)await updateDoc(doc(db,'devRequests',u.uid),{name,plan,contact,status:'pending',updatedAt:serverTimestamp()});
   else await setDoc(doc(db,'devRequests',u.uid),{uid:u.uid,name,email:u.email,plan,contact,status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   renderRequest(u)}
  catch(e){$('#rStatus').textContent='تعذر الإرسال: '+e.message;btn.disabled=false}};
}

/* ===== لوحة المطوّر ===== */
let iconData='',shots=[],hashP=Promise.resolve('');
function renderDev(u){
 iconData='';shots=[];
 box.innerHTML=`<h2 class="p-title">${ic('code')}لوحة المطوّر ${badgeHTML('developer')}</h2>
 <div class="notice">كل ما تنشره بيروح للإدارة للفحص أولًا، وبعد الموافقة بيظهر في المتجر باسمك. ممنوع الملفات التنفيذية (exe, bat, ...) وأي ملف ضار. الملفات بتترفع على Google Drive الخاص بحسابك.</div>
 <form id="sForm">
 <div class="field"><label>أيقونة العنصر (اختياري)</label><div class="icon-pick"><div class="icon-preview" id="sIconPrev">${ic('image')}</div><div class="icon-btns"><label class="admin-btn" for="sIcon">${ic('image')}اختيار صورة</label><input id="sIcon" type="file" accept="image/*" hidden></div></div></div>
 <div class="field"><label>الاسم</label><input id="sName" maxlength="80" required></div>
 <div class="form-grid"><div class="field"><label>النوع</label><select id="sKind"><option value="app">برنامج</option><option value="file">ملف</option></select></div>
 <div class="field"><label>التصنيف</label><select id="sCat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
 <div class="field"><label>الإصدار (اختياري)</label><input id="sVer" maxlength="30" placeholder="1.0.0"></div>
 <div class="field"><label>الحجم</label><input id="sSize" maxlength="30" placeholder="يُحسب تلقائيًا"></div></div>
 <div class="field"><label>الوصف</label><textarea id="sDesc" maxlength="1000"></textarea></div>
 <div class="field"><label>لقطات الشاشة (حتى 6)</label><div class="shots-edit" id="sShots"></div><label class="admin-btn" for="sShotsF">${ic('image')}إضافة لقطات</label><input id="sShotsF" type="file" accept="image/*" multiple hidden></div>
 <div class="field"><div class="drop"><label for="sFile">${ic('upload')}اختيار الملف</label><input id="sFile" type="file"><span class="file-name" id="sFileName">اضغط لاختيار الملف</span><div class="upload-progress" id="sProg"><i id="sBar"></i></div></div></div>
 <div class="form-actions"><button class="admin-btn primary" id="sSend" type="submit">${ic('send')}إرسال للإدارة للفحص</button></div><div class="status" id="sStatus"></div></form>
 <h2 class="p-title" style="margin-top:18px">طلباتي</h2><div id="mySubs"></div>`;
 $('#sIcon').onchange=async()=>{const f=$('#sIcon').files[0];if(!f)return;try{for(const S of [192,128,96]){iconData=await resizeImage(f,S,.85);if(iconData.length<=55000)break}$('#sIconPrev').innerHTML=`<img src="${esc(iconData)}" alt="">`}catch(e){toast(e.message,'err')}};
 $('#sShotsF').onchange=async()=>{const fs=[...$('#sShotsF').files];$('#sShotsF').value='';
  for(const f of fs){if(shots.length>=6)break;try{let d='';for(const [m,q] of [[900,.7],[800,.6],[640,.55]]){d=await resizeFit(f,m,q);if(d.length<=420000)break}if(d.length<=440000)shots.push(d)}catch(e){toast(e.message,'err')}}paintShots()};
 const paintShots=()=>{$('#sShots').innerHTML=shots.map((d,i)=>`<div class="shot-t"><img src="${esc(d)}" alt=""><button type="button" data-i="${i}" aria-label="حذف">${ic('x')}</button></div>`).join('');$('#sShots').querySelectorAll('button').forEach(b=>b.onclick=()=>{shots.splice(+b.dataset.i,1);paintShots()})};
 $('#sFile').onchange=()=>{const f=$('#sFile').files[0];hashP=Promise.resolve('');if(!f){$('#sFileName').textContent='اضغط لاختيار الملف';return}
  const ex=f.name.includes('.')?f.name.split('.').pop().toLowerCase():'';
  if(DANGER.includes(ex)){alert(`ملفات .${ex} غير مسموحة للنشر في المتجر.`);$('#sFile').value='';$('#sFileName').textContent='اضغط لاختيار الملف';return}
  hashP=f.size<=120*1048576?f.arrayBuffer().then(b=>crypto.subtle.digest('SHA-256',b)).then(h=>[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')).catch(()=>''):Promise.resolve('');
  $('#sFileName').textContent=`${f.name} — ${(f.size/1048576).toFixed(1)} MB`;
  if(!$('#sName').value.trim())$('#sName').value=f.name.replace(/\.[^.]+$/,'').slice(0,80);
  $('#sSize').value=f.size>=1048576?`${(f.size/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(f.size/1024))} KB`;
  $('#sKind').value=ex==='apk'?'app':'file';$('#sCat').value=ex==='apk'?'تطبيقات':'ملفات'};
 $('#sForm').onsubmit=e=>{e.preventDefault();submit(u)};
 loadMine(u);
}

async function submit(u){
 const f=$('#sFile').files[0],st=$('#sStatus'),btn=$('#sSend');
 if(!f){st.textContent='اختار الملف الأول.';return}
 const name=$('#sName').value.trim();if(!name){st.textContent='اكتب اسم العنصر.';return}
 const ext=f.name.includes('.')?f.name.split('.').pop().toLowerCase().slice(0,10):'';
 if(DANGER.includes(ext)){st.textContent='نوع الملف غير مسموح.';return}
 btn.disabled=true;$('#sProg').classList.add('show');
 try{
  st.textContent='جاري الاتصال بـ Google Drive...';await authorizeDrive();
  st.textContent='جاري رفع الملف...';const drive=await uploadToDrive(f,n=>{$('#sBar').style.width=n+'%';st.textContent=`جاري رفع الملف... ${n}%`});
  const sha=await hashP;const p=await getProfile(u.uid,{name:u.displayName,photoURL:u.photoURL});
  st.textContent='جاري إرسال الطلب للإدارة...';
  const ref=await addDoc(collection(db,'submissions'),{ownerUid:u.uid,ownerName:p.name.slice(0,60),name:name.slice(0,80),kind:$('#sKind').value,category:$('#sCat').value,description:$('#sDesc').value.trim().slice(0,1000),version:$('#sVer').value.trim().slice(0,30),size:$('#sSize').value.trim().slice(0,30),iconURL:iconData,downloadURL:drive.downloadURL,driveFileId:drive.id,fileName:f.name.slice(0,200),mimeType:(f.type||'application/octet-stream').slice(0,120),ext,sha256:/^[a-f0-9]{64}$/.test(sha)?sha:'',status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  let k=0;for(const d of shots){await addDoc(collection(db,'submissions',ref.id,'shots'),{data:d,order:Date.now()+(k++),createdAt:serverTimestamp()})}
  toast(MSG_SENT,'ok');renderDev(u);$('#sStatus').innerHTML=`<b>${MSG_SENT}</b>`;
 }catch(e){st.textContent='فشل الإرسال: '+e.message;btn.disabled=false;$('#sProg').classList.remove('show')}
}

const PILL={pending:['قيد الفحص','warn'],approved:['تم النشر','ok'],rejected:['مرفوض','bad']};
async function loadMine(u){
 const el=$('#mySubs');
 try{const s=await getDocs(query(collection(db,'submissions'),where('ownerUid','==',u.uid),limit(50)));
  const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>tsMs(b.createdAt)-tsMs(a.createdAt));
  el.innerHTML=rows.map(r=>{const [t,c]=PILL[r.status]||['—',''];return `<div class="sub-item"><div class="thumb">${tile(r)}</div><div class="sub-main"><b>${esc(r.name)}</b><small>${esc(r.category)} · ${esc(r.size||'')} · ${timeAgo(tsMs(r.createdAt))}</small>${r.status==='rejected'&&r.note?`<p class="muted">السبب: ${esc(r.note)}</p>`:''}</div><div class="sub-side"><span class="pill ${c}">${t}</span>${r.status==='approved'&&r.appId?`<a class="admin-btn" href="app.html?id=${encodeURIComponent(r.appId)}">فتح</a>`:''}${r.status!=='approved'?`<button class="admin-btn danger" data-del="${r.id}" data-file="${esc(r.driveFileId||'')}">${ic('trash')}</button>`:''}</div></div>`}).join('')||`<div class="n-empty">${ic('folder')}<span>لسه ما نشرتش حاجة</span></div>`;
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف الطلب؟ (وملفه من Google Drive بتاعك)'))return;
   try{try{await deleteDriveFile(b.dataset.file)}catch{}await deleteDoc(doc(db,'submissions',b.dataset.del));loadMine(u)}catch(e){toast('تعذر الحذف','err')}})
 }catch(e){el.innerHTML='<div class="n-empty"><span>تعذر تحميل طلباتك.</span></div>'}
}
