import * as THREE from './vendor/three.module.js';
import {batchStatic} from './visuals.js';
// Original models informed by institutional photographs; see POLIMENTO.md for sources.
export function polishEnvironment(w,id){
 const original=['congresso','stf','planalto','esplanada'].includes(id);
 if(!original){const old=w.scene.getObjectByName('Ambiente '+id);if(old)w.remove(old);}
 const root=new THREE.Group();root.name='Materiais e arquitetura · '+id;w.scene.add(root);
 const stone={map:w.travertineTexture,bumpMap:w.travertineTexture,bumpScale:.016,roughness:.56},granite={map:w.graniteTexture,bumpMap:w.graniteTexture,bumpScale:.022,roughness:.64},wood={map:w.woodTexture,bumpMap:w.woodTexture,bumpScale:.009,roughness:.43},metal={map:w.steelTexture,metalness:.78,roughness:.29},glass={metalness:.62,roughness:.17,envMapIntensity:1.6};
 const box=(x,y,z,a,b,c,color,props=stone,parent=root)=>w.box(parent,x,y,z,a,b,c,color,props);
 const cyl=(x,y,z,rt,rb,height,color,props=stone,n=20,parent=root)=>w.mesh(new THREE.CylinderGeometry(rt,rb,height,n),w.material(color,props),parent,x,y,z);
 const sphere=(x,y,z,r,color,props=stone)=>w.sphere(root,x,y,z,r,color,props);
 const sign=(text,x,y,z,width=5)=>w.mesh(new THREE.PlaneGeometry(width,.38),new THREE.MeshBasicMaterial({map:w.label(text,'#172c37','#e8d5a7',768,96)}),root,x,y,z);
 function tree(x,z,scale=1){cyl(x,.6*scale,z,.07*scale,.12*scale,1.2*scale,0x775f42,wood,8);for(let i=0;i<3;i++){const m=sphere(x+(i-1)*.22*scale,(1.3+i*.12)*scale,z+Math.sin(i)*.15,scale*.55,i%2?0x51744a:0x698455,{roughness:.91});m.scale.y=.8;}}
 function planter(x,z){box(x,.22,z,1.1,.35,.85,0xcac4b2,stone);box(x,.405,z,.94,.045,.69,0x485042,granite);for(let i=0;i<5;i++){const m=sphere(x+(i%3-1)*.22,.52,z+(i%2-.5)*.22,.22,i%2?0x657d46:0x87955b,{roughness:.95});m.scale.y=.65;}}
 function paving(x,z,width,depth,color=0xbfc2b3){box(x,-.08,z,width,.13,depth,color,granite);for(let i=-width/2+.7;i<width/2;i+=.8)box(x+i,-.005,z,.018,.012,depth,0x8e9c97,{});for(let i=-depth/2+.7;i<depth/2;i+=.8)box(x,.0,z+i,width,.012,.018,0x8e9c97,{});}
 function lamp(x,z){cyl(x,.33,z,.055,.07,.65,0x526a73,metal,8);cyl(x,.63,z,.10,.10,.08,0xeadebc,{emissive:0xffd398,emissiveIntensity:.7},12);}
 function windows(x,z,width,height,color){box(x,height/2+.15,z,width,height,1.25,0xd5dacc,stone);box(x,height/2+.15,z+.638,width-.14,height-.22,.025,color,glass);for(let a=-width/2+.2;a<width/2;a+=.49)box(x+a,height/2+.15,z+.68,.032,height,.065,0xa8bec1,metal);for(let y=.42;y<height;y+=.6)box(x,y,z+.67,width,.035,.06,0xb7c6c5,metal);box(x,height+.22,z,width+.2,.16,1.48,0xe7e8d9,stone);}
 function water(x,z,a,b){box(x,-.03,z,a,.12,b,0xa6b8b6,stone);box(x,.045,z,a-.16,.02,b-.16,0x3d7b8c,{metalness:.52,roughness:.17,envMapIntensity:1.6});for(let i=0;i<6;i++)box(x,.058,z-b*.38+i*b*.13,a*.9,.004,.01,0x94babc,{transparent:true,opacity:.2,metalness:.6});}
 function mic(parent,x,y,z){cyl(x,y,z,.018,.025,.4,0x273b49,metal,8,parent);w.sphere(parent,x,y+.21,z,.047,0x242e37,metal);}
 // Continuous paving, inset seams and low lights keep the playable grid visually separate.
 for(const side of [-1,1]){paving(side*8.65,0,1.35,11,original?0xc4c6b6:0xbcbcaf);for(const z of [-4.8,0,4.8])lamp(side*9.28,z);}
 if(!original)paving(0,-9.1,22,6.3);
 if(['camara','senado'].includes(id)){
  const senate=id==='senado',color=senate?0x234f7c:0x336452;
  box(0,.02,-8.6,21,.15,5.7,color,{roughness:1,map:w.paperTexture});
  box(0,1.75,-11.4,22,3.5,.35,senate?0xaeb6b7:0x775e43,senate?metal:wood);
  for(let i=-20;i<=20;i++){const panel=box(i*.5,1.75,-11.12,.31,2.7,.12,i%3?0xc8cbc6:0x58686c,metal);panel.rotation.y=(i%3-1)*.32;}
  for(let tier=0;tier<3;tier++){const group=new THREE.Group();root.add(group);group.position.y=tier*.17;
   for(let i=-9;i<=9;i++){if(i===0)continue;const x=i*.94,z=-7.2-tier*1.02-Math.abs(i)*.045,seat=new THREE.Group();seat.position.set(x,0,z);seat.rotation.y=-i*.035;group.add(seat);
    box(0,.21,0,.5,.1,.46,color,{roughness:.92,map:w.paperTexture},seat);w.roundBox(seat,0,.48,-.2,.52,.48,.12,color,.055,{roughness:.82});for(const a of [-.19,.19])box(a,.14,0,.04,.26,.36,0x43565e,metal,seat);
    box(0,.55,.48,.77,.085,.36,0x986e44,wood,seat);box(0,.35,.5,.075,.4,.12,0x384e57,metal,seat);box(.18,.598,.48,.14,.018,.1,0x273947,{metalness:.4},seat);mic(seat,-.22,.70,.48);
   }
  }
  box(0,.56,-6.65,3.4,1.05,.65,0x966b42,wood);box(0,1.105,-6.6,3.65,.08,.87,0xc3975f,wood);mic(root,-.8,1.30,-6.6);mic(root,.8,1.30,-6.6);
  for(const side of [-1,1]){box(side*8.7,2.35,-10.91,2.1,1,.08,0x162e40,{emissive:0x193a4c,emissiveIntensity:.25});for(let line=0;line<4;line++)box(side*8.7,2.03+line*.16,-10.85,1.7,.035,.01,line===3?0xd6bf7e:0x71aeab,{emissive:0x559db0,emissiveIntensity:.4});}
  if(senate)for(let i=-10;i<=10;i++)box(i,3.3,-10.4,.8,.07,1.45,0xd6d8d0,metal);
  sign(senate?'SENADO FEDERAL':'CÂMARA DOS DEPUTADOS',0,3.15,-11.16,6);w.scene.background.set(senate?0x273b55:0x60695d);w.scene.fog.color.copy(w.scene.background);
 }else if(id==='tse'){
  const group=new THREE.Group();root.add(group);const segments=32;
  for(let i=0;i<segments;i++){const a=Math.PI*.08+i/segments*Math.PI*.84,b=Math.PI*.08+(i+1)/segments*Math.PI*.84,x=Math.cos(a)*10.1,z=-7.7-Math.sin(a)*4.2,pane=box(x,1.8,z,.68,3.15,.28,0x467785,glass);pane.rotation.y=Math.atan2(-4.2*Math.cos(a),-10.1*Math.sin(a));const frame=box(x,1.8,z+.08,.028,3.3,.12,0xc1cecd,metal);frame.rotation.y=pane.rotation.y;const roof=box(x,3.45,z,.76,.16,1.2,0xebeddf,stone);roof.rotation.y=pane.rotation.y;}
  for(const [x,r]of [[-4,1.15],[0,1.55],[4,1.15]]){const dome=w.mesh(new THREE.SphereGeometry(r,36,20,0,Math.PI*2,0,Math.PI/2),w.material(0xf0e8d6,stone),root,x,.24,-7.35);dome.scale.y=.58;cyl(x,.18,-7.35,r,r,.3,0xdfddcb,stone,36);}sign('JUSTIÇA ELEITORAL',0,.73,-6.2,4.5);
 }else if(id==='stj'){
  for(const x of [-7,0,7])cyl(x,.95,-9.2,.55,1.05,1.9,0xd8d9ce,stone,4);
  box(0,2.4,-9.5,20,1.45,3.4,0xe5e4d5,stone);box(0,2.36,-7.78,19.5,1.1,.055,0x516f78,glass);
  for(let i=-16;i<=16;i++){const x=i*.55;box(x,2.33,-7.72,.1,.93,.03,i%4?0xc3ded8:0xa6b8c2,{metalness:.35,roughness:.3});}
  water(0,-6.65,13,1.45);windows(-9,-12.8,3,4.2,0x658387);windows(9,-12.8,3,4.2,0x658387);sign('SUPERIOR TRIBUNAL DE JUSTIÇA',0,3.25,-7.77,6.4);
 }else if(id==='pf'){
  windows(0,-10.4,20,4.0,0x496473);box(0,.64,-9.55,20,1.28,.6,0x293f4e,granite);for(let x=-9;x<=9;x+=3)box(x,.74,-9.21,2.5,1.05,.04,0x547383,glass);box(0,1.42,-8.85,5.5,.16,2.1,0x8f9992,metal);sign('POLÍCIA FEDERAL',0,2.35,-9.68,4.2);
  for(const side of [-1,1]){box(side*5,.3,-7,4,.08,.12,0xe0b846,metal);for(const x of [side*3,side*7])cyl(x,.32,-7,.06,.075,.64,0x516472,metal,8);box(side*8.4,.47,-7.1,1.2,.94,1.1,0xa4afa8,stone);box(side*8.4,.69,-6.53,.87,.38,.025,0x4d7784,glass);}
 }else if(id==='justica-federal'){
  windows(0,-10.5,19,4.8,0x647c80);box(0,.58,-9.55,19,1.16,.5,0xb7b4a4,granite);
  for(const x of [-8,-4,4,8])box(x,2.5,-9.75,.32,4.9,.5,0xcac7b8,stone);
  box(0,1.1,-9.35,3.2,2.2,.12,0x446271,glass);box(0,2.42,-8.8,6.4,.2,2,0xd5d6ca,stone);
  for(let i=0;i<4;i++)box(0,.08+i*.08,-7.7-i*.25,5.6,.16,.8,0xc5c4b5,stone);
  sign('JUSTIÇA FEDERAL · CURITIBA',0,3.25,-9.79,7);
 }else if(id==='agu'){
  windows(0,-10.6,20,5.1,0x2f6677);
  for(const x of [-9.5,-5,0,5,9.5])box(x,2.7,-9.88,.21,5.3,.24,0xc6d4d3,metal);
  box(0,1.35,-9.58,8,2.7,.18,0x365b65,glass);box(0,2.9,-8.95,10,.22,2.6,0xd0d8cc,stone);
  sign('ADVOCACIA-GERAL DA UNIÃO',0,3.65,-9.9,8);
  for(const side of [-1,1]){planter(side*7.6,-7.2);water(side*4.1,-7.7,2.2,1.2);}
 }else if(id==='pgr'){
  for(const [x,r,height]of [[-4.3,3.25,3.3],[5.2,2.65,2.75]]){cyl(x,.55,-9.2,.37,.55,1.1,0xdbe1d9,stone,16);cyl(x,1.9,-9.2,r,r,height-1,0x497f8e,glass,64);for(let i=0;i<36;i++){const a=i*Math.PI/18;box(x+Math.cos(a)*r,1.9,-9.2+Math.sin(a)*r,.035,height-1,.035,0x8faeb5,metal);}for(let i=0;i<8;i++){const a=i*Math.PI/4,beam=box(x+Math.cos(a)*r*.48,3.15,-9.2+Math.sin(a)*r*.48,r*1.12,.2,.21,0xe6e6d8,stone);beam.rotation.y=-a;}cyl(x,3.22,-9.2,.4,.6,.25,0xe8e8db,stone,16);}
  box(.5,1.2,-9.2,4.8,.14,.8,0xd9e1d8,stone);water(0,-6.65,11,1.1);sign('PROCURADORIA-GERAL DA REPÚBLICA',0,.69,-6.02,7);
 }else if(id==='praca'){
  for(const side of [-1,1]){const x=side*1.4;box(x,.18,-9,.6,.35,.6,0xaba994,stone);for(const leg of [-1,1]){const m=box(x+leg*.16,1.02,-9,.12,1.75,.14,0x514c3d,metal);m.rotation.z=leg*.1;}const torso=box(x,2.15,-9,.36,1.15,.2,0x6b6048,metal);torso.rotation.z=side*.08;sphere(x,2.93,-9,.18,0x766449,metal);const arm=box(x-side*.58,2.18,-9,1.28,.11,.12,0x62573e,metal);arm.rotation.z=side*.18;}
  box(-8,1.85,-10,.95,3.7,1,0xd9d8cb,stone);for(let i=0;i<5;i++)box(-8,1+i*.47,-9.48,.6,.14,.04,0x747b74,{});box(7,1.1,-10,4,.7,1.5,0xc6c7b7,stone);box(6,.42,-10,.55,.84,.8,0xb6b9ad,stone);box(8,.42,-10,.55,.84,.8,0xb6b9ad,stone);sign('PRAÇA DOS TRÊS PODERES',0,.5,-6.6,6);
 }else if(id==='debate'){
  box(0,.0,-8.4,22,.2,5.4,0x172a3d,{roughness:.3,metalness:.3});box(0,1.9,-11,22,3.8,.32,0x17283f,metal);
  for(let i=-15;i<=15;i++){box(i*.68,1.85,-10.81,.018,3.45,.015,i<0?0xae6662:0x5299c4,{emissive:i<0?0xb84438:0x2684bb,emissiveIntensity:.6});for(let j=0;j<3;j++)box(i*.68,1+j*.65,-10.8,.60,.018,.016,0x587489,{emissive:0x417999,emissiveIntensity:.3});}
  for(const side of [-1,1]){w.roundBox(root,side*5.7,.6,-7.7,1.1,1.15,.7,0xc8d5d4,.12,metal);box(side*5.7,1.23,-7.7,1.4,.08,.95,0x385367,glass);mic(root,side*5.7,1.44,-7.55);cyl(side*8.7,.62,-3,.035,.055,1.15,0x41535d,metal,8);box(side*8.7,1.28,-3,.58,.35,.52,0x263945,metal);const lens=cyl(side*8.7,1.27,-2.65,.12,.14,.32,0x4d7888,glass);lens.rotation.x=Math.PI/2;sphere(side*8.7,1.52,-2.9,.04,0xf97d6a,{emissive:0xff503a,emissiveIntensity:.8});}
  for(let x=-9;x<=9;x+=3){box(x,3.5,-9.8,.32,.22,.45,0x53636e,metal);box(x,3.48,-9.55,.25,.16,.02,0xf8e5bd,{emissive:0xffd695,emissiveIntensity:.65});}box(0,3.65,-9.8,21,.10,.12,0x526876,metal);sign('BATALHA DAS URNAS · AO VIVO',0,2.8,-10.73,7);w.scene.background.set(0x172637);w.scene.fog.color.copy(w.scene.background);
 }
 if(original){
  if(id==='congresso'){for(const side of [-1,1]){planter(side*9.4,-6.5);for(let i=0;i<3;i++)tree(side*(10+i*.9),-8-i*1.4,.8);}for(const x of [-5,5])paving(x,-6.65,3.5,.65,0xdce0ce);}
  if(id==='stf'){for(const side of [-1,1]){box(side*8.6,.35,-5,1.25,.13,.7,0xc3bda7,stone);box(side*8.6,.16,-5,.25,.3,.5,0x68797b,metal);planter(side*9.7,-7.3);}}
  if(id==='planalto'){for(const side of [-1,1]){planter(side*9,-5.5);planter(side*9,3.8);for(let i=0;i<4;i++)box(side*8.1,.18,-6.5-i*.18,1.3,.055,.15,0xe2dcc7,stone);}}
  if(id==='esplanada'){for(const side of [-1,1]){for(let i=0;i<4;i++)tree(side*9.6,-6-i*2,.7+i*.07);box(side*9.1,.25,4,1.2,.08,.48,0x9b764c,wood);for(const x of [-.42,.42])box(side*9.1+x,.12,4,.055,.24,.42,0x697b7a,metal);}}
 }else if(!['camara','senado','debate'].includes(id)){for(const side of [-1,1]){planter(side*10,-6.1);tree(side*10.4,-8,.85);}}
 batchStatic(root);return root;
}
