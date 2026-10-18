import * as THREE from './vendor/three.module.js';
const colors=[0xdc493f,0x218dcc];
export function cuffModel(w,b){
 const g=new THREE.Group(),metal=w.material(0xd7e2e5,{metalness:.94,roughness:.2,envMapIntensity:1.5});
 for(const side of [-1,1]){const hinge=new THREE.Group();hinge.position.set(side*.24,.30,0);g.add(hinge);const ring=new THREE.Mesh(new THREE.TorusGeometry(.205,.053,8,32,Math.PI*1.72),metal);ring.rotation.set(-Math.PI/2,0,side*.35);hinge.add(ring);w.box(hinge,0,.01,.18,.16,.09,.12,colors[b.team??b.owner%2],{metalness:.7,roughness:.25});}
 for(let i=0;i<3;i++){const link=new THREE.Mesh(new THREE.TorusGeometry(.065,.018,6,12),metal);link.position.set((i-1)*.10,.30,0);link.rotation.x=i%2?Math.PI/2:.2;g.add(link);}
 const light=w.sphere(g,0,.38,0,.037,colors[b.team??b.owner%2],{emissive:colors[b.team??b.owner%2],emissiveIntensity:1.1});g.userData.spark=light;
 const fuse=w.mesh(new THREE.RingGeometry(.49,.53,48),new THREE.MeshBasicMaterial({color:0xf5d27f,side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}),g,0,.02,0);fuse.rotation.x=-Math.PI/2;g.userData.fuse=fuse;g.userData.nextSpark=Infinity;if(b.giant)g.scale.setScalar(1.32);g.userData.closedRings=g.children.slice(0,2);return g;
}
export function createChains(f){
 const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:f.chainStyle==='brass-chain'?0xe9c879:0xb8c9d4,metalness:.92,roughness:.24,transparent:true,opacity:1,envMapIntensity:1.3});
 const origin=f.x===f.ox&&f.y===f.oy,vertical=f.x===f.ox;const count=origin?10:5,links=new THREE.InstancedMesh(new THREE.TorusGeometry(.095,.025,6,14),mat,count);const tmp=new THREE.Object3D();
 for(let i=0;i<count;i++){const axis=origin&&i>=5,step=i%5;tmp.position.set(axis?0:(step-2)*.21,.12,axis?(step-2)*.21:0);tmp.rotation.set(step%2?Math.PI/2:Math.PI/5,axis?Math.PI/2:0,0);tmp.scale.set(1.35,.85,1);tmp.updateMatrix();links.setMatrixAt(i,tmp.matrix);}links.castShadow=true;group.add(links);if(vertical&&!origin)group.rotation.y=Math.PI/2;
 const strip=new THREE.Mesh(new THREE.PlaneGeometry(.94,.28),new THREE.MeshBasicMaterial({color:colors[f.team??f.owner%2],transparent:true,opacity:.28,depthWrite:false}));strip.rotation.x=-Math.PI/2;strip.position.y=.015;group.add(strip);group.userData.impact=!!f.impact;group.userData.chains=true;group.userData.distance=Math.abs(f.x-(f.ox??f.x))+Math.abs(f.y-(f.oy??f.y));return group;
}
export function animateChains(g,t,life,reduced){const age=.62-life,progress=reduced?1:Math.min(1,Math.max(.08,(age-g.userData.distance*.009)*18),Math.max(.08,life/.12)),fade=Math.min(1,life*8);g.scale.set(progress*(g.userData.impact&&!reduced?1-Math.sin(Math.min(1,Math.max(0,age-.07)*8)*Math.PI)*.15:1),1,1);g.children[0].position.y=reduced?0:Math.sin(age*24)*.025;g.children[0].material.opacity=fade;g.children[1].material.opacity=.25*fade;}
export function cuffBurst(w,b){w.shake=w.reduced?0:.035;for(let i=0;i<(w.reduced?2:9);i++){const a=i*Math.PI*2/9;w.particle(b.x-7,.4,b.y-5,[Math.cos(a),1,Math.sin(a)],.35,0xdbedf7,.025);}const ring=w.mesh(new THREE.RingGeometry(.32,.36,32),new THREE.MeshBasicMaterial({color:colors[b.team??b.owner%2],transparent:true,opacity:.5,side:THREE.DoubleSide}),w.scene,b.x-7,.23,b.y-5);ring.rotation.x=-Math.PI/2;w.rings.push({m:ring,life:.4});}
