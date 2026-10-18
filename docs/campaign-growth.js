import {CHARACTERS,CAMPAIGNS,ATTRIBUTES,attributeCap} from './registry.js';
const LEVELS=[2,3,4,5,6,8,9,10,11,12,14,16];
const ORDER=['range','cooldown','speed','capacity','range','resistance','speed','exclusive','cooldown','range','capacity','resistance','speed','cooldown','exclusive','range','resistance','capacity','speed','cooldown','range','exclusive','resistance','speed','cooldown'];
const empty=()=>Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,0]));
// Previous automatic allocation, used only when migrating existing saves.
export function legacyEncounterGrowth(number){const level=LEVELS[number-1],spent=empty();for(const k of ORDER.slice(0,2*(level-1)))spent[k]++;return {level,spent,phase:number};}
function previousEncounterGrowth(number){
 const phase=Math.max(1,Math.min(12,Math.floor(number)||1)),level=LEVELS[phase-1],spent=empty();
 const cap=key=>key==='resistance'?4:ATTRIBUTES[key].max;
 if(phase===12)for(const key of Object.keys(ATTRIBUTES))spent[key]=cap(key);
 else {const budget=[2,4,6,8,10,12,14,15,16,18,19][phase-1];let allocated=0;for(const key of ORDER){if(allocated>=budget)break;if(spent[key]<cap(key)-1){spent[key]++;allocated++;}}}
 return {level,spent,phase};
}
export function encounterGrowth(number){
 const growth=previousEncounterGrowth(number),n=growth.phase;
 if(n===6||n===11)growth.spent.resistance=previousEncounterGrowth(n-1).spent.resistance+2;
 if(n===12)growth.spent.resistance=encounterGrowth(11).spent.resistance+2;
 return growth;
}
export function previousCharacterGrowth(id){
 const c=CHARACTERS[id];
 if(!c||c.category==='presidential')return {level:1,spent:empty(),phase:null};
 if(c.category==='international'){const bonus=['trump','putin'].includes(id)?2:1;return {level:bonus===2?20:18,spent:Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,(k==='resistance'?4:ATTRIBUTES[k].max)+bonus])),phase:null};}
 const phase=Object.values(CAMPAIGNS).flat().find(p=>p.opponent===id);return previousEncounterGrowth(phase?.number||1);
}
export function characterGrowth(id){
 const c=CHARACTERS[id];
 if(!c||c.category==='presidential')return {level:1,spent:empty(),phase:null};
 if(c.category==='international')return {level:['trump','putin'].includes(id)?21:19,spent:Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,attributeCap(id,k)])),phase:null};
 const phase=Object.values(CAMPAIGNS).flat().find(p=>p.opponent===id);return encounterGrowth(phase?.number||1);
}
