const root=document.documentElement;
if(localStorage.theme==="light")root.classList.add("light");
document.addEventListener("click",e=>{
 if(e.target.closest("#themeBtn")){root.classList.toggle("light");localStorage.theme=root.classList.contains("light")?"light":"dark"}
 if(e.target.closest("#menuBtn"))document.querySelector("#nav")?.classList.toggle("open");
});
const apps=[
["WhatsApp Plus","4.8","75 MB","wa"],["Telegram Plus","4.7","68 MB","tg"],["TikTok Mod","4.6","120 MB","tt"],["Minecraft","4.5","210 MB","mc"],["ZArchiver","4.7","12 MB","za"],["CapCut Pro","4.6","150 MB","cc"]
];
const grid=document.querySelector("#appsGrid");
if(grid)grid.innerHTML=apps.map(a=>`<article class="app-card"><div class="app-icon ${a[3]}">${a[3].toUpperCase()}</div><h3>${a[0]}</h3><p>★ ${a[1]}</p><small>تطبيقات · ${a[2]}</small><button onclick="location.href='app.html'">تحميل</button></article>`).join("");
const search=document.querySelector("#search");
if(search)search.addEventListener("input",()=>document.querySelectorAll(".app-card").forEach(c=>c.hidden=!c.innerText.toLowerCase().includes(search.value.toLowerCase())));
function login(){if(document.querySelector("#user").value==="admin"&&document.querySelector("#pass").value==="404404")location.href="admin.html";else alert("بيانات الدخول التجريبية غير صحيحة");}