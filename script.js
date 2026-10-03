const root=document.documentElement;
const saved=localStorage.getItem("theme");
if(saved==="light") root.classList.add("light");
document.addEventListener("click",e=>{
 const b=e.target.closest("#themeBtn"); if(!b)return;
 root.classList.toggle("light"); localStorage.setItem("theme",root.classList.contains("light")?"light":"dark");
});
const apps=[
 ["WhatsApp Plus","4.8","75 MB","wa","app.html"],["Telegram Plus","4.7","68 MB","tg","app.html"],["TikTok Mod","4.6","120 MB","tt","app.html"],["Minecraft","4.5","210 MB","mc","app.html"],["ZArchiver","4.7","12 MB","za","app.html"],["CapCut Pro","4.6","150 MB","cc","app.html"]
];
const grid=document.querySelector("#apps");
if(grid) grid.innerHTML=apps.map(a=>`<article class="app-card"><div class="app-icon ${a[3]}">${a[3].toUpperCase()}</div><h3>${a[0]}</h3><p>★ ${a[1]}</p><small>${a[3]==="wa"?"تواصل اجتماعي":"أدوات"}</small><small>${a[2]}</small><button onclick="location.href='${a[4]}'">تحميل</button></article>`).join("");
const search=document.querySelector("#search");
if(search) search.addEventListener("input",()=>document.querySelectorAll(".app-card").forEach(c=>c.style.display=c.innerText.includes(search.value)?"block":"none"));
function login(){const u=document.querySelector("#user").value,p=document.querySelector("#pass").value;if(u==="admin"&&p==="404404")location.href="admin.html";else alert("بيانات الدخول التجريبية غير صحيحة");}