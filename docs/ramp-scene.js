import {CHARACTERS} from './registry.js';
let background;const victories={};
function load(){if(background)return;background=new Image();background.src='assets/planalto-ramp-v10.webp';for(const hero of ['lula','flavio']){victories[hero]=new Image();victories[hero].src='assets/reactions/'+hero+'-victory-v12.webp';}}
const ready=image=>image?.complete&&image.naturalWidth>0&&image.naturalHeight>0;
const clamp=v=>Math.max(0,Math.min(1,v));
const point=n=>({x:.5,y:.925-n*.472/12,h:.24-n*.156/12});
export class RampScene {
 constructor(canvas,world,hero,from,to){load();this.canvas=canvas;this.world=world;this.hero=hero;this.from=from;this.to=to;const c=document.createElement('canvas');c.width=c.height=256;this.actor={c,tex:{needsUpdate:false}};}
 draw(t){
  const ctx=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height,special=[6,11,12].includes(this.to),final=this.to===12,reduced=this.world.reduced,walk=reduced?1:clamp((t-.45)/2.9),ease=walk*walk*(3-2*walk),n=this.from+(this.to-this.from)*ease,p=point(n),turn=reduced?1:clamp((t-3.35)/.35),arrival=reduced?1:clamp((t-3.6)/2.4),zoom=1+arrival*(final?2.15:special?1.55:1.05),focusY=.55+(p.y-(final?.105:.12)-.55)*arrival;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#91b7ca';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h*.55);ctx.scale(zoom,zoom);ctx.translate(-w/2,-h*focusY);if(background.complete&&background.naturalWidth)ctx.drawImage(background,0,0,w,h);
  for(let i=1;i<=12;i++){const q=point(i),side=i%2?-1:1,x=(.5+side*(.3455-i*.02454))*w,y=q.y*h,scale=q.h/.24,passed=i<=this.from||i===this.to&&walk===1;
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*.55);ctx.shadowBlur=passed?16:2;ctx.shadowColor=passed?'#ffcc64':'#0008';ctx.fillStyle=passed?'#dfb953':'#344757cc';ctx.beginPath();ctx.ellipse(0,0,27,27,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=passed?'#fff0c3':'#d9d4bd';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=passed?'#263343':'#f4ebd5';ctx.font='bold 27px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i,0,1);ctx.restore();
  }
  const size=p.h*h,x=p.x*w,y=p.y*h;ctx.save();ctx.fillStyle='#23364b44';ctx.filter='blur(6px)';ctx.beginPath();ctx.ellipse(x,y+1,size*.24,size*.055,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // Never combine a portrait torso with a sliced sprite: the slice retained its two hands.
  // One complete body owns both arms in every frame, including loading/error fallbacks.
  const victory=turn>=1&&special&&ready(victories[this.hero]);
  if(victory){
   const image=victories[this.hero],elapsed=Math.max(0,t-3.7),settle=reduced?0:Math.sin(Math.min(1,elapsed/.55)*Math.PI)*size*.045,breathe=reduced?0:Math.sin(elapsed*2.6)*size*.007,height=size*(final?1.2:1.12),width=height*image.naturalWidth/image.naturalHeight;
   ctx.save();ctx.translate(x,y-settle-breathe);ctx.rotate(reduced?0:Math.sin(elapsed*2)*.006);ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();
  }else{
   const dir=turn>=1?2:turn>0?1:0;this.world.drawCharacter(this.actor,{id:CHARACTERS[this.hero].original,characterId:this.hero,dir,cool:walk<1?1:0,gait:t*13,cosmetic:'classic'},t);
   ctx.drawImage(this.actor.c,x-size/2,y-size,size,size);
  }
  ctx.restore();
  const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#0d223428');shade.addColorStop(.6,'#0d223400');shade.addColorStop(1,'#0d223460');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 }
}
