import * as EngineModule from './engine.js';
import {CHARACTERS,SCENES,combatCaps} from './registry.js';
import {validateRules,serverAttributes} from './online-rules.js';
// The exact offline motor also runs on Node; the UMD entry exports differently there.
globalThis.Arena ||= EngineModule.default;
const {ExpandedGame}=await import('./combat-expansion.js');

export class OnlineSimulation {
 constructor({rules,characters,profiles=[],onEvent=()=>{},seed}={}){
  this.rules=validateRules(rules);
  if(!Array.isArray(characters)||characters.length!==2||characters.some(id=>!CHARACTERS[id]))throw Error('São necessários dois personagens válidos.');
  const r=this.rules;
  const attributes=characters.map((id,i)=>r.normalized?{}:serverAttributes(profiles[i]?.characters?.[id]?.xp||0,id));
  this.game=new ExpandedGame({stage:SCENES.find(s=>s.id===r.sceneId).base,sceneId:r.sceneId,characters:[...characters],attributes,bot:false,human:0,difficulty:'normal',duration:r.duration,lives:r.lives,signatures:r.signatures,events:r.events,variant:r.variant,modifier:r.modifier,onEvent,seed});
  this.commands=[null,null];this.ids=new WeakMap();this.nextId=0;this.tick=0;
  for(const p of this.game.players){
   p.variant=r.variant;p.team=CHARACTERS[p.characterId].pvpTeam==='lula'?0:CHARACTERS[p.characterId].pvpTeam==='flavio'?1:p.id;
   if(r.normalized)p.caps={...combatCaps('lula')};
  }
  if(r.itemFrequency==='none')this.game.hidden={};
  if(r.itemFrequency==='scarce'){
   const counts={};
   for(const key of Object.keys(this.game.hidden)){
    const [x,y]=key.split(',').map(Number),partner=(14-x)+','+(10-y),kind=this.game.hidden[key];
    if(y*15+x>(10-y)*15+14-x)continue;
    counts[kind]=(counts[kind]||0)+1;
    if(!['capacity','speed','range'].includes(kind)||counts[kind]>1){delete this.game.hidden[key];delete this.game.hidden[partner];}
   }
  }
 }
 get done(){return this.game.done;}
 get winner(){return this.game.winner??null;}
 input(slot,command){
  if(![0,1].includes(slot)||!command||typeof command!=='object'||this.done)return false;
  const {dx=0,dy=0}=command;
  if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)>1)return false;
  if(['bomb','special','signature'].some(k=>command[k]!==undefined&&typeof command[k]!=='boolean'))return false;
  const old=this.commands[slot];
  this.commands[slot]={dx,dy,until:this.game.elapsed+.25,bomb:!!command.bomb||!!old?.bomb,special:!!command.special||!!old?.special,signature:!!command.signature||!!old?.signature};
  return true;
 }
 update(dt){
  if(!Number.isFinite(dt)||dt<=0||this.done)return;
  const g=this.game;
  for(let slot=0;slot<2;slot++){
   const c=this.commands[slot];if(!c||c.until<g.elapsed)continue;
   if(c.dx||c.dy)g.move(slot,c.dx,c.dy);
   if(c.bomb)g.place(slot);if(c.special)g.special(slot);if(c.signature)g.signature(slot);
   c.bomb=c.special=c.signature=false;
  }
  g.update(Math.min(dt,.05));this.tick++;
 }
 snapshot(){
  const g=this.game,s=g.snapshot();delete s.hidden;delete s.seed;delete s.nextEvent;delete s.nextEnvironment;
  for(const key of ['bombs','fire','items','barriers','zones','warnings','portals','npcs','microphones'])s[key]=(g[key]||[]).map(item=>{
   if(!this.ids.has(item))this.ids.set(item,++this.nextId);
   return {...JSON.parse(JSON.stringify(item)),netId:this.ids.get(item)};
  });
  return {...s,done:g.done,winner:g.winner??null,tick:this.tick,stage:g.stage,modifier:g.modifier,mechanic:g.mechanic,duration:g.duration,options:{signatures:this.rules.signatures},human:0,bot:false,particles:[]};
 }
}
