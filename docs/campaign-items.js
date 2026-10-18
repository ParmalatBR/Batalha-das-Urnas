import * as THREE from './vendor/three.module.js';
export function campaignItem(w,type,root){
 const old=[...root.children];for(const child of old){root.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [o.material].flat())m.dispose();}});}
 const metal={metalness:.75,roughness:.26},paper={roughness:.7},gold=0xeac76a,blue=0x69c6db,green=0x68d59d;
 const box=(x,y,z,a,b,c,color,props=paper)=>w.roundBox(root,x,y,z,a,b,c,color,.025,props);
 const ring=(x,y,z,r,color)=>{const m=w.mesh(new THREE.TorusGeometry(r,.038,7,24),w.material(color,metal),root,x,y,z);return m;};
 if(type==='habeas'){box(0,0,0,.47,.59,.06,0xf1e3b7);box(0,.04,.06,.30,.29,.04,green,metal);const check=w.mesh(new THREE.TorusGeometry(.08,.025,5,12,Math.PI*1.5),w.material(0xf8efb9),root,0,.05,.1);check.rotation.z=.5;}
 if(type==='vista'){box(0,.27,0,.46,.07,.27,gold,metal);box(0,-.27,0,.46,.07,.27,gold,metal);for(const sign of [-1,1]){const cone=w.mesh(new THREE.ConeGeometry(.16,.23,16),w.material(sign===1?0xd7e8e7:gold,{transparent:sign===1,opacity:.7,metalness:.2,roughness:.25}),root,0,sign*.13,0);cone.rotation.z=sign===1?0:Math.PI;}for(const x of [-.2,.2])box(x,0,0,.035,.5,.06,gold,metal);}
 if(type==='immunity'){const ball=w.sphere(root,0,0,0,.28,blue,{transparent:true,opacity:.3,metalness:.35,roughness:.1});box(0,-.08,0,.26,.21,.20,0xf1e3b7);box(0,.06,0,.33,.08,.24,gold,metal);ring(0,0,0,.30,blue);}
 if(type==='heal'){box(0,0,0,.47,.4,.22,0xeae6ce);box(0,.23,0,.22,.10,.15,green,metal);box(0,0,.125,.08,.26,.035,green);box(0,0,.126,.26,.08,.035,green);}
 if(type==='charge'){box(0,0,0,.37,.53,.20,0x655092,metal);box(0,.04,.12,.25,.23,.025,0xa9dcaa);box(0,.29,0,.15,.06,.12,gold,metal);box(-.06,.06,.15,.06,.15,.03,gold);const l=box(.03,-.02,.15,.06,.15,.03,gold);l.rotation.z=.4;}
 if(type==='chain'){for(let i=-1;i<2;i++){const m=ring(i*.16,i*.05,0,.13,i===0?gold:0xc3dce1);m.scale.y=.7;m.rotation.y=i===0?1.2:0;}}
 if(type==='order'){const g=new THREE.Group();root.add(g);g.rotation.z=-.55;w.cylinder(g,0,0,0,.045,.045,.6,0x967445,10);const head=w.cylinder(g,0,.22,0,.12,.12,.4,gold,14);head.rotation.z=Math.PI/2;box(0,-.27,0,.53,.1,.30,0x6b5740);}
}
