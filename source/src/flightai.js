// Autonomous airline traffic for NEON INTERNATIONAL AIRPORT (pure logic, no rendering).
// Every airliner cycles: gate (deplane/board) -> pushback -> taxi -> hold -> line-up -> take-off roll -> climb ->
// closed circuit (stadium shaped) -> final approach -> landing roll -> taxi in -> gate.
// Heading convention (same as Jet): forward = (-sin h, -cos h); h=0 is north (-z); left turn = +h.
export const A={RWX:-900,TAXI_X:-835,LANE_X:-768,PX:-728,GATES:[-105,-63,-21,21,63,105],Z_START:390,Z_LOF:-400,Z_TD:400,HOLD:{x:-863,z:420}};
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),G0=9.81;
const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
// ---- analytic path: sequence of straight/arc segments ----
export class Path{
 constructor(x,z,h){this.x=x;this.z=z;this.h=h;this.segs=[];this.len=0}
 line(l){this.segs.push({s0:this.len,l,k:0,x0:this.x,z0:this.z,h0:this.h});this.x+=-Math.sin(this.h)*l;this.z+=-Math.cos(this.h)*l;this.len+=l;return this}
 turn(dir,R,deg){const a=deg*Math.PI/180,l=a*R,k=dir/R;const h1=this.h+dir*a;
  this.segs.push({s0:this.len,l,k,x0:this.x,z0:this.z,h0:this.h});
  this.x=this.x+(Math.cos(h1)-Math.cos(this.h))/k;this.z=this.z-(Math.sin(h1)-Math.sin(this.h))/k;this.h=h1;this.len+=l;return this}
 at(s,o={}){s=clamp(s,0,this.len);let lo=0,hi=this.segs.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(this.segs[m].s0<=s)lo=m;else hi=m-1}
  const g=this.segs[lo],d=s-g.s0;o.k=g.k;
  if(Math.abs(g.k)<1e-9){o.h=g.h0;o.x=g.x0-Math.sin(g.h0)*d;o.z=g.z0-Math.cos(g.h0)*d}
  else{const h=g.h0+g.k*d;o.h=h;o.x=g.x0+(Math.cos(h)-Math.cos(g.h0))/g.k;o.z=g.z0-(Math.sin(h)-Math.sin(g.h0))/g.k}
  return o}}
// ---- routes ----
export const R_OUT=gz=>{const p=new Path(A.LANE_X,gz,Math.PI);p.line(215-gz).turn(-1,30,90).line(7).turn(1,30,90).line(392-275).turn(-1,28,90);return p};
const OUT_APRON_FREE=gz=>(215-gz)+47+7+47+2;      // distance after which the apron lane is free again
export const R_LINEUP=()=>{const p=new Path(A.HOLD.x,A.HOLD.z,Math.PI/2);p.line(7).turn(-1,30,90);return p};
export const R_IN1=()=>{const p=new Path(A.RWX,-120,0);p.turn(-1,100,45).line(25).turn(-1,60,45).line(20.6);return p};
export const R_IN2=gz=>{const p=new Path(-790,-226.0,-Math.PI/2);p.turn(-1,22,90).line(gz-30-(-204)).turn(1,30,90).line(10);return p};
// airborne circuit (stadium) from lift-off to touchdown
const AIR=(()=>{const p=new Path(A.RWX,A.Z_LOF,0);p.line(300).turn(-1,800,180).line(3300).turn(-1,800,180).line(2200);return p})();
const TOT=AIR.len,FINAL=2200,Z0G=408;
export const airAlt=s=>{const sf=TOT-s;if(sf<=FINAL){const z=A.Z_TD+sf;let a=(z-Z0G)*.052;if(sf<120)a=(520-Z0G)*.052*sstep(sf/120);return Math.max(0,a)}
 if(s<3000)return .11*s;if(s<5600)return 330;return lerp(330,114,(s-5600)/(TOT-FINAL-5600))};
const airSpd=s=>{const sf=TOT-s;if(sf<=FINAL)return lerp(64,70,sf/FINAL);if(s<1200)return lerp(70,80,s/1200);if(s<8000)return 80;return lerp(80,70,(s-8000)/(TOT-FINAL-8000))};
export const AIR_TOTAL=TOT;
const ROLL=A.Z_START-A.Z_LOF,V_LOF=70,ACC=(V_LOF*V_LOF-9)/(2*ROLL);
const ROLLOUT=520,V_TD=64,DEC=3.4;
const DEST=['PARIS, FRANCE','DUBAI, UAE','LONDON, UK','TOKYO, JAPAN','NEW YORK, USA','ROME, ITALY','CAIRO, EGYPT','SYDNEY, AUSTRALIA'];
export const AIRLINE_KEYS=['neon','gulf','sky','neon','gulf'];
// ---- shared airport state ----
export function createTraffic(opts={}){
 const T={planes:[],t:0,apron:null,taxiOut:null,lastLine:-999,gates:A.GATES.map((z,i)=>({i,z,occ:null,res:null})),hooks:opts.hooks||{},log:opts.log||(()=>{})};
 const rnd=opts.rand||Math.random;
 class AC{
  constructor(i){this.i=i;this.id=i;this.flight='NX '+(101+i*7);this.dest=DEST[i%DEST.length];this.airline=AIRLINE_KEYS[i%AIRLINE_KEYS.length];
   this.state='gate';this.t=0;this.x=0;this.y=.05;this.z=0;this.h=-Math.PI/2;this.pitch=0;this.roll=0;this.spd=0;this.airborne=false;this.gearT=0;this.eng=false;this.gate=null;this.path=null;this.s=0;this.status='';this.pax=0;this.paxOut=0;this.paxIn=0;this.o={};this.nextPax=0;this.arrival=false}
  park(g){this.gate=g;g.occ=this;g.res=null;this.x=A.PX;this.z=g.z;this.h=-Math.PI/2;this.y=.05;this.spd=0;this.airborne=false;this.eng=false;this.gearT=0}
  rem(){return TOT-this.s}
 }
 T.AC=AC;
 // ---- helpers ----
 const onRunway=p=>(p.state==='rollout'||p.state==='lineup'||p.state==='roll'||(p.state==='in1'&&p.x<A.RWX+25));
 T.canLineup=p=>{if(T.t-T.lastLine<55)return false;for(const q of T.planes){if(q===p)continue;if(onRunway(q))return false;if(q.state==='air'&&q.rem()<3200)return false}return true};
 const freeGate=()=>{const f=T.gates.filter(g=>!g.occ&&!g.res);return f.length?f[Math.floor(rnd()*f.length)]:null};
 const accel=(p,dt,target,a=1.6,b=2.2)=>{p.spd+=clamp(target-p.spd,-b*dt,a*dt);if(p.spd<0)p.spd=0};
 const follow=(p,dt,vmax,stop=true)=>{const rest=p.path.len-p.s;let tgt=vmax;if(stop)tgt=Math.min(vmax,Math.sqrt(2*1.1*Math.max(rest,0))+.4);accel(p,dt,tgt);p.s=Math.min(p.path.len,p.s+p.spd*dt);const o=p.path.at(p.s,p.o);p.x=o.x;p.z=o.z;p.h=o.h;p.roll=clamp(Math.atan(p.spd*p.spd*o.k/G0),-.12,.12)*.4;return rest<=.35&&p.spd<.6};
 T.addPlane=(i,mode,arg)=>{const p=new AC(i);T.planes.push(p);if(mode==='gate'){p.park(T.gates[arg.g]);p.t=arg.t;p.arrival=false;p.state='gate';p.status='BOARDING'}
  else if(mode==='air'){p.state='air';p.s=arg.s;p.airborne=true;p.eng=true;p.status='EN ROUTE';p.gearT=(TOT-arg.s<3400)?0:1}
  return p};
 // ---- per-plane update ----
 T.update=(dt)=>{T.t+=dt;for(const p of T.planes)step(p,dt);
  // lock bookkeeping safety
  };
 function step(p,dt){const h=T.hooks;
  switch(p.state){
  case'gate':{p.t+=dt;p.eng=false;const g=p.gate;
   // timeline: 0-22 deplane (arrivals) | 22-26 cleaning | 26-58 boarding | 58+ ready
   if(p.arrival&&p.t<22){p.status='LANDED';p.nextPax-=dt;if(p.nextPax<=0&&p.t>1&&p.t<14){p.nextPax=.8;h.pax&&h.pax('out',g.i,p)}}
   else if(p.t<26){p.status='CLEANING';p.arrival=false}
   else if(p.t<58){p.status='BOARDING';p.nextPax-=dt;if(p.nextPax<=0&&p.t<52){p.nextPax=.95;h.pax&&h.pax('in',g.i,p)}}
   else{p.status='GATE CLOSED';if(!T.apron&&!T.taxiOut){T.apron=p;T.taxiOut=p;p.state='push';p.s=0;p.eng=true;p.status='PUSHBACK';h.event&&h.event('push',p)}}
   break}
  case'push':{p.s+=1.7*dt;p.x=A.PX-p.s;p.z=p.gate.z;p.h=-Math.PI/2;p.spd=0;p.eng=true;
   if(p.s>=A.PX-A.LANE_X){p.gate.occ=null;p.gz=p.gate.z;p.gate=null;p.state='spin';p.t=0}break}
  case'spin':{p.t+=dt;const k=sstep(p.t/6);p.h=lerp(-Math.PI/2,-Math.PI,k);p.x=A.LANE_X;if(p.t>=6){p.state='taxiout';p.path=R_OUT(p.z);p.s=0;p.spd=0;p.status='TAXI'}break}
  case'taxiout':{const done=follow(p,dt,10);
   if(T.apron===p&&p.s>apronFree(p))T.apron=null;
   if(done){p.state='hold';p.t=0;p.status='HOLDING'}break}
  case'hold':{p.t+=dt;p.spd=0;if(T.canLineup(p)){T.lastLine=T.t;p.state='lineup';p.path=R_LINEUP();p.s=0;p.spd=0;p.status='LINE UP'}break}
  case'lineup':{const done=follow(p,dt,7,true);if(done){p.state='roll';p.s=0;p.spd=3;p.x=A.RWX;p.z=A.Z_START;p.h=0;T.taxiOut=null;p.status='DEPARTING';p.pitch=0}break}
  case'roll':{p.spd=Math.sqrt(9+2*ACC*p.s);p.s+=p.spd*dt;p.x=A.RWX;p.z=A.Z_START-Math.min(p.s,ROLL);p.h=0;p.y=.05;p.roll=0;
   p.pitch=p.s>ROLL-190?.16*sstep((p.s-(ROLL-190))/190):0;
   if(p.s>=ROLL){p.state='air';p.s=0;p.airborne=true;p.spd=V_LOF;p.status='DEPARTED';p.dest=DEST[(DEST.indexOf(p.dest)+1)%DEST.length];p.flight='NX '+(100+((parseInt(p.flight.slice(3))+1)%899));h.event&&h.event('lof',p)}break}
  case'air':{const o=p.o,v=airSpd(p.s);p.spd=v;p.s+=v*dt;if(p.s>=TOT){p.s=TOT;p.state='rollout';p.t=0;p.airborne=false;p.spd=V_TD;p.s=0;p.x=A.RWX;p.z=A.Z_TD;p.h=0;p.y=.05;p.pitch=.07;p.status='LANDED';p.arrival=true;h.event&&h.event('td',p);break}
   AIR.at(p.s,o);p.x=o.x;p.z=o.z;p.h=o.h;const a=airAlt(p.s),a2=airAlt(p.s+20);p.y=a+.05;const gam=Math.atan2(a2-a,20);
   const sf=TOT-p.s;let pit=gam+.05;if(p.s<250)pit=lerp(.16,pit,sstep(p.s/250));if(sf<120)pit=lerp(pit,.07,sstep(1-sf/120)*.9+.1);p.pitch+=(pit-p.pitch)*Math.min(1,dt*2.5);
   p.roll+=(clamp(Math.atan(v*v*o.k/G0),-.5,.5)-p.roll)*Math.min(1,dt*1.6);
   p.gearT=(sf<3400||p.s<8)?0:(p.y>35?1:p.gearT);p.eng=true;p.status=p.s<3500?'DEPARTED':(sf<3400?'APPROACH':'EN ROUTE');break}
  case'rollout':{p.t+=dt;p.spd=Math.sqrt(Math.max(V_TD*V_TD-2*DEC*p.s,100));p.s+=p.spd*dt;p.z=A.Z_TD-p.s;p.x=A.RWX;p.h=0;p.y=.05;p.roll*=Math.max(0,1-dt*3);p.pitch=lerp(p.pitch,0,Math.min(1,dt*1.2));p.gearT=0;
   if(p.s>=ROLLOUT){p.state='in1';p.path=R_IN1();p.s=0;p.gate=freeGate();if(p.gate)p.gate.res=p;p.status='TAXI'}break}
  case'in1':{p.pitch=0;if(!p.gate){p.gate=freeGate();if(p.gate)p.gate.res=p}
   const rest=p.path.len-p.s;const tgt=Math.min(p.s<40?18:11,Math.sqrt(2*1.1*Math.max(rest,0))+.4);accel(p,dt,tgt,1.6,2.6);p.s=Math.min(p.path.len,p.s+p.spd*dt);const o=p.path.at(p.s,p.o);p.x=o.x;p.z=o.z;p.h=o.h;p.roll=0;
   if(rest<=.4&&p.spd<.7){p.spd=0;if(p.gate&&!T.apron){T.apron=p;p.state='in2';p.path=R_IN2(p.gate.z);p.s=0}}break}
  case'in2':{const done=follow(p,dt,9);if(done){p.state='gate';p.t=0;p.nextPax=0;p.park(p.gate);if(T.apron===p)T.apron=null;p.status='LANDED';h.event&&h.event('gate',p)}break}
  }}
 function apronFree(p){return OUT_APRON_FREE(p.gz)}
 return T}
// pose of an airborne plane at path position (used by ambient traffic tests)
export const AIRPATH=AIR;
