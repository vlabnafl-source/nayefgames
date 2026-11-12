import {THREE,scene,camera,G,clamp,lerp,TAU,SEA,mulberry32} from './core.js';
import {Col,Inter,groundH,inWater,BOUNDS} from './world.js';
import {Vehicle,IDLE,updateBeams,spawnCar} from './vehicles.js';
import {Traffic} from './traffic.js';
import {Sky} from './sky.js';

const tmp={};
const skins=[0xd5a47e],mat=(c,r=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
export const OUTFITS=[[0x162f50,0x1b1d22],[0xb02a2a,0x22262e],[0x2f7a5b,0x3a3a40],[0xd8b04a,0x2a2a2e],[0xeeeeea,0x2c3a5a],[0x6a3d8a,0x1b1d22]];
function human(){const g=new THREE.Group(),m={shirt:mat(0x162f50),pants:mat(0x1b1d22),skin:mat(0xd5a47e),hair:mat(0x241c18)};const add=(geo,mt,x,y,z)=>{const o=new THREE.Mesh(geo,mt);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o};
 const body=add(new THREE.CapsuleGeometry(.17,.42,4,10),m.shirt,0,1.15,0);body.scale.set(1.3,1,.85);
 const head=add(new THREE.SphereGeometry(.125,14,12),m.skin,0,1.68,0);head.scale.y=1.1;const hair=add(new THREE.SphereGeometry(.133,12,8,0,TAU,0,Math.PI*.55),m.hair,0,1.69,-.005);
 const leg=(x)=>{const p=new THREE.Group();p.position.set(x,.92,0);const l=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.7,4,8),m.pants);l.position.y=-.44;l.castShadow=true;p.add(l);g.add(p);return p};
 const arm=(x)=>{const p=new THREE.Group();p.position.set(x,1.42,0);const l=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.5,4,6),m.shirt);l.position.y=-.3;l.castShadow=true;p.add(l);g.add(p);return p};
 g.userData={m,legL:leg(-.1),legR:leg(.1),armL:arm(-.24),armR:arm(.24),body,head};return g}
export const P={g:human(),vy:0,yaw:0,pitch:.28,fp:false,mode:'foot',phase:0,ground:true,dyn:null,swim:false,lastMouse:0,camDist:6,shake:0,hurtT:0,bob:0};
scene.add(P.g);G.player=P;
P.setOutfit=i=>{G.outfit=i%OUTFITS.length;const o=OUTFITS[G.outfit];P.g.userData.m.shirt.color.setHex(o[0]);P.g.userData.m.pants.color.setHex(o[1])};
Object.defineProperty(P,'pos',{get(){return P.g.position}});
P.teleport=(x,y,z,yaw)=>{P.g.position.set(x,y,z);P.vy=0;if(yaw!=null){P.yaw=yaw;}Col.surf(x,z,y+1,2,tmp);if(tmp.y>-1e8&&P.g.position.y<tmp.y)P.g.position.y=tmp.y;camera.position.set(x+Math.sin(P.yaw)*6,y+4,z+Math.cos(P.yaw)*6)};
P.hurt=(n,why)=>{if(G.godmode)return;G.health=Math.max(0,G.health-n);P.hurtT=.4;G.hud&&G.hud();if(G.health<=0&&!G.dead){G.dead=true;G.onDeath&&G.onDeath(why)}};
// ---------- enter / exit ----------
export function nearestVehicle(r=6){let best=null,bd=r;for(const v of G.vehicles){if(v.dead||v.locked)continue;const d=Math.hypot(v.x-P.g.position.x,v.z-P.g.position.z)-(v.def?v.def.L*.3:0);if(d<bd&&Math.abs(v.y-P.g.position.y)<4){bd=d;best=v}}return{v:best,d:bd}}
P.enter=function(v){if(G.active||!v)return;G.active=v;v.driver='player';v.awake=true;P.g.visible=false;P.mode='drive';if(v.openDoors)v.openDoors(.8);P.camDist=v.kind==='car'?9:v.kind==='boat'?16:22;G.hud&&G.hud();G.onEnter&&G.onEnter(v)}
P.exit=function(){const v=G.active;if(!v)return;let spot=v.exitSpot?v.exitSpot():{x:v.x+2,z:v.z};
 if(v.isAir&&v.y-groundH(v.x,v.z)>2.5&&!v.landedOK){G.notify('Land first before getting out!');return}
 if(v.openDoors)v.openDoors(.9);v.driver=null;G.active=null;P.g.visible=true;P.mode='foot';Col.surf(spot.x,spot.z,v.y+1,1.5,tmp);P.g.position.set(spot.x,tmp.y>-1e8?tmp.y:v.y,spot.z);P.vy=0;P.yaw=v.heading||P.yaw;v.speed*=.5;G.hud&&G.hud();G.onExit&&G.onExit(v);updateBeams(null)};
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
   else{P.vy-=24*dt;pos.y+=P.vy*dt;P.ground=false;if(sy>-1e8&&pos.y<sy){pos.y=sy;if(P.vy<-17)P.hurt((-P.vy-17)*5,'fall');P.vy=0;P.ground=true}}}
  P.jumpHeld=!!k.Space;
  if(pos.y<-40){const s=G.spawn||{x:0,y:.5,z:40};pos.set(s.x,s.y,s.z)}
  pos.x=clamp(pos.x,BOUNDS.x0,BOUNDS.x1);pos.z=clamp(pos.z,BOUNDS.z0,BOUNDS.z1);
  // walk animation
  const spd=Math.hypot(pv.x,pv.z);P.phase+=dt*spd*1.7;const u=P.g.userData,sw=Math.sin(P.phase)*Math.min(1,spd/5)*.8;
  if(P.swim){P.g.rotation.x=lerp(P.g.rotation.x,Math.PI/2*.9,Math.min(1,dt*6));u.armL.rotation.x=Math.sin(G.t*4)*1.6;u.armR.rotation.x=-u.armL.rotation.x;u.legL.rotation.x=Math.sin(G.t*8)*.4;u.legR.rotation.x=-u.legL.rotation.x}
  else{P.g.rotation.x=lerp(P.g.rotation.x,0,Math.min(1,dt*8));u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw;u.armR.rotation.x=sw;if(!P.ground){u.legL.rotation.x=-.6;u.legR.rotation.x=.4;u.armL.rotation.x=-2.2;u.armR.rotation.x=-2.2}}
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
