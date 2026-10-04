self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  let url=new URL('index.html',self.registration.scope).href;
  try{const u=new URL(e.notification.data?.url||'index.html',self.registration.scope);if(/^https?:$/.test(u.protocol))url=u.href}catch{}
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c){try{c.navigate(url)}catch{}return c.focus()}}
    return self.clients.openWindow(url)}));
});
// جاهز لإشعارات Push الحقيقية (FCM) في مرحلة لاحقة
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch{}
  e.waitUntil(self.registration.showNotification(d.title||'ERROR 404',{body:d.body||'',icon:'assets/icon-192.png',badge:'assets/icon-192.png',dir:'rtl',lang:'ar',data:{url:d.url||'index.html'}}));
});
