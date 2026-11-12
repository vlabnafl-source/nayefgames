import {THREE,scene,G,C,CURB,TAU,clamp,lerp,mulberry32} from './core.js';
import {Col,Inter,registerGen} from './world.js';
import {Frame,sign,lampAt,toast} from './lib.js';
import {Lamps} from './sky.js';
import {Vehicle} from './vehicles.js';
import {DEFS} from './carmodels.js';
import {UI} from './ui.js';
import {P} from './player.js';
import {payAny} from './shops.js';
const V3=THREE.Vector3;
const CP=[[-210,-700],[-95,-640],[70,-652],[175,-695],[232,-775],[190,-862],[80,-905],[-35,-872],[-112,-935],[-215,-902],[-255,-825],[-235,-752]];
const curve=new THREE.CatmullRomCurve3(CP.map(p=>new V3(p[0],0,p[1])),true,'catmullrom',.5);
const N=340,pts=curve.getSpacedPoints(N).slice(0,N),HW=9.5,K0=14;
const tan=pts.map((p,i)=>{const q=pts[(i+1)%N],d=new V3().subVectors(q,p).normalize();return d}),nrm=tan.map(t=>new V3(-t.z,0,t.x)); // left in top view (x right,z down)? left/right symmetrical use
let L=0;for(let i=0;i<N;i++)L+=pts[i].distanceTo(pts[(i+1)%N]);const SEG=L/N;
const cen=pts.reduce((a,p)=>a.add(p),new V3()).multiplyScalar(1/N);
function qd(sb,key,A,B,Cc,D,col,y){const ab=[B[0]-A[0],B[2]-A[2]],ac=[Cc[0]-A[0],Cc[2]-A[2]];const cr=ab[0]*ac[1]-ab[1]*ac[0];// y component of AB x AC (x,z): normal.y = ab.z*ac.x - ab.x*ac.z
 const ny=ab[1]*ac[0]-ab[0]*ac[1];if(ny>=0)sb.quad(key,A,B,Cc,D,0,1,0,col);else sb.quad(key,D,Cc,B,A,0,1,0,col)}
function at(i,o,y){const p=pts[((i%N)+N)%N],n=nrm[((i%N)+N)%N];return[p.x+n.x*o,y,p.z+n.z*o]}
function track(ctx){const sb=ctx.sb;for(let k=0;k<N;k++){const a=pts[k],b=pts[(k+1)%N],mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;if(!ctx.has(mx,mz))continue;const kk=(k+1);
  qd(sb,'ground',at(k,-HW,.04),at(kk,-HW,.04),at(kk,HW,.04),at(k,HW,.04),C(0x33363b));
  for(const sgn of[-1,1]){qd(sb,'ground',at(k,sgn*(HW-.5),.05),at(kk,sgn*(HW-.5),.05),at(kk,sgn*(HW-.15),.05),at(k,sgn*(HW-.15),.05),C(0xf2f2ee));
   qd(sb,'ground',at(k,sgn*HW,.045),at(kk,sgn*HW,.045),at(kk,sgn*(HW+1.1),.045),at(k,sgn*(HW+1.1),.045),C(k%2?0xd6342a:0xf2f2ee))}
  if(k%3===0)qd(sb,'ground',at(k,-.12,.05),at(k+2,-.12,.05),at(k+2,.12,.05),at(k,.12,.05),C(0xe6e6de));
  if(k%12===5){const p=at(k,HW+4,0);sb.cyl('metal',p[0],0,p[2],.12,.16,9,0x3a3f46,6);sb.box('emisN',p[0],9,p[2],.9,.14,.5,0xffe3b0);Lamps.add(ctx.owner,p[0],8.8,p[2],0xffd9a0,300)}
  // tire barriers on outside of sharp turns
  const t0=tan[k],t1=tan[(k+3)%N],turn=t0.x*t1.z-t0.z*t1.x;if(Math.abs(turn)>.12&&k%2===0){const sgn=turn>0?-1:1;const p=at(k,sgn*(HW+3.2),0);for(let h=0;h<2;h++)sb.cyl('solid',p[0],h*.55,p[2],.7,.7,.55,h?0xd6342a:0x1b1d22,8)}}
 // start gate + grandstand + pits
 const p0=pts[K0],t=tan[K0],n=nrm[K0];
 if(ctx.has(p0.x,p0.z)){for(const s of[-1,1]){const p=at(K0,s*(HW+1.5),0);sb.bb('solid',p[0]-.5,0,p[2]-.5,p[0]+.5,9,p[2]+.5,0x2a2d33,{ao:1});Col.addBox(ctx.owner,p[0]-.5,p[2]-.5,p[0]+.5,p[2]+.5,0,9)}
  const a=at(K0,-HW-1.5,9),b=at(K0,HW+1.5,9);sb.bb('solid',Math.min(a[0],b[0])-.5,8.2,Math.min(a[2],b[2])-.5,Math.max(a[0],b[0])+.5,9.2,Math.max(a[2],b[2])+.5,0x15161a,{ao:1});
  for(let k=-4;k<=4;k++){const q=at(K0,k*2.2,8.1);sb.box('emisN',q[0],q[1],q[2],1,.25,1,k%2?0xff2a2a:0xf2f2ee)}sign(ctx,'NEON CITY GRAND PRIX',p0.x,10.8,p0.z,18,1.8,Math.atan2(t.x,t.z)+Math.PI/2,'#0b0b0d','#ffd23f')}
 const so=[HW+14,HW+30];const gx=pts[K0+8],gp=at(K0+8,so[0],0),gt=tan[K0+8];
 if(ctx.has(gp[0],gp[2])){for(let r=0;r<6;r++){const o=so[0]+r*3.2;for(let s=-2;s<=2;s++){const q=at(K0+8+s*4,o,0),w=at(K0+8+s*4+4,o,0);const x0=Math.min(q[0],w[0]),x1=Math.max(q[0],w[0]),z0=Math.min(q[2],w[2]),z1=Math.max(q[2],w[2]);
    sb.bb('solid',x0-1.8,0,z0-1.8,x1+1.8,.8+r*.8,z1+1.8,[0xd6342a,0x2e6fb5,0xf2c300,0xf2f2ee,0x3a8a5a][(r+s+5)%5],{ao:1});Col.addBox(ctx.owner,x0-1.8,z0-1.8,x1+1.8,z1+1.8,0,.8+r*.8)}}
  sign(ctx,'MAIN GRANDSTAND',gp[0],8,gp[2],12,1.3,Math.atan2(-gt.z,gt.x)+Math.PI,'#0b0b0d','#ffd23f')}
 const pit=at(K0-6,-HW-16,0);if(ctx.has(pit[0],pit[2])){sb.bb('win',pit[0]-30,0,pit[2]-7,pit[0]+30,7,pit[2]+7,0xcfd3d8,{su:1/3.6,top:'solid',rc:0x55575b});Col.addBox(ctx.owner,pit[0]-30,pit[2]-7,pit[0]+30,pit[2]+7,0,7);sign(ctx,'PIT LANE · PADDOCK',pit[0],8,pit[2]+7.1,14,1.4,0,'#0b0b0d','#7df0ff')}}
registerGen(function raceGen(ctx){if(ctx.i<-4||ctx.i>4||ctx.j<-11||ctx.j>-6)return;track(ctx);
 // infield + entrance road
 if(ctx.i===0&&ctx.j===-6){const{road}=window.__regions||{};}
 const p0=pts[K0];if(ctx.has(p0.x,p0.z)){const sp=at(K0,0,0);Inter.add(ctx.owner,{x:p0.x-tan[K0].x*4,y:0,z:p0.z-tan[K0].z*4,r:16,needVeh:true,text:()=>R.state==='idle'?'F — START SUPERCAR RACE · 3 laps · entry $5,000 · prize $50,000':null,act:startRace});
  }});
G.pois.push({x:pts[K0].x,z:pts[K0].z,name:'Race Track',col:'#ffd23f',big:true});G.tp['Race Track']={x:pts[K0].x-tan[K0].x*12,y:.1,z:pts[K0].z-tan[K0].z*12,yaw:Math.atan2(-tan[K0].x,-tan[K0].z)+Math.PI};
// ---------- race logic ----------
const R={state:'idle',t:0,cars:[],gates:[],lap:1,laps:3,cp:0,lapT:0,best:null,ri:0,total:0,count:3.5};G.race=R;
const gateG=new THREE.Group();scene.add(gateG);
const gidx=j=>(K0+Math.round((j+1)*N/8))%N;
function mkGates(){for(let j=0;j<8;j++){const i=gidx(j),p=pts[i],t=tan[i],g=new THREE.Mesh(new THREE.TorusGeometry(HW+1.5,.35,8,28,Math.PI),new THREE.MeshBasicMaterial({color:0x35e0ff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  g.position.set(p.x,0,p.z);g.rotation.y=Math.atan2(t.x,t.z)+Math.PI/2*0;g.rotation.y=Math.atan2(t.x,t.z);g.rotation.y+=0;g.userData.j=j;gateG.add(g)}}
function clearRace(){for(const c of R.cars){c.ai=null;c.destroy()}R.cars=[];while(gateG.children.length)gateG.remove(gateG.children[0]);G.freeze=false;R.state='idle';UI.raceHud(null);G.blips=G.blips||[]}
function nearIdx(x,z,from,win=14){let best=from,bd=1e12;for(let d=-4;d<=win;d++){const i=((from+d)%N+N)%N,dx=pts[i].x-x,dz=pts[i].z-z,q=dx*dx+dz*dz;if(q<bd){bd=q;best=i}}return[best,Math.sqrt(bd)]}
function aiFor(skill){return function(v,dt){if(G.freeze||R.state!=='racing'&&R.state!=='countdown')return{thr:0,brake:1,steer:0,hand:true};
  const[i]=nearIdx(v.x,v.z,v.ri,16);if(i<v.ri&&v.ri>N-30&&i<30)v.lapsDone++;v.ri=i;
  const sp=Math.abs(v.speed),look=Math.round((9+sp*.5)/SEG),tg=pts[(i+look)%N],ang=Math.atan2(-(tg.x-v.x),-(tg.z-v.z));let da=ang-v.heading;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
  const tA=tan[i],tB=tan[(i+Math.round(sp*1.3/SEG)+6)%N],turn=Math.abs(tA.x*tB.z-tA.z*tB.x);let rb=1;if(R.pProg-(v.lapsDone*N+i)>N*.18)rb=1.1;else if((v.lapsDone*N+i)-R.pProg>N*.12)rb=.88;
  const tgtSp=clamp(v.def.top*skill*rb*(1-turn*2.4),19,v.def.top*skill*rb);
  const ctl={thr:sp<tgtSp?1:0,brake:sp>tgtSp+3?clamp((sp-tgtSp)/15,.2,1):0,steer:clamp(-da*2.2,-1,1),hand:false,boost:false};return ctl}}
function startRace(){const v=G.active;if(!v||v.kind!=='car'){toast('Drive a car to the start line first.');return}if(!payAny(5000))return;clearRace();
 const names=['lamborghini','ferrari','bugatti','mclaren','porsche'],cols=[0xf2c200,0xd40000,0x143a8f,0xff6a00,0x9aa2ab],t=tan[K0],n=nrm[K0],head=Math.atan2(-t.x,-t.z);
 const slot=(r)=>{const row=Math.floor(r/2),side=r%2?1:-1;const bx=pts[K0].x-t.x*(9+row*9)+n.x*side*3.2,bz=pts[K0].z-t.z*(9+row*9)+n.z*side*3.2;return[bx,bz]};
 names.forEach((nm,k)=>{const[x,z]=slot(k+1),c=new Vehicle(DEFS[nm],cols[k],x,z,head,0);c.awake=true;c.ri=((K0-8-Math.floor((k+1)/2)*8)%N+N)%N;c.lapsDone=0;c.ai=aiFor(.8+Math.random()*.12);c.label='Racer '+(k+1);R.cars.push(c)});
 const[px,pz]=slot(0);v.group.position.set(px,0,pz);v.heading=head;v.group.rotation.y=head;v.vx=v.vz=0;v.speed=0;v.health=Math.max(v.health,60);v.fuel=Math.max(v.fuel,60);
 if(v.flight&&v.flight.on){v.flight.on=false;v.flight.p=0}
 R.v=v;R.lap=1;R.cp=0;R.lapT=0;R.t=0;R.total=0;R.best=null;R.ri=((K0-8)%N+N)%N;R.pProg=-8;R.lapsDone=0;R.count=3.99;R.state='countdown';G.freeze=true;mkGates();UI.splash('GET READY','#ffd23f',900);P.yaw=head}
G.updateRace=function(dt){if(R.state==='idle'){gateG.visible=false;return}gateG.visible=true;const v=R.v;
 if(!G.active||G.active!==v||v.dead){toast('Race cancelled.');clearRace();return}
 const[i,off]=nearIdx(v.x,v.z,R.ri,18);if(off>140){toast('You left the circuit — race cancelled.');clearRace();return}
 for(const g of gateG.children){const act=g.userData.j===R.cp;g.material.color.setHex(act?0xffd23f:0x35e0ff);g.material.opacity=act?.95:.28;g.scale.setScalar(act?1+Math.sin(G.t*6)*.03:1)}
 if(R.state==='countdown'){R.count-=dt;const c=Math.ceil(R.count);UI.raceHud(c>0?`${c}`:'GO!');if(R.count<=0){R.state='racing';G.freeze=false;UI.splash('GO!','#35ff9a',700)}else if(c!==R.lastC){R.lastC=c;UI.splash(String(c),'#ffd23f',650)}
  R.pProg=-8;return}
 R.t+=dt;R.lapT+=dt;
 // progress
 if(i<R.ri&&R.ri>N-40&&i<40)R.lapsDone++;R.ri=i;R.pProg=R.lapsDone*N+i;
 // checkpoints
 const gi=gidx(R.cp);const dd=((i-gi)%N+N)%N;if(dd<5||dd>N-5){const dist=Math.hypot(pts[gi].x-v.x,pts[gi].z-v.z);if(dist<HW+6){R.cp++;if(R.cp>=8){R.cp=0;const lt=R.lapT;if(R.best===null||lt<R.best)R.best=lt;if(G.bestLap==null||lt<G.bestLap)G.bestLap=lt;R.lapT=0;R.lap++;toast(`Lap ${R.lap-1} complete: ${fmt(lt)}`);
    if(R.lap>3){finish();return}}}}
 // standing
 let pos=1;for(const c of R.cars)if(c.lapsDone*N+c.ri>R.pProg+2)pos++;
 UI.raceHud(`LAP ${Math.min(R.lap,3)}/3   ·   CHECKPOINT ${R.cp+1}/8   ·   P${pos}/6\n⏱ ${fmt(R.lapT)}   TOTAL ${fmt(R.t)}   BEST ${R.best==null?'--':fmt(R.best)}`);R.pos=pos;
 G.blips=R.cars.map(c=>({x:c.x,z:c.z,col:'#ffd23f'})).concat([{x:pts[gidx(R.cp)].x,z:pts[gidx(R.cp)].z,col:'#35e0ff'}])}
function fmt(t){const m=Math.floor(t/60),s=t-m*60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`}
function finish(){let pos=1;for(const c of R.cars)if(c.lapsDone*N+c.ri>R.pProg)pos++;const prize=[50000,25000,10000][pos-1]||2000;G.cash+=prize;G.hud();UI.splash(pos===1?'1ST PLACE!':`FINISHED P${pos}`,pos===1?'#ffd23f':'#7df0ff',3200);toast(`Race over — position ${pos}/6. Prize: $${prize.toLocaleString()}. Total ${fmt(R.t)}`);
 R.state='done';UI.raceHud(null);G.freeze=false;setTimeout(()=>{if(R.state==='done')clearRace()},6000)}
window.__MODS=window.__MODS||[];window.__MODS.push({update:(dt)=>G.updateRace(dt)});
export {pts as racePts,N as raceN};
