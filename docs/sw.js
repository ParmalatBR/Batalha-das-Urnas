/* V37/RC2: bounded runtime cache. This is not a guarantee of a complete offline install. */
importScripts('./pwa-cache-list.js');
const PREFIX='bdu-iphone-v37-';
const CACHE=PREFIX+self.BDU_CACHE_VERSION;
const BASE=new URL('./',self.location);
const KNOWN=new Set(self.BDU_CACHE_FILES.map(file=>new URL(file,BASE).href));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));

async function rangeResponse(request,response){
  const range=request.headers.get('range');
  if(!range)return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return fetch(request);
  const bytes=await response.arrayBuffer(),length=bytes.byteLength;
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),length-1):length-1):length-1;
  if(start>=length||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  const headers=new Headers(response.headers);
  headers.set('Content-Range',`bytes ${start}-${end}/${length}`);
  headers.set('Content-Length',String(end-start+1));
  headers.set('Accept-Ranges','bytes');
  return new Response(bytes.slice(start,end+1),{status:206,headers});
}

self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||url.search)return;
  const navigation=request.mode==='navigate'&&(url.pathname===BASE.pathname||url.href===new URL('index.html',BASE).href);
  if(!navigation&&!KNOWN.has(url.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cacheKey=navigation?new URL('index.html',BASE).href:url.href;
    const cached=await cache.match(cacheKey);
    // Dynamic/authentication endpoints are never intercepted. Navigation remains network-first.
    if(cached&&!navigation)return rangeResponse(request,cached);
    try{
      const response=await fetch(request);
      if(response.status===200&&!response.redirected&&response.type!=='opaque'){
        const type=response.headers.get('content-type')||'';
        const valid=navigation?(type.includes('text/html')&&(await response.clone().text()).includes('data-bdu-pwa="V37-RC2"')):!type.includes('text/html');
        if(valid)event.waitUntil(cache.put(cacheKey,response.clone()).catch(()=>{}));
      }
      return response;
    }catch(error){if(cached)return rangeResponse(request,cached);throw error;}
  })());
});
