export const POWER_INFO={
range:{name:'Voz de palanque',desc:'O megafone leva a expansão uma casa mais longe.',joke:'Quanto maior o discurso, maior o alcance.'},
capacity:{name:'Coligação',desc:'As urnas extras permitem mais uma algema simultânea.',joke:'Sempre cabe mais um na bancada.'},
speed:{name:'Corrida eleitoral',desc:'Cédula alada + cronômetro: aumenta a velocidade de movimento.',joke:'A corrida pelos votos virou corrida de verdade.'},
kick:{name:'Pé na campanha',desc:'A bota de caminhada empurra algemas pelo corredor.',joke:'Campanha de rua, com um empurrãozinho.'},
glove:{name:'Lança-santinho',desc:'A mão distribui a algema para mais longe. Use E / Shift direito.',joke:'A panfletagem ficou um pouco mais intensa.'},
remote:{name:'Horário eleitoral',desc:'O controle de TV detona suas algemas com E / Shift direito. Limite de 5 s.',joke:'Agora é você quem decide a hora do intervalo.'},
pierce:{name:'Pauta urgente',desc:'O carimbo URGENTE aumenta o alcance em uma casa; a corrente para no primeiro tijolo.',joke:'Mais alcance para a pauta.'},
shield:{name:'Escudo eleitoral',desc:'O escudo com urna absorve uma expansão.',joke:'Um pedido de proteção por rodada de correntes.'},
ghost:{name:'Passe de bastidor',desc:'A credencial permite atravessar blocos por 8 segundos.',joke:'Acesso liberado aos corredores do poder.'},
pass:{name:'Salvo-conduto',desc:'O crachá concede um escudo que absorve uma captura.',joke:'Uma proteção para a próxima confusão.'}
};
Object.assign(POWER_INFO,{habeas:{name:'Habeas corpus',desc:'Absorve uma captura.',joke:'Uma saída regimental.'},vista:{name:'Pedido de vista',desc:'Adia as algemas ativas em 1,3 s.',joke:'O prazo ganhou um prazo.'},immunity:{name:'Imunidade parlamentar',desc:'Proteção por 3 segundos.',joke:'O escudo também tem validade.'},heal:{name:'Comissão de emergência',desc:'Recupera uma resistência.',joke:'Café e um minuto de intervalo.'},charge:{name:'Horário eleitoral extra',desc:'Recarrega o poder exclusivo.',joke:'Entrou no ar de novo.'},chain:{name:'Prisão em cadeia',desc:'Alcance extra durante 8 segundos.',joke:'Uma coisa puxa a outra.'},order:{name:'Questão de ordem',desc:'Empurra objetos próximos.',joke:'Abram espaço para a pauta.'}});
export const QUOTES=[[
{text:'Nunca antes na história deste país',source:'Terra — Frases de Lula',url:'https://www.terra.com.br/noticias/infograficos/lula-frases/',context:'Bordão recorrente, reunido pelo Terra em seu especial de frases.'},
{text:'Eu sou uma ideia',source:'Exame, 7 de abril de 2018',url:'https://exame.com/brasil/eu-nao-sou-mais-um-ser-humano-eu-sou-uma-ideia-diz-lula/',context:'Trecho do discurso no Sindicato dos Metalúrgicos do ABC.'},
{text:'Meus amigos e minhas amigas',source:'Ministério das Relações Exteriores, 24 de novembro de 2025',url:'https://www.gov.br/mre/pt-br/centrais-de-conteudo/publicacoes/discursos-artigos-e-entrevistas/presidente-da-republica/presidente-da-republica-federativa-do-brasil-discursos/luiz-inacio-lula-da-silva-2023-2026/discurso-do-presidente-lula-durante-outorga-do-titulo-de-doutor-honoris-causa-pela-universidade-pedagogica-de-maputo',context:'Saudação usada no discurso de outorga do título em Maputo.'}
],[
{text:'Não tem volta',source:'CNN Brasil, 9 de dezembro de 2025',url:'https://www.cnnbrasil.com.br/politica/candidatura-e-irreversivel-nao-vamos-voltar-atras-diz-flavio-sobre-2026/',context:'Trecho de declaração sobre sua candidatura. Não se refere a correntes.'},
{text:'Não vamos voltar atrás',source:'CNN Brasil, 9 de dezembro de 2025',url:'https://www.cnnbrasil.com.br/politica/candidatura-e-irreversivel-nao-vamos-voltar-atras-diz-flavio-sobre-2026/',context:'Trecho da mesma declaração sobre a candidatura.'},
{text:'Essa candidatura é para valer',source:'CNN Brasil, 9 de dezembro de 2025',url:'https://www.cnnbrasil.com.br/politica/candidatura-e-irreversivel-nao-vamos-voltar-atras-diz-flavio-sobre-2026/',context:'Trecho da reafirmação da candidatura. São falas documentadas, não necessariamente bordões recorrentes.'}
]];
export function iconCanvas(type,size=160,bare=false){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.scale(size/160,size/160);x.lineJoin='round';x.lineCap='round';
const line=(pts,color='#544833',w=4)=>{x.strokeStyle=color;x.lineWidth=w;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.stroke();};
const box=(a,b,w,h,fill,r=6)=>{x.fillStyle=fill;x.beginPath();x.roundRect(a,b,w,h,r);x.fill();x.strokeStyle='#594b37';x.lineWidth=3;x.stroke();};
const circle=(a,b,r,fill,stroke=true)=>{x.fillStyle=fill;x.beginPath();x.arc(a,b,r,0,7);x.fill();if(stroke){x.strokeStyle='#594b37';x.lineWidth=3;x.stroke();}};
const text=(s,a,b,n=15,color='#5a4830')=>{if(bare&&s.length>1)return;x.fillStyle=color;x.font='bold '+n+'px Georgia';x.textAlign='center';x.fillText(s,a,b);};
const ballot=(a,b,scale=1)=>{x.save();x.translate(a,b);x.scale(scale,scale);box(-28,-24,56,52,'#f7edc9');line([[-18,-14],[18,-14]],'#b29c69',2);box(-17,-5,13,13,'#e4dbc1',1);line([[-14,0],[-10,4],[-5,-3]],'#548164',3);line([[2,0],[18,0]],'#927d57',3);line([[-17,17],[18,17]],'#ad966c',2);x.restore();};
const urn=(a,b,s=1)=>{x.save();x.translate(a,b);x.scale(s,s);box(-25,-18,50,43,'#e3e3ce');box(-28,-24,56,13,'#dad8bf',3);line([[-12,-18],[12,-18]],'#43564e',4);box(-15,-3,28,16,'#667966',2);text('✓',-1,10,17,'#eee8cb');x.restore();};
// Soft grounding shadow; each collectible has its own election illustration.
x.save();x.filter='blur(5px)';x.fillStyle='#44352338';x.beginPath();x.ellipse(80,137,46,8,0,0,7);x.fill();x.restore();
if(type==='speed'){for(let side of [-1,1]){x.fillStyle='#e8e4c6';x.beginPath();x.moveTo(80+side*19,82);x.quadraticCurveTo(80+side*52,25,80+side*68,47);x.lineTo(80+side*52,64);x.lineTo(80+side*63,68);x.lineTo(80+side*42,82);x.lineTo(80+side*48,88);x.closePath();x.fill();x.strokeStyle='#948363';x.lineWidth=3;x.stroke();}ballot(75,76,.78);circle(104,111,25,'#daa954');circle(104,111,20,'#fcf0cb');box(97,79,14,7,'#566c59',2);line([[104,98],[104,111],[117,115]],'#b34e32',3);line([[16,112],[40,112]],'#826d45',3);line([[23,125],[47,125]],'#826d45',3);}
if(type==='range'){box(61,80,16,51,'#566f60');x.fillStyle='#d7b76e';x.beginPath();x.moveTo(48,67);x.lineTo(113,34);x.lineTo(113,112);x.lineTo(48,85);x.closePath();x.fill();x.strokeStyle='#695138';x.stroke();box(35,64,27,28,'#a3482e');x.fillStyle='#745343';x.beginPath();x.ellipse(113,73,10,38,0,0,7);x.fill();line([[130,54],[140,48]],'#b37536',4);line([[133,76],[148,76]],'#b37536',4);line([[130,99],[141,105]],'#b37536',4);}
if(type==='capacity'){urn(48,93,.85);urn(108,96,.85);urn(78,57,.85);text('+',79,143,27,'#426849');}
if(type==='kick'){box(57,30,38,63,'#81744a');box(49,76,46,35,'#756547');box(49,101,79,30,'#97764e');box(43,127,88,9,'#45392c',3);for(let y=47;y<93;y+=12)line([[65,y],[91,y-4]],'#e1cc95',3);line([[19,77],[42,86]],'#d5b165',5);line([[14,99],[36,103]],'#d5b165',5);}
if(type==='glove'){ballot(106,47,.66);x.save();x.translate(69,100);x.rotate(-.4);box(-35,-15,54,33,'#d4a17a',10);box(5,-43,13,56,'#e1b08a',6);box(-10,-44,14,54,'#e1b08a',6);box(-25,-37,14,45,'#e1b08a',6);box(-42,-10,22,35,'#d7a57a',8);box(-46,17,66,22,'#4b6d63',3);x.restore();line([[119,82],[137,69]],'#b9a05c',3);}
if(type==='remote'){x.save();x.translate(79,83);x.rotate(.23);box(-26,-58,52,116,'#3f5551',12);box(-18,-49,36,24,'#c6d4ad',4);text('TV',0,-32,17);circle(0,-6,11,'#c85d3e');for(let a=-1;a<=1;a++)for(let b=0;b<3;b++)circle(a*14,17+b*11,3,'#dac89d',false);x.restore();line([[122,35],[136,24]],'#a77738');line([[117,21],[120,8]],'#a77738');}
if(type==='pierce'){box(53,22,55,49,'#71623d',15);box(40,65,83,23,'#543c29');box(34,84,95,25,'#a0442d');x.save();x.translate(80,122);x.rotate(-.12);x.strokeStyle='#ac4934';x.lineWidth=3;x.strokeRect(-58,-12,116,25);text('URGENTE',0,7,18,'#a5422c');x.restore();}
if(type==='shield'){x.fillStyle='#759d8f';x.beginPath();x.moveTo(80,21);x.lineTo(130,43);x.lineTo(119,97);x.quadraticCurveTo(108,125,80,139);x.quadraticCurveTo(52,126,41,97);x.lineTo(30,43);x.closePath();x.fill();x.strokeStyle='#d3b876';x.lineWidth=7;x.stroke();urn(80,76,.95);}
if(type==='ghost'){line([[54,25],[80,9],[107,25],[94,58],[68,58],[54,25]],'#628879',8);box(41,48,79,91,'#f3dfae');box(47,53,67,18,'#786448');text('BASTIDOR',80,65,10,'#fff0ce');circle(67,91,12,'#c2976c');line([[94,83],[110,83]],'#9d8959',3);line([[94,94],[108,94]],'#9d8959',3);text('ACESSO',80,124,13);}
if(type==='pass'){ballot(80,82,1.3);line([[30,45],[119,45],[109,34]],'#547a69',7);line([[129,121],[40,121],[50,134]],'#bd7747',7);circle(80,83,15,'#dda963');text('✓',80,91,23);}
if(type==='habeas'){ballot(70,76,1.4);circle(103,107,29,'#5cab92');text('✓',103,118,32,'#f8e6a5');}
if(type==='vista'){box(45,27,70,12,'#d4ab59');box(45,121,70,12,'#d4ab59');line([[53,43],[105,113],[55,113],[107,43],[53,43]],'#82afa8',7);line([[80,66],[80,98]],'#e1bf6c',6);}
if(type==='immunity'){circle(80,80,55,'#6aaea4');urn(80,88,1.3);line([[30,51],[44,33],[64,22]],'#edf3d2',5);}
if(type==='heal'){box(29,48,102,78,'#e9e3c8');box(59,31,43,18,'#489b78');box(69,61,21,51,'#489b78');box(54,76,52,21,'#489b78');}
if(type==='charge'){box(48,30,64,105,'#776092');box(65,19,30,12,'#debd6c');box(60,44,40,38,'#a6c1aa');line([[88,91],[73,107],[88,106],[74,123]],'#ffdf81',7);}
if(type==='chain'){for(let i=-1;i<=1;i++){x.save();x.translate(80+i*34,80+i*11);x.rotate(-.35);x.strokeStyle=i===0?'#d4aa55':'#9ac3c9';x.lineWidth=10;x.beginPath();x.ellipse(0,0,29,18,0,0,7);x.stroke();x.restore();}}
if(type==='order'){x.save();x.translate(80,75);x.rotate(-.6);box(-7,-7,14,79,'#9c794a');box(-37,-25,74,34,'#d2b263');x.restore();box(42,127,77,12,'#705738');}
return c;}

