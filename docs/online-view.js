// Presentation only: no damage, movement, drops, clocks or results are simulated here.
const entities=['players','bombs','fire','items','barriers','zones','warnings','portals','npcs','microphones'];
export class OnlineView {
 constructor(snapshot,{slot=0,send=()=>{},now=()=>performance.now()}={}){
  this.human=slot;this.send=send;this.now=now;this.frames=[];this.apply(snapshot);
 }
 apply(snapshot){
  const received=this.now(),oldHuman=this.human;
  for(const [key,value]of Object.entries(snapshot)){
   if(entities.includes(key)){
    const previous=new Map((this[key]||[]).map(e=>[key==='players'?e.id:e.netId,e]));
    this[key]=value.map(e=>Object.assign(previous.get(key==='players'?e.id:e.netId)||{},e));
   }else if(!['human','send','now','frames'].includes(key))this[key]=value;
  }
  this.human=oldHuman;
  this.frames.push({at:received,players:snapshot.players.map(p=>({px:p.px,py:p.py,gait:p.gait,dir:p.dir}))});
  this.frames=this.frames.slice(-8);
 }
 update(){
  const target=this.now()-80;let a=this.frames[0],b=this.frames.at(-1);
  for(let i=1;i<this.frames.length;i++)if(this.frames[i].at>=target){a=this.frames[i-1];b=this.frames[i];break;}
  if(!a||!b)return;
  const t=Math.max(0,Math.min(1,(target-a.at)/Math.max(1,b.at-a.at)));
  for(let i=0;i<this.players.length;i++){
   const p=this.players[i],from=a.players[i],to=b.players[i];
   // Portals jump immediately; interpolating a teleport would cross solid walls.
   if(Math.abs(to.px-from.px)+Math.abs(to.py-from.py)>2){p.px=to.px;p.py=to.py;}
   else {p.px=from.px+(to.px-from.px)*t;p.py=from.py+(to.py-from.py)*t;}
   p.gait=from.gait+(to.gait-from.gait)*t;p.dir=to.dir;
  }
 }
 cell(x,y){return this.barriers?.some(b=>b.x===x&&b.y===y)?1:this.grid[y]?.[x]??1;}
 move(slot,dx,dy){if(slot!==this.human)return false;this.send({dx,dy});return true;}
 place(slot){if(slot===this.human)this.send({bomb:true});}
 special(slot){if(slot===this.human)this.send({special:true});}
 signature(slot){if(slot===this.human)this.send({signature:true});}
}
