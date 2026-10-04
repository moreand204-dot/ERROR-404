import {doc,getDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {db,$,esc,onUser,onStore,saveProfile,avatar,toast,resizeImage,roleOfUid,badgeHTML} from "./core.js";
import {ic} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
mountHeader({page:'profile'});mountFooter();
const box=$('#profileBox'),uidParam=new URLSearchParams(location.search).get('uid');

onUser(async u=>{
 const uid=uidParam||u?.uid;
 if(!uid){box.innerHTML=`<div class="login-hint big">${ic('user')}<h2>ملفك الشخصي</h2><span>سجّل الدخول لإنشاء بروفايلك: صورة واسم ونبذة عنك.</span><button class="admin-btn primary" id="pLogin">تسجيل الدخول</button></div>`;$('#pLogin').onclick=()=>window.openAuth?.();return}
 const own=!!u&&u.uid===uid;let raw={};let devRole=null;getDoc(doc(db,'devs',uid)).then(d=>{if(d.exists()){devRole='developer';const el=$('#roleSlot');if(el&&!roleOfUid(uid))el.innerHTML=badgeHTML('developer')}}).catch(()=>{});
 onStore(()=>{const el=$('#roleSlot');if(el)el.innerHTML=badgeHTML(roleOfUid(uid)||devRole)});
 try{const s=await getDoc(doc(db,'profiles',uid));if(s.exists())raw=s.data()}catch{}
 const p={name:raw.name||(own?u.displayName:'')||'مستخدم',bio:raw.bio||'',photoURL:raw.photoURL||(own?u.photoURL:'')||''};
 document.title=`${p.name} — ERROR 404`;
 if(!own){box.innerHTML=`<div class="profile-view">${avatar(p,'xl')}<h1>${esc(p.name)}</h1><div id="roleSlot"></div><p class="bio">${esc(p.bio||'لا توجد نبذة.')}</p></div>`;return}

 let newPhoto; // undefined = بدون تغيير
 box.innerHTML=`<h2 class="p-title">${ic('user')}ملفي الشخصي <span id="roleSlot"></span></h2>
 <div class="p-avatar"><div id="pAvatar">${avatar(p,'xl')}</div><div class="p-btns"><label class="admin-btn" for="pPhoto">${ic('camera')}تغيير الصورة</label><input id="pPhoto" type="file" accept="image/*" hidden><button class="admin-btn" id="pPhotoDel" type="button">${ic('x')}إزالة الصورة</button></div></div>
 <div class="field"><label>الاسم (حتى 40 حرف)</label><input id="pName" maxlength="40" value="${esc(p.name)}"></div>
 <div class="field"><label>نبذة عنك (حتى 200 حرف)</label><textarea id="pBio" maxlength="200" placeholder="اكتب شيئًا عن نفسك...">${esc(p.bio)}</textarea><small class="muted" id="bioCount">${p.bio.length}/200</small></div>
 <div class="field"><label>البريد (خاص — لا يظهر للآخرين)</label><input value="${esc(u.email||'')}" disabled></div>
 <div class="form-actions"><button class="admin-btn primary" id="pSave">${ic('check')}حفظ البروفايل</button><a class="admin-btn" href="profile.html?uid=${encodeURIComponent(u.uid)}" id="pView" hidden></a></div><div class="status" id="pStatus"></div>`;
 $('#pBio').oninput=()=>$('#bioCount').textContent=`${$('#pBio').value.length}/200`;
 $('#pPhoto').onchange=async()=>{const f=$('#pPhoto').files[0];if(!f)return;try{newPhoto=await resizeImage(f,160,.85);$('#pAvatar').innerHTML=avatar({name:$('#pName').value,photoURL:newPhoto},'xl')}catch(e){toast(e.message,'err')}};
 $('#pPhotoDel').onclick=()=>{newPhoto='';$('#pAvatar').innerHTML=avatar({name:$('#pName').value,photoURL:u.photoURL||''},'xl')};
 $('#pSave').onclick=async()=>{const name=$('#pName').value.trim();if(!name){$('#pStatus').textContent='الاسم مطلوب.';return}
  const btn=$('#pSave');btn.disabled=true;
  try{await saveProfile(u,{name:name.slice(0,40),bio:$('#pBio').value.trim().slice(0,200),photoURL:newPhoto!==undefined?newPhoto:(raw.photoURL||'')});
   toast('تم حفظ البروفايل','ok');$('#pStatus').textContent='';raw={...raw,photoURL:newPhoto!==undefined?newPhoto:raw.photoURL};newPhoto=undefined}
  catch(e){$('#pStatus').textContent='تعذر الحفظ: '+e.message}finally{btn.disabled=false}};
});
