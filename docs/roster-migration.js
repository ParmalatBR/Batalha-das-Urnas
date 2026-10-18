import {characterGrowth,previousCharacterGrowth} from './campaign-growth.js';
import {CHARACTERS,ATTRIBUTES} from './registry.js';
const replacements=Object.freeze({antonio:'moro',zanin:'messias'});
const current=id=>Object.hasOwn(replacements,id)?replacements[id]:id;

// Keep earned progress when an encounter is recast. Dialogue never migrates.
export function migrateRoster(raw){
 if(!raw||raw.version!==1)return raw;
 const next={...raw,selected:current(raw.selected),characters:{...raw.characters},active:{...raw.active}};
 if(Array.isArray(raw.unlocked))next.unlocked=[...new Set(raw.unlocked.map(current))];
 for(const [oldId,newId]of Object.entries(replacements)){
  if(!Object.hasOwn(next.characters,newId)&&Object.hasOwn(next.characters,oldId))next.characters[newId]=next.characters[oldId];
  delete next.characters[oldId];
 }
 // Upgrade only untouched automatic NPC allocations. Custom/respecced builds and heroes stay intact.
 if(raw.rosterGrowthVersion===2)for(const [id,c]of Object.entries(next.characters)){
  if(!c||!CHARACTERS[id]||CHARACTERS[id].category==='presidential')continue;
  const old=previousCharacterGrowth(id),current=characterGrowth(id);
  if(old.spent.resistance!==current.spent.resistance&&Object.keys(ATTRIBUTES).every(k=>c.spent?.[k]===old.spent[k]))next.characters[id]={...c,spent:{...c.spent,resistance:current.spent.resistance}};
 }
 for(const hero of ['lula','flavio']){
  const run=raw.active?.[hero],checkpoint=run?.checkpoint;
  if(!checkpoint||!Array.isArray(checkpoint.players)||!checkpoint.players.some(p=>p&&current(p.characterId)!==p.characterId))continue;
  const players=checkpoint.players.map(p=>p?{...p,characterId:current(p.characterId)}:p);
  const sceneId=hero==='lula'&&run.next===9?'justica-federal':hero==='flavio'&&run.next===8?'agu':checkpoint.sceneId;
  next.active[hero]={...run,checkpoint:{...checkpoint,players,sceneId}};
 }
 return next;
}
