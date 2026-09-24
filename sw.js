// Caché del juego para la web publicada. Los archivos de assets/ llevan un hash en el nombre y no
// cambian nunca: se sirven de la caché. La página se pide siempre a la red (así cada versión nueva
// llega enseguida) y, sin conexión, sale la última guardada. Cada versión usa su propia caché y
// borra las anteriores.
const CACHE='pcf-0.23.14-muf5fw3x';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
const guardar=(req,res)=>{ if(res&&res.ok&&res.type==='basic'){ const copia=res.clone(); caches.open(CACHE).then(c=>c.put(req,copia)); } return res; };
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==self.location.origin) return;   // Supabase, fuentes: directo a la red
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>guardar(req,r)).catch(async()=>(await caches.match(req))||(await caches.match(new URL('./',self.registration.scope).href))||Response.error()));
    return;
  }
  if(url.pathname.includes('/assets/')){
    e.respondWith(caches.match(req).then(x=>x||fetch(req).then(r=>guardar(req,r))));
    return;
  }
  // íconos y fondos: de la caché si está, y se renueva por detrás
  e.respondWith(caches.match(req).then(x=>{ const red=fetch(req).then(r=>guardar(req,r)).catch(()=>x); return x||red; }));
});
