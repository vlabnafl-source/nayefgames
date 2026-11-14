import {THREE,scene,G,clamp,lerp,sstep,TAU,mulberry32} from './core.js';
import {Col,groundH,inWater,isCity,LIMITS} from './world.js';
import {buildHero,DEFS,resolveDef,fallbackDef} from './carmodels.js';
import {sun} from './sky.js';

let uid=0;const tmp={};
export const IDLE={thr:0,brake:0,steer:0,hand:false,boost:false,up:0,down:0};
export const paints=[0xe5e8ed,0x11151d,0x9d1022,0x153c74,0xd5b45d,0x16866f,0x777d83,0x6a2536,0xf2f0e8,0xff6a00,0x2b2b2b];
export class Base{constructor(kind){this.kind=kind;this.id=++uid;this.group=new THREE.Group();scene.add(this.group);this.driver=null;this.health=100;this.awake=true;this.heading=0;this.vx=0;this.vz=0;this.vy=0;this.speed=0;this.ai=null;this.dead=false;G.vehicles.push(this)}
 get x(){return this.group.position.x}get y(){return this.group.position.y}get z(){return this.group.position.z}
 destroy(){scene.remove(this.group);this.group.traverse(o=>{if(o.geometry&&!o.userData.shared&&!this.m)o.geometry.dispose()});const k=G.vehicles.indexOf(this);if(k>=0)G.vehicles.splice(k,1);this.dead=true}
 get isAir(){return false}}
export class Vehicle extends Base{
 constructor(def,paint,x,z,heading=0,y0){super('car');this.def=def;this.label=def.name;this.paint=paint;this.m=buildHero(def,paint);this.group.add(this.m.root);this.heading=heading;this.steerAng=0;this.fuel=100;this.flight={on:false,p:0,target:0,landing:false,vf:0};
  Col.surf(x,z,y0??1,1,tmp);this.group.position.set(x,Math.max(tmp.y,-5),z);this.group.rotation.y=heading;this.vyG=0;this.pitchS=0;this.rollS=0;this.surfK=1;this.surfT=0;this.hornT=0;this.siren=false;this.owned=false;this.id2=def.id;
  this.L=def.L;this.W=def.W;this.radius=def.L*.5;this.warn=0;
  for(const d of this.m.doors)d.pv.rotation.set(0,0,0)}
 openDoors(sec=.9){for(const d of this.m.doors)d.target=1;this.doorT=sec}
 get speedKmh(){return Math.abs(this.speed)*3.6}
 wheelWorld(w){const c=Math.cos(this.heading),s=Math.sin(this.heading);return[this.x+w.x*c+w.z*s,this.z-w.x*s+w.z*c]}
 corners(){const hl=this.def.L/2-.05,hw=this.def.W/2,c=Math.cos(this.heading),s=Math.sin(this.heading),o=[];for(const[lx,lz]of[[-hw,-hl],[hw,-hl],[-hw,hl],[hw,hl],[0,-hl],[0,hl],[-hw,0],[hw,0]])o.push(this.x+lx*c+lz*s,this.z-lx*s+lz*c);return o}
 damage(a){if(a<=0)return;this.health=Math.max(0,this.health-a);if(this.health<=0&&!this.wrecked){this.wrecked=true;this.m.paintMat.color.multiplyScalar(.35);if(this===G.active)G.notify&&G.notify('Vehicle wrecked! Visit a car workshop to repair it.')}}
 repair(){this.health=100;this.wrecked=false;this.m.paintMat.color.set(this.paint)}
 update(dt,ctl){const d=this.def,g=this.group;ctl=ctl||IDLE;
  if(this.flight.on||this.flight.landing||this.flight.p>0.001)return this.flyUpdate(dt,ctl);
  if(!this.awake&&!this.ai&&this!==G.active){this.visualOnly(dt);return}
  let fx=-Math.sin(this.heading),fz=-Math.cos(this.heading),rx=-fz,rz=fx;
  let vl=this.vx*fx+this.vz*fz,vt=this.vx*rx+this.vz*rz;const sp=Math.abs(vl),alive=this.health>0&&this.fuel>0;
  this.surfT-=dt;if(this.surfT<=0){this.surfT=.3;const gh=groundH(this.x,this.z);const sandy=this.x>coastGuess(this.z)-40&&this.x<700;this.surfK=(this.y>.2||gh>.05&&gh<.2)?1:(sandy?.55:(this.onRoad()?1:.72))*(1-G.rain*.22)}
  const thr=alive?ctl.thr:0;let a=0;
  if(thr>0)a=d.acc*thr*(1-Math.pow(clamp(vl/(d.top*(ctl.boost?1.1:1)),0,1),2.2))*(ctl.boost?1.3:1);else if(thr<0)a=d.acc*thr*.55*(1-Math.pow(clamp(-vl/(d.top*.28),0,1),2));
  vl+=a*dt;
  if(ctl.brake>0){const b=d.brake*ctl.brake*dt;if(Math.abs(vl)<=b)vl=0;else vl-=Math.sign(vl)*b}
  if(thr===0&&!ctl.brake)vl-=Math.sign(vl)*Math.min(Math.abs(vl),(1.1+sp*sp*.0015)*dt);
  vl*=Math.exp(-.035*dt);
  vt*=Math.exp(-d.grip*this.surfK*(ctl.hand?.16:1)*dt);
  const tgt=ctl.steer*d.steer/(1+sp/(d.top*.2+4));this.steerAng+=(tgt-this.steerAng)*Math.min(1,dt*(ctl.steer?9:13));
  const yaw=-vl/d.wb*Math.tan(this.steerAng)*(ctl.hand&&sp>8?1.6:1);this.heading+=yaw*dt;
  fx=-Math.sin(this.heading);fz=-Math.cos(this.heading);rx=-fz;rz=fx;
  this.vx=fx*vl+rx*vt;this.vz=fz*vl+rz*vt;const px=this.x,pz=this.z;g.position.x+=this.vx*dt;g.position.z+=this.vz*dt;
  this.speed=vl;this.latSlip=vt;this.yawRate=yaw;this.ctl=ctl;
  this.fuel=Math.max(0,this.fuel-(sp*dt*.0058+(thr?.002:0)*dt));
  this.collideWorld(dt,px,pz);
  // wheels support
  let ys=[],ok=0;for(const w of this.m.geos.wheels){const[wx,wz]=this.wheelWorld(w);Col.surf(wx,wz,this.y+.55,.55,tmp);ys.push(tmp.y>-1e8?tmp.y:null)}
  const val=ys.map(v=>v===null?this.y:v);const tY=(val[0]+val[1]+val[2]+val[3])/4;
  // wheels order: left front,left rear,right front,right rear
  const yF=(val[0]+val[2])/2,yR=(val[1]+val[3])/2,yL=(val[0]+val[1])/2,yRt=(val[2]+val[3])/2;
  const gnd=ys.some(v=>v!==null);
  if(!gnd||this.y>tY+.1){this.vy-=26*dt;g.position.y+=this.vy*dt;if(gnd&&g.position.y<=tY){g.position.y=tY;if(this.vy<-9)this.damage((-this.vy-9)*3);this.vy=0}}
  else{const old=g.position.y;g.position.y+=(tY-g.position.y)*Math.min(1,dt*22);this.vy=0;this.vyG=lerp(this.vyG,(g.position.y-old)/Math.max(dt,1e-3),.3);if(this.vyG>4)this.vy=Math.min(this.vyG,9)}
  if(g.position.y<-40){g.position.set(0,.5,40);this.vx=this.vz=0;this.vy=0}
  const wbL=d.wb,tr=d.W-.3;this.pitchS=lerp(this.pitchS,Math.atan2(yF-yR,wbL),Math.min(1,dt*10));this.rollS=lerp(this.rollS,Math.atan2(yRt-yL,tr),Math.min(1,dt*10));
  const lat=yaw*vl;this.m.body.rotation.x=this.pitchS-clamp(a*.004,-.04,.04)+(ctl.brake?.02*clamp(sp/20,0,1):0);this.m.body.rotation.z=this.rollS-clamp(lat*.0035,-.07,.07);
  g.rotation.y=this.heading;this.animate(dt,ctl,vl)}
 visualOnly(dt){this.animate(dt,IDLE,0)}
 onRoad(){const bx=((this.x+45)%90+90)%90-45,bz=((this.z+45)%90+90)%90-45;return isCity(Math.round(this.x/90),Math.round(this.z/90))&&(Math.abs(bx)>37||Math.abs(bz)>37)||this.y>2}
 collideWorld(dt,px,pz){const d=this.def,hit=Col.vehicle(this,this.corners(),this.y,this.y+1.3);
  if(hit){const n=hit.n,ax=hit.x/n,az=hit.z/n,len=Math.hypot(ax,az)||1,nx=ax/len,nz=az/len;this.group.position.x+=ax;this.group.position.z+=az;const vn=this.vx*nx+this.vz*nz;
   if(vn<0){this.vx-=1.28*vn*nx;this.vz-=1.28*vn*nz;this.vx*=.93;this.vz*=.93;const imp=-vn;if(imp>3){this.damage((imp-3)*2.4);if(this===G.active)G.shake=Math.max(G.shake||0,clamp(imp/14,0,1))}
    const fx=-Math.sin(this.heading),fz=-Math.cos(this.heading);this.speed=this.vx*fx+this.vz*fz;this.vx=this.vx;}}
  const hl=d.L/2,fx=-Math.sin(this.heading),fz=-Math.cos(this.heading),sgn=Math.sign(this.speed)||1;
  if(Math.abs(this.speed)>.1&&inWater(this.x+fx*hl*sgn,this.z+fz*hl*sgn)){this.group.position.x=px;this.group.position.z=pz;this.vx*=-.25;this.vz*=-.25;if(this===G.active&&(G.waterMsg||0)<G.t-3){G.waterMsg=G.t;G.notify&&G.notify('Water ahead — find a boat or the bridge.')}}
  const b=1100;if(this.x>LIMITS.x1){this.group.position.x=LIMITS.x1;this.vx*=-.3}}
 animate(dt,ctl,vl){const m=this.m,d=this.def,night=G.night,ds=this.doorT>0;
  if(ds){this.doorT-=dt;if(this.doorT<=0)for(const dr of m.doors)dr.target=0}
  for(const dr of m.doors){dr.open+=(dr.target-dr.open)*Math.min(1,dt*6);if(dr.style==='scissor'){dr.pv.rotation.x=dr.open*1.0;dr.pv.rotation.y=dr.side*dr.open*.12}else dr.pv.rotation.y=dr.side*dr.open*1.05;dr.pv.visible=dr.open>.03}
  for(const w of m.wheels){w.mesh.rotation.x-=vl*dt/d.wr;if(w.front&&!(this.flight.p>0))w.piv.rotation.y=-this.steerAng}
  const braking=(ctl.brake>0||(ctl.thr<0&&vl>.5)||ctl.hand);const on=this.driver||this.ai||this.awake;
  m.head.color.setScalar(.35+.9*night);m.tail.color.setScalar(.38+.2*night+(braking?.55:0));
  if(this.siren&&m.flash){const ph=(G.t*6)%2<1;m.flash.m1.color.setHex(ph?0xff1111:0x330000);m.flash.m2.color.setHex(ph?0x001133:0x2255ff)}
  m.blob.position.y=.03-this.y+(this.y>1?0:0);m.blob.rotation.z=0;
  if(this.y>.8){m.blob.visible=false}else m.blob.visible=true}
 // ---------- Tesla flight ----------
 canFly(){return !!this.def.flight}
 toggleFlight(){if(!this.canFly()){G.notify&&G.notify('Only the Tesla Roadster 2030 has flight mode.');return}
  const f=this.flight;if(f.on&&!f.landing){f.landing=true;f.target=0;G.notify&&G.notify('Flight mode OFF — landing');}else if(!f.on){if(this.fuel<2){G.notify&&G.notify('Battery empty.');return}f.on=true;f.landing=false;f.vf=Math.max(0,this.speed);f.ground=this.y;f.target=this.y+30;f.hdg=this.heading;G.notify&&G.notify('FLIGHT MODE — W/S fly · A/D turn · SPACE up · C down · SHIFT boost · F land')}}
 flyUpdate(dt,ctl){const f=this.flight,g=this.group,d=this.def;
  const fw=(ctl.fwdKey||0);let turn=-(ctl.steer||0);
  if(f.on){
   if(!f.landing){f.target+=((ctl.up?1:0)-(ctl.down?1:0))*16*dt;f.target=clamp(f.target,this.y*0+2,160)}
   else{f.target=0}
   const acc=(ctl.boost?95:48);f.vf+=((ctl.thr||0)*acc)*dt;f.vf*=Math.exp(-(ctl.thr?0.12:.5)*dt);f.vf=clamp(f.vf,-18,ctl.boost?100:52);
   this.heading+=turn*1.15*dt*(Math.abs(f.vf)>1?1:.4);
   // ground below & landing
   const fx=-Math.sin(this.heading),fz=-Math.cos(this.heading);let nx=this.x+fx*f.vf*dt,nz=this.z+fz*f.vf*dt;
   Col.surf(nx,nz,this.y+1,60,tmp);const gy=tmp.y>-1e8?tmp.y:0,minY=(inWater(nx,nz)?SEAY:gy)+.0;
   const tgtY=f.landing?Math.max(gy,minY):Math.max(f.target,gy+2.2);
   const dy=tgtY-this.y,mv=clamp(dy*1.6,-14,12);let ny=this.y+mv*dt;
   const hit=Col.hitSphere(nx,ny+.7,nz,2.6);if(hit&&!f.landing){f.vf*=-.3;nx=this.x;nz=this.z;if(Math.abs(f.vf)>25)this.damage(5)}
   g.position.set(nx,Math.max(ny,gy),nz);this.vx=fx*f.vf;this.vz=fz*f.vf;this.speed=f.vf;this.vy=mv;
   this.fuel=Math.max(0,this.fuel-dt*(ctl.boost?.55:.28));if(this.fuel<=0){f.landing=true;G.notify&&G.notify('Battery depleted — emergency landing')}
   f.p=Math.min(1,f.p+dt*1.1);
   if(f.landing&&this.y-gy<.15&&!inWater(nx,nz)){f.on=false;this.vy=0;this.vyG=0;this.speed=f.vf*.6;this.vx=fx*this.speed;this.vz=fz*this.speed;G.notify&&G.notify('Landed — driving mode')}
  }else{f.p=Math.max(0,f.p-dt*1.6);const gp=this.y;Col.surf(this.x,this.z,this.y+.5,.5,tmp);if(tmp.y>-1e8)g.position.y+=(tmp.y-g.position.y)*Math.min(1,dt*10)}
  const p=f.p;this.m.body.rotation.x=lerp(this.m.body.rotation.x,-clamp(f.vf/90,-.4,.4)*p+(ctl.up?.04:0),Math.min(1,dt*4));this.m.body.rotation.z=lerp(this.m.body.rotation.z,clamp(turn*f.vf/60,-.5,.5),Math.min(1,dt*4))+Math.sin(G.t*3)*.005*p;
  g.rotation.y=this.heading;
  for(const w of this.m.wheels){w.piv.rotation.z=p*Math.PI/2;w.piv.rotation.y=0;w.mesh.rotation.x+=dt*40*p}
  this.thrust=this.thrust||this.makeThrusters();for(const t of this.thrust){t.visible=p>.05;t.material.opacity=p*(.55+Math.sin(G.t*40+t.userData.k)*.12);t.scale.y=.8+p*(.6+.4*Math.abs(Math.sin(G.t*30)))}
  this.m.head.color.setScalar(.35+.9*G.night);this.m.tail.color.setScalar(.5+.4*G.night);this.m.blob.visible=false}
 makeThrusters(){const arr=[];let k=0;for(const w of this.m.geos.wheels){const m=new THREE.Mesh(new THREE.ConeGeometry(.28,1.1,10,1,true),new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(w.x,w.y-.45,w.z);m.userData.k=k++;m.visible=false;m.geometry.translate(0,-.55,0);m.rotation.x=Math.PI;m.geometry.translate(0,1.1,0);this.m.body.add(m);arr.push(m)}return arr}
 get flying(){return this.flight.on}
 exitSpot(){const d=this.def,c=Math.cos(this.heading),s=Math.sin(this.heading);
  for(const side of[-1,1,0]){const off=d.W/2+1.0,lx=side*off,lz=side===0?d.L/2+1.4:0;const x=this.x+lx*c+lz*s,z=this.z-lx*s+lz*c;
   const tp={x,z};Col.pushCircle(tp,.45,this.y,1.7,.5);if(Math.hypot(tp.x-x,tp.z-z)<.05&&!inWater(x,z))return{x,z}}
  return{x:this.x+1.5,z:this.z}}
}
const SEAY=-.9;
function coastGuess(z){return 520+22*Math.sin(z*.008)+14*Math.sin(z*.021+1)}
// ---------- spawning ----------
export function spawnCar(name,x,z,heading,paint,opts={}){let def=typeof name==='string'?(resolveDef(name)||fallbackDef(name)):name;
 const p=paint??(opts.keepPaint===false?paints[Math.floor(Math.random()*paints.length)]:def.paint??paints[Math.floor(Math.random()*paints.length)]);
 return new Vehicle(def,p,x,z,heading,opts.y)}
// headlight beams for the active vehicle
export const beams=[];for(let i=0;i<2;i++){const s=new THREE.SpotLight(0xfff1d0,0,80,.6,.55,1.6);scene.add(s,s.target);beams.push(s)}
export function updateBeams(v){const night=G.night;for(let i=0;i<2;i++){const s=beams[i];if(!v||v.kind!=='car'||night<.05){s.intensity=0;continue}const sx=i?1:-1,def=v.def,c=Math.cos(v.heading),sn=Math.sin(v.heading),lx=sx*(def.W/2-.4),lz=-def.L/2+.1;
 s.position.set(v.x+lx*c+lz*sn,v.y+def.nose-.1,v.z-lx*sn+lz*c);const fx=-sn,fz=-c;s.target.position.set(s.position.x+fx*25,v.y+.2,s.position.z+fz*25);s.intensity=900*night}}
