// Stable save IDs: easy was Tranquilo before V13 and intentionally remains easy/Bobão.
export const DEFAULT_DIFFICULTY='calm';
export const DIFFICULTY_IDS=Object.freeze(['easy','calm','normal','hard','extreme']);
export const DIFFICULTY_OPTIONS=Object.freeze([['easy','Bobão'],['calm','Tranquilo'],['normal','Disputado'],['hard','Acirrado'],['extreme','Extremo']].map(Object.freeze));
export const DIFFICULTY_PROFILES=Object.freeze(Object.fromEntries(Object.entries({
 easy:{plantChance:.12,hesitate:.64,escapeError:.55,think:1.05},
 calm:{plantChance:.32,hesitate:.24,escapeError:.08,think:.40,thinkJitter:.12,wander:.46,plantCooldown:3.8,plantCooldownJitter:1.5,escapeThink:.24},
 normal:{plantChance:.82,hesitate:.07,escapeError:0,think:.13},
 hard:{plantChance:1,hesitate:0,escapeError:0,think:.025},
 extreme:{plantChance:1,hesitate:0,escapeError:0,think:.012}
}).map(([id,p])=>[id,Object.freeze(p)])));
export const DIFFICULTY_DETAILS=Object.freeze({
 easy:Object.freeze({id:'easy',label:'Bobão',summary:'Rivais distraídos e confusos.',help:'O rival anda ao acaso, hesita muito e pode se prender na própria explosão. Quase não lança algemas, não persegue nem prevê armadilhas. Seus poderes ofensivos ficam desativados.'}),
 calm:Object.freeze({id:'calm',label:'Tranquilo',summary:'Uma disputa leve, com tempo para reagir.',help:'O rival alterna perseguição simples e passos distraídos, lança algemas com pausas e tenta escapar sem prever reações em cadeia. Na campanha, seus poderes chegam aos poucos; os avisos duram mais e os chefes não combinam ataques de mudança de fase.'}),
 normal:Object.freeze({id:'normal',label:'Disputado',summary:'Rivais atentos e ataques frequentes.',help:'O rival persegue, procura saídas e ataca com frequência. Na segunda metade da campanha e no Novo Jogo+, antecipa explosões e procura itens. Chefes combinam poderes ao perder vida.'}),
 hard:Object.freeze({id:'hard',label:'Acirrado',summary:'Estratégia desde a primeira arena.',help:'O rival reage depressa, calcula o tempo das explosões e das reações em cadeia desde o início, busca itens e explora oportunidades sem hesitar. Exige planejamento das suas rotas de fuga.'}),
 extreme:Object.freeze({id:'extreme',label:'Extremo',summary:'Reação máxima. Na campanha, uma derrota recomeça tudo.',help:'Toda a estratégia do Acirrado com decisões ainda mais rápidas. Quando tem controle remoto, o rival procura detonar ao alinhar você com a explosão. Na campanha, perder para qualquer adversário zera todo o XP e a evolução do seu personagem e reinicia a campanha na fase 1. Após a confirmação, a campanha fica travada no Extremo. Para trocar de dificuldade, é preciso reiniciar, zerar XP, evolução e fases e escolher a dificuldade antes da primeira batalha. Essas regras não se aplicam aos modos livres.'})
});
export function normalizeDifficulty(value,fallback=DEFAULT_DIFFICULTY){return DIFFICULTY_IDS.includes(value)?value:DIFFICULTY_IDS.includes(fallback)?fallback:DEFAULT_DIFFICULTY;}
export function difficultyLabel(id){return DIFFICULTY_DETAILS[normalizeDifficulty(id)].label;}
