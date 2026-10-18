import * as THREE from './vendor/three.module.js';
const colors=[0xd94437,0x2586c6],temp=new THREE.Object3D();
function ring(radius,tube,arc=Math.PI*2){return new THREE.TorusGeometry(radius,tube,8,36,arc);}
export function cuffModel(w,b){
 const g=new THREE.Group(),steel=w.material(b.chainStyle==='brass-chain'?0xe9c879:0xdce5e9,{map:w.steelTexture,metalness:.95,roughness:.23,envMapIntensity:1.9}),dark=w.material(0x344958,{metalness:.85,roughness:.33}),team=colors[b.team??b.owner%2];g.userData.gates=[];
 for(const side of [-1,1]){
  const body=new THREE.Group();body.position.set(side*.255,.24,0);body.rotation.set(-Math.PI/2,side*.08,side*.13);g.add(body);
  const fixed=new THREE.Mesh(ring(.235,.055,Math.PI*1.65),steel);fixed.castShadow=true;body.add(fixed);
  const bevel=new THREE.Mesh(ring(.233,.012,Math.PI*1.65),dark);bevel.position.z=.048;body.add(bevel);
  const gate=new THREE.Group();gate.position.set(.235,0,0);body.add(gate);const swing=new THREE.Mesh(ring(.235,.037,Math.PI*.66),steel);swing.rotation.z=-Math.PI*.65;swing.position.x=-.235;gate.add(swing);g.userData.gates.push({gate,side});
  w.roundBox(body,.18,-.155,0,.19,.18,.13,0x8294a0,.025,{map:w.steelTexture,metalness:.85,roughness:.28});
  for(const pos of [[.21,.02],[-.15,.175],[.15,-.19]]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.016,12),steel);bolt.rotation.x=Math.PI/2;bolt.position.set(pos[0],pos[1],.069);body.add(bolt);w.box(body,pos[0],pos[1],.079,.028,.007,.004,0x3e535e);}
  const badge=new THREE.Mesh(new THREE.CircleGeometry(.046,16),w.material(team,{metalness:.5,roughness:.22,emissive:team,emissiveIntensity:.12}));badge.position.set(.18,-.14,.071);body.add(badge);
 }
 for(let i=0;i<3;i++){const link=new THREE.Mesh(ring(.064,.023),steel);link.scale.x=1.2;link.position.set((i-1)*.078,.25,0);link.rotation.x=i%2?Math.PI/2:.15;g.add(link);}
 g.userData.spark=w.sphere(g,0,.31,.04,.031,team,{emissive:team,emissiveIntensity:1.2});
 const fuse=w.mesh(new THREE.RingGeometry(.52,.55,48),new THREE.MeshBasicMaterial({color:0xf7d68d,side:THREE.DoubleSide,transparent:true,opacity:.7,depthWrite:false}),g,0,.008,0);fuse.rotation.x=-Math.PI/2;g.userData.fuse=fuse;g.userData.nextSpark=Infinity;return g;
}
export function animateCuff(g,b,t,reduced){
 const age=Math.max(0,(b.duration||2.35)-b.t),arming=Math.min(1,age/.22),opening=Math.max(0,1-b.t/.65);
 if(!reduced){g.position.y=.17+Math.sin(arming*Math.PI)*.18;g.rotation.z=Math.sin(arming*Math.PI*2)*(1-arming)*.12;g.rotation.y=Math.sin(t*1.5+b.x)*.035;g.scale.setScalar((b.giant?1.32:1)*(1+opening*.08));}
 for(const {gate,side}of g.userData.gates||[])gate.rotation.z=(reduced?opening:opening*opening)*1.7*side;
}
export function createChains(f){
 const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:f.chainStyle==='brass-chain'?0xe9c879:0xd1dde3,metalness:.94,roughness:.22,transparent:true,envMapIntensity:1.8});
 const origin=f.x===f.ox&&f.y===f.oy,count=origin?12:6,links=new THREE.InstancedMesh(ring(.086,.032),mat,count);links.castShadow=true;g.add(links);if(f.x===f.ox&&!origin)g.rotation.y=Math.PI/2;
 const strip=new THREE.Mesh(new THREE.PlaneGeometry(.98,.17),new THREE.MeshBasicMaterial({color:colors[f.team??f.owner%2],transparent:true,opacity:.36,depthWrite:false}));strip.rotation.x=-Math.PI/2;strip.position.y=.012;g.add(strip);
 const cap=new THREE.Mesh(ring(.18,.044,Math.PI*1.8),mat);cap.rotation.x=-Math.PI/2;cap.position.set(.34,.17,0);cap.visible=!!f.impact&&!origin;g.add(cap);
 Object.assign(g.userData,{chains:true,origin,count,impact:!!f.impact,distance:Math.abs(f.x-(f.ox??f.x))+Math.abs(f.y-(f.oy??f.y))});animateChains(g,0,.62,true);return g;
}
export function animateChains(g,t,life,reduced){
 const d=g.userData,age=Math.max(d.age||0,.62-life,life>.62?.22:0);d.age=age;const enter=Math.max(0,Math.min(1,(age-d.distance*.012)/.095)),extension=reduced?1:1-Math.pow(1-enter,3),fade=Math.min(1,life/.12),links=g.children[0];
 for(let i=0;i<d.count;i++){const cross=d.origin&&i>=6,k=i%6,along=(k-2.5)*.171*extension,wave=reduced?0:Math.sin(age*23-k*.75)*.05*Math.sin(Math.min(1,age/.62)*Math.PI);temp.position.set(cross?wave*.25:along,.16+Math.abs(wave),cross?along:wave*.25);temp.rotation.set(k%2?Math.PI/2:.12,cross?Math.PI/2:0,wave*1.5);temp.scale.set(1.2,1,1);temp.updateMatrix();links.setMatrixAt(i,temp.matrix);}links.instanceMatrix.needsUpdate=true;links.material.opacity=fade*extension;g.children[1].material.opacity=.32*fade*extension;g.children[1].scale.x=extension;g.children[2].scale.setScalar(extension);g.children[2].rotation.z=reduced?0:Math.sin(age*17)*.12;
}
export function cuffBurst(w,b){
 w.shake=w.reduced?0:.055;for(let i=0;i<(w.reduced?2:10);i++){const a=i*Math.PI/5;w.particle(b.x-7,.42,b.y-5,[Math.cos(a)*1.3,.5,Math.sin(a)*1.3],.3,0xe3f0fa,.035);}
 const ring=w.mesh(new THREE.RingGeometry(.38,.41,40),new THREE.MeshBasicMaterial({color:colors[b.team??b.owner%2],transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}),w.scene,b.x-7,.245,b.y-5);ring.rotation.x=-Math.PI/2;w.rings.push({m:ring,life:.35});
}
