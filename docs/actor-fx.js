import * as THREE from './vendor/three.module.js';
const colors=[0xff5c39,0x35bfff];
function starGeometry(){const shape=new THREE.Shape();for(let i=0;i<10;i++){let a=i*Math.PI/5,r=i%2?.065:.15;shape[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1,steps:1});}
export class ActorFX {
 constructor(world){this.world=world;this.data=world.characters.map((v,id)=>{
  const group=new THREE.Group();world.scene.add(group);
  const stars=new THREE.Group();group.add(stars);
  for(let n=0;n<4;n++){const m=new THREE.Mesh(starGeometry(),new THREE.MeshStandardMaterial({color:0xffda60,emissive:0xffbb25,emissiveIntensity:.5,metalness:.35,roughness:.3}));stars.add(m);}
  const aura=new THREE.Group();group.add(aura);
  for(let n=0;n<2;n++){const m=new THREE.Mesh(new THREE.TorusGeometry(.45+n*.09,.013,6,48),new THREE.MeshBasicMaterial({color:0xa975ff,transparent:true,opacity:.65,depthWrite:false}));m.rotation.x=Math.PI/2;aura.add(m);}
  const crown=new THREE.Group();group.add(crown);for(let n=0;n<6;n++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.055),new THREE.MeshBasicMaterial({color:colors[id%2]}));crown.add(m);}
  v.shield.material.dispose();v.shield.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},tint:{value:new THREE.Color(0x55e6ff)}},vertexShader:'varying vec3 vN,vP;varying vec2 vUv;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vN,vP;varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(-vP))),2.);float grid=pow(abs(sin(vUv.x*75.)*sin(vUv.y*45.+time)),18.);float scan=pow(max(0.,sin(vUv.y*18.-time*2.)),12.);gl_FragColor=vec4(tint*(.7+rim+scan*.3),.035+rim*.48+grid*.15+scan*.09);}'});
  const cuffs=new THREE.Group();group.add(cuffs);for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.21,.053,8,28),new THREE.MeshStandardMaterial({color:0xcbdbe6,metalness:.9,roughness:.22}));ring.position.set(side*.2,.8,.09);cuffs.add(ring);}return {group,stars,aura,crown,cuffs,ouch:0,cheer:0,trail:0};
 });}
 hit(event){const d=this.data[event.victim];d.ouch=event.shielded?.3:1.25;if(!event.shielded&&event.owner!==event.victim)this.data[event.owner].cheer=1.4;}
 update(dt,game,t){const w=this.world;for(const p of game.players){const d=this.data[p.id],v=w.characters[p.id];d.ouch=Math.max(0,d.ouch-dt);d.cheer=Math.max(0,d.cheer-dt);d.group.position.set(p.px-7,.22,p.py-5);d.group.visible=p.life>0;d.stars.visible=d.ouch>0&&!w.reduced;d.cuffs.visible=d.ouch>0;d.cuffs.rotation.y=w.reduced?0:Math.sin(d.ouch*9)*.3; if(p.life<=0&&d.ouch>0){d.group.visible=true;v.sprite.visible=true;v.sprite.position.y+=w.reduced?0:(1.25-d.ouch)*.55;v.sprite.material.rotation=w.reduced?0:(1.25-d.ouch)*(p.id?1:-1)*1.1;v.sprite.material.opacity=d.ouch/1.25;}
  d.stars.children.forEach((m,i)=>{const a=t*5+i*Math.PI/2;m.position.set(Math.cos(a)*.44,1.75+Math.sin(a*2)*.1,Math.sin(a)*.3);m.rotation.set(0,-a,t*2);m.scale.setScalar(Math.min(1,d.ouch*3));});
  if(d.ouch>0&&!w.reduced){let pulse=Math.sin(d.ouch*18)*Math.min(1,d.ouch)*.07;v.sprite.material.rotation+=pulse;v.sprite.scale.x*=1+pulse;v.sprite.scale.y*=1-pulse*.7;}
  if(d.cheer>0&&!w.reduced)v.sprite.position.y+=Math.abs(Math.sin(d.cheer*8))*.065;
  d.aura.visible=p.ghost>0;d.aura.children.forEach((m,i)=>{m.position.y=.2+i*.5+Math.sin(t*3+i)*.1;m.rotation.z=w.reduced?0:Math.sin(t*2)*.1;m.material.opacity=.4+.18*Math.sin(t*4+i);});
  d.crown.visible=!!(p.remote||p.glove);d.crown.children.forEach((m,i)=>{let a=(w.reduced?0:t*.9)+i*Math.PI/3;m.position.set(Math.cos(a)*.48,.42,Math.sin(a)*.48);});
  v.shield.material.uniforms.time.value=w.reduced?0:t;
  if(p.speed>0&&p.cool>0&&!w.reduced&&t>d.trail){d.trail=t+.13;w.particle(p.px-7,.24,p.py-5,[0,.25,0],.32,colors[p.team??p.id%2],.02+p.speed*.006);}
  v.ring.material.opacity=.7;if(p.remote||p.glove)v.ring.material.color.set(0xffd76a);else v.ring.material.color.set(colors[p.team??p.id%2]);
 }}
}
