export function isCampaignOpponent(game,player){return game?.options?.mode==='campaign'&&game.bot===true&&Number.isInteger(player?.id)&&player.id!==game.human;}
export function auraProfile(id){
 if(['trump','putin'].includes(id))return {color:'#ffd15c',width:5,blur:22,opacity:.85};
 if(['xi','bukele'].includes(id))return {color:'#c767ff',width:5,blur:22,opacity:.85};
 if(id==='lula'||id==='flavio')return {color:id==='lula'?'#ff263f':'#28fa77',width:3.5,blur:17,opacity:.75};
 if(['janones','moraes','nikolas','mendonca'].includes(id))return {color:['janones','moraes'].includes(id)?'#ff344c':'#36ed80',width:2,blur:10,opacity:.65};
 return null;
}
export function drawCharacterAura(view,id){
 const a=auraProfile(id);if(!a)return;
 if(!view.auraCanvas){view.auraCanvas=document.createElement('canvas');view.auraCanvas.width=view.c.width;view.auraCanvas.height=view.c.height;}
 const mask=view.auraCanvas,m=mask.getContext('2d'),ctx=view.c.getContext('2d');m.clearRect(0,0,mask.width,mask.height);m.drawImage(view.c,0,0);m.globalCompositeOperation='source-in';m.fillStyle=a.color;m.fillRect(0,0,mask.width,mask.height);m.globalCompositeOperation='source-over';
 ctx.save();ctx.globalCompositeOperation='destination-over';ctx.shadowColor=a.color;ctx.shadowBlur=a.blur;ctx.globalAlpha=a.opacity;ctx.drawImage(mask,0,0);ctx.shadowBlur=0;ctx.globalAlpha=.95;for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4)ctx.drawImage(mask,Math.cos(angle)*a.width,Math.sin(angle)*a.width);ctx.restore();view.tex.needsUpdate=true;
}
