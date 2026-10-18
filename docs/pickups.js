import * as THREE from './vendor/three.module.js';

// Small, text-free silhouettes: the object itself communicates its power.
export function pickupObject(w,type){
 const g=new THREE.Group(),ivory=0xfff0c5,gold=0xf3b72b,green=0x17b471,blue=0x148bd9,red=0xe6382b;
 const metal=c=>w.material(c,{metalness:.4,roughness:.25});
 const box=(x,y,z,a,b,c,color)=>w.roundBox(g,x,y,z,a,b,c,color,.025,{metalness:.2,roughness:.32});
 const orb=(x,y,z,r,color)=>w.sphere(g,x,y,z,r,color,{metalness:.4,roughness:.2});
 const cylinder=(x,y,z,a,b,h,color)=>w.mesh(new THREE.CylinderGeometry(a,b,h,24),metal(color),g,x,y,z);
 const tube=(points,r,color)=>w.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,r,8,false),metal(color),g);
 function shape(points,depth,color,x=0,y=0,z=0){let s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return w.mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.016,bevelThickness:.016,bevelSegments:2,steps:1}),metal(color),g,x,y,z);}
 if(type==='range'){
  let horn=cylinder(.1,.04,0,.31,.095,.44,gold);horn.rotation.z=-Math.PI/2;
  let rim=w.mesh(new THREE.TorusGeometry(.3,.035,10,36),metal(ivory),g,.33,.04,0);rim.rotation.y=Math.PI/2;
  let dark=w.mesh(new THREE.CircleGeometry(.255,32),w.material(0x5e3119),g,.334,.04,0);dark.rotation.y=Math.PI/2;
  let rear=cylinder(-.19,.04,0,.12,.12,.25,red);rear.rotation.z=Math.PI/2;box(-.13,-.21,0,.13,.28,.15,red);g.rotation.y=-.55;
 }else if(type==='capacity'){
  for(const side of [-1,1]){const ring=w.mesh(new THREE.TorusGeometry(.20,.045,8,24),metal(0xc1d7e6),g,side*.22,0,0);ring.rotation.y=side*.3;}tube([[-.07,0,0],[0,-.07,.05],[.07,0,0]],.025,gold);
 }else if(type==='speed'){
  box(0,0,0,.29,.43,.065,ivory);tube([[-.09,0,.07],[-.02,-.08,.07],[.11,.12,.07]],.025,green);
  for(let side of [-1,1]){shape([[side*.11,.1],[side*.43,.34],[side*.48,.19],[side*.34,.03],[side*.43,.07],[side*.34,-.08],[side*.19,-.15]],.045,gold);}
 }else if(type==='kick'){
  box(-.07,.10,0,.29,.48,.27,0x24333e);box(.10,-.15,.02,.58,.20,.31,0x344b58);box(.10,-.27,.02,.62,.07,.34,gold);
  for(let y of [0,.1,.2])box(-.07,y,.15,.21,.025,.025,ivory);g.rotation.y=-.3;
 }else if(type==='glove'){
  orb(0,-.01,0,.21,ivory);for(let x of [-.14,-.05,.05,.14]){let finger=w.mesh(new THREE.CapsuleGeometry(.053,.18,4,8),w.material(ivory,{roughness:.4}),g,x,.21,0);finger.rotation.z=-x*.6;}
  let thumb=w.mesh(new THREE.CapsuleGeometry(.065,.12,4,8),w.material(ivory),g,-.23,0,0);thumb.rotation.z=-.8;box(0,-.24,0,.34,.12,.19,green);box(.27,.12,-.08,.21,.29,.035,blue);g.rotation.z=-.18;
 }else if(type==='remote'){
  box(0,0,0,.32,.65,.16,blue);orb(0,.18,.13,.083,red);box(0,-.05,.12,.17,.10,.02,green);for(let x of [-.07,.07])orb(x,-.20,.115,.035,ivory);tube([[0,.34,0],[0,.48,0]],.021,gold);g.rotation.z=-.2;
 }else if(type==='pierce'){
  cylinder(0,.16,0,.11,.095,.3,red);orb(0,.30,0,.14,red);box(0,-.06,0,.58,.11,.37,0x714724);box(0,-.14,0,.6,.07,.40,red);shape([[-.10,-.23],[.03,-.23],[.03,-.16],[.20,-.30],[.03,-.46],[.03,-.37],[-.10,-.37]],.035,gold);
 }else if(type==='shield'){
  let outline=[[-.32,.28],[0,.40],[.32,.28],[.27,-.13],[0,-.40],[-.27,-.13]];shape(outline,.08,gold,0,0,-.04);shape(outline.map(p=>p.map(v=>v*.80)),.025,green,0,0,.065);
  box(0,.02,.115,.26,.21,.035,ivory);box(0,.14,.13,.3,.055,.04,ivory);box(0,.167,.155,.12,.015,.01,0x194b49);
 }else if(type==='ghost'){
  tube([[-.14,.2,0],[-.20,.49,0],[.18,.49,0],[.14,.2,0]],.033,0x9259ed);box(0,-.08,0,.41,.52,.07,0x8055d0);box(0,-.08,.05,.34,.42,.04,ivory);orb(0,-.005,.10,.075,blue);box(0,-.15,.1,.19,.11,.035,blue);
 }else{
  orb(0,0,0,.19,green);for(let side of [-1,1]){let pts=[];for(let i=0;i<12;i++){let a=(i/11*2.2)+(side===1?0:Math.PI);pts.push([Math.cos(a)*.35,Math.sin(a)*.35,0]);}tube(pts,.046,blue);let end=pts.at(-1),cone=w.mesh(new THREE.ConeGeometry(.1,.18,12),metal(gold),g,...end);cone.rotation.z=(side===1?0:Math.PI)+2.2;}
 }
 return g;
}
