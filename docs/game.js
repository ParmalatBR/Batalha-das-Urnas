import {mountVirtualJoystick} from './mobile-joystick.js';
import {installMobileTouchGuard} from './mobile-touch-guard.js';
import {isMobileArena,mobileArenaQuery} from './mobile-arena.js';
import {mountMainMenu} from './main-menu.js';
import {persistGameForExit,installGameExit} from './game-exit.js';
import {powersMarkup,audioMarkup,aboutMarkup} from './ui-sections.js';
import {OnlineController} from './online-client.js';
import {AccountClient} from './account-client.js';
import {AccountUI} from './account-ui.js';
import {gameAccountBridge} from './account-game.js';
import {OnlineView} from './online-view.js';
import {SCENES} from './registry.js';
import {installPlayerHelp} from './player-help.js';
import {DuelSeries,readHistory,saveDuel} from './series.js';
import {Celebrations} from './celebrations.js';
import {preferences,remember,onPreferencesChanged} from './preferences.js';
import {World} from './render-expansion.js';
import {ExpandedGame} from './combat-expansion.js';
import {Expansion} from './expansion.js';
import {CHARACTERS} from './registry.js';
import {GameAudio} from './audio.js';
import {presentVoiceFeedback} from './voice-feedback.js';
import {POWER_INFO,QUOTES} from './content.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let expansion,playerHelp,online,account,accountUI,mainMenu,gameExit,browserExited=false,accountId=null;let onlineMeta={},onlineMenu=false,onlineOfflineChoice=null,navigationVersion=0;const localDuelChoice={selected:0,stage:0};let names=['Lula','Flávio'];const stageNames=['CONGRESSO','STF','PLANALTO','ESPLANADA'];
let series=new DuelSeries(preferences.series),duelSaved=false,duelStored=false;
let mobileFocus=true,virtualJoystick=null;
let world,game,selected=0,stage=0,mode='solo',state='home',previous='home',round=1,scores=series.scores,keys=new Set(),touch=null,clock=0,last=0,launch=0,ready=false,sound=preferences.sound,quoteIndex=[0,0],speechEnd=[0,0],toastEnd=0,lastHud='',frameCount=0;
function screen(name){navigationVersion++;endingVoice=null;if(name!=='match')cancelOnlineVictory();playerHelp?.close();if(accountUI&&name!=='accountScreen')accountUI.active=false;for(let s of ['home','setup','match','expansionScreen','onlineScreen','accountScreen'])$('#'+s)?.classList.toggle('hidden',s!==name);$('#intermission').classList.add('hidden');state=name;soundtrack.setScene(name==='match'?'match':'home');keys.clear();clearTouch();celebrations.clear();soundtrack.stopVoice?.();}
const soundtrack=new GameAudio();const celebrations=new Celebrations($('#celebrationLayer'));let endAt=0,roundWinner=null,endingVoice=null,onlineVictoryWait=null;const streaks=[0,0];
function beginEnding(winner){
 soundtrack.stopVoice();celebrations.clear();
 const duration=winner===null?1.2:(world.victory(game.players[winner])||3.2);
 state='ending';endAt=clock+duration;roundWinner=winner;keys.clear();clearTouch();
}
function revealResult(){
 state='end';soundtrack.play(roundWinner===null?'draw':'win');
 if(expansion.pendingResult)expansion.showVictory();
 else{prepareResult(roundWinner);$('#intermission').classList.remove('hidden');if(roundWinner!==null)celebrate(roundWinner,'win');}
}
function cancelOnlineVictory(){if(onlineVictoryWait){const pending=onlineVictoryWait;onlineVictoryWait=null;clearTimeout(pending.timeout);pending.resolve();}}
function beforeOnlineResult(result){
 cancelOnlineVictory();
 if(!(game instanceof OnlineView))return Promise.resolve();
 const winner=result.winner??result.seriesWinner;
 if(!Number.isInteger(winner)||!game.players[winner])return Promise.resolve();
 soundtrack.stopVoice();celebrations.clear();keys.clear();
 const duration=world.victory(game.players[winner])||3.2;
 return new Promise(resolve=>{const pending={game,resolve,duration,elapsed:0};onlineVictoryWait=pending;pending.timeout=setTimeout(()=>{if(onlineVictoryWait===pending)cancelOnlineVictory();},8000);});
}
function updateOnlineVictory(dt){
 if(!onlineVictoryWait)return;
 if(onlineVictoryWait.game!==game)return cancelOnlineVictory();
 onlineVictoryWait.elapsed+=dt;
 const pose=world.victoryState;
 if(pose?.elapsed>=pose?.duration||onlineVictoryWait.elapsed>=onlineVictoryWait.duration)cancelOnlineVictory();
}
function holdEnding(duration){if(state==='ending')endAt=Math.max(endAt,clock+duration+.4);}
function waitForVictory(promise){
 const pending={game,nav:navigationVersion,deadline:performance.now()+8000,settled:false};endingVoice=pending;
 Promise.resolve(promise).then(()=>pending.settled=true,()=>pending.settled=true);
 return promise;
}
function waitingForVictory(){return !!endingVoice&&endingVoice.game===game&&endingVoice.nav===navigationVersion&&!endingVoice.settled&&performance.now()<endingVoice.deadline;}

function celebrate(id,event='hit',victim=null){
 if(game instanceof OnlineView)return celebrateOnline(id,event,victim);
 if(expansion?.session)return expansion.celebration(id,event,preferences.celebrations,null,victim);
 const active=game,nav=navigationVersion,opponent=game?.players[victim??(1-id)]?.characterId||null;
 const feedback=presentVoiceFeedback(soundtrack,{characterId:id,event,opponentId:opponent,
  isCurrent:()=>game===active&&navigationVersion===nav&&state!=='paused'&&(event!=='hit'||!active?.done),
  show:clip=>{const node=celebrations.nodes[id].el;node.querySelector('img').src='assets/reactions/'+(id?'flavio':'lula')+'-laugh-v6.png';node.querySelector('img').alt=id?'Flávio rindo e fazendo V':'Lula rindo e fazendo L';const line=clip?.text||(event==='win'?'Rodada vencida!':'Acerto confirmado!');if(preferences.celebrations)celebrations.show(id,line,!!clip,event,streaks[id],clip?.duration||0);else floatMessage(id,event==='win'?'VITÓRIA!':'NA MOSCA!','damage');if(event==='win')holdEnding(clip?.duration||0);}
 });
 return event==='win'?waitForVictory(feedback):feedback;
}
const floating=[];let warned=false,countTick=-1;
function celebrateOnline(slot,event,victim=null){
 const active=game,nav=navigationVersion,p=game.players[slot],c=CHARACTERS[p.characterId];
 return presentVoiceFeedback(soundtrack,{characterId:c.id,event,opponentId:game.players[victim??(1-slot)]?.characterId||null,
  isCurrent:()=>game===active&&navigationVersion===nav&&(event!=='hit'||(!active.done&&!active.presentationEnded)),
  show:clip=>{const node=celebrations.nodes[slot].el;node.querySelector('img').src=c.portrait;node.querySelector('img').alt='Caricatura de '+c.name;node.classList.toggle('red',p.team===0);node.classList.toggle('blue',p.team===1);node.classList.remove('gold-frame','encore','party-portrait');if(preferences.celebrations)celebrations.show(slot,expansion.settings.subtitles?(clip?.text||(event==='win'?'Rodada vencida!':'Na mosca!')):'',!!clip,event,1,clip?.duration||0);}
 });
}
async function openOnlineMode(){
 if(!ready){notify('A arena ainda está carregando.');return;}
 const intent=navigationVersion;
 await online.ready;if(intent!==navigationVersion)return;
 if(!online.available||online.lifecycle?.ended){onlineOfflineChoice??={mode,selected,stage};expansion.home();void online.open();return;}
 await account.ready;if(intent!==navigationVersion)return;
 if(!account.account||!account.isAssociated()){expansion.home();await accountUI.open();return;}
 const identity=account.account.id;
 if(!online.room){try{await account.flush();}catch{if(intent===navigationVersion){expansion.home();await accountUI.open();}return;}}
 if(intent!==navigationVersion||account.account?.id!==identity)return;
 onlineOfflineChoice??={mode,selected,stage};expansion.home();void online.open();
}
function closeOnlineHome(){
 const choice=onlineOfflineChoice||{mode:'solo',selected:0,stage:0};
 mode=choice.mode;selected=choice.selected;stage=choice.stage;onlineOfflineChoice=null;onlineMenu=false;
 $('#pause').setAttribute('aria-label','Pausar');expansion.home();
}
function startOnlineMatch(snapshot,meta={}){
 if(!ready)return;
 mobileFocus=true;
 expansion.checkpoint();expansion.session=null;expansion.pendingResult=null;
 clearTimeout(expansion.introTimer);clearTimeout(expansion.victoryTimer);clearTimeout(expansion.rampTimer);expansion.stopFireworks?.();
 onlineMeta=meta;selected=meta.localSlot??online.localSlot??0;stage=SCENES.find(s=>s.id===snapshot.sceneId)?.base||0;mode='online';onlineMenu=false;
 screen('match');soundtrack.score('battle');applyPreferences();
 for(const f of floating)f.el.remove();floating.length=0;streaks.fill(0);lastHud='';warned=false;countTick=-1;
 game=new OnlineView(snapshot,{slot:selected,send:command=>online.input(command)});
 names=game.players.map(p=>CHARACTERS[p.characterId].name);scores=meta.scores||[0,0];round=meta.round||1;
 for(let slot=0;slot<2;slot++){const p=game.players[slot],person=CHARACTERS[p.characterId],node=$('#life'+slot).closest('.hud-person');node.classList.toggle('red',p.team===0);node.classList.toggle('blue',p.team===1);node.querySelector('strong').firstChild.textContent=person.name.toUpperCase()+' ';node.querySelector('.hud-face').style.backgroundImage='url('+person.portrait+')';}
 $('#match').classList.remove('republic-ui');$('#expansionHud').classList.remove('hidden');$('#bossHealth').classList.add('hidden');$('#activeEffects').textContent='';$('#contextCaption').classList.add('hidden');$('#roundNotice').textContent='';$('#pickupToast').classList.remove('visible');$('#timer').classList.remove('urgent');
 $('#keyboardTip').innerHTML='WASD / ↑↓←→ <b>MOVER</b> &nbsp; ESPAÇO <b>ALGEMA</b> &nbsp; E <b>ITEM</b> &nbsp; Q <b>HABILIDADE</b> &nbsp; ESC <b>MENU</b>';
 world.build(game,stage);world.renderer.domElement.setAttribute('aria-label','Arena 3D online. Mover com WASD ou setas; espaço coloca algema; E usa item; Q usa habilidade; Esc abre o menu sem pausar a partida.');$('#pause').setAttribute('aria-label','Menu da partida online');world.resize();if(meta.phase==='countdown')screen('onlineScreen');onlineState(meta.phase||'playing',meta);syncOnlineHud();world.renderer.domElement.focus({preventScroll:true});
}
function applyOnlineSnapshot(snapshot,meta={}){onlineMeta={...onlineMeta,...meta};if(!(game instanceof OnlineView))return startOnlineMatch(snapshot,onlineMeta);game.apply(snapshot);if(meta.scores)scores=meta.scores;if(meta.round)round=meta.round;}
function onlineResult(result){
 if(!(game instanceof OnlineView))return;
 const winner=result.final?result.seriesWinner:result.winner;
 soundtrack.score(null);soundtrack.play(winner===null?'draw':'win');
 if(Number.isInteger(winner)&&game.players[winner])celebrateOnline(winner,'win');
}
function onlineState(phase,info={}){
 onlineMeta={...onlineMeta,...info,phase};
 if(!(game instanceof OnlineView))return;
 if(phase==='playing'){if(state!=='match')screen('match');state='match';$('#countdown').classList.add('hidden');}
 else if(['countdown','paused','round-result','result'].includes(phase)){state='online-wait';keys.clear();clearTouch();online.input({dx:0,dy:0});$('#countdown').classList.toggle('hidden',['round-result','result'].includes(phase));$('#countdown').textContent=phase==='paused'?'RECONECTANDO…':phase==='countdown'?'PREPARE-SE':'';}
}
function syncOnlineHud(){
 sync();for(let slot=0;slot<2;slot++)$('#role'+slot).textContent=slot===selected?'VOCÊ':'ONLINE';
 $('#stageName').textContent=SCENES.find(s=>s.id===game.sceneId)?.name.toUpperCase()||'';
 $('#roundLabel').textContent='ONLINE · RODADA '+round;
 $('#seriesGoal').textContent='MELHOR DE '+(onlineMeta.rules?.bestOf||3)+' · '+(onlineMeta.rules?.normalized===false?'EVOLUÇÃO RPG':'ATRIBUTOS NORMALIZADOS');
 const p=game.players[selected],c=CHARACTERS[p.characterId],b=$('#signatureButton');
 b.textContent=c.special+' · '+(p.specialCD>0?Math.ceil(p.specialCD)+'s':expansion.settings.keys.signature.replace('Key',''));
 b.disabled=p.specialCD>0||game.options?.signatures===false||state!=='match';b.classList.toggle('ready',!b.disabled);
 $('#activeEffects').textContent=onlineMeta.phase==='paused'?'Aguardando reconexão do adversário.':[['immunityTime','Imunidade'],['chainBoost','Corrente +'],['haste','Acelerado'],['confused','Confuso'],['slow','Lento']].filter(([k])=>p[k]>0).map(([k,n])=>n+' '+Math.ceil(p[k])+'s').join(' · ');
}
function toggleOnlineMenu(){
 onlineMenu=!onlineMenu;keys.clear();clearTouch();online.input({dx:0,dy:0});
 $('#intermission').classList.toggle('hidden',!onlineMenu);$('#duelMedal').classList.add('hidden');$('#winnerPortrait').classList.add('hidden');$('#roundStats').classList.add('hidden');$('#newRound').classList.add('hidden');$('#restart').classList.add('hidden');$('#resume').classList.remove('hidden');
 $('#changeArena').classList.add('hidden');$('#pauseEyebrow').textContent='PARTIDA ONLINE';$('#pauseTitle').textContent='A arena continua.';$('#pauseText').textContent='O menu não pausa a disputa. Sair durante a batalha conta como abandono.';
}
function renderOnlineFrame(dt){
 clock+=dt;soundtrack.setScene('match');soundtrack.update(dt,game);document.body.classList.toggle('no-flashes',!expansion.settings.flashes);celebrations.update(dt);
 if(state==='match'&&!onlineMenu&&!$('#dialog').open){const key=[...keys].reverse().find(k=>moves[k]);if(touch)game.move(selected,...touch);else if(key)game.move(selected,...moves[key]);else online.input({dx:0,dy:0});}
 else online.input({dx:0,dy:0});
 game.update();if(frameCount++%3===0)syncOnlineHud();world.update(dt,game,clock);updateOnlineVictory(dt);updateFloating();
 if(clock>toastEnd)$('#pickupToast').classList.remove('visible');
 if(onlineMeta.phase==='countdown'){
  const remaining=onlineMeta.countdown??onlineMeta.countdownSeconds;const tick=Number.isFinite(remaining)?Math.ceil(remaining):null;
  if(tick!==null){$('#countdown').textContent=tick>0?tick:'VALENDO!';if(tick!==countTick){countTick=tick;soundtrack.play('countdown',{value:tick});}}
 }
}
for(const key of ['difficulty','duration','light','series']){$('#'+key).value=preferences[key];$('#'+key).onchange=e=>remember({[key]:['duration','series'].includes(key)?Number(e.target.value):e.target.value});}
function applyPreferences(){if(!world)return;world.reduced=preferences.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;world.mobileArena=isMobileArena();world.focusArena=world.mobileArena?mobileFocus:preferences.focus;world.renderer.setPixelRatio(Math.min(devicePixelRatio,preferences.quality==='light'?1:1.75));document.body.classList.toggle('reduced-motion',world.reduced);world.lighting=preferences.light;if(world.cinema){const samples=preferences.quality==='light'?0:Math.min(4,world.renderer.capabilities.maxSamples);if(world.cinema.main.samples!==samples){world.cinema.main.dispose();world.cinema.main.samples=samples;}}world.resize();let label=world.focusArena?'Mostrar entorno':'Aproximar arena';$('#viewMode').title=label;$('#viewMode').setAttribute('aria-label',label);$('#viewMode').setAttribute('aria-pressed',String(world.focusArena));}
function audioButtons(){$$('.sound-toggle').forEach(a=>{a.setAttribute('aria-pressed',String(sound));a.setAttribute('aria-label',sound?'Desativar som':'Ativar som');a.textContent=a.classList.contains('paper-link')?(sound?'♫ Som ligado':'♪ Som desligado'):(sound?'♫':'♪');});}audioButtons();
// A blocked first gesture or an interrupted audio context must be retryable.
matchMedia(mobileArenaQuery).addEventListener('change',()=>applyPreferences());
window.visualViewport?.addEventListener('resize',()=>{if(isMobileArena())world?.resize();});
const resumeAudio=()=>{if(!browserExited)void soundtrack.unlock();};
document.addEventListener('pointerdown',resumeAudio,{capture:true});
// WebKit grants touch activation on release; keep resume/play in this gesture.
document.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')resumeAudio();},{capture:true});
document.addEventListener('keydown',resumeAudio,{capture:true});
if(window.urnaDesktop)resumeAudio();
function beep(){soundtrack.play('step');}
function floatMessage(id,text,kind='quote',at=null){
 if(!game)return;
 const p=game.players[id],point=at||{x:p.px,y:p.py};
 const el=document.createElement('div');el.className='float-bubble '+(id?'blue':'red')+' '+kind;
 if(kind==='quote'){let tag=document.createElement('b');tag.textContent=names[id]+' • ACERTOU!';let q=document.createElement('q');q.textContent=text;let small=document.createElement('small');small.textContent='';el.append(tag,q,small);}else el.textContent=text;
 $('#floatingFeedback').append(el);floating.push({el,x:point.x,y:point.y,begin:clock,life:kind==='quote'?3.6:1.5,kind});
 while(floating.length>6)floating.shift().el.remove();
}
function updateFloating(){for(let i=floating.length-1;i>=0;i--){let f=floating[i],age=clock-f.begin;if(age>f.life){f.el.remove();floating.splice(i,1);continue;}let pos=world.project(f.x-7,f.kind==='quote'?2:1.3,f.y-5);let half=f.kind==='quote'?(innerHeight<550?105:145):60;let x=Math.max(half+8,Math.min(innerWidth-half-8,pos.x)),safeTop=innerHeight<550?72:112,y=Math.max(safeTop+f.el.offsetHeight,pos.y-age*22);f.el.style.left=x+'px';f.el.style.top=y+'px';f.el.style.opacity=Math.min(1,age*12)*Math.min(1,(f.life-age)*3);}}
function onEvent(event,data){if(game instanceof OnlineView){if(event==='end'){game.presentationEnded=true;soundtrack.stopVoice();celebrations.clear();keys.clear();online.input({dx:0,dy:0});if(data!==null)world.victory(game.players[data]);return;}if(event==='signature'){soundtrack.play('power');celebrateOnline(data.id,'special');return;}if(event==='humor'){expansion.notice(data.text,2);return;}}else if(expansion?.event(event,data))return;
 if(event==='place'){world.placePulse[data]=.5;soundtrack.play('place',{x:game.players[data].x});}
 if(event==='boom'){world.burst(data);soundtrack.play('boom',{x:data.x});}
 if(event==='crate')world.debris(data.x,data.y);
 if(event==='hit'){
  world.impact(data);soundtrack.play('hit',{x:data.x});if(data.victim===selected&&!data.shielded){$('#impactVeil').classList.remove('flash');void $('#impactVeil').offsetWidth;$('#impactVeil').classList.add('flash');}
  if(data.shielded){floatMessage(data.victim,'QUESTÃO DE ORDEM!', 'damage',data);soundtrack.play('shield',{x:data.x});}
  else {floatMessage(data.victim,['MANDADO CUMPRIDO!','PEDIDO DE VISTA!','RECURSO NEGADO!'][Math.max(0,data.life)%3],'damage',data);soundtrack.play('comicHit',{x:data.x});if(data.owner!==data.victim){let id=data.owner;streaks[id]=(streaks[id]||0)+1;streaks[data.victim]=0;celebrate(id,'hit',data.victim);soundtrack.play('cheer',{x:game.players[id].x});}else floatMessage(data.victim,'AUTOCAPTURA','self',data);}
 }
 if(event==='throw')soundtrack.play('throw');
 if(event==='power'){world.collect(game.players[data.id]);if(data.id===selected||mode==='duo'){let info=POWER_INFO[data.type],toast=$('#pickupToast');toast.querySelector('img').src=world.iconURLs[data.type];toast.querySelector('strong').textContent=names[data.id]+': '+info.name;toast.querySelector('small').textContent=info.desc;toast.classList.add('visible');toastEnd=clock+2.3;}soundtrack.play('power',{x:game.players[data.id].x});}
 if(event==='end'){series.record(data);scores=series.scores;if(series.complete&&!duelSaved){duelStored=saveDuel(series,stage,mode);duelSaved=true;}beginEnding(data);sync();}
}
function prepareResult(data){const champion=series.complete;$('#duelMedal').classList.toggle('hidden',!champion);$('#intermission').classList.toggle('duel-finished',champion);$('#winnerPortrait').classList.toggle('hidden',data===null);if(data!==null){$('#winnerPortrait').src='assets/reactions/'+(data?'flavio':'lula')+'-laugh-v6.png';$('#winnerPortrait').alt=names[data]+' comemorando a rodada';}$('#roundStats').classList.remove('hidden');$('#roundStats').innerHTML='<div class=stats-head><span>NESTA RODADA</span><b>Lula</b><b>Flávio</b></div>'+[['bombs','Algemas colocadas'],['hits','Acertos no rival'],['powers','Poderes coletados'],['bricks','Tijolos quebrados']].map(([k,label])=>'<div><span>'+label+'</span><b>'+game.stats[0][k]+'</b><b>'+game.stats[1][k]+'</b></div>').join('');$('#pauseEyebrow').textContent='Encerrada a sessão';$('#pauseTitle').textContent=champion?names[data]+' venceu o duelo!':data===null?'Empate técnico!':names[data]+' levou essa.';$('#pauseText').textContent=champion?'Placar final: '+scores[0]+' × '+scores[1]+(duelStored?'. Resultado salvo no Meu placar.':'. Histórico indisponível neste navegador.'):data===null?'Empate não soma pontos. A próxima rodada decide.':series.target?'Placar: '+scores[0]+' × '+scores[1]+'. Vence quem chegar a '+series.target+' vitórias.':'Vitória na arena. A urna de verdade é outra história.';$('#resume').classList.add('hidden');$('#newRound').classList.toggle('hidden',champion);$('#restart').className=champion?'paint-button primary':'paper-link';$('#restart').textContent=champion?'NOVA DISPUTA ➜':'Recomeçar a disputa';$('#intermission').classList.add('hidden');}
function updateLifeHud(id,p){const node=$('#life'+id),max=p.maxLife||3,life=Math.max(0,p.life);node.textContent=max>8?'♥ '+life+'/'+max:'♥ '.repeat(life)+'♡ '.repeat(Math.max(0,max-life));node.setAttribute('aria-label',life+' de '+max+' pontos de vida');node.title=life+' de '+max+' pontos de vida';}
function sync(){if(!game)return;for(let id=0;id<2;id++){let p=game.players[id];updateLifeHud(id,p);$('#life'+id).closest('.hud-person').classList.toggle('last-life',p.life===1);$('#role'+id).textContent=mode==='solo'?(id===selected?'VOCÊ':'CPU'):(id===selected?'J1':'J2');$('#score'+id).textContent=scores[id];}let sec=Math.ceil(game.time);$('#timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');$('#stageName').textContent=stageNames[stage];$('#roundLabel').textContent='RODADA '+String(round).padStart(2,'0');$('#seriesGoal').textContent=series.target?'PRIMEIRO A '+series.target+' VITÓRIAS':'RODADAS LIVRES';let p=game.players[selected],stock=Math.max(0,p.capacity-game.bombs.filter(b=>b.owner===selected).length);$('#bombStock').textContent='● '+stock+' / '+p.capacity;$('#bombStock').title=stock+' algemas disponíveis de '+p.capacity;$('#bombStock').classList.toggle('empty',stock===0);$('#bombTouch').classList.toggle('empty',stock===0);$('#bombTouch small').textContent=stock+'/'+p.capacity+' ALGEMAS';let special=$('#specialReady');special.classList.toggle('hidden',!p.remote&&!p.glove);if(p.remote||p.glove){special.querySelector('b').textContent=p.remote?'Horário eleitoral':'Lança-santinho';$('#specialTouch').classList.add('ready');$('#specialTouch').title=p.remote?'Detonar suas algemas':'Arremessar uma algema';}else{$('#specialTouch').classList.remove('ready');$('#specialTouch').title='Colete um poder especial';}let powers=['range','capacity','speed',...Object.keys(POWER_INFO).filter(k=>!['range','capacity','speed'].includes(k)&&p[k])];let signature=powers.map(k=>k+':'+p[k]).join('|');if(signature!==lastHud){lastHud=signature;$('#arsenal').innerHTML=powers.map(k=>'<span title="'+POWER_INFO[k].name+'"><img src="'+world.miniURLs[k]+'" alt="'+POWER_INFO[k].name+'"><b>'+(['range','capacity','speed'].includes(k)?(k==='speed'?Math.round((p[k]+1)*10)/10:p[k]):k==='ghost'?Math.ceil(p[k])+'s':'')+'</b></span>').join('');}}
function start(reset=true){if(!ready)return;mobileFocus=true;$('#changeArena').classList.remove('hidden');soundtrack.unlock();if(!expansion.session)soundtrack.score('battle');for(let f of floating)f.el.remove();floating.length=0;streaks.fill(0);if(reset){round=1;series=new DuelSeries(preferences.series);scores=series.scores;duelSaved=false;duelStored=false;}else {if(series.complete)return;round++;}screen('match');applyPreferences();warned=false;countTick=-1;$('#roundNotice').textContent='';$('#timer').classList.remove('urgent');game=new ExpandedGame({stage,human:selected,bot:mode==='solo',difficulty:preferences.difficulty,duration:preferences.duration,onEvent,events:false,signatures:false,...expansion.gameOptions()});names=game.players.map(p=>expansion.character(p.id).name);for(let id=0;id<2;id++){const root=$('#life'+id).closest('.hud-person');root.classList.toggle('red',game.players[id].team===0);root.classList.toggle('blue',game.players[id].team===1);root.querySelector('strong').firstChild.textContent=names[id].toUpperCase()+' ';root.querySelector('.hud-face').style.backgroundImage='url('+expansion.character(id).portrait+')';}expansion.afterStart();game.players[0].dir=2;game.players[1].dir=2;world.build(game,stage);world.resize();state='countdown';launch=2.8;quoteIndex=[0,0];speechEnd=[0,0];lastHud='';$$('.speech').forEach(s=>s.classList.remove('visible'));$('#pickupToast').classList.remove('visible');$('#countdown').classList.remove('hidden');$('#keyboardTip').innerHTML=mode==='solo'?'WASD / ↑↓←→ <b>MOVER</b> &nbsp; ESPAÇO <b>ALGEMA</b> &nbsp; E <b>ESPECIAL</b> &nbsp; Q <b>EXCLUSIVO</b> &nbsp; P <b>PAUSA</b>':'J1: WASD + ESPAÇO + E &nbsp; | &nbsp; J2: SETAS + ENTER + SHIFT DIREITO';sync();world.renderer.domElement.focus({preventScroll:true});beep(450,.12);}
function pause(){if(online?.inMatch&&game instanceof OnlineView){toggleOnlineMenu();return;}expansion?.checkpoint();if(state==='match'||state==='countdown'||state==='ending'){previous=state;state='paused';soundtrack.stopVoice?.();keys.clear();clearTouch();$('#duelMedal').classList.add('hidden');$('#intermission').classList.remove('duel-finished');$('#restart').className='paper-link';$('#restart').textContent='Recomeçar a disputa';$('#winnerPortrait').classList.add('hidden');$('#roundStats').classList.add('hidden');$('#pauseEyebrow').textContent='Intervalo regimental';$('#pauseTitle').textContent='Sessão suspensa.';$('#pauseText').textContent='Até o pavio merece um café.';$('#resume').classList.remove('hidden');$('#newRound').classList.add('hidden');$('#intermission').classList.remove('hidden');}else if(state==='paused'){state=previous;$('#intermission').classList.add('hidden');world.renderer.domElement.focus({preventScroll:true});}}
function setup(){soundtrack.score(null);expansion.session=null;names=['Lula','Flávio'];selected=localDuelChoice.selected;stage=localDuelChoice.stage;mode='duo';screen('setup');$('#setup').classList.add('local-duel');$('#setup header h2').textContent='PvP Local';expansion.theme(selected?'flavio':'lula');for(const [key,value,style]of [['char',selected,'selected'],['stage',stage,'active'],['mode',mode,'active']])$$('[data-'+key+']').forEach(b=>{const chosen=b.dataset[key]===String(value);b.classList.toggle(style,chosen);b.setAttribute('aria-pressed',String(chosen));});$('#difficulty').disabled=true;$('#setupNote').textContent='J1: WASD + Espaço + E · J2: setas + Enter + Shift direito';$('#start').disabled=!ready;$('#loadStatus').textContent=ready?'Cenário 3D pronto. Pode abrir a sessão.':'Preparando o plenário 3D…';}
$('#changeArena').onclick=()=>{if(online?.active)return;game=null;setup();};$('#backHome').onclick=()=>{expansion.home();mainMenu.render('multiplayer');};$('#start').onclick=()=>start(true);$('#pause').onclick=pause;$('#resume').onclick=pause;$('#newRound').onclick=()=>start(false);$('#restart').onclick=()=>{if(!expansion.restart())start(true)};$('#exit').onclick=()=>{if(online?.active){void online.close();return;}expansion.home();};
$$('[data-char]').forEach(b=>b.onclick=()=>{selected=localDuelChoice.selected=Number(b.dataset.char);expansion?.theme(selected?'flavio':'lula');$$('[data-char]').forEach(a=>{a.classList.toggle('selected',a===b);a.setAttribute('aria-pressed',String(a===b))});beep(360,.05);});
$$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$('#difficulty').disabled=mode==='duo';$$('[data-mode]').forEach(a=>{a.classList.toggle('active',a===b);a.setAttribute('aria-pressed',String(a===b))});$('#setupNote').textContent=mode==='solo'?'WASD ou setas para andar · Espaço para algema · E para especial':'J1: WASD + Espaço + E · J2: setas + Enter + Shift direito';});
$$('[data-stage]').forEach(b=>b.onclick=()=>{stage=localDuelChoice.stage=Number(b.dataset.stage);$$('[data-stage]').forEach(a=>{a.classList.toggle('active',a===b);a.setAttribute('aria-pressed',String(a===b))});beep(320,.06);});
$$('.sound-toggle').forEach(b=>b.onclick=()=>{sound=!sound;soundtrack.setEnabled(sound);soundtrack.unlock();$$('.sound-toggle').forEach(a=>{a.setAttribute('aria-pressed',String(sound));a.setAttribute('aria-label',sound?'Desativar som':'Ativar som');if(a.classList.contains('paper-link'))a.textContent=sound?'♫ Som ligado':'♪ Som desligado';else a.textContent=sound?'♫':'♪';});beep(500,.09);});
async function expandScreen(){try{if(!document.fullscreenElement&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches){if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else{notify('Gire o iPhone para a horizontal. Pela Tela de Início, o jogo abre sem as barras do Safari.');return;}}try{await window.screen.orientation?.lock?.('landscape');}catch{}}catch{notify('Gire o aparelho para a horizontal. Seu navegador não liberou a tela cheia.')}}
$('#viewMode').onclick=()=>{world.focusArena=!world.focusArena;if(isMobileArena())mobileFocus=world.focusArena;else remember({focus:world.focusArena});world.resize();if(game)world.update(0,game,clock);let label=world.focusArena?'Mostrar entorno':'Aproximar arena';$('#viewMode').title=label;$('#viewMode').setAttribute('aria-label',label);$('#viewMode').setAttribute('aria-pressed',String(world.focusArena));};
$('#fullscreen').onclick=async()=>{if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}else await expandScreen();};
$('#rotateFullscreen').onclick=expandScreen;
let pausedForRotation=false;const portraitQuery=matchMedia('(max-width:800px) and (orientation:portrait)');portraitQuery.addEventListener('change',e=>{if(e.matches&&['match','countdown','ending'].includes(state)){pausedForRotation=true;pause();}else if(!e.matches&&pausedForRotation){pausedForRotation=false;if(state==='paused')pause();}});
function notify(text){let e=$('#fatal');e.textContent=text;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4000);}
const moves={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
function move(code){if(state!=='match'||onlineMenu)return;let id=mode==='duo'&&code.startsWith('Arrow')?1-selected:selected;if(game.move(id,...moves[code]))soundtrack.play('step',{x:game.players[id].x});}
document.addEventListener('keydown',e=>{if($('#dialog').open)return;const code=expansion?.translate(e.code)||e.code;if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)pause();return;}if(state!=='match'||onlineMenu)return;if(moves[code]||['Space','Enter','KeyE','ShiftRight'].includes(code))e.preventDefault();if(moves[code]){keys.add(code);if(!e.repeat)move(code);}if(!e.repeat){if(code==='KeyQ'&&(expansion.session||game instanceof OnlineView))game.signature(selected);if(code==='Space')game.place(selected);if(code==='KeyE')game.special(selected);if(mode==='duo'&&e.code==='Enter')game.place(1-selected);if(mode==='duo'&&e.code==='ShiftRight')game.special(1-selected);}});
document.addEventListener('keyup',e=>keys.delete(expansion?.translate(e.code)||e.code));window.addEventListener('blur',()=>{keys.clear();clearTouch();if(['match','countdown','ending'].includes(state))pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&['match','countdown','ending'].includes(state))pause()});
let touchPointer=null;function setTouch(button){touch=button?.dataset.move.split(',').map(Number)||null;$$('[data-move]').forEach(b=>b.classList.toggle('pressed',b===button));}function clearTouch(){touchPointer=null;setTouch(null);virtualJoystick?.reset();}$$('[data-move]').forEach(b=>{b.onpointerdown=e=>{if(state!=='match'||touchPointer!==null)return;e.preventDefault();touchPointer=e.pointerId;b.setPointerCapture(e.pointerId);setTouch(b);game.move(selected,...touch);};b.onpointermove=e=>{if(e.pointerId!==touchPointer)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-move]');setTouch(target);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{if(e.pointerId===touchPointer)clearTouch();});});
virtualJoystick=mountVirtualJoystick({container:$('.touch-pad'),enabled:()=>isMobileArena()&&state==='match',onDirection:dir=>{touch=dir?[dir.x,dir.y]:null;if(touch&&state==='match')game.move(selected,...touch);},onRelease:()=>{touch=null;}});
installMobileTouchGuard({arena:$('#match'),enabled:()=>isMobileArena()&&['match','countdown','ending'].includes(state)&&!onlineMenu&&!$('#dialog').open&&$('#intermission').classList.contains('hidden')});
$('#bombTouch').onpointerdown=e=>{e.preventDefault();if(state==='match')game.place(selected)};$('#specialTouch').onpointerdown=e=>{e.preventDefault();if(state==='match')game.special(selected)};
let resumeOnClose=false;
function panel(type){if(type==='powers')type='help';if(type==='audio')type='settings';if(type==='history'){expansion.achievements();return;}resumeOnClose=state==='match'||state==='countdown';if(resumeOnClose)pause();let title,html;


if(type==='help'){title='Manual de uma sessão tumultuada';html='<h2>O plenário é todo seu.</h2><p>Abra caminho nas paredes de tijolos, colete melhorias e esgote a resistência do adversário. Algemas abrem correntes em cruz e atingem qualquer personagem, inclusive quem as colocou.</p><div class="help-row"><b>Solo</b><span>WASD ou setas: andar. Espaço: algema. E: ação do item. Q: habilidade exclusiva.<br>No celular, jogue na horizontal com direcional à esquerda e algema/especial à direita. O som é liberado pelo primeiro toque; o botão ♫ permite silenciar.</span></div><div class="help-row"><b>Dupla local</b><span>J1 (personagem escolhido): WASD, Espaço, E.<br>J2: setas, Enter, Shift direito. Os dois usam o mesmo teclado.</span></div><div class="help-row"><b>Algemas</b><span>Temporizador normal de 2,35 s. A corrente para nos blocos de metal e quebra tijolos. Uma algema pode detonar outras. Controle remoto: detone com a ação especial; após 5 s ela se abre sozinha.</span></div><div class="help-row"><b>Especiais</b><span>Arremesso: olhe na direção da algema vizinha e use E / Shift direito. Chute: caminhe contra a algema. Se tiver controle remoto e arremesso, o controle tem prioridade.</span></div><div class="help-row"><b>Pausa & fim</b><span>P ou Ⅱ pausa. O menu fica fora da partida. Ao terminar o tempo escolhido, há empate se ambos tiverem vidas. Melhor de três: vence quem somar 2 vitórias; melhor de cinco: 3 vitórias. Empates não somam pontos. Disputas concluídas ficam em Configurações → Conquistas → Seu placar de duelos. Rodadas livres continuam sem final fixo.</span></div><p>Mapa e itens são simétricos entre os cantos. Caricaturas, falas e cores não dão vantagem de jogo. Os personagens viram para quatro direções e animam passos contínuos, respiração, colocação de algema e dano.</p>';}

if(type==='settings'){title='Do seu jeito';html='<h2>Imagem & conforto</h2><p>Preferências salvas neste navegador. A luz do cenário é escolhida antes da rodada.</p><div class="settings-list"><label><span><b>Qualidade de imagem</b><small>Leve reduz a resolução de renderização.</small></span><select id="quality"><option value="high">Detalhada</option><option value="light">Leve</option></select></label><label><span><b>Movimento reduzido</b><small>Reduz partículas, movimentos decorativos e tremor da câmera.</small></span><input id="reduceMotion" type="checkbox" '+(preferences.reduced?'checked':'')+'></label><label><span><b>Comemorações nos cantos</b><small>Caricaturas animadas ao acertar o rival.</small></span><input id="celebrationSetting" type="checkbox" '+(preferences.celebrations?'checked':'')+'></label></div><p>O jogo também respeita a preferência de movimento reduzido do seu aparelho.</p>';}
if(type==='help')html+='<section class="integrated-section" id="manualPowers">'+powersMarkup(world)+'</section>';
if(type==='settings')html+='<section class="integrated-section" id="settingsAudio">'+audioMarkup(soundtrack)+'</section>';
if(type==='about'){title='SÁTIRA, ESTRATÉGIA E CONFUSÃO';html=aboutMarkup();}
if(type==='sources'){title='O arquivo do debate';html='<h2>Vozes, arte e referências.</h2><p>Ao causar dano ao adversário, o autor da algema ganha uma comemoração com caricatura e áudio real. As citações adicionais abaixo compõem o arquivo textual do jogo. Autoatingimento e dano absorvido por escudo não geram comemoração. As frases abaixo foram encontradas em declarações publicadas na web. O jogo reutiliza trechos curtos em situações inventadas: nenhum deles foi dito sobre algemas ou sobre esta partida. As falas de Flávio são declarações documentadas, sem apresentá-las como bordões tão conhecidos quanto os de Lula.</p>'+QUOTES.flatMap((arr,id)=>arr.map(q=>'<article class="source-row"><b>'+['Lula','Flávio'][id]+'</b><q>'+q.text+'</q><small>'+q.context+' <a target="_blank" rel="noopener noreferrer" href="'+q.url+'">'+q.source+' ↗</a></small></article>')).join('')+'<p>Sátira independente, sem vínculo com partidos ou campanhas e sem recomendação de voto. As caricaturas são ilustrações geradas por IA; não são fotografias. Os itens usam o humor e o vocabulário das eleições. Não há voz clonada.</p><p>Ambiente em 3D e caricaturas ilustradas em quatro ângulos, animadas sobre a cena. Arte e código originais; inspiração no gênero de labirintos com algemas. <a href="ELENCO-FONTES.md" target="_blank">Fontes públicas do elenco ampliado</a>. Esta edição preserva dez melhorias clássicas, sem reproduzir todos os recursos de toda a franquia Bomberman.</p>';}
if(type==='sources')html+='<details class="archive-credits"><summary>Arte, arquitetura e efeitos originais</summary><p>Rampa: ilustração gerada e adaptada de referências de <a href="https://commons.wikimedia.org/wiki/File:Fachada_do_Pal%C3%A1cio_do_Planalto.jpg" target="_blank" rel="noopener">Pedro França / Agência Senado</a> e da obra <a href="https://commons.wikimedia.org/wiki/File:Planalto_Palace_ramp_and_parlatorium.jpg" target="_blank" rel="noopener">Planalto Palace ramp and parlatorium, Flickr 24859660@N07</a>, ambas sob <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener">CC BY 2.0</a>. Enquadramento, luz e apresentação foram alterados; a rampa usa essa composição ilustrada.</p><p>Modelos dos cenários inspirados em referências institucionais. <a href="PESQUISA-CENARIOS-V10.md" target="_blank">Referências de arquitetura</a>. Vinhetas e capturas metálicas desta edição: composição e síntese originais assistidas por Codex, sem samples de terceiros.</p></details>';
if(type==='sources')html+='<details class="archive-credits"><summary>Fotografias reais dos locais</summary><div id=photoCredits></div><p><a href="PHOTO-CREDITS.md" target="_blank">Créditos completos das fotografias ↗</a></p></details><p>Trilhas de batalha: Kevin MacLeod (incompetech.com), sob CC BY 4.0. Vinhetas e efeitos procedurais: Batalha das Urnas. <a href="music-v12-credits.json" target="_blank">Créditos musicais ↗</a>.</p>';
if(type==='sources')html+='<p><a href="CREDITOS.txt" target="_blank" rel="noopener">Créditos completos e licenças ↗</a></p>';
if(type==='sources')html+='<details class="archive-credits"><summary>Fontes e contexto das vozes</summary><div id=voiceCredits></div></details>';
$('#dialog').dataset.panel=type;$('#dialogTag').textContent=title;$('#dialogBody').innerHTML=html;$('#dialog').showModal();if(type==='about')$('#aboutSources').onclick=()=>panel('sources');if(type==='sources')fetch('assets/scene-photos/credits.json').then(r=>r.json()).then(data=>{const node=$('#photoCredits');if(!node)return;for(const photo of data.photos){const row=document.createElement('article');row.className='source-row';const title=document.createElement('b');title.textContent=photo.description;row.append(title);const author=document.createElement('small');author.textContent=photo.author+' · '+photo.license;row.append(author);const changes=document.createElement('small');changes.textContent='Redimensionamento, conversão WebP e vinheta de iluminação. Licença original preservada.';row.append(changes);for(const [text,url]of [['Fotografia original ↗',photo.sourcePage],[photo.license,photo.licenseUrl]]){const link=document.createElement('a');link.textContent=text;link.href=url;link.target='_blank';link.rel='noopener';link.style.marginRight='12px';row.append(link);}node.append(row);}}).catch(()=>{});if(type==='sources'){soundtrack.voiceManifest.then(()=>{const node=$('#voiceCredits');if(!node)return;node.replaceChildren();const intro=document.createElement('p');intro.textContent='Fontes, autores e contexto das gravações utilizadas no jogo.';node.append(intro);for(const clip of soundtrack.voiceClips){const row=document.createElement('article');row.className='source-row';const heading=document.createElement('b');heading.textContent=(CHARACTERS[clip.characterId]?.name||['Lula','Flávio'][clip.candidate]||'Voz')+' · '+clip.text;row.append(heading);for(const text of [clip.context,'Gravação: '+clip.author+' · '+clip.date,clip.changes,clip.rightsNotice||clip.license]){const small=document.createElement('small');small.textContent=text;row.append(small);}for(const [text,url] of [['Vídeo original ↗',clip.originalUrl],[clip.license,clip.licenseUrl]]){const link=document.createElement('a');if(url){link.href=url;link.target='_blank';link.rel='noopener';}link.textContent=text;link.style.marginRight='12px';row.append(link);}node.append(row);}});}if(type==='settings'){$('#celebrationSetting').onchange=e=>{remember({celebrations:e.target.checked});if(!e.target.checked)celebrations.clear();};$('#quality').value=preferences.quality;$('#quality').onchange=e=>{remember({quality:e.target.value});applyPreferences();if(game)world.update(0,game,clock);};$('#reduceMotion').onchange=e=>{remember({reduced:e.target.checked});applyPreferences();};}if(type==='settings'){
 const trackList=document.createElement('div');trackList.className='track-list';trackList.classList.toggle('hidden',!!soundtrack.scoreKind);$('#nextTrack').disabled=!!soundtrack.scoreKind;soundtrack.playlist.forEach((tr,i)=>{const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0')+'  '+tr.title;b.onclick=()=>{soundtrack.selectTrack(i);$('#trackName').textContent=soundtrack.getTrack().title;};trackList.append(b);});$('.track-card').append(trackList);
 $('#nextTrack').onclick=()=>{soundtrack.nextTrack();$('#trackName').textContent=soundtrack.getTrack().title;};
 $('#musicVolume').oninput=e=>{soundtrack.setMusicVolume(Number(e.target.value)/100);$('#musicValue').textContent=e.target.value+'%';};
 const voiceRow=document.createElement('label');voiceRow.innerHTML='Vozes <input id=voiceVolume aria-label="Volume das vozes" type=range min=0 max=100 value="'+Math.round(preferences.voice*100)+'"><output id=voiceValue>'+Math.round(preferences.voice*100)+'%</output>';$('.audio-settings').append(voiceRow);$('#voiceVolume').oninput=e=>{soundtrack.setVoiceVolume(Number(e.target.value)/100);$('#voiceValue').textContent=e.target.value+'%';};
 $('#effectsVolume').oninput=e=>{soundtrack.setEffectsVolume(Number(e.target.value)/100);$('#effectsValue').textContent=e.target.value+'%';};
 }}
$$('[data-panel]').forEach(b=>b.onclick=()=>panel(b.dataset.panel));$('#closeDialog').onclick=()=>$('#dialog').close();$('#dialog').addEventListener('close',()=>{if(browserExited){browserExited=false;soundtrack.setScene('home');void soundtrack.unlock();}soundtrack.stopVoice?.();if(resumeOnClose&&state==='paused')pause();resumeOnClose=false;});
function loop(now){if(browserExited){last=now;requestAnimationFrame(loop);return;}const dt=Math.min(.05,(now-last)/1000||.016);last=now;if(portraitQuery.matches&&['match','countdown','ending'].includes(state)&&!online?.inMatch){pausedForRotation=true;pause();}online?.update(dt);if(online?.inMatch&&game instanceof OnlineView){renderOnlineFrame(dt);requestAnimationFrame(loop);return;}soundtrack.setScene($('#dialog').open&&$('#dialog').dataset.panel==='settings'?'home':['match','countdown','ending'].includes(state)?'match':state==='paused'?'paused':state==='end'?'end':'home');soundtrack.update(dt,game);document.body.classList.toggle('no-flashes',!expansion.settings.flashes);if(state!=='paused')celebrations.update(dt);if($('#trackName')&&$('#dialog').open)$('#trackName').textContent=soundtrack.getTrack().title;if(['match','countdown','ending'].includes(state)&&!$('#dialog').open){clock+=dt;if(state==='countdown'){launch-=dt;let tick=Math.ceil(launch-.75);if(tick>0&&tick!==countTick){countTick=tick;soundtrack.play('countdown',{value:tick});}$('#countdown').textContent=launch>.75?Math.ceil(launch-.75):'VALENDO!';if(launch<=0){state='match';$('#countdown').classList.add('hidden');soundtrack.play('countdown',{value:0});}}else if(state==='match'){for(let list of [['KeyW','KeyS','KeyA','KeyD'],['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']]){let key=[...keys].reverse().find(k=>list.includes(k));if(key)move(key);}if(touch)game.move(selected,...touch);game.update(dt);if(game.time<=30&&!warned&&!game.done){warned=true;$('#timer').classList.add('urgent');$('#roundNotice').textContent='ÚLTIMOS 30 SEGUNDOS';$('#roundNotice').classList.remove('announce');void $('#roundNotice').offsetWidth;$('#roundNotice').classList.add('announce');soundtrack.play('countdown',{value:0});}}
for(let id=0;id<2;id++)if(clock>speechEnd[id])$('#speech'+id).classList.remove('visible');if(clock>toastEnd)$('#pickupToast').classList.remove('visible');if(frameCount++%3===0){sync();expansion.hud();}world.update(dt,game,clock);updateFloating();if(state==='ending'&&clock>=endAt)revealResult();}
expansion?.update(dt);requestAnimationFrame(loop);}
expansion=new Expansion({game:()=>game,world:()=>world,state:()=>state,ready:()=>ready,audio:soundtrack,celebrations,celebrationsEnabled:()=>preferences.celebrations,screen,notify,celebrate,holdEnding,waitForVictory,clear:()=>{game=null;},begin:base=>{selected=0;stage=base;mode='solo';start(true);},end:beginEnding});
account=new AccountClient(gameAccountBridge({expansion,preferences,remember,canApply:()=>!browserExited&&!online?.room&&!['match','countdown','ending','paused','online-wait'].includes(state),session:identity=>{const id=identity?.id||null;if(id!==accountId&&online?.active)void online.close();accountId=id;},applied:()=>{game=null;sound=preferences.sound;soundtrack.setEnabled(sound);soundtrack.setMusicVolume(preferences.music);soundtrack.setEffectsVolume(preferences.effects);soundtrack.setVoiceVolume(preferences.voice);audioButtons();applyPreferences();for(const key of ['difficulty','duration','light','series'])$('#'+key).value=preferences[key];},navigate:url=>{window.location.assign(url);}}));
accountUI=new AccountUI(account,{showAccount:()=>{expansion.theme(expansion.progress.state.selected);screen('accountScreen');},home:()=>expansion.home()});
expansion.progress.onCommit=()=>account.localChanged();expansion.b.preferencesChanged=()=>account.localChanged();onPreferencesChanged(()=>account.localChanged());
online=new OnlineController({account:()=>account,progress:()=>expansion.progress.state,ready:()=>ready,theme:id=>expansion.theme(CHARACTERS[id]?.pvpTeam||id),showOnline:()=>{onlineMenu=false;screen('onlineScreen');},home:closeOnlineHome,startMatch:startOnlineMatch,snapshot:applyOnlineSnapshot,event:onEvent,state:onlineState,beforeResult:beforeOnlineResult,result:onlineResult,notify,availability:()=>{}});
gameExit=installGameExit({desktop:window.urnaDesktop,
 save:()=>persistGameForExit({expansion,preferences,account,saveHistory:()=>{if(series.complete&&!duelStored){duelStored=saveDuel(series,stage,mode);return duelStored;}return true;}}),
 onError:()=>notify('Não foi possível salvar. O jogo continua aberto. Tente sair novamente ou exporte seu progresso em Controles e Progresso.'),
 onBrowserExit:()=>{navigationVersion++;browserExited=true;keys.clear();clearTouch();playerHelp?.close();soundtrack.setScene('paused');resumeOnClose=false;$('#dialog').dataset.panel='exit';$('#dialogTag').textContent='Progresso salvo';$('#dialogBody').innerHTML='<h2>Até a próxima batalha.</h2><p>Suas campanhas, evolução e coleção estão salvas neste aparelho. Você já pode fechar esta aba.</p><button id="returnToGame" class="paint-button primary">Voltar ao jogo</button>';$('#dialog').showModal();$('#returnToGame').onclick=()=>$('#dialog').close();}
});
mainMenu=mountMainMenu({home:$('#home'),nav:$('.home-nav'),onNavigate:()=>navigationVersion++,onAction:key=>{navigationVersion++;
 if(key==='collection')return expansion.collection();
 if(['campaign','quick','survival','chaos','bossrush','achievements','config'].includes(key))return expansion.open(key);
 if(key==='profile'){expansion.home();void accountUI.open();return;}
 if(key==='online'){void openOnlineMode();return;}
 if(key==='local'){setup();return;}
 if(key==='quit'){void gameExit.request();return;}
 panel(key==='preferences'?'settings':key);
}});
expansion.b.homeMenu=()=>mainMenu.render('root');
if(accountUI.needsAttention)void accountUI.open();
playerHelp=installPlayerHelp({getProgress:()=>expansion.progress,getCharacter:()=>expansion.session?.hero||expansion.progress.state.selected});
try{world=new World($('#world'));$('#start').disabled=true;await world.load();ready=true;applyPreferences();$('#start').disabled=false;$('#loadStatus').textContent='Cenário 3D pronto. Pode abrir a sessão.';requestAnimationFrame(loop);}catch(e){console.error(e);$('#loadStatus').textContent='Não foi possível iniciar o cenário 3D.';$('#start').disabled=true;$('#fatal').textContent='O modo 3D precisa de WebGL. Tente um navegador atualizado com aceleração gráfica ativada. Detalhe: '+e.message;$('#fatal').classList.remove('hidden');}
