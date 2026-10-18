// Installation and storage are progressive enhancements, never prerequisites to play.
const standalone = matchMedia('(display-mode: standalone)');
const setMode = () => document.documentElement.classList.toggle('standalone', !!navigator.standalone || standalone.matches);
setMode();
standalone.addEventListener?.('change', setMode);

let persistenceRequested = false;
async function preserveStorage() {
  if (persistenceRequested || !navigator.storage?.persist) return;
  persistenceRequested = true;
  try { if (!await navigator.storage.persisted()) await navigator.storage.persist(); } catch {}
}
document.addEventListener('pointerup', preserveStorage, {once:true});
document.addEventListener('keydown', preserveStorage, {once:true});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // No forced reload while a campaign is running. A new worker takes over after closing the app.
    navigator.serviceWorker.register('./sw.js', {scope:'./',updateViaCache:'none'}).catch(() => {});
  }, {once:true});
}
