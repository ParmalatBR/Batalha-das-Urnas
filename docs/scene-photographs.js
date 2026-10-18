import * as THREE from './vendor/three.module.js';

// Real photographs only. Source, author, license and transformations are in
// assets/scene-photos/credits.json and PHOTO-CREDITS.md.
export const SCENE_PHOTOGRAPHS=Object.freeze(Object.fromEntries([
 ['camara','Plenário da Câmara dos Deputados',.58],
 ['senado','Plenário do Senado Federal',.60],
 ['congresso','Congresso Nacional',.62],
 ['pf','Sede da Polícia Federal',.58],
 ['pgr','Procuradoria-Geral da República',.60],
 ['stj','Plenário do Superior Tribunal de Justiça',.60],
 ['stf','Plenário do Supremo Tribunal Federal',.58],
 ['tse','Plenário do Tribunal Superior Eleitoral',.58],
 ['esplanada','Esplanada dos Ministérios',.62],
 ['praca','Praça dos Três Poderes',.60],
 ['debate','Estúdio real de debate eleitoral',.58],
 ['planalto','Palácio do Planalto',.62],
 ['justica-federal','Justiça Federal em Curitiba',.52],
 ['agu','Sede da Advocacia-Geral da União',.64]
].map(([id,label,anchorY])=>[id,{id,label,anchorY,url:new URL('./assets/scene-photos/'+id+'.webp',import.meta.url).href}])));

const prefix=['Brasília — entorno arquitetônico','Ambiente ','Materiais e arquitetura · '];
function hideSyntheticSurroundings(world,state){
 for(const object of world.scene.children){
  const hugeGround=object.isMesh&&object.geometry?.type==='BoxGeometry'&&object.geometry.parameters.width>=100&&object.geometry.parameters.depth>=100;
  if(hugeGround||prefix.some(p=>object.name===p||object.name.startsWith(p))){state.hidden.push([object,object.visible]);object.visible=false;}
 }
}
function releasePlane(state){
 if(state.plane){state.plane.removeFromParent();state.plane.geometry.dispose();state.plane.material.dispose();state.plane=null;}
 for(const [object,visible]of state.hidden)object.visible=visible;
 state.hidden=[];
}
function stateFor(world){return world._scenePhotographs||= {generation:0,cache:new Map(),plane:null,hidden:[],size:new THREE.Vector2()};}

// Call at the END of World.build, after all synthetic environment builders.
// Returns Promise<boolean>. Loading failure leaves the original surroundings intact.
// Repeated builds invalidate earlier asynchronous loads; no RAF, listeners or timers.
export async function applyScenePhotograph(world,sceneId){
 const entry=SCENE_PHOTOGRAPHS[sceneId];if(!entry)return false;
 const state=stateFor(world),generation=++state.generation,scene=world.scene;
 releasePlane(state);
 let texture=state.cache.get(sceneId);
 try{
  if(!texture){texture=await new THREE.TextureLoader().loadAsync(entry.url);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;}
 }catch(error){if(generation===state.generation)world.photographError={sceneId,message:String(error?.message||error)};return false;}
 if(generation!==state.generation||scene!==world.scene){if(![...state.cache.values()].includes(texture))texture.dispose();return false;}
 state.cache.delete(sceneId);state.cache.set(sceneId,texture);world.shared?.add(texture);
 while(state.cache.size>3){const [id,old]=state.cache.entries().next().value;state.cache.delete(id);world.shared?.delete(old);old.dispose();}
 const uniforms={photo:{value:texture},photoAspect:{value:texture.image.width/texture.image.height},viewAspect:{value:1},anchor:{value:new THREE.Vector2(.5,entry.anchorY)},shade:{value:(world.lighting==='dusk'||world.game?.modifier==='dark') ? .22 : .10}};
 // Clip-space quad is always drawn first and NEVER writes depth. Arena geometry,
 // characters, transparent chain effects and HUD retain their normal ordering.
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,transparent:false,toneMapped:false,fog:false,
  vertexShader:'varying vec2 screenUv;void main(){screenUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}',
  fragmentShader:`uniform sampler2D photo;uniform float photoAspect;uniform float viewAspect;uniform vec2 anchor;uniform float shade;varying vec2 screenUv;
   void main(){vec2 crop=vec2(1.0);if(viewAspect>photoAspect)crop.y=photoAspect/viewAspect;else crop.x=viewAspect/photoAspect;
    vec2 uv=screenUv*crop+anchor*(1.0-crop);vec3 color=texture2D(photo,uv).rgb;
    float edge=smoothstep(.28,.75,length((screenUv-.5)*vec2(1.0,.9)));
    float lower=1.0-smoothstep(.0,.48,screenUv.y);
    float shadeAmount=clamp(shade+edge*.30+lower*.18,0.0,.62);
    color*=1.0-shadeAmount;gl_FragColor=vec4(color,1.0);
    #include <colorspace_fragment>
   }`});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);plane.name='Fotografia real · '+sceneId;plane.frustumCulled=false;plane.renderOrder=-100000;plane.userData.photographicBackdrop=true;
 plane.onBeforeRender=renderer=>{renderer.getSize(state.size);uniforms.viewAspect.value=Math.max(.1,state.size.x/Math.max(1,state.size.y));};
 state.plane=plane;hideSyntheticSurroundings(world,state);scene.add(plane);world.photographScene=sceneId;world.photographError=null;return true;
}

// Use on permanent World destruction, not on a round restart. Resources are
// limited to three decoded photographs and one quad in the normal lifetime.
export function disposeScenePhotographs(world){const state=world._scenePhotographs;if(!state)return;state.generation++;releasePlane(state);for(const texture of state.cache.values()){world.shared?.delete(texture);texture.dispose();}state.cache.clear();delete world._scenePhotographs;}

