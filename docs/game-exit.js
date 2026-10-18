import {SAVE_KEY} from './progression.js';

function writeVerified(storage,key,value){
 const text=JSON.stringify(value);
 storage.setItem(key,text);
 if(storage.getItem(key)!==text)throw Error('SAVE_READBACK_FAILED');
}

// Synchronous: capture the arena before any state transition or native close.
// Cloud uploads are not required; the account's durable queue resumes next time.
export function persistGameForExit({expansion,preferences,account,saveHistory=()=>true,storage=globalThis.localStorage}){
 if(expansion.checkpoint()===false)throw Error('CAMPAIGN_RESET_SAVE_FAILED');
 const progress=expansion.progress;
 if(!progress.commit()||progress.storage.getItem(SAVE_KEY)!==JSON.stringify(progress.state))throw Error('PROGRESS_SAVE_FAILED');
 writeVerified(storage,'urna-preferences-v5',preferences);
 writeVerified(storage,'urna-expansion-settings',expansion.settings);
 // commit's optional hook swallows failures. Verify the account write explicitly.
 // Interrupted account switches retain their existing recovery marker and backup.
 account?.localChanged();
 if(saveHistory()===false)throw Error('HISTORY_SAVE_FAILED');
 return true;
}

export function installGameExit({desktop,save,onError,onBrowserExit}){
 let pending=null;
 const prepare=()=>{try{return save()===true;}catch(error){onError(error);return false;}};
 const unsubscribe=desktop?.onBeforeExit(prepare);
 return {
  request(){
   if(pending)return pending;
   pending=Promise.resolve().then(async()=>{
    if(desktop)return await desktop.requestExit();
    if(!prepare())return false;
    onBrowserExit();return true;
   }).catch(error=>{onError(error);return false;}).finally(()=>{pending=null;});
   return pending;
  },
  destroy(){unsubscribe?.();}
 };
}
