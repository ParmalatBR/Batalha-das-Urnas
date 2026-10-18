import {DEFAULT_DIFFICULTY,DIFFICULTY_IDS,DIFFICULTY_OPTIONS} from './difficulty.js';

const active=run=>!!run&&(!run.completed||!!run.bonus?.queue?.[run.bonus.index]);
// The persisted difficulty itself is the lock, including legacy saves. No second
// flag can accidentally unlock an Extremo campaign during reload or migration.
export function isCampaignDifficultyLocked(run){
 return active(run)&&run.difficulty==='extreme';
}
export function campaignNeedsDifficultySelection(run){
 return active(run)&&run.difficultySelectionPending===true;
}
export function campaignDifficultyDecision(run,next,{confirmed=false}={}){
 if(!active(run)||!DIFFICULTY_IDS.includes(next))return {status:'invalid'};
 if(isCampaignDifficultyLocked(run)&&next!=='extreme')return {status:'restart-required',difficulty:'extreme'};
 if(run.difficulty===next&&!campaignNeedsDifficultySelection(run))return {status:'unchanged',difficulty:next};
 if(next==='extreme'&&confirmed!==true)return {status:'confirmation-required',difficulty:next};
 return {status:'allowed',difficulty:next};
}
export function campaignDifficultyChoices(run){
 const locked=isCampaignDifficultyLocked(run);
 return DIFFICULTY_OPTIONS.map(([id,label])=>({id,label,disabled:locked&&id!=='extreme',requiresConfirmation:id==='extreme'&&(!locked||campaignNeedsDifficultySelection(run))}));
}
// Merge these fields only into a NEW run created by the existing transactional
// restart API. This helper does not reset XP, checkpoints, IDs or generations.
export function campaignRestartDifficulty(){
 return {difficulty:DEFAULT_DIFFICULTY,difficultySelectionPending:true};
}
export function extremeCampaignWarning(name='seu personagem'){
 return 'No Extremo, perder para qualquer adversário zera todo o XP e a evolução de '+name+' e reinicia a campanha na fase 1. A dificuldade fica travada no Extremo. Para escolher outra, é preciso reiniciar a campanha, zerando o XP, os pontos de evolução e as fases; depois, escolher a dificuldade antes da primeira batalha.';
}
export const CAMPAIGN_DIFFICULTY_LOCK_NOTICE='Extremo está travado nesta campanha. Para alterar a dificuldade, reinicie a campanha e zere o XP, a evolução e as fases.';
