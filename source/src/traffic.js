import {THREE,scene,G,clamp,lerp,TAU,PITCH,mulberry32} from './core.js';
import {DEFS,getGeos,trafficMats} from './carmodels.js';
import {Col,isCity,okI,onUnload} from './world.js';

const ARCH=['sedan','hatch','suv','van','taxi'],CAPS={sedan:70,hatch:50,suv:50,van:25,taxi:30};
const WCOL=[0xe5e8ed,0x11151d,0x9d1022,0x153c74,0x777d83,0x6a2536,0xf2f0e8,0x2b3a55,0x4a5a4a,0xb8b8b8,0xe8d9b0,0x2b2b2b,0x7a1f1f,0x1f4d3a];
const A={};const Y=new THREE.Vector3(0,1,0),ONE=new THREE.Vector3(1,1,1),q=new THREE.Quaternion(),e=new THREE.Euler(),carM=new THREE.Matrix4(),wl=new THREE.Matrix4(),wm=new THREE.Matrix4(),pv=new THREE.Vector3(),colr=new THREE.Color();
export const signal=(a,b,axis)=>{const C=30,t=(G.t+(((a*5+b*3)%4)+4)%4*7.5)%C;if(axis==='z'){if(t<12)return'g';if(t<14)return'y';return'r'}if(t>=15&&t<27)return'g';if(t>=27&&t<29)return'y';return'r'};
const hdg=(axis,dir)=>axis==='z'?(dir>0?Math.PI:0):(dir>0?-Math.PI/2:Math.PI/2);
const lineC=i=>(i+.5)*PITCH;
const off=(axis,dir,lane)=>(axis==='z'?-dir:dir)*(2.3+3.9*lane);
const okRoad=(axis,rl,k)=>axis==='z'?okI(rl,k):okI(k,rl);
let bulbs,bulbList=[],bulbFree=[];
export const Traffic={cars:[],heads:[],jams:[],spawnT:0,
 init(){for(const k of ARCH){const def=DEFS[k],g=getGeos(def),cap=CAPS[k];const o={k,def,g,cap,list:[]};
   const mk=(geo,mat,n,cast)=>{const m=new THREE.InstancedMesh(geo,mat,n);m.frustumCulled=false;m.count=0;m.castShadow=cast;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m};
   o.body=mk(g.body,trafficMats.body,cap,true);o.glass=mk(g.glass,trafficMats.glass,cap,false);o.lamp=mk(g.lamp,trafficMats.lamp,cap,false);o.tail=mk(g.tail,trafficMats.tail,cap,false);o.wheel=mk(g.wheel,trafficMats.wheel,cap*4,true);
   o.body.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);o.glass.renderOrder=3;A[k]=o}
  bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({toneMapped:false}),3200);bulbs.count=0;bulbs.frustumCulled=false;bulbs.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(3200*3),3);scene.add(bulbs)},
 addHead(owner,x,y,z,fx,fz,a,b,axis){const h={owner,x,y,z,fx,fz,a,b,axis,state:'',idx:-1};h.idx=bulbFree.length?bulbFree.pop():bulbList.length;bulbList[h.idx]=h;Traffic.heads.push(h);return h},
 removeOwner(owner){for(let i=Traffic.heads.length-1;i>=0;i--){const h=Traffic.heads[i];if(h.owner===owner){bulbFree.push(h.idx);bulbList[h.idx]=null;Traffic.heads.splice(i,1);}}},
 updateHeads(){let n=bulbList.length;bulbs.count=n;for(let i=0;i<n;i++){const h=bulbList[i];if(!h){wm.makeScale(0,0,0);bulbs.setMatrixAt(i,wm);continue}
   const s=signal(h.a,h.b,h.axis);if(s===h.state&&!h.dirty)continue;h.state=s;const dy=s==='r'?.34:s==='y'?0:-.34;wm.makeTranslation(h.x+h.fx*.2,h.y+dy,h.z+h.fz*.2);bulbs.setMatrixAt(i,wm);
   colr.setHex(s==='r'?0xff2a1a:s==='y'?0xffc21a:0x2dff6a);bulbs.setColorAt(i,colr)}
  bulbs.instanceMatrix.needsUpdate=true;if(bulbs.instanceColor)bulbs.instanceColor.needsUpdate=true},
 addJam(x,z,r,t){Traffic.jams.push({x,z,r,t})},
 spawn(px,pz,camFwd){const o=A[ARCH[Math.floor(Math.random()*5)]];if(o.list.length>=o.cap)return false;
  for(let tries=0;tries<6;tries++){const ang=Math.random()*TAU,dist=100+Math.random()*170,x=px+Math.cos(ang)*dist,z=pz+Math.sin(ang)*dist;
   if(!isCity(Math.round(x/PITCH),Math.round(z/PITCH)))continue;
   if(camFwd&&dist<170&&((x-px)*camFwd.x+(z-pz)*camFwd.z)/dist>.55)continue;
   const axis=Math.random()<.5?'z':'x',dir=Math.random()<.5?1:-1,lane=Math.random()<.5?0:1;
   const rl=Math.round((axis==='z'?x:z)/PITCH-.5);
   const along=axis==='z'?z:x;// next intersection ahead
   let ni=dir>0?Math.floor(along/PITCH-.5+.0001)+1:Math.ceil(along/PITCH-.5-.0001)-1;if(!okRoad(axis,rl,ni)||!okRoad(axis,rl,ni-dir))continue;
   const cx=axis==='z'?lineC(rl)+off(axis,dir,lane):x,cz=axis==='z'?z:lineC(rl)+off(axis,dir,lane);
   // spacing
   let bad=false;for(const k of ARCH)for(const c of A[k].list)if((c.x-cx)**2+(c.z-cz)**2<110){bad=true;break}if(bad)continue;
   for(const v of G.vehicles)if((v.x-cx)**2+(v.z-cz)**2<200){bad=true;break}if(bad)continue;
   const sp=11+Math.random()*7;const car={o,axis,dir,lane,rl,ni,x:cx,z:cz,h:hdg(axis,dir),speed:sp*.6,vmax:sp,wheelSpin:0,color:WCOL[Math.floor(Math.random()*WCOL.length)],steer:0,decided:false,stun:0,kx:0,kz:0,id:Math.random()};
   if(o.k==='taxi')car.color=0xf2c300;car.slot=o.list.length;o.list.push(car);Traffic.cars.push(car);colr.setHex(car.color);o.body.setColorAt(car.slot,colr);return true}return false},
 remove(car){const o=car.o,l=o.list,i=l.indexOf(car);if(i<0)return;const last=l[l.length-1];l[i]=last;l.pop();if(last!==car){last.slot=i;colr.setHex(last.color);o.body.setColorAt(i,colr)}
  const k=Traffic.cars.indexOf(car);if(k>=0)Traffic.cars.splice(k,1)},
 take(car){Traffic.remove(car);return{def:car.o.def,paint:car.color,x:car.x,z:car.z,h:car.h,speed:car.speed}},
 nearest(x,z,r){let b=null,bd=r*r;for(const c of Traffic.cars){const d=(c.x-x)**2+(c.z-z)**2;if(d<bd){bd=d;b=c}}return b},
 decide(c){const a=c.axis==='z'?c.rl:c.ni,b=c.axis==='z'?c.ni:c.rl;
  const opts=[];if(okRoad(c.axis,c.rl,c.ni+c.dir))opts.push({t:'s',w:6});
  // right turn / left turn: heading dir relative
  const rightDir=c.axis==='z'?-c.dir:c.dir,leftDir=-rightDir;// new dir along other axis
  const nAx=c.axis==='z'?'x':'z',nRl=c.axis==='z'?b:a,na=c.axis==='z'?a:b;if(okRoad(nAx,nRl,na+rightDir))opts.push({t:'r',w:2.2});if(okRoad(nAx,nRl,na+leftDir))opts.push({t:'l',w:1.6});
  if(!opts.length)return false;
  let tot=0;for(const o of opts)tot+=o.w;let pick=Math.random()*tot,ch=opts[0];for(const o of opts){pick-=o.w;if(pick<=0){ch=o;break}}
  if(ch.t==='s'){c.ni+=c.dir;return}
  const nd=ch.t==='r'?rightDir:leftDir;const old={axis:c.axis};
  if(c.axis==='z'){c.axis='x';c.rl=b;c.ni=a+nd}else{c.axis='z';c.rl=a;c.ni=b+nd}
  c.dir=nd;c.lane=ch.t==='r'?(Math.random()<.7?0:1):(Math.random()<.6?0:1);c.turning=1.5},
 update(dt,px,pz,camFwd){
  Traffic.updateHeads();
  Traffic.spawnT-=dt;const maxN=Math.round(105*G.trafficDensity*(G.admin?1:1));
  if(Traffic.spawnT<=0){Traffic.spawnT=.12;if(Traffic.cars.length<maxN)Traffic.spawn(px,pz,camFwd)}
  // jams
  for(let i=Traffic.jams.length-1;i>=0;i--){Traffic.jams[i].t-=dt;if(Traffic.jams[i].t<=0)Traffic.jams.splice(i,1)}
  // spatial grid
  const grid=new Map(),gk=(x,z)=>Math.floor(x/30)*4096+Math.floor(z/30);
  for(const c of Traffic.cars){const k=gk(c.x,c.z);let l=grid.get(k);if(!l){l=[];grid.set(k,l)}l.push(c)}
  const hv=G.vehicles.filter(v=>v.kind==='car'||v.kind==='boat'||v.isAir===false);
  const remove=[];
  for(const c of Traffic.cars){
   const dpx=c.x-px,dpz=c.z-pz,d2=dpx*dpx+dpz*dpz;if(d2>330*330||(d2>230*230&&(camFwd&&(dpx*camFwd.x+dpz*camFwd.z)<0))){remove.push(c);continue}
   const along=c.axis==='z'?c.z:c.x,across=c.axis==='z'?c.x:c.z,line=lineC(c.rl);
   const inter=lineC(c.ni),dAhead=(inter-along)*c.dir;// distance to intersection center ahead
   // decision at intersection edge
   if(!c.decided&&dAhead<=8.2){c.decided=true;if(Traffic.decide(c)===false){remove.push(c);continue}}
   else if(c.decided&&dAhead>20){c.decided=false}
   // recompute after decide
   const al2=c.axis==='z'?c.z:c.x,inter2=lineC(c.ni),dA2=(inter2-al2)*c.dir;
   let target=c.vmax*(c.turning>0?.6:1);if(c.turning>0)c.turning-=dt;
   // signal
   const a=c.axis==='z'?c.rl:c.ni,b=c.axis==='z'?c.ni:c.rl;
   if(!c.decided&&dA2>7){const s=signal(a,b,c.axis),stopD=dA2-12.5-c.o.def.L/2;
    if(s==='r'||(s==='y'&&stopD>c.speed*c.speed/9)){if(stopD<45){target=Math.min(target,Math.sqrt(Math.max(0,2*4.6*Math.max(stopD,0))));if(stopD<.8)target=0}}}
   // leader
   const fx=-Math.sin(c.h),fz=-Math.cos(c.h);let gap=1e9,lead=null;
   const cx0=Math.floor(c.x/30),cz0=Math.floor(c.z/30);
   for(let ia=-1;ia<=1;ia++)for(let ib=-1;ib<=1;ib++){const l=grid.get((cx0+ia)*4096+cz0+ib);if(!l)continue;for(const o of l){if(o===c)continue;const dx=o.x-c.x,dz=o.z-c.z,f=dx*fx+dz*fz;if(f<0||f>34)continue;const lat=Math.abs(dx*(-fz)+dz*fx);if(lat>2.1)continue;
     const ofx=-Math.sin(o.h),ofz=-Math.cos(o.h);if(ofx*fx+ofz*fz<.2)continue;if(f<gap){gap=f;lead=o}}}
   for(const v of hv){const dx=v.x-c.x,dz=v.z-c.z,f=dx*fx+dz*fz;if(f<0||f>30)continue;const lat=Math.abs(dx*(-fz)+dz*fx);if(lat>2.6)continue;if(f<gap){gap=f;lead={speed:v.speed||0}}}
   if(lead){const g2=gap-c.o.def.L;const safe=Math.max(0,(g2-3.2)*.55);target=Math.min(target,(lead.speed||0)+safe);if(g2<3)target=0}
   for(const j of Traffic.jams){if((c.x-j.x)**2+(c.z-j.z)**2<j.r*j.r)target=Math.min(target,2.2)}
   if(c.stun>0){c.stun-=dt;target=0}
   if(target>c.speed)c.speed+=Math.min(3.4*dt,target-c.speed);else c.speed-=Math.min(9*dt,c.speed-target);
   // pure pursuit
   const Ld=clamp(5+c.speed*.5,6,15),lc=lineC(c.rl)+off(c.axis,c.dir,c.lane);
   const tx=c.axis==='z'?lc:c.x+c.dir*Ld,tz=c.axis==='z'?c.z+c.dir*Ld:lc;
   const dx=tx-c.x,dz=tz-c.z,lf=dx*fx+dz*fz,rxv=-fz,rzv=fx,lr=dx*rxv+dz*rzv,kap=2*lr/Math.max(lf*lf+lr*lr,1);
   const maxk=1/3.6;c.h-=clamp(kap,-maxk,maxk)*c.speed*dt;
   const nfx=-Math.sin(c.h),nfz=-Math.cos(c.h);c.x+=nfx*c.speed*dt+c.kx*dt;c.z+=nfz*c.speed*dt+c.kz*dt;c.kx*=Math.exp(-3*dt);c.kz*=Math.exp(-3*dt);
   c.wheelSpin-=c.speed*dt/c.o.def.wr;c.steer=clamp(-kap*c.o.def.wb,-.5,.5)}
  for(const c of remove)Traffic.remove(c);
  // collide with hero vehicles
  for(const v of hv){if(Math.abs(v.speed||0)<.5&&!v.awake)continue;const vr=v.def?v.def.W*.62:1.2,vl=v.def?v.def.L*.22:1;const vfx=-Math.sin(v.heading),vfz=-Math.cos(v.heading);
   for(const c of Traffic.cars){const dx=c.x-v.x,dz=c.z-v.z;if(dx*dx+dz*dz>64)continue;const cfx=-Math.sin(c.h),cfz=-Math.cos(c.h);
    for(const sa of[-1,1])for(const sb of[-1,1]){const ax=v.x+vfx*vl*sa,az=v.z+vfz*vl*sa,bx=c.x+cfx*1.3*sb,bz=c.z+cfz*1.3*sb;const ddx=bx-ax,ddz=bz-az,dd=Math.hypot(ddx,ddz),rr=vr+.95;
     if(dd<rr&&dd>1e-4){const nx=ddx/dd,nz=ddz/dd,pen=rr-dd;c.x+=nx*pen*.55;c.z+=nz*pen*.55;v.group.position.x-=nx*pen*.45;v.group.position.z-=nz*pen*.45;
      const rel=(v.vx-nx*0)*nx+(v.vz)*nz;const imp=Math.abs(v.vx*nx+v.vz*nz-(c.speed*cfx)*nx-(c.speed*cfz)*nz);
      if(imp>2){c.kx+=nx*imp*.6;c.kz+=nz*imp*.6;c.stun=Math.max(c.stun,1.8);const vn=v.vx*nx+v.vz*nz;if(vn>0){v.vx-=vn*nx*1.2;v.vz-=vn*nz*1.2}
       if(imp>5&&v.damage){v.damage((imp-5)*1.6);if(v===G.active){G.shake=Math.max(G.shake||0,clamp(imp/14,0,1));if(imp>7&&G.crime&&!c.hit){c.hit=1;G.crime(1,'Collision')}}}}}}}}
  // write instances
  for(const k of ARCH){const o=A[k],n=o.list.length,d=o.def,ws=o.g.wheels;o.body.count=o.glass.count=o.lamp.count=o.tail.count=n;o.wheel.count=n*4;
   for(let i=0;i<n;i++){const c=o.list[i];c.slot=i;const y=0;q.setFromAxisAngle(Y,c.h);pv.set(c.x,y,c.z);carM.compose(pv,q,ONE);
    o.body.setMatrixAt(i,carM);o.glass.setMatrixAt(i,carM);o.lamp.setMatrixAt(i,carM);o.tail.setMatrixAt(i,carM);
    for(let w=0;w<4;w++){const W=ws[w];e.set(c.wheelSpin,W.front?c.steer:0,0,'YXZ');q.setFromEuler(e);pv.set(W.x,W.y,W.z);wl.compose(pv,q,ONE);wm.multiplyMatrices(carM,wl);o.wheel.setMatrixAt(i*4+w,wm);q.setFromAxisAngle(Y,c.h)}}
   o.body.instanceMatrix.needsUpdate=o.glass.instanceMatrix.needsUpdate=o.lamp.instanceMatrix.needsUpdate=o.tail.instanceMatrix.needsUpdate=o.wheel.instanceMatrix.needsUpdate=true;if(o.body.instanceColor)o.body.instanceColor.needsUpdate=true}
  const nl=.38+.9*G.night;trafficMats.lamp.color.setScalar(nl);trafficMats.tail.color.setScalar(.45+.3*G.night)},
 clear(){for(const c of[...Traffic.cars])Traffic.remove(c)}
};

onUnload.push(o=>Traffic.removeOwner(o));
