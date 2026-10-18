// Native editing and scrolling remain available outside the live play surface.
const NATIVE_UI='input,textarea,select,option,a[href],[contenteditable]:not([contenteditable="false"]),[data-native-touch],[data-allow-selection],.player-help-popover,[role="dialog"],[role="tooltip"]';
const DIRECT_CONTROLS='.virtual-joystick,.dpad,#bombTouch,#specialTouch,#world';

export function installMobileTouchGuard({arena,enabled=()=>false}){
  const doc=arena.ownerDocument;
  const elementOf=target=>target?.nodeType===3?target.parentElement:target;
  const guarded=target=>{
    const element=elementOf(target);
    return enabled()&&!!element&&arena.contains(element)&&!element.closest?.(NATIVE_UI);
  };
  const prevent=event=>{if(event.cancelable)event.preventDefault()};
  function clearArenaSelection(){
    const selection=doc.getSelection?.();
    if(selection&&!selection.isCollapsed&&(arena.contains(selection.anchorNode)||arena.contains(selection.focusNode)))selection.removeAllRanges();
  }
  function blockNative(event){if(guarded(event.target)){prevent(event);clearArenaSelection()}}
  function pointerDown(event){if(guarded(event.target))clearArenaSelection()}
  function touch(event){
    // Each finger keeps its own original target. Do not cancel a native UI gesture.
    const targets=event.changedTouches?.length?Array.from(event.changedTouches,t=>t.target):[event.target];
    if(!targets.every(guarded))return;
    if(targets.some(target=>{
      const element=elementOf(target);
      return element.closest('button,[role="button"]')&&!element.closest(DIRECT_CONTROLS);
    }))return;
    if(event.type==='touchstart'){
      clearArenaSelection();
      // These controls act on pointerdown. Click-driven pause/help/signature buttons
      // must retain Safari's synthesized click, so their touchstart is left alone.
      if(!targets.every(target=>elementOf(target).closest(DIRECT_CONTROLS)))return;
    }
    prevent(event);
  }
  const nativeEvents=['selectstart','contextmenu','dragstart'];
  for(const type of nativeEvents)arena.addEventListener(type,blockNative,{capture:true,passive:false});
  arena.addEventListener('pointerdown',pointerDown,{capture:true});
  arena.addEventListener('touchstart',touch,{passive:false});
  arena.addEventListener('touchmove',touch,{passive:false});
  return {destroy(){
    for(const type of nativeEvents)arena.removeEventListener(type,blockNative,true);
    arena.removeEventListener('pointerdown',pointerDown,true);
    arena.removeEventListener('touchstart',touch);arena.removeEventListener('touchmove',touch);
  }};
}
