import * as THREE from './vendor/three.module.js';
import {CHARACTERS} from './registry.js';
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function victoryTeam(player){
 const id=player.characterId||['lula','flavio'][player.id%2];
 return CHARACTERS[id]?.pvpTeam||(player.team===0?'lula':'flavio');
}
export function victoryGesture(player){const id=player.characterId||['lula','flavio'][player.id%2];return ['bukele','xi','trump','putin'].includes(id)?'salute':victoryTeam(player)==='lula'?'L':'V';}
export function victoryDuration(reduced=false){return reduced?2.2:3.2;}
export function victoryPose(state,reduced=false){
 const elapsed=state.elapsed,turn=reduced?.18:.42;
 let direction=2;
 if(elapsed<turn){const initial=state.initialDirection??2;direction=initial===0?(elapsed<turn*.48?0:1):initial;}
 const raise=smooth((elapsed-turn)/(reduced?.4:.75)),fingers=smooth((elapsed-turn-.22)/(reduced?.26:.52));
 return {direction,raise,fingers,gesture:state.gesture,phase:elapsed<turn?'turn':raise<1?'raise':'hold',facing:direction===2?'front':'turning'};
}
const cells=new Map(),tones={erika:'dark',marina:'medium',magno:'medium',boulos:'medium',bukele:'medium',janones:'medium'};
let loading;
export function loadVictoryHands(){
 if(loading)return loading;
 loading=(async()=>{
  await Promise.all([['gesture-hands-v29',['L','V']],['salute-hands-v29',['salute']]].map(async([name,allowed])=>{
   try{
    const response=await fetch('assets/characters/'+name+'.json');if(!response.ok)return;
    const manifest=await response.json(),image=new Image();image.src=manifest.image;await image.decode();
    for(const [gesture,variants]of Object.entries(manifest.cells||{}))for(const [tone,cell]of Object.entries(variants)){
     if(!allowed.includes(gesture)||!(cell.w>0&&cell.h>0))continue;
     const canvas=document.createElement('canvas');canvas.width=cell.w;canvas.height=cell.h;
     canvas.getContext('2d').drawImage(image,cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
     cells.set(gesture+':'+tone,{canvas,wrist:cell.wrist||[cell.w*.5,cell.h*.875],alphaCutoff:manifest.alphaCutoff??.04,angleOffset:cell.angleOffset??manifest.angleOffset??0,source:manifest.image});
    }
   }catch{}
  }));
  return ['L','V','salute'].every(hasVictoryHand);
 })();return loading;
}
export function hasVictoryHand(gesture){return cells.has(gesture+':light');}
export function makeVictoryHand(skin='#d59b73'){
 const root=new THREE.Group(),plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,alphaTest:.04}));
 plane.renderOrder=36;root.add(plane);root.userData={plane,skin,gesture:null,extension:0,representation:'raster',assetReady:false};root.visible=false;return root;
}
export function poseVictoryHand(hand,gesture,amount,characterId,height=52){
 const data=hand.userData,tone=tones[characterId]||'light',cell=cells.get(gesture+':'+tone)||cells.get(gesture+':light');
 Object.assign(data,{gesture,extension:clamp(amount),tone,anatomicalSide:gesture==='V'?'left':'right',assetReady:!!cell});
 if(!cell)return;
 const {plane}=data;if(data.cell!==cell){plane.material.map?.dispose();const texture=new THREE.CanvasTexture(cell.canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;plane.material.map=texture;plane.material.alphaTest=cell.alphaCutoff;plane.material.needsUpdate=true;data.cell=cell;}
 const ratio=height/Math.max(cell.canvas.width,cell.canvas.height),width=cell.canvas.width*ratio,actualHeight=cell.canvas.height*ratio;
 plane.scale.set(width,actualHeight,1);plane.position.set((cell.canvas.width*.5-cell.wrist[0])*ratio,(cell.wrist[1]-cell.canvas.height*.5)*ratio,0);
 data.height=actualHeight;data.width=width;data.wrist=[...cell.wrist];data.angleOffset=cell.angleOffset;data.source=cell.source;
}
export function attachVictoryHand(hand,view,camera){
 const point=view.motionHand;if(!point){hand.visible=false;return;}
 poseVictoryHand(hand,point.gesture,view.victoryPose?.fingers||0,point.characterId,point.height||52);
 hand.visible=hand.userData.assetReady&&(point.reveal??1)>0;if(!hand.visible)return;
 const offset=new THREE.Vector3((point.x/256-view.sprite.center.x)*view.sprite.scale.x,((1-point.y/256)-view.sprite.center.y)*view.sprite.scale.y,.025);
 offset.applyQuaternion(camera.quaternion);hand.position.copy(view.sprite.position).add(offset);
 hand.quaternion.copy(camera.quaternion);hand.rotateZ(-point.angle+hand.userData.angleOffset);hand.scale.setScalar(view.sprite.scale.y/256);
 // The atlas already contains the anatomical right L/salute and left V hands.
 hand.userData.plane.material.opacity=point.reveal??1;
}
