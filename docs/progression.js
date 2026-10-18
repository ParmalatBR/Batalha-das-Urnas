import {migrateRoster} from './roster-migration.js';
import {CHARACTERS,CAMPAIGNS,ATTRIBUTES,attributeCap,ACHIEVEMENTS,COSMETICS} from './registry.js';
import {grantCampaignUnlocks,isUnlocked} from './roster-access.js';
import {DEFAULT_DIFFICULTY,DIFFICULTY_IDS,normalizeDifficulty} from './difficulty.js';
import {characterGrowth,legacyEncounterGrowth} from './campaign-growth.js';
import {INTERNATIONAL,internationalQueue,internationalEligible,cleanInternationalBonus,currentInternational,internationalPhase} from './international-campaign.js';
import {campaignDifficultyDecision,campaignRestartDifficulty} from './campaign-difficulty-policy.js';
export const SAVE_KEY='urna-progress-v1',BACKUP_KEY=SAVE_KEY+'-backup';
const integer=(v,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export const levelFor=xp=>Math.min(30,1+Math.floor((Math.sqrt(1+8*Math.max(0,xp)/100)-1)/2));
export const xpFor=level=>50*(level-1)*level;
const freshCharacter=id=>({...(CAMPAIGNS[id]?{resetGeneration:0}:{}),xp:xpFor(characterGrowth(id).level),spent:{...characterGrowth(id).spent},wins:0,losses:0,captures:0,streak:0,perfect:0,specials:0,lastLife:0,campaigns:0,escapes:0,multi:0,achievements:[],cosmetic:'classic',equipped:{}});
export function freshSave(){return {version:1,rosterGrowthVersion:2,internationalVersion:1,internationalRevealed:[],internationalWins:Object.fromEntries(Object.keys(INTERNATIONAL).map(id=>[id,0])),selected:'lula',campaigns:0,characters:Object.fromEntries(Object.keys(CHARACTERS).map(id=>[id,freshCharacter(id)])),unlocked:['lula','flavio'],discovered:{lula:[],flavio:[]},active:{},completedRuns:[],roundIds:[],stageWins:{},choices:{},achievements:[],cosmetics:[],seen:[],stats:{captures:0,streak:0,perfect:0,specials:0,lastLife:0,campaigns:0,escapes:0,multi:0,rounds:0,bestWave:0,survivalSeconds:0},updated:0};}
export function sanitizeSave(raw){const s=freshSave();if(!raw||raw.version!==1)return s;raw=migrateRoster(raw);s.campaigns=integer(raw.campaigns,10000);s.selected=CHARACTERS[raw.selected]?raw.selected:'lula';s.unlocked=[...new Set(['lula','flavio',...(Array.isArray(raw.unlocked)?raw.unlocked:[]).filter(id=>CHARACTERS[id])])];for(const id of Object.keys(CHARACTERS)){const c=raw.characters?.[id];if(!c)continue;const n=s.characters[id];if(CAMPAIGNS[id])n.resetGeneration=integer(c.resetGeneration,Number.MAX_SAFE_INTEGER);for(const k of ['xp','wins','losses','captures','streak','perfect','specials','lastLife','campaigns','escapes','multi'])n[k]=integer(c[k]);const growth=characterGrowth(id),migrate=!raw.rosterGrowthVersion&&CHARACTERS[id].category!=='presidential',oldGrowth=growth.phase?legacyEncounterGrowth(growth.phase):null,desired=Object.fromEntries(Object.entries(ATTRIBUTES).map(([k,a])=>{let value=integer(c.spent?.[k],attributeCap(id,k));if(raw.rosterGrowthVersion===1&&CHARACTERS[id].category==='international')value=Math.max(value,growth.spent[k]);else if(raw.rosterGrowthVersion===1&&oldGrowth&&value>=oldGrowth.spent[k])value=Math.max(0,value-oldGrowth.spent[k]+growth.spent[k]);return [k,Math.min(attributeCap(id,k),Math.max(value,migrate?growth.spent[k]:0))];}));n.xp=Math.max(n.xp,xpFor(growth.level));if(migrate)n.xp=Math.max(n.xp,xpFor(Math.min(30,1+Math.ceil(Object.values(desired).reduce((a,b)=>a+b,0)/2))));let budget=(levelFor(n.xp)-1)*2;for(const [k,a]of Object.entries(ATTRIBUTES)){n.spent[k]=Math.min(desired[k],budget);budget-=n.spent[k];}n.achievements=(Array.isArray(c.achievements)?c.achievements:[]).filter(id=>ACHIEVEMENTS.some(a=>a.id===id));n.equipped={};for(const item of COSMETICS)if(item.category!=='outfit'&&c.equipped?.[item.category]===item.id&&s.campaigns>=item.after)n.equipped[item.category]=item.id;n.cosmetic=['classic','gala','aurora'].includes(c.cosmetic)?c.cosmetic:'classic';}for(const k of Object.keys(s.stats))s.stats[k]=integer(raw.stats?.[k]);s.stats.campaigns=s.campaigns;
 s.internationalRevealed=[...new Set((raw.internationalVersion===1?(Array.isArray(raw.internationalRevealed)?raw.internationalRevealed:[]):s.unlocked).filter(id=>INTERNATIONAL[id]))];for(const id of Object.keys(INTERNATIONAL))s.internationalWins[id]=integer(raw.internationalWins?.[id]);s.unlocked=s.unlocked.filter(id=>!INTERNATIONAL[id]||s.internationalRevealed.includes(id));
 for(const hero of ['lula','flavio']){const r=raw.active?.[hero];if(!r||r.hero!==hero||typeof r.id!=='string'||r.id.length>100)continue;const next=integer(r.next,12);s.active[hero]={id:r.id,hero,next,ramp:Math.min(next,integer(r.ramp,12)),difficulty:normalizeDifficulty(r.difficulty),ng:integer(r.ng,20),completed:next===12,...(typeof r.difficultySelectionPending==='boolean'?{difficultySelectionPending:r.difficultySelectionPending&&next===0}:{}),...(next===12&&r.bonus?{bonus:cleanInternationalBonus(r.bonus,hero,s.campaigns)}:{}),checkpoint:r.checkpoint&&typeof r.checkpoint==='object'&&r.checkpoint.rulesVersion===12?r.checkpoint:null};}
 for(const k of ['roundIds','completedRuns','achievements','cosmetics','seen'])s[k]=(Array.isArray(raw[k])?raw[k]:[]).filter(x=>typeof x==='string'&&x.length<100).slice(-2000);for(const pair of ['first','second'])if((pair==='first'?['bukele','xi']:['trump','putin']).includes(raw.choices?.[pair]))s.choices[pair]=raw.choices[pair];for(const [key,n]of Object.entries(raw.stageWins||{}))if(/^(lula|flavio)-([1-9]|1[0-2])$/.test(key))s.stageWins[key]=integer(n,10000);grantCampaignUnlocks(s);if(!s.unlocked.includes(s.selected))s.selected='lula';for(const item of COSMETICS)if(s.campaigns>=item.after&&!s.cosmetics.includes(item.id))s.cosmetics.push(item.id);s.cosmetics=s.cosmetics.filter(id=>COSMETICS.some(c=>c.id===id&&s.campaigns>=c.after));for(const c of Object.values(s.characters))if(c.cosmetic!=='classic'&&!s.cosmetics.includes(c.cosmetic))c.cosmetic='classic';for(const hero of ['lula','flavio']){const known=new Set((Array.isArray(raw.discovered?.[hero])?raw.discovered[hero]:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=12));for(const stage of CAMPAIGNS[hero])if(s.stageWins[stage.id]>0||stage.number<=(s.active[hero]?.next||0)||s.seen.includes('intro-'+stage.id))known.add(stage.number);s.discovered[hero]=[...known].sort((a,b)=>a-b);}s.updated=integer(raw.updated,1e14);return s;
}
export class Progression {
 constructor(storage=globalThis.localStorage){this.storage=storage;this.state=freshSave();this.available=true;this.recovered=false;for(const key of [SAVE_KEY,BACKUP_KEY]){try{const text=storage?.getItem(key);if(text){const raw=JSON.parse(text);if(raw.version!==1)throw Error('Versão desconhecida');this.state=sanitizeSave(raw);this.recovered=key===BACKUP_KEY;break;}}catch{this.available=false;}}}
 commit(){this.state.updated=Date.now();const json=JSON.stringify(this.state);try{const old=this.storage?.getItem(SAVE_KEY);if(old){try{const data=JSON.parse(old);if(data.version===1)this.storage.setItem(BACKUP_KEY,old);}catch{}}this.storage.setItem(SAVE_KEY,json);this.available=true;}catch{this.available=false;return false;}try{this.onCommit?.();}catch{}return true;}
 get(id=this.state.selected){return this.state.characters[id];}
 level(id){return levelFor(this.get(id).xp);}
 points(id){return (this.level(id)-1)*2-Object.values(this.get(id).spent).reduce((a,b)=>a+b,0);}
 select(id){if(!this.state.unlocked.includes(id))return false;this.state.selected=id;this.commit();return true;}
 setDifficulty(hero,difficulty,options={}){const run=this.state.active[hero];if(!run||run.completed&&!currentInternational(run))return false;const decision=campaignDifficultyDecision(run,difficulty,options);if(decision.status==='unchanged')return true;if(decision.status!=='allowed')return false;const before=structuredClone(run);if(run.checkpoint&&!DIFFICULTY_IDS.includes(run.checkpoint.difficulty))run.checkpoint.difficulty=run.difficulty;run.difficulty=difficulty;run.difficultySelectionPending=false;if(this.commit())return true;Object.assign(run,before);if(before.difficultySelectionPending===undefined)delete run.difficultySelectionPending;return false;}
 allocate(id,key){const a=ATTRIBUTES[key],c=this.get(id);if(!isUnlocked(this.state,id)||!a||!c||this.points(id)<1||c.spent[key]>=attributeCap(id,key))return false;c.spent[key]++;this.commit();return true;}
 respec(id){if(!isUnlocked(this.state,id))return false;this.get(id).spent=Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,0]));this.commit();}
 start(hero,difficulty=DEFAULT_DIFFICULTY,plus=false){if(!CAMPAIGNS[hero]||plus&&!this.state.campaigns)return null;const previous=structuredClone(this.state),old=this.state.active[hero],ng=plus?Math.min(20,(old?.ng||0)+1):0;const id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);this.state.active[hero]={id,hero,next:0,ramp:0,ng,difficulty:normalizeDifficulty(difficulty),completed:false,checkpoint:null};this.state.selected=hero;if(this.commit())return this.state.active[hero];this.state=previous;return null;}
 restartCampaign(hero,options={}){
  if(!CAMPAIGNS[hero]||!options||typeof options!=='object'||Array.isArray(options))return {status:'invalid'};
  const {expectedRunId,difficulty=DEFAULT_DIFFICULTY,plus=false}=options;
  if(!(expectedRunId===null||typeof expectedRunId==='string')||!DIFFICULTY_IDS.includes(difficulty)||typeof plus!=='boolean'||plus&&!this.state.campaigns)return {status:'invalid'};
  const old=this.state.active[hero];if((old?.id??null)!==expectedRunId)return {status:'stale'};
  return this._resetCampaign(hero,campaignRestartDifficulty().difficulty,plus?Math.min(20,(old?.ng||0)+1):0,old?.id??null,'voluntary');
 }
 resetAfterExtremeLoss(runId,index){
  if(typeof runId!=='string'||!runId||!Number.isInteger(index)||index<0||index>=12)return {status:'invalid'};
  const run=Object.values(this.state.active).find(r=>r.id===runId);
  if(!run||run.completed||run.next!==index)return {status:'stale'};
  if(run.difficulty!=='extreme')return {status:'invalid'};
  return this._resetCampaign(run.hero,run.difficulty,run.ng,run.id,'extreme-defeat');
 }
 _resetCampaign(hero,difficulty,ng,previousRunId,reason){
  const next=JSON.parse(JSON.stringify(this.state)),character=next.characters[hero],lostXp=character.xp,spentPoints=Object.values(character.spent).reduce((sum,n)=>sum+n,0);
  const generation=integer(character.resetGeneration,Number.MAX_SAFE_INTEGER);if(generation===Number.MAX_SAFE_INTEGER)return {status:'invalid'};
  let id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
  if(id===previousRunId)id=Date.now()+'-'+Math.random().toString(36).slice(2)+'-reset';
  character.xp=0;character.spent=Object.fromEntries(Object.keys(ATTRIBUTES).map(key=>[key,0]));character.resetGeneration=generation+1;
  const run=next.active[hero]={id,hero,next:0,ramp:0,ng,difficulty,completed:false,checkpoint:null,...(reason==='voluntary'?{difficultySelectionPending:true}:{})};next.selected=hero;next.updated=Date.now();
  const json=JSON.stringify(next);let old=null,primaryAttempted=false;
  // Keep the live state untouched until the reset and its recovery copy are durable.
  try{
   old=this.storage?.getItem(SAVE_KEY)??null;
   if(old){let valid=false;try{valid=JSON.parse(old).version===1;}catch{}if(valid){this.storage.setItem(BACKUP_KEY,old);if(this.storage.getItem(BACKUP_KEY)!==old)throw Error('Backup não confirmado');}}
   primaryAttempted=true;this.storage.setItem(SAVE_KEY,json);if(this.storage.getItem(SAVE_KEY)!==json)throw Error('Salvamento não confirmado');
  }catch{
   if(primaryAttempted)try{if(old===null)this.storage?.removeItem(SAVE_KEY);else this.storage.setItem(SAVE_KEY,old);}catch{}
   this.available=false;return {status:'save-failed'};
  }
  this.state=next;this.available=true;try{this.onCommit?.();}catch{}
  return {status:'applied',run,previousRunId,lostXp,spentPoints,reason,resetGeneration:character.resetGeneration};
 }
 finishStage(runId,index){const r=Object.values(this.state.active).find(r=>r.id===runId);if(!r||r.completed||index!==r.next||index<0||index>=12)return null;const stage=CAMPAIGNS[r.hero][index],c=this.get(r.hero),before=levelFor(c.xp),repeats=this.state.stageWins[stage.id]||0,xp=Math.round(stage.xp*(1+r.ng*.15)*(r.difficulty==='easy'&&repeats>1?.5:1));this.state.stageWins[stage.id]=repeats+1;this.reveal(r.hero,stage.number);c.xp+=xp;r.next++;r.checkpoint=null;const unlocked=[];
  if(r.next===12){r.completed=true;if(!this.state.completedRuns.includes(r.id)){this.state.completedRuns.push(r.id);this.state.campaigns++;c.campaigns++;c.xp+=300;unlocked.push(...grantCampaignUnlocks(this.state));for(const {after,id}of COSMETICS)if(this.state.campaigns>=after&&!this.state.cosmetics.includes(id))this.state.cosmetics.push(id);this.applyInternational();r.bonus={queue:internationalQueue(this.state,r.hero),index:0,checkpointRevision:0,checkpoint:null};}}
  this.evaluate();this.commit();return {stage:stage.number,opponent:stage.opponent,xp:xp+(r.completed?300:0),total:c.xp,level:levelFor(c.xp),points:(levelFor(c.xp)-before)*2,unlocked,completed:r.completed,runId:r.id};
 }
 reveal(hero,number){if(!CAMPAIGNS[hero]||!Number.isInteger(number)||number<1||number>12)return false;const list=this.state.discovered[hero];if(!list.includes(number)){list.push(number);list.sort((a,b)=>a-b);this.commit();}return true;}
 isRevealed(hero,number){return !!this.state.discovered[hero]?.includes(number);}
 markRamp(hero){const r=this.state.active[hero];if(r){r.ramp=r.next;this.commit();}}
 seen(id){if(!this.state.seen.includes(id)){this.state.seen.push(id);this.commit();}}
 pendingChoice(){return null;}
 prepareInternational(run){if(!run?.completed||this.state.active[run.hero]!==run)return null;if(!run.bonus){run.bonus={queue:internationalQueue(this.state,run.hero),index:0,checkpointRevision:0,checkpoint:null};this.commit();}return currentInternational(run);}
 revealInternational(runId,id){const run=Object.values(this.state.active).find(r=>r.id===runId);if(currentInternational(run)!==id||!internationalEligible(this.state,id))return false;const previous=structuredClone(this.state);if(!this.state.internationalRevealed.includes(id))this.state.internationalRevealed.push(id);if(!this.state.unlocked.includes(id))this.state.unlocked.push(id);if(this.commit())return true;this.state=previous;return false;}
 finishInternational(runId,id){const run=Object.values(this.state.active).find(r=>r.id===runId);if(currentInternational(run)!==id||!this.state.internationalRevealed.includes(id))return null;const previous=structuredClone(this.state),c=this.get(run.hero),before=levelFor(c.xp),xp=internationalPhase(id).xp;c.xp+=xp;run.bonus.index++;run.bonus.checkpointRevision=(run.bonus.checkpointRevision||0)+1;run.bonus.checkpoint=null;this.state.internationalWins[id]=(this.state.internationalWins[id]||0)+1;const reward={xp,total:c.xp,level:levelFor(c.xp),points:(levelFor(c.xp)-before)*2,unlocked:[],international:id};if(this.commit())return reward;this.state=previous;return null;}
 checkpointInternational(hero,data){const r=this.state.active[hero];if(currentInternational(r)){const previous=structuredClone(r.bonus);r.bonus.checkpoint=data;r.bonus.checkpointRevision=(r.bonus.checkpointRevision||0)+1;if(this.commit())return true;r.bonus=previous;return false;}return false;}
 resetAfterInternationalLoss(runId,id){const run=Object.values(this.state.active).find(r=>r.id===runId);if(currentInternational(run)!==id)return {status:'stale'};if(run.difficulty!=='extreme')return {status:'invalid'};return this._resetCampaign(run.hero,'extreme',run.ng,run.id,'extreme-defeat');}
 choose(){return false;}
 applyInternational(){return grantCampaignUnlocks(this.state);}
 recordRound(id,won,stats={},life=0,maxLife=3,difficulty='normal',roundId=null){if(roundId&&this.state.roundIds.includes(roundId))return false;const c=this.get(id);if(!c)return;if(roundId){this.state.roundIds.push(roundId);this.state.roundIds=this.state.roundIds.slice(-2000);}c[won?'wins':'losses']++;c.streak=won?c.streak+1:0;if(won&&life===maxLife&&!(stats.damageTaken>0))c.perfect++;if(won&&life===1&&['hard','extreme'].includes(difficulty))c.lastLife++;c.captures+=integer(stats.hits);this.state.stats.captures+=integer(stats.hits);this.state.stats.rounds++;this.state.stats.streak=won?this.state.stats.streak+1:0;if(won&&life===maxLife&&!(stats.damageTaken>0))this.state.stats.perfect++;if(won&&life===1&&['hard','extreme'].includes(difficulty))this.state.stats.lastLife++;this.evaluate();this.commit();}
 count(key,n=1,id=this.state.selected){const c=this.get(id);if(c&&Number.isFinite(c[key]))c[key]+=n;if(key in this.state.stats){this.state.stats[key]+=n;this.evaluate();this.commit();}}
 evaluate(){for(const c of Object.values(this.state.characters))for(const a of ACHIEVEMENTS)if(c[a.id]>=a.target&&!c.achievements.includes(a.id))c.achievements.push(a.id);this.state.stats.campaigns=this.state.campaigns;for(const a of ACHIEVEMENTS)if(this.state.stats[a.id]>=a.target&&!this.state.achievements.includes(a.id))this.state.achievements.push(a.id);}
 checkpoint(hero,data){const r=this.state.active[hero];if(r&&!r.completed){r.checkpoint=data;this.commit();}}
 export(){return JSON.stringify(this.state,null,2);}
 import(text){
  const raw=JSON.parse(text);if(raw?.version!==1)throw Error('Arquivo de progresso incompatível');const next=sanitizeSave(raw);next.updated=Date.now();const json=JSON.stringify(next);let oldPrimary=null,oldBackup=null,primaryAttempted=false,backupAttempted=false;
  try{
   if(!this.storage)throw Error('Armazenamento indisponível');oldPrimary=this.storage.getItem(SAVE_KEY);oldBackup=this.storage.getItem(BACKUP_KEY);
   let validPrevious=false;try{validPrevious=JSON.parse(oldPrimary)?.version===1;}catch{}
   if(validPrevious){backupAttempted=true;this.storage.setItem(BACKUP_KEY,oldPrimary);if(this.storage.getItem(BACKUP_KEY)!==oldPrimary)throw Error('Cópia não confirmada');}
   primaryAttempted=true;this.storage.setItem(SAVE_KEY,json);if(this.storage.getItem(SAVE_KEY)!==json)throw Error('Salvamento não confirmado');
  }catch{
   if(primaryAttempted)try{if(oldPrimary===null)this.storage?.removeItem(SAVE_KEY);else this.storage.setItem(SAVE_KEY,oldPrimary);}catch{}
   if(backupAttempted)try{if(oldBackup===null)this.storage?.removeItem(BACKUP_KEY);else this.storage.setItem(BACKUP_KEY,oldBackup);}catch{}
   this.available=false;return false;
  }
  this.state=next;this.available=true;try{this.onCommit?.();}catch{}return true;
 }
}
