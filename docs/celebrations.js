// The portrait celebrates a game event; the caption identifies archival audio.
export class Celebrations {
 constructor(root){
  this.nodes=[0,1].map(id=>{const el=document.createElement('aside');el.className='celebration '+(id?'blue':'red');el.setAttribute('aria-live','polite');el.innerHTML='<div class="celebration-rays"></div><img alt="'+(id?'Flávio rindo e fazendo V':'Lula rindo e fazendo L')+'" src="assets/reactions/'+(id?'flavio':'lula')+'-laugh-v6.png"><div class="celebration-copy"><b>ACERTOU!</b><strong></strong><small></small></div>';root.append(el);return {el,life:0};});this.clear();
 }
 show(id,quote,archival=false,event='hit',streak=1,duration=0){const n=this.nodes[id];n.el.setAttribute('aria-hidden','false');n.el.querySelector('b').textContent=event==='win'?'VITÓRIA!':event==='special'?'HABILIDADE!':streak>1?'DOBRADINHA!':'NA MOSCA!';n.el.classList.toggle('victory',event==='win');n.el.querySelector('strong').textContent=quote;n.el.querySelector('small').textContent='';n.life=Math.min(8,Math.max(event==='win'?3.5:2.2,(Number.isFinite(duration)?Math.max(0,duration):0)+.4));n.el.style.setProperty('--cutin-time',n.life+'s');n.el.classList.remove('show');void n.el.offsetWidth;n.el.classList.add('show');}
 update(dt){for(const n of this.nodes)if(n.life>0){n.life-=dt;if(n.life<=0){n.el.classList.remove('show');n.el.setAttribute('aria-hidden','true');}}}
 clear(){for(const n of this.nodes){n.life=0;n.el.classList.remove('show');n.el.setAttribute('aria-hidden','true');}}
}
