import * as THREE from './vendor/three.module.js';

// Curved, volumetric tongues: each one has a hot root, a tapering tip and its own rise cycle.
export function createFlame(owner,seed,glowTexture){
 const group=new THREE.Group();group.userData.tongues=[];
 const points=[];for(let i=0;i<=16;i++){let h=i/16;points.push(new THREE.Vector2((.19+.1*Math.sin(h*Math.PI))*Math.pow(1-h,1.35),h));}
 for(let i=0;i<5;i++){
  let angle=i*2.39996+seed,rad=i===0?0:.19+(i%3)*.065;
  let material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},seed:{value:seed+i*3.17},blue:{value:owner},fade:{value:1}},
   vertexShader:`varying vec2 vUv;uniform float time,seed;void main(){vUv=uv;vec3 p=position;float h=p.y;p.x+=sin(time*7.+seed+h*6.)*h*h*.24;p.z+=cos(time*5.+seed+h*5.)*h*h*.16;p.y+=sin(time*10.+seed+h*8.)*h*.035;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`varying vec2 vUv;uniform float time,seed,blue,fade;
   void main(){float h=vUv.y;float wave=sin(vUv.x*25.+h*15.-time*11.+seed)*.08+sin(h*28.-time*17.+seed)*.045;float ridge=pow(abs(sin(vUv.x*12.+h*6.-time*4.+seed)),3.);float heat=clamp(1.-h+wave+ridge*.13,0.,1.);
   vec3 red=mix(vec3(.95,.012,.001),vec3(1.65,.24,.006),smoothstep(.1,.65,heat));red=mix(red,vec3(2.2,1.05,.19),smoothstep(.62,1.,heat));
   vec3 cyan=mix(vec3(.004,.035,1.1),vec3(.005,.48,1.8),smoothstep(.15,.7,heat));cyan=mix(cyan,vec3(.06,.85,1.6),smoothstep(.65,1.,heat));
   gl_FragColor=vec4(mix(red,cyan,blue),fade*.995);}`});
  let flame=new THREE.Mesh(new THREE.LatheGeometry(points,14),material);flame.position.set(Math.cos(angle)*rad,.025,Math.sin(angle)*rad);flame.rotation.y=angle;flame.castShadow=false;flame.userData={phase:seed*.27+i*.83,height:i===0?1.38:.72+(i%3)*.21,width:i===0?1.45:.85+(i%2)*.2};group.add(flame);group.userData.tongues.push(flame);
 }
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(1.45,1.45),new THREE.MeshBasicMaterial({map:glowTexture,color:owner?0x006aff:0xff6622,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}));pool.rotation.x=-Math.PI/2;pool.position.y=.025;group.add(pool);return group;
}
export function animateFlame(group,time,remaining,reduced){
 const fade=Math.min(1,remaining/.12);for(const m of group.userData.tongues){let d=m.userData,cycle=reduced?.5:(Math.sin(time*13+d.phase)*.5+.5);m.scale.set(d.width*(.85+cycle*.18),d.height*(.70+cycle*.38)*Math.min(1,remaining/.09),d.width*(.85+cycle*.18));m.material.uniforms.time.value=reduced?0:time;m.material.uniforms.fade.value=fade;}
}
