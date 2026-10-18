// Original Canvas2D celebration. Decorative only: no input, audio or gameplay state.
const LIMIT=220,TAU=Math.PI*2;
const mounted=new WeakMap();
const palettes={lula:['#ef534c','#ff9580','#f5c865','#ffe5a5'],flavio:['#54c88a','#a5e0a2','#f5c865','#ffe5a5']};
const random=(a,b)=>a+Math.random()*(b-a);

/**
 * Attach behind the content of a connected victory/finale container.
 * Import fireworks.css once. Returns an idempotent cleanup function.
 * reduced OR flashes === false selects a quiet, static firework illustration.
 */
export function installFireworks(container,{hero='lula',reduced=false,flashes=true}={}){
 if(typeof window==='undefined'||!container?.append)return ()=>{};
 mounted.get(container)?.();
 const canvas=document.createElement('canvas');canvas.className='celebration-fireworks';canvas.setAttribute('aria-hidden','true');
 const hadClass=container.classList.contains('celebration-fireworks-host');container.classList.add('celebration-fireworks-host');
 const priorPosition=container.style.position,positioned=getComputedStyle(container).position==='static';if(positioned)container.style.position='relative';
 container.prepend(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx){canvas.remove();if(!hadClass)container.classList.remove('celebration-fireworks-host');if(positioned)container.style.position=priorPosition;return ()=>{};}
 const colors=palettes[hero]||palettes.lula,quiet=!!reduced||flashes===false;
 let width=1,height=1,raf=0,dead=false,last=0,elapsed=0,next=.12,launchIndex=0,observer,resizeObserver;
 const sparks=[],rockets=[],centers=[.16,.82,.38,.66,.08,.91];
 const sprites=colors.map(color=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gradient=g.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'#fff6d2');gradient.addColorStop(.12,color);gradient.addColorStop(.35,color+'a8');gradient.addColorStop(1,color+'00');g.fillStyle=gradient;g.fillRect(0,0,32,32);return c;});
 const radius=()=>Math.min(width*.15,height*.23,150);
 function star(x,y,r,color,alpha){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();}
 function staticArt(){
  ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='source-over';
  for(let n=0;n<5;n++){const x=width*centers[n],y=height*(.17+(n%3)*.12),r=radius()*(.62+(n%2)*.2);for(let k=0;k<22;k++){const a=k*TAU/22+n*.3,inner=r*(.30+(k%3)*.06),outer=r*(.75+(k%4)*.08);ctx.strokeStyle=colors[k%4];ctx.globalAlpha=.34;ctx.lineWidth=k%3?1:1.4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);ctx.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);ctx.stroke();if(k%4===0)star(x+Math.cos(a)*outer,y+Math.sin(a)*outer,2,colors[2],.55);}star(x,y,3.2,colors[3],.65);}
  ctx.globalAlpha=1;
 }
 function resize(){if(dead)return;const bounds=container.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);const dpr=Math.min(1.5,window.devicePixelRatio||1,1800/width,1200/height);canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);sparks.length=0;rockets.length=0;if(quiet)staticArt();}
 function launch(){const lane=centers[launchIndex++%centers.length],targetX=width*Math.max(.06,Math.min(.94,lane+random(-.035,.035))),targetY=height*random(.14,.47),x=targetX+random(-width*.05,width*.05),y=height*.96,duration=random(.8,1.15);rockets.push({x,y,startX:x,startY:y,targetX,targetY,duration,age:0,trail:[],color:launchIndex%4,kind:launchIndex%3});}
 function burst(rocket){
  const count=rocket.kind===1?52:44,scale=radius()/115;
  // Leave room for concurrent bursts; bound retained state independently of frame rate.
  if(sparks.length+count>LIMIT)sparks.splice(0,sparks.length+count-LIMIT);
  for(let i=0;i<count;i++){const a=i*TAU/count+random(-.04,.04),ring=rocket.kind===1?(i%2?.62:1):random(.58,1),speed=random(66,105)*ring*scale;const color=i%5===0?3:rocket.kind===2?2:i%3===0?2:rocket.color%2;const life=random(1.25,2.05);sparks.push({x:rocket.x,y:rocket.y,px:rocket.x,py:rocket.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:0,life,color,size:random(1.5,2.5)*Math.max(.7,scale),gravity:random(20,35)*scale});}
 }
 function render(dt){
  elapsed+=dt;ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='source-over';
  if(elapsed>=next&&rockets.length<2){launch();next=elapsed+random(.72,1.15);}
  for(let i=rockets.length-1;i>=0;i--){const p=rockets[i];p.age+=dt;const t=Math.min(1,p.age/p.duration),e=1-Math.pow(1-t,1.35);p.x=p.startX+(p.targetX-p.startX)*e;p.y=p.startY+(p.targetY-p.startY)*e;p.trail.push([p.x,p.y]);if(p.trail.length>9)p.trail.shift();ctx.strokeStyle=colors[2];for(let k=1;k<p.trail.length;k++){ctx.globalAlpha=k/p.trail.length*.55;ctx.lineWidth=.6+k/p.trail.length;ctx.beginPath();ctx.moveTo(...p.trail[k-1]);ctx.lineTo(...p.trail[k]);ctx.stroke();}ctx.globalAlpha=.85;ctx.drawImage(sprites[2],p.x-6,p.y-6,12,12);if(t===1){burst(p);rockets.splice(i,1);}}
  for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.age+=dt;if(p.age>=p.life){sparks.splice(i,1);continue;}p.px=p.x;p.py=p.y;const drag=Math.exp(-.7*dt);p.vx*=drag;p.vy=p.vy*drag+p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const fade=Math.pow(1-p.age/p.life,1.25),r=p.size;
   ctx.globalAlpha=fade*.75;ctx.strokeStyle=colors[p.color];ctx.lineWidth=Math.max(.7,r*.45);ctx.beginPath();ctx.moveTo(p.x-p.vx*.055,p.y-p.vy*.055);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.globalAlpha=fade*.78;ctx.drawImage(sprites[p.color],p.x-r*3,p.y-r*3,r*6,r*6);
  }
  ctx.globalAlpha=1;
 }
 function frame(now){raf=0;if(dead)return;if(!container.isConnected){cleanup();return;}if(document.hidden)return;const dt=last?Math.min(.04,Math.max(0,(now-last)/1000)):.016;last=now;render(dt);raf=requestAnimationFrame(frame);}
 function visibility(){if(dead)return;if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else if(!quiet&&!raf){last=0;raf=requestAnimationFrame(frame);}}
 function cleanup(){if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;resizeObserver?.disconnect();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',cleanup);window.removeEventListener('resize',resize);sparks.length=0;rockets.length=0;canvas.remove();if(!hadClass)container.classList.remove('celebration-fireworks-host');if(positioned&&container.style.position==='relative')container.style.position=priorPosition;if(mounted.get(container)===cleanup)mounted.delete(container);}
 resize();
 if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);}else window.addEventListener('resize',resize);
 if(typeof MutationObserver!=='undefined'&&document.body){observer=new MutationObserver(()=>{if(!container.isConnected)cleanup();});observer.observe(document.body,{childList:true,subtree:true});}
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',cleanup,{once:true});
 if(!quiet&&!document.hidden)raf=requestAnimationFrame(frame);
 mounted.set(container,cleanup);
 return cleanup;
}
