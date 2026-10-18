import * as THREE from './vendor/three.module.js';

// The identity lives on the playable floor and its immediate rim, where it
// remains visible even when a landscape phone crops the distant monuments.
export const STAGE_THEMES = [
  {name:'Congresso',floorColors:[0x17447d,0x20558e,0x1b4b83],frame:0x332b35,trim:0xd3ad56,block:0x977450,inset:0x244d77,metal:0xa98b54,roughness:.88},
  {name:'STF',floorColors:[0xe8e8df,0x272e34,0xd2d7d3],frame:0x1a2329,trim:0xc6c5b6,block:0xe1dfd5,inset:0x18282b,metal:0x738c92,roughness:.24},
  {name:'Planalto',floorColors:[0xdaeff0,0xbcdce7,0xe9f2ed],frame:0x266675,trim:0xdfeee8,block:0xf3f4e8,inset:0x37a5b5,metal:0x7da9b2,roughness:.3},
  {name:'Esplanada',floorColors:[0xd9b180,0xe5c59d,0xc8a078,0x77936a],frame:0x39463b,trim:0xa3b886,block:0xab9270,inset:0x437748,metal:0x617d67,roughness:.82}
];

export function floorColor(stage,x,y){
  if(stage===1)return (x+y)%2;
  if(stage===2)return x===7||y===5?2:(x+y)%2;
  if(stage===3)return x===7?3:(x*3+y)%3;
  return (x+y)%3;
}

export function decorateArena(world,stage=0){
  const root=new THREE.Group();root.name=`Arena identity — ${STAGE_THEMES[stage].name}`;world.scene.add(root);
  const materials=new Map(),unitBox=new THREE.BoxGeometry(1,1,1);
  function material(c,extra={}){const key=c+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.6,...extra}));return materials.get(key);}
  function mesh(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;root.add(o);return o;}
  function box(x,y,z,w,h,d,c,extra={}){const o=mesh(unitBox,material(c,extra),x,y,z);o.scale.set(w,h,d);return o;}
  function decal(draw,w,d,x=0,z=0,size=1024,y=.199){
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=Math.round(size*d/w);const ctx=canvas.getContext('2d');
    draw(ctx,canvas.width,canvas.height);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    const o=mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.71,metalness:.14,depthWrite:false,side:THREE.DoubleSide}),x,y,z);o.rotation.x=-Math.PI/2;return o;
  }
  function line(p,points,color,width=4){p.strokeStyle=color;p.lineWidth=width;p.beginPath();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.stroke();}
  function balance(p,w,h,color){
    p.save();p.translate(w/2,h/2);p.strokeStyle=color;p.fillStyle=color;p.lineWidth=w*.035;p.lineCap='round';p.lineJoin='round';
    p.beginPath();p.moveTo(0,-h*.32);p.lineTo(0,h*.29);p.moveTo(-w*.27,h*.29);p.lineTo(w*.27,h*.29);p.moveTo(-w*.34,-h*.2);p.lineTo(w*.34,-h*.2);p.stroke();
    p.beginPath();p.arc(0,-h*.33,w*.045,0,Math.PI*2);p.fill();
    for(const s of [-1,1]){const x=s*w*.29;p.lineWidth=w*.013;p.beginPath();p.moveTo(x,-h*.2);p.lineTo(x-w*.105,h*.05);p.lineTo(x+w*.105,h*.05);p.closePath();p.stroke();p.beginPath();p.ellipse(x,h*.06,w*.115,h*.085,0,0,Math.PI);p.fill();}
    p.restore();
  }
  const floorW=14.9,floorD=10.9;
  if(stage===0){
    // Deep blue plenary carpet, concentric brass seating arcs and a sunburst
    // echo the Chamber of Deputies without adding any collision geometry.
    decal((p,w,h)=>{
      const cx=w*.5,cy=h*.08;
      p.strokeStyle='#ddbd71';p.lineWidth=3;
      for(let k=0;k<7;k++){p.beginPath();p.ellipse(cx,cy,w*(.13+k*.095),h*(.2+k*.133),0,0,Math.PI);p.stroke();}
      p.globalAlpha=.48;p.lineWidth=1.5;
      for(let i=0;i<13;i++){const a=Math.PI*(.12+i*.063);p.beginPath();p.moveTo(cx+Math.cos(a)*w*.12,cy+Math.sin(a)*h*.16);p.lineTo(cx+Math.cos(a)*w*.7,cy+Math.sin(a)*h*1.1);p.stroke();}
      p.globalAlpha=1;p.lineWidth=5;p.strokeRect(11,11,w-22,h-22);
      p.lineWidth=1.5;p.strokeRect(21,21,w-42,h-42);
    },floorW,floorD);
    for(const s of [-1,1]){
      box(s*7.8,.24,0,.31,.12,11.65,0x5b3e2e,{roughness:.57});
      box(s*7.8,.308,0,.29,.023,11.65,0xc5a150,{metalness:.63,roughness:.3});
      box(0,.24,s*5.8,15.8,.12,.31,0x5b3e2e,{roughness:.57});
      box(0,.308,s*5.8,15.8,.023,.29,0xc5a150,{metalness:.63,roughness:.3});
      // Blue upholstered, wood-framed plenary seats on the top and bottom rim.
      for(let x=-6.4;x<=6.5;x+=1.6){
        box(x,.31,s*5.84,.69,.09,.42,0x264b72,{roughness:.94});
        box(x,.46,s*6.04,.7,.29,.075,0x254869,{roughness:.87});
        for(const a of [-1,1])box(x+a*.4,.38,s*5.85,.06,.15,.47,0x684733);
      }
    }
    decal((p,w,h)=>{p.strokeStyle='#e2c785';p.lineWidth=7;p.beginPath();p.arc(w*.31,h*.5,w*.16,Math.PI,Math.PI*2);p.stroke();p.beginPath();p.arc(w*.69,h*.3,w*.16,0,Math.PI);p.stroke();p.fillStyle='#e2c785';p.fillRect(w*.465,h*.18,w*.028,h*.48);p.fillRect(w*.51,h*.18,w*.028,h*.48);},2.3,.76,0,5.52,512,.205);
  }else if(stage===1){
    // Black-and-white marble and an oversized inlaid balance give the STF
    // a formal judicial identity independent of the distant colonnade.
    decal((p,w,h)=>{
      p.strokeStyle='#9da89f';p.lineWidth=4;p.strokeRect(9,9,w-18,h-18);
      p.lineWidth=1.5;p.strokeRect(18,18,w-36,h-36);
      p.strokeStyle='#e9eee2';p.globalAlpha=.15;p.lineWidth=1;
      for(let k=0;k<15;k++){p.beginPath();for(let x=0;x<w;x+=10){const yy=k*h/14+Math.sin(x*.013+k)*13+Math.sin(x*.037+k)*3;x?p.lineTo(x,yy):p.moveTo(x,yy);}p.stroke();}
    },floorW,floorD);
    decal((p,w,h)=>{p.fillStyle='#152c2cc9';p.beginPath();p.arc(w/2,h/2,w*.47,0,Math.PI*2);p.fill();p.strokeStyle='#b9c9b5';p.lineWidth=4;p.stroke();balance(p,w*.9,h*.9,'#d6d7bd');},2.25,2.25,.11,.11,512,.202);
    for(const s of [-1,1]){
      box(s*7.78,.24,0,.3,.12,11.75,0x202b30,{metalness:.27,roughness:.2});box(0,.24,s*5.79,15.83,.12,.3,0x202b30,{metalness:.27,roughness:.2});
      box(s*7.8,.307,0,.04,.015,11.63,0xd3d1bb,{metalness:.65,roughness:.24});box(0,.307,s*5.81,15.7,.015,.04,0xd3d1bb,{metalness:.65,roughness:.24});
      for(const z of [-4.4,0,4.4]){
        box(s*7.85,.29,z,.44,.15,.59,0xcacfc5,{roughness:.3});
        box(s*7.85,.54,z,.23,.38,.29,0xe2e5db,{roughness:.34});
        box(s*7.85,.75,z,.36,.055,.46,0xecece0,{roughness:.25});
      }
      decal((p,w,h)=>balance(p,w,h,'#c8cdaf'),1.05,.87,s*5.55,4.03,256,.203);
    }
    decal((p,w,h)=>balance(p,w,h,'#d1d1b6'),1.36,.9,0,5.65,256,.31);
  }else if(stage===2){
    // Pale blue polished stone, turquoise reflecting channels and Niemeyer
    // curves directly on the perimeter are the Planalto's visual signature.
    decal((p,w,h)=>{
      p.strokeStyle='#3f889965';p.lineWidth=3;
      for(let x=0;x<w;x+=w/15){p.beginPath();p.moveTo(x,0);p.lineTo(x,h);p.stroke();}
      p.strokeStyle='#f8ffffc9';p.lineWidth=5;p.strokeRect(12,12,w-24,h-24);
      p.strokeStyle='#659faa6b';p.lineWidth=2;p.strokeRect(23,23,w-46,h-46);
      for(const s of [-1,1]){const cx=w*.5+s*w*.22;p.beginPath();p.moveTo(cx-w*.1,h*.25);p.bezierCurveTo(cx+w*.17,h*.36,cx+w*.17,h*.64,cx-w*.1,h*.75);p.stroke();}
    },floorW,floorD);
    const waterMat=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float time;varying vec2 vUv;void main(){float a=sin(vUv.x*90.+vUv.y*27.+time*1.6);float b=sin(vUv.y*67.-vUv.x*13.-time);float r=pow(max(0.,a*b),5.);vec3 c=mix(vec3(.025,.34,.45),vec3(.15,.69,.7),vUv.x*.4+.25)+vec3(.45,.65,.6)*r*.6;gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,side:THREE.DoubleSide});
    world.waters ||= [];world.waters.push(waterMat);
    for(const s of [-1,1]){
      box(s*7.79,.225,0,.48,.11,11.92,0xe8f3eb,{roughness:.24});
      const water=mesh(new THREE.PlaneGeometry(.32,11.7),waterMat,s*7.79,.284,0);water.rotation.x=-Math.PI/2;
      box(0,.23,s*5.84,15.9,.12,.37,0xf3f3e8,{roughness:.3});
      for(const x of [-5.4,-2.7,2.7,5.4]){
        const shape=new THREE.Shape();shape.moveTo(-.29,0);shape.bezierCurveTo(.31,.17,.31,.47,-.29,.65);shape.lineTo(-.08,.65);shape.bezierCurveTo(.6,.46,.6,.17,-.08,0);shape.closePath();
        const c=mesh(new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2}),material(0xf9f7e8,{roughness:.24}),x,.29,s*5.92);c.castShadow=true;
      }
    }
    decal((p,w,h)=>{p.strokeStyle='#5babb2';p.lineWidth=9;for(let i=0;i<3;i++){p.beginPath();p.moveTo(w*(.12+i*.29),h*.08);p.bezierCurveTo(w*(.39+i*.29),h*.3,w*(.39+i*.29),h*.7,w*(.12+i*.29),h*.92);p.stroke();}},1.85,.7,0,5.72,512,.297);
  }else{
    // Terracotta civic paving and landscaped boulevards make Esplanada warm,
    // open and urban, as opposed to the three institutional interiors.
    decal((p,w,h)=>{
      p.strokeStyle='#f8d7a75c';p.lineWidth=1.5;
      for(let y=0;y<h;y+=h/22){p.beginPath();p.moveTo(0,y);p.lineTo(w,y);p.stroke();for(let x=-(Math.round(y/(h/22))%2)*w/30;x<w;x+=w/15){p.beginPath();p.moveTo(x,y);p.lineTo(x,y+h/22);p.stroke();}}
      p.fillStyle='#ded7b65c';p.fillRect(w*.462,0,w*.076,h);
      p.strokeStyle='#e8dcb6';p.lineWidth=4;p.strokeRect(10,10,w-20,h-20);
      p.lineWidth=2;p.strokeRect(18,18,w-36,h-36);
    },floorW,floorD);
    for(const s of [-1,1]){
      box(s*7.81,.22,0,.5,.1,11.86,0x6a8550,{roughness:1});
      box(s*8.03,.275,0,.06,.06,11.95,0xc7bd98,{roughness:.85});
      box(0,.22,s*5.85,15.9,.1,.4,0x3e504b,{roughness:.93});
      for(let x=-6.5;x<6.6;x+=.9)box(x,.278,s*5.85,.42,.012,.027,0xe4d9ad,{roughness:.8});
      for(const z of [-4.1,-1.35,1.35,4.1]){
        box(s*7.81,.27,z,.37,.09,.96,0x567342,{roughness:1});
        for(let n=0;n<4;n++){const stem=mesh(new THREE.ConeGeometry(.065,.17,5),material(n%2?0x8c9a5d:0x395d3a,{roughness:1}),s*7.81+(n%2-.5)*.17,.365,z+(Math.floor(n/2)-.5)*.33);stem.rotation.z=(n%2-.5)*.19;}
      }
    }
    for(let n=0;n<8;n++)box(-.82+n*.235,.281,5.86,.12,.013,.31,0xeae4c8,{roughness:.77});
    decal((p,w,h)=>{p.strokeStyle='#dfe4c9';p.lineWidth=8;p.beginPath();p.moveTo(w*.18,h*.8);p.lineTo(w*.5,h*.22);p.lineTo(w*.82,h*.8);p.moveTo(w*.5,h*.22);p.lineTo(w*.5,h*.8);p.stroke();},1.08,.72,0,-4.02,256,.204);
  }
  // Repeated rims/seats/fixtures become one draw per material. Decal and
  // water meshes remain separate so their transparency/animation survives.
  root.updateMatrixWorld(true);
  const groups=new Map();root.traverse(o=>{if(o.isMesh&&o.geometry===unitBox){const key=o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}});
  for(const group of groups.values()){
    const inst=new THREE.InstancedMesh(unitBox,group[0].material,group.length);group.forEach((o,i)=>inst.setMatrixAt(i,o.matrix));inst.receiveShadow=true;inst.castShadow=false;group.forEach(o=>root.remove(o));root.add(inst);
  }
  return root;
}
