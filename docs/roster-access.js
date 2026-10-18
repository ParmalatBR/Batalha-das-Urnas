import {CHARACTERS} from './registry.js';
import {INTERNATIONAL,internationalKnown} from './international-campaign.js';

export function requiredCampaigns(id){
 if(!CHARACTERS[id])return Infinity;
 if(['lula','flavio'].includes(id))return 0;
 if(['xi','bukele'].includes(id))return 2;
 if(['trump','putin'].includes(id))return 4;
 return 1;
}
export function grantCampaignUnlocks(state){
 const added=[];
 for(const id of Object.keys(CHARACTERS))if((!INTERNATIONAL[id]||internationalKnown(state,id))&&state.campaigns>=requiredCampaigns(id)&&!state.unlocked.includes(id)){state.unlocked.push(id);added.push(id);}
 return added;
}
export const isUnlocked=(state,id)=>!!CHARACTERS[id]&&state.unlocked.includes(id);
export const playableRoster=state=>Object.keys(CHARACTERS).filter(id=>isUnlocked(state,id));
export function canLaunchRoster(state,session){
 if(!session||!isUnlocked(state,session.hero)||session.characters?.[0]!==session.hero)return false;
 return !['quick','chaos'].includes(session.kind)||session.characters.every(id=>isUnlocked(state,id));
}
export function unlockDescription(state,id){
 if(isUnlocked(state,id))return 'Disponível nos modos livres. Selecione para jogar ou personalize seus atributos.';
 const total=requiredCampaigns(id),remaining=Math.max(0,total-state.campaigns);
 if(INTERNATIONAL[id])return 'Conclua '+total+' campanhas brasileiras e finalize a campanha de '+CHARACTERS[INTERNATIONAL[id].hero].name+' para encontrar este superboss após a celebração no Planalto. Sua identidade e seleção serão liberadas quando ele se revelar. Progresso: '+Math.min(state.campaigns,total)+' / '+total+'.';
 return (total===1?'Conclua sua primeira campanha para liberar todo o elenco brasileiro.':'Conclua '+total+' campanhas, com qualquer um dos dois protagonistas, para liberar esta dupla de líderes internacionais.')+' Progresso: '+Math.min(state.campaigns,total)+' / '+total+'. '+(remaining===1?'Falta uma campanha.':'Faltam '+remaining+' campanhas.');
}
