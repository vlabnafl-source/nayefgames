import {THREE,G,C,M,CURB,TAU,clamp,shade} from './core.js';
import {Col,Inter,registerGen,kinds} from './world.js';
import {Frame,slab,sign,lampAt,tree,PAL,pay,toast} from './lib.js';
import {holeTable} from './city.js';
import {makeElevator} from './elevator.js';
import {UI} from './ui.js';

const FX=12,FZ=-4,H=4.4,EXT=0xf3f0e9,INT=0xebe6dc,DK=0x2b2f36;
const yf=k=>CURB+k*H;
const POOL={u0:8.5,v0:5,u1:19.5,v1:25};
// pool hole in plot ground
{const f={fx:FX,fz:FZ};const x0=FX+POOL.u0,x1=FX+POOL.u1,z0=FZ-POOL.v1,z1=FZ-POOL.v0;holeTable['0,0']=[{x0,x1,z0,z1}]}
G.spawn={x:FX,y:CURB+.02,z:-10,yaw:Math.PI};
G.garageCars=[];G.onReady=G.onReady||[];
G.pois.push({x:12,z:-19,name:'Your Mansion',col:'#ff5ad8',big:true},{x:-22,z:-19,name:'Your Garage',col:'#ff5ad8'});
function sofa(f,y,u,v,w,bd,col=0x59606c){const h=bd==='+v'||bd==='-v',sw=h?w:.95,sd=h?.95:w;f.fb(u,v,sw,sd,y,.45,col);const off=.42;let bu=u,bv=v;if(bd==='+v')bv+=off;else if(bd==='-v')bv-=off;else if(bd==='+u')bu+=off;else bu-=off;f.fb(bu,bv,h?w:.2,h?.2:w,y+.45,.5,col);f.fb(u,v,h?w+.3:.95,h?.95:w+.3,y,.25,shade(col,.7),false)}
function bed(f,y,u,v,head='-v',col=0xf0efe9){const h=head==='+v'||head==='-v';const w=h?2:2.2,d=h?2.2:2;f.fb(u,v,w,d,y,.4,0x5a3d28);f.fb(u,v,w-.1,d-.1,y+.4,.25,col);let hu=u,hv=v;const o=1.05;if(head==='+v')hv+=o;else if(head==='-v')hv-=o;else if(head==='+u')hu+=o;else hu-=o;f.fb(hu,hv,h?w:.12,h?.12:d,y,1.2,0x4a3020);f.fb(hu+(h?-.45:0),hv+(h?0:-.45),.55,.4,y+.65,.15,0xffffff,false);f.fb(hu+(h?.45:0),hv+(h?0:.45),.55,.4,y+.65,.15,0xffffff,false)}
function tv(f,y,u,v,w,face='+v'){const h=face==='+v'||face==='-v';f.fb(u,v,h?w:.12,h?.12:w,y+1.0,w*.56,0x08101e,false,'emis');f.fb(u,v+(h?(face==='+v'?-.1:.1):0),h?w*.5:.3,h?.3:w*.5,y,1.0,0x2a2d33)}
function table(f,y,u,v,w,d,h=.75,col=0x6b4a2e){f.fb(u,v,w,d,y+h-.07,.07,col);for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])f.fb(u+a*(w/2-.1),v+b*(d/2-.1),.08,.08,y,h-.07,0x3a2a1c,false)}
function chair(f,y,u,v,col=0x3a3f48){f.fb(u,v,.5,.5,y+.42,.07,col,false);f.fb(u,v,.1,.1,y,.42,0x222,false);f.fb(u,v,.5,.07,y+.5,.5,col,false)}
function shelf(f,y,u,v,w,d,col=0x5a3d28){f.fb(u,v,w,d,y,2.2,col);}
function build(ctx){const sb=ctx.sb,own=ctx.owner,f=new Frame(ctx,'S',FX,FZ);
 const stairHole=f.r(-5.5,10,-1.5,20),elHole=f.r(2.5,24.5,5.5,27.5);
 const holes=[{x0:stairHole[0],z0:stairHole[1],x1:stairHole[2],z1:stairHole[3]},{x0:elHole[0],z0:elHole[1],x1:elHole[2],z1:elHole[3]}];
 // ----- slabs (1..5) -----
 for(let k=1;k<=5;k++){const r=f.r(-22.5,-2.6,22.5,30.5);slab(ctx,r[0],r[1],r[2],r[3],yf(k),.4,k===5?0xd9d4c8:DK,holes)}
 // ----- walls per floor -----
 for(let k=0;k<5;k++){const y0=k?yf(k):CURB,y1=yf(k+1)-.4,wy={yb:y0+.25,yt:y1-.4};
  const W=(a,b)=>({a,b,k:'win',...wy});
  const front=[W(-20.5,-15.5),W(-13,-8),W(8,13),W(15.5,20.5),{a:-2.4,b:2.4,k:'door',yb:y0,yt:y0+3}];
  f.wallU(0,-22.2,22.2,y0,y1,.4,EXT,front);
  const left=k===0?[{a:6,b:9.2,k:'door',yb:y0,yt:y0+2.8}]:k===1?[]:[W(3,8),W(12,18),W(21,27)];
  f.wallV(-22,0,30,y0,y1,.4,EXT,left);
  f.wallV(22,0,30,y0,y1,.4,EXT,[W(2,9),W(12,18),W(21,28)]);
  f.wallU(30,-22.2,22.2,y0,y1,.4,EXT,[W(-20,-14),W(-11,-7.5),W(7.5,11),W(14,20),W(-4.5,1.5)]);
  const dr=(a,b)=>({a,b,k:'door',yb:y0,yt:y0+2.8});
  f.wallV(-6,0,30,y0,y1,.3,INT,[dr(6,9.2),dr(21,24)]);f.wallV(6,0,30,y0,y1,.3,INT,[dr(6,9.2),dr(21,24)]);
  f.wallU(15,-22,-6,y0,y1,.3,INT,[dr(-16,-13)]);if(k>0)f.wallU(15,6,22,y0,y1,.3,INT,[dr(13,16)]);
  // balcony rail
  if(k>0){const r=f.r(-22.5,-2.6,22.5,-2.5);sb.bb('glass',r[0],yf(k),r[1],r[2],yf(k)+1.1,r[3],0xaad4ea,{ao:1,noBottom:true});Col.addBox(own,r[0],r[1],r[2],r[3],yf(k),yf(k)+1.1);sb.bb('metal',r[0],yf(k)+1.08,r[1],r[2],yf(k)+1.14,r[3],0xcfd3d8,{ao:1})}
 }
 // ----- stairs -----
 const flight=(k)=>{const up=(k%2===0),vA=up?10:20,vB=up?20:10,yA=yf(k),yB=yf(k+1),u0=-5.5,u1=-1.5;const r=f.r(u0,10,u1,20);const zA=FZ-vA,zB=FZ-vB;const n=22;
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,va=vA+(vB-vA)*t0,vb=vA+(vB-vA)*t1,yy=yA+(yB-yA)*t1,rr=f.r(u0,Math.min(va,vb),u1,Math.max(va,vb));sb.bb('solid',rr[0],Math.min(yA,yB)-.3,rr[1],rr[2],yy,rr[3],0xd8d2c6,{ao:1})}
  const lo=Math.min(zA,zB),ya=(zA<zB?yA:yB),yb=(zA<zB?yB:yA);Col.addSurf(own,r[0],lo,r[2],Math.max(zA,zB),ya,yb,'z');
  for(const u of[u0,u1]){const rr=f.r(u-.05,10,u+.05,20);sb.bb('glass',rr[0],Math.min(yA,yB)+.9,rr[1],rr[2],Math.max(yA,yB)+1.1,rr[3],0xaad4ea,{ao:1,noBottom:true});Col.addBox(own,rr[0],rr[1],rr[2],rr[3],Math.min(yA,yB),Math.max(yA,yB)+1.0)}};
 for(let k=0;k<5;k++)flight(k);
 {const rr=f.r(-5.5,9.9,-1.5,10.1);Col.addBox(own,rr[0],rr[1],rr[2],rr[3],yf(1),yf(1)+1);} // rail at stair hole edge on upper floors (visual skip)
 // ----- elevator -----
 const names=['Ground — Foyer & Pool','Floor 1 — Bedrooms','Floor 2 — Cinema','Floor 3 — Gym & Office','Floor 4 — Sky Lounge','Roof — Terrace & Helipad'];
 makeElevator(ctx,{x0:elHole[0],z0:elHole[1],x1:elHole[2],z1:elHole[3],front:'S',stops:names.map((n,i)=>({y:yf(i),name:n})),speed:6,name:'Mansion Elevator',wall:0x9aa1a9});
 // ----- ground floor: foyer, living, kitchen, pool hall -----
 const y=CURB+.02;
 f.floor(-6,0,6,30,y+.0,PAL.marble);f.floor(-22,0,-6,15,y,0x9a7048);f.floor(-22,15,-6,30,y,0xc9c0b0);f.floor(6,0,22,30,y,0xd9e6ea);
 f.floor(-1,2,1,8,y+.01,0x8a1f2a);// red carpet
 // chandelier
 f.lamp(0,yf(1)-1.2,5,0xffe2b0,260);f.lamp(0,yf(1)-1.2,18,0xffe2b0,200);f.lamp(-14,yf(1)-.8,7,0xffe2b0,240);f.lamp(-14,yf(1)-.8,23,0xffe2b0,240);f.lamp(14,yf(1)-.8,15,0x9fe0ff,260);
 f.fb(0,5,1.4,1.4,yf(1)-1.8,.1,0xffd98a,false,'emisN');
 f.plant(-4.5,3);f.plant(4.5,3);f.plant(-4.5,27);f.fb(0,28,5,.6,y,1.0,0x7a5a3a);// console table
 f.sign('NEON MANOR',0,yf(0)+3.3,.25,5,1.0,'#14110d','#e8c36a');
 // living room
 sofa(f,y,-14,6,4.2,'-v',0x59606c);sofa(f,y,-18.5,10,3,'-u',0x59606c);sofa(f,y,-9.5,10,3,'+u',0x59606c);table(f,y,-14,9.5,2,1,.4,0x2a2d33);tv(f,y,-14,1,2.6,'+v');f.fb(-14,9.5,4.5,3.5,y,.02,0xc9b79c,false);f.plant(-20.5,13.5);
 f.inter(-14,y,7,3,'F — Relax on the sofa (+5 health)',()=>{G.health=Math.min(100,G.health+5);G.hud();toast('Nice and relaxing.')});
 // dining/kitchen
 table(f,y,-14,25,4.8,1.6,.78,0x4b3322);for(let i=-2;i<=2;i++){chair(f,y,-14+i*1.1,23.6);chair(f,y,-14+i*1.1,26.4)}
 f.fb(-20,19,.9,6,y,1.0,0xe5e5e0);f.fb(-20,27,.9,4,y,1.0,0xe5e5e0);f.fb(-21,22,.5,1.6,y,2.0,0x9aa0a8);f.fb(-12,17,6,.8,y,1.0,0x2a2d33);
 f.inter(-12,y,18.2,3,'F — Eat a gourmet meal (+25 health)',()=>{G.health=Math.min(100,G.health+25);G.hud();toast('Delicious.')});
 f.npc(-17,28,y,'work','chef',0,-1);
 // pool hall
 const pr=f.r(POOL.u0,POOL.v0,POOL.u1,POOL.v1);Col.addHole(own,pr[0],pr[1],pr[2],pr[3]);
 sb.bb('solid',pr[0],-2.2,pr[1],pr[2],-1.5,pr[3],0x7fd0e8,{ao:1,noBottom:true,top:'solid',rc:0x7fd0e8});Col.addSurf(own,pr[0],pr[1],pr[2],pr[3],-1.5);
 for(const[a,b,c,d]of[[pr[0]-.4,pr[1]-.4,pr[2]+.4,pr[1]],[pr[0]-.4,pr[3],pr[2]+.4,pr[3]+.4],[pr[0]-.4,pr[1],pr[0],pr[3]],[pr[2],pr[1],pr[2]+.4,pr[3]]])sb.bb('solid',a,-1.5,b,c,CURB+.04,d,0xe8e6e0,{ao:1});
 sb.bb('glass',pr[0],-.35,pr[1],pr[2],-.3,pr[3],0x2fa8d8,{ao:1,noBottom:true,top:'glass'});Col.addWater(own,pr[0],pr[1],pr[2],pr[3],-.32);
 for(let i=0;i<4;i++){f.fb(7.5,3+i*7,.9,2,y,.5,0xf0efe9);f.fb(20.5,3+i*7,.9,2,y,.5,0xf0efe9)}f.plant(7,28.5);f.plant(21,28.5);f.plant(7,1.5);f.plant(21,1.5);
 f.lamp(14,yf(1)-.6,10,0x7fe0ff,300);f.lamp(14,yf(1)-.6,20,0x7fe0ff,300);
 f.npc(7.4,12,y,'idle','beach',1,0);f.inter(14,y,2.2,3.2,'F — Splash! (the pool is open — walk in to swim)',()=>toast('Walk into the pool to swim.'));
 // ----- floor 1: bedrooms/lounge/gaming -----
 let Y=yf(1)+.02;f.floor(-22,0,-6,15,Y,0x9a7048);f.floor(-22,15,-6,30,Y,0xb8a88c);f.floor(6,0,22,15,Y,0x4a4f5a);f.floor(6,15,22,30,Y,0x241a33);f.floor(-6,0,6,30,Y,PAL.marble);
 bed(f,Y,-16,5,'-v');f.fb(-9.5,1.5,.8,3,Y,2.1,0x6b4a2e);f.fb(-20.5,6,.5,.5,Y,.4,0x222);tv(f,Y,-14,14.2,2.4,'-v');sofa(f,Y,-9,11,2.6,'+u',0x7a5a8a);f.lamp(-14,yf(2)-.7,7,0xffe2b0,200);
 f.inter(-16,Y,7.5,3,'F — Sleep until morning',()=>{G.sleep&&G.sleep()});
 bed(f,Y,-16,23,'+v');f.fb(-9,18,1,2.6,Y,2.1,0x6b4a2e);f.lamp(-14,yf(2)-.7,22,0xffe2b0,200);
 sofa(f,Y,14,4,5,'-v',0x2e3440);sofa(f,Y,10,9,3.5,'-u',0x2e3440);table(f,Y,14,8.5,2.4,1.2,.4,0x1a1c20);tv(f,Y,14,14,3.4,'-v');f.lamp(14,yf(2)-.7,7,0xff9ae6,200);
 // gaming room
 for(let i=0;i<3;i++){f.fb(8.5+i*1.4,29,1.1,1,Y,1.7,0x151820);f.fb(8.5+i*1.4,28.45,.9,.05,Y+.95,.6,0x35e0ff,false,'emis')}
 for(let i=0;i<3;i++){table(f,Y,13+i*2.6,22,2,.9,.75,0x1a1c20);f.fb(13+i*2.6,22,.8,.05,Y+1.0,.5,0xff3df0,false,'emis');chair(f,Y,13+i*2.6,20.8,0xff3d6a)}
 f.fb(20,18,.9,.9,Y,.4,0x7a1fff);sofa(f,Y,19.5,26,2.8,'+v',0x7a1fff);tv(f,Y,15,16.5,3,'+v');f.lamp(14,yf(2)-.7,24,0xff3df0,300);
 f.inter(15,Y,21.5,3.4,'F — Play arcade (win a little cash)',()=>{const w=Math.random()<.5?Math.round(Math.random()*400):0;G.cash+=w;G.hud();toast(w?`You won $${w}!`:'Game over — try again!')});
 // ----- floor 2: bedrooms + cinema -----
 Y=yf(2)+.02;f.floor(-22,0,-6,15,Y,0x9a7048);f.floor(-22,15,-6,30,Y,0xb8a88c);f.floor(6,0,22,15,Y,0x3a2530);f.floor(6,15,22,30,Y,0x6a5a48);f.floor(-6,0,6,30,Y,PAL.marble);
 bed(f,Y,-16,5,'-v',0xc9d6e8);bed(f,Y,-16,23,'+v',0xe8d0d0);tv(f,Y,-14,14.2,2.4,'-v');f.lamp(-14,yf(3)-.7,7,0xffe2b0,200);f.lamp(-14,yf(3)-.7,22,0xffe2b0,200);
 // cinema
 f.fb(14,1,9,.15,Y+.5,3.6,0xdfe8ff,false,'emis');f.fb(14,.8,9.6,.3,Y,4.4,0x15161a,false);
 for(let r=0;r<3;r++)for(let s=0;s<4;s++){f.fb(9.5+s*2.1,5.5+r*3,1.6,1.1,Y+r*.25,.5,0x7a1f2f);f.fb(9.5+s*2.1,5.9+r*3,1.6,.2,Y+r*.25+.5,.6,0x7a1f2f)}
 f.lamp(14,yf(3)-.7,8,0x8a9cff,160);f.inter(14,Y,11,4,'F — Watch a movie (+10 health)',()=>{G.health=Math.min(100,G.health+10);G.hud();toast('The movie was great.')});
 // library lounge
 for(const u of[7,21])f.fb(u,22,.5,12,Y,2.2,0x5a3d28);sofa(f,Y,14,23,3.2,'+v',0x6a3d2a);table(f,Y,14,19,1.4,1.4,.45,0x3a2a1c);f.lamp(14,yf(3)-.7,22,0xffd090,220);
 // ----- floor 3: gym + spa + office -----
 Y=yf(3)+.02;f.floor(-22,0,-6,15,Y,0x2a2d33);f.floor(-22,15,-6,30,Y,0xd9e6ea);f.floor(6,0,22,15,Y,0x9a7048);f.floor(6,15,22,30,Y,0x9a7048);f.floor(-6,0,6,30,Y,PAL.marble);
 for(let i=0;i<3;i++){f.fb(-19+i*3.2,3,1,2.2,Y,1.3,0x1b1d22);f.fb(-19+i*3.2,2,.9,.1,Y+1.2,.6,0x35ff9a,false,'emis')}
 f.fb(-10,10,2,.9,Y,.5,0x3a3f48);f.fb(-10,10,.2,3,Y+.5,1.2,0x9aa0a8);for(let i=0;i<4;i++)f.fb(-20.5,7+i*1.6,.4,.4,Y,.4,0x15161a,false);f.fb(-13,1,12,.1,Y+.5,2.2,0xaad4ea,false,'glass');
 f.lamp(-14,yf(4)-.7,7,0xffffff,240);f.inter(-14,Y,8,4,'F — Work out (+8 health)',()=>{G.health=Math.min(100,G.health+8);G.hud();toast('Great workout!')});
 f.fb(-14,23,5,4,Y,.4,0xe8e6e0);f.sign('SPA & SAUNA',-14,Y+3.2,29.7,3,.6,'#0b2a33','#7df0ff');f.lamp(-14,yf(4)-.7,23,0x9fe0ff,200);
 // office
 table(f,Y,14,6,3.2,1.4,.75,0x2a2d33);f.fb(14,6.5,1,.05,Y+1.0,.55,0x35a0ff,false,'emis');chair(f,Y,14,4.8,0x15161a);shelf(f,Y,21.3,6,.5,8);shelf(f,Y,21.3,22,.5,8);f.fb(14,11,3,2.2,Y,.5,0x7a5a3a);f.lamp(14,yf(4)-.7,6,0xffe8c0,220);f.lamp(14,yf(4)-.7,22,0xffe8c0,200);
 bed(f,Y,14,25,'+v',0xe8e0c8);
 f.inter(14,Y,5.4,3,'F — Online banking',()=>{G.openATM&&G.openATM()});
 // ----- floor 4: sky lounge -----
 Y=yf(4)+.02;f.floor(-22,0,22,30,Y,0xcfc6b4);f.floor(-6,0,6,30,Y,PAL.marble);
 f.fb(-14,10,9,1.2,Y,1.1,0x1b1d22);for(let i=0;i<5;i++)f.fb(-17+i*1.6,11.4,.5,.5,Y,.8,0xc9a34a,false);f.fb(-14,9.5,9,.6,Y+1.1,1.2,0x2a2d33,false);
 sofa(f,Y,-14,22,6,'+v',0x8a6a3a);table(f,Y,-14,19,2.6,1.2,.4,0xd5a94f);sofa(f,Y,-19,18,3.2,'-u',0x8a6a3a);
 for(let i=0;i<3;i++){table(f,Y,10+i*4,10,1.6,1.6,.75,0xe8e6e0);chair(f,Y,10+i*4,8.7,0x2a2d33);chair(f,Y,10+i*4,11.3,0x2a2d33)}
 f.fb(14,25,10,1.4,Y,1.0,0x1b1d22);f.lamp(-14,yf(5)-.7,10,0xffc977,260);f.lamp(-14,yf(5)-.7,22,0xffc977,240);f.lamp(14,yf(5)-.7,10,0xffc977,260);f.lamp(14,yf(5)-.7,22,0xffc977,240);
 f.npc(-14,11.4,Y,'work','suit',0,-1);f.npc(-16,12.2,Y,'idle','suit',0,-1);
 f.inter(-14,Y,13.2,3,'F — Order a champagne (+10 health, $40)',()=>{if(pay(40)){G.health=Math.min(100,G.health+10);G.hud();toast('Cheers!')}});
 // ----- roof terrace -----
 Y=yf(5);const rr=f.r(-22,0,22,30);
 for(const[a,b,c,d]of[[-22.5,-2.6,22.5,-2.5],[-22.5,30.4,22.5,30.5],[-22.5,-2.6,-22.4,30.5],[22.4,-2.6,22.5,30.5]]){const q=f.r(a,b,c,d);sb.bb('glass',q[0],Y,q[1],q[2],Y+1.1,q[3],0xaad4ea,{ao:1,noBottom:true});Col.addBox(own,q[0],q[1],q[2],q[3],Y,Y+1.1);sb.bb('metal',q[0],Y+1.08,q[1],q[2],Y+1.14,q[3],0xcfd3d8,{ao:1})}
 // stairs rail
 for(const q of[f.r(-5.7,9.8,-1.3,10),f.r(-5.7,9.8,-5.5,20),f.r(-1.5,9.8,-1.3,20)])Col.addBox(own,q[0],q[1],q[2],q[3],Y,Y+1.1);
 f.floor(-22,-2.6,22,30,Y+.02,0xb5a88f);
 const hp=f.p(14,20);sb.cyl('solid',hp[0],Y,hp[1],6.4,6.4,.12,0x3b3f46,28);sb.cyl('emisN',hp[0],Y+.12,hp[1],6.0,6.0,.01,0xffc21a,28,{noTop:false});sb.cyl('solid',hp[0],Y+.125,hp[1],5.6,5.6,.01,0x3b3f46,28);
 sb.bb('solid',hp[0]-1.8,Y+.14,hp[1]-2.4,hp[0]-1.2,Y+.15,hp[1]+2.4,0xffffff,{ao:1});sb.bb('solid',hp[0]+1.2,Y+.14,hp[1]-2.4,hp[0]+1.8,Y+.15,hp[1]+2.4,0xffffff,{ao:1});sb.bb('solid',hp[0]-1.8,Y+.14,hp[1]-.3,hp[0]+1.8,Y+.15,hp[1]+.3,0xffffff,{ao:1});
 G.helipad={x:hp[0],y:Y+.12,z:hp[1]};G.pois.push({x:hp[0],z:hp[1],name:'Mansion Helipad',col:'#9be7ff'});
 // jacuzzi + loungers
 const jp=f.p(-14,22);sb.cyl('solid',jp[0],Y,jp[1],2.4,2.4,.7,0xe8e6e0,18);sb.cyl('glass',jp[0],Y+.68,jp[1],2.1,2.1,.02,0x35c0e8,18);Col.box(own,jp[0],Y+.35,jp[1],4.8,.7,4.8);
 for(let i=0;i<3;i++){f.fb(-19+i*2.6,6,1,2.2,Y,.45,0xf0efe9);f.fb(-6,6,.1,.1,Y,.1,0xfff,false)}
 f.fb(-14,12,6,1,Y,1.0,0x2a2d33);f.fb(-14,12,6,.05,Y+1.0,.2,0xffb04a,false,'emisN');f.lamp(-14,Y+3,12,0xffc977,260);f.lamp(-10,Y+3,24,0xffc977,200);
 f.inter(-14,Y,12.8,3,'F — Rooftop cocktail (+10 health, $40)',()=>{if(pay(40)){G.health=Math.min(100,G.health+10);G.hud();toast('Enjoy the skyline.')}});
 // indoor zone
 const zr=f.r(-22.4,0,22.4,30.4);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],CURB-3,yf(5)-.3);
 // exterior accents
 sb.bb('emisN',zr[0],yf(5)-.1,f.r(-22.5,-2.7,22.5,-2.6)[1]-.02,zr[2],yf(5)+.04,f.r(-22.5,-2.7,22.5,-2.6)[3]+.02,0x37e8ff,{ao:1,noBottom:true,top:'emisN'});
}
function garage(ctx){const sb=ctx.sb,own=ctx.owner,f=new Frame(ctx,'S',FX,FZ),GH=6.2,y0=CURB;
 const gy=y0+GH;
 // floor
 f.floor(-46,0,-22,30,CURB+.02,0x2a2d33);for(let k=0;k<5;k++){const c=-43.8+4.4*k;f.floor(c-1.9,3,c+1.9,17,CURB+.03,0x3a3f48);f.box('emisN',c-1.95,3,c-1.85,17,CURB+.02,CURB+.035,0x37e8ff,false)}
 // walls
 const ops=[];for(let k=0;k<5;k++){const c=-43.8+4.4*k;ops.push({a:c-1.9,b:c+1.9,k:'door',yb:y0,yt:y0+3.8})}
 f.wallU(0,-46.2,-21.9,y0,gy,.4,0xd9d6cf,ops);f.wallV(-46,0,30,y0,gy,.4,0xd9d6cf);f.wallU(30,-46.2,-21.9,y0,gy,.4,0xcfcbc3);
 // roof
 const r=f.r(-46.4,-.2,-21.9,30.4);sb.bb('solid',r[0],gy,r[1],r[2],gy+.4,r[3],0x2b2f36,{ao:1,top:'solid',rc:0x6a6e74});Col.addBox(own,r[0],r[1],r[2],r[3],gy,gy+.4,{cam:true});
 // ceiling strips + lights
 for(let k=0;k<4;k++){f.box('emisN',-45+k*0+0,3+k*7,-23,3.3+k*7,gy-.15,gy-.02,0xcfefff,false)}
 for(let i=0;i<5;i++)for(let j=0;j<3;j++)f.lamp(-43.8+i*4.4,gy-.3,5+j*10,0xdff4ff,300,false);
 // sign + doors
 f.sign('NEON GARAGE',-34,y0+4.3,-.28,10,1.4,'#0b1c2b','#ff5ad8');
 // decor: tools, shelves, tires, lift
 for(let i=0;i<6;i++)f.fb(-45.2,12+i*2.5,.6,2,y0,2.2,0x3b4350);f.fb(-27,28.5,6,1,y0,2.4,0x3b4350);f.fb(-40,28,2.2,2.2,y0,1.1,0x15161a);
 for(let i=0;i<3;i++)f.fb(-35+i*4,26.5,2.6,1.2,y0,1.6,0xc0392b);f.fb(-42,22,3,5,y0,.35,0x6a6e74);
 f.npc(-30,24,y0,'work','staff',0,-1);
 // console + connector
 f.inter(-24,y0,18,3.2,'F — Garage: choose a vehicle',()=>G.openGarage&&G.openGarage());f.fb(-24,18,.8,.5,y0,1.1,0x15161a);f.fb(-24,18,.6,.05,y0+1.0,.4,0x35e0ff,false,'emis');
 f.inter(-40,y0,10,6,'F — Garage: choose a vehicle',()=>G.openGarage&&G.openGarage());
 const zr=f.r(-46,0,-22,30);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],0,gy);
}
function yard(ctx){const sb=ctx.sb,own=ctx.owner;
 const P=(x0,z0,x1,z1,col)=>sb.flat('ground',x0,z0,x1,z1,CURB+.02,col);
 P(-34,-4,-9,37,0x4a4d52);P(9,-4,15,37,0xd6d0c2);P(-9,-4,9,6,0xcfc8b8);
 // road markings on drive
 for(let z=-2;z<34;z+=4)sb.bb('solid',-21.1,CURB+.02,z,-20.9,CURB+.04,z+1.6,0xe8e8e0,{ao:1,noBottom:true});
 // fence
 const fz=35.6,fence=(x0,x1)=>{sb.bb('metal',x0,CURB,fz-.08,x1,CURB+1.9,fz+.08,0x1b1d22,{ao:1});Col.addBox(own,x0,fz-.2,x1,fz+.2,CURB,CURB+1.9);sb.bb('solid',x0,CURB,fz-.3,x1,CURB+.7,fz+.3,0xcfc8b8,{ao:1})};
 fence(-36.8,-34);fence(-9,9);fence(15,36.8);
 for(const x of[-34,-9,9,15]){sb.bb('solid',x-.5,CURB,fz-.5,x+.5,CURB+2.6,fz+.5,0xd9d4c8,{ao:1});Col.addBox(own,x-.5,fz-.5,x+.5,fz+.5,CURB,CURB+2.6);sb.box('emisN',x,CURB+2.8,fz,.5,.4,.5,0xffe3b0);Lamps_add(ctx,x,CURB+3,fz)}
 sign(ctx,'NEON MANOR',12,CURB+2.2,fz-.1,6,1.1,Math.PI,'#14110d','#e8c36a');
 // fountain
 sb.cyl('solid',12,CURB,22,3.4,3.4,.7,0xd9d4c8,24);sb.cyl('glass',12,CURB+.68,22,3.1,3.1,.02,0x35c0e8,24);sb.cyl('solid',12,CURB,22,.5,.4,2.6,0xd9d4c8,10);sb.cyl('emisN',12,CURB+2.6,22,.7,.2,.4,0x9fe8ff,10);Col.box(own,12,CURB+.35,22,6.8,.7,6.8);
 // hedges + trees + flowers
 for(const[x0,x1]of[[-8,8],[16,33]])sb.bb('solid',x0,CURB,0.6,x1,CURB+1.1,1.8,0x2d6b3f,{ao:1});
 for(const[x,z,s]of[[-4,14,1.1],[26,12,1.2],[30,26,1.0],[-4,28,1.0],[2,30,1.2],[24,31,1],[-30,31,1.1],[33,4,1.1],[-34,6,1]])tree(sb,x,z,s,CURB);
 for(let i=0;i<8;i++)Lamps_add(ctx,-28+i*8,CURB+1,34)
 for(const x of[3,21])sb.bb('solid',x,CURB,6,x+1.5,CURB+.4,7.5,0xe8e0d0,{ao:1});
}
function Lamps_add(ctx,x,y,z){lampAt(ctx,x,y,z,0xffe0b0,i0(x,z),false)}function i0(x,z){return 160}
registerGen(function estateGen(ctx){if(ctx.key!=='0,0')return;build(ctx);garage(ctx);yard(ctx)});
// garage vehicles are spawned once the game is ready
G.onReady.push(async function(){const {spawnCar}=await import('./vehicles.js');const list=['tesla','lamborghini','bugatti','ferrari','rolls'];
 list.forEach((n,k)=>{const c=-43.8+4.4*k,x=FX+c,z=FZ-8;const v=spawnCar(n,x,z,Math.PI,undefined,{y:CURB});v.owned=true;v.home={x,z,h:Math.PI};G.garageCars.push(v);G.owned.push(n)})});
