import {CHARACTERS} from './registry.js';

export const INTERNATIONAL={
 bukele:{hero:'lula',after:2,tier:'purple',accent:'#b96aff',team:'#36e493',country:'El Salvador'},
 xi:{hero:'flavio',after:2,tier:'purple',accent:'#b96aff',team:'#ff435e',country:'China'},
 trump:{hero:'lula',after:4,tier:'gold',accent:'#ffd366',team:'#36e493',country:'Estados Unidos'},
 putin:{hero:'flavio',after:4,tier:'gold',accent:'#ffd366',team:'#ff435e',country:'Rússia'}
};
export const internationalRoute=hero=>Object.keys(INTERNATIONAL).filter(id=>INTERNATIONAL[id].hero===hero);
export const internationalKnown=(state,id)=>(state.internationalRevealed||[]).includes(id);
export const internationalEligible=(state,id)=>!!INTERNATIONAL[id]&&state.campaigns>=INTERNATIONAL[id].after;
export function internationalQueue(state,hero){
 return internationalRoute(hero).filter(id=>internationalEligible(state,id));
}
export function cleanInternationalBonus(raw,hero,campaigns){
 if(!raw||!Array.isArray(raw.queue))return null;
 const allowed=internationalRoute(hero).filter(id=>campaigns>=INTERNATIONAL[id].after),queue=[...new Set(raw.queue)].filter(id=>allowed.includes(id));
 const index=Math.max(0,Math.min(queue.length,Number.isInteger(raw.index)?raw.index:0));
 return {queue,index,checkpointRevision:Number.isSafeInteger(raw.checkpointRevision)&&raw.checkpointRevision>=0?raw.checkpointRevision:0,checkpoint:index<queue.length&&raw.checkpoint?.rulesVersion===12?raw.checkpoint:null};
}
export const currentInternational=run=>run?.completed?run.bonus?.queue?.[run.bonus.index]||null:null;
export function internationalPhase(id){
 const rule=INTERNATIONAL[id];if(!rule)return null;
 return {id:'international-'+id,number:rule.after===2?13:14,act:3,opponent:id,scene:'planalto',kind:'superboss',xp:rule.tier==='gold'?500:350,
  opening:'Um novo desafio atravessou as fronteiras.',closing:'O desafio internacional foi superado!',
  rules:{duration:240,lives:3,eventInterval:30,environmentInterval:16,signatureFrom:1,ai:{kick:true,remote:true,strategic:true}}};
}
export function internationalStyle(id){const c=INTERNATIONAL[id];return '--super-accent:'+c.accent+';--super-team:'+c.team;}
export function internationalFaceoff(session,mystery){
 const id=session.characters[1],c=CHARACTERS[id],hero=CHARACTERS[session.hero],rule=INTERNATIONAL[id];
 return '<div class="superboss-faceoff '+rule.tier+(mystery?' unrevealed':' revealed')+'" style="'+internationalStyle(id)+'">'+
 '<div class="superboss-aurora" aria-hidden="true"></div><div class="superboss-top"><span class="folio">DESAFIO INTERNACIONAL</span><h2 id="superTitle">'+(mystery?'Uma presença inesperada.':'Além de Brasília.')+'</h2><p>A campanha brasileira já está contabilizada.</p></div>'+
 '<div class="superboss-versus"><div class="superfighter"><img src="'+hero.portrait+'" alt="'+hero.name+'"><h3>'+hero.name+'</h3></div><strong class="super-versus">VS</strong><div class="superfighter challenger"><div class="super-portrait"><img src="'+c.portrait+'" alt="'+(mystery?'Adversário misterioso':c.name)+'"></div><div id="superIdentity">'+(mystery?'<h3>???</h3><p>Quem ousa desafiar o campeão?</p>':'<span class="folio">'+rule.country+'</span><h3>'+c.name+'</h3><p>'+c.special+'</p>')+'</div></div></div>'+
 '<div class="superboss-bottom"><button id="superEnter" class="paint-button primary" '+(mystery?'disabled':'')+'>'+(mystery?'REVELANDO ADVERSÁRIO…':'ENFRENTAR SUPERBOSS →')+'</button><button id="superLater" class="paper-link">CONTINUAR MAIS TARDE</button></div></div>';
}
export function internationalTriumph(session){
 const id=session.characters[1],hero=CHARACTERS[session.hero],r=INTERNATIONAL[id];
 return '<div class="superboss-triumph '+r.tier+'" style="'+internationalStyle(id)+'"><div class="superboss-aurora" aria-hidden="true"></div><span class="super-trophy" aria-hidden="true">✦</span><img src="assets/reactions/'+hero.id+'-victory-v12.webp" alt="'+hero.name+' comemorando com os punhos erguidos"><div><span class="folio">SUPERBOSS SUPERADO · '+r.country.toUpperCase()+'</span><h2>Uma vitória<br>sem fronteiras!</h2><p>'+CHARACTERS[id].name+' ficou para trás. O palco inteiro é seu.</p><p id="victoryVoice" class="voice-caption"></p><button id="superTriumphContinue" class="paint-button primary">RECEBER A CONQUISTA →</button></div></div>';
}
