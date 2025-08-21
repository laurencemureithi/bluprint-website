
const CACHE = 'bluprint-v1';
const ASSETS = [
  './index.html','./work.html','./services.html','./about.html','./contact.html',
  './assets/styles.css','./assets/main.js','./assets/logo.svg','./assets/pattern.svg'
];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      const copy = res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); return res;
    }).catch(()=> caches.match('./index.html')))
  );
});
