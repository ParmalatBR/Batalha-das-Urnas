// A single navigation surface keeps every submenu on the game's cover art.
export const MENU_GROUPS = Object.freeze({
 root:{title:'Menu principal',items:[['single','Single Player'],['multiplayer','Multiplayer'],['collection','Coleção de personagens'],['settings','Configurações'],['quit','Sair do jogo']],secondary:[['help','Como jogar'],['about','Sobre']]},
 single:{title:'Single Player',items:[['campaign','Campanha'],['quick','Batalha rápida'],['survival','Sobrevivência'],['chaos','Caos Institucional'],['bossrush','Desafio dos chefes']]},
 multiplayer:{title:'Multiplayer',items:[['local','PvP Local'],['online','PvP Online']]},
 settings:{title:'Configurações',items:[['profile','Meu Perfil'],['achievements','Conquistas'],['config','Controles e Progresso'],['preferences','Ajustes']]}
});
export function mountMainMenu({home,nav,onAction,onBack=()=>{},onNavigate=()=>{},canExit=typeof globalThis.window?.urnaDesktop?.requestExit==='function',document:doc=globalThis.document}){
 let group='root';
 const render=(next='root',{focus=false}={})=>{
  onNavigate();group=MENU_GROUPS[next]?next:'root';const original=MENU_GROUPS[group],page={...original,items:original.items.filter(([key])=>key!=='quit'||canExit)};home.dataset.menuGroup=group;
  nav.setAttribute('aria-label',group==='root'?'Menu principal':page.title);
  nav.innerHTML=(group!=='root'?'<div class="menu-heading"><h2 id="menuTitle">'+page.title+'</h2></div>':'')+'<div class="ballot-menu">'+page.items.map(([key,label],i)=>'<button type="button" data-menu-action="'+key+'"'+(key==='profile'?' id="accountMenuButton"':key==='online'?' id="onlineMenuButton"':'')+' class="ballot-button" style="--ballot-index:'+i+'"><span class="ballot-label">'+label+'</span></button>').join('')+'</div>'+(page.secondary?'<div class="menu-secondary" role="group" aria-label="Informações do jogo">'+page.secondary.map(([key,label])=>'<button type="button" class="menu-info-link" data-menu-action="'+key+'">'+label+'</button>').join('')+'</div>':'')+(group!=='root'?'<button id="menuBack" class="menu-back" type="button">Menu principal</button>':'');
  nav.querySelectorAll('[data-menu-action]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.menuAction;if(MENU_GROUPS[key])render(key,{focus:true});else onAction(key);}));
  nav.querySelector('#menuBack')?.addEventListener('click',()=>{onBack();render('root',{focus:true});});
  if(focus)nav.querySelector('[data-menu-action]')?.focus({preventScroll:true});
 };
 const escape=e=>{if(e.key==='Escape'&&group!=='root'&&!home.classList.contains('hidden')&&!doc.querySelector('dialog[open]')){e.preventDefault();onBack();render('root',{focus:true});}};
 doc.addEventListener('keydown',escape);render();
 return {render,get group(){return group;},destroy(){doc.removeEventListener('keydown',escape);}};
}
