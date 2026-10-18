// x/y are displacement divided by the base radius. Exactly one axis is emitted.
export function joystickDirection(x,y,previous=null,{deadZone=.18,hysteresis=.12}={}){
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<=deadZone)return null;
  const ax=Math.abs(x),ay=Math.abs(y);
  let horizontal=ax>=ay;
  if(previous?.x&&ay<=ax*(1+hysteresis))horizontal=true;
  else if(previous?.y&&ax<=ay*(1+hysteresis))horizontal=false;
  return horizontal?{x:x<0?-1:1,y:0}:{x:0,y:y<0?-1:1};
}

export function mountVirtualJoystick({container,onDirection=()=>{},onRelease=()=>{},enabled=false}={}){
  if(!container?.ownerDocument)throw new TypeError('Joystick requires a DOM container');
  const doc=container.ownerDocument,win=doc.defaultView;
  const element=doc.createElement('div');element.className='virtual-joystick';
  element.setAttribute('role','group');element.setAttribute('aria-label','Controle de movimento: arraste para uma das quatro direções');
  element.dataset.dir='none';element.dataset.active='false';
  const knob=doc.createElement('span');knob.className='virtual-joystick-knob';knob.setAttribute('aria-hidden','true');element.append(knob);
  const hadClass=container.classList.contains('has-virtual-joystick');container.classList.add('has-virtual-joystick');container.prepend(element);
  let pointer=null,direction=null,destroyed=false,center=null;
  const isEnabled=()=>{const value=typeof enabled==='function'?enabled():enabled;return value===true||value==='match'};
  const same=(a,b)=>a===b||!!a&&!!b&&a.x===b.x&&a.y===b.y;
  const emit=next=>{if(same(direction,next))return;direction=next;element.dataset.dir=!next?'none':next.x<0?'left':next.x>0?'right':next.y<0?'up':'down';onDirection(next?{...next}:null)};
  function reset(){
    if(pointer===null)return;
    const old=pointer;pointer=null;center=null;element.dataset.active='false';knob.style.transform='translate(0px, 0px)';
    try{if(element.hasPointerCapture?.(old))element.releasePointerCapture(old)}catch{}
    emit(null);onRelease();
  }
  function update(e){
    if(!center)return;const x=(e.clientX-center.x)/center.radius,y=(e.clientY-center.y)/center.radius;
    const distance=Math.hypot(x,y),limit=.58,scale=distance>limit?limit/distance:1;
    knob.style.transform=`translate(${x*scale*center.radius}px, ${y*scale*center.radius}px)`;
    emit(joystickDirection(x,y,direction));
  }
  function down(e){
    if(destroyed||pointer!==null||!isEnabled()||(e.pointerType==='mouse'&&e.button!==0))return;
    const rect=element.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
    pointer=e.pointerId;center={x:rect.left+rect.width/2,y:rect.top+rect.height/2,radius:Math.min(rect.width,rect.height)/2};
    try{element.setPointerCapture(e.pointerId)}catch{pointer=null;center=null;return}
    if(e.cancelable)e.preventDefault();element.dataset.active='true';update(e);
  }
  function move(e){if(e.pointerId!==pointer||pointer===null)return;if(e.cancelable)e.preventDefault();if(!isEnabled()){reset();return}update(e)}
  function end(e){if(pointer===null||e.pointerId!==pointer)return;if(e.cancelable&&e.type!=='lostpointercapture')e.preventDefault();reset()}
  const hide=()=>{if(doc.visibilityState==='hidden')reset()};
  element.addEventListener('pointerdown',down,{passive:false});element.addEventListener('pointermove',move,{passive:false});
  element.addEventListener('lostpointercapture',end);doc.addEventListener('pointerup',end,{passive:false});doc.addEventListener('pointercancel',end,{passive:false});
  doc.addEventListener('visibilitychange',hide);win?.addEventListener('blur',reset);win?.addEventListener('resize',reset);
  return {element,reset,getState:()=>({pointerId:pointer,direction:direction?{...direction}:null,active:pointer!==null,destroyed}),destroy(){
    if(destroyed)return;reset();destroyed=true;
    element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('lostpointercapture',end);
    doc.removeEventListener('pointerup',end);doc.removeEventListener('pointercancel',end);doc.removeEventListener('visibilitychange',hide);win?.removeEventListener('blur',reset);win?.removeEventListener('resize',reset);
    element.remove();if(!hadClass)container.classList.remove('has-virtual-joystick');
  }};
}
