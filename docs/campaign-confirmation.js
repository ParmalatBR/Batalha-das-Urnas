// Uses the game's existing modal so input, focus and pause rules remain shared.
export function openCampaignConfirmation({title,paragraphs,confirmText,onConfirm,onCancel},doc=globalThis.document){
 const dialog=doc.querySelector('#dialog'),body=doc.querySelector('#dialogBody'),focus=doc.activeElement;
 if(dialog.open){onCancel?.();return ()=>{};}
 let accepted=false,finished=false;
 const previousLabel=dialog.getAttribute('aria-labelledby');
 dialog.dataset.panel='campaign-confirmation';dialog.classList.add('campaign-confirmation');
 dialog.setAttribute('aria-labelledby','campaignConfirmTitle');
 doc.querySelector('#dialogTag').textContent='DECISÃO DE CAMPANHA';
 body.innerHTML='<h2 id="campaignConfirmTitle"></h2><div id="campaignConfirmCopy"></div><div class="campaign-confirm-actions"><button id="campaignConfirmCancel" class="paint-button">CANCELAR</button><button id="campaignConfirmAccept" class="paint-button primary"></button></div>';
 body.querySelector('#campaignConfirmTitle').textContent=title;
 for(const text of paragraphs){const p=doc.createElement('p');p.textContent=text;body.querySelector('#campaignConfirmCopy').append(p);}
 body.querySelector('#campaignConfirmAccept').textContent=confirmText;
 const closed=()=>{
  if(finished)return;finished=true;dialog.removeEventListener('close',closed);dialog.classList.remove('campaign-confirmation');
  if(previousLabel)dialog.setAttribute('aria-labelledby',previousLabel);else dialog.removeAttribute('aria-labelledby');
  if(focus?.isConnected)focus.focus({preventScroll:true});
  if(accepted)onConfirm?.();else onCancel?.();
 };
 dialog.addEventListener('close',closed);
 body.querySelector('#campaignConfirmCancel').onclick=()=>dialog.close();
 body.querySelector('#campaignConfirmAccept').onclick=()=>{accepted=true;dialog.close();};
 dialog.showModal();body.querySelector('#campaignConfirmCancel').focus({preventScroll:true});
 return ()=>{accepted=false;if(dialog.open)dialog.close();closed();};
}
