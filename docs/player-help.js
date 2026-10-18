import {resolveHelp,POWER_HELP} from './help-content.js';

/** Pure viewport placement, shared by the runtime and the geometry tests. */
export function placeHelp(anchor,panel,viewport,gap=10,avoid=null){
 const edge=12,x=viewport.left||0,y=viewport.top||0,w=Math.max(1,viewport.width),h=Math.max(1,viewport.height);
 const width=Math.min(panel.width,Math.max(1,w-edge*2)),height=Math.min(panel.height,Math.max(1,h-edge*2));
 if(avoid){
  const left=x+edge,top=y+edge,right=x+w-edge,bottom=y+h-edge,anchorRight=anchor.right??anchor.left+anchor.width;
  const areas=[
   {placement:'right',left:Math.max(left,avoid.right+gap),top,right,bottom},
   {placement:'left',left,top,right:Math.min(right,avoid.left-gap),bottom},
   {placement:'above',left,top,right,bottom:Math.min(bottom,avoid.top-gap)},
   {placement:'below',left,top:Math.max(top,avoid.bottom+gap),right,bottom}
  ].filter(area=>area.right>area.left&&area.bottom>area.top);
  if(!areas.length)return null;
  const full=areas.find(area=>area.right-area.left>=width&&area.bottom-area.top>=height);
  const readable=areas.filter(area=>area.right-area.left>=Math.min(240,width)&&area.bottom-area.top>=72),choices=readable.length?readable:areas;
  const fit=area=>Math.min(width,area.right-area.left)*Math.min(height,area.bottom-area.top);
  const area=full||choices.reduce((best,current)=>fit(current)>fit(best)?current:best),availableWidth=area.right-area.left,maxHeight=area.bottom-area.top,usedWidth=Math.min(width,availableWidth),usedHeight=Math.min(height,maxHeight);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  return {left:area.placement==='right'?area.left:area.placement==='left'?area.right-usedWidth:clamp(anchorRight-usedWidth,area.left,area.right-usedWidth),top:area.placement==='above'?area.bottom-usedHeight:area.placement==='below'?area.top:clamp(anchor.top,area.top,area.bottom-usedHeight),width:usedWidth,maxHeight,placement:area.placement,bounds:area};
 }
 const above=anchor.top-y,below=y+h-anchor.bottom,up=below<height+gap&&above>below;
 return {left:Math.max(x+edge,Math.min(x+w-width-edge,anchor.left+anchor.width/2-width/2)),top:Math.max(y+edge,Math.min(y+h-height-edge,up?anchor.top-height-gap:anchor.bottom+gap)),width,maxHeight:Math.max(1,h-edge*2),placement:up?'above':'below'};
}

/** One delegated controller; ! buttons are siblings of controls, never nested buttons. */
export function installPlayerHelp({root=globalThis.document,getProgress=()=>null,getCharacter=()=>null,observe=true}={}){
 const doc=root.ownerDocument||root,win=doc.defaultView||globalThis.window,scope=root===doc?doc:root;
 const bindings=new WeakMap(),records=new Set(),listeners=[];let serial=0,active=null,pinned=false,showTimer=null,hideTimer=null,disposed=false,scheduled=false,restoringFocus=false,inputMode='keyboard',openedBy=null;
 const panel=doc.createElement('aside');panel.className='player-help-popover';panel.id='player-help-'+Math.random().toString(36).slice(2);panel.hidden=true;panel.setAttribute('popover','manual');
 const title=doc.createElement('h3'),body=doc.createElement('div'),tip=doc.createElement('p'),closeButton=doc.createElement('button');title.id=panel.id+'-title';body.className='player-help-body';tip.className='player-help-tip';closeButton.type='button';closeButton.className='player-help-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','Fechar explicação');panel.append(closeButton,title,body,tip);doc.body.append(panel);
 const context=()=>({progress:getProgress(),characterId:getCharacter()});
 const info=record=>{const key=typeof record.key==='function'?record.key(record.anchor):record.key,ctx=context();ctx.characterId=record.anchor.closest('[data-help-character]')?.dataset.helpCharacter||ctx.characterId;return typeof key==='object'?key:resolveHelp(key,ctx);};
 const on=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 const timers=()=>{clearTimeout(showTimer);clearTimeout(hideTimer);showTimer=hideTimer=null;};
 const describe=(el,add)=>{if(!el)return;const ids=(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean).filter(id=>id!==panel.id);if(add)ids.push(panel.id);if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');};
 function close({restoreFocus=false}={}){
  timers();const old=active;active=null;pinned=false;openedBy=null;
  if(old){describe(old.anchor,false);describe(old.button,false);old.button?.setAttribute('aria-expanded','false');}
  if(typeof panel.hidePopover==='function')try{panel.hidePopover();}catch{}
  panel.hidden=true;if(restoreFocus&&old?.button?.isConnected){restoringFocus=true;try{old.button.focus({preventScroll:true});}finally{restoringFocus=false;}}
 }
 function position(){
  if(!active||panel.hidden)return;
  if(!active.anchor.isConnected||active.anchor.closest('.screen.hidden,[hidden]'))return close();
  const vv=win?.visualViewport,viewport={width:vv?.width||win?.innerWidth||doc.documentElement.clientWidth,height:vv?.height||win?.innerHeight||doc.documentElement.clientHeight,left:vv?.offsetLeft||0,top:vv?.offsetTop||0};
  const anchor=(active.button||active.anchor).getBoundingClientRect();
  if(anchor.bottom<=viewport.top||anchor.top>=viewport.top+viewport.height||anchor.right<=viewport.left||anchor.left>=viewport.left+viewport.width||active.card&&(anchor.top<viewport.top||anchor.bottom>viewport.top+viewport.height||anchor.left<viewport.left||anchor.right>viewport.left+viewport.width))return close();
  panel.style.width='';panel.style.maxWidth=Math.max(1,viewport.width-24)+'px';panel.style.maxHeight=Math.max(1,viewport.height-24)+'px';
  // Card help always originates at !, but its entire card is an exclusion zone.
  const card=active.card?active.anchor.getBoundingClientRect():null,avoid=card?{left:Math.min(card.left,anchor.left),top:Math.min(card.top,anchor.top),right:Math.max(card.right,anchor.right),bottom:Math.max(card.bottom,anchor.bottom)}:null;
  const box=panel.getBoundingClientRect(),p=placeHelp(anchor,box,viewport,10,avoid);if(!p)return close();
  panel.style.width=p.width+'px';panel.style.maxHeight=p.maxHeight+'px';panel.style.left=p.left+'px';
  const actualHeight=panel.getBoundingClientRect().height;
  const top=p.bounds?(p.placement==='above'?p.bounds.bottom-actualHeight:p.placement==='below'?p.bounds.top:Math.max(p.bounds.top,Math.min(p.bounds.bottom-actualHeight,anchor.top))):p.top;
  panel.style.top=top+'px';panel.dataset.placement=p.placement;
 }
 function show(record,pin=false,origin='keyboard'){
  if(disposed||!record?.anchor.isConnected)return;const content=info(record);if(!content)return;
  timers();if(active&&active!==record)close();active=record;pinned=pin;openedBy=origin;
  title.textContent=content.title;record.button?.setAttribute('aria-label','Explicação: '+content.title);body.replaceChildren();for(const line of content.body||[]){const p=doc.createElement('p');p.textContent=line;body.append(p);}tip.textContent=content.tip||'';tip.hidden=!content.tip;
  panel.setAttribute('role',pin?'dialog':'tooltip');panel.setAttribute('aria-labelledby',title.id);closeButton.hidden=!pin;
  panel.dataset.cardHelp=String(record.card);panel.dataset.interaction=pin?'pinned':origin;
  const palette=win?.getComputedStyle?.(record.button||record.anchor);
  panel.style.setProperty('--help-surface',palette?.getPropertyValue('--journey-deep').trim()||'#19272c');
  panel.style.setProperty('--help-accent',palette?.getPropertyValue('--journey-glow').trim()||'#61777c');
  if(pin)panel.setAttribute('aria-modal','false');else panel.removeAttribute('aria-modal');
  describe(record.button,!pin);record.button?.setAttribute('aria-expanded','true');
  // Native popover joins the top layer even when opened from the settings dialog.
  const native=typeof panel.showPopover==='function',mount=!native?record.anchor.closest('dialog[open]')||doc.body:doc.body;if(panel.parentNode!==mount)mount.append(panel);
  panel.hidden=false;if(native)try{if(!panel.matches(':popover-open'))panel.showPopover();}catch{}
  position();
 }
 function locate(target){for(let node=target?.nodeType===1?target:target?.parentElement;node&&node!==scope.parentElement;node=node.parentElement){if(bindings.has(node))return bindings.get(node);if(node===scope)break;}return null;}
 // The card/control is only content context. Only its visible ! is a trigger.
 function triggerAt(target){const button=target?.closest?.('.player-help-trigger');return button?bindings.get(button)||null:null;}
 function attach(anchor,key,{host=anchor,button=true,card=false,field=false}={}){
  if(!anchor||bindings.has(anchor))return bindings.get(anchor);
  const record={anchor,key,button:null,wrapper:null,card};bindings.set(anchor,record);records.add(record);anchor.dataset.playerHelp='anchor';
  if(button){
   // A label may only contain its own control; keep the new help button outside it.
   if(host.matches('button,a,label,select,input')||card||field){const wrapper=doc.createElement('div');wrapper.className='player-help-wrap '+(card?'player-help-card':field?'player-help-field':'player-help-control');host.before(wrapper);wrapper.append(host);record.wrapper=wrapper;host=wrapper;}
   else host.classList.add('player-help-host');
   const buttonEl=doc.createElement('button');buttonEl.type='button';buttonEl.className='player-help-trigger';buttonEl.textContent='!';buttonEl.setAttribute('aria-label','Explicação: '+(info(record)?.title||'Como jogar'));buttonEl.setAttribute('aria-controls',panel.id);buttonEl.setAttribute('aria-expanded','false');buttonEl.dataset.playerHelp='button';buttonEl.dataset.helpSequence=String(++serial);record.button=buttonEl;bindings.set(buttonEl,record);host.append(buttonEl);
  }
  return record;
 }
 const all=s=>[...scope.querySelectorAll(s)];
 const byId=(id,key)=>{const el=scope.querySelector('#'+id);if(el)attach(el,key,{host:el.closest('label')||el,field:true});};
 function refresh(){
  if(disposed)return;
  for(const record of records)if(!record.anchor.isConnected){if(active===record)close();records.delete(record);}
  for(const id of ['difficulty','freeDifficulty','campaignDifficulty'])byId(id,el=>'difficulty:'+el.value);
  byId('freeVariant',el=>'cuff:'+el.value);byId('freeScene',el=>'scene:'+el.value);byId('freeModifier',el=>'modifier:'+el.value);
  for(const [id,key] of Object.entries({normalized:'normalized',randomEvents:'events',freeLives:'lives',eventRate:'eventRate',series:'series',duration:'duration',light:'light'}))byId(id,'feature:'+key);
  for(const element of all('[data-pref]'))attach(element,'feature:'+element.dataset.pref,{host:element.closest('label')||element,field:true});
  for(const element of all('[data-card]'))attach(element,'character:'+element.dataset.card,{card:true});
  for(const element of all('[data-attribute]')){const row=element.closest('.attribute');if(row)attach(row,'attribute:'+element.dataset.attribute,{host:row.querySelector('div')||row});}
  for(const summary of all('.attribute-summary'))[...summary.children].forEach((row,i)=>{if(['speed','capacity','range','resistance','cooldown','exclusive'][i])attach(row,'attribute:'+['speed','capacity','range','resistance','cooldown','exclusive'][i]);});
  const powerIds=Object.keys(POWER_HELP);all('.power-card').forEach((card,i)=>attach(card,'power:'+(card.dataset.power||powerIds[i])));
  for(const [id,key] of Object.entries({respec:'respec',exportSave:'save',importSave:'save',signatureButton:'signature'})){const el=scope.querySelector('#'+id);if(el&&id!=='signatureButton')attach(el,'feature:'+key,{host:el.closest('label')||el,field:id==='importSave'});}
  for(const el of all('[data-help-key]'))attach(el,el.dataset.helpKey,{host:el,card:el.matches('button,a')});
  const stages=['congresso','stf','planalto','esplanada'];for(const el of all('[data-stage]'))attach(el,'scene:'+stages[Number(el.dataset.stage)],{button:false});
  const field=scope.querySelector('.stage-choice');if(field)attach(field,()=>{const selected=field.querySelector('[data-stage].active');return 'scene:'+(stages[Number(selected?.dataset.stage)]||'congresso');},{host:field.querySelector('legend')||field});
  for(const el of all('[data-mode]'))attach(el,'feature:'+el.dataset.mode,{button:false});const modes=scope.querySelector('.mode-choice');if(modes)attach(modes,()=> 'feature:'+(modes.querySelector('[data-mode].active')?.dataset.mode||'solo'),{host:modes.querySelector('legend')||modes});
  if(active)position();
 }
 on(scope,'pointerover',event=>{if(event.pointerType==='touch'||pinned)return;const record=triggerAt(event.target);if(!record)return;inputMode='pointer';clearTimeout(hideTimer);if(active===record)return;clearTimeout(showTimer);showTimer=setTimeout(()=>show(record,false,'pointer'),130);});
 on(scope,'pointerout',event=>{if(pinned)return;const record=triggerAt(event.target);if(!record||triggerAt(event.relatedTarget)===record)return;clearTimeout(showTimer);if(active!==record||openedBy==='keyboard')return;close();});
 on(scope,'focusin',event=>{if(restoringFocus||inputMode==='pointer'||inputMode==='touch')return;const record=triggerAt(event.target);if(record&&!pinned)show(record);});
 on(scope,'focusout',event=>{if(pinned||triggerAt(event.relatedTarget)===active)return;if(triggerAt(event.target)===active)close();});
 on(scope,'click',event=>{const record=triggerAt(event.target);if(!record)return;event.preventDefault();event.stopPropagation();const keyboard=event.detail===0,touch=event.pointerType==='touch'||inputMode==='touch',pin=keyboard||touch;if(active===record&&pinned)return close();show(record,pin,keyboard?'keyboard':touch?'touch':'pointer');if(keyboard)closeButton.focus({preventScroll:true});},true);
 on(closeButton,'click',()=>close({restoreFocus:true}));
 on(doc,'pointerdown',event=>{inputMode=event.pointerType==='touch'?'touch':'pointer';if(active&&!panel.contains(event.target)&&triggerAt(event.target)!==active)close();},true);
 on(doc,'keydown',event=>{inputMode='keyboard';if(event.key==='Escape'&&active){event.preventDefault();event.stopPropagation();close({restoreFocus:panel.contains(doc.activeElement)});}},true);
 on(scope,'change',event=>{const record=locate(event.target);if(record&&active===record)show(record,pinned,openedBy);});
 on(doc,'scroll',()=>{if(active)position();},true);if(win){on(win,'resize',position);on(win,'pagehide',()=>close());if(win.visualViewport){on(win.visualViewport,'resize',position);on(win.visualViewport,'scroll',position);}}
 const Observer=win?.MutationObserver||globalThis.MutationObserver;let observer=null;
 if(observe&&Observer){observer=new Observer(mutations=>{const relevant=mutations.some(m=>{const changed=[...m.addedNodes,...m.removedNodes];if(changed.length&&changed.every(node=>node.nodeType===3))return false;const target=m.target.nodeType===1?m.target:m.target.parentElement;return target&&!panel.contains(target)&&target!==panel&&!target.closest('#match,#trackName');});if(!relevant)return;if(active&&!active.anchor.isConnected)close();if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;refresh();});}});observer.observe(scope===doc?doc.body:scope,{childList:true,subtree:true});}
 refresh();
 return {refresh,attach,close,get visible(){return !panel.hidden;},get panel(){return panel;},destroy(){if(disposed)return;close();disposed=true;observer?.disconnect();for(const off of listeners)off();for(const record of records){record.button?.remove();delete record.anchor.dataset.playerHelp;if(record.wrapper?.isConnected){record.wrapper.before(record.anchor.closest('label')||record.anchor);record.wrapper.remove();}}records.clear();panel.remove();}};
}
