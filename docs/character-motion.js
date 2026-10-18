// Visual articulation only: simulation positions, facing and collision boxes are never mutated.
const BASE={shoulder:127,elbow:160,wrist:185,hips:201,shoulderHalf:40,wristHalf:49,width:23,handLength:24,skin:'#d59b73'};
const RIGS={
 lula:{shoulder:102,elbow:137,wrist:160,hips:185,shoulderHalf:46,wristHalf:66,width:28,handLength:34,leftCut:92,profileShoulder:116,profileElbow:147,profileShoulderHalf:22,skin:'#d79b70'},
 flavio:{shoulder:103,elbow:138,wrist:161,hips:188,shoulderHalf:46,wristHalf:66,width:28,handLength:34,profileShoulder:116,profileElbow:148,profileShoulderHalf:22,skin:'#dea077'},
 damares:{shoulder:125,elbow:154,wrist:174,hips:194,shoulderHalf:43,wristHalf:59,width:24},
 erika:{shoulder:119,elbow:153,wrist:175,hips:183,shoulderHalf:31,wristHalf:37,width:17,handLength:19,profileWristHalf:8,profileWidth:1.15,skin:'#b16f49',longHair:true},
 marina:{shoulder:123,elbow:155,wrist:180,hips:191,shoulderHalf:31,wristHalf:37,width:17,skin:'#bb8058'},
 moro:{shoulder:151,elbow:175,wrist:195,hips:212,shoulderHalf:43,wristHalf:49,width:24,handLength:21},
 messias:{shoulder:151,elbow:176,wrist:195,hips:212,shoulderHalf:43,wristHalf:49,width:24,handLength:21},
 fux:{shoulder:139,elbow:172,wrist:197,hips:218,shoulderHalf:44,wristHalf:52,width:25},
 nikolas:{shoulder:128,elbow:159,wrist:184,hips:194,shoulderHalf:35,wristHalf:45,width:20},
 janones:{shoulder:126,elbow:160,wrist:186,hips:198,shoulderHalf:39,wristHalf:49,width:23},
 boulos:{shoulder:121,elbow:155,wrist:181,hips:201,shoulderHalf:39,wristHalf:53,width:25},
 putin:{shoulder:134,elbow:162,wrist:184,hips:203,shoulderHalf:33,wristHalf:49,width:22},
 xi:{shoulder:134,elbow:164,wrist:187,hips:203,shoulderHalf:33,wristHalf:48,width:22},
 bukele:{shoulder:134,elbow:162,wrist:185,hips:201,shoulderHalf:33,wristHalf:49,width:23},
 trump:{shoulder:134,elbow:162,wrist:185,hips:201,shoulderHalf:33,wristHalf:49,width:23}
};
const cache=new WeakMap();
export function actorRig(id){return {...BASE,...RIGS[id]};}
function canvas(w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function cut(source,points,top,bottom){
 const x=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))-1),right=Math.min(256,Math.ceil(Math.max(...points.map(p=>p[0])))+1),y=Math.max(0,Math.floor(top)),h=Math.min(256,Math.ceil(bottom))-y,c=canvas(right-x,h),ctx=c.getContext('2d');
 ctx.save();ctx.translate(-x,-y);polygon(ctx,points);ctx.clip();ctx.drawImage(source,0,0);ctx.restore();return {c,x,y};
}
function armGeometry(r,side,direction){
 const profile=direction===1||direction===3,near=direction===1?-1:1;
 const shoulderX=profile?128+near*(r.profileShoulderHalf??12):128+side*r.shoulderHalf,wristX=profile?128+near*(r.profileWristHalf??14):128+side*r.wristHalf;
 const elbowX=shoulderX+(wristX-shoulderX)*.7,w=r.width*(profile?(r.profileWidth??.95):1);
 const outside=side<0?0:256,inside=(x,amount)=>direction===2&&side<0&&r.leftCut?Math.max(r.leftCut,x+amount):x-side*amount;
 const points=r.longHair?[[inside(shoulderX,w*.19),r.shoulder-4],[shoulderX+side*w*.48,r.shoulder-4],[elbowX+side*w*.62,r.elbow],[wristX+side*w*.62,r.wrist+r.handLength],[inside(wristX,w*.5),r.wrist+r.handLength],[inside(elbowX,w*.42),r.elbow]]:[[inside(shoulderX,w*(profile&&r.profileShoulderHalf ? .5 : .19)),r.shoulder-4],[outside,r.shoulder-4],[outside,r.wrist+r.handLength],[inside(wristX,w*.5),r.wrist+r.handLength],[inside(elbowX,w*.42),r.elbow]];
 if(profile&&r.handMinX!==undefined){const handEdge=side<0?r.handMaxX+2:r.handMinX-2;points[3][0]=handEdge;points.splice(4,0,[handEdge,r.wrist]);}
 return {side,shoulder:{x:shoulderX,y:r.shoulder},elbow:{x:elbowX,y:r.elbow},wrist:{x:wristX,y:r.wrist},points};
}
function sourceHand(ctx,r,side,profile=false){
 if(!ctx.getImageData)return null;
 const pixels=ctx.getImageData(0,0,256,256).data,seen=new Uint8Array(65536),groups=[];
 const minX=profile?(side<0?76:116):(side>0?146:20),maxX=profile?(side<0?141:181):(side>0?237:111);
 const allowed=(x,y)=>{if(x<minX||x>=maxX||y<Math.max(r.shoulder+18,r.wrist-18)||y>(profile?r.hips+30:r.wrist+r.handLength+5))return false;const n=(y*256+x)*4,R=pixels[n],G=pixels[n+1],B=pixels[n+2];return pixels[n+3]>160&&R>70&&G>35&&B>15&&R-G>8&&R>G*1.07&&R<G*2&&G>B*1.05;};
 for(let y=Math.floor(Math.max(r.shoulder+18,r.wrist-24));y<239;y++)for(let x=minX;x<maxX;x++){
  const index=y*256+x;if(seen[index]||!allowed(x,y))continue;const queue=[[x,y]];seen[index]=1;let count=0,sumX=0,minX=x,maxX=x,minY=y,maxY=y;
  while(queue.length){const [a,b]=queue.pop();count++;sumX+=a;minX=Math.min(minX,a);maxX=Math.max(maxX,a);minY=Math.min(minY,b);maxY=Math.max(maxY,b);for(const [u,v]of[[a-1,b],[a+1,b],[a,b-1],[a,b+1]]){const k=v*256+u;if(k>=0&&k<65536&&!seen[k]&&allowed(u,v)){seen[k]=1;queue.push([u,v]);}}}
  if(count>=12&&maxY>r.wrist+2)groups.push({count,x:sumX/count,minX,maxX,minY,maxY});
 }
 return groups.sort((a,b)=>b.maxY-a.maxY||b.count-a.count)[0]||null;
}
function trimHand(piece,wrist){
 const ctx=piece.c.getContext('2d');if(!ctx.getImageData)return;const image=ctx.getImageData(0,0,piece.c.width,piece.c.height),data=image.data;
 for(let y=Math.max(0,Math.floor(wrist-piece.y+2));y<piece.c.height;y++)for(let x=0;x<piece.c.width;x++){const n=(y*piece.c.width+x)*4,R=data[n],G=data[n+1],B=data[n+2];if(!(R>G*1.04&&R>B*1.17&&R<G*2.8))data[n+3]=0;}
 ctx.putImageData(image,0,0);
}
function pieces(image,sx,sy,sw,sh,id,direction){
 let entries=cache.get(image);if(!entries){entries=new Map();cache.set(image,entries);}
 const key=[sx,sy,sw,sh,id,direction].join(':');if(entries.has(key))return entries.get(key);
 const profile=direction===1||direction===3,r=actorRig(id),body=canvas(),ctx=body.getContext('2d',{willReadFrequently:true});if(profile&&r.profileShoulder){r.shoulder=r.profileShoulder;r.elbow=r.profileElbow;}ctx.drawImage(image,sx,sy,sw,sh,0,0,256,256);
 const sides=profile?[direction===1?-1:1]:[-1,1],arms=[];
 for(const side of sides){const hand=profile&&id!=='lula'&&id!=='flavio'?null:sourceHand(ctx,r,side,profile),wrist=hand?Math.max(r.wrist-7,hand.minY+1):r.wrist,fit=hand?{...r,wrist,wristHalf:Math.abs(hand.x-128),profileWristHalf:Math.abs(hand.x-128),handMinX:hand.minX,handMaxX:hand.maxX,handLength:hand.maxY-wrist+4}:r;const a=armGeometry(fit,side,direction),fore=cut(body,a.points,fit.elbow-3,fit.wrist+fit.handLength);if(profile)trimHand(fore,fit.wrist);const cx=a.shoulder.x-side*14,cap=cut(body,[[cx-6,fit.shoulder+8],[cx+6,fit.shoulder+8],[cx+6,fit.shoulder+20],[cx-6,fit.shoulder+20]],fit.shoulder+8,fit.shoulder+20);const palm=cut(body,a.points,fit.wrist,fit.wrist+fit.handLength);trimHand(palm,fit.wrist-2);if(hand){const pc=palm.c.getContext('2d'),left=hand.minX-palm.x-1,right=hand.maxX-palm.x+2;pc.clearRect(0,0,Math.max(0,left),palm.c.height);pc.clearRect(right,0,palm.c.width-right,palm.c.height);}arms.push({...a,handLength:fit.handLength,cap,palm,upper:cut(body,a.points,fit.shoulder-4,fit.elbow+3),fore,sleeve:cut(body,a.points,fit.elbow-3,fit.wrist+1)});}
 const legFill=profile?canvas():null;if(legFill)legFill.getContext('2d').drawImage(body,0,0);
 // Erase the source arms once, including hands that extend below the hip cut.
 // Cropped limb canvases keep the cache small rather than retaining full-size copies per joint.
 ctx.save();ctx.globalCompositeOperation='destination-out';for(const a of arms){polygon(ctx,a.points);ctx.fill();}ctx.restore();
 if(direction===0&&(id==='lula'||id==='flavio'))for(const a of arms){ctx.save();polygon(ctx,[[a.shoulder.x-17,r.shoulder-5],[a.shoulder.x+17,r.shoulder-5],[a.shoulder.x+15,r.shoulder+11],[a.shoulder.x-15,r.shoulder+11]]);ctx.clip();ctx.drawImage(image,sx,sy,sw,sh,0,0,256,256);ctx.restore();}
 if(legFill)for(const a of arms){
  if(r.profileShoulder){
   // Profiles have a lower painted cuff. Rebuild only the fabric hidden by that
   // arm, never stretch a full horizontal strip containing fingers or the far shoe.
   const left=a.side<0,edge=left?99:157,inner=left?130:126,patchLeft=Math.min(edge,inner),patchWidth=Math.abs(inner-edge);
   ctx.save();ctx.globalCompositeOperation='destination-over';polygon(ctx,[[left?112:144,r.shoulder-4],[edge,r.shoulder+11],[edge,r.hips-3],[left?100:156,Math.min(222,a.wrist.y+a.handLength)],[inner,Math.min(222,a.wrist.y+a.handLength)],[inner,r.shoulder-4]]);ctx.clip();
   ctx.drawImage(legFill,left?126:112,r.shoulder-4,7,r.hips-r.shoulder+4,patchLeft,r.shoulder-4,patchWidth,r.hips-r.shoulder+4);
   ctx.drawImage(legFill,left?110:140,210,8,10,patchLeft,r.hips,patchWidth,Math.min(222,a.wrist.y+a.handLength)-r.hips);ctx.restore();
   // Keep the authored shoulder cap attached to the torso while its sleeve swings.
   ctx.save();polygon(ctx,[[a.shoulder.x-21,r.shoulder-8],[a.shoulder.x+21,r.shoulder-8],[a.shoulder.x+18,r.shoulder+12],[a.shoulder.x-18,r.shoulder+12]]);ctx.clip();ctx.drawImage(legFill,0,0);ctx.restore();continue;
  }
  const outer=128+a.side*12,inside=128-a.side*5,left=Math.min(outer,inside),width=Math.abs(inside-outer);
  if(r.longHair)ctx.clearRect(a.side<0?0:128,r.elbow+8,128,Math.max(0,r.hips-r.elbow-8));
  ctx.save();polygon(ctx,[[128,r.shoulder],[outer-a.side*4,r.shoulder+8],[outer,r.hips],[inside,r.hips],[inside,r.shoulder]]);ctx.clip();ctx.drawImage(legFill,a.side<0?131:117,r.shoulder,8,r.hips-r.shoulder,left,r.shoulder,width,r.hips-r.shoulder);ctx.restore();
  const top=r.hips,start=Math.min(235,Math.max(r.hips+10,a.wrist.y+a.handLength+3)),end=Math.min(248,start+14);if(start>top){ctx.clearRect(0,top,256,end-top);ctx.drawImage(legFill,0,start,256,end-start,0,top,256,end-top);}
 }
 const result={body,arms,rig:r};entries.set(key,result);return result;
}
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
const drawPiece=(ctx,piece,origin)=>ctx.drawImage(piece.c,piece.x-origin.x,piece.y-origin.y);
export function drawActor(view,p,t,image,sx,sy,sw,sh,reduced=false){
 const ctx=view.c.getContext('2d'),dt=Math.min(.05,Math.max(0,t-(view.motionTime??t)));view.motionTime=t;
 const victory=view.victoryPose,winning=!!victory,target=!winning&&p.cool>0?1:0;
 view.stride=(view.stride??target)+(target-(view.stride??target))*Math.min(1,dt*14);
 const stride=reduced?0:view.stride,step=Math.sin(p.gait||0)*stride,breath=reduced?0:Math.sin(t*2.4+(p.id||0))*.65,profile=p.dir===1||p.dir===3;
 const direction=p.dir??2,id=p.characterId||['lula','flavio'][p.id%2];
 if(view.motionDir!==direction){view.previousDir=view.motionDir??direction;view.turnAt=t;view.motionDir=direction;}
 const blend=reduced?1:Math.min(1,(t-(view.turnAt??t))/.11),previous=[2,1,0,3][view.previousDir??direction]*sw;
 ctx.clearRect(0,0,256,256);view.motionHand=null;
 const legSwing=profile?.28:.19,armSwing=profile?.35:.23;
 view.motionPose={stride,step,direction,leftLegAngle:-step*legSwing,rightLegAngle:step*legSwing,leftArmAngle:step*armSwing,rightArmAngle:-step*armSwing,profile,winning};
 function pose(sourceX,poseDirection,alpha){
  const parts=pieces(image,sourceX,sy,sw,sh,id,poseDirection),r=parts.rig,articulatedProfile=(poseDirection===1||poseDirection===3)&&!!r.profileShoulder;ctx.save();ctx.globalAlpha=alpha;
  for(const side of [-1,1]){const phase=step*side,pivot=128+side*(profile?18:26),lift=Math.max(0,-phase)*7,overlap=profile?0:9;
   ctx.save();ctx.translate(pivot,r.hips);ctx.rotate(phase*legSwing);
   ctx.drawImage(parts.body,side<0?0:128,r.hips-overlap,128,256+overlap-r.hips,(side<0?0:128)-pivot,-overlap-lift,128,256+overlap-r.hips);ctx.restore();
  }
  const arms=[];
  for(const a of parts.arms){
   const gestureSide=victory?.gesture==='V'?1:-1,raised=winning&&poseDirection===2&&a.side===gestureSide,amount=raised?victory.raise:0;
   let upperAngle=raised?-.62*amount*a.side:-step*a.side*armSwing,foreAngle=raised?-2.65*amount*a.side:upperAngle+Math.max(0,step*a.side)*.07;
   let e=rotate(a.elbow.x-a.shoulder.x,a.elbow.y-a.shoulder.y,upperAngle),elbow={x:a.shoulder.x+e.x,y:a.shoulder.y+e.y};
   let w=rotate(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y,foreAngle),wrist={x:elbow.x+w.x,y:elbow.y+w.y};
   if(raised&&victory.gesture==='salute'){
    const target={x:a.wrist.x+(78-a.wrist.x)*amount,y:a.wrist.y+(82-a.wrist.y)*amount},dx=target.x-a.shoulder.x,dy=target.y-a.shoulder.y,l1=Math.hypot(a.elbow.x-a.shoulder.x,a.elbow.y-a.shoulder.y),l2=Math.hypot(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y),distance=Math.max(.01,Math.hypot(dx,dy)),d=Math.min(l1+l2-.01,Math.max(Math.abs(l1-l2)+.01,distance)),ux=dx/distance,uy=dy/distance,along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
    elbow={x:a.shoulder.x+ux*along+uy*height,y:a.shoulder.y+uy*along-ux*height};wrist={x:a.shoulder.x+ux*d,y:a.shoulder.y+uy*d};upperAngle=Math.atan2(elbow.y-a.shoulder.y,elbow.x-a.shoulder.x)-Math.atan2(a.elbow.y-a.shoulder.y,a.elbow.x-a.shoulder.x);foreAngle=Math.atan2(wrist.y-elbow.y,wrist.x-elbow.x)-Math.atan2(a.wrist.y-a.elbow.y,a.wrist.x-a.elbow.x);
   }
   arms.push({a,raised,amount,upperAngle,foreAngle,elbow,wrist});
   ctx.save();ctx.translate(a.shoulder.x,a.shoulder.y);if(raised||(profile||poseDirection===0&&r.profileShoulder)&&stride>0){ctx.save();polygon(ctx,[[0,-3],[-a.side*18,-2],[-a.side*18,22],[0,10]]);ctx.clip();ctx.drawImage(a.cap.c,0,0,a.cap.c.width,a.cap.c.height,a.side<0?0:-18,-3,18,25);ctx.restore();}ctx.rotate(upperAngle);if(!articulatedProfile)drawPiece(ctx,a.upper,a.shoulder);ctx.restore();
   if(!raised&&!articulatedProfile){ctx.save();ctx.translate(elbow.x,elbow.y);ctx.rotate(foreAngle);drawPiece(ctx,a.fore,a.elbow);ctx.restore();}
  }
  ctx.save();ctx.translate(128,r.hips);ctx.rotate(step*.012);ctx.drawImage(parts.body,0,0,256,r.hips,-128+step*.7,-r.hips+breath,256,r.hips);ctx.restore();
  if(articulatedProfile)for(const arm of arms){ctx.save();ctx.translate(arm.a.shoulder.x,arm.a.shoulder.y);ctx.rotate(arm.upperAngle);drawPiece(ctx,arm.a.upper,arm.a.shoulder);ctx.restore();ctx.save();ctx.translate(arm.elbow.x,arm.elbow.y);ctx.rotate(arm.foreAngle);drawPiece(ctx,arm.a.fore,arm.a.elbow);ctx.restore();}
  if(r.longHair&&poseDirection===0){const h=r.shoulder+38;ctx.drawImage(image,sourceX,sy,sw,sh*h/256,0,breath,256,h);}
  for(const arm of arms)if(arm.raised){
   ctx.save();ctx.translate(arm.elbow.x,arm.elbow.y);ctx.rotate(arm.foreAngle);drawPiece(ctx,arm.a.sleeve,arm.a.elbow);ctx.restore();
   const mix=victory.artReady===false?0:Math.max(0,Math.min(1,(arm.amount-.38)/.2)),reveal=mix*mix*(3-2*mix);if(reveal<1){ctx.save();ctx.globalAlpha*=1-reveal;ctx.translate(arm.elbow.x,arm.elbow.y);ctx.rotate(arm.foreAngle);drawPiece(ctx,arm.a.palm,arm.a.elbow);ctx.restore();}
   if(alpha>.5)view.motionHand={x:arm.wrist.x,y:arm.wrist.y,angle:victory.gesture==='salute'?Math.PI+(.7-Math.PI)*arm.amount:arm.foreAngle+Math.PI*arm.a.side,skin:r.skin,height:Math.max(40,Math.min(60,arm.a.handLength*1.8)),reveal,gesture:victory.gesture,characterId:id,anatomicalSide:arm.a.side<0?'right':'left',screenSide:arm.a.side<0?'left':'right'};
  }
  ctx.restore();
 }
 if(blend<1&&image.width>=sw*4)pose(previous,view.previousDir??direction,1-blend);pose(sx,direction,blend);
 if(p.cosmetic==='gala'){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.strokeStyle='#edbd63';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(101,140);ctx.lineTo(148,180);ctx.stroke();ctx.restore();}
 view.tex.needsUpdate=true;
}
