// Combat slots remain 0/1. Character identities and narrative roles are independent.
const rows=[
 ['lula','Lula','presidential','Caravana do abraço','rally','Um discurso que ganha pernas.',0],
 ['flavio','Flávio Bolsonaro','presidential','Reta final','sprint','A disputa não sai do radar.',1],
 ['damares','Damares Alves','political','Microfone aberto','push','O microfone pediu intervalo.'],
 ['magno','Magno Malta','political','Obstrução relâmpago','barrier','Nenhum corredor sem debate.'],
 ['marcos','Marcos Rogério','political','Pauta urgente','long','A pauta atravessou o corredor.'],
 ['sostenes','Sóstenes Cavalcante','political','Bancada fechada','wall','Uma bancada, muitas cadeiras.'],
 ['tarcisio','Tarcísio de Freitas','political','Desvio de rota','portal','Obras na pista da confusão.'],
 ['nikolas','Nikolas Ferreira','political','Corte viral','meme','O debate virou um corte.'],
 ['nunes','Nunes Marques','judicial','Pedido de vista','delay','O cronômetro pediu mais prazo.'],
 ['toffoli','Dias Toffoli','judicial','Recurso de retorno','restore','A pilha de papéis voltou.'],
 ['fux','Luiz Fux','judicial','Sustentação oral','push','A argumentação tem alcance.'],
 ['moro','Sérgio Moro','institutional','Força-tarefa','wall','A papelada fechou o cerco.'],
 ['mendonca','André Mendonça','judicial','Despacho em cruz','collective','A sessão virou um labirinto.'],
 ['gleisi','Gleisi Hoffmann','political','Articulação','rally','Sempre cabe mais uma reunião.'],
 ['haddad','Fernando Haddad','political','Planilha de rotas','slow','Até o passo entrou na planilha.'],
 ['boulos','Guilherme Boulos','political','Mobilização','push','O megafone não tira férias.'],
 ['erika','Erika Hilton','political','Direito à palavra','shield','O microfone tem dona.'],
 ['marina','Marina Silva','political','Corredor verde','sprint','Uma rota que respira.'],
 ['janones','André Janones','political','Live interminável','meme','A notificação tomou o plenário.'],
 ['gilmar','Gilmar Mendes','judicial','Habeas corpus','shield','Tem recurso na próxima esquina.'],
 ['fachin','Edson Fachin','judicial','Relatoria móvel','barrier','A pauta resolveu passear.'],
 ['messias','Jorge Messias','institutional','Recurso em dobro','double','Mais um recurso entrou na rodada.'],
 ['dino','Flávio Dino','judicial','Mandado coletivo','collective','O mapa entrou na sessão.'],
 ['moraes','Alexandre de Moraes · Xandão','judicial','Decisão monocrática','wall','O corredor entrou em deliberação.'],
 ['bukele','Nayib Bukele','international','Modo segurança','barrier','Barreiras de um mundo de brinquedo.'],
 ['xi','Xi Jinping','international','Grande muralha','wall','Um tijolo de cada vez.'],
 ['trump','Donald Trump','international','Big cuff','giant','A algema pediu um palco maior.'],
 ['putin','Vladimir Putin','international','Inverno estratégico','ice','A sessão esfriou.']
];
const roles={moro:{role:'Ex-juiz federal · senador',bio:'Foi juiz federal em Curitiba e atuou no caso de Lula. Atualmente exerce mandato no Senado.'},messias:{role:'Advogado-geral da União',bio:'Chefia a AGU, responsável pela representação judicial da União e pela consultoria jurídica do Poder Executivo.'}};
// Matchmaking factions follow the campaign fiction, never a real person's vote or affiliation.
const pvpTeams={lula:'lula',flavio:'flavio',damares:'flavio',magno:'flavio',marcos:'flavio',sostenes:'flavio',tarcisio:'flavio',nikolas:'flavio',nunes:'flavio',toffoli:'flavio',fux:'flavio',moro:'flavio',mendonca:'flavio',gleisi:'lula',haddad:'lula',boulos:'lula',erika:'lula',marina:'lula',janones:'lula',gilmar:'lula',fachin:'lula',messias:'lula',dino:'lula',moraes:'lula'};
export const CHARACTERS=Object.fromEntries(rows.map(([id,name,category,special,ability,joke,original])=>[id,{id,name,category,special,ability,joke,original,pvpTeam:pvpTeams[id]||null,...roles[id],portrait:original===undefined?'assets/characters/'+id+'-front.webp':'assets/reactions/'+id+'-laugh-v6.png'}]));
export const SCENES=[
 {id:'camara',name:'Câmara dos Deputados',base:0,mechanic:'microphone',color:'#447c94'},
 {id:'senado',name:'Senado Federal',base:0,mechanic:'chairs',color:'#327a62'},
 {id:'congresso',name:'Congresso Nacional',base:0,mechanic:'recess',color:'#365da0'},
 {id:'pf',name:'Polícia Federal',base:3,mechanic:'doors',color:'#3a4656'},
 {id:'pgr',name:'Procuradoria-Geral da República',base:1,mechanic:'papers',color:'#b79768'},
 {id:'stj',name:'Superior Tribunal de Justiça',base:1,mechanic:'files',color:'#675e83'},
 {id:'stf',name:'Supremo Tribunal Federal',base:1,mechanic:'ruling',color:'#69827b'},
 {id:'tse',name:'Tribunal Superior Eleitoral',base:1,mechanic:'portals',color:'#568ca4'},
 {id:'esplanada',name:'Esplanada dos Ministérios',base:3,mechanic:'motorcade',color:'#659251'},
 {id:'praca',name:'Praça dos Três Poderes',base:3,mechanic:'wind',color:'#b49f72'},
 {id:'debate',name:'Estúdio de Debate',base:0,mechanic:'microphone',color:'#77538c'},
 {id:'planalto',name:'Palácio do Planalto',base:2,mechanic:'final',color:'#65a3b0'},
 {id:'justica-federal',name:'Justiça Federal · Curitiba',base:1,mechanic:'files',color:'#7b877e'},
 {id:'agu',name:'Advocacia-Geral da União',base:1,mechanic:'papers',color:'#477e8c'}
];
const routes={lula:['damares','magno','marcos','sostenes','tarcisio','nikolas','nunes','toffoli','fux','moro','mendonca','flavio'],flavio:['gleisi','haddad','boulos','erika','marina','janones','gilmar','fachin','messias','dino','moraes','lula']};
const sceneOrder=['camara','senado','congresso','pf','esplanada','debate','pgr','stj','tse','praca','stf','planalto'];
export const ACTS=['Disputa política e parlamentar','Disputa jurídica e institucional','Confronto presidencial'];
export const CAMPAIGNS=Object.fromEntries(Object.entries(routes).map(([hero,ids])=>[hero,ids.map((opponent,i)=>({id:hero+'-'+(i+1),number:i+1,act:i<6?0:i<11?1:2,scene:opponent==='moro'?'justica-federal':opponent==='messias'?'agu':CHARACTERS[opponent].category==='judicial'?'stf':sceneOrder[i],opponent,kind:i===11?'final':[5,10].includes(i)?'miniboss':'regular',xp:i===11?400:[5,10].includes(i)?220:80+i*12,next:i<11?hero+'-'+(i+2):null,opening:opponent==='moro'?'Audiência aberta. O cerco vai apertar.':opponent==='messias'?'Recurso protocolado. A disputa continua.':i===11?'Última sessão. O topo está logo ali!':i===5?'O plenário virou uma disputa de microfones!':i===10?'A última pilha de processos antes da rampa.':'Mais um capítulo da confusão de Brasília.',rules:{duration:180,lives:3,eventInterval:i<5?42:i<10?36:30,environmentInterval:i<6?20:16,ai:{kick:i>=3,remote:i>=9,strategic:i>=6},signatureFrom:3,win:'last-standing'},closing:i===11?'Doze sessões vencidas. A faixa simbólica é sua!':i===5?'Primeiro ato concluído!':i===10?'O Planalto está a um passo!':'Sessão encerrada. Próximo marco liberado.'}))]));
export const VARIANTS={normal:{name:'Algema clássica',desc:'Correntes em cruz.'},debate:{name:'Algema do debate',desc:'Empurra, sem capturar.'},dispatch:{name:'Algema do despacho',desc:'Área que reduz passos por 3 s.'},meme:{name:'Algema do meme',desc:'Desorientação breve e visível.'},crisis:{name:'Algema da crise',desc:'Aciona algemas próximas em cadeia.'},double:{name:'Algema dupla',desc:'Segunda algema, se houver capacidade e casa livre.'},long:{name:'Corrente longa',desc:'Mais duas casas de alcance, respeitando o limite.'},collective:{name:'Mandado coletivo',desc:'Mais alcance; temporizador maior para permitir fuga.'}};
export const ATTRIBUTES={speed:{name:'Velocidade',max:5},capacity:{name:'Algemas simultâneas',max:3},range:{name:'Alcance das correntes',max:5},resistance:{name:'Resistência',max:7},cooldown:{name:'Recarga',max:5},exclusive:{name:'Habilidade exclusiva',max:3}};
export const attributeBonus=id=>['trump','putin'].includes(id)?2:['xi','bukele'].includes(id)?1:0;
export const attributeCap=(id,key)=>key==='resistance'?ATTRIBUTES.resistance.max+(CHARACTERS[id]?.category==='international'?2:0):ATTRIBUTES[key].max+attributeBonus(id);
export const combatCaps=id=>{const bonus=attributeBonus(id);return {range:7+bonus,capacity:5+bonus,speed:4+bonus*.8,life:5+attributeCap(id,'resistance'),minDelay:7-2*bonus,minStep:.13-bonus*.02};};
export const ACHIEVEMENTS=[['captures','Doutor em algemas','Realize 30 capturas.',30],['streak','Maioria absoluta','Vença 5 partidas seguidas.',5],['perfect','Vitória por unanimidade','Vença sem perder resistência.',1],['specials','Palavra final','Use 20 habilidades exclusivas.',20],['lastLife','O último da legislatura','Vença no difícil/extremo com uma resistência.',1],['campaigns','Dono do Planalto','Conclua uma campanha.',1],['escapes','Habeas corpus concedido','Evite uma captura usando proteção.',1],['multi','Mandado coletivo','Cause duas capturas na mesma ativação.',1]].map(([id,name,desc,target])=>({id,name,desc,target}));
export function validateCampaigns(){const all=[];for(const hero of ['lula','flavio']){const r=CAMPAIGNS[hero];if(r.length!==12)throw Error('Campanha incompleta');if(r[5].opponent!==(hero==='lula'?'nikolas':'janones')||r[10].opponent!==(hero==='lula'?'mendonca':'moraes')||r[11].opponent!==(hero==='lula'?'flavio':'lula'))throw Error('Chefes fora do roteiro');r.forEach((s,i)=>{if(!CHARACTERS[s.opponent]||!SCENES.some(x=>x.id===s.scene))throw Error('Configuração ausente');if(i<5&&CHARACTERS[s.opponent].category!=='political'||i>=6&&i<10&&!['judicial','institutional'].includes(CHARACTERS[s.opponent].category))throw Error('Categoria institucional incorreta');if(CHARACTERS[s.opponent].category==='institutional'&&!CHARACTERS[s.opponent].role)throw Error('Função institucional ausente');if(s.kind!==([5,10].includes(i)?'miniboss':i===11?'final':'regular'))throw Error('Tipo de fase incorreto');all.push(s.opponent);});}if(new Set(all).size!==24)throw Error('Elencos repetidos');return true;}
validateCampaigns();

export const COSMETICS=[{id:"president",category:"title",name:"Presidente da confusão",after:1},{id:"gala",category:"outfit",name:"Gala · faixa dourada",after:2},{id:"encore",category:"animation",name:"Bis do plenário",after:3},{id:"brass-chain",category:"chains",name:"Correntes de latão",after:3},{id:"gold-frame",category:"frame",name:"Moldura da República",after:4},{id:"republic-ui",category:"interface",name:"Plenário dourado",after:5},{id:"aurora",category:"outfit",name:"Aura institucional",after:6},{id:"grand-finale",category:"celebration",name:"Festa da posse",after:8},{id:"legend",category:"title",name:"Lenda do Planalto",after:10}];
