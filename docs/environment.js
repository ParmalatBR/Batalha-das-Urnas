import * as THREE from './vendor/three.module.js';

// Brasília is the set, rather than a flat backdrop: stone, glass, water,
// landscaping and architecture all catch the same light as the arena.
export function buildEnvironment(world, stage = 0) {
  const scene = world.scene;
  world.waters ||= [];
  world.flags ||= [];
  const root = new THREE.Group(); root.name = 'Brasília — entorno arquitetônico'; scene.add(root);
  const cache = new Map();
  const mat = (color, props = {}) => {
    const key = color + Object.entries(props).map(([k,v])=>`${k}:${v?.uuid??v}`).join('|');
    if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({color, roughness:.66, ...props}));
    return cache.get(key);
  };
  world.environmentTextureCache ||= new Map();
  function tiledTexture(source,x=1,y=1){
    if(!source)return undefined;
    const key=`${source.uuid}:${x}:${y}`;
    if(!world.environmentTextureCache.has(key)){
      const tex=source.clone();tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(x,y);tex.anisotropy=8;tex.needsUpdate=true;
      world.environmentTextureCache.set(key,tex);world.shared?.add(tex);
    }
    return world.environmentTextureCache.get(key);
  }
  const stoneMap=tiledTexture(world.travertineTexture||world.stoneTexture,2,1),graniteMap=tiledTexture(world.graniteTexture||world.stoneTexture,2,2),woodMap=tiledTexture(world.woodTexture,2,1),roadMap=tiledTexture(world.asphaltTexture,5,2);
  const white = mat(0xf6f1e4, {map:stoneMap,bumpMap:stoneMap,bumpScale:.012,roughness:stage===1?.29:.39});
  const limestone = mat(stage===1?0xbabcb5:0xd4c5a7, {map:stoneMap,bumpMap:stoneMap,bumpScale:.025,roughness:.72});
  const metal = mat(0x698080, {map:world.steelTexture,bumpMap:world.steelTexture,bumpScale:.014,metalness:.74, roughness:.28});
  const bronze = mat(0x514a35, {metalness:.72, roughness:.38});
  const glass = new THREE.MeshPhysicalMaterial({color:stage===1?0x76644b:stage===2?0x387985:0x376273, metalness:.68, roughness:.12, clearcoat:1, clearcoatRoughness:.09, envMapIntensity:1.35});
  const warmGlass = mat(0xffcf75, {emissive:0xf5a63a, emissiveIntensity:.42, roughness:.23, metalness:.25});
  const paleGlass = mat(stage===1?0x9f987e:stage===2?0x73b3bd:0x7ca5af, {metalness:.68, roughness:.17});
  const geo = {box:new THREE.BoxGeometry(1,1,1), leaf:new THREE.IcosahedronGeometry(1,1), sphere:new THREE.SphereGeometry(1,16,12)};
  function mesh(geometry, material, parent=root, x=0, y=0, z=0) {
    const o = new THREE.Mesh(geometry, material); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o;
  }
  function box(parent,x,y,z,w,h,d,m) {const o=mesh(geo.box,m,parent,x,y,z);o.scale.set(w,h,d);return o;}
  const cylinders=new Map();
  function cyl(parent,x,y,z,rt,rb,h,m,n=16) {const key=[rt,rb,h,n].join(',');if(!cylinders.has(key))cylinders.set(key,new THREE.CylinderGeometry(rt,rb,h,n));return mesh(cylinders.get(key),m,parent,x,y,z);}
  function sphere(parent,x,y,z,r,m,sx=1,sy=1,sz=1) {const o=mesh(geo.sphere,m,parent,x,y,z);o.scale.set(r*sx,r*sy,r*sz);return o;}
  let seed = 431 + stage*119;
  function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  function batch(parent, geometry, material, points) {
    if(!points.length)return;
    const o=new THREE.InstancedMesh(geometry, material, points.length), dummy=new THREE.Object3D();
    points.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.scale.set(p[3]??1,p[4]??p[3]??1,p[5]??p[3]??1);dummy.rotation.set(p[6]??0,p[7]??0,p[8]??0);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});
    o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function pavingTexture(){
    const c=document.createElement('canvas');c.width=c.height=512;const p=c.getContext('2d');
    p.fillStyle='#b8ad98';p.fillRect(0,0,512,512);
    for(let y=0;y<8;y++)for(let x=-1;x<8;x++){
      const v=177+Math.floor(random()*34),xx=x*80+(y%2)*40;
      p.fillStyle=`rgb(${v+15},${v+9},${v-5})`;p.fillRect(xx+1,y*64+1,78,62);
      p.fillStyle='#ffffff22';p.fillRect(xx+2,y*64+2,76,1);
    }
    for(let n=0;n<16000;n++){p.fillStyle=n%2?'#ffffff11':'#4e534010';p.fillRect(random()*512,random()*512,1,1);}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,7);t.anisotropy=4;return t;
  }
  const paving=mat(stage===1?0xe8e9df:stage===2?0xd4e1de:stage===3?0xc8b996:0xffffff,{map:pavingTexture(),bumpMap:stage===1?graniteMap:stoneMap,bumpScale:.045,roughness:stage===1?.49:.8});
  function grassTexture(){
    const c=document.createElement('canvas');c.width=c.height=512;const p=c.getContext('2d');
    p.fillStyle='#5f7345';p.fillRect(0,0,512,512);
    for(let i=0;i<220;i++){const x=random()*512,y=random()*512,r=10+random()*50;const g=p.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#8c8c5140':'#334d3b65');g.addColorStop(1,'#4b634300');p.fillStyle=g;p.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<38000;i++){p.strokeStyle=['#83905665','#bcc08750','#364f3760','#6c823b70'][i%4];p.lineWidth=.6;const x=random()*512,y=random()*512;p.beginPath();p.moveTo(x,y);p.lineTo(x+(random()-.5)*3,y-1-random()*4);p.stroke();}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(14,12);t.anisotropy=4;return t;
  }
  const groundMap=stage===1?tiledTexture(world.graniteTexture||world.stoneTexture,16,14):grassTexture();
  box(root,0,-.54,-2,70,.25,60,mat(stage===1?0xc7c5b8:0xffffff,{map:groundMap,bumpMap:groundMap,bumpScale:.02,roughness:stage===1?.7:1}));
  box(root,0,-.36,-1,stage===3?20.7:stage===0?21.6:23,.25,24,paving);
  // Dark expansion joints and warm limestone kerbs frame the playfield.
  for(const s of [-1,1]){
    box(root,s*7.97,-.17,0,.18,.23,11.9,white);
    box(root,s*8.18,-.215,0,.06,.08,12.5,mat(0x717b72));
    if(stage===0||stage===3){
      box(root,s*(stage===3?12.1:10.9),-.32,0,stage===3?2.15:1.65,.05,23,mat(0x777f7b,{map:roadMap,bumpMap:roadMap,bumpScale:.035,roughness:.92}));
      for(let z=-10;z<11;z+=1.5)box(root,s*(stage===3?12.1:10.9),-.288,z,.045,.007,.68,mat(0xe8e2b7));
    }
  }
  box(root,0,-.15,6.12,16.1,.16,.23,white);
  // Small inlaid brass strips read as plaza detailing in grazing sunlight.
  for(const s of [-1,1])for(let z=-5;z<6;z+=1.4)box(root,s*8.6,-.221,z,.9,.016,.023,mat(0x9e8956,{metalness:.7,roughness:.35}));

  function pool(x,z,w,d){
    box(root,x,-.24,z,w+.2,.12,d+.2,white);
    box(root,x,-.18,z,w,.025,d,mat(0x07646c,{roughness:.2}));
    const water = new THREE.ShaderMaterial({
      uniforms:{time:{value:0},deep:{value:new THREE.Color(0x087f91)},shallow:{value:new THREE.Color(0x48d6c5)}},
      vertexShader:`varying vec2 vUv; varying vec3 vWorld; void main(){vUv=uv; vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader:`uniform float time;uniform vec3 deep;uniform vec3 shallow;varying vec2 vUv;varying vec3 vWorld;
        void main(){vec2 p=vWorld.xz;float a=sin(p.x*9.+time*.9+sin(p.y*5.-time*.5));float b=sin(p.y*13.-time*1.2+sin(p.x*7.+time*.6));float c=pow(max(0.,a*b),8.);float r=.5+.5*sin(p.x*2.3+p.y*4.+time*.4);vec3 color=mix(deep,shallow,.2+r*.25)+vec3(.5,.65,.55)*c*.55;float edge=smoothstep(0.,.018,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));gl_FragColor=vec4(color*mix(.62,1.,edge),1.);#include <tonemapping_fragment> #include <colorspace_fragment>}`.replace(/;#include/g,';\n#include').replace(/> #include/g,'>\n#include').replace(/>}/g,'>\n}'),
      side:THREE.DoubleSide
    });
    const plane=mesh(new THREE.PlaneGeometry(w,d),water,root,x,-.139,z);plane.rotation.x=-Math.PI/2;plane.castShadow=false;world.waters.push(water);
    for(const s of [-1,1])box(root,x+s*(w/2+.07),-.09,z,.12,.11,d+.25,limestone);
    for(const s of [-1,1])box(root,x,-.09,z+s*(d/2+.07),w+.25,.11,.12,limestone);
  }
  if(stage===0){pool(-4.8,-6.83,5.35,1.23);pool(4.8,-6.83,5.35,1.23);}
  if(stage===2){pool(0,-6.75,14.65,1.39);pool(-8.8,-6.8,1.2,4.25);}

  const architecture=new THREE.Group();architecture.position.set(0,-.05,-8.1);architecture.scale.setScalar(.8);root.add(architecture);
  box(architecture,0,.035,0,16.6,.3,4.2,limestone);
  for(let n=0;n<4;n++)box(architecture,0,-.06+n*.06,2.6-n*.15,16.6-n*.25,.08,.34,white);
  const windowsWarm=[],windowsCool=[],mullions=[];
  function glazedFacade(parent,x,y,z,w,h,cols,rows){
    box(parent,x,y,z,w,h,.15,glass);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const xx=x-w/2+(i+.5)*w/cols,yy=y-h/2+(j+.5)*h/rows;
      (random()>.87?windowsWarm:windowsCool).push([xx,yy,z+.084,w/cols*.89,h/rows*.83,.012]);
    }
    for(let i=0;i<=cols;i++)mullions.push([x-w/2+i*w/cols,y,z+.096,.022,h,.022]);
    for(let j=0;j<=rows;j++)mullions.push([x,y-h/2+j*h/rows,z+.096,w,.025,.022]);
  }
  if(stage===0){
    // Congress: the flat chamber platform, Senate dome, open Chamber bowl,
    // and paired slender office towers are the defining silhouette.
    box(architecture,0,.43,.1,14.3,.61,2.8,white);
    glazedFacade(architecture,0,.36,1.514,13.5,.34,32,1);
    box(architecture,0,.765,.1,14.65,.11,2.99,white);
    for(const x of [-.79,.79]){
      box(architecture,x,2.51,-.65,1.01,3.84,.96,white);
      glazedFacade(architecture,x,2.50,-.159,.75,3.62,4,20);
      box(architecture,x,4.47,-.65,1.07,.1,1.03,white);
      box(architecture,x-.43,2.51,-.11,.065,3.8,.13,white);
      box(architecture,x+.43,2.51,-.11,.065,3.8,.13,white);
    }
    box(architecture,0,2.59,-.65,.62,.12,.55,white);
    const dome=mesh(new THREE.SphereGeometry(1.62,48,24,0,Math.PI*2,0,Math.PI/2),white,architecture,-4.05,.82,.1);dome.scale.y=.57;
    cyl(architecture,-4.05,.83,.1,1.63,1.65,.09,white,64);
    const points=[];for(let n=0;n<=24;n++){const r=n/24*1.8;points.push(new THREE.Vector2(r,.62*Math.pow(r/1.8,2)));}
    for(let n=24;n>=0;n--){const r=n/24*1.8;points.push(new THREE.Vector2(r,.62*Math.pow(r/1.8,2)-.07));}
    mesh(new THREE.LatheGeometry(points,64),white,architecture,4.05,.88,.1);
    const rim=mesh(new THREE.TorusGeometry(1.795,.038,8,64),white,architecture,4.05,1.5,.1);rim.rotation.x=Math.PI/2;
    cyl(architecture,4.05,.82,.1,.41,.61,.22,white,32);
  } else if(stage===1){
    box(architecture,0,1.31,-.15,11.7,1.84,2.6,glass);
    glazedFacade(architecture,0,1.34,1.17,11.65,1.76,26,3);
    box(architecture,0,2.37,0,13.75,.22,3.6,white);
    box(architecture,0,.33,0,13.6,.17,3.6,white);
    // The STF columns taper into the roof and flare at the ground.
    for(let x=-6.35;x<6.5;x+=1.27){
      const shape=new THREE.Shape();shape.moveTo(-.28,0);shape.bezierCurveTo(-.04,.45,.07,1.5,-.12,1.97);shape.lineTo(.32,1.97);shape.bezierCurveTo(.08,1.22,.15,.35,.43,0);shape.closePath();
      mesh(new THREE.ExtrudeGeometry(shape,{depth:.21,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),white,architecture,x,.4,1.64);
    }
    // Stylized seated Justiça sculpture, with blindfold and the long sword.
    const statue=new THREE.Group();statue.position.set(-6.55,.15,2.31);statue.scale.setScalar(1.17);architecture.add(statue);
    const sculpture=mat(0xb6b6a3,{map:graniteMap,bumpMap:graniteMap,bumpScale:.047,roughness:.74});
    box(statue,0,.12,0,1.05,.24,.83,mat(0x72756f,{map:graniteMap,bumpMap:graniteMap,bumpScale:.03,roughness:.73}));
    box(statue,0,.42,-.04,.53,.54,.42,sculpture);box(statue,0,.73,-.22,.55,.81,.12,sculpture);
    const skirtPoints=[new THREE.Vector2(.31,0),new THREE.Vector2(.27,.29),new THREE.Vector2(.23,.51),new THREE.Vector2(.19,.68)];
    const skirt=mesh(new THREE.LatheGeometry(skirtPoints,20),sculpture,statue,0,.38,.13);skirt.scale.z=.81;
    sphere(statue,0,1.04,-.008,.23,sculpture,.93,1.27,.73);
    sphere(statue,0,1.39,.018,.155,sculpture,.83,1.23,.86);
    sphere(statue,0,1.4,.145,.041,sculpture,.58,1.14,1.12);
    box(statue,0,1.42,.145,.23,.043,.018,mat(0x797d70,{roughness:.9}));
    for(const s of [-1,1]){
      const armPath=new THREE.CatmullRomCurve3([new THREE.Vector3(s*.18,1.12,0),new THREE.Vector3(s*.31,.86,.09),new THREE.Vector3(s*.28,.83,.32)]);
      mesh(new THREE.TubeGeometry(armPath,12,.063,8,false),sculpture,statue);
      sphere(statue,s*.27,.825,.34,.075,sculpture,1,.75,1.2);
      box(statue,s*.13,.31,.38,.15,.43,.16,sculpture);sphere(statue,s*.13,.14,.46,.12,sculpture,.74,.5,1.25);
    }
    const sword=box(statue,.29,.83,.41,.028,1.06,.045,mat(0x868e83,{map:world.steelTexture,metalness:.54,roughness:.32}));sword.rotation.z=-.09;
    box(statue,.28,1.14,.41,.22,.03,.046,sculpture);
  } else if(stage===2){
    box(architecture,0,1.42,-.1,11.8,1.91,2.5,glass);
    glazedFacade(architecture,0,1.41,1.16,11.75,1.88,28,3);
    box(architecture,0,2.48,0,14.2,.18,3.65,white);
    box(architecture,0,.36,0,14.2,.16,3.65,white);
    for(let x=-6.35;x<6.5;x+=1.8){
      const shape=new THREE.Shape();shape.moveTo(-.42,0);shape.bezierCurveTo(.35,.46,.35,1.5,-.37,2.02);shape.lineTo(.03,2.02);shape.bezierCurveTo(.83,1.61,.83,.45,.03,0);shape.closePath();
      mesh(new THREE.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2}),white,architecture,x,.44,1.72);
    }
    // The ceremonial ramp sweeps towards the entrance.
    const ramp=box(architecture,10.5,.31,1.54,1.42,.1,3.4,white);ramp.rotation.x=.16;
    for(const x of [9.83,11.17]){const rail=box(architecture,x,.65,1.54,.032,.032,3.4,metal);rail.rotation.x=.16;}
    box(architecture,8.38,.57,.02,4.25,.1,.85,white);
  } else {
    // Symmetrical ministry blocks around the long green Esplanada axis.
    box(architecture,0,.18,-.1,2.25,.09,4.2,mat(0x5b8b47));
    for(const s of [-1,1])for(let k=0;k<3;k++){
      const x=s*(2.6+k*2.45),height=3.05-k*.2,z=-.1-k*.22;
      box(architecture,x,height/2+.18,z,1.88,height,2.5,white);
      glazedFacade(architecture,x,height/2+.18,z+1.26,1.65,height-.24,5,10);
      box(architecture,x,height+.21,z,1.98,.12,2.62,white);
      for(const xx of [x-.81,x+.81])box(architecture,xx,height/2+.2,z+1.38,.09,height,.14,white);
    }
    // Congress silhouette at the far end of the monumental axis.
    for(const x of [-.32,.32])box(architecture,x,1.1,-2.7,.37,2.2,.4,white);
    sphere(architecture,-1.1,.36,-2.45,.65,white,1,.45,1);
  }
  batch(architecture,geo.box,paleGlass,windowsCool);batch(architecture,geo.box,warmGlass,windowsWarm);batch(architecture,geo.box,metal,mullions);
  // A discreet architectural inscription belongs to the physical model.
  const names=['CONGRESSO NACIONAL','SUPREMO TRIBUNAL FEDERAL','PALÁCIO DO PLANALTO','ESPLANADA DOS MINISTÉRIOS'];

  // Small curved leaflets and petals replace low-detail spherical crowns.
  // Each instance is a twig-sized packet, giving ragged silhouettes and gaps.
  function foliageGeometry(flower=false){
    const positions=[],indices=[];
    const leaves=flower?5:7;
    for(let n=0;n<leaves;n++){
      const angle=n*Math.PI*2/leaves,base=positions.length/3;
      const ox=flower?0:Math.cos(angle)*.2,oz=flower?0:Math.sin(angle)*.2;
      const len=flower?.46:.58;
      for(let j=0;j<=4;j++){
        const t=j/4,w=Math.sin(t*Math.PI)*(flower?.24:.16),r=t*len;
        for(const s of [-1,1])positions.push(ox+Math.cos(angle)*r+Math.cos(angle+Math.PI/2)*w*s,Math.sin(t*Math.PI)*.11+(flower?t*.1:n*.024),oz+Math.sin(angle)*r+Math.sin(angle+Math.PI/2)*w*s);
        if(j<4){const k=base+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const foliage=[[],[],[]],blossoms=[[],[]];
  const leafMats=[mat(0x305d37,{roughness:.87,side:THREE.DoubleSide}),mat(0x628148,{roughness:.87,side:THREE.DoubleSide}),mat(0x244b35,{roughness:.92,side:THREE.DoubleSide})];
  const fineLeaf=foliageGeometry(),flowerGeo=foliageGeometry(true);
  function barkTexture(){const c=document.createElement('canvas');c.width=128;c.height=256;const p=c.getContext('2d');p.fillStyle='#867263';p.fillRect(0,0,128,256);for(let i=0;i<360;i++){p.strokeStyle=i%2?'#342d2250':'#c0b09955';p.lineWidth=.5+random()*2;let x=random()*128,y=random()*256;p.beginPath();p.moveTo(x,y);p.lineTo(x+(random()-.5)*5,y+15+random()*50);p.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
  const bark=mat(0xffffff,{map:barkTexture(),roughness:1});
  const branchGeometry=new THREE.CylinderGeometry(.58,1,1,7);
  function branch(parent,a,b,r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);const o=mesh(branchGeometry,bark,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());o.scale.set(r,direction.length(),r);return o;}
  function tree(x,z,variant,scale=1){
    const g=new THREE.Group();g.position.set(x,-.13,z);g.scale.setScalar(scale);root.add(g);
    box(g,0,-.08,0,1.26,.17,1.24,limestone);box(g,0,.016,0,1.08,.026,1.06,mat(0x554c39));
    branch(g,[0,0,0],[.07,1.85,-.04],.12);
    const tips=[];
    for(let k=0;k<7;k++){
      const a=k*2.399+random()*.35,r=.44+random()*.39,tip=[Math.cos(a)*r,1.67+random()*.61,Math.sin(a)*r*.85];tips.push(tip);
      const mid=[tip[0]*.47,1.31+k*.058,tip[2]*.47];branch(g,[.03,1.03+k*.08,0],mid,.045);branch(g,mid,tip,.028);
      for(let b=0;b<2;b++)branch(g,mid,[tip[0]+(random()-.5)*.36,tip[1]+random()*.24,tip[2]+(random()-.5)*.36],.016);
    }
    for(let i=0;i<380;i++){
      const tip=tips[i%tips.length],a=random()*Math.PI*2,r=Math.pow(random(),.6)*.38;
      const xx=tip[0]+Math.cos(a)*r,zz=tip[2]+Math.sin(a)*r,yy=tip[1]+(random()-.5)*.46;
      const size=(.18+random()*.18)*scale;
      const p=[x+xx*scale,-.13+yy*scale,z+zz*scale,size,size,size,(random()-.5)*1.6,random()*6.28,(random()-.5)*1.6];
      foliage[i%3].push(p);
      if(variant>0&&i%2===0){const s=(.09+random()*.09)*scale;blossoms[(variant-1)%2].push([p[0]+.035,p[1]+.1,p[2]+.035,s,s,s,random()*2,random()*6.28,random()*2]);}
    }
  }
  if(stage===0)for(const s of [-1,1]){tree(s*9.6,3.3,0,.9);tree(s*9.8,-11.4,0,.85);}
  if(stage===1)for(const s of [-1,1]){tree(s*10.05,-9.7,0,.8);tree(s*10.1,5.3,1,.72);}
  if(stage===2)for(const s of [-1,1])tree(s*11.1,-11.4,0,.73);
  if(stage===3)for(const s of [-1,1]){tree(s*14.2,-5,0,.85);tree(s*14.2,2,0,.86);tree(s*9.6,7.2,2,.62);}
  foliage.forEach((a,i)=>batch(root,fineLeaf,leafMats[i],a));
  batch(root,flowerGeo,mat(0xd886be,{roughness:.87,side:THREE.DoubleSide}),blossoms[0]);batch(root,flowerGeo,mat(0x9d74c9,{roughness:.87,side:THREE.DoubleSide}),blossoms[1]);

  let palmFrondGeometry;
  const palmRings=new Map();
  function palm(x,z){
    const g=new THREE.Group();g.position.set(x,-.22,z);root.add(g);
    cyl(g,0,1.23,0,.073,.12,2.5,mat(0xc2b19a,{map:bark.map,bumpMap:bark.map,bumpScale:.035,roughness:.92}),14);
    for(let i=0;i<9;i++){if(!palmRings.has(i))palmRings.set(i,new THREE.TorusGeometry(.081+i*.004,.006,4,12));const ring=mesh(palmRings.get(i),mat(0x807260,{roughness:1}),g,0,2.1-i*.19,0);ring.rotation.x=Math.PI/2;}
    const palmMat=mat(0x4d7137,{vertexColors:true,side:THREE.DoubleSide,roughness:.82});
    if(!palmFrondGeometry){
      const positions=[],indices=[],colors=[];
      const point=(t)=>new THREE.Vector3(t*1.25,.4*Math.sin(Math.PI*t*.95)-.56*t*t,.022*Math.sin(t*9));
      const vertex=(v,c)=>{positions.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);};
      // A narrow, curved rachis supports separate folded leaflets. Gaps,
      // unequal tips and drooping ends let light through the full crown.
      for(let j=0;j<=24;j++){
        const t=j/24,p=point(t),radius=.009*(1-t*.85);
        for(let q=0;q<5;q++){let a=q*Math.PI*2/5;vertex(new THREE.Vector3(p.x,p.y+Math.cos(a)*radius,p.z+Math.sin(a)*radius),new THREE.Color(0x88935b));}
        if(j<24)for(let q=0;q<5;q++){let a=j*5+q,b=j*5+(q+1)%5;indices.push(a,b,a+5,b,b+5,a+5);}
      }
      for(let j=0;j<22;j++)for(const side of [-1,1]){
        // Occasional missing/torn leaflets prevent a cut-paper silhouette.
        if((j*7+(side>0?3:0))%29===0)continue;
        const t=.08+j*.04,p=point(t),length=(.17+.24*Math.sin(t*Math.PI))*(1+(side>0?.06:-.05)),base=positions.length/3;
        const color=new THREE.Color().setHSL(.24+.025*Math.sin(j*1.7),.32+.08*Math.cos(j),.25+.045*Math.sin(j*2.3+side));
        for(let k=0;k<=5;k++){
          const u=k/5,width=Math.sin(Math.PI*u)*(.022+.008*Math.sin(j*1.4)),edgeX=p.x+u*(.085+.045*Math.sin(j)),edgeZ=p.z+side*u*length;
          const yy=p.y-.035*u-.22*u*u*(.55+t)+Math.sin(u*Math.PI)*.026;
          for(let edge=-1;edge<=1;edge++){
            const v=new THREE.Vector3(edgeX+edge*width,yy+(edge===0?.009*Math.sin(u*Math.PI):0),edgeZ);
            vertex(v,color.clone().multiplyScalar(edge===0?1.21:edge===side?.89:1));
          }
          if(k<5){const a=base+k*3;indices.push(a,a+1,a+3,a+1,a+4,a+3,a+1,a+2,a+4,a+2,a+5,a+4);}
        }
      }
      palmFrondGeometry=new THREE.BufferGeometry();palmFrondGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));palmFrondGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));palmFrondGeometry.setIndex(indices);palmFrondGeometry.computeVertexNormals();
    }
    for(let n=0;n<11;n++){
      const frond=mesh(palmFrondGeometry,palmMat,g,0,2.43+(n%3)*.048,0);
      frond.rotation.set((n%3-1)*.11,-n*2.399,.1*Math.sin(n*4.3)+(n>8?.21:0));
      const size=n>8?.75:1+Math.sin(n*2.7)*.12;frond.scale.set(size,1,size);
    }
  }
  if(stage===2)for(const s of [-1,1])for(const z of [-4.3,.1,4.5])palm(s*9.85,z);
  if(stage===0){palm(-11.8,-11.2);palm(11.8,-11.2);}

  function flagTexture(){
    const c=document.createElement('canvas');c.width=512;c.height=320;const p=c.getContext('2d');
    p.fillStyle='#15934b';p.fillRect(0,0,512,320);p.fillStyle='#ffe357';p.beginPath();p.moveTo(56,160);p.lineTo(256,30);p.lineTo(456,160);p.lineTo(256,290);p.closePath();p.fill();
    p.fillStyle='#204593';p.beginPath();p.arc(256,160,83,0,Math.PI*2);p.fill();p.save();p.beginPath();p.arc(256,160,82,0,Math.PI*2);p.clip();
    p.strokeStyle='#fff9df';p.lineWidth=16;p.beginPath();p.ellipse(222,215,120,68,.2,Math.PI,Math.PI*2);p.stroke();p.restore();
    p.fillStyle='#fffde7';for(let i=0;i<22;i++){let a=i*2.399,r=18+((i*17)%52);p.beginPath();p.arc(256+Math.cos(a)*r,165+Math.sin(a)*r,1.8,0,Math.PI*2);p.fill();}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  const flagMat=new THREE.MeshStandardMaterial({map:flagTexture(),side:THREE.DoubleSide,roughness:.82});
  function flag(x,z,height=3.5){
    cyl(root,x,height/2-.1,z,.025,.042,height,mat(0xc2c0a5,{metalness:.86,roughness:.27}),12);
    cyl(root,x,-.12,z,.21,.29,.17,limestone,20);sphere(root,x,height-.1,z,.059,mat(0xe0c369,{metalness:.7,roughness:.25}));
    const f=mesh(new THREE.PlaneGeometry(1.12,.7,20,8),flagMat,root,x+.56,height-.62,z);f.userData.flagWidth=1.12;f.userData.flagBaseX=0;world.flags.push(f);
  }
  if(stage===0){flag(-7.72,-6.53,3.1);flag(7.72,-6.53,3.1);}
  if(stage===1)flag(7.85,-6.4,3.35);
  if(stage===2)flag(5.5,-6.85,3.2);
  if(stage===3)flag(0,-6.8,3.8);

  function bench(x,z,angle=0){
    const g=new THREE.Group();g.position.set(x,-.16,z);g.rotation.y=angle;root.add(g);
    const wood=mat(0xb08f68,{map:woodMap,bumpMap:woodMap,bumpScale:.025,roughness:.62});
    for(let n=0;n<4;n++)box(g,0,.37,-.18+n*.105,1.06,.05,.08,wood);
    for(let n=0;n<3;n++)box(g,0,.52+n*.09,-.245,1.06,.065,.05,wood);
    for(const s of [-1,1]){box(g,s*.4,.19,0,.045,.36,.4,metal);box(g,s*.4,.51,-.26,.043,.47,.043,metal);}
  }
  for(const s of [-1,1]){bench(s*(stage===3?8.5:8.85),stage===1?3.7:4.9,s*Math.PI/2);if(stage===1)bench(s*8.85,-1.8,s*Math.PI/2);}

  const bulbMat=mat(0xffefb1,{emissive:0xffc56b,emissiveIntensity:2.1,roughness:.18});
  let glowMap=world.glowTexture;
  if(!glowMap){const c=document.createElement('canvas');c.width=c.height=64;const p=c.getContext('2d'),g=p.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'#fff3cdaa');g.addColorStop(.2,'#ffc67555');g.addColorStop(1,'#ffa33e00');p.fillStyle=g;p.fillRect(0,0,64,64);glowMap=new THREE.CanvasTexture(c);}
  for(const s of [-1,1])for(const z of stage===2?[-4.8,4.7]:stage===1?[-3.2,4.8]:[-6.35,1.03,5.85]){
    const x=s*8.12;
    cyl(root,x,1.06,z,.035,.066,2.45,metal,12);
    box(root,x,2.3,z,.46,.08,.33,metal);box(root,x,2.255,z,.34,.035,.25,bulbMat);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:0xffd184,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.set(x,2.25,z);glow.scale.set(.9,.9,1);root.add(glow);
  }
  // Polished bollards and embedded warm guide lights keep the plaza legible.
  const bollards=[],inlays=[];
  for(const s of [-1,1])for(let z=-5.6;z<=5.8;z+=1.45){bollards.push([s*7.96,.07,z,.065,.47,.065]);inlays.push([s*8.07,-.195,z+.38,.1,.026,.22]);}
  batch(root,geo.box,metal,bollards);batch(root,geo.box,bulbMat,inlays);

  // Low planting beds, broad avenues and ministry silhouettes fill the
  // surroundings without placing scenery in front of the playable grid.
  const asphalt=mat(0x9ba4a0,{map:roadMap,bumpMap:roadMap,bumpScale:.035,roughness:.92}),kerb=mat(0xbabdb0,{map:graniteMap,bumpMap:graniteMap,bumpScale:.04,roughness:.77}),paint=mat(0xe7dfbd,{roughness:.94});
  box(root,0,-.4,-15.1,40,.07,3.0,asphalt);
  box(root,0,-.335,-13.56,40,.15,.16,kerb);
  box(root,0,-.335,-16.66,40,.15,.16,kerb);
  for(let x=-19;x<20;x+=2.0)box(root,x,-.357,-15.1,.94,.014,.04,paint);
  for(const s of [-1,1]){
    box(root,s*11.85,-.345,0,.15,.14,23.8,kerb);
    if(stage===0||stage===3)for(let k=0;k<8;k++)box(root,s*(stage===3?12.1:10.9),-.276,6.15+k*.19,stage===3?1.8:1.17,.009,.085,paint);
    box(root,s*14.9,-.405,-1,5.85,.05,.22,limestone);
    for(const z of stage===1?[]:stage===2?[-2.2,2.1]:[-8,0,8]){
      const bx=s*(stage===2?8.9:13.8),width=stage===2?.9:1.6,depth=stage===2?2.2:3.8;
      box(root,bx,-.22,z,width,.14,depth,kerb);
      box(root,bx,-.134,z,width-.13,.045,depth-.2,mat(0x645440));
      const shrubs=[];
      for(let i=0;i<120;i++){const xx=bx+(random()-.5)*(width-.2),zz=z+(random()-.5)*(depth-.3),size=.17+random()*.12;shrubs.push([xx,-.04+random()*.19,zz,size,size,size,random()*2,random()*6.28,random()*2]);}
      batch(root,fineLeaf,leafMats[0],shrubs);
    }
    if(stage===0||stage===3)box(root,s*(stage===0?9.4:8.67),-.19,0,stage===0?1.65:.72,.08,11.65,mat(0xffffff,{map:groundMap,bumpMap:groundMap,bumpScale:.025,roughness:1}));
    if(stage===1){
      box(root,s*9.05,-.195,0,1.6,.065,12.8,mat(0x737c76,{map:graniteMap,bumpMap:graniteMap,bumpScale:.045,roughness:.55}));
      for(let z=-5.5;z<=5.5;z+=1.1)box(root,s*9.05,-.15,z,1.42,.025,.83,mat(0xd8d7c9,{map:stoneMap,bumpMap:stoneMap,bumpScale:.03,roughness:.48}));
    }
  }
  const meadow=[[],[]];
  for(let n=0;n<(stage===1?0:1000);n++){
    const x=(random()-.5)*40,z=-19+random()*33;
    if(Math.abs(x)<11.95&&z<11.1&&z>-13.8)continue;
    if(z>-16.8&&z<-13.4)continue;
    const s=.07+random()*.09;meadow[n%2].push([x,-.4,z,s,s*2.6,s,Math.PI/2,random()*6.28,random()*.3]);
  }
  for(let n=0;n<2;n++){const grass=batch(root,fineLeaf,mat(n?0x7c8752:0x536d42,{side:THREE.DoubleSide,roughness:1}),meadow[n]);if(grass)grass.castShadow=false;}
  // Background ministries use a single tiled facade rather than thousands
  // of separate window meshes. Their smaller contrast implies distance.
  function ministryTexture(){const c=document.createElement('canvas');c.width=256;c.height=512;const p=c.getContext('2d');p.fillStyle='#c5d0bf';p.fillRect(0,0,256,512);for(let y=0;y<20;y++)for(let x=0;x<8;x++){p.fillStyle=(x+y*3)%17===0?'#dcc291':['#678985','#73938c','#8fa49a'][(x+y)%3];p.fillRect(x*32+3,y*25.6+3,26,19);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
  const distantFace=mat(0xffffff,{map:ministryTexture(),roughness:.33,metalness:.39}),distantStone=mat(0xd2d9c9,{map:stoneMap,bumpMap:stoneMap,bumpScale:.027,roughness:.57});
  for(const s of [-1,1])for(let k=0;k<(stage===3?4:stage===0?2:0);k++){
    const x=s*(4.2+k*4.8),z=-20-k*.6,h=2.75+(k%2)*.5;
    box(root,x,h/2-.42,z,2.45,h,3.1,distantStone);
    box(root,x,h/2-.4,z+1.56,2.2,h-.23,.013,distantFace);
    box(root,x,h-.38,z,2.53,.1,3.16,white);
  }
  if(stage===3)for(const s of [-1,1])for(let k=0;k<3;k++){
    const x=s*10.3,z=-5.4+k*4.4,h=2.08+(k%2)*.22;
    box(root,x,h/2-.18,z,1.67,h,3.35,distantStone);
    box(root,x-s*.846,h/2-.17,z,.018,h-.28,3.1,distantFace);
    box(root,x,h-.105,z,1.83,.13,3.49,white);
    box(root,x,-.055,z,1.95,.2,3.62,limestone);
    for(let zz=z-1.5;zz<=z+1.51;zz+=.3)box(root,x-s*.9,h/2-.14,zz,.16,h-.18,.052,white);
    for(let yy=.2;yy<h-.1;yy+=.29)box(root,x-s*.92,yy,z,.06,.027,3.22,metal);
    // Long sunshade fins and glass fronts face the green monumental axis.
    box(root,x-s*1.0,h-.25,z,.35,.08,3.45,white);
  }
  // Television cameras and coiled cables make the setting feel inhabited.
  const rubber=mat(0x171f21,{roughness:.87}),cameraMetal=mat(0x303a3b,{metalness:.48,roughness:.34});
  function cameraProp(x,z,angle){
    const g=new THREE.Group();g.position.set(x,-.2,z);g.rotation.y=angle;root.add(g);
    for(let n=0;n<3;n++){
      const a=n*Math.PI*2/3,start=new THREE.Vector3(0,.72,0),end=new THREE.Vector3(Math.cos(a)*.3,0,Math.sin(a)*.3),direction=end.clone().sub(start);
      const leg=mesh(new THREE.CylinderGeometry(.013,.023,direction.length(),6),cameraMetal,g);leg.position.copy(start.add(end).multiplyScalar(.5));leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
      box(g,end.x,.008,end.z,.07,.016,.07,rubber);
    }
    cyl(g,0,.7,0,.062,.065,.12,cameraMetal,12);
    box(g,0,.86,0,.28,.22,.43,cameraMetal);
    const lens=cyl(g,0,.84,.28,.095,.11,.17,rubber,18);lens.rotation.x=Math.PI/2;
    const lensGlass=mesh(new THREE.CircleGeometry(.073,20),mat(0x19798c,{metalness:.84,roughness:.1}),g,0,.84,.37);lensGlass.castShadow=false;
    box(g,.18,.93,-.06,.12,.13,.07,rubber);box(g,.18,.93,-.019,.092,.096,.014,mat(0x326e73,{emissive:0x164651,emissiveIntensity:.4}));
    box(g,0,1.016,-.025,.17,.03,.23,rubber);box(g,0,1.055,-.025,.13,.035,.025,rubber);
    sphere(g,-.115,.98,.21,.019,mat(0xc93424,{emissive:0xb00d05,emissiveIntensity:.7}));
    const cable=mesh(new THREE.TorusGeometry(.17,.009,5,28),rubber,g,.39,.012,-.12);cable.rotation.x=Math.PI/2;
  }
  cameraProp(-8.57,3.45,.7);cameraProp(8.57,3.45,-.7);
  // Collapse repeated static fixtures into GPU instances after their local
  // transforms are resolved. The animated flags and water keep their meshes.
  root.updateMatrixWorld(true);
  const groups=new Map(),inverseRoot=root.matrixWorld.clone().invert();
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||world.flags.includes(o)||Array.isArray(o.material))return;
    const key=o.geometry.uuid+o.material.uuid;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
  });
  for(const objects of groups.values())if(objects.length>=3){
    const first=objects[0],instance=new THREE.InstancedMesh(first.geometry,first.material,objects.length);
    objects.forEach((o,i)=>instance.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverseRoot,o.matrixWorld)));
    instance.castShadow=true;instance.receiveShadow=true;instance.name='Instanced plaza fixtures';
    objects.forEach(o=>o.removeFromParent());root.add(instance);
  }
  root.userData.architectureName=names[stage];
  return root;
}
