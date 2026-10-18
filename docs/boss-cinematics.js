import {CHARACTERS,SCENES} from './registry.js';
export const battleScore=session=>['final','superboss'].includes(session?.phase?.kind)?'final':session?.phase?.kind==='miniboss'?'miniboss':'battle';
export const bossCinematic=phase=>!phase||phase.kind==='regular'?null:{kind:phase.kind,opening:phase.kind==='final'?10:6,triumph:phase.kind==='final'?10:6,title:phase.kind==='final'?'O último confronto.':phase.number===6?'O plenário vai tremer.':'A decisão é na arena.',seal:phase.kind==='final'?'CONFRONTO PRESIDENCIAL':phase.number===6?'MINIBOSS · ATO I':'MINIBOSS · ATO II'};
export const fighterColor=id=>['lula','janones','moraes'].includes(id)?'#ff3548':['flavio','nikolas','mendonca'].includes(id)?'#49ff96':CHARACTERS[id]?.category==='international'?'#c36cff':'#efd18a';
export function faceoffMarkup(session){
 const c=bossCinematic(session.phase),left=CHARACTERS[session.hero],right=CHARACTERS[session.characters[1]];
 const fighter=(p,side)=>'<div class="faceoff-fighter '+side+'" style="--fighter:'+fighterColor(p.id)+'"><div class="faceoff-rays"></div><img src="'+p.portrait+'" alt="Caricatura de '+p.name+'"><div class="fighter-name"><small>'+p.special+'</small><h3>'+p.name+'</h3></div></div>';
 return '<div class="boss-cinematic '+c.kind+'" style="--intro-duration:'+c.opening+'s"><div class="faceoff-top"><span>'+c.seal+'</span><h2>'+c.title+'</h2></div><div class="faceoff-stage">'+fighter(left,'left')+'<strong class="faceoff-vs" aria-label="contra">VS</strong>'+fighter(right,'right')+'</div><div class="faceoff-bottom"><span>'+SCENES.find(s=>s.id===session.scene).name+'</span><button id="enterBattle" class="paint-button primary">ENTRAR NA ARENA →</button></div><div class="faceoff-progress" aria-hidden="true"></div></div>';
}
export function triumphMarkup(session){
 const c=bossCinematic(session.phase),hero=CHARACTERS[session.hero],president=['lula','flavio'].includes(hero.id),art=president?'assets/reactions/'+hero.id+'-victory-v12.webp':hero.portrait;
 return '<div class="boss-triumph '+c.kind+'" style="--fighter:'+fighterColor(hero.id)+'"><div class="triumph-rays" aria-hidden="true"></div><img class="triumph-hero" src="'+art+'" alt="'+hero.name+(president?' comemorando com os dois punhos erguidos':' comemorando')+'"><div class="triumph-copy"><span class="folio">'+(c.kind==='final'?'DOZE BATALHAS. UMA CONQUISTA.':'MAIS UM CHEFE FICOU PARA TRÁS.')+'</span><h2>'+(c.kind==='final'?'Brasília<br>é sua!':'Pode<br>comemorar!')+'</h2><p>'+hero.name+'</p><button id="triumphContinue" class="paint-button primary">VER RESULTADO →</button></div></div>';
}
