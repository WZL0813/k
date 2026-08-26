/* Service Worker — 离线缓存,首次联网打开后断网也能用 */
var CACHE='muyu-v4';
var ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(function(hit){
    var net=fetch(e.request).then(function(res){
      if(res&&(res.ok||res.type==='opaque')){var cl=res.clone();caches.open(CACHE).then(function(c){c.put(e.request,cl);}).catch(function(){});}
      return res;
    }).catch(function(){return hit;});
    return hit||net;
  }));
});
