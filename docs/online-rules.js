import {CHARACTERS,SCENES,VARIANTS,ATTRIBUTES,attributeCap} from './registry.js';

export const PROTOCOL_VERSION=1;
export const DEFAULT_RULES=Object.freeze({sceneId:'congresso',bestOf:3,duration:120,itemFrequency:'normal',signatures:true,normalized:true,events:false,lives:3,variant:'normal',modifier:'none'});
export const PUBLIC_PRESETS=Object.freeze({
 standard:DEFAULT_RULES,
 rapid:Object.freeze({...DEFAULT_RULES,bestOf:1,duration:90,itemFrequency:'scarce',signatures:false}),
 rpg:Object.freeze({...DEFAULT_RULES,normalized:false})
});
const enums={sceneId:SCENES.map(s=>s.id),bestOf:[1,3,5],duration:[90,120,180],itemFrequency:['none','scarce','normal'],lives:[1,3,5],variant:Object.keys(VARIANTS),modifier:['none','fast','stock','giant','tiny','dark']};
export function validateRules(input={},mode='private'){
 if(!input||typeof input!=='object'||Array.isArray(input)||!['public','private'].includes(mode))throw Error('Configuração inválida.');
 if(Object.keys(input).some(k=>!Object.hasOwn(DEFAULT_RULES,k)))throw Error('Regra desconhecida.');
 const rules={...DEFAULT_RULES,...input};
 for(const [key,choices]of Object.entries(enums))if(!choices.includes(rules[key]))throw Error('Valor inválido para '+key+'.');
 for(const key of ['signatures','normalized','events'])if(typeof rules[key]!=='boolean')throw Error('Valor inválido para '+key+'.');
 if(mode==='public'&&!rules.normalized)throw Error('Partidas públicas usam atributos normalizados.');
 return rules;
}
export const publicPair=(a,b)=>!!CHARACTERS[a]?.pvpTeam&&!!CHARACTERS[b]?.pvpTeam&&CHARACTERS[a].pvpTeam!==CHARACTERS[b].pvpTeam;
// All gameplay fields participate: a custom room never silently joins a different queue.
export function queueKey(rules){const r=validateRules(rules,'private');return Object.keys(DEFAULT_RULES).map(k=>String(r[k])).join('|');}
export function presetName(rules){const key=queueKey(rules);return Object.keys(PUBLIC_PRESETS).find(k=>queueKey(PUBLIC_PRESETS[k])===key)||'custom';}
export const serverLevel=xp=>Math.min(30,1+Math.floor((Math.sqrt(1+8*Math.max(0,xp)/100)-1)/2));
export function serverAttributes(xp,id){
 if(!CHARACTERS[id]||!Number.isSafeInteger(xp)||xp<0)throw Error('Evolução inválida.');
 const values=Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,0]));
 // Server-owned XP has its own progression; offline save values never enter this calculation.
 const level=serverLevel(xp),budget=2*(level-1);
 const order=['range','speed','capacity','resistance','cooldown','exclusive'];
 for(let n=0,allocated=0;n<300&&allocated<budget;n++){
  const key=order[n%order.length];if(values[key]<attributeCap(id,key)){values[key]++;allocated++;}
 }
 return values;
}
