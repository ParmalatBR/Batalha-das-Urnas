import * as THREE from './vendor/three.module.js';
import {batchStatic} from './visuals.js';
export function campaignEnvironment(w,id){
 if(['congresso','stf','esplanada','planalto'].includes(id))return;
 const old=w.scene.getObjectByName('Brasília — entorno arquitetônico');if(old)w.remove(old);const root=new THREE.Group();root.name='Ambiente '+id;w.scene.add(root);
 const stone={map:w.travertineTexture,bumpMap:w.travertineTexture,bumpScale:.025,roughness:.42},steel={map:w.steelTexture,metalness:.8,roughness:.24},glass={metalness:.68,roughness:.13,envMapIntensity:1.4};
 const box=(x,y,z,a,b,c,color,props={})=>w.box(root,x,y,z,a,b,c,color,props),column=(x,y,z,r,h,c)=>w.cylinder(root,x,y,z,r,r,h,c,12);
 const sign=(text,x,y,z,width=6)=>w.mesh(new THREE.PlaneGeometry(width,.65),new THREE.MeshBasicMaterial({map:w.label(text,'#173948','#eddcb2',768,96)}),root,x,y,z);
 box(0,-.15,-8,24,.2,10,0xd3cbbb,stone);for(const side of [-1,1])box(side*9,-.1,0,1.8,.12,12,0x9bafa5,stone);
 function office(x,z,width,height,color=0xd9e1d9){box(x,height/2,z,width,height,1.5,color,stone);box(x,height/2,z+.8,width-.3,height-.5,.04,0x527f8a,glass);for(let n=-width/2+.35;n<width/2;n+=.65)box(x+n,height/2,z+.9,.09,height,.16,0xe6e9dc,steel);for(let y=.4;y<height;y+=.8)box(x,y,z+.85,width,.06,.1,0xabc0bb,steel);box(x,height+.08,z,width+.4,.16,2,0xf3eddb,stone);}
 function chair(x,z,color){box(x,.12,z,.43,.2,.45,0x80603e,steel);box(x,.43,z-.16,.46,.52,.12,color,{roughness:.64});box(x,.26,z+.02,.46,.1,.46,color,{roughness:.58});}
 function mic(x,z){column(x,.55,z,.03,1.1,0x253541);const m=w.sphere(root,x,.99,z,.08,0x273a49,steel);m.scale.set(1,1.5,1);}
 function camera(x,z){column(x,.55,z,.04,1,0x202b35);box(x,1.12,z,.55,.32,.45,0x1d2a32,steel);const l=column(x,1.12,z+.3,.12,.25,0x3c5864);l.rotation.x=Math.PI/2;for(let d of [-1,1]){const leg=box(x+d*.12,.28,z,.025,.7,.025,0x253849,steel);leg.rotation.z=d*.28;}}
 if(id==='camara'||id==='senado'){
  const green=id==='camara'?0x3d7960:0x375b91;for(let tier=0;tier<3;tier++){box(0,tier*.18,-7.3-tier*1.2,17,.2,1.05,0xb4a386,stone);for(let j=-7;j<=7;j++){const z=-7.2-tier*1.2-Math.abs(j)*.035;chair(j,z,green);}}
  office(0,-12,19,3.2,0xd2c09f);box(0,.7,-6.55,3,1.3,.7,0x8d603b,{map:w.woodTexture,roughness:.4});for(const x of [-.8,.8])mic(x,-6.3);sign(id==='camara'?'CÂMARA DOS DEPUTADOS':'SENADO FEDERAL',0,2.1,-11.05,8);
 }else if(id==='debate'){
  box(0,1.6,-10,23,3.5,.45,0x101e35,{metalness:.3,roughness:.4});for(const side of [-1,1]){box(side*6,1.5,-9.65,6,2.5,.1,side<0?0x823d48:0x29547f,{emissive:side<0?0x70172a:0x164d8c,emissiveIntensity:.22});box(side*6,.65,-7.2,1.2,1.3,.7,0xd9dde0,steel);mic(side*6,-6.9);camera(side*9,4);}
  sign('O DEBATE SAIU DO CONTROLE',0,1.7,-9.68,9);for(let x=-9;x<=9;x+=3){column(x,3.8,-8,.12,.3,0xffedce);const light=new THREE.SpotLight(0xd7ecff,5,25,.6,.5);light.position.set(x,5,-8);light.target.position.set(x*.5,0,0);root.add(light,light.target);}box(0,4,-8,21,.12,.12,0x8c9da8,steel);
 }else if(id==='pgr'){
  for(const side of [-1,1]){const g=w.cylinder(root,side*5,1.4,-9.4,3.0,3.0,2.8,0x578387,48);g.material=w.material(0x628d94,glass);for(let y of [.2,1.1,2,2.85]){const m=w.mesh(new THREE.TorusGeometry(3.08,.09,6,48),w.material(0xe1e4d8,stone),root,side*5,y,-9.4);m.rotation.x=Math.PI/2;}for(let n=0;n<20;n++){const a=n*Math.PI/10;column(side*5+Math.cos(a)*3.08,1.4,-9.4+Math.sin(a)*3.08,.04,2.9,0xbad2ce);}}
  box(0,1.6,-9,5,.25,1,0xe9e7d8,stone);sign('PROCURADORIA-GERAL DA REPÚBLICA',0,2.2,-6.3,8);
 }else if(id==='praca'){
  box(0,-.02,-8,22,.16,8,0xded9c8,stone);for(let x=-10;x<11;x+=2)box(x,.08,-8,.02,.01,8,0x8d8b7c);for(const side of [-1,1]){box(side*2,1.7,-9,.35,3.4,.24,0x524835,{metalness:.8,roughness:.5});w.sphere(root,side*2,3.65,-9,.23,0x71604b,{metalness:.7,roughness:.5});const arm=box(side*1.4,2.2,-9,1.5,.15,.15,0x635139,steel);arm.rotation.z=side*.2;}sign('PRAÇA DOS TRÊS PODERES',0,.5,-6.7,7);
 }else{
  const isPF=id==='pf',title={pf:'POLÍCIA FEDERAL',stj:'SUPERIOR TRIBUNAL DE JUSTIÇA',tse:'TRIBUNAL SUPERIOR ELEITORAL'}[id];
  if(id==='stj'){for(let x=-9;x<=9;x+=3.6)office(x,-10,3.2,3.6,0xcfd0bd);for(let x=-9;x<=9;x+=1.5)column(x,1.7,-7.4,.18,3.4,0xe8dfc6);}
  else{office(-5,-10,7,3.1,isPF?0x607582:0xe2e8df);office(5,-10,7,3.1,isPF?0x607582:0xe2e8df);box(0,2.1,-9,4.5,.35,2,0xe5e1cf,stone);}
  sign(title||id.toUpperCase(),0,2.75,-8.4,8);if(isPF){box(0,1.8,-8.1,3.8,.15,.08,0xd6ad39,steel);for(const side of [-1,1])for(const z of [-5,0,5]){const cone=w.mesh(new THREE.ConeGeometry(.22,.65,12),w.material(0xe19a29,{roughness:.6}),root,side*8.8,.32,z);box(side*8.8,.03,z,.5,.05,.5,0x33434d);}}
  if(id==='tse')for(const side of [-1,1]){box(side*8.5,.55,-2,1.1,1.1,.8,0xe6e4d2,stone);box(side*8.5,.95,-1.57,.8,.4,.02,0x538173,{emissive:0x4d806c,emissiveIntensity:.4});}
 }
 batchStatic(root);return root;
}
