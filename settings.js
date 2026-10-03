import {$,ACCENTS,getPrefs,setPrefs,applyPrefs,favs,saveFavs,onUser,logout,toast} from "./core.js";
import {ic} from "./icons.js";
import {mountHeader,mountFooter} from "./layout.js";
import {permission,askPermission,showSystem} from "./notify.js";
mountHeader({page:'settings'});mountFooter();
$('#sTitle').innerHTML=`${ic('gear')}الإعدادات`;$('#h1').innerHTML=`${ic('sliders')}العرض والمظهر`;$('#h2').innerHTML=`${ic('bell')}الإشعارات`;$('#h3').innerHTML=`${ic('user')}البيانات والحساب`;

function paint(){const p=getPrefs();
 document.querySelectorAll('.seg').forEach(s=>s.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.val===p[s.dataset.pref])));
 $('#swatches').innerHTML=ACCENTS.map(a=>`<button class="swatch ${a.id===p.accent?'on':''}" data-a="${a.id}" title="${a.label}" aria-label="${a.label}" style="background:linear-gradient(135deg,${a.c[0]},${a.c[1]})">${a.id===p.accent?ic('check'):''}</button>`).join('');
 $('#swatches').querySelectorAll('button').forEach(b=>b.onclick=()=>{setPrefs({accent:b.dataset.a});paint()});
 $('#sortSel').value=p.sort;$('#notifyOn').checked=p.notify!=='off';
 const pm=permission();
 $('#permText').textContent=pm==='granted'?'مفعلة على هذا الجهاز':pm==='denied'?'محجوبة — فعّلها من إعدادات المتصفح للموقع':pm==='unsupported'?'هذا المتصفح لا يدعم الإشعارات':'لم يتم التفعيل بعد';
 $('#permBtn').hidden=pm!=='default';$('#testBtn').hidden=pm!=='granted';
 $('#favCount').textContent=`${favs().size} عنصر في المفضلة`}
document.querySelectorAll('.seg').forEach(s=>s.querySelectorAll('button').forEach(b=>b.onclick=()=>{setPrefs({[s.dataset.pref]:b.dataset.val});paint()}));
$('#sortSel').onchange=e=>setPrefs({sort:e.target.value});
$('#notifyOn').onchange=e=>setPrefs({notify:e.target.checked?'on':'off'});
$('#permBtn').onclick=async()=>{const r=await askPermission();toast(r==='granted'?'تم تفعيل إشعارات الجهاز':'لم يتم السماح بالإشعارات',r==='granted'?'ok':'err');paint()};
$('#testBtn').onclick=()=>showSystem({id:'test',title:'إشعار تجريبي',body:'الإشعارات شغالة على جهازك'});
$('#clearFav').onclick=()=>{if(confirm('مسح كل المفضلة؟')){saveFavs(new Set());paint()}};
$('#resetPrefs').onclick=()=>{localStorage.removeItem('prefs');localStorage.removeItem('theme');applyPrefs();paint();toast('تمت إعادة الضبط')};
onUser(u=>{$('#accText').textContent=u?u.email:'غير مسجل الدخول';$('#accProfile').hidden=!u;$('#accBtn').textContent=u?'تسجيل الخروج':'تسجيل الدخول';$('#accBtn').onclick=()=>u?logout():window.openAuth?.()});
paint();
