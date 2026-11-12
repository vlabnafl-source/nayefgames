import {THREE,G,C,CURB,TAU,clamp,shade,PITCH} from './core.js';
import {Col,Inter,registerGen,groundH} from './world.js';
import {Frame,slab,sign,lampAt,tree,toast} from './lib.js';
import {People} from './peds.js';
import {Vehicle} from './vehicles.js';
import {DEFS} from './carmodels.js';
import {UI} from './ui.js';
import {P} from './player.js';
import {payAny} from './shops.js';

function hull(ctx,f,w,d,h,y0,color,ops,glassTop){const hw=w/2,y1=y0+h;f.wallU(0,-hw,hw,y0,y1,.4,color,ops);f.wallV(-hw,0,d,y0,y1,.4,color);f.wallV(hw,0,d,y0,y1,.4,color);f.wallU(d,-hw,hw,y0,y1,.4,color);
 const r=f.r(-hw-.2,-.2,hw+.2,d+.2);return r}
function hospital(ctx){const{i,j,cx,cz,sb}=ctx,own=ctx.owner,f=new Frame(ctx,'S',cx+5,cz+30),w=44,d=20,hw=22,y0=CURB,H1=5.2;
 f.floor(-hw,0,hw,d,y0+.02,0xe8eef0);f.floor(-hw,0,hw,3,y0+.03,0x35a0ff);
 f.wallU(0,-hw,hw,y0,y0+H1,.4,0xf2f4f6,[{a:-3,b:3,k:'door',yb:y0,yt:y0+3.2},{a:-hw+1.5,b:-6,k:'win',yb:y0+.5,yt:y0+H1-.8},{a:6,b:hw-1.5,k:'win',yb:y0+.5,yt:y0+H1-.8}]);
 f.wallV(-hw,0,d,y0,y0+H1,.4,0xf2f4f6,[{a:3,b:8,k:'win',yb:y0+.8,yt:y0+H1-.8}]);f.wallV(hw,0,d,y0,y0+H1,.4,0xf2f4f6,[{a:3,b:8,k:'win'}]);f.wallU(d,-hw,hw,y0,y0+H1,.4,0xf2f4f6);
 f.wallU(12,-hw,-4,y0,y0+H1,.25,0xdde6ea,[{a:-12,b:-9,k:'door',yb:y0,yt:y0+2.8}]);f.wallU(12,4,hw,y0,y0+H1,.25,0xdde6ea,[{a:12,b:15,k:'door',yb:y0,yt:y0+2.8}]);
 // roof + upper floors
 const r=f.r(-hw-.2,-.2,hw+.2,d+.2);sb.bb('solid',r[0],y0+H1,r[1],r[2],y0+H1+.5,r[3],0xbfc7cc,{ao:1,rc:0x9aa0a6});Col.addBox(own,r[0],r[1],r[2],r[3],y0+H1,y0+H1+.5,{cam:true});
 const u2=f.r(-18,2,18,d-2);sb.bb('win',u2[0],y0+H1+.5,u2[1],u2[2],y0+H1+13,u2[3],0xe8f0f4,{su:1/3.6,sv:1/3.8,top:'solid',rc:0xbfc7cc});Col.addBox(own,u2[0],u2[1],u2[2],u2[3],y0+H1+.5,y0+H1+13);
 f.sign('NEON GENERAL HOSPITAL',0,y0+H1+1.4,-.15,18,2,'#fff','#d0121b');
 const cr=f.p(0,10);sb.bb('emisN',cr[0]-1.5,y0+H1+14,cr[1]-.2,cr[0]+1.5,y0+H1+15.6,cr[1]+.2,0xff2a2a,{ao:1});sb.bb('emisN',cr[0]-.5,y0+H1+13.2,cr[1]-.2,cr[0]+.5,y0+H1+16.4,cr[1]+.2,0xff2a2a,{ao:1});
 const zr=f.r(-hw,0,hw,d);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],0,y0+H1);
 const y=y0+.02;
 // reception + waiting
 f.fb(0,6,10,1.1,y,1.1,0xe8e6e0);f.fb(0,6,10.2,1.2,y+1.1,.07,0x35a0ff,false);f.npc(-2,7.2,y,'work','nurse',0,-1);f.npc(2,7.2,y,'work','nurse',0,-1);
 for(let k=0;k<5;k++){f.fb(-18+k*2,3.5,1.6,.6,y,.5,0x2e6fb5);}for(let k=0;k<3;k++)f.npc(-18+k*2.2,3.5,y,'sit',null,0,1);
 f.inter(0,y,4.6,5,'F — Emergency room: full treatment ($200)',()=>{if(G.health>=100){toast('You are perfectly healthy, doctors say.');return}if(payAny(200)){G.health=100;G.hud();UI.splash('TREATED','#7df0ff',1500);toast('Doctors patched you up. Health restored.')}});
 // ER ward beds
 for(let k=0;k<4;k++){const u=14+(k%2)*5,v=14+Math.floor(k/2)*4.5;f.fb(-u,v,1,2.2,y,.5,0xf4f6f8);f.fb(-u,v+.9,1,.4,y+.5,.5,0xdde6ea,false);f.npc(-u,v,y+.5,'lie','patient',0,0);f.fb(-u+1.5,v,.05,2.5,y,2.1,0x9be0c8,false,'glass')}
 for(let k=0;k<3;k++){const u=-13+k*5;f.fb(u,16,1,2.2,y,.5,0xf4f6f8);if(k<2)f.npc(u,16,y+.5,'lie','patient',0,0)}
 f.pace(-14,14,14,14,y,'doctor');f.pace(10,17,-10,19,y,'nurse');f.npc(-6,15,y,'talk','doctor',1,0);f.npc(-5,15,y,'talk','nurse',-1,0);f.npc(8,14,y,'work','doctor',0,1);
 f.lamp(-10,y+4.6,6,0xeef6ff,300);f.lamp(10,y+4.6,6,0xeef6ff,300);f.lamp(-10,y+4.6,16,0xeef6ff,260);f.lamp(10,y+4.6,16,0xeef6ff,260);
 // ambulance bay canopy
 const cr2=f.r(-hw+2,-10,-hw+16,0);sb.bb('solid',cr2[0],y0+4.6,cr2[1],cr2[2],y0+5,cr2[3],0xe8eef0,{ao:1});for(const[a,b]of[[-hw+2.3,-9.7],[-hw+15.7,-9.7],[-hw+2.3,-.3],[-hw+15.7,-.3]]){const p=f.p(a,b);sb.cyl('metal',p[0],y0,p[1],.18,.18,4.6,0xaab2bb,6)}
 f.floor(-hw+2,-10,-hw+16,0,y+.001,0x5a5d62);
 const out=[0,1],hd=Math.PI;
 [[-hw+5,-5],[-hw+12,-5]].forEach(([u,v],n)=>{const p=f.p(u,v);const a=new Vehicle(DEFS.ambulance,0xf6f6f6,p[0],p[1],hd+(n?.15:-.1),y0);a.awake=false;a.label='Ambulance';if(n)a.siren=false;});
 // helipad roof
 const hp=f.p(14,10);sb.cyl('solid',hp[0],y0+H1+13.5,hp[1],7,7,.15,0x3b3f46,28);sb.cyl('emisN',hp[0],y0+H1+13.65,hp[1],6.4,6.4,.01,0xff4a4a,28);
 const dp=f.p(0,-5.5);People.addDoor(own,i,j,'S',dp[0],dp[1],f.p(0,4)[0],f.p(0,4)[1]);
 G.hospitalSpawn={x:f.p(0,9)[0],y:CURB+.02,z:f.p(0,9)[1],yaw:Math.PI};G.pois.push({x:cx+5,z:cz+40,name:'Hospital',col:'#ff4b5c',big:true});G.tp['Hospital']={x:cx+5,y:CURB,z:cz+36,yaw:Math.PI};
 for(const[dx,dz]of[[-30,-26],[30,-26],[26,-8]])tree(sb,cx+dx,cz+dz,.9,CURB);sb.flat('ground',cx-34,cz-4,cx+34,cz+26,CURB+.015,0xa9aeb2)}
function police(ctx){const{i,j,cx,cz,sb}=ctx,own=ctx.owner,f=new Frame(ctx,'S',cx,cz+30),w=36,d=18,hw=18,y0=CURB,H=5.4;
 f.floor(-hw,0,hw,d,y0+.02,0xc8ccd2);
 f.wallU(0,-hw,hw,y0,y0+H,.4,0x3b4a6b,[{a:-2.5,b:2.5,k:'door',yb:y0,yt:y0+3},{a:-hw+1.5,b:-5,k:'win',yb:y0+.6,yt:y0+H-1},{a:5,b:hw-1.5,k:'win',yb:y0+.6,yt:y0+H-1}]);
 f.wallV(-hw,0,d,y0,y0+H,.4,0x3b4a6b);f.wallV(hw,0,d,y0,y0+H,.4,0x3b4a6b);f.wallU(d,-hw,hw,y0,y0+H,.4,0x3b4a6b);
 const r=f.r(-hw-.2,-.2,hw+.2,d+.2);sb.bb('solid',r[0],y0+H,r[1],r[2],y0+H+.5,r[3],0x2a3550,{ao:1,rc:0x55575b});Col.addBox(own,r[0],r[1],r[2],r[3],y0+H,y0+H+.5,{cam:true});
 const u2=f.r(-14,3,14,d-3);sb.bb('win',u2[0],y0+H+.5,u2[1],u2[2],y0+H+10,u2[3],0x6a7a9c,{su:1/3.6,sv:1/3.8,top:'solid',rc:0x55575b});Col.addBox(own,u2[0],u2[1],u2[2],u2[3],y0+H+.5,y0+H+10);
 f.sign('NEON CITY POLICE',0,y0+H+1.2,-.15,14,1.8,'#0b1d38','#6aa8ff');
 const zr=f.r(-hw,0,hw,d);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],0,y0+H);
 const y=y0+.02;
 f.fb(0,6,8,1,y,1.1,0x2a3550);f.fb(0,6,8.1,1.1,y+1.1,.07,0xe8e6e0,false);f.npc(0,7.2,y,'work','cop',0,-1);f.npc(-6,4,y,'idle','cop',1,0);f.npc(6,10,y,'talk','cop',-1,0);f.npc(5,10,y,'talk',null,1,0);
 for(let k=0;k<3;k++){f.wallU(14,-14+k*9,-9+k*9,y0,y0+3.2,.1,0x555,[{a:-12.5+k*9,b:-10.5+k*9,k:'win',yb:y0,yt:y0+3}]);}
 f.fb(-12,16,5,2.5,y,.5,0x555a62);f.npc(-12,16,y+.5,'sit',null,0,1);
 for(const u of[-8,0,8]){f.fb(u,10,2,1,y,.8,0x6a6e74);chair(f,y,u,11)}
 f.lamp(-8,y+4.8,8,0xeef6ff,260);f.lamp(8,y+4.8,8,0xeef6ff,260);
 f.inter(0,y,4.6,5,'F — Pay bail / bribe ($3,000 per star) to clear your wanted level',()=>{if(!G.wanted){toast('You are not wanted.');return}const c=3000*G.wanted;if(payAny(c)){G.wanted=0;G.hud();toast('Charges dropped.')}});
 // parking lot with police cars
 sb.flat('ground',cx-34,cz+0,cx+34,cz+28,CURB+.015,0x55585c);
 G.policeParked=[];[[-24,-12],[-18,-12],[-12,-12]].forEach(([u,v],n)=>{const p=f.p(u,v);const c=new Vehicle(DEFS.police,0xf5f5f5,p[0],p[1],Math.PI,y0);c.awake=false;c.label='Police Cruiser';c.isCop=true;c.copHome=true})
 const dp=f.p(0,-5.5);People.addDoor(own,i,j,'S',dp[0],dp[1],f.p(0,4)[0],f.p(0,4)[1]);
 const hp=f.p(0,12);G.policePad={x:cx,y:y0+H+10.5,z:hp[1]};sb.cyl('solid',cx,y0+H+10.5,hp[1],6,6,.15,0x2a3550,24);sb.cyl('emisN',cx,y0+H+10.65,hp[1],5.4,5.4,.01,0x4a7aff,24);
 G.pois.push({x:cx,z:cz+36,name:'Police Station',col:'#4a7aff',big:true});G.tp['Police Station']={x:cx,y:CURB,z:cz+38,yaw:Math.PI};G.policeSpawn={x:cx,z:cz+40}}
function chair(f,y,u,v){f.fb(u,v,.5,.5,y+.42,.07,0x3a3f48,false);f.fb(u,v,.1,.1,y,.42,0x222,false)}
registerGen(ctx=>{if(!ctx.city)return;if(ctx.kind==='hospital')hospital(ctx);else if(ctx.kind==='police')police(ctx)});
// ---------- wanted system ----------
G.copCars=[];const Cp={cars:[],heli:null,spawnT:0,lastSeen:0,bust:0,decay:0};
G.crime=function(l,why){if(G.godmode)return;const old=G.wanted;G.wanted=Math.max(G.wanted,Math.min(5,l));if(G.wanted>old||why){toast(`WANTED ${'★'.repeat(G.wanted)} — ${why||'Crime reported'}`)}G.lastCrime=G.t;Cp.decay=0;G.hud()};
G.busted=function(){if(G.dead)return;UI.splash('BUSTED','#6aa8ff',3000);G.dead=true;setTimeout(()=>{if(G.active)P.exit();const fine=Math.min(Math.floor(G.cash*.1)+500,G.cash);G.cash-=fine;G.wanted=0;G.dead=false;G.health=Math.max(G.health,50);const s=G.policeSpawn||G.spawn;G.teleportTo({x:s.x,y:CURB,z:s.z,yaw:Math.PI});for(const c of Cp.cars){c.siren=false}G.hud();toast(`You were arrested and fined $${fine}.`)},2600)};
const tmp={};
function aiFor(){let wpA=null,wpB=null,prev=null,stuck=0,rev=0;return function(v,dt){
 const tgt=G.active?{x:G.active.x,z:G.active.z}:{x:P.g.position.x,z:P.g.position.z},dx=tgt.x-v.x,dz=tgt.z-v.z,dist=Math.hypot(dx,dz);let tx=tgt.x,tz=tgt.z;
 if(dist>45&&Math.abs(v.x)<420&&Math.abs(v.z)<420){
  if(wpA===null||Math.hypot((wpA+.5)*PITCH-v.x,(wpB+.5)*PITCH-v.z)>230){wpA=Math.round(v.x/PITCH-.5);wpB=Math.round(v.z/PITCH-.5);prev=null}
  if(Math.hypot((wpA+.5)*PITCH-v.x,(wpB+.5)*PITCH-v.z)<15){const ta=tgt.x/PITCH-.5,tb=tgt.z/PITCH-.5;let best=null,bs=1e9;
   for(const[da,db]of[[1,0],[-1,0],[0,1],[0,-1]]){const na=wpA+da,nb=wpB+db;if(na<-5||na>4||nb<-5||nb>4)continue;if(prev&&na===prev[0]&&nb===prev[1])continue;const sc=Math.abs(na-ta)+Math.abs(nb-tb)+Math.random()*.15;if(sc<bs){bs=sc;best=[na,nb]}}
   if(best){prev=[wpA,wpB];wpA=best[0];wpB=best[1]}}
  tx=(wpA+.5)*PITCH;tz=(wpB+.5)*PITCH}
 const ang=Math.atan2(-(tx-v.x),-(tz-v.z));let da=ang-v.heading;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
 const ctl={thr:1,brake:0,steer:clamp(-da*1.8,-1,1),hand:false,boost:false};
 if(Math.abs(da)>1.2&&v.speed>9){ctl.thr=0;ctl.brake=.6}
 if(dist<12&&Math.abs(v.speed)>5){ctl.thr=.2;ctl.brake=.4}
 if(Math.abs(v.speed)<1.5&&dist>10){stuck+=dt}else stuck=0;if(stuck>1.2){rev=1.1;stuck=0}
 if(rev>0){rev-=dt;ctl.thr=-1;ctl.steer=-ctl.steer;ctl.brake=0}
 return ctl}}
function makeCop(x,z,h){const c=new Vehicle(DEFS.police,0xf5f5f5,x,z,h,0);c.label='Police Cruiser';c.isCop=true;c.siren=true;c.awake=true;c.ai=aiFor();c.vx=0;c.vz=0;Cp.cars.push(c);return c}
G.updatePolice=function(dt,p){
 // wake parked cops on wanted
 if(G.wanted>0){Cp.decay+=dt;
  for(const v of G.vehicles)if(v.isCop&&v.copHome&&!v.ai&&Math.hypot(v.x-p.x,v.z-p.z)<260){v.ai=aiFor();v.siren=true;v.awake=true;v.copHome=false;Cp.cars.push(v)}
  const want=[0,1,2,3,4,6][G.wanted];Cp.spawnT-=dt;
  if(Cp.cars.length<want&&Cp.spawnT<=0&&Math.abs(p.x)<430&&Math.abs(p.z)<430){Cp.spawnT=3;for(let t=0;t<8;t++){const ang=Math.random()*TAU,d=110+Math.random()*60,x=p.x+Math.cos(ang)*d,z=p.z+Math.sin(ang)*d;if(Math.abs(x)>400||Math.abs(z)>400)continue;
    const horiz=Math.random()<.5;const a=Math.round(x/PITCH-.5),b=Math.round(z/PITCH-.5);const X=horiz?x:(a+.5)*PITCH+3,Z=horiz?(b+.5)*PITCH+3:z;makeCop(X,Z,horiz?Math.PI/2:0);break}}
  // heli
  if(G.wanted>=3&&!Cp.heli&&G.specials.policeheli){Cp.heli=G.specials.policeheli(p.x-120,p.z-120,0,'police heli');if(Cp.heli){Cp.heli.ai=null;Cp.heli.policeAI=true}}
  // bust check / lose cops
  let near=0,minD=1e9;for(const c of Cp.cars){const d=Math.hypot(c.x-p.x,c.z-p.z);minD=Math.min(minD,d);if(d<14)near++;
   if(d>360&&Cp.cars.length>1){c.destroy();Cp.cars.splice(Cp.cars.indexOf(c),1)}}
  const spd=G.active?Math.abs(G.active.speed||0):Math.hypot(P.vel?P.vel.x:0,P.vel?P.vel.z:0);
  if(near>0&&spd<3.2&&!G.dead){Cp.bust+=dt;if(Cp.bust>2.5){Cp.bust=0;G.busted()}}else Cp.bust=Math.max(0,Cp.bust-dt);
  // lose wanted when far from all cops
  if(minD>130||Cp.cars.length===0){Cp.lost=(Cp.lost||0)+dt;if(Cp.lost>18){Cp.lost=0;G.wanted=Math.max(0,G.wanted-1);toast(G.wanted?'You are losing them…':'Wanted level cleared — you lost the cops.');G.hud()}}else Cp.lost=0;
  if(G.t-(G.lastCrime||0)>70&&minD>60){G.wanted=Math.max(0,G.wanted-1);G.lastCrime=G.t;G.hud()}
 }else{
  for(let k=Cp.cars.length-1;k>=0;k--){const c=Cp.cars[k];c.siren=false;if(Math.hypot(c.x-p.x,c.z-p.z)>90){c.destroy();Cp.cars.splice(k,1)}else c.ai=c.ai&&null}
  if(Cp.heli){Cp.heli.destroy();Cp.heli=null}Cp.bust=0}
 G.blips=Cp.cars.map(c=>({x:c.x,z:c.z,col:Math.floor(G.t*3)%2?'#ff3030':'#3070ff'}));
 for(const c of Cp.cars)if(c.dead)Cp.cars.splice(Cp.cars.indexOf(c),1)};
window.__MODS=window.__MODS||[];window.__MODS.push({update:(dt,p)=>G.updatePolice(dt,p)});
