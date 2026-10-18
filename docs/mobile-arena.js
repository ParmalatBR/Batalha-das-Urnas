import {Vector3} from './vendor/three.module.js';

export const mobileArenaQuery = '(pointer:coarse) and (max-width:1100px)';
export const isMobileArena = () => matchMedia(mobileArenaQuery).matches;

function inset(name) {
  return Math.max(0, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-'+name)) || 0);
}

// Preserve the approved camera angle. Fit the playable cells and heads between the touch rails.
export function fitMobileArena(camera, width, height) {
  const frame = {left:inset('left')+132, right:width-inset('right')-84, top:inset('top')+54, bottom:height-inset('bottom')-8};
  const availableW=Math.max(120,frame.right-frame.left), availableH=Math.max(100,frame.bottom-frame.top);
  const corners=[];
  for(const x of [-6.5,6.5])for(const z of [-4.5,4.5])for(const y of [0,1.8])corners.push(new Vector3(x,y,z));
  camera.clearViewOffset();
  camera.fov=23.5;
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
  const boundsAt=distance=>{
    camera.position.set(0,26*distance,.25+18*distance);
    camera.lookAt(0,0,.25);
    camera.updateMatrixWorld();
    const points=corners.map(p=>p.clone().project(camera));
    const xs=points.map(p=>(p.x+1)*width/2),ys=points.map(p=>(1-p.y)*height/2);
    return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
  };
  let near=.3,far=4;
  for(let i=0;i<22;i++){
    const mid=(near+far)/2,b=boundsAt(mid);
    if(b.right-b.left>availableW||b.bottom-b.top>availableH)near=mid;else far=mid;
  }
  const b=boundsAt(far);
  camera.setViewOffset(width,height,(b.left+b.right-frame.left-frame.right)/2,(b.top+b.bottom-frame.top-frame.bottom)/2,width,height);
  camera.updateMatrixWorld();
}
