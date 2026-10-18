import * as THREE from './vendor/three.module.js';

export function texture(kind,size=512){
 const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
 let seed=37;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(kind==='glow'||kind==='smoke'||kind==='shadow'){
  let grad=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  if(kind==='glow'){grad.addColorStop(0,'#ffffffff');grad.addColorStop(.12,'#ffffffb0');grad.addColorStop(.36,'#ffffff35');grad.addColorStop(1,'#ffffff00');}
  else {grad.addColorStop(0,kind==='shadow'?'#000000a0':'#ffffffc0');grad.addColorStop(.5,kind==='shadow'?'#00000040':'#ffffff70');grad.addColorStop(1,'#ffffff00');}
  g.fillStyle=grad;g.fillRect(0,0,size,size);
 }else if(kind==='environment'){
  let grad=g.createLinearGradient(0,0,0,size);grad.addColorStop(0,'#568fc2');grad.addColorStop(.42,'#c3e9fa');grad.addColorStop(.50,'#ffdeae');grad.addColorStop(.57,'#51665f');grad.addColorStop(1,'#273b46');g.fillStyle=grad;g.fillRect(0,0,size,size);g.fillStyle='#ffebcd';g.fillRect(size*.12,size*.23,size*.09,size*.17);g.fillStyle='#e6f6ff';g.fillRect(size*.7,size*.2,size*.17,size*.11);
 }else{
  const base=kind==='wood'?[132,81,42]:kind==='stone'?[215,217,208]:kind==='paper'?[230,216,181]:[89,121,129];
  const img=g.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let i=(y*size+x)*4;let vein=Math.sin(x*.02+Math.sin(y*.012)*6+Math.sin(y*.043)*2);let noise=(rnd()-.5)*(kind==='paper'?8:20)+(kind==='wood'?Math.sin(x*.11+Math.sin(y*.009)*2)*18:kind==='stone'&&vein>.88?-22:0);for(let k=0;k<3;k++)img.data[i+k]=base[k]+noise;img.data[i+3]=255;}g.putImageData(img,0,0);
  if(kind==='stone'){for(let i=0;i<35;i++){g.strokeStyle='#fafaf61c';g.lineWidth=.5+rnd()*2;g.beginPath();g.moveTo(rnd()*size,0);for(let y=0;y<size;y+=20)g.lineTo(size*.5+Math.sin(y*.012+i)*size*.5,y);g.stroke();}}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
}

export function batchDestructibles(root,blocks){
 root.updateMatrixWorld(true);let groups=new Map();
 for(let block of blocks.values())block.traverse(m=>{if(!m.isMesh)return;let g=m.geometry,a=m.material;g.computeBoundingBox();let key=[g.type,g.attributes.position.count,g.boundingBox.min.toArray(),g.boundingBox.max.toArray(),a.color?.getHex(),a.roughness,a.metalness,a.map?.uuid,a.side].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push({m,block});});
 for(let arr of groups.values()){if(arr.length<2)continue;let first=arr[0].m,inst=new THREE.InstancedMesh(first.geometry,first.material,arr.length);inst.castShadow=inst.receiveShadow=true;arr.forEach(({m,block},i)=>{inst.setMatrixAt(i,m.matrixWorld);(block.userData.instances??=[]).push({mesh:inst,index:i});m.parent.remove(m);if(m.geometry!==first.geometry)m.geometry.dispose();if(m.material!==first.material)m.material.dispose();});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();root.add(inst);}
}

export function batchStatic(root,exclude=new Set()){
 root.updateMatrixWorld(true);const groups=new Map();
 function walk(o){if(exclude.has(o))return;if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&!o.material.isShaderMaterial){
  const g=o.geometry,m=o.material,p=g.attributes.position;if(!p)return;g.computeBoundingBox();let box=g.boundingBox;let key=[g.type,p.count,box.min.toArray().join(','),box.max.toArray().join(','),m.color?.getHex(),m.roughness,m.metalness,m.emissive?.getHex(),m.emissiveIntensity,m.map?.uuid,m.bumpMap?.uuid,m.bumpScale,m.transparent,m.opacity,m.side].join('|');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 }for(const child of o.children)walk(child);}
 for(const child of [...root.children])walk(child);
 for(const arr of groups.values()){if(arr.length<3)continue;let inst=new THREE.InstancedMesh(arr[0].geometry,arr[0].material,arr.length);inst.castShadow=arr[0].castShadow;inst.receiveShadow=true;arr.forEach((m,i)=>{inst.setMatrixAt(i,m.matrixWorld);m.parent.remove(m);if(m.geometry!==arr[0].geometry)m.geometry.dispose();if(m.material!==arr[0].material)m.material.dispose();});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();root.add(inst);}
}

export function fireMaterial(owner,seed=0){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,
 uniforms:{time:{value:0},age:{value:1},seed:{value:seed},blue:{value:owner}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform float time,age,seed,blue;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float a=.5,n=0.;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.03+7.13;a*=.5;}return n;}
 void main(){vec2 p=vUv;float t=time*3.+seed;float n=fbm(vec2(p.x*5.+seed,p.y*4.-t));float curl=fbm(vec2(p.x*9.+n,p.y*6.-t*1.3));float width=(1.-p.y)*.43+.045;
 float shape=1.-abs(p.x-.5+(n-.5)*.22)/width;float flame=shape+(n-.5)*.7-curl*.20;
 float alpha=smoothstep(.0,.25,flame)*smoothstep(1.,.86,p.y)*smoothstep(0.,.035,p.y)*age;
 if(alpha<.04)discard;float hot=clamp((1.-p.y)*.72+flame*.36,0.,1.);
 vec3 red=mix(vec3(1.5,.008,.002),vec3(3.,.30,.018),hot);red=mix(red,vec3(4.,1.7,.15),pow(hot,3.));
 vec3 cyan=mix(vec3(.002,.015,1.5),vec3(.005,.16,2.8),hot);cyan=mix(cyan,vec3(.015,.75,3.),pow(hot,3.));
 gl_FragColor=vec4(mix(red,cyan,blue),alpha*.98);
 }`});
}

// Lightweight HDR bloom: render, threshold, two separable blur passes, then tone-map once.
export class Cinema {
 constructor(renderer){
  this.r=renderer;this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));this.quad.frustumCulled=false;this.scene.add(this.quad);
  const target=()=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  this.main=target();this.main.depthBuffer=true;this.main.samples=4;this.a=target();this.b=target();
  const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  this.blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tex:{value:null},direction:{value:new THREE.Vector2()},threshold:{value:0}},vertexShader,fragmentShader:`varying vec2 vUv;uniform sampler2D tex;uniform vec2 direction;uniform float threshold;
   vec3 sampleAt(vec2 uv){vec3 c=texture2D(tex,uv).rgb;return c*max(0.,max(max(c.r,c.g),c.b)-threshold)/max(.0001,max(max(c.r,c.g),c.b));}
   void main(){vec3 c=sampleAt(vUv)*.227027;c+=(sampleAt(vUv+direction*1.384615)+sampleAt(vUv-direction*1.384615))*.316216;c+=(sampleAt(vUv+direction*3.230769)+sampleAt(vUv-direction*3.230769))*.07027;gl_FragColor=vec4(c,1.);}`});
  this.combine=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tex:{value:this.main.texture},glow:{value:this.a.texture}},vertexShader,fragmentShader:`varying vec2 vUv;uniform sampler2D tex,glow;void main(){vec3 c=texture2D(tex,vUv).rgb+texture2D(glow,vUv).rgb*.22;float vignette=1.-.14*pow(length((vUv-.5)*1.3),2.);gl_FragColor=vec4(c*vignette,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 }
 resize(w,h){const scale=this.r.getPixelRatio();this.main.setSize(w*scale,h*scale);this.a.setSize(Math.max(1,w*.45),Math.max(1,h*.45));this.b.setSize(this.a.width,this.a.height);}
 render(scene,camera){const r=this.r;r.info.autoReset=false;r.info.reset();r.setRenderTarget(this.main);r.render(scene,camera);this.quad.material=this.blur;this.blur.uniforms.tex.value=this.main.texture;this.blur.uniforms.threshold.value=1.15;this.blur.uniforms.direction.value.set(1.7/this.a.width,0);r.setRenderTarget(this.b);r.render(this.scene,this.camera);this.blur.uniforms.tex.value=this.b.texture;this.blur.uniforms.threshold.value=0;this.blur.uniforms.direction.value.set(0,1.7/this.a.height);r.setRenderTarget(this.a);r.render(this.scene,this.camera);this.quad.material=this.combine;r.setRenderTarget(null);r.render(this.scene,this.camera);}
}
