import {fitMobileArena} from './mobile-arena.js';
import {cuffModel,createChains,animateChains,cuffBurst} from './cuffs-v10.js';
import {ActorFX} from './actor-fx.js';
import * as THREE from './vendor/three.module.js';
import {World as BaseWorld} from './render3d.js';
import {texture,fireMaterial,Cinema,batchStatic,batchDestructibles} from './visuals.js';
import {buildEnvironment} from './environment.js';
import {pickupObject} from './pickups.js';
import {decorateArena,STAGE_THEMES,floorColor} from './stage-kit.js';
import {createFlame,animateFlame} from './fire-v4.js';
import {iconCanvas} from './content.js';
const team=[0xff3028,0x029cff],gold=0xd6a947;

export class World extends BaseWorld {
 constructor(container){super(container);this.camera=new THREE.PerspectiveCamera(27,1,.1,180);this.renderer.toneMappingExposure=.96;this.cinema=new Cinema(this.renderer);this.fx=[];this.flashes=[];this.fireScale=1;this.shared=new Set(Object.values(this.iconTextures));this.resize();}
 async load(){await super.load();this.miniURLs={};for(let [type] of Arena.POWER)this.miniURLs[type]=iconCanvas(type,160,true).toDataURL();let powers=new Image();powers.src='assets/poderes-atlas-v3.png';await powers.decode();
  Arena.POWER.forEach(([type],i)=>{let c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(powers,i%5*powers.width/5,Math.floor(i/5)*powers.height/2,powers.width/5,powers.height/2,0,0,256,256);this.iconTextures[type].dispose();this.iconTextures[type]=new THREE.CanvasTexture(c);this.iconTextures[type].colorSpace=THREE.SRGBColorSpace;this.iconURLs[type]=c.toDataURL();this.shared.add(this.iconTextures[type]);});
  for(let k of ['stone','wood','paper','glow','smoke','shadow']){this[k+'Texture']=texture(k);this.shared.add(this[k+'Texture']);}
  let surfaces=new Image();surfaces.src='assets/materiais-v3.png';await surfaces.decode();
  ['stone','wood','metal','asphalt'].forEach((kind,i)=>{let c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(surfaces,i%2*surfaces.width/2,Math.floor(i/2)*surfaces.height/2,surfaces.width/2,surfaces.height/2,0,0,512,512);if(this[kind+'Texture']){this.shared.delete(this[kind+'Texture']);this[kind+'Texture'].dispose();}let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;this[kind+'Texture']=tex;this.shared.add(tex);});this.stone=this.stoneTexture;this.marble=this.stone;
  let detail=new Image();detail.src='assets/superficies-v4.png';await detail.decode();
  ['clay','steel','travertine','granite'].forEach((kind,i)=>{let c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(detail,i%2*detail.width/2,Math.floor(i/2)*detail.height/2,detail.width/2,detail.height/2,0,0,512,512);if(kind==='travertine'){let g=c.getContext('2d');g.fillStyle='rgba(255,255,252,.48)';g.fillRect(0,0,512,512);}let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;this[kind+'Texture']=tex;this.shared.add(tex);});
  let panorama=texture('environment',1024);panorama.mapping=THREE.EquirectangularReflectionMapping;let pmrem=new THREE.PMREMGenerator(this.renderer);this.env=pmrem.fromEquirectangular(panorama).texture;this.shared.add(this.env);panorama.dispose();pmrem.dispose();
 }
 resize(){if(!this.camera?.isPerspectiveCamera)return super.resize();let w=this.mobileArena?this.container.clientWidth:innerWidth,h=this.mobileArena?this.container.clientHeight:innerHeight;w=w||innerWidth;h=h||innerHeight;this.renderer.setSize(w,h);this.cinema?.resize(w,h);if(this.mobileArena&&this.focusArena&&w>h){fitMobileArena(this.camera,w,h);return;}this.camera.clearViewOffset();this.camera.aspect=w/h;this.camera.fov=this.focusArena?23.5:27;let scale=Math.max(1,1.62/(w/h));this.camera.position.set(0,(this.focusArena?26:27)*scale,18*scale);this.camera.lookAt(0,0,this.focusArena?.25:-1.5);this.camera.updateProjectionMatrix();}
 material(c,extra={}){return new THREE.MeshStandardMaterial({color:c,roughness:.52,envMapIntensity:.75,...extra});}
 architecture(){} decor(){}
 roundBox(p,x,y,z,w,h,d,c,r=.04,extra={}){let s=new THREE.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);let geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-r*2),bevelEnabled:true,bevelSize:r*.5,bevelThickness:r,bevelSegments:2,steps:1,curveSegments:3});geo.translate(0,0,-d/2+r);return this.mesh(geo,this.material(c,extra),p,x,y,z);}
 glow(parent,x,y,z,size,color,opacity=.4){let m=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTexture,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(x,y,z);m.scale.setScalar(size);parent.add(m);return m;}
 release(){if(!this.scene)return;const geo=new Set(),mat=new Set(),tex=new Set();this.scene.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.isLight&&o.shadow?.map)o.shadow.map.dispose();for(let a of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){mat.add(a);if(a.map&&!this.shared?.has(a.map))tex.add(a.map);}});geo.forEach(x=>x.dispose());mat.forEach(x=>x.dispose());tex.forEach(x=>x.dispose());}
 build(game,stage){
  this.actorFX=null;this.stage=stage;this.crateCount=0;super.build(game,stage);
  // Reuse the tested actor machinery, replace every old static environment mesh.
  let keep=new Set([...this.blocks.values(),...this.itemMeshes.values(),...this.characters.flatMap(v=>[v.sprite,v.ring,v.shadow,v.shield])]);
  for(let child of [...this.scene.children])if(!keep.has(child))this.remove(child);
  this.scene.background=new THREE.Color([0x457c9d,0x4a718b,0x5c91ae,0x526d8e][stage]);this.scene.fog=new THREE.Fog(this.scene.background,45,110);this.scene.environment=this.env;
  this.scene.add(new THREE.HemisphereLight([0xc5d8f2,0xd9e3ec,0xbfe2ff,0xffdab8][stage],0x485747,.65));let sun=new THREE.DirectionalLight([0xffcf95,0xffedcc,0xffefd2,0xffbd78][stage],2.7);sun.position.set(...[[-14,18,8],[-9,24,5],[-10,23,-2],[-18,14,7]][stage]);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:23,bottom:-17,near:1,far:70});sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;sun.shadow.radius=4;this.scene.add(sun);this.scene.add(sun.target);let fill=new THREE.DirectionalLight(0x72c8ff,.85);fill.position.set(10,10,-8);this.scene.add(fill);
  this.fx=[];this.flashes=[];this.scorch=[];this.waters=[];this.flags=[];
  this.box(this.scene,0,-.55,-8,150,.3,120,0x264c43,{roughness:1});
  this.roundBox(this.scene,0,-.22,0,16.7,.4,12.7,0x183e4e,.06,{map:this.stone,roughness:.36,metalness:.12});
  this.box(this.scene,0,-.025,0,16.45,.13,12.45,gold,{metalness:.7,roughness:.27});
  this.box(this.scene,0,.06,0,16.25,.12,12.25,0xd6e0d7,{map:this.stone,bumpMap:this.stone,bumpScale:.045,roughness:.34});
  for(let side of [-1,1]){this.box(this.scene,side*8.2,.04,0,.10,.04,12.5,0x1af6ca,{emissive:0x04b3a0,emissiveIntensity:1});this.box(this.scene,0,.04,side*6.2,16.5,.04,.10,0xd9b45e,{emissive:0x705327,emissiveIntensity:.5});}
  const theme=STAGE_THEMES[stage];
  const mats=theme.floorColors.map(c=>this.material(c,{map:this.stone,bumpMap:this.stone,bumpScale:.018,roughness:theme.roughness??.6}));let geo=new THREE.BoxGeometry(.985,.08,.985);
  for(let y=0;y<Arena.H;y++)for(let x=0;x<Arena.W;x++){let xx=x-7,z=y-5;this.mesh(geo,mats[floorColor(stage,x,y)],this.scene,xx,.145,z);
   if(game.cell(x,y)===1){let edge=x===0||y===0||x===14||y===10,g=new THREE.Group();g.position.set(xx,.18,z);this.scene.add(g);
    if(edge){this.roundBox(g,0,.10,0,.96,.20,.96,theme.frame,.03,{metalness:.65,roughness:.34});this.box(g,0,.207,0,.93,.014,.93,theme.trim,{metalness:.7,roughness:.34});continue;}
    this.roundBox(g,0,.29,0,.85,.58,.85,0xb2c2cc,.065,{map:this.steelTexture,bumpMap:this.steelTexture,bumpScale:.035,metalness:.85,roughness:.32});
    this.roundBox(g,0,.59,0,.91,.07,.91,0xe2eaec,.035,{map:this.steelTexture,bumpMap:this.steelTexture,bumpScale:.028,metalness:.88,roughness:.24});
    this.roundBox(g,0,.635,0,.65,.025,.65,0x8296a5,.022,{map:this.steelTexture,bumpMap:this.steelTexture,bumpScale:.025,metalness:.82,roughness:.28});
    for(let a of [-1,1]){let brace=this.box(g,0,.658,0,.57,.018,.055,0x91a7b4,{metalness:.86,roughness:.3});brace.rotation.y=a*Math.PI/4;}
    for(let a of [-1,1])for(let b of [-1,1])this.cylinder(g,a*.35,.643,b*.35,.035,.035,.014,0xe5e9e8,6);
    for(let side of [-1,1]){this.box(g,side*.433,.29,0,.017,.37,.60,0x344653,{metalness:.8,roughness:.28});this.box(g,0,.29,side*.433,.60,.37,.017,0x344653,{metalness:.8,roughness:.28});for(let y of [.20,.30,.40]){this.box(g,side*.446,y,0,.012,.018,.43,0x151f26);this.box(g,0,y,side*.446,.43,.018,.012,0x151f26);}}
    for(let z of [-.36,.36])this.box(g,0,.653,z,.36,.012,.055,0xeac252,{metalness:.3,roughness:.48});
   }
  }
  decorateArena(this,stage);batchStatic(this.scene,keep);batchDestructibles(this.scene,this.blocks);buildEnvironment(this,stage);this.applyLighting();this.actorFX=new ActorFX(this);for(const v of this.characters){v.shadow.geometry.dispose();v.shadow.geometry=new THREE.PlaneGeometry(.92,.68);v.shadow.material.map=this.shadowTexture;v.shadow.material.color.set(0x08121b);v.shadow.material.opacity=.55;v.shadow.material.needsUpdate=true;}this.resize();this.update(0,game,0);
 }
 applyLighting(){
  if(this.lighting!=='dusk')return;
  this.scene.background.set(0x6e657e);this.scene.fog.color.set(0x6e657e);
  this.scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0x98b6ed);o.intensity=.85;}if(o.isDirectionalLight){if(o.castShadow){o.color.set(0xffac65);o.intensity=2.1;o.position.set(-20,12,10);}else {o.color.set(0x89baff);o.intensity=.75;}}});
  for(const side of [-1,1])for(const z of [-5,1,6]){const light=new THREE.PointLight(0xffbd73,3,6,2);light.position.set(side*8.5,1.9,z);this.scene.add(light);this.glow(this.scene,side*8.5,1.8,z,.6,0xffc778,.6);}
 }
 collect(p){for(let i=0;i<(this.reduced?4:16);i++){let a=i*Math.PI/8;this.particle(p.px-7,.5,p.py-5,[Math.cos(a)*1.2,1.5+Math.random(),Math.sin(a)*1.2],.7,0xffd872,.035);}}
 ballotBox(){let g=new THREE.Group();this.crateCount=(this.crateCount||0)+1;
  const colors=[0xffffff,0xf2dfd1,0xd1bbae,0xfce7d4];
  this.box(g,0,.28,0,.78,.54,.78,0xb9a991,{roughness:1});
  for(let row=0;row<3;row++){let segments=row===1?[[-.31,.188],[0,.398],[.31,.188]]:[[-.206,.398],[.206,.398]];for(let col=0;col<segments.length;col++)for(let side=0;side<2;side++){
   let [x,width]=segments[col];this.roundBox(g,x,.097+row*.19,side*.412-.206,width,.176,.398,colors[(row+col+side+this.crateCount)%4],.018,{map:this.clayTexture,bumpMap:this.clayTexture,bumpScale:.085,roughness:.93});
  }}
  // Exposed perforations on the top course communicate hollow, breakable clay.
  for(let x of [-.27,0,.27])for(let z of [-.25,.25]){this.box(g,x,.588,z,.10,.007,.14,0x642e22,{roughness:1});this.box(g,x,.59,z+.072,.11,.012,.022,0xe49261,{roughness:1});}
  return g;
 }
 bombModel(b){return cuffModel(this,b);}
 legacyBombModel(b){let g=new THREE.Group(),red=b.owner===0;let enamel=new THREE.MeshPhysicalMaterial({color:red?0xe71523:0x0368dc,roughness:.20,metalness:.55,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.7});
  if(red){let s=new THREE.Shape();for(let i=0;i<10;i++){let a=Math.PI/2+i*Math.PI/5,r=i%2?.25:.49;if(!i)s.moveTo(Math.cos(a)*r,Math.sin(a)*r);else s.lineTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();this.mesh(new THREE.ExtrudeGeometry(s,{depth:.30,bevelEnabled:true,bevelSize:.055,bevelThickness:.06,bevelSegments:4,steps:1}),enamel,g,0,.55,-.18);}else{this.mesh(new THREE.SphereGeometry(.43,36,24),enamel,g,0,.48,0);let stripe=this.mesh(new THREE.TorusGeometry(.423,.036,10,48),this.material(0x6af573,{metalness:.7,roughness:.2}),g,0,.48,0);stripe.rotation.x=Math.PI/2;}
  let badge=this.mesh(new THREE.CircleGeometry(.145,32),new THREE.MeshBasicMaterial({map:this.label(red?'PT':'PL',red?'#c61124':'#0049ac','#fffbd9',160,160)}),g,0,.55,red?.21:.432);badge.rotation.x=-.08;
  this.cylinder(g,0,.98,0,.10,.13,.16,0x343b3c,16);for(let y of [.95,.99,1.03])this.cylinder(g,0,y,0,.115,.115,.019,gold,20);
  let curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.04,0),new THREE.Vector3(.01,1.2,0),new THREE.Vector3(.13,1.30,0),new THREE.Vector3(.22,1.27,0)]);this.mesh(new THREE.TubeGeometry(curve,16,.025,8,false),this.material(0xc69f5e,{map:this.woodTexture}),g);
  this.glow(g,.22,1.27,0,.7,0xffb633,.9);g.userData.spark=this.sphere(g,.22,1.27,0,.045,0xfff2b0,{emissive:0xffab20,emissiveIntensity:5});
  let pool=this.mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:this.glowTexture,color:team[b.owner%2],transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}),g,0,.025,0);pool.rotation.x=-Math.PI/2;g.userData.nextSpark=0;
  const fuse=this.mesh(new THREE.RingGeometry(.48,.54,64),new THREE.MeshBasicMaterial({color:0xffdc8d,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false}),g,0,.032,0);fuse.rotation.x=-Math.PI/2;g.userData.fuse=fuse;
  return g;
 }
 powerModel(type){let g=new THREE.Group(),index=Arena.POWER.findIndex(a=>a[0]===type),tint=[0xffb521,0x399bff,0x72ff96,0xff8051,0xeaaaef,0x40dbff,0xff4740,0xffd04d,0xb57aff,0x50e6c1][index];
  this.cylinder(g,0,.08,0,.32,.37,.15,gold,6);this.cylinder(g,0,.17,0,.29,.32,.08,0x183542,6);let hoop=this.mesh(new THREE.TorusGeometry(.34,.021,8,36),this.material(tint,{emissive:tint,emissiveIntensity:1.8,metalness:.3}),g,0,.23,0);hoop.rotation.x=-Math.PI/2;
  let icon=pickupObject(this,type);icon.scale.setScalar(1.25);icon.position.y=.8;g.add(icon);g.userData.icon=icon;this.glow(g,0,.38,0,1.25,tint,.18);return g;
 }
 particle(x,y,z,v,life,color,size=.045,kind='spark'){if(this.fx.length>300)return;let m;
  if(kind==='smoke'){m=new THREE.Sprite(new THREE.SpriteMaterial({map:this.smokeTexture,color,transparent:true,opacity:.28,depthWrite:false}));m.scale.setScalar(size);m.material.rotation=Math.random()*6;this.scene.add(m);}else if(kind==='brick'){m=this.box(this.scene,0,0,0,size,size*.6,size*.8,color,{roughness:.94});}else if(kind==='paper'){m=this.box(this.scene,0,0,0,size,.012,size*1.4,color,{side:THREE.DoubleSide});}else m=this.mesh(new THREE.IcosahedronGeometry(size,0),new THREE.MeshBasicMaterial({color}),this.scene);
  m.castShadow=false;m.position.set(x,y,z);this.fx.push({m,v:new THREE.Vector3(...v),life,total:life,size,kind});
 }
 burst(b){return cuffBurst(this,b);}
 legacyBurst(b){let x=b.x-7,z=b.y-5;this.shake=this.reduced?0:.13;
  for(let i=0;i<(this.reduced?6:32);i++){let a=Math.random()*Math.PI*2,s=1+Math.random()*4;this.particle(x,.7,z,[Math.cos(a)*s,1+Math.random()*5,Math.sin(a)*s],.35+Math.random()*.55,i%3?team[b.owner%2]:0xfff7c0,.018+Math.random()*.035);}
  for(let i=0;i<5;i++)this.particle(x+(Math.random()-.5)*.5,.8,z+(Math.random()-.5)*.5,[(Math.random()-.5)*.4,.8+Math.random(),(Math.random()-.5)*.4],1.6,0x3a4651,.65,'smoke');
  let ring=this.mesh(new THREE.RingGeometry(.32,.38,64),new THREE.MeshBasicMaterial({color:team[b.owner%2],transparent:true,opacity:.7,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}),this.scene,x,.23,z);ring.rotation.x=-Math.PI/2;this.rings.push({m:ring,life:.4});
  let flash=new THREE.PointLight(b.owner?0x20bfff:0xff5220,9,5,2);flash.position.set(x,1.3,z);this.scene.add(flash);this.flashes.push({m:flash,life:.45});
  let mark=this.mesh(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:this.shadowTexture,color:0x382d28,transparent:true,opacity:.43,depthWrite:false}),this.scene,x,.198,z);mark.rotation.x=-Math.PI/2;this.scorch.push(mark);if(this.scorch.length>35)this.remove(this.scorch.shift());
 }
 debris(x,y){for(let i=0;i<(this.reduced?3:10);i++)this.particle(x-7,.65,y-5,[(Math.random()-.5)*4,1.5+Math.random()*3,(Math.random()-.5)*4],.8+Math.random()*.4,[0xb85230,0xcd683f,0xa4422a,0xdb7548][i%4],.09+Math.random()*.09,'brick');}
 victory(p){for(let i=0;i<(this.reduced?8:65);i++){let a=Math.random()*Math.PI*2;this.particle(p.px-7,1.9,p.py-5,[Math.cos(a)*(1+Math.random()*3),3+Math.random()*4,Math.sin(a)*(1+Math.random()*3)],1.5+Math.random()*1.1,[team[p.id%2],0xffd268,0xfff3cb][i%3],.045+Math.random()*.025,'paper');}}
 beforeRender(dt,game,t){this.actorFX?.update(dt,game,t);}
 impact(data){this.actorFX?.hit(data);if(data.shielded){for(let i=0;i<18;i++){let a=i*Math.PI/9;this.particle(data.x-7,1,data.y-5,[Math.cos(a)*2.2,1+Math.random()*2,Math.sin(a)*2.2],.65,0x7defff,.065,'paper');}}this.hit[data.victim]=.5;for(let i=0;i<14;i++){let a=i*Math.PI/7;this.particle(data.x-7,1.1,data.y-5,[Math.cos(a)*2,2+Math.random()*2,Math.sin(a)*2],.6,data.shielded?0x84f9ff:0xfff0a6,.05);}if(!this.reduced)this.shake=.16;}
 label(...args){this.labelCache??=new Map();let key=JSON.stringify(args);if(!this.labelCache.has(key)){let tex=super.label(...args);this.labelCache.set(key,tex);this.shared?.add(tex);}return this.labelCache.get(key);}
 remove(o){if(!o)return;if(o.userData.instances)for(let ref of o.userData.instances){ref.mesh.setMatrixAt(ref.index,new THREE.Matrix4().makeScale(0,0,0));ref.mesh.instanceMatrix.needsUpdate=true;}o.parent?.remove(o);o.traverse(n=>{n.geometry?.dispose();if(n.isLight&&n.shadow?.map)n.shadow.map.dispose();for(let m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){if(m.map&&!this.shared?.has(m.map))m.map.dispose();m.dispose();}});}
 project(x,y,z){let v=new THREE.Vector3(x,y,z).project(this.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-.5*v.y+.5)*innerHeight};}
 update(dt,game,t){
  if(!this.scene)return;
  for(let i of game.items)if(!this.itemMeshes.has(i)){let m=this.powerModel(i.type);this.scene.add(m);this.itemMeshes.set(i,m);}
  for(let f of game.fire){let m=this.fireMeshes.get(f);if(!m){m=createChains(f);this.scene.add(m);this.fireMeshes.set(f,m);}animateChains(m,t,f.t,this.reduced);}
  for(let b of game.bombs){let m=this.bombMeshes.get(b);if(m?.userData.fuse){const f=m.userData.fuse;f.geometry.setDrawRange(0,Math.max(0,Math.ceil(Math.min(1,b.t/(b.duration||(b.remote?5:2.35)))*48))*6);f.material.color.set(b.t<.7?0xff6640:0xffdc8d);f.material.opacity=b.t<.7?.7+Math.sin(t*14)*.2:.92;}if(m&&!this.reduced&&t>m.userData.nextSpark){m.userData.nextSpark=t+.08;this.particle(b.x-6.78,1.48,b.y-5,[(Math.random()-.5)*1.2,.7+Math.random(),(Math.random()-.5)*1.2],.25,0xffd867,.018);}}
  for(let f of this.fx){f.life-=dt;if(f.kind!=='smoke')f.v.y-=dt*6;f.m.position.addScaledVector(f.v,dt);if(f.kind==='smoke'){f.m.scale.setScalar(f.size+(f.total-f.life)*1.1);f.m.material.opacity=Math.max(0,f.life/f.total)*.28;f.m.material.rotation+=dt*.12;}else{f.m.rotation.x+=dt*5;f.m.rotation.z+=dt*3;f.m.scale.setScalar(Math.max(.01,f.life/f.total));}}
  for(let f of this.fx.filter(f=>f.life<=0))this.remove(f.m);this.fx=this.fx.filter(f=>f.life>0);
  for(let f of this.flashes){f.life-=dt;f.m.intensity=Math.max(0,f.life)*20;}for(let f of this.flashes.filter(f=>f.life<=0))this.scene.remove(f.m);this.flashes=this.flashes.filter(f=>f.life>0);
  for(let mat of this.waters||[])if(mat.uniforms?.time)mat.uniforms.time.value=t;
  super.update(dt,game,t);
 }
}
