import {unlockDescription} from './roster-access.js';
import {CHARACTERS,SCENES,ATTRIBUTES,VARIANTS,attributeCap} from './registry.js';
import {POWER_INFO} from './content.js';
import {requiredCampaigns} from './roster-access.js';
import {DIFFICULTY_OPTIONS,DIFFICULTY_DETAILS} from './difficulty.js';
export {DIFFICULTY_OPTIONS};

const entry=(title,body,tip)=>({title,body:Array.isArray(body)?body:[body],...(tip?{tip}:{})});
const difficultyTips={easy:'Mesmo aqui, a sua própria algema pode atingir você. Deixe uma rota de fuga!',calm:'Abra caminhos antes de perseguir o adversário.',normal:'Uma algema bem posicionada vale mais que várias sem saída.',hard:'Observe o temporizador de todas as algemas próximas, não só da sua.',extreme:'Avisos no chão são a sua chance de reagir antes do efeito.'};
export const DIFFICULTY_HELP=Object.fromEntries(Object.entries(DIFFICULTY_DETAILS).map(([id,d])=>[id,entry(d.label,[d.summary,d.help],difficultyTips[id])]));
export const ATTRIBUTE_HELP={
 speed:entry('Velocidade',['Aumenta a rapidez dos passos na arena. Ajuda a buscar itens e a sair de corredores antes da ativação das algemas.','Evolução e itens se somam até o limite do personagem. Aceleração temporária também respeita esse limite.'],'Mais velocidade não protege contra correntes: ainda é preciso escolher uma saída.'),
 capacity:entry('Algemas simultâneas',['Aumenta quantas algemas suas podem ficar ativas ao mesmo tempo. Quando uma delas termina, essa vaga volta ao estoque.','É útil para fechar rotas e usar a variante dupla, que precisa de uma vaga extra.'],'Não ocupe todas as saídas ao cercar o adversário.'),
 range:entry('Alcance das correntes',['Aumenta a distância que as correntes percorrem em cruz a partir da algema.','Metal interrompe a corrente. O primeiro bloco destrutível também a interrompe, mesmo quando é destruído.'],'Alcance maior ameaça mais casas, inclusive a sua rota de fuga.'),
 resistance:entry('Resistência',['Aumenta o número máximo de corações ao iniciar a partida. Uma captura sem proteção remove um coração.','Itens de recuperação devolvem resistência até o máximo atual; escudos e imunidade podem evitar uma perda.'],'A barra do chefe mostra quanto ainda falta para vencê-lo.'),
 cooldown:entry('Recarga',['Diminui a espera entre usos da habilidade exclusiva do personagem.','A contagem aparece junto ao botão da habilidade. O ganho respeita um tempo mínimo de recarga.'],'Recarga melhora a habilidade exclusiva; ela não acelera o temporizador das algemas.'),
 exclusive:entry('Habilidade exclusiva',['Fortalece a habilidade própria do personagem. Conforme o efeito, amplia sua duração, sua área ou a proteção que oferece. Também ajuda na recarga.','Na campanha, batalha rápida, sobrevivência, caos e desafio dos chefes, use Q ou a tecla escolhida em Controles. O duelo presidencial usa apenas itens.'],'E usa o item especial equipado; Q dá acesso direto à habilidade nos modos que a utilizam.')
};
const powerBodies={
 range:['O megafone aumenta o alcance das correntes em uma casa, até o limite do personagem.','A melhoria dura até o fim da rodada. A corrente continua parando no metal e no primeiro bloco destrutível.'],
 capacity:['As urnas extras aumentam em uma a quantidade de algemas que você pode manter ativas, até o limite do personagem.','A vaga volta quando a algema termina. A melhoria dura até o fim da rodada.'],
 speed:['A cédula alada acelera seus passos até o limite do personagem.','O desenho transforma a corrida pelos votos em uma corrida literal. A melhoria dura até o fim da rodada.'],
 kick:['Depois de pegar a bota, caminhe contra uma algema para empurrá-la pelo corredor.','Ela precisa de espaço livre para deslizar. Um bom chute muda a área de perigo e abre passagem.'],
 glove:['A luva arremessa uma algema que está na sua casa ou na casa à sua frente.','Vire para a direção desejada e use E; no segundo jogador do duelo, use Shift direito. O arremesso alcança até três casas.'],
 remote:['O controle permite ativar suas algemas no momento escolhido com E, ou Shift direito no segundo jogador do duelo.','O temporizador começa em cinco segundos e pode ser adiado por efeitos como Pedido de vista. Não espere indefinidamente dentro da área de alcance.'],
 pierce:['O carimbo urgente aumenta o alcance em uma casa.','A corrente continua parando no primeiro bloco destrutível. Este item não atravessa uma fileira inteira de blocos.'],
 shield:['O escudo absorve uma captura e depois é consumido.','Pegar outro escudo não cria uma pilha de proteções. Aproveite a margem para escapar e reorganizar a posição.'],
 ghost:['A credencial permite atravessar blocos destrutíveis durante oito segundos.','Procure uma casa livre antes de o efeito acabar. As paredes fixas continuam bloqueando a passagem.'],
 pass:['O salvo-conduto concede um escudo para absorver a próxima captura.','É uma proteção de um uso: não concede invulnerabilidade permanente.'],
 habeas:['Absorve a próxima captura com um escudo de um uso.','Use essa proteção para sair de um aperto; ela não aumenta o total de corações.'],
 vista:['Adia em 1,3 segundo as algemas que já estão ativas, respeitando o limite do temporizador.','O tempo extra beneficia a sua fuga, mas também dá mais tempo aos rivais.'],
 immunity:['Impede capturas durante três segundos.','O brilho de proteção é temporário. Saia da área de risco antes de ele terminar.'],
 heal:['Recupera um coração, sem ultrapassar a sua resistência máxima.','Se você já estiver com todos os corações, guarde a rota até o item para um momento de necessidade.'],
 charge:['Deixa a habilidade exclusiva pronta para usar novamente nos modos que a utilizam.','Acione Q, ou a tecla personalizada, para aproveitar a recarga imediata. O duelo presidencial não utiliza habilidades exclusivas.'],
 chain:['Concede alcance adicional durante oito segundos.','Nesse período, suas algemas também podem acelerar uma reação em cadeia com outras que estejam próximas.'],
 order:['Empurra personagens e algemas próximos para casas livres.','Use para abrir espaço, sair de um cerco ou deslocar uma ameaça. O empurrão não atravessa paredes.']
};
export const POWER_HELP=Object.fromEntries(Object.entries(POWER_INFO).map(([id,p])=>[id,entry(p.name,powerBodies[id]||p.desc)]));
export const CUFF_HELP={
 normal:entry('Algema clássica',['Quando o temporizador acaba, as correntes se espalham em cruz. Atingem personagens e destroem o primeiro bloco frágil de cada direção.'],'Coloque, saia do corredor e use o metal como proteção.'),
 debate:entry('Algema do debate',['Produz um empurrão em vez de uma captura direta. Serve para deslocar o rival e mudar a posição das algemas próximas.','Combine o empurrão com outra ameaça; sozinha, esta variante não tira corações.']),
 dispatch:entry('Algema do despacho',['Deixa uma área que reduz os passos do adversário por cerca de três segundos.','A área não captura diretamente. Use-a para dificultar uma fuga ou defender um corredor.']),
 meme:entry('Algema do meme',['Deixa uma área de desorientação. Quem é afetado tem os comandos de movimento invertidos por um instante.','Não causa captura direta; ajuda a atrapalhar a rota do adversário.']),
 crisis:entry('Algema da crise',['Faz uma expansão normal e acelera algemas próximas em uma reação em cadeia.','O temporizador de outras algemas pode terminar muito antes do previsto.'],'Antes de ativar, confira o alcance de toda a cadeia.'),
 double:entry('Algema dupla',['Tenta colocar uma segunda algema em uma casa livre ao lado.','É preciso ter capacidade disponível e espaço sem personagens ou outras algemas. Sem essas condições, só a primeira é colocada.']),
 long:entry('Corrente longa',['Adiciona duas casas de alcance à algema colocada, respeitando o limite do personagem.','Metal e o primeiro bloco frágil continuam interrompendo a corrente.']),
 collective:entry('Mandado coletivo',['Adiciona duas casas de alcance e aumenta um pouco o tempo até a ativação.','A espera extra permite sair da área maior. O alcance continua respeitando o limite do personagem.'])
};
const sceneBodies={
 'justica-federal':['A arena de Curitiba recebe pilhas de processos que bloqueiam temporariamente os corredores.','Observe o aviso no piso e mantenha uma rota de saída antes de colocar a algema.'],
 agu:['A sede da AGU recebe uma chuva de papéis que reduz a velocidade nas casas marcadas.','Contorne os documentos para não perder o tempo de fuga.'],
 camara:['O plenário tem um microfone central que pode desencadear um empurrão após um aviso.','Passe pelo centro para ativá-lo e observe as casas marcadas antes do efeito.'],
 senado:['Cadeiras podem criar bloqueios temporários nos corredores, com aviso antecipado.','Mantenha uma segunda saída para não depender de um único caminho.'],
 congresso:['Durante o recesso, os adversários recuam ou hesitam por instantes e suspendem novos ataques.','Use esse intervalo para buscar itens e abrir uma posição melhor. Algema já colocada continua sendo uma ameaça.'],
 pf:['Portas e barreiras temporárias podem mudar as passagens disponíveis.','Leia as marcações no piso e não encoste em uma rota que está prestes a fechar.'],
 pgr:['Papéis tomam áreas marcadas e reduzem a velocidade de quem é afetado.','O caminho mais curto pode ser o mais lento: contorne os documentos.'],
 stj:['Pilhas de autos podem bloquear temporariamente partes da arena.','Antecipe a mudança de rota ao ver o aviso no chão.'],
 stf:['Decisões do cenário introduzem barreiras temporárias em casas sinalizadas.','Guarde espaço para manobrar e acompanhe o temporizador das algemas perto dos bloqueios.'],
 tse:['Portais nas laterais transportam o personagem entre os dois lados da arena quando a saída está livre e segura.','Há um breve intervalo antes de usar o portal novamente. Use-o para mudar de frente.'],
 esplanada:['A passagem da comitiva cria obstáculos temporários e reorganiza corredores.','Planeje a volta antes de avançar para uma rua estreita.'],
 praca:['Rajadas na praça empurram personagens e objetos próximos do centro.','As casas são sinalizadas antes do efeito. Evite depender de uma posição exata perto da ativação.'],
 debate:['O microfone do estúdio dispara um empurrão anunciado nas casas próximas.','Controle o centro sem perder a rota de saída. O adversário também pode usar o microfone.'],
 planalto:['O palco da decisão presidencial. Nas fases avançadas do confronto, novas barreiras podem aparecer após o aviso.','O chefe final exige mais resistência e atenção às rotas de fuga.']
};
export const SCENE_HELP=Object.fromEntries(SCENES.map(s=>[s.id,entry(s.name,[...(sceneBodies[s.id]||['Uma nova arena para a disputa.']),s.id==='tse'?'Na campanha e nos modos livres, os portais funcionam mesmo com os eventos desligados.':'As interações descritas fazem parte dos modos da campanha e dos modos livres, quando os eventos estão ligados.'])]));
const ABILITY_HELP={rally:'Acelera o personagem por um período curto e oferece uma breve proteção ao começar.',sprint:'Aumenta temporariamente a velocidade para reposicionar e escapar.',push:'Empurra personagens e algemas próximos para casas livres.',barrier:'Ergue bloqueios temporários em casas sinalizadas perto do alvo.',wall:'Forma uma parede temporária em casas sinalizadas, sem fechar completamente as rotas de passagem.',long:'Coloca uma algema com alcance ampliado e tempo extra para escapar.',portal:'Reposiciona o personagem em um canto seguro e livre, com breve proteção.',meme:'Marca uma área que inverte os comandos de movimento do adversário por instantes.',delay:'Adia o temporizador das algemas ativas, criando tempo para reorganizar a fuga.',restore:'Recompõe obstáculos temporários em casas sinalizadas.',shield:'Concede proteção temporária e um escudo contra captura.',slow:'Cria uma área que reduz a velocidade do adversário.',collective:'Coloca uma algema com alcance ampliado e maior tempo até a ativação.',double:'Tenta colocar duas algemas; precisa de uma casa livre ao lado e espaço no estoque.',giant:'Coloca uma algema de grande alcance, respeitando o limite do personagem.',ice:'Cria uma área gelada que reduz a velocidade do adversário.'};
export const FEATURE_HELP={
 campaign:entry('Caminho ao Planalto',['Doze batalhas por campanha, com minibosses nas fases 6 e 11 e rival presidencial na fase 12.','Vencer avança um marco da rampa e rende XP. Recomeçar ou iniciar uma nova campanha zera o XP e os pontos de evolução deste personagem, após sua confirmação.','No Extremo, uma derrota para qualquer adversário zera a evolução e volta à fase 1. Após confirmar o Extremo, só é possível trocar a dificuldade reiniciando a campanha, zerando XP, evolução e fases e escolhendo novamente antes da primeira batalha. O progresso é salvo neste aparelho.']),
 quick:entry('Batalha rápida',['Escolha personagem, adversário, cenário e regras para uma partida avulsa.','Ative atributos normalizados para suspender os bônus de XP nessa disputa.']),
 survival:entry('Sobrevivência',['Vença ondas sucessivas. As ondas seguintes ficam mais exigentes e podem reunir mais rivais.','Uma vitória recupera um coração até o seu máximo. A pontuação considera capturas, vitórias e tempo restante.']),
 chaos:entry('Caos institucional',['Uma partida com eventos mais frequentes e opção de regras que mudam durante o jogo.','O aviso na tela mostra a nova pauta. Observe os efeitos antes de manter a estratégia anterior.']),
 bossrush:entry('Desafio dos chefes',['Enfrente em sequência os dois minibosses e o rival presidencial da rota escolhida.','Cada vitória leva ao próximo chefe. As cenas de entrada e comemoração acompanham a disputa.']),
 collection:entry('Coleção de personagens',['Veja os personagens liberados, suas habilidades, nível e resultados.','Conclua uma campanha para liberar todo o elenco brasileiro. Duas campanhas liberam a primeira dupla internacional; quatro liberam a segunda.']),
 evolution:entry('Evolução & visuais',['Ganhe XP jogando, suba de nível e distribua pontos entre seis atributos.','Cada nível concede dois pontos. Você pode redistribuí-los sem custo fora da partida.']),
 achievements:entry('Conquistas',['Desafios de capturas, vitórias, habilidades e campanhas registram seus feitos.','A barra de cada conquista mostra a distância até o objetivo.']),
 config:entry('Controles & progresso',['Ajuste teclas, legendas, efeitos e frequência dos eventos.','Exporte uma cópia do progresso para guardar seu elenco e sua evolução.']),
 normalized:entry('Atributos normalizados',['Suspende os bônus que você distribuiu com XP nessa partida. Os itens coletados na arena continuam funcionando.','Desative para entrar com a evolução acumulada dos personagens. A escolha não apaga pontos nem XP.']),
 events:entry('Eventos & interações',['Ativa as situações que mudam o ritmo da partida: recesso, adiamento de algemas, papéis, barreiras e outras surpresas do cenário.','Avisos mostram os efeitos antes da ativação. Desative para uma disputa com menos interferências.']),
 lives:entry('Resistência inicial',['Define quantos corações cada participante recebe como ponto de partida.','Quando os atributos de evolução estão ativos, o bônus de resistência é acrescentado até o limite do personagem.']),
 respec:entry('Redistribuir pontos',['Devolve os pontos gastos nos seis atributos para você escolher outra combinação.','Seu XP, nível, vitórias, personagens e visuais permanecem guardados. A redistribuição é gratuita fora da partida.']),
 xp:entry('XP e nível',['As partidas e as etapas da campanha rendem experiência. A barra mostra seu avanço até o próximo nível.','Ganhar um nível concede dois pontos para distribuir em Evolução. O limite atual é nível 30.']),
 unlocks:entry('Como liberar o elenco',['1 campanha concluída: todos os personagens brasileiros das duas rotas.','2 campanhas concluídas: os dois integrantes da primeira dupla internacional.','4 campanhas concluídas: os dois integrantes da segunda dupla internacional.','Personagens que você já liberou continuam disponíveis.']),
 save:entry('Guardar meu progresso',['O jogo salva neste navegador. Limpar os dados do site ou mudar de navegador não transporta o arquivo automaticamente.','Use Exportar progresso para baixar uma cópia. Importar restaura essa cópia e substitui o progresso atual.']),
 subtitles:entry('Legendas',['Mostra por escrito as falas e os comentários que acompanham a partida.','É possível acompanhar a piada mesmo com as vozes desligadas.']),
 skipSeen:entry('Pular cenas já vistas',['Pula introduções e comemorações que este progresso já registrou como assistidas.','Desative para rever as entradas dos chefes, os triunfos e a subida da rampa.']),
 flashes:entry('Flashes de impacto',['Controla os clarões e a intensidade visual de efeitos comemorativos.','Desligar reduz os flashes; avisos de perigo e informações da partida continuam visíveis.']),
 eventRate:entry('Frequência dos eventos',['Raros dá mais tempo entre surpresas; Normal mantém o ritmo padrão; Frequentes traz interferências mais próximas.','Essa escolha funciona junto com a opção de eventos ativados na partida.']),
 sound:entry('Som e vozes',['Efeitos, música e falas têm volumes separados. Ajuste-os para ouvir as correntes sem encobrir as vozes.','No celular, o primeiro toque no jogo também permite iniciar o áudio.']),
 series:entry('Formato do duelo',['Melhor de 3: vence quem conquistar duas rodadas. Melhor de 5: vence quem conquistar três.','Rodadas livres mantém a disputa sem um alvo fixo de vitórias.']),
 duration:entry('Tempo da rodada',['Escolha o limite de tempo da disputa. Rodadas curtas pedem decisões mais rápidas.','Se o tempo acabar e mais de um participante continuar na arena, a rodada termina empatada.']),
 light:entry('Luz de Brasília',['Troca a iluminação entre o sol do dia e o fim de tarde.','A escolha muda o ambiente visual e preserva as regras da partida.']),
 solo:entry('Você × computador',['Você controla o personagem selecionado, e o computador comanda o rival.','A dificuldade regula o comportamento do adversário.']),
 duo:entry('Dois no mesmo teclado',['Jogador 1: WASD, Espaço para algema e E para item especial.','Jogador 2: setas, Enter para algema e Shift direito para item especial.']),
 signature:entry('Habilidade exclusiva',['Cada personagem tem uma habilidade própria, além dos itens que encontra na arena.','Na campanha, batalha rápida, sobrevivência, caos e desafio dos chefes, use Q ou a tecla personalizada. O botão mostra a recarga. O duelo presidencial usa apenas itens.']),
 cosmetics:entry('Visuais e comemorações',['Trajes, molduras, materiais das correntes e celebrações são recompensas de campanhas concluídas.','Personalizam a apresentação do personagem e não consomem pontos de atributo.'])
};
export const MODIFIER_HELP={none:entry('Regras clássicas','Comece com os atributos e a variante selecionados, sem um modificador extra.'),random:entry('Pauta mutante','A variante das algemas pode mudar com as interferências do cenário. Leia os avisos para saber qual regra entrou em vigor.'),giant:entry('Correntes gigantes',['Todos começam com alcance fixo de seis casas.','Essa regra substitui o alcance inicial da evolução, mesmo que o personagem já pudesse começar com mais. Planeje a saída antes de colocar a algema.']),fast:entry('Sessão acelerada',['Todos começam com o mesmo bônus de velocidade: três unidades.','Essa regra substitui a velocidade inicial da evolução, inclusive de personagens que já poderiam começar mais rápidos.']),stock:entry('Estoque extra',['Todos começam com capacidade para quatro algemas simultâneas.','Essa regra substitui a capacidade inicial da evolução, mesmo se o personagem já pudesse começar com mais.']),tiny:entry('Miniaturas','Os personagens ficam menores na apresentação, mantendo as casas e regras de colisão da arena.'),dark:entry('Debate noturno','A arena fica com iluminação noturna. Preste atenção às algemas e às marcações no piso.')};

export function unlockHelp(id,progress){
 const state=progress?.state||progress||{},c=CHARACTERS[id],unlocked=state.unlocked||[];
 if(!c)return entry('Personagem bloqueado','Conclua campanhas para ampliar sua coleção.');
 if(unlocked.includes(id))return entry('Personagem disponível','Este personagem já faz parte da sua coleção. Você pode selecioná-lo nos modos livres.');
 const campaigns=Math.max(0,Number(state.campaigns)||0),target=requiredCampaigns(id);if(c.category==='international')return {...entry('Líder internacional oculto',unlockDescription(state,id),'A moldura indica a categoria do desafio. A identidade permanece em segredo até a revelação.'),locked:true,target};
 const milestone=target===1?'Conclua uma campanha com Lula ou Flávio para liberar todo o elenco brasileiro das duas rotas.':`Conclua ${target} campanhas para liberar os dois personagens desta dupla internacional.`;
 return {...entry(c.category==='international'?'Líder internacional bloqueado':'Personagem brasileiro bloqueado',[milestone,`${campaigns} de ${target} campanhas concluídas. ${campaigns>=target?'A recompensa deste marco fica disponível ao atualizar o progresso.':`Falta${target-campaigns===1?'':'m'} ${target-campaigns} campanha${target-campaigns===1?'':'s'}.`}`],'Clique no cartão para consultar o progresso; o “!” abre apenas esta explicação.'),locked:true,target};
}
export function characterHelp(id,progress){
 const state=progress?.state||progress||{},c=CHARACTERS[id];if(!c||!(state.unlocked||[]).includes(id))return unlockHelp(id,progress);
 return entry(c.name,[...(c.role?[c.role+'. '+c.bio]:[]),c.special+': '+(ABILITY_HELP[c.ability]||'Use a habilidade exclusiva para mudar a disputa.'),'Na campanha e nos modos livres com habilidades exclusivas, use Q ou a tecla escolhida em Controles. A habilidade volta após a recarga. O duelo presidencial usa apenas itens.'],'Clique no cartão para consultar atributos e selecionar o personagem.');
}
export function resolveHelp(key,context={}){
 const [type,id]=String(key||'').split(':');
 if(type==='character')return characterHelp(id,context.progress);
 if(type==='attribute'&&ATTRIBUTE_HELP[id]){const base=ATTRIBUTE_HELP[id],character=CHARACTERS[context.characterId];return {...base,body:[...base.body,...(character?[`Limite de evolução deste personagem: ${attributeCap(character.id,id)} pontos neste atributo.`]:[])]};}
 const groups={difficulty:DIFFICULTY_HELP,power:POWER_HELP,cuff:CUFF_HELP,scene:SCENE_HELP,feature:FEATURE_HELP,modifier:MODIFIER_HELP};
 return groups[type]?.[id]||null;
}
