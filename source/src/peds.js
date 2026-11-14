import {THREE,scene,G,clamp,lerp,TAU,PITCH,CURB,mulberry32} from './core.js';
import {groundH,Col,isCity,okI,onUnload} from './world.js';
import {signal} from './traffic.js';

const CAP=300,SW=9.5,inR=i=>true;
const SKIN=[0xf1c7a1,0xd9a47f,0xb27650,0x8a5a3a,0x5e3b28,0xe9b896],HAIR=[0x1b1511,0x3a2a1c,0x6b4a2b,0xb8863a,0x8e8e8e,0x0e0e0e,0x7a2f1d];
const SHIRT=[0x263d69,0x8c302f,0x34765c,0xd3a64b,0x4b5260,0xeeeeea,0x653d78,0x2b7bb9,0xd96a2b,0x1d1d1f,0xc9c9c9,0x3c8f4c];
const PANTS=[0x20242d,0x3a4a66,0x4a3a2a,0x14161a,0x5b5f66,0x2e3a2e,0x6a6a72];
const OUTFIT={doctor:{s:0xf6f8fa,p:0x56677a},nurse:{s:0x2eb5ad,p:0x2eb5ad},cop:{s:0x20407a,p:0x12161f,h:0x0d0d10},chef:{s:0xffffff,p:0x2a2a2a},suit:{s:0x1c2230,p:0x1c2230},patient:{s:0x9fc8e3,p:0x9fc8e3},swim:{s:0xff6b6b,p:0x1f6fb0},staff:{s:0x2b6cb0,p:0x1a1a1a},beach:{s:0xfff2d0,p:0xff8a5b},pilot:{s:0xf2f2f2,p:0x1c2230},traveler:null};
const SHOE=[0x141414,0x2b1d14,0xe6e6e2,0x3a3a44,0x5a3b22];const tq=new THREE.Quaternion();
const mkCap=(r,len,seg)=>new THREE.CapsuleGeometry(r,len,4,seg);
const geo={leg:mkCap(.075,.72,8).translate(0,-.435,0),arm:mkCap(.05,.5,6).translate(0,-.3,0),torso:mkCap(.13,.36,10).translate(0,0,0),head:new THREE.SphereGeometry(.105,12,10),hair:new THREE.SphereGeometry(.113,10,7,0,TAU,0,Math.PI*.55),shoe:new THREE.BoxGeometry(.1,.07,.27,1,1,1).translate(0,0,.05),hand:new THREE.SphereGeometry(.047,8,6),neck:new THREE.CylinderGeometry(.046,.052,.12,8)};
const mat=new THREE.MeshStandardMaterial({roughness:.8,metalness:0,color:0xffffff});
const parts={};for(const k of['legL','legR','armL','armR','torso','head','hair','shoeL','shoeR','handL','handR','neck']){const g=k.startsWith('leg')?geo.leg:k.startsWith('arm')?geo.arm:k.startsWith('shoe')?geo.shoe:k.startsWith('hand')?geo.hand:geo[k];const m=new THREE.InstancedMesh(g,mat,CAP);m.count=0;m.frustumCulled=false;m.castShadow=true;m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);parts[k]=m}
const B=new THREE.Matrix4(),L=new THREE.Matrix4(),R=new THREE.Matrix4(),Tm=new THREE.Matrix4(),q=new THREE.Quaternion(),eu=new THREE.Euler(),pv=new THREE.Vector3(),sc=new THREE.Vector3(),colr=new THREE.Color(),ONE=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0);
const rnd=Math.random,pick=a=>a[Math.floor(rnd()*a.length)];
const nodePos=n=>[(n[0]+.5)*PITCH+n[2]*SW,(n[1]+.5)*PITCH+n[3]*SW];
const nkey=n=>n.join(',');
function neighbors(n){const[a,b,sx,sz]=n,o=[{n:[a,b,-sx,sz],cross:'z'},{n:[a,b,sx,-sz],cross:'x'}];if(okI(a,b+sz))o.push({n:[a,b+sz,sx,-sz]});if(okI(a+sx,b))o.push({n:[a+sx,b,-sx,sz]});return o}
const doors=new Map(),spawns=[];
const ekey=(f,t)=>{const a=nkey(f),b=nkey(t);return a<b?a+'>'+b:b+'>'+a};
export const People={list:[],active:0,
 addDoor(owner,i,j,side,doorX,doorZ,inX,inZ){let f,t,al;
  if(side==='S'){f=[i-1,j,1,-1];t=[i,j,-1,-1];al='x'}else if(side==='N'){f=[i-1,j-1,1,1];t=[i,j-1,-1,1];al='x'}else if(side==='E'){f=[i,j-1,-1,1];t=[i,j,-1,-1];al='z'}else{f=[i-1,j-1,1,1];t=[i-1,j,1,-1];al='z'}
  const pf=nodePos(f),pt=nodePos(t),v=al==='x'?doorX:doorZ,a0=al==='x'?pf[0]:pf[1],a1=al==='x'?pt[0]:pt[1],tt=(v-a0)/(a1-a0);const key=ekey(f,t);let l=doors.get(key);if(!l){l=[];doors.set(key,l)}
  const d={owner,t:tt,x:doorX,z:doorZ,ix:inX,iz:inZ,canon:nkey(f)<nkey(t)?nkey(f):nkey(t),fk:nkey(f)};l.push(d);return d},
 removeOwner(owner){for(const[k,l]of doors){for(let i=l.length-1;i>=0;i--)if(l[i].owner===owner)l.splice(i,1);if(!l.length)doors.delete(k)}for(let i=spawns.length-1;i>=0;i--)if(spawns[i].owner===owner){if(spawns[i].p)People.remove(spawns[i].p);spawns.splice(i,1)}},
 addSpawn(owner,s){s.owner=owner;spawns.push(s);return s},
 make(o){const p={x:o.x,y:o.y??0,z:o.z,h:o.h||0,sc:o.sc||(.93+rnd()*.14),mode:o.mode||'static',anim:o.anim||'idle',phase:rnd()*10,spd:o.spd||0,seed:rnd()*100,t:0,state:'walk',hidden:false,timer:0,from:null,to:null,len:1,lo:(rnd()-.5)*1.6,leader:null,off:[0,0],kx:0,kz:0,fall:0,home:{x:o.x,z:o.z},r:o.r||0,tx:o.x,tz:o.z,spawn:o.spawn,pa:o.pa,pb:o.pb,dirf:false,wp:o.wp,wi:0,onDone:o.onDone};
  const of=o.outfit&&OUTFIT[o.outfit];p.skin=o.skin??pick(SKIN);p.hair=of&&of.h?of.h:pick(HAIR);p.shirt=of?of.s:pick(SHIRT);p.pants=of?of.p:pick(PANTS);
  if(o.outfit==='swim'||o.outfit==='beach'){p.shirt=pick([0xff5a5f,0x2fb4e9,0xffd23f,0x7bd389,0xffffff]);p.pants=pick([0x1f6fb0,0xff8a5b,0x222222,0x3ab795])}
  p.idx=People.list.length;People.list.push(p);return p},
 remove(p){const l=People.list,i=l.indexOf(p);if(i<0)return;const last=l[l.length-1];l[i]=last;l.pop();if(p.spawn)p.spawn.p=null;
  for(const q of l)if(q.leader===p)q.kill=true},
 spawnWalker(px,pz,camFwd){if(!isCity(Math.round(px/PITCH),Math.round(pz/PITCH)))return false;
  for(let tries=0;tries<5;tries++){const ang=rnd()*TAU,d=45+rnd()*90,x=px+Math.cos(ang)*d,z=pz+Math.sin(ang)*d;if(camFwd&&d<90&&((x-px)*camFwd.x+(z-pz)*camFwd.z)/d>.5)continue;
   const a=Math.round(x/PITCH-.5),b=Math.round(z/PITCH-.5);if(!okI(a,b))continue;
   const sx=x>(a+.5)*PITCH?1:-1,sz=z>(b+.5)*PITCH?1:-1;const from=[a,b,sx,sz],nb=neighbors(from).filter(o=>!o.cross);const ch=pick(nb.length?nb:neighbors(from));
   const pa=nodePos(from),pb=nodePos(ch.n),t=rnd()*.8+.1;const p=People.make({x:pa[0]+(pb[0]-pa[0])*t,z:pa[1]+(pb[1]-pa[1])*t,mode:'nav',spd:1.15+rnd()*.5,y:CURB});
   if(G.cityOnly===false){}
   p.from=from;p.to=ch.n;p.t=t;p.cross=ch.cross||null;p.len=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);
   if(rnd()<.3){const n=1+Math.floor(rnd()*2);for(let k=0;k<n;k++){const f=People.make({x:p.x,z:p.z,mode:'follow',spd:p.spd,y:CURB});f.leader=p;f.off=[(rnd()-.5)*1.2,.8+k*.8]}}
   else if(rnd()<.12){p.mode='static';p.anim='talk';const q2=People.make({x:p.x+.9,z:p.z,mode:'static',anim:'talk',y:CURB});p.h=Math.PI/2;q2.h=-Math.PI/2;q2.leader=null;q2.kill=false;p.pair=q2}
   return true}return false},
 spawnAround(x,y,z,n,outfit){for(let i=0;i<n;i++){const a=rnd()*TAU,r=2+rnd()*4;People.make({x:x+Math.cos(a)*r,z:z+Math.sin(a)*r,y,mode:'wander',spd:1.2+rnd()*.4,r:8,anim:'idle',outfit})}},
 knock(p,vx,vz){p.state='down';p.timer=7;p.kx=vx*.5;p.kz=vz*.5;p.fall=0},
 update(dt,px,pz,camFwd){
  const T=G.t,list=People.list;
  // static spawns activate by distance
  if(!People._sp||T-People._sp>.4){People._sp=T;let free=CAP-list.length-20;for(const s of spawns){const d2=(s.x-px)**2+(s.z-pz)**2;
    if(!s.p&&d2<85*85&&free>0){s.p=People.make({...s,mode:s.mode||'static',spawn:s});free--}else if(s.p&&d2>110*110){People.remove(s.p)}}}
  // walkers spawn
  const nav=list.filter(p=>p.mode==='nav'||p.mode==='follow').length;People._nt=(People._nt||0)-dt;
  const cityBand=isCity(Math.round(px/PITCH),Math.round(pz/PITCH));
  if(People._nt<=0){People._nt=.1;if(cityBand&&nav<G.pedTarget&&list.length<CAP-30)People.spawnWalker(px,pz,camFwd)}
  const veh=G.vehicles;
  for(let i=list.length-1;i>=0;i--){const p=list[i];if(!p)continue;
   const dx=p.x-px,dz=p.z-pz,d2=dx*dx+dz*dz;
   if(p.kill||(!p.spawn&&(p.mode!=='static'||p.anim==='talk')&&(d2>170*170||(d2>130*130&&camFwd&&dx*camFwd.x+dz*camFwd.z<0)))||(!cityBand&&p.mode==='nav')){People.remove(p);continue}
   if(d2>140*140&&p.mode!=='nav'&&p.mode!=='follow')continue;
   if(p.state==='down'){p.timer-=dt;p.fall=Math.min(1,p.fall+dt*4);p.x+=p.kx*dt;p.z+=p.kz*dt;p.kx*=Math.exp(-4*dt);p.kz*=Math.exp(-4*dt);if(p.timer<=0&&!p.spawn){People.remove(p)}continue}
   // vehicle collision
   if(d2<250*250){for(const v of veh){const vs=Math.abs(v.speed||0);if(v.kind==='car'&&vs>2.2){const ddx=p.x-v.x,ddz=p.z-v.z;if(ddx*ddx+ddz*ddz<(v.L*.5+.4)**2){const vfx=-Math.sin(v.heading),vfz=-Math.cos(v.heading),f=ddx*vfx+ddz*vfz,lat=Math.abs(ddx*(-vfz)+ddz*vfx);
      if(Math.abs(f)<v.L*.5+.3&&lat<v.W*.5+.35&&Math.abs(v.y-p.y)<1.5){People.knock(p,vfx*vs*1.2,vfz*vs*1.2);if(v===G.active&&G.crime)G.crime(vs>8?2:1,'Hit pedestrian');if(v===G.active){G.shake=Math.max(G.shake||0,.3);v.vx*=.96;v.vz*=.96}break}}}}}
   if(p.state==='down')continue;
   if(p.hidden){p.timer-=dt;if(p.timer<=0){p.hidden=false;p.x=p.door.x;p.z=p.door.z;p.state='exiting'}continue}
   People.step(p,dt,T)}
  People.write()},
 step(p,dt,T){
  let moving=false,spd=p.spd;
  if(p.mode==='nav'){
   if(p.state==='walk'){
    if(p.t<=0.001&&p.cross&&!p.go){const a=p.from[0],b=p.from[1],s=signal(a,b,p.cross);if(s!=='r'){p.anim='wait';p.wait=(p.wait||0)+dt;if(p.wait<25)return People.pose(p,dt,false)}p.go=true;p.wait=0}
    if(p.cross)spd*=1.25;const pa=nodePos(p.from),pb=nodePos(p.to);p.t+=spd*dt/p.len;
    const t=Math.min(p.t,1),dx=pb[0]-pa[0],dz=pb[1]-pa[1],l=Math.hypot(dx,dz)||1;const lo=p.cross?0:p.lo;
    p.x=pa[0]+dx*t+(-dz/l)*lo;p.z=pa[1]+dz*t+(dx/l)*lo;p.h=Math.atan2(-dx,-dz)+Math.PI;p.h=Math.atan2(dx,dz);p.y=lerp(p.y,p.cross?0:CURB,Math.min(1,dt*8));moving=true;p.anim='walk';
    if(p.door&&p.t>=p.door.tt){p.state='entering';p.timer=0}
    if(p.t>=1){People.next(p)}
   }else if(p.state==='entering'){const d=p.door,dx=d.ix-p.x,dz=d.iz-p.z,l=Math.hypot(dx,dz);p.h=Math.atan2(dx,dz);moving=true;p.anim='walk';if(l<.5){p.hidden=true;p.timer=7+rnd()*18}else{p.x+=dx/l*1.4*dt;p.z+=dz/l*1.4*dt}}
   else if(p.state==='exiting'){const d=p.door,tx=d.x,tz=d.z,sx=p.ex,sz=p.ez;const dx=p.sx-p.x,dz=p.sz-p.z,l=Math.hypot(dx,dz);p.h=Math.atan2(dx,dz);moving=true;p.anim='walk';if(l<.4){p.state='walk';p.door=null}else{p.x+=dx/l*1.4*dt;p.z+=dz/l*1.4*dt}}
  }else if(p.mode==='follow'){const L=p.leader;if(!L||L.state==='down'&&false){p.kill=true;return}
   const lh=L.h,sx=Math.sin(lh),sz=Math.cos(lh),tx=L.x-sx*p.off[1]+(sz)*p.off[0],tz=L.z-sz*p.off[1]-(sx)*p.off[0];
   if(L.hidden||L.state==='entering'){p.kill=false}
   const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);if(l>.12){const sp=Math.min(l*2.2,spd*1.25+.2);p.x+=dx/l*sp*dt;p.z+=dz/l*sp*dt;p.h=lerpAng(p.h,Math.atan2(dx,dz),Math.min(1,dt*6));moving=true;p.anim='walk';spd=sp}else p.anim='idle';
   p.y=lerp(p.y,groundH(p.x,p.z),Math.min(1,dt*8));if(L.hidden){p.hidden=false;p.x=L.x;p.z=L.z}
  }else if(p.mode==='wander'){
   p.timer-=dt;if(p.timer<=0){p.timer=2+rnd()*4;if(rnd()<.3){p.tx=p.x;p.tz=p.z}else{const a=rnd()*TAU,r=rnd()*p.r;p.tx=p.home.x+Math.cos(a)*r;p.tz=p.home.z+Math.sin(a)*r}}
   const dx=p.tx-p.x,dz=p.tz-p.z,l=Math.hypot(dx,dz);if(l>.4){p.x+=dx/l*spd*dt;p.z+=dz/l*spd*dt;p.h=lerpAng(p.h,Math.atan2(dx,dz),Math.min(1,dt*6));moving=true;p.anim='walk';const cp={x:p.x,z:p.z};Col.pushCircle(cp,.35,p.y,1.7,.45);p.x=cp.x;p.z=cp.z;Col.surf(p.x,p.z,p.y+.5,.6,tmpS);if(tmpS.y>-1e8)p.y=lerp(p.y,tmpS.y,Math.min(1,dt*10))}else p.anim='idle';
  }else if(p.mode==='pace'){const A=p.pa,Bp=p.pb;const tx=p.dirf?Bp[0]:A[0],tz=p.dirf?Bp[1]:A[1];const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);if(l<.3){p.dirf=!p.dirf;p.timer=1+rnd()*5}else if(p.timer>0){p.timer-=dt;p.anim='idle'}else{p.x+=dx/l*spd*dt;p.z+=dz/l*spd*dt;p.h=lerpAng(p.h,Math.atan2(dx,dz),Math.min(1,dt*6));moving=true;p.anim='walk'}}
  else if(p.mode==='path'){const w=p.wp&&p.wp[p.wi];if(!w){p.kill=true;if(p.onDone)p.onDone(p);return}
   const dx=w[0]-p.x,dz=w[1]-p.z,l=Math.hypot(dx,dz);if(l<.3){p.wi++}else{const st=Math.min(l,spd*dt);p.x+=dx/l*st;p.z+=dz/l*st;p.h=lerpAng(p.h,Math.atan2(dx,dz),Math.min(1,dt*7));moving=true;p.anim='walk';Col.surf(p.x,p.z,p.y+.6,.7,tmpS);if(tmpS.y>-1e8)p.y=lerp(p.y,tmpS.y,Math.min(1,dt*12))}}
  else{ // static; ped reaction to nearby fast vehicles handled elsewhere
   if(p.anim==='swim'){p.y=-.9+Math.sin(T*1.7+p.seed)*.04}
  }
  People.pose(p,dt,moving,spd)},
 next(p){const nb=neighbors(p.to).filter(o=>nkey(o.n)!==nkey(p.from));const opts=nb.length?nb:neighbors(p.to);let tot=0;const w=o=>o.cross?(1.0):(1.4);for(const o of opts)tot+=w(o);let r=rnd()*tot,ch=opts[0];for(const o of opts){r-=w(o);if(r<=0){ch=o;break}}
  p.from=p.to;p.to=ch.n;p.t=0;p.cross=ch.cross||null;p.go=false;p.wait=0;const pa=nodePos(p.from),pb=nodePos(p.to);p.len=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);p.door=null;
  if(!p.cross&&rnd()<.3){const l=doors.get(ekey(p.from,p.to));if(l&&l.length){const d=pick(l);const fwd=nkey(p.from)===d.fk;p.door={...d,tt:fwd?d.t:1-d.t};p.sx=null;const t=p.door.tt;p.sx=pa[0]+(pb[0]-pa[0])*t;p.sz=pa[1]+(pb[1]-pa[1])*t}}},
 pose(p,dt,moving,spd=1.3){const sp=moving?spd:0;p.phase+=dt*(moving?sp*4.2:1.2);p.moving=moving;p.sp=sp},
 write(){const list=People.list,n=list.length;for(const k in parts)parts[k].count=n;
  for(let i=0;i<n;i++){const p=list[i];p.idx=i;
   if(p.hidden){sc.set(0,0,0);Tm.makeScale(0,0,0);for(const k in parts)parts[k].setMatrixAt(i,Tm);continue}
   let ph=p.phase,sw=0,bob=0,lean=0,sit=0,lie=0,armL=0,armR=0,yoff=0,headY=0,swim=0;
   const anim=p.state==='down'?'lie':p.anim;
   if(anim==='walk'){sw=Math.sin(ph)*clamp((p.sp||1.3)/1.4,.4,1.5)*.75;bob=Math.abs(Math.cos(ph))*.025;armL=-sw*.8;armR=sw*.8;if((p.sp||0)>2.6){lean=.18;sw*=1.3}}
   else if(anim==='talk'){armR=-.9+Math.sin(G.t*3.1+p.seed)*.5;armL=Math.sin(G.t*2.3+p.seed*2)>.6?-.8:-.15;headY=Math.sin(G.t*1.2+p.seed)*.3}
   else if(anim==='sit'){sit=1;armL=armR=-.7}
   else if(anim==='lie'){lie=1}
   else if(anim==='swim'){swim=1;armL=Math.sin(G.t*4+p.seed)*1.6;armR=-armL;sw=Math.sin(G.t*8+p.seed)*.4}
   else if(anim==='work'){armL=-.9;armR=-.9+Math.sin(G.t*2+p.seed)*.15}
   else if(anim==='wait'){armL=armR=0;headY=Math.sin(G.t*.8+p.seed)*.4}
   else if(anim==='hands'){armL=-1.2;armR=-1.2}
   else{armL=Math.sin(G.t*.9+p.seed)*.04;armR=-armL;headY=Math.sin(G.t*.5+p.seed)*.2}
   const s=p.sc;
   // base
   eu.set(0,p.h,0,'YXZ');q.setFromEuler(eu);
   let by=p.y+(sit?-.42:0)+bob;
   if(lie){eu.set(-Math.PI/2*(p.state==='down'?p.fall:1),p.h,0,'YXZ');q.setFromEuler(eu);by=p.y+.16*(p.state==='down'?p.fall:1)+(1-(p.state==='down'?p.fall:1))*0}
   if(swim){eu.set(Math.PI/2*.92,p.h,0,'YXZ');q.setFromEuler(eu);by=p.y+.05}
   pv.set(p.x,by,p.z);sc.set(s,s,s);B.compose(pv,q,sc);
   const put=(k,x,y,z,rx,rz,sxx=1,syy=1,szz=1)=>{eu.set(rx,0,rz,'XYZ');q.setFromEuler(eu);pv.set(x,y,z);const ssv=new THREE.Vector3(sxx,syy,szz);L.compose(pv,q,ssv);R.multiplyMatrices(B,L);parts[k].setMatrixAt(i,R)};
   const lk=sit?-1.45:sw+(0);
   put('legL',-.09,.9,0,sit?-1.5:sw,0);put('legR',.09,.9,0,sit?-1.5:-sw,0);
   put('torso',0,1.18,0,lean,0,1.3,1,.8);
   const putC=(k,px,py,pz,rx,rz,ox,oy,oz,a1=1,a2=1,a3=1)=>{eu.set(rx,0,rz,'XYZ');q.setFromEuler(eu);pv.set(px,py,pz);L.compose(pv,q,ONE);pv.set(ox,oy,oz);Tm.compose(pv,tq,new THREE.Vector3(a1,a2,a3));L.multiply(Tm);R.multiplyMatrices(B,L);parts[k].setMatrixAt(i,R)};
   putC('shoeL',-.09,.9,0,sit?-1.5:sw,0,0,-.85,.0);putC('shoeR',.09,.9,0,sit?-1.5:-sw,0,0,-.85,.0);
   putC('handL',-.2,1.42,0,armL,-.07,0,-.63,0);putC('handR',.2,1.42,0,armR,.07,0,-.63,0);
   putC('neck',0,1.55,0,0,0,0,0,0);
   put('armL',-.2,1.42,0,armL,-.07);put('armR',.2,1.42,0,armR,.07);
   // head turn
   eu.set(0,headY,0,'XYZ');q.setFromEuler(eu);pv.set(0,1.66,0);L.compose(pv,q,new THREE.Vector3(1,1.12,1));R.multiplyMatrices(B,L);parts.head.setMatrixAt(i,R);
   pv.set(0,1.675,-.005);L.compose(pv,q,new THREE.Vector3(1,1.1,1.02));R.multiplyMatrices(B,L);parts.hair.setMatrixAt(i,R);
   if(p._c!==1){p._c=1;colr.setHex(p.shirt);parts.torso.setColorAt(i,colr);parts.armL.setColorAt(i,colr);parts.armR.setColorAt(i,colr);colr.setHex(p.pants);parts.legL.setColorAt(i,colr);parts.legR.setColorAt(i,colr);colr.setHex(p.skin);parts.head.setColorAt(i,colr);colr.setHex(p.hair);parts.hair.setColorAt(i,colr);colr.setHex(p.skin);parts.neck.setColorAt(i,colr);parts.handL.setColorAt(i,colr);parts.handR.setColorAt(i,colr);colr.setHex(SHOE[Math.floor(p.seed)%SHOE.length]);parts.shoeL.setColorAt(i,colr);parts.shoeR.setColorAt(i,colr)}
  }
  for(const k in parts){parts[k].instanceMatrix.needsUpdate=true}
  People.colorDirty()},
 colorDirty(){if(People._swapped){for(const p of People.list)p._c=0;People._swapped=false;}for(const k in parts)if(parts[k].instanceColor)parts[k].instanceColor.needsUpdate=true}
};
const tmpS={};
function lerpAng(a,b,t){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return a+d*t}
// swap-remove changes slot; force recolor
const _rm=People.remove;People.remove=function(p){_rm.call(People,p);People._swapped=true;for(const q of People.list)q._c=0};
G.pedTarget=130;

onUnload.push(o=>People.removeOwner(o));
