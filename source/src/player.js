import {THREE,scene,camera,G,clamp,lerp,TAU,SEA,mulberry32} from './core.js';
import {Col,Inter,groundH,inWater,LIMITS} from './world.js';
import {Vehicle,IDLE,updateBeams,spawnCar} from './vehicles.js';
import {Traffic} from './traffic.js';
import {Sky} from './sky.js';

const tmp={};
const skins=[0xd5a47e],mat=(c,r=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
export const OUTFITS=[[0x162f50,0x1b1d22],[0xb02a2a,0x22262e],[0x2f7a5b,0x3a3a40],[0xd8b04a,0x2a2a2e],[0xeeeeea,0x2c3a5a],[0x6a3d8a,0x1b1d22]];
export function human(){const g=new THREE.Group();
 const M=(c,r=.8,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const mats={shirt:M(0x162f50,.82),pants:M(0x2a3a55,.92),skin:M(0xd2a07a,.6),hair:M(0x2a1d16,.7)};
 const tee=M(0xf2f2f0,.9),shoe=M(0x1a1a1c,.55),sole=M(0xe8e8e6,.7),white=M(0xfafafa,.35),iris=M(0x3a2a1e,.4),dark=M(0x1a1010,.6),lip=M(0x9a5a52,.6),gold=M(0xd5a94f,.3,.8);
 const stubble=new THREE.MeshStandardMaterial({color:0x2a1d16,roughness:.9,transparent:true,opacity:.34,depthWrite:false});
 const mk=(geo,mt,x,y,z,par,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(geo,mt);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;(par||g).add(o);return o};
 const S=(r,w=14,h=10)=>new THREE.SphereGeometry(r,w,h),C=(rt,rb,h,s=12)=>new THREE.CylinderGeometry(rt,rb,h,s);
 const body=new THREE.Group();g.add(body);
 // torso
 mk(S(1,18,14),mats.shirt,0,1.34,0,body,.205,.235,.128);mk(C(.17,.152,.32,16),mats.shirt,0,1.1,0,body,1,1,.74);mk(S(1,14,10),mats.pants,0,.97,0,body,.172,.1,.118);
 mk(C(.162,.162,.04,16),dark,0,1.0,0,body,1,1,.74);mk(new THREE.BoxGeometry(.05,.035,.012),gold,0,1.0,.125,body);
 for(const sx of[-1,1])mk(S(.072,12,9),mats.shirt,sx*.213,1.465,0,body);
 mk(C(.078,.086,.06,14),mats.shirt,0,1.57,0,body,1,1,.95);mk(new THREE.BoxGeometry(.07,.045,.012),tee,0,1.545,.1,body);
 mk(new THREE.BoxGeometry(.02,.3,.02),M(0x0f1f35,.8),0,1.2,.136,body);// zip line
 for(const sx of[-1,1])mk(new THREE.BoxGeometry(.055,.012,.012),M(0x0f1f35,.8),sx*.1,1.2,.128,body);// pockets
 // neck + head
 mk(C(.05,.056,.12,12),mats.skin,0,1.62,0,g);
 const head=new THREE.Group();head.position.set(0,1.73,.005);g.add(head);
 mk(S(.105,22,16),mats.skin,0,0,0,head,1,1.12,1.04);mk(S(.085,16,12),mats.skin,0,-.058,.022,head,1,.78,1);
 for(const sx of[-1,1]){mk(S(.021,8,6),mats.skin,sx*.106,0,-.005,head,.6,1.2,.9);
  mk(S(.0145,10,8),white,sx*.037,.022,.1,head,1.25,.78,.6);mk(S(.0082,8,6),iris,sx*.037,.022,.108,head,1,1,.5);mk(S(.004,6,5),dark,sx*.037,.022,.1125,head);
  const br=mk(new THREE.BoxGeometry(.05,.009,.012),mats.hair,sx*.037,.052,.099,head);br.rotation.z=-sx*.12;
  mk(new THREE.BoxGeometry(.014,.05,.025),mats.hair,sx*.103,.0,.035,head)}// sideburns
 mk(S(.022,8,6),mats.skin,0,-.014,.112,head,.8,1.1,1.3);mk(new THREE.BoxGeometry(.046,.008,.012),lip,0,-.056,.106,head);mk(new THREE.BoxGeometry(.06,.006,.01),dark,0,-.049,.106,head);
 const sg=new THREE.SphereGeometry(.094,16,10,0,Math.PI*2,Math.PI*.56,Math.PI*.36);mk(sg,stubble,0,-.04,.012,head,1,1,1.03);
 const hr=new THREE.SphereGeometry(.113,20,14,0,Math.PI*2,0,Math.PI*.54);mk(hr,mats.hair,0,.012,-.008,head,1.03,1.1,1.08);
 
 // arms
 const arm=(sx)=>{const sh=new THREE.Group();sh.position.set(sx*.238,1.465,0);g.add(sh);mk(C(.058,.05,.3,12),mats.shirt,0,-.15,0,sh);
  const el=new THREE.Group();el.position.set(0,-.3,0);sh.add(el);mk(S(.05,10,8),mats.shirt,0,0,0,el);mk(C(.05,.04,.27,12),mats.shirt,0,-.135,0,el);mk(C(.043,.043,.03,12),M(0x0f1f35,.7),0,-.265,0,el);
  mk(new THREE.BoxGeometry(.068,.09,.034),mats.skin,0,-.325,0,el);mk(new THREE.BoxGeometry(.02,.06,.025),mats.skin,sx*-.04,-.3,.012,el);return{sh,el}};
 const aL=arm(-1),aR=arm(1);
 // legs
 const leg=(sx)=>{const hp=new THREE.Group();hp.position.set(sx*.098,.95,0);g.add(hp);mk(C(.098,.072,.47,14),mats.pants,0,-.235,0,hp);
  const kn=new THREE.Group();kn.position.set(0,-.46,0);hp.add(kn);mk(S(.07,10,8),mats.pants,0,0,0,kn);mk(C(.07,.052,.44,12),mats.pants,0,-.22,0,kn);
  mk(new THREE.BoxGeometry(.108,.075,.27),shoe,0,-.465,.055,kn);mk(new THREE.BoxGeometry(.112,.03,.285),sole,0,-.49,.055,kn);mk(S(.052,8,6),shoe,0,-.44,-.025,kn,1,.9,1);return{hp,kn}};
 const lL=leg(-1),lR=leg(1);
 g.userData={m:mats,legL:lL.hp,legR:lR.hp,kneeL:lL.kn,kneeR:lR.kn,armL:aL.sh,armR:aR.sh,elbowL:aL.el,elbowR:aR.el,body,head};return g}
export const P={g:human(),vy:0,yaw:0,pitch:.28,fp:false,mode:'foot',phase:0,ground:true,dyn:null,swim:false,lastMouse:0,camDist:6,shake:0,hurtT:0,bob:0};
scene.add(P.g);G.player=P;
P.setOutfit=i=>{G.outfit=i%OUTFITS.length;const o=OUTFITS[G.outfit];P.g.userData.m.shirt.color.setHex(o[0]);P.g.userData.m.pants.color.setHex(o[1])};
Object.defineProperty(P,'pos',{get(){return P.g.position}});
P.teleport=(x,y,z,yaw)=>{P.g.position.set(x,y,z);P.vy=0;if(yaw!=null){P.yaw=yaw;}Col.surf(x,z,y+1,2,tmp);if(tmp.y>-1e8&&P.g.position.y<tmp.y)P.g.position.y=tmp.y;camera.position.set(x+Math.sin(P.yaw)*6,y+4,z+Math.cos(P.yaw)*6)};
P.hurt=(n,why)=>{if(G.godmode)return;G.health=Math.max(0,G.health-n);P.hurtT=.4;G.hud&&G.hud();if(G.health<=0&&!G.dead){G.dead=true;G.onDeath&&G.onDeath(why)}};
// ---------- enter / exit ----------
export function nearestVehicle(r=6){let best=null,bd=r;for(const v of G.vehicles){if(v.dead||v.locked)continue;const d=Math.hypot(v.x-P.g.position.x,v.z-P.g.position.z)-(v.def?v.def.L*.3:0);if(d<bd&&Math.abs(v.y-P.g.position.y)<4){bd=d;best=v}}return{v:best,d:bd}}
P.enter=function(v){if(G.active||!v)return;G.active=v;v.driver='player';v.awake=true;P.g.visible=false;P.mode='drive';if(v.openDoors)v.openDoors(.8);P.camDist=v.camDist||(v.kind==='car'?9:v.kind==='boat'?16:22);G.hud&&G.hud();G.onEnter&&G.onEnter(v)}
P.exit=function(){const v=G.active;if(!v)return;let spot=v.exitSpot?v.exitSpot():{x:v.x+2,z:v.z};
 if(v.isAir&&v.y-groundH(v.x,v.z)>2.5&&!v.landedOK){G.notify('Land first before getting out!');return}
 if(v.openDoors)v.openDoors(.9);v.driver=null;G.active=null;P.g.visible=true;P.mode='foot';Col.surf(spot.x,spot.z,v.y+1,1.5,tmp);P.g.position.set(spot.x,tmp.y>-1e8?tmp.y:v.y,spot.z);P.vy=0;P.yaw=v.heading||P.yaw;v.speed*=.5;G.hud&&G.hud();G.onExit&&G.onExit(v);updateBeams(null)};
window.__nearestVehicle=nearestVehicle;
P.tryEnter=function(){if(G.active)return P.exit();
 const{v,d}=nearestVehicle(5.5);const tc=Traffic.nearest(P.g.position.x,P.g.position.z,4.2);
 if(tc&&(!v||Math.hypot(tc.x-P.g.position.x,tc.z-P.g.position.z)<d)){const t=Traffic.take(tc);const car=new Vehicle(t.def,t.paint,t.x,t.z,t.h);car.vx=-Math.sin(t.h)*t.speed;car.vz=-Math.cos(t.h)*t.speed;car.speed=t.speed;car.fromTraffic=true;G.crime&&G.crime(1,'Carjacking');G.notify('You took the car — police may be watching.');P.enter(car);return}
 if(v)P.enter(v);else G.notify('Walk closer to a vehicle and press E.')};
// ---------- input helpers ----------
const K=()=>G.keys;
function carCtl(v){const k=K();const w=k.KeyW||k.ArrowUp,s=k.KeyS||k.ArrowDown,a=k.KeyA||k.ArrowLeft,d=k.KeyD||k.ArrowRight;const vl=v.speed||0;
 const c={thr:0,brake:0,steer:(d?1:0)-(a?1:0),hand:!!k.Space,boost:!!k.ShiftLeft||!!k.ShiftRight,up:k.Space?1:0,down:(k.KeyC||k.ControlLeft)?1:0};
 if(v.flight&&(v.flight.on||v.flight.landing)){c.thr=(w?1:0)-(s?1:0);return c}
 if(w){if(vl<-.6)c.brake=1;else c.thr=1}if(s){if(vl>.6)c.brake=1;else c.thr=-1}return c}
// ---------- main update ----------
const camTarget=new THREE.Vector3(),camWant=new THREE.Vector3(),camFwd=new THREE.Vector3();
P.update=function(dt){const k=K(),pos=P.g.position,v=G.active;
 G.hurt=Math.max(0,(G.hurt||0)-dt);
 if(v){let ctl=v.kind==='car'?carCtl(v):v.controls?v.controls(k):IDLE;if(G.freeze&&v.kind==='car')ctl={thr:0,brake:1,steer:0,hand:true,boost:false,up:0,down:0};v.ctl=ctl;v.update(dt,ctl);if(v.kind!=='car'||v.flight.p>0||true){}pos.set(v.x,v.y,v.z);
  if(v.kind==='car')updateBeams(v);
  // auto-recenter cam behind vehicle
  if(performance.now()-P.lastMouse>1500&&Math.abs(v.speed||0)>4){const tgt=(v.heading||0)+(0);let d=tgt-P.yaw;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;P.yaw+=d*Math.min(1,dt*(v.isAir?1.4:2.2))}
  if(G.shake){G.shake=Math.max(0,G.shake-dt*2.2)}
 }else{
  // on foot
  const f=((k.KeyW||k.ArrowUp)?1:0)-((k.KeyS||k.ArrowDown)?1:0),sd=((k.KeyD||k.ArrowRight)?1:0)-((k.KeyA||k.ArrowLeft)?1:0);
  const sprint=k.ShiftLeft||k.ShiftRight;let sp=sprint?9.5:5.2;if(P.swim)sp=sprint?4.6:2.8;
  let mx=0,mz=0;if(f||sd){mx=-Math.sin(P.yaw)*f+Math.cos(P.yaw)*sd;mz=-Math.cos(P.yaw)*f-Math.sin(P.yaw)*sd;const l=Math.hypot(mx,mz);mx=mx/l*sp;mz=mz/l*sp}
  const pv=P.vel||(P.vel={x:0,z:0});const ac=1-Math.exp(-(P.ground?14:3)*dt);pv.x+=(mx-pv.x)*ac;pv.z+=(mz-pv.z)*ac;
  pos.x+=pv.x*dt;pos.z+=pv.z*dt;
  if(G.admin&&G.noclip){}
  Col.pushCircle(pos,.4,pos.y,1.75,.5);
  // vertical
  if(P.dyn&&P.ground){pos.x+=P.dyn.dx||0;pos.z+=P.dyn.dz||0;pos.y+=P.dyn.dy||0}
  Col.surf(pos.x,pos.z,pos.y,.62,tmp);let sy=tmp.y;const dyn=tmp.dyn;
  P.dyn=dyn;
  const wl=Col.waterAt(pos.x,pos.z),lvl=wl!=null?wl:SEA;const water=(wl!=null?(sy<wl-.5&&pos.y<=wl+.1):(inWater(pos.x,pos.z)&&sy<SEA-.45&&pos.y<=SEA+.55))&&!dyn;
  if(water){if(!P.swim){P.swim=true;P.vy=0}const wy=lvl+Math.sin(G.t*1.7+pos.x*.3)*.04-.55;pos.y+=(wy-pos.y)*Math.min(1,dt*6);P.ground=false;
   if(k.Space)pos.y+=0}
  else{P.swim=false;
   if(P.ground&&sy>-1e8&&pos.y>sy&&pos.y-sy<.6&&P.vy<=0)pos.y=sy;
   if(sy>-1e8&&pos.y<=sy+.06&&P.vy<=0){if(P.vy<-17)P.hurt((-P.vy-17)*5,'fall');pos.y=sy;P.vy=0;P.ground=true;if(k.Space&&!P.jumpHeld){P.vy=7.2;P.ground=false}}
   else{P.vy-=(G.gravity||24)*dt;pos.y+=P.vy*dt;P.ground=false;if(sy>-1e8&&pos.y<sy){pos.y=sy;if(P.vy<-17)P.hurt((-P.vy-17)*5,'fall');P.vy=0;P.ground=true}}}
  P.jumpHeld=!!k.Space;
  if(pos.y<-40){const s=G.spawn||{x:0,y:.5,z:40};pos.set(s.x,s.y,s.z)}
  pos.x=clamp(pos.x,LIMITS.x0,LIMITS.x1);pos.z=clamp(pos.z,LIMITS.z0,LIMITS.z1);
  // walk animation
  const spd=Math.hypot(pv.x,pv.z);P.phase+=dt*spd*1.7;const u=P.g.userData,sw=Math.sin(P.phase)*Math.min(1,spd/5)*.8;
  if(P.swim){P.g.rotation.x=lerp(P.g.rotation.x,Math.PI/2*.9,Math.min(1,dt*6));u.armL.rotation.x=Math.sin(G.t*4)*1.6;u.armR.rotation.x=-u.armL.rotation.x;u.legL.rotation.x=Math.sin(G.t*8)*.4;u.legR.rotation.x=-u.legL.rotation.x;u.kneeL.rotation.x=-Math.max(0,-u.legL.rotation.x)*.8;u.kneeR.rotation.x=-Math.max(0,-u.legR.rotation.x)*.8;u.elbowL.rotation.x=.4;u.elbowR.rotation.x=.4}
  else{P.g.rotation.x=lerp(P.g.rotation.x,0,Math.min(1,dt*8));const run=clamp(spd/9,0,1);u.legL.rotation.x=sw*(1+run*.5);u.legR.rotation.x=-sw*(1+run*.5);u.kneeL.rotation.x=-Math.max(0,-sw)*(1.1+run*.6);u.kneeR.rotation.x=-Math.max(0,sw)*(1.1+run*.6);u.armL.rotation.x=-sw*.9;u.armR.rotation.x=sw*.9;u.elbowL.rotation.x=.2+Math.abs(sw)*.6+run*.5;u.elbowR.rotation.x=.2+Math.abs(sw)*.6+run*.5;u.body.rotation.x=run*.12;u.body.position.y=Math.abs(Math.sin(P.phase))*.02*Math.min(1,spd/5);if(!P.ground){u.legL.rotation.x=-.6;u.legR.rotation.x=.4;u.kneeL.rotation.x=-.9;u.kneeR.rotation.x=-.2;u.armL.rotation.x=-2.2;u.armR.rotation.x=-2.2}}
  if(spd>.5)P.g.rotation.y=lerpA(P.g.rotation.y,Math.atan2(pv.x,pv.z),Math.min(1,dt*12)-0);
  P.g.visible=!P.fp;
 }
 P.updateCamera(dt)};
function lerpA(a,b,t){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return a+d*t}
P.updateCamera=function(dt){const pos=P.g.position,v=G.active;const fov=G.fov+(v&&v.kind==='car'?clamp(Math.abs(v.speed)/3,0,14):v&&v.isAir?clamp(Math.abs(v.speed)/10,0,12):0);camera.fov+=(fov-camera.fov)*Math.min(1,dt*4);camera.updateProjectionMatrix();
 const tgtY=pos.y+(v?(v.kind==='car'?1.3:v.kind==='boat'?3:2.2):1.55);camTarget.set(pos.x,tgtY,pos.z);
 if(P.fp&&!v){camera.position.set(pos.x,pos.y+1.62,pos.z);camera.rotation.order='YXZ';camera.rotation.set(-(P.pitch-.28),P.yaw,0);return}
 if(P.fp&&v&&v.kind==='car'){const d=v.def,c=Math.cos(v.heading),s=Math.sin(v.heading),lx=-.35,lz=-.1;camera.position.set(v.x+lx*c+lz*s,v.y+d.roof-.2,v.z-lx*s+lz*c);camera.rotation.order='YXZ';camera.rotation.set(-(P.pitch-.28)*.8+(v.m?v.m.body.rotation.x:0),(v.heading)+(P.yaw-v.heading)*0,0);return}
 const dist=P.camDist+(v&&v.kind==='car'?clamp(Math.abs(v.speed)*.05,0,3):0),cp=Math.cos(P.pitch),h=Math.sin(P.pitch)*dist+(v?1.5:1);
 camWant.set(camTarget.x+Math.sin(P.yaw)*cp*dist,camTarget.y+h,camTarget.z+Math.cos(P.yaw)*cp*dist);
 // camera collision
 camFwd.subVectors(camWant,camTarget);const L=camFwd.length();camFwd.divideScalar(L);const t=Col.ray(camTarget.x,camTarget.y,camTarget.z,camFwd.x,camFwd.y,camFwd.z,L);const use=Math.min(L,Math.max(.6,t-.35));
 camWant.copy(camTarget).addScaledVector(camFwd,use);
 const gy=groundH(camWant.x,camWant.z);if(camWant.y<gy+.35&&gy>-50)camWant.y=gy+.35;
 const k=Math.min(1,dt*(v?9:12));camera.position.lerp(camWant,k);
 if(G.shake>0){camera.position.x+=(Math.random()-.5)*G.shake*.5;camera.position.y+=(Math.random()-.5)*G.shake*.5}
 camera.rotation.order='XYZ';camera.lookAt(camTarget.x,camTarget.y,camTarget.z)};
// ---------- interaction ----------
const _v={};
P.nearInter=function(){const pos=P.g.position,veh=!!G.active;let best=null,bd=1e9;for(const o of Inter.list){const dx=o.x-pos.x,dz=o.z-pos.z,d=Math.hypot(dx,dz);if(d>o.r||Math.abs((o.y??pos.y)-pos.y)>3.2)continue;if(o.needVeh===true&&!veh)continue;if(o.needVeh===false&&veh)continue;if(o.needVeh===undefined&&veh)continue;
  const t=typeof o.text==='function'?o.text():o.text;if(!t)continue;if(d<bd){bd=d;best=o;o._t=t}}return best};
P.setOutfit(0);
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==renderer_dom())return;P.yaw-=e.movementX*.0024*(G.sens||1);P.pitch=clamp(P.pitch-e.movementY*.0018*(G.sens||1),-.35,1.1);P.lastMouse=performance.now()});
function renderer_dom(){return document.querySelector('canvas')}
