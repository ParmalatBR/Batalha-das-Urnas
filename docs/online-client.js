import {CHARACTERS as C,SCENES,VARIANTS,ATTRIBUTES} from './registry.js';
import {DEFAULT_RULES,PUBLIC_PRESETS,PROTOCOL_VERSION} from './online-rules.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const teamName=team=>team==='lula'?'Núcleo Lula':team==='flavio'?'Núcleo Flávio':'Internacional';
const options=(rows,value)=>rows.map(([id,label])=>`<option value="${esc(id)}"${String(id)===String(value)?' selected':''}>${esc(label)}</option>`).join('');
const image=id=>C[id]?`<img src="${esc(C[id].portrait)}" alt="Caricatura de ${esc(C[id].name)}" draggable="false">`:'';
const playingPhases=new Set(['countdown','playing','paused','round-result']);
const lobbyPhases=new Set(['waiting','lobby']);
const resultPhases=new Set(['result','round-result']);
const blankInput=()=>({dx:0,dy:0,bomb:false,special:false,signature:false});

export function onlineEndpoint(value){
 const url=new URL(String(value));
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('ENDPOINT_INVALID');
 if(!['https:','wss:','http:','ws:'].includes(url.protocol))throw Error('ENDPOINT_INVALID');
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(!local&&!['https:','wss:'].includes(url.protocol))throw Error('SECURE_CONNECTION_REQUIRED');
 url.protocol=url.protocol==='wss:'?'https:':url.protocol==='ws:'?'http:':url.protocol;
 return url.href.replace(/\/$/,'');
}
export function ruleRows(r){
 return [
  ['Arena',SCENES.find(s=>s.id===r.sceneId)?.name||'Arena indisponível'],
  ['Formato','Melhor de '+r.bestOf],['Tempo por rodada',r.duration+' segundos'],
  ['Itens',({none:'Sem itens',scarce:'Poucos',normal:'Normais'})[r.itemFrequency]||r.itemFrequency],
  ['Habilidades exclusivas',r.signatures?'Ligadas':'Desligadas'],
  ['Atributos',r.normalized?'Normalizados · iguais para todos':'Evolução RPG · perfil online'],
  ['Eventos da arena',r.events?'Ligados':'Desligados'],['Vidas iniciais',r.lives],
  ['Algema',VARIANTS[r.variant]?.name||r.variant],
  ['Regra extra',({none:'Sem regra extra',fast:'Passos rápidos',stock:'Estoque reforçado',giant:'Correntes longas',tiny:'Caricaturas em miniatura',dark:'Pouca luz'})[r.modifier]||r.modifier]
 ];
}
export function onlineError(error){
 const code=String(error?.code||error?.message||error||'');
 const known={AUTH_REQUIRED:'Entre com seu apelido em Meu perfil para disputar online.',ACCOUNT_SERVER_MISMATCH:'O perfil está conectado a outro serviço. Volte ao menu e conecte-se novamente.',SERVICE_ENDED:'As partidas online deste serviço foram encerradas. Sua campanha e os demais modos offline continuam disponíveis.',NO_OPPONENT:'Ainda não há rival disponível com essas condições.',ROOM_NOT_FOUND:'Essa sala não foi encontrada. Confira o código.',ROOM_FULL:'A sala já tem dois participantes.',SAME_TEAM:'Na partida pública, escolha um personagem do núcleo rival.',CHARACTER_LOCKED:'Esse personagem ainda não está liberado no seu perfil online.',INVALID_CHARACTER:'Esse personagem não está disponível nesta modalidade.',REVISION_MISMATCH:'As regras mudaram. Leia a nova revisão e aceite novamente.',NOT_HOST:'Só o anfitrião pode alterar as regras.',MATCH_STARTED:'A rodada já começou. As regras ficam fixas até o retorno ao lobby.',RATE_LIMITED:'Muitas solicitações seguidas. Aguarde alguns segundos.',PROTOCOL_MISMATCH:'Atualize o jogo para entrar neste servidor.',SECURE_CONNECTION_REQUIRED:'Este servidor precisa de uma conexão segura.',ENDPOINT_INVALID:'O endereço do servidor não está configurado corretamente.',UNAUTHORIZED:'A sessão online expirou. Entre novamente.',DISABLED:'O serviço online ainda não está disponível.',TIMEOUT:'O servidor demorou para responder. Tente novamente.'};
 return known[code]||(/^[\p{L}\p{N}\s.,;:!?()–—-]{5,180}$/u.test(code)&&/[áéíóúãõç]|\s/.test(code)?code:'Não foi possível completar a conexão. Confira a internet e tente novamente.');
}

/** Real Colyseus transport; all combat decisions and readiness are server-owned. */
export class OnlineController{
 constructor(bridge={},deps={}){
  this.b=bridge;this.d=deps;this.doc=deps.document||globalThis.document;this.fetch=deps.fetch||globalThis.fetch.bind(globalThis);this.now=deps.now||(()=>Date.now());
  this.storage=deps.storage;this.sessionStorage=deps.sessionStorage;try{this.storage??=globalThis.localStorage;this.sessionStorage??=globalThis.sessionStorage;}catch{}
  this.loadSDK=deps.loadSDK||(()=>import('./vendor/colyseus.js'));this.root=deps.root||this.doc.createElement('section');this.root.id='onlineScreen';this.root.className='screen online-screen hidden';
  this.root.classList.add('hidden');if(!deps.root)this.doc.querySelector('#app').append(this.root);
  this.root.addEventListener('click',e=>this.click(e));this.root.addEventListener('change',e=>this.change(e));this.root.addEventListener('submit',e=>this.submit(e));
  this.phase='closed';this.available=false;this.mode='public';this.team='lula';this.characterId='lula';this.draft={...DEFAULT_RULES};this.preset='standard';this.seq=0;this.inputAge=0;this.pingAge=0;this.pendingInput=blankInput();this.op=0;this.room=null;this.lobby=null;this.result=null;this.resultKeys=new Set();this.resultPresentation=null;this.resultAwaitingKey=null;this.profile=null;this.latency=null;this.message='';this.error='';this.acceptedRevision=null;this.lastTick=-1;this.lastRound=null;
  try{this.inviteCode=new URL(globalThis.location?.href||'http://localhost').searchParams.get('sala')?.replace(/[^A-Za-z0-9-]/g,'').slice(0,16)||'';}catch{this.inviteCode='';}
  this.ready=this.probe();
 }
 get active(){return this.phase!=='closed';}
 get inMatch(){return !!this.room&&(playingPhases.has(this.phase)||this.resultDeferred);}
 get resultDeferred(){return resultPhases.has(this.phase)&&!!(this.resultPresentation||this.resultAwaitingKey);}
 cancelResultPresentation(){clearTimeout(this.resultPresentation?.timer);this.resultPresentation=null;this.resultAwaitingKey=null;}
 resultIdentity(data={}){return (data.matchId||this.lobby?.matchId||this.room?.roomId||'')+':'+(data.roundId||this.lobby?.roundId||data.round||0);}
 get localSlot(){return this.lobby?.players?.find(p=>p.sessionId===this.room?.sessionId)?.slot??0;}
 get isHost(){return !!this.room&&(this.lobby?.hostSessionId===this.room.sessionId||this.lobby?.hostSlot===this.localSlot);}
 get connected(){return !!this.room&&!['reconnecting','disconnected','closed'].includes(this.phase);}
 get identity(){return this.b.account?.();}
 get roster(){const r=this.lobby?.rules||this.draft,useVerified=this.mode==='private'&&r.normalized===false,source=useVerified?(Array.isArray(this.profile?.rpgUnlocked)?this.profile.rpgUnlocked:this.b.account?[]:this.profile?.unlocked):this.profile?.unlocked;const ids=Array.isArray(source)?source:[];return ids.filter(id=>C[id]&&(this.mode==='private'||C[id].pvpTeam===this.team));}
 storageKey(kind){return 'bdu-online-'+kind+'-v1:'+this.endpoint;}
 readStored(kind,session=false){try{return (session?this.sessionStorage:this.storage)?.getItem(this.storageKey(kind))||'';}catch{return '';}}
 store(kind,value,session=false){try{const s=session?this.sessionStorage:this.storage;if(value)s?.setItem(this.storageKey(kind),value);else s?.removeItem(this.storageKey(kind));}catch{}}
 async request(route,{method='GET',body,auth=true}={}){
  if(auth&&this.b.account){const account=this.identity;if(!account?.account||!account.token)throw Error('AUTH_REQUIRED');if(account.endpoint!==this.endpoint)throw Error('ACCOUNT_SERVER_MISMATCH');this.token=account.token;}
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await this.fetch(this.endpoint+route,{method,cache:'no-store',signal:controller.signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth&&this.token?{Authorization:'Bearer '+this.token}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok){const error=Error(response.status===401?'UNAUTHORIZED':response.status===429?'RATE_LIMITED':data.error?.code||data.code||(typeof data.error==='string'?data.error:'REQUEST_FAILED'));error.status=response.status;throw error;}return data;
  }catch(error){if(error.name==='AbortError')throw Error('TIMEOUT');throw error;}finally{clearTimeout(timeout);}
 }
 async probe(){
  try{
   const response=await this.fetch('online-config.json',{cache:'no-store'});if(!response.ok)throw Error('DISABLED');this.config=await response.json();
   if(this.config.enabled!==true||!this.config.endpoint)throw Error('DISABLED');
   this.endpoint=onlineEndpoint(this.config.endpoint);if(this.config.protocol!==PROTOCOL_VERSION)throw Error('PROTOCOL_MISMATCH');
   const health=await this.request('/health',{auth:false});if(health.protocol!==PROTOCOL_VERSION)throw Error('PROTOCOL_MISMATCH');this.lifecycle=health.lifecycle||null;
   this.available=true;this.error='';this.b.availability?.(true);return true;
  }catch(error){this.available=false;this.error=onlineError(error);this.b.availability?.(false);return false;}
 }
 async loadProfile(){
  if(this.b.account){const account=this.identity;await account?.ready;if(!account?.account||!account.token)throw Error('AUTH_REQUIRED');const data=await this.request('/api/profile');this.profile=data.profile||data;this.ensureCharacter();return this.profile;}
  this.token=this.readStored('profile');
  if(this.token){try{const data=await this.request('/api/profile');this.profile=data.profile||data;}catch(error){if(error.status!==401)throw error;this.token='';this.store('profile','');}}
  if(!this.token){const data=await this.request('/api/profile',{method:'POST',body:{},auth:false});if(!data.token||!data.profile)throw Error('INVALID_PROFILE');this.token=data.token;this.profile=data.profile;this.store('profile',this.token);}
  this.ensureCharacter();return this.profile;
 }
 ensureCharacter(){if(!this.roster.includes(this.characterId))this.characterId=this.roster[0]||'';if(this.characterId)this.b.theme?.(this.characterId);}
 async open(){
  if(this.room){this.reveal();this.render();return;}
  const operation=++this.op;this.phase='connecting';this.reveal();this.render();
  if(!await this.ready){if(operation===this.op){this.phase='unavailable';this.render();}return;}
  if(this.lifecycle?.ended){this.phase='unavailable';this.error=onlineError(Error('SERVICE_ENDED'));this.render();return;}
  try{await this.loadProfile();if(operation!==this.op)return;this.phase='mode';if(this.inviteCode){this.mode='private';this.ensureCharacter();this.phase='setup';}this.error='';this.render();}
  catch(error){if(operation===this.op){this.phase='unavailable';this.error=onlineError(error);this.render();}}
 }
 reveal(){if(this.resultDeferred)return;if(this.root.classList.contains('hidden'))this.b.showOnline?.();this.root.classList.remove('hidden');}
 notifyState(){const key=JSON.stringify([this.phase,this.localSlot,this.lobby?.round,this.lobby?.scores]);if(key!==this.stateKey){this.stateKey=key;this.b.state?.(this.phase,this.meta());}}
 meta(extra={}){return {phase:this.phase,localSlot:this.localSlot,roomId:this.room?.roomId,matchId:this.latestSnapshot?.matchId||this.lobby?.matchId,roundId:this.latestSnapshot?.roundId||this.lobby?.roundId,rules:this.lobby?.rules||this.draft,players:this.lobby?.players||[],round:this.lobby?.round||this.latestSnapshot?.round||1,scores:this.lobby?.scores||[0,0],countdown:Math.max(0,((this.lobby?.startAt||0)-this.now()-(this.serverOffset||0))/1000),startAt:this.lobby?.startAt,latency:this.latency,...extra};}
 async getClient(){if(!this.client){const sdk=await this.loadSDK();this.client=new sdk.Client(this.endpoint);}return this.client;}
 async join(action,code=''){
  if(this.room||!this.available||!this.characterId)return false;
  if(this.mode==='public')this.draft={...this.draft,normalized:true};
  const operation=++this.op;this.phase='connecting';this.error='';this.message='Reservando sua cadeira na arena…';this.render();
  try{
   const client=await this.getClient();if(operation!==this.op)return false;
   const data=await this.request('/api/match',{method:'POST',body:{protocol:PROTOCOL_VERSION,mode:this.mode,action,characterId:this.characterId,...(code?{code:code.trim().toUpperCase()}:{}),rules:{...this.draft},filters:{...this.draft}}});
   if(operation!==this.op)return false;if(!data.reservation)throw Error('INVALID_RESERVATION');
   const room=await client.consumeSeatReservation(data.reservation);if(operation!==this.op){await room.leave(true);return false;}
   this.attach(room);return true;
  }catch(error){if(operation===this.op){if(error.code==='SERVICE_ENDED'||error.message==='SERVICE_ENDED')this.lifecycle={...this.lifecycle,ended:true};this.phase=this.lifecycle?.ended?'unavailable':'setup';this.error=onlineError(error);this.render();}return false;}
 }
 attach(room){
  this.cancelResultPresentation();this.room=room;this.phase='waiting';this.error='';this.message='';this.result=null;this.resultKey=null;this.resultFingerprint=null;this.lastTick=-1;this.lastRound=null;this.latestSnapshot=null;this.seq=0;this.pendingInput=blankInput();this.lobby=null;this.acceptedRevision=null;this.lobbyViewKey=null;this.ruleDraft=null;this.store('room',room.reconnectionToken,true);
  if(this.b.account)this.store('room-owner',this.identity?.account?.id||'',true);
  if(room.reconnection){room.reconnection.maxRetries=10;room.reconnection.maxEnqueuedMessages=0;}
  const current=()=>this.room===room;
  room.onMessage('lobby',data=>{if(current())this.receiveLobby(data);});
  room.onMessage('snapshot',data=>{if(current())this.receiveSnapshot(data);});
  room.onMessage('event',data=>{if(current()&&typeof data?.type==='string')this.b.event?.(data.type,data.data);});
  room.onMessage('result',data=>{if(current())this.receiveResult(data);});
  room.onMessage('probe',data=>{if(current()&&typeof data?.id==='string'&&data.id.length<=100)room.send('probe',{id:data.id});});
  room.onMessage('pong',data=>{if(current()&&Number.isFinite(data?.at)){this.latency=Math.max(0,Math.round(this.now()-data.at));if(Number.isFinite(data.serverTime))this.serverOffset=data.serverTime+this.latency/2-this.now();this.paintLatency();}});
  room.onMessage('error',data=>{if(current()){this.error=onlineError(data);this.render();}});
  room.onDrop?.(()=>{if(!current())return;this.cancelResultPresentation();this.previousPhase=this.phase;this.phase='reconnecting';this.pendingInput=blankInput();this.reveal();this.notifyState();this.render();});
  room.onReconnect?.(()=>{if(!current())return;this.cancelResultPresentation();this.store('room',room.reconnectionToken,true);this.error='';this.phase='waiting';this.lastTick=-1;this.lastRound=null;this.notifyState();room.send('sync',{});this.render();});
  room.onLeave(()=>{if(!current())return;this.cancelResultPresentation();this.room=null;this.phase='disconnected';this.pendingInput=blankInput();this.reveal();this.notifyState();this.render();});
  room.onError?.((code,message)=>{if(current()){this.error=onlineError({code,message});if(!this.inMatch)this.render();}});
  room.send('sync',{});this.notifyState();this.render();
 }
 receiveLobby(data){
  if(!data||!Array.isArray(data.players)||!data.rules||!Number.isInteger(data.revision))return;
  const old=this.lobby,changed=!!old&&old.revision!==data.revision;
  this.lobby=data;this.mode=data.mode||this.mode;this.draft={...data.rules};const me=data.players.find(p=>p.sessionId===this.room?.sessionId);if(me?.characterId){const selectionChanged=this.characterId!==me.characterId;this.characterId=me.characterId;this.team=C[me.characterId]?.pvpTeam||this.team;if(selectionChanged)this.b.theme?.(this.characterId);}if(me?.profileSummary)this.profile=me.profileSummary;if(Number.isSafeInteger(me?.lastInputSeq))this.seq=Math.max(this.seq,me.lastInputSeq);
  if(changed){this.acceptedRevision=null;this.ruleDraft=null;this.message='As regras mudaram. Leia a revisão '+data.revision+' e confirme novamente.';}
  if(me?.acceptedRevision===data.revision&&me.ready)this.acceptedRevision=data.revision;
  this.phase=data.phase||'lobby';
  if(!resultPhases.has(this.phase)||this.resultPresentation&&this.resultPresentation.key!==this.resultIdentity(data))this.cancelResultPresentation();
  if(resultPhases.has(this.phase)&&this.b.beforeResult&&this.latestSnapshot?.state&&!this.resultKeys.has(this.resultIdentity(data)))this.resultAwaitingKey=this.resultIdentity(data);
  if(['countdown','round-result','result'].includes(this.phase)){this.message='';this.error='';}if(this.phase!=='playing')this.pendingInput=blankInput();this.notifyState();
  if(this.phase==='playing'){this.root.classList.add('hidden');return;}
  const viewKey=JSON.stringify([this.phase,data.revision,data.players.map(({lastInputSeq,...p})=>p),data.scores,data.round,data.code,data.hostSlot]);if(viewKey!==this.lobbyViewKey){this.lobbyViewKey=viewKey;this.reveal();this.render();}
 }
 receiveSnapshot(data){
  if(!data?.state||!Number.isFinite(data.tick)||data.tick<=this.lastTick)return;
  this.lastTick=data.tick;this.latestSnapshot=data;if(this.serverOffset===undefined&&Number.isFinite(data.serverTime))this.serverOffset=data.serverTime-this.now();const round=data.round??this.lobby?.round??1,key=(data.matchId||this.room?.roomId||'')+':'+(data.roundId||round);
  if(data.phase){this.phase=data.phase;if(this.lobby)this.lobby.phase=data.phase;}
  if(this.lastRound&&key!==this.lastRound||!resultPhases.has(this.phase))this.cancelResultPresentation();
  if(resultPhases.has(this.phase)&&this.b.beforeResult&&!this.resultKeys.has(key))this.resultAwaitingKey=key;
  const meta=this.meta({round,serverTime:data.serverTime,tick:data.tick});
  if(key!==this.lastRound){this.lastRound=key;this.b.startMatch?.(data.state,meta);}else this.b.snapshot?.(data.state,meta);
  if(this.phase==='playing')this.root.classList.add('hidden');this.notifyState();
 }
 receiveResult(data){
  if(!data||!Array.isArray(data.scores))return;
  const latest=this.latestSnapshot;
  if(latest?.matchId&&data.matchId&&latest.matchId!==data.matchId)return;
  const currentRound=Math.max(Number.isInteger(latest?.round)?latest.round:0,Number.isInteger(this.lobby?.round)?this.lobby.round:0);
  if(Number.isInteger(data.round)&&data.round<currentRound)return;
  const phase=data.final?'result':'round-result',key=this.resultIdentity(data),fingerprint=JSON.stringify(data);
  if(this.result&&this.resultKey===key&&this.resultFingerprint===fingerprint&&this.phase===phase)return;
  const firstPresentation=!this.resultKeys.has(key);this.result=data;this.resultKey=key;this.resultFingerprint=fingerprint;this.phase=phase;this.message='';this.error='';this.pendingInput=blankInput();this.notifyState();
  if(this.resultPresentation?.key===key)return;
  this.cancelResultPresentation();
  const present=()=>{
   this.resultKeys.add(key);if(this.resultKeys.size>100)this.resultKeys.delete(this.resultKeys.values().next().value);
   this.reveal();this.render();
   if(firstPresentation)this.b.result?.(this.result,this.meta({matchId:this.result.matchId,roundId:this.result.roundId,round:this.result.round,scores:this.result.scores}));
  };
  if(!firstPresentation||!this.b.beforeResult){present();return;}
  const ticket={key,room:this.room,timer:null};this.resultPresentation=ticket;
  const finish=()=>{if(this.resultPresentation!==ticket||this.room!==ticket.room||this.resultKey!==key||!resultPhases.has(this.phase))return;clearTimeout(ticket.timer);this.resultPresentation=null;this.resultAwaitingKey=null;present();};
  // Server state and acknowledgements never wait for this local presentation.
  ticket.timer=setTimeout(finish,8000);
  try{Promise.resolve(this.b.beforeResult(data,this.meta({matchId:data.matchId,roundId:data.roundId,round:data.round,scores:data.scores}))).then(finish,finish);}catch{finish();}
 }

 send(type,payload){if(!this.connected)return false;this.room.send(type,payload);return true;}
 input(value={}){
  if(this.phase!=='playing'||!this.connected)return false;
  const dx=Math.sign(Number(value.dx)||0),dy=Math.sign(Number(value.dy)||0);this.pendingInput.dx=dx;this.pendingInput.dy=dx?0:dy;
  for(const k of ['bomb','special','signature'])this.pendingInput[k]||=value[k]===true;return true;
 }
 update(dt){
  if(!this.active||!Number.isFinite(dt)||dt<0)return;this.inputAge+=Math.min(dt,.25);this.pingAge+=Math.min(dt,.25);
  if(this.phase==='playing'&&this.connected&&this.inputAge>=1/30){this.inputAge=0;this.send('input',{seq:++this.seq,...this.pendingInput});for(const k of ['bomb','special','signature'])this.pendingInput[k]=false;}
  if(this.connected&&this.pingAge>=5){this.pingAge=0;this.send('ping',{at:this.now()});}
  const count=this.root.querySelector('[data-online-countdown]');if(count&&this.lobby?.startAt){const seconds=Math.max(0,Math.ceil((this.lobby.startAt-this.now()-(this.serverOffset||0))/1000));if(count.textContent!==String(seconds))count.textContent=String(seconds);}
 }
 async reconnect(){
  const token=this.readStored('room',true);if(!token)return;if(this.b.account&&this.readStored('room-owner',true)!==this.identity?.account?.id){this.store('room','',true);this.error='Esta sala pertence a outro perfil. Entre no perfil original ou abra outra disputa.';this.phase='mode';this.render();return;}const operation=++this.op;this.phase='reconnecting';this.render();
  try{const room=await(await this.getClient()).reconnect(token);if(operation!==this.op){await room.leave(true);return;}this.attach(room);}
  catch(error){if(operation===this.op){this.store('room','',true);this.phase='disconnected';this.error='Não foi possível recuperar a vaga. Volte à seleção para abrir outra sala.';this.render();}}
 }
 async leave(toMenu=false){
  ++this.op;this.cancelResultPresentation();const room=this.room;this.room=null;this.store('room','',true);this.store('room-owner','',true);this.lobby=null;this.result=null;this.pendingInput=blankInput();this.lastRound=null;this.error='';this.message='';this.acceptedRevision=null;
  try{await room?.leave(true);}catch{}
  this.phase=toMenu?'closed':'mode';this.notifyState();if(toMenu){this.root.classList.add('hidden');this.b.home?.();}else{this.reveal();this.render();}
 }
 close(){return this.leave(true);}
 paintLatency(){const el=this.root.querySelector('[data-online-latency]');if(el)el.textContent=this.latency===null?'Conectado':this.latency+' ms';}
 frame(title,subtitle,body){
  const theme=C[this.characterId]?.pvpTeam||this.team;this.root.dataset.team=theme;
  return `<div class="online-wrap"><header class="online-header"><button class="paper-link" data-online="back">← ${this.room?'SAIR DA SALA':'MENU'}</button><div><span class="online-kicker">BATALHA DAS URNAS · ONLINE</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><span class="online-connection${this.connected?' connected':''}" data-online-latency>${this.connected?(this.latency===null?'Conectado':this.latency+' ms'):'PVP'}</span></header><div class="online-feedback" role="status" aria-live="polite">${esc(this.error||this.message)}</div>${this.lifecycleMarkup()}${body}</div>`;
 }
 modeMarkup(){return `<div class="online-modes"><button class="online-mode public" data-online="public"><span class="online-mode-number">01</span><div class="online-pair">${image('lula')}${image('flavio')}</div><h2>PARTIDA PÚBLICA</h2><p>Seu núcleo contra o núcleo rival.<br>As regras ficam à vista antes do primeiro movimento.</p><b>BUSCAR UMA DISPUTA →</b></button><button class="online-mode private" data-online="private"><span class="online-mode-number">02</span><div class="online-ticket-art" aria-hidden="true">CONVITE<br><strong>× 2</strong></div><h2>SALA PRIVADA</h2><p>Convide alguém pelo código.<br>Vale qualquer dupla da coleção online, inclusive espelhos.</p><b>ABRIR OU ENTRAR →</b></button></div>${this.collectionNote()}${this.readStored('room',true)?'<button class="paper-link" data-online="reconnect">Retomar a última sala</button>':''}`;}
 lifecycleMarkup(){const end=this.lifecycle?.endsAt;if(!end||!Number.isFinite(Date.parse(end)))return '';return '<p class="online-save-note">'+(this.lifecycle.ended?'O período de partidas online terminou em ':'Partidas online disponíveis até ')+esc(new Date(end).toLocaleString('pt-BR'))+'. Os modos offline continuam disponíveis.</p>';}
 collectionNote(){return '<p class="online-save-note">Sincronize sua campanha em Meu perfil para usar a coleção nas partidas equilibradas. A evolução RPG das salas privadas usa apenas o progresso conquistado no online.</p>';}
 rosterMarkup(inLobby=false){
  const roster=this.roster,me=this.lobby?.players?.find(p=>p.sessionId===this.room?.sessionId),editable=!inLobby||lobbyPhases.has(this.phase);
  return `<section class="online-panel online-selection"><div class="online-section-title"><span>SUA CARICATURA</span><small>${roster.length} disponíveis</small></div>${this.mode==='public'?`<div class="online-team-choice" aria-label="Núcleo narrativo">${['lula','flavio'].map(t=>`<button data-online-team="${t}" aria-pressed="${this.team===t}"${inLobby?' disabled':''}>${teamName(t)}</button>`).join('')}</div><p class="online-small">Equipe dentro do jogo. Não representa voto nem apoio político real.</p>`:''}<div class="online-roster">${roster.map(id=>`<button class="online-character" data-online-character="${id}" aria-pressed="${id===this.characterId}"${!editable?' disabled':''}>${image(id)}<strong>${esc(C[id].name)}</strong><small>${esc(teamName(C[id].pvpTeam))}</small></button>`).join('')||'<p>Ainda não há personagens deste núcleo liberados no perfil online.</p>'}</div>${me?.ready?'<p class="online-small">Trocar de personagem cancela a confirmação de pronto.</p>':''}${this.collectionNote()}</section>`;
 }
 rulesMarkup(editable=false){
  const r=(editable&&this.ruleDraft)||this.lobby?.rules||this.draft;
  if(!editable)return `<dl class="online-rule-list">${ruleRows(r).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const field=(key,label,rows)=>`<label>${esc(label)}<select name="${key}" data-online-rule="${key}">${options(rows,r[key])}</select></label>`;
  return `<form data-online-form="rules" class="online-rules-form">${field('sceneId','Arena',SCENES.map(s=>[s.id,s.name]))}${field('bestOf','Formato',[[1,'Melhor de 1'],[3,'Melhor de 3'],[5,'Melhor de 5']])}${field('duration','Tempo por rodada',[[90,'1 min 30 s'],[120,'2 minutos'],[180,'3 minutos']])}${field('itemFrequency','Frequência de itens',[['none','Sem itens'],['scarce','Poucos'],['normal','Normal']])}${field('lives','Vidas iniciais',[[1,'1'],[3,'3'],[5,'5']])}${field('variant','Tipo de algema',Object.entries(VARIANTS).map(([id,v])=>[id,v.name]))}${field('modifier','Regra extra',[['none','Nenhuma'],['fast','Passos rápidos'],['stock','Estoque reforçado'],['giant','Correntes longas'],['tiny','Caricaturas em miniatura'],['dark','Pouca luz']])}${[['signatures','Habilidades exclusivas'],...(this.mode==='private'?[['normalized','Atributos normalizados']]:[]),['events','Eventos da arena']].map(([key,label])=>`<label class="online-check"><input type="checkbox" name="${key}" data-online-rule="${key}"${r[key]?' checked':''}>${label}</label>`).join('')}<p class="online-small online-wide">${r.normalized?'Todos entram com a mesma base de atributos.':'Usa apenas a evolução conquistada online, apresentada no lobby e aceita pelos dois jogadores.'}</p>${this.room?'<button class="paint-button online-wide" type="submit">APLICAR NOVA REVISÃO</button>':''}</form>`;
 }
 setupMarkup(){return `<div class="online-setup-grid">${this.rosterMarkup()}<section class="online-panel"><div class="online-section-title"><span>COMBINADO ANTES DA BRIGA</span></div>${this.mode==='public'?`<label class="online-preset">Fila<select data-online-preset>${options([['standard','Equilibrada · padrão'],['rapid','Rápida · sem exclusivas'],['custom','Minhas regras']],this.preset)}</select></label>`:''}${this.rulesMarkup(true)}<div class="online-actions"><button class="paint-button primary" data-online="${this.mode==='public'?'find':'create'}"${!this.characterId?' disabled':''}>${this.mode==='public'?'BUSCAR RIVAL':'CRIAR SALA PRIVADA'}</button>${this.mode==='public'?'<button class="paper-link" data-online="create">Criar sala pública com estas regras</button>':''}</div><p class="online-small">${this.mode==='public'?'Buscamos uma sala com estas regras e um núcleo rival. Se não houver, sua sala fica aberta aguardando alguém.':'O convidado verá as condições e precisará aceitá-las antes da partida.'}</p>${this.mode==='private'?`<form data-online-form="join" class="online-join"><label>Já tem convite?<input name="code" maxlength="16" value="${esc(this.inviteCode)}" autocomplete="off" autocapitalize="characters" placeholder="CÓDIGO DA SALA" required></label><button class="paint-button" type="submit">ENTRAR</button></form>`:''}</section></div>`;}
 playerMarkup(p){
  if(!p)return '<article class="online-seat empty"><div class="online-empty-seat">?</div><h3>CADEIRA VAGA</h3><p>Aguardando outro jogador…</p></article>';
  const c=C[p.characterId],local=p.sessionId===this.room?.sessionId,attributes=p.profileSummary?.characters?.[p.characterId]?.attributes||{};
  return `<article class="online-seat${local?' local':''}">${image(p.characterId)}<span class="online-seat-tag">${local?'VOCÊ':'RIVAL'}${p.slot===this.lobby?.hostSlot?' · ANFITRIÃO':''}</span><h3>${esc(p.name||p.profileSummary?.name||c?.name||'Jogador')}</h3><small>${esc(c?.name||'')} · ${esc(teamName(c?.pvpTeam))}</small><b class="online-ready-state">${p.connected===false?'RECONECTANDO':p.ready&&p.acceptedRevision===this.lobby.revision?'✓ PRONTO':'LENDO AS REGRAS'}</b>${!this.lobby?.rules.normalized?`<dl class="online-attributes">${Object.entries(ATTRIBUTES).map(([key,a])=>`<div><dt>${esc(a.name)}</dt><dd>${Number(attributes[key])||0}</dd></div>`).join('')}</dl>`:''}</article>`;
 }
 lobbyMarkup(){
  const l=this.lobby;if(!l)return '<div class="online-loading"><span class="online-spinner"></span><h2>Entrando na sala…</h2><p>Organizando as cadeiras e as regras da disputa.</p></div>';
  const me=l.players.find(p=>p.sessionId===this.room?.sessionId),editable=this.isHost&&lobbyPhases.has(this.phase),ready=me?.ready&&me.acceptedRevision===l.revision;
  return `${this.mode==='private'&&l.code?`<div class="online-invite"><span>CONVITE DA SALA</span><input aria-label="Código do convite" value="${esc(l.code)}" readonly><button class="paper-link" data-online="copy">Copiar código</button><button class="paper-link" data-online="link">Copiar convite</button></div>`:''}<div class="online-lobby-grid"><section class="online-versus-panel"><div class="online-seats">${this.playerMarkup(l.players.find(p=>p.slot===0))}<span class="online-versus" aria-hidden="true">×</span>${this.playerMarkup(l.players.find(p=>p.slot===1))}</div>${this.rosterMarkup(true)}</section><section class="online-panel"><div class="online-section-title"><span>REGRAS DA DISPUTA</span><b>REVISÃO ${l.revision}</b></div>${this.rulesMarkup(editable)}${!editable?'<p class="online-small">O anfitrião define as condições. Qualquer alteração exige uma nova confirmação dos dois participantes.</p>':''}<label class="online-accept"><input type="checkbox" data-online-accept${this.acceptedRevision===l.revision?' checked':''}${ready||this.ruleDraft?' disabled':''}>Li e aceito todas as condições da revisão ${l.revision}.</label><button class="paint-button primary online-ready" data-online="ready"${this.ruleDraft||!ready&&this.acceptedRevision!==l.revision?' disabled':''}>${ready?'CANCELAR PRONTO':'ESTOU PRONTO'}</button><p class="online-small">${l.players.length<2?'A partida começa quando o rival entrar e os dois confirmarem.':'A contagem começa quando os dois estiverem prontos.'}</p></section></div>`;
 }
 resultMarkup(){
  const r=this.result||{},winnerSlot=r.final?r.seriesWinner:r.winner,winner=Number.isInteger(winnerSlot)?this.lobby?.players?.find(p=>p.slot===winnerSlot):null,title=winnerSlot===null?'EMPATE TÉCNICO':winnerSlot===this.localSlot?'VOCÊ VENCEU!':'O RIVAL LEVOU ESSA';
  const players=this.lobby?.players||[],me=players.find(p=>p.sessionId===this.room?.sessionId),rematch=me?.rematchReady;
  const actions=`<div class="online-actions"><button class="paint-button primary" data-online="rematch"${rematch||players.length<2?' disabled':''}>${rematch?'AGUARDANDO O RIVAL':'PEDIR REVANCHE'}</button><button class="paint-button" data-online="lobby">VOLTAR AO LOBBY</button><button class="paper-link" data-online="leave">SAIR DA SALA</button></div><p class="online-small">${players.length<2?'O rival deixou a sala. Volte ao lobby para receber outro jogador.':'A revanche começa somente com a confirmação dos dois jogadores.'}</p>`;
  return `<div class="online-result">${winner?image(winner.characterId):'<span class="online-result-draw">×</span>'}<div><span class="online-kicker">${r.final?'DISPUTA ENCERRADA':'RODADA '+(r.round||1)}</span><h2>${title}</h2><div class="online-score">${(r.scores||[0,0]).map((score,i)=>`<span>${esc(C[this.lobby?.players?.find(p=>p.slot===i)?.characterId]?.name||'Jogador '+(i+1))}<strong>${Number(score)||0}</strong></span>`).join('<b>×</b>')}</div>${['disconnect','forfeit','abandonment'].includes(r.reason)?'<p>Disputa encerrada por abandono ou desconexão.</p>':''}${r.final?actions:'<p class="online-waiting">Prepare-se para a próxima rodada.</p>'}</div></div>`;
 }
 render(){
  if(this.phase==='closed'||this.phase==='playing'||this.resultDeferred)return;
  let title='O debate atravessou a tela.',subtitle='Dois jogadores. Uma arena. A mesma regra para os dois.',body='';
  if(this.phase==='mode')body=this.modeMarkup();
  else if(this.phase==='setup'){title=this.mode==='public'?'Encontre o núcleo rival.':'O convite é seu.';subtitle='Escolha a caricatura e combine as regras antes da disputa.';body=this.setupMarkup();}
  else if(lobbyPhases.has(this.phase)){title=this.mode==='public'?'Plenário aberto.':'Entre, a sala é nossa.';subtitle=this.mode==='public'?'Um rival do núcleo oposto pode entrar nesta sala.':'Compartilhe o código com quem vai disputar com você.';body=this.lobbyMarkup();}
  else if(this.phase==='result'||this.phase==='round-result'){title='A urna da arena decidiu.';subtitle='Placar fechado. Valeu a disputa.';body=this.resultMarkup();}
  else if(this.phase==='countdown'){title='Cara a cara.';subtitle='Prepare os dedos. A disputa vai começar.';body=`<div class="online-faceoff"><div class="online-seats">${this.playerMarkup(this.lobby?.players?.find(p=>p.slot===0))}<strong class="online-countdown" data-online-countdown>3</strong>${this.playerMarkup(this.lobby?.players?.find(p=>p.slot===1))}</div></div>`;}
  else if(this.phase==='paused'){title='Um instante na conexão.';subtitle='Aguardando a recuperação do outro jogador.';body='<div class="online-loading"><span class="online-spinner"></span><p>A disputa continua assim que a conexão voltar.</p><button class="paper-link" data-online="leave">Abandonar a sala</button></div>';}
  else if(this.phase==='reconnecting'){title='Segurando sua cadeira.';subtitle='A conexão caiu. Tentando voltar à mesma sala.';body='<div class="online-loading"><span class="online-spinner"></span><p>Seus comandos ficam suspensos durante a reconexão.</p><button class="paper-link" data-online="leave">Sair da sala</button></div>';}
  else if(this.phase==='disconnected'){title='A ligação foi interrompida.';subtitle='A sala não está mais conectada.';body=`<div class="online-loading">${this.readStored('room',true)?'<button class="paint-button primary" data-online="reconnect">TENTAR RECONECTAR</button>':''}<button class="paint-button" data-online="leave">VOLTAR À SELEÇÃO</button></div>`;}
  else if(this.phase==='unavailable'){title=this.lifecycle?.ended?'A arena online encerrou o expediente.':'PvP Online temporariamente indisponível.';subtitle=this.lifecycle?.ended?'Sua campanha continua por aqui.':'O servidor público ainda não está disponível. As campanhas e os modos locais continuam funcionando normalmente.';body='<div class="online-loading"><p>Os modos deste aparelho continuam disponíveis.</p><button class="paint-button" data-online="retry">VERIFICAR CONEXÃO</button><button class="paper-link" data-online="back">VOLTAR AO MENU</button></div>';}
  else body='<div class="online-loading"><span class="online-spinner"></span><h2>Conectando…</h2><p>Reservando sua cadeira na arena…</p><button class="paper-link" data-online="cancel">Cancelar</button></div>';
  const focused=this.doc.activeElement,focusKey=focused?.getAttribute?.('data-online-rule');this.root.innerHTML=this.frame(title,subtitle,body);if(focusKey)this.root.querySelector(`[data-online-rule="${focusKey}"]`)?.focus();
 }
 readRules(){const form=this.root.querySelector('[data-online-form="rules"]');if(!form)return {...this.draft,...(this.mode==='public'?{normalized:true}:{})};const rules={...this.draft};for(const field of form.querySelectorAll('[data-online-rule]')){const key=field.dataset.onlineRule;rules[key]=field.type==='checkbox'?field.checked:['bestOf','duration','lives'].includes(key)?Number(field.value):field.value;}if(this.mode==='public')rules.normalized=true;return rules;}
 async click(event){
  const button=event.target.closest?.('[data-online], [data-online-character], [data-online-team]');if(!button||button.disabled)return;
  if(button.dataset.onlineCharacter){const id=button.dataset.onlineCharacter;if(!this.roster.includes(id))return;if(this.room){this.send('select',{characterId:id});}else{this.characterId=id;this.b.theme?.(id);this.render();}return;}
  if(button.dataset.onlineTeam){if(this.room)return;this.team=button.dataset.onlineTeam;this.ensureCharacter();this.render();return;}
  const action=button.dataset.online;
  if(action==='public'||action==='private'){this.mode=action;if(action==='public'){this.draft.normalized=true;if(this.preset==='rpg')this.preset='custom';}this.phase='setup';this.error='';this.message='';this.ensureCharacter();this.render();}
  if(action==='find'||action==='create'){this.draft=this.readRules();await this.join(action);}
  if(action==='back'){if(this.room){this.message='Sair encerra sua participação nesta sala.';this.root.querySelector('.online-feedback').innerHTML='<span>Sair encerra sua participação nesta sala.</span> <button class="paper-link" data-online="leave">CONFIRMAR SAÍDA</button>';return;}await this.close();}
  if(action==='cancel'){++this.op;this.phase='mode';this.message='';this.render();}
  if(action==='leave')await this.leave();
  if(action==='retry'){this.ready=this.probe();await this.open();}
  if(action==='reconnect')await this.reconnect();
  if(action==='ready'&&!this.ruleDraft){const me=this.lobby?.players?.find(p=>p.sessionId===this.room?.sessionId),ready=me?.ready&&me.acceptedRevision===this.lobby?.revision;if(ready||this.acceptedRevision===this.lobby?.revision)this.send('ready',{revision:this.lobby.revision,ready:!ready});}
  if(action==='rematch'){if(this.send('rematch',{})){button.disabled=true;button.textContent='AGUARDANDO O RIVAL';}}
  if(action==='lobby')this.send('lobby',{});
  if(action==='copy'||action==='link'){
   let value=this.lobby?.code;if(!value)return;
   if(action==='link'){try{const url=new URL(globalThis.location.href);if(['http:','https:'].includes(url.protocol)){url.search='';url.hash='';url.searchParams.set('sala',value);value=url.href;}}catch{}}
   try{await globalThis.navigator.clipboard.writeText(value);this.message=action==='link'?'Convite copiado.':'Código copiado.';}catch{this.message='Selecione o código acima e copie para enviar o convite.';const input=this.root.querySelector('.online-invite input');input?.focus();input?.select();}this.render();
  }
 }
 change(event){const el=event.target;
  if(el.matches?.('[data-online-preset]')){if(this.mode==='public'&&el.value==='rpg')return;this.preset=el.value;if(PUBLIC_PRESETS[el.value])this.draft={...PUBLIC_PRESETS[el.value]};if(this.mode==='public')this.draft.normalized=true;this.ensureCharacter();this.render();}
  if(el.matches?.('[data-online-rule]')&&!this.room){this.draft=this.readRules();this.preset='custom';if(el.dataset.onlineRule==='normalized'){this.ensureCharacter();this.render();}}
  if(el.matches?.('[data-online-rule]')&&this.room&&this.isHost){this.ruleDraft=this.readRules();this.acceptedRevision=null;const me=this.lobby?.players?.find(p=>p.sessionId===this.room?.sessionId);if(me?.ready)this.send('ready',{revision:this.lobby.revision,ready:false});this.message='Aplique a nova revisão antes de confirmar as condições.';const b=this.root.querySelector('[data-online="ready"]');if(b)b.disabled=true;const check=this.root.querySelector('[data-online-accept]');if(check){check.checked=false;check.disabled=true;}const feedback=this.root.querySelector('.online-feedback');if(feedback)feedback.textContent=this.message;}
  if(el.matches?.('[data-online-accept]')){if(this.ruleDraft){el.checked=false;return;}this.acceptedRevision=el.checked?this.lobby?.revision:null;const b=this.root.querySelector('[data-online="ready"]');if(b)b.disabled=!el.checked;}
 }
 async submit(event){const form=event.target.closest?.('[data-online-form]');if(!form)return;event.preventDefault();
  if(form.dataset.onlineForm==='join'){const code=form.querySelector('[name="code"]').value.trim();if(/^[A-Za-z0-9-]{4,16}$/.test(code))await this.join('join',code);else{this.error='Confira o código do convite.';this.render();}}
  if(form.dataset.onlineForm==='rules'&&this.isHost&&lobbyPhases.has(this.phase))this.send('rules',{revision:this.lobby.revision,rules:this.readRules()});
 }
}
