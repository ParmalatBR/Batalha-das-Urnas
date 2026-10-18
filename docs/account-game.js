import {sanitizeSave} from './progression.js';
import {profilePreferences} from './profile-preferences.js';

/** Keep the existing local save authoritative until the player chooses a cloud copy. */
export function gameAccountBridge({expansion,preferences,remember,canApply,session,changed,applied,navigate}){
 return {
  getSave:()=>expansion.progress.state,
  getPreferences:()=>profilePreferences({...preferences,...expansion.settings}),
  canApply,session,changed,navigate,
  applySave(save,rawPreferences){
   if(canApply()===false)return false;
   if(save?.version!==1)return false;
   const progress=expansion.progress,previous=progress.state;
   progress.state=sanitizeSave(save);
   if(!progress.commit()){progress.state=previous;return false;}
   const patch=profilePreferences(rawPreferences),settings={};
   for(const key of ['master','subtitles','flashes','skipSeen','eventRate','keys'])if(Object.hasOwn(patch,key)){settings[key]=patch[key];delete patch[key];}
   remember(patch);Object.assign(expansion.settings,settings);expansion.saveSettings();
   expansion.session=null;expansion.pendingResult=null;expansion.theme(progress.state.selected);applied?.();
   return true;
  }
 };
}
