// Stage celebrations describe the fictional match, never a real election result.
export const POLITICAL_LINES=['Medida Provisória Aprovada!','Projeto de Lei Aprovado!','Sessão Encerrada com Vitória!','A base garantiu a maioria!','Vitória no plenário!','Texto aprovado em votação simbólica!','A pauta avançou!'];
export const LEGAL_LINES=['Liminar Concedida!','Decisão favorável!','Tutela deferida!','Pedido acolhido!','Recurso provido!','Vitória no tribunal!','Despacho favorável!','Ordem concedida!'];
export function victoryProfile(stage,rng=Math.random,previous=null){
 const number=stage.number,common={number,accent:'#e9c780',archival:false};
 if(number===12)return {...common,kind:'final',title:'De voto em voto, chegamos ao topo!',subtitle:'Doze desafios. Uma faixa. Brasília inteira para comemorar.',seal:'CAMPANHA CONCLUÍDA',duration:8.5};
 if(number===11)return {...common,kind:'first-round',title:'Vencemos o Primeiro Turno!',subtitle:'A última disputa está marcada. Próxima parada: Planalto.',seal:'ATO II CONCLUÍDO',duration:7};
 if(number===6)return {...common,kind:'poll',title:'As pesquisas foram publicadas. Estamos na frente!',subtitle:'Mais um marco conquistado. A corrida continua!',seal:'ATO I CONCLUÍDO',duration:6.5};
 const kind=number<=5?'political':'legal',pool=(kind==='political'?POLITICAL_LINES:LEGAL_LINES).filter(line=>line!==previous),index=Math.min(pool.length-1,Math.max(0,Math.floor(rng()*pool.length)));
 return {...common,kind,title:pool[index],subtitle:kind==='political'?'A sessão terminou. A corrida eleitoral continua.':'Recurso aprovado. Mais um passo na corrida ao Planalto.',seal:'FASE '+String(number).padStart(2,'0')+' VENCIDA',duration:4.8,archival:true};
}
