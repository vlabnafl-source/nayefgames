import {THREE,scene,G,SB,M,C,clamp,lerp,TAU,SEA,CURB,blobTex} from './core.js';
import {Col,groundH,inWater} from './world.js';
import {Base} from './vehicles.js';
import {UI} from './ui.js';
import {makeAircraft} from './planes.js';
const V3=THREE.Vector3,tmp={};
const IDENT=new THREE.Matrix4();
const M4=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V3(sx,sy,sz));
const paintM=(c)=>new THREE.MeshPhysicalMaterial({color:c,roughness:.3,metalness:.55,clearcoat:1,clearcoatRoughness:.08,vertexColors:true});
function groupFrom(sb,paint){const g=new THREE.Group(),gs=sb.geos();for(const k in gs){const mat=k==='body'?paint:(M[k]||M.solid);const m=new THREE.Mesh(gs[k],mat);m.castShadow=k!=='glass'&&k!=='emis';m.receiveShadow=true;if(k==='glass')m.renderOrder=3;g.add(m)}return g}
// ---------- helicopter model ----------
function heliModel(col,police){const sb=new SB();const W=0xffffff;
 sb.addGeo('body',new THREE.SphereGeometry(1,20,14),M4(0,1.5,-.3,0,0,0,1.15,1.15,2.3),W);
 sb.addGeo('glass',new THREE.SphereGeometry(1,16,12),M4(0,1.7,-1.6,0,0,0,1.05,.95,1.2),0x0b1620);
 sb.addGeo('body',new THREE.CylinderGeometry(.55,.14,6.2,10),M4(0,1.9,3.8,Math.PI/2,0,0),W);
 sb.addGeo('body',new THREE.BoxGeometry(.1,1.5,1.2),M4(0,2.6,6.6),W);sb.addGeo('body',new THREE.BoxGeometry(2.2,.08,.7),M4(0,1.95,6.2),W);
 sb.addGeo('solid',new THREE.CylinderGeometry(.12,.12,.8,8),M4(0,3.1,0),0x222);
 for(const sx of[-1,1]){sb.addGeo('solid',new THREE.CylinderGeometry(.07,.07,4.2,8),M4(sx*1.1,.2,-.2,Math.PI/2,0,0),0x2a2a2e);for(const z of[-1.1,1]){sb.addGeo('solid',new THREE.CylinderGeometry(.05,.05,1.2,6),M4(sx*1.0,.8,z,0,0,sx*.2),0x2a2a2e)}}
 sb.box('emis',0,.9,-2.5,.5,.2,.1,0xfff5d0);sb.box('emis',-1.2,1.6,.3,.1,.1,.1,0xff2030);sb.box('emis',1.2,1.6,.3,.1,.1,.1,0x20ff60);
 if(police){sb.box('body',0,3.0,.2,.2,.1,.8,0x1b3d8f);sb.box('emis',-.3,2.95,-.5,.4,.1,.3,0xff1111);sb.box('emis',.3,2.95,-.5,.4,.1,.3,0x1133ff)}
 const g=groupFrom(sb,paintM(col));
 const rotor=new THREE.Group();rotor.position.set(0,3.2,0);const bm=new THREE.MeshStandardMaterial({color:0x1b1d22,roughness:.5});
 for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.28,.05,5.6),bm);b.position.set(0,0,0);b.rotation.y=k*Math.PI/2;b.position.set(Math.sin(k*Math.PI/2)*2.8,0,Math.cos(k*Math.PI/2)*2.8);rotor.add(b)}
 const disc=new THREE.Mesh(new THREE.CircleGeometry(5.6,28),new THREE.MeshBasicMaterial({color:0x888a90,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));disc.rotation.x=-Math.PI/2;rotor.add(disc);
 g.add(rotor);const tail=new THREE.Group();tail.position.set(.18,2.6,6.6);const tb=new THREE.Mesh(new THREE.BoxGeometry(.04,1.5,.12),bm);tail.add(tb);const tb2=tb.clone();tb2.rotation.x=Math.PI/2;tail.add(tb2);g.add(tail);
 return{g,rotor,tail,disc,bm}}
export class Heli extends Base{
 constructor(x,y,z,h,col=0xe8e8ee,police=false){super('heli');this.isAirV=true;this.def={name:police?'Police Helicopter':'Helicopter',L:11,W:3};this.label=this.def.name;const m=heliModel(col,police);this.m=m;this.group.add(m.g);this.group.position.set(x,y,z);this.heading=h;this.group.rotation.y=h;
  this.rpm=0;this.pitchV=0;this.rollV=0;this.hx=0;this.hz=0;this.onGround=true;this.L=11;this.W=3;this.radius=5;this.police=police;this.landedOK=true;this.helpText='<b>W/S</b> forward/back · <b>A/D</b> turn · <b>SPACE</b> up · <b>C</b> down · <b>SHIFT</b> boost · <b>E</b> exit (land first)';
  this.blob=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,opacity:.8}));this.blob.rotation.x=-Math.PI/2;scene.add(this.blob)}
 get isAir(){return true}
 destroy(){scene.remove(this.blob);super.destroy()}
 controls(k){const w=k.KeyW||k.ArrowUp,s=k.KeyS||k.ArrowDown,a=k.KeyA||k.ArrowLeft,d=k.KeyD||k.ArrowRight;return{pitch:(w?1:0)-(s?1:0),yaw:(a?1:0)-(d?1:0),up:k.Space?1:0,down:(k.KeyC||k.ControlLeft)?1:0,boost:!!k.ShiftLeft}}
 speedText(){return `${Math.round(Math.hypot(this.hx,this.hz)*3.6)} km/h · ALT ${Math.max(0,Math.round(this.y-this.gy))} m · RPM ${Math.round(this.rpm*100)}%`}
 exitSpot(){const c=Math.cos(this.heading),s=Math.sin(this.heading);return{x:this.x+c*3.6,z:this.z-s*3.6}}
 update(dt,ctl){ctl=ctl||{pitch:0,yaw:0,up:0,down:0,boost:false};const g=this.group,driven=this.driver||this.policeAI;
  this.rpm+=((driven?1:0)-this.rpm)*Math.min(1,dt*(driven?.5:.4));
  Col.surf(this.x,this.z,this.y+2,3,tmp);let gy=tmp.y>-1e8?tmp.y:0;if(inWater(this.x,this.z))gy=Math.max(gy,SEA);this.gy=gy;
  const lift=this.rpm>.85;let vt=0;if(lift){vt=(ctl.up?9:0)-(ctl.down?7:0)}
  if(this.policeAI&&G.wanted>0){return this.policeUpdate(dt)}
  if(!lift){this.vy-=18*dt}else this.vy+=(vt-this.vy)*Math.min(1,dt*2.2);
  const hov=(this.y-gy)>1.5;const boost=ctl.boost?1.8:1;
  const fx=-Math.sin(this.heading),fz=-Math.cos(this.heading);
  if(lift&&hov){const ac=ctl.pitch*26*boost;this.hx+=fx*ac*dt;this.hz+=fz*ac*dt;this.heading+=ctl.yaw*1.3*dt}
  else if(lift&&!hov){this.heading+=ctl.yaw*.9*dt;this.hx+=fx*ctl.pitch*8*dt;this.hz+=fz*ctl.pitch*8*dt}
  const dr=hov?Math.exp(-.35*dt):Math.exp(-4*dt);this.hx*=dr;this.hz*=dr;const sp=Math.hypot(this.hx,this.hz),mx=45*boost;if(sp>mx){this.hx*=mx/sp;this.hz*=mx/sp}
  let nx=this.x+this.hx*dt,nz=this.z+this.hz*dt,ny=this.y+this.vy*dt;
  // collision
  const hit=Col.hitSphere(nx,ny+1.8,nz,2.4);if(hit&&hov){const imp=Math.hypot(this.hx,this.hz)+Math.abs(this.vy);this.hx*=-.3;this.hz*=-.3;nx=this.x;nz=this.z;ny=this.y;if(imp>12){this.hurt(imp*2)}else this.hurt(imp*.5)}
  if(ny<=gy){if(this.vy<-9)this.hurt((-this.vy-9)*8);ny=gy;this.vy=Math.max(this.vy,0);this.onGround=true}else this.onGround=ny-gy<.3;
  this.landedOK=this.onGround&&Math.hypot(this.hx,this.hz)<3;
  g.position.set(nx,ny,nz);this.speed=Math.hypot(this.hx,this.hz);
  const tp=-ctl.pitch*.28*Math.min(1,this.speed/10+.3)*(hov?1:0),tr=-ctl.yaw*.25*(hov?1:0);this.pitchV+=(tp-this.pitchV)*Math.min(1,dt*3);this.rollV+=(tr-this.rollV)*Math.min(1,dt*3);
  g.rotation.set(this.pitchV,this.heading,this.rollV,'YXZ');
  this.m.rotor.rotation.y+=dt*this.rpm*38;this.m.tail.rotation.x+=dt*this.rpm*60;this.m.disc.material.opacity=this.rpm*.18;
  this.blob.position.set(nx,gy+.05,nz);this.blob.visible=ny-gy<40;const bs=1+(ny-gy)*.03;this.blob.scale.set(bs,bs,1);this.blob.material.opacity=Math.max(.1,.8-(ny-gy)*.02)}
 hurt(n){this.health-=n;if(this===G.active){G.shake=Math.max(G.shake||0,clamp(n/30,0,1));}if(this.health<=0&&!this.dead)crash(this)}
 policeUpdate(dt){const p=G.active?G.active:G.player.g.position,ph=this;const t=G.t;const cx=p.x+Math.cos(t*.25)*55,cz=p.z+Math.sin(t*.25)*55,ty=Math.max(groundH(p.x,p.z),0)+55;
  const dx=cx-this.x,dz=cz-this.z,d=Math.hypot(dx,dz);const sp=Math.min(34,d*.6);this.hx+=((dx/d||0)*sp-this.hx)*Math.min(1,dt*1.5);this.hz+=((dz/d||0)*sp-this.hz)*Math.min(1,dt*1.5);this.vy+=((ty-this.y)*.5-this.vy)*Math.min(1,dt*2);
  this.heading=Math.atan2(-(p.x-this.x),-(p.z-this.z));this.group.position.set(this.x+this.hx*dt,this.y+this.vy*dt,this.z+this.hz*dt);this.group.rotation.set(.12,this.heading,0,'YXZ');this.m.rotor.rotation.y+=dt*38;this.m.disc.material.opacity=.18;this.rpm=1;this.blob.visible=false;this.speed=Math.hypot(this.hx,this.hz)}
}
// ---------- jets use the realistic models from planes.js ----------
const vipFor=c=>c===0x1b3d8f?'vip2':c===0x15161a?'vip3':c===0x2e6fb5?'vip2':'vip';
export class Jet extends Base{
 constructor(x,z,h,col=0xf4f4f0,scale=1,y,opts={}){super('jet');this.isAirV=true;this.big=scale>1.5;this.scale=1;const m=makeAircraft(this.big?'airliner':'biz',{airline:opts.airline||(this.big?'neon':vipFor(col))});this.m=m;this.group.add(m.g);
  this.def={name:this.big?'Airliner':'Private Jet',L:m.L,W:this.big?36:21};this.label=this.def.name;this.L=m.L;this.W=this.def.W;this.radius=m.L*.5;this.gearH=0;this.gk=0;this.camDist=this.big?48:32;
  Col.surf(x,z,5,5,tmp);this.group.position.set(x,y??Math.max(tmp.y,0),z);this.heading=h;this.pitch=0;this.roll=0;this.throttle=0;this.speed=0;this.onGround=true;this.landedOK=true;this.vs=0;this.stall=this.big?56:48;
  this.group.rotation.set(0,h,0);
  this.helpText='<b>SHIFT/C</b> throttle ± · <b>W/S</b> pitch · <b>A/D</b> bank/steer · <b>SPACE</b> brakes · takeoff at ~'+Math.round(this.stall*1.2)+' m/s · <b>E</b> exit (stopped)';this.nav=0}
 get isAir(){return true}
 controls(k){const w=k.KeyW||k.ArrowUp,s=k.KeyS||k.ArrowDown,a=k.KeyA||k.ArrowLeft,d=k.KeyD||k.ArrowRight;return{pitch:(s?1:0)-(w?1:0),roll:(a?1:0)-(d?1:0),thrUp:k.ShiftLeft?1:0,thrDown:(k.KeyC||k.ControlLeft)?1:0,brake:k.Space?1:0}}
 speedText(){return `${Math.round(this.speed*3.6)} km/h · ALT ${Math.max(0,Math.round(this.y-(this.gy||0)))} m · THR ${Math.round(this.throttle*100)}%`}
 exitSpot(){const c=Math.cos(this.heading),s=Math.sin(this.heading);return{x:this.x+c*(this.W*.2+5),z:this.z-s*(this.W*.2+5)}}
 hurt(n){this.health-=n;if(this===G.active)G.shake=Math.max(G.shake||0,clamp(n/30,0,1));if(this.health<=0&&!this.dead)crash(this)}
 update(dt,ctl){if(this.scripted)return;ctl=ctl||{pitch:0,roll:0,thrUp:0,thrDown:0,brake:0};const g=this.group,driven=!!this.driver;
  if(!driven&&this.onGround&&this.speed<.5){this.speed=0;this.m.setGear(0);this.gk=0;this.m.tick(dt,{speed:0,airborne:false,engines:false});return}
  this.throttle=clamp(this.throttle+((ctl.thrUp?1:0)-(ctl.thrDown?1:0))*.45*dt,0,1);if(!driven)this.throttle=0;
  Col.surf(this.x,this.z,this.y+3,4,tmp);let gy=tmp.y>-1e8?tmp.y:0;const water=inWater(this.x,this.z);if(water)gy=SEA;this.gy=gy;const H=this.gearH;
  const sinP=Math.sin(this.pitch);
  this.speed+=(this.throttle*8.5-.0005*this.speed*this.speed-9.8*sinP-(this.onGround?(.9+ctl.brake*14):0))*dt;this.speed=Math.max(0,this.speed);
  const agl=this.y-gy-H;this.onGround=agl<.15;
  const spf=clamp(this.speed/45,0,1.4);
  if(this.onGround){this.roll+=(0-this.roll)*Math.min(1,dt*6);const rot=this.speed>this.stall*1.2;
   this.pitch+=(rot&&ctl.pitch>0?Math.min(.35,this.pitch+ctl.pitch*.5*dt):0-(rot?0:this.pitch))*(rot?1:Math.min(1,dt*5))*0+(rot&&ctl.pitch>0?ctl.pitch*.5*dt:(this.pitch>0?-.6*dt:0));this.pitch=clamp(this.pitch,0,.45);
   this.heading+=-(ctl.roll?-ctl.roll:0)*0+ctl.roll*clamp(this.speed/6,0,1)*.8*dt*(this.speed>40?.5:1)}
  else{this.pitch+=ctl.pitch*(.55*clamp(spf,.2,1.2))*dt;this.pitch=clamp(this.pitch,-.65,.6);if(!ctl.pitch)this.pitch+=(0-this.pitch)*Math.min(1,dt*.15);
   const tr=ctl.roll*1.0;this.roll+=(tr-this.roll)*Math.min(1,dt*4.4);if(!ctl.roll)this.roll+=(0-this.roll)*Math.min(1,dt*.6);
   this.heading+=Math.tan(this.roll)*9.8/Math.max(this.speed,35)*dt*(driven?2.5:1)}
  const cp=Math.cos(this.pitch),fx=-Math.sin(this.heading)*cp,fz=-Math.cos(this.heading)*cp,fy=Math.sin(this.pitch);
  const sink=this.onGround&&this.pitch<.04?0:clamp((this.stall-this.speed)/this.stall,0,1)*38*clamp(1-this.pitch*1.2,0,1);
  let nx=this.x+fx*this.speed*dt,nz=this.z+fz*this.speed*dt,ny=this.y+(fy*this.speed-sink)*dt;this.vs=(ny-this.y)/dt;
  if(Col.hitSphere(nx,ny+(this.big?3.6:1.8),nz,this.big?5:3.2)){this.hurt(100)}
  if(ny<gy+H){if(!this.onGround){const sinkRate=-this.vs;const ok=sinkRate<9&&this.speed<105&&Math.abs(this.roll)<.3&&!water;if(!ok){ny=gy+H;this.hurt(100)}else{this.hurt(sinkRate>5?(sinkRate-5)*6:0)}}ny=gy+H;this.onGround=true;if(this.pitch<0)this.pitch*=.5}
  if(water&&ny<SEA+H+.1&&!this.onGround===false){}
  g.position.set(nx,ny,nz);this.landedOK=this.onGround&&this.speed<4;
  g.rotation.set(this.pitch,this.heading,this.roll,'YXZ');const up=(ny-gy>40&&this.speed>55)?1:0;this.gk=clamp(this.gk+(up?1:-1)*dt*.4,0,1);this.m.setGear(this.gk);this.m.tick(dt,{speed:this.speed,airborne:!this.onGround,engines:true});
  this.vx=fx*this.speed;this.vz=fz*this.speed;this.nav+=dt}
}
// ---------- boats ----------
function boatModel(yacht,col){const sb=new SB(),W=0xffffff;const L=yacht?26:9,Wd=yacht?6.6:2.8,Hh=yacht?1.9:.9;
 const hs=new THREE.Shape();hs.moveTo(-Wd/2,L/2*0-L/2);hs.lineTo(Wd/2,-L/2);hs.lineTo(Wd/2,L*.15);hs.quadraticCurveTo(Wd*.45,L*.38,0,L/2);hs.quadraticCurveTo(-Wd*.45,L*.38,-Wd/2,L*.15);hs.lineTo(-Wd/2,-L/2);
 const hg=new THREE.ExtrudeGeometry(hs,{depth:Hh,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:2});hg.rotateX(-Math.PI/2);
 // hull: after rotateX(-90) shape y->-z... front toward -z
 hg.scale(1,1,-1);sb.addGeo('body',hg,M4(0,-.3,0),W);
 sb.addGeo('solid',hg,M4(0,-.32,0,0,0,0,.995,.35,.995),0x15203a);
 if(yacht){sb.box('body',0,Hh+.55,L*.04,Wd*.8,1.1,L*.52,W);sb.box('glass',0,Hh+.7,L*.04,Wd*.82,.55,L*.5,0x0b1620);sb.box('body',0,Hh+1.35,L*.06,Wd*.65,.2,L*.4,W);
  sb.box('body',0,Hh+2.0,L*.12,Wd*.5,1.3,L*.22,W);sb.box('glass',0,Hh+2.1,L*.12,Wd*.52,.6,L*.2,0x0b1620);sb.box('body',0,Hh+2.9,L*.12,Wd*.55,.15,L*.24,0x2a2d33);
  sb.box('metal',0,Hh+3.8,L*.14,.1,1.6,.1,0xaaaaaa);sb.box('emis',0,Hh+4.6,L*.14,.15,.15,.15,0xff3030);for(const sx of[-1,1]){sb.box('solid',sx*Wd*.48,Hh+.5,L*.0,.06,.9,L*.55,0xdfe3e8)}
  sb.box('solid',0,Hh+.05,-L*.28,Wd*.7,.06,L*.18,0x9a7048);sb.box('solid',0,Hh+.15,L*.36,Wd*.7,.2,L*.12,0xd9d4c8)}
 else{sb.box('body',0,Hh+.35,.6,Wd*.8,.5,2.6,W);sb.box('glass',0,Hh+.9,-.5,Wd*.75,.5,1.2,0x0b1620);sb.box('solid',0,Hh+.15,2.6,Wd*.6,.2,1.6,0x2a2d33);sb.addGeo('solid',new THREE.CylinderGeometry(.18,.18,.8,8),M4(0,.4,L/2-.3,.3,0,0),0x2a2a2e)}
 sb.box('emis',-Wd/2,Hh+.3,-L/2+.8,.1,.1,.1,0xff2030);sb.box('emis',Wd/2,Hh+.3,-L/2+.8,.1,.1,.1,0x20ff60);
 const g=groupFrom(sb,paintM(col));return{g,L,W:Wd,H:Hh}}
export class Boat extends Base{
 constructor(x,z,h,yacht=false,col=0xf4f4f0){super('boat');this.yacht=yacht;const m=boatModel(yacht,col);this.m=m;this.group.add(m.g);this.def={name:yacht?'Luxury Yacht':'Speedboat',L:m.L,W:m.W};this.label=this.def.name;this.L=m.L;this.W=m.W;this.radius=m.L*.4;
  this.group.position.set(x,SEA+.3,z);this.heading=h;this.helpText='<b>W/S</b> throttle · <b>A/D</b> steer · <b>SHIFT</b> boost · <b>E</b> exit';this.speed=0;this.max=yacht?16:30;this.owned=true;this.wake=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,depthWrite:false}));this.wake.rotation.x=-Math.PI/2;scene.add(this.wake);this.pr=0;this.rr=0}
 destroy(){scene.remove(this.wake);super.destroy()}
 controls(k){const w=k.KeyW||k.ArrowUp,s=k.KeyS||k.ArrowDown,a=k.KeyA||k.ArrowLeft,d=k.KeyD||k.ArrowRight;return{thr:(w?1:0)-(s?1:0),steer:(d?1:0)-(a?1:0),boost:!!k.ShiftLeft}}
 speedText(){return Math.round(Math.abs(this.speed)*1.94)+' kn'}
 exitSpot(){const c=Math.cos(this.heading),s=Math.sin(this.heading);for(const side of[1,-1]){for(const r of[this.W/2+1.5,this.W/2+4,this.L/2+3]){const x=this.x+c*r*side,z=this.z-s*r*side;if(!inWater(x,z))return{x,z}}}
  for(let k=0;k<16;k++){const a=k/16*TAU;for(const r of[8,14]){const x=this.x+Math.cos(a)*r,z=this.z+Math.sin(a)*r;if(!inWater(x,z))return{x,z}}}return{x:this.x+c*(this.W/2+2),z:this.z-s*(this.W/2+2)}}
 update(dt,ctl){ctl=ctl||{thr:0,steer:0,boost:false};const driven=!!this.driver;if(!driven&&Math.abs(this.speed)<.05){this.bob(dt);return}
  const mx=this.max*(ctl.boost?1.25:1);this.speed+=(ctl.thr*(this.yacht?4.5:10)*(ctl.boost?1.5:1)-this.speed*(this.yacht?.18:.3)*.5-Math.sign(this.speed)*.1)*dt;this.speed=clamp(this.speed,-mx*.3,mx);
  this.heading+=-ctl.steer*(this.yacht?.35:.7)*clamp(Math.abs(this.speed)/(this.yacht?4:7),0,1)*Math.sign(this.speed||1)*dt;
  const fx=-Math.sin(this.heading),fz=-Math.cos(this.heading);let nx=this.x+fx*this.speed*dt,nz=this.z+fz*this.speed*dt;
  const fx2=nx+fx*this.L*.45,fz2=nz+fz*this.L*.45;if(groundH(fx2,fz2)>SEA-.9||groundH(nx,nz)>SEA-.7){nx=this.x;nz=this.z;this.speed*=-.3;if(this===G.active&&(G.t-(this.msgT||0))>3){this.msgT=G.t;G.notify('Shallow water ahead.')}}
  this.group.position.x=nx;this.group.position.z=nz;this.vx=fx*this.speed;this.vz=fz*this.speed;this.bob(dt);
  this.pr+=((-ctl.thr*.05*(this.yacht?.4:1))-this.pr)*dt*2;this.rr+=(ctl.steer*clamp(this.speed/20,0,1)*.2-this.rr)*dt*2;
  this.group.rotation.set(this.pr+Math.sin(G.t*1.3+this.id)*.01,this.heading,this.rr+Math.sin(G.t*1.1+this.id)*.012,'YXZ');
  const sp=Math.abs(this.speed);this.wake.visible=sp>1;this.wake.position.set(nx-fx*this.L*.55,SEA+.35,nz-fz*this.L*.55);this.wake.rotation.z=-this.heading;this.wake.scale.set(this.W*1.2,Math.min(sp*2.2,30),1);this.wake.position.x-=fx*Math.min(sp*1.1,15);this.wake.position.z-=fz*Math.min(sp*1.1,15)}
 bob(dt){this.group.position.y=SEA+.25+Math.sin(G.t*1.2+this.x*.1)*.12+(this.yacht?.35:0)}
}
function crash(v){if(v.dead)return;const wasActive=v===G.active;const px=v.x,pz=v.z,py=v.y;
 // fireball
 const f=new THREE.Mesh(new THREE.SphereGeometry(5,12,8),new THREE.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:.9}));f.position.set(px,py+2,pz);scene.add(f);let t=0;const id=setInterval(()=>{t+=.05;f.scale.setScalar(1+t*3);f.material.opacity=Math.max(0,.9-t*1.2);if(t>.8){scene.remove(f);clearInterval(id)}},50);
 if(wasActive){import('./player.js').then(m=>{v.landedOK=true;const P=m.P;G.active=null;v.driver=null;P.g.visible=true;P.mode='foot';const gy=groundH(px,pz);P.g.position.set(px+3,Math.max(gy,0)+.3,pz);P.vy=0;G.hud();P.hurt(40,'crash');G.crime(1,'Aircraft crash');G.notify('CRASH! Your aircraft was destroyed.')})}
 v.dead=true;setTimeout(()=>v.destroy(),30)}
// ---------- registration ----------
G.specials.helicopter=(x,z,h)=>new Heli(x,Math.max(groundH(x,z),0),z,h);G.specials.heli=G.specials.helicopter;
G.specials.policeheli=(x,z,h)=>{const v=new Heli(x,Math.max(groundH(x,z),0)+50,z,h,0xf5f5f5,true);v.rpm=1;v.label='Police Helicopter';return v};
G.specials['police helicopter']=G.specials.policeheli;
G.specials['private jet']=(x,z,h)=>new Jet(x,z,h);G.specials.jet=G.specials['private jet'];G.specials.airliner=(x,z,h)=>new Jet(x,z,h,0xf2f2ee,2.2);
G.specials.yacht=(x,z,h)=>{let X=x,Z=z;if(!inWater(X,Z)){const tp=G.tp['Marina'];if(tp){X=tp.x+30;Z=tp.z}}const b=new Boat(X,Z,h,true,0xf4f4f0);G.notify&&inWater(x,z)||G.notify('No water here — yacht spawned at the marina.');return b};
G.specials.speedboat=(x,z,h)=>{let X=x,Z=z;if(!inWater(X,Z)){const tp=G.tp['Marina'];if(tp){X=tp.x+40;Z=tp.z+14}}return new Boat(X,Z,h,false,0xe33b2e)};G.specials.boat=G.specials.speedboat;
// aircraft spawn: place helicopter+jet nicely off the ground ahead of player
