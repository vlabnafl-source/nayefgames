// NEON INTERNATIONAL AIRPORT — runway, taxiways, apron, 6-gate terminal with jet bridges, tower, hangars, parking.
// Runtime part (AI airline traffic, passengers, departure boards, ambient overflights) lives at the bottom of the file.
import {THREE,G,C,canvasTex,labelTex,clamp,lerp,hash2,PITCH} from './core.js';
import {Col,registerGen,Inter} from './world.js';
import {Frame,slab,sign,lampAt,toast,addCar,payAny,PAL} from './lib.js';
import {People} from './peds.js';
import {Lamps} from './sky.js';
import {makeElevator} from './elevator.js';
import {UI} from './ui.js';
import {Jet} from './aircraft.js';
import {getGeos,DEFS} from './carmodels.js';
import {road} from './regions.js';
import {createTraffic,A,Path,R_OUT,R_LINEUP,R_IN1,R_IN2,AIR_TOTAL,AIRPATH} from './flightai.js';

const V3=THREE.Vector3,RWX=A.RWX;
const ASPH=0x3a3d42,ASPH2=0x44474c,CONC=0x9a9d9e,WHITE=0xf2f2ee,YEL=0xe6c84a;
// ---------- helpers ----------
const fl=(ctx,key,x0,z0,x1,z1,y,col)=>{const r=ctx.clip(x0,z0,x1,z1);if(r)ctx.sb.flat(key,r[0],r[1],r[2],r[3],y,col)};
const bxc=(ctx,key,x0,y0,z0,x1,y1,z1,col,solid=false,o)=>{const r=ctx.clip(x0,z0,x1,z1);if(!r)return;ctx.sb.bb(key,r[0],y0,r[1],r[2],y1,r[3],col,{ao:1,noBottom:true,...o});if(solid)Col.addBox(ctx.owner,r[0],r[1],r[2],r[3],y0,y1)};
const pave=(ctx,x0,z0,x1,z1,top,col)=>bxc(ctx,'ground',x0,0,z0,x1,top,z1,col,false,{top:'ground',rc:col});
function ribbon(ctx,path,s0,s1,half,col,y,step=4){const c=C(col),o1={},o2={};
 for(let s=s0;s<s1;s+=step){const e=Math.min(s1,s+step+.5);path.at(s,o1);path.at(e,o2);const a=o1,b=o2;if(!ctx.has((a.x+b.x)/2,(a.z+b.z)/2))continue;
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,sx=-dz/l,sz=dx/l;
  ctx.sb.quad('ground',[a.x+sx*half,y,a.z+sz*half],[b.x+sx*half,y,b.z+sz*half],[b.x-sx*half,y,b.z-sz*half],[a.x-sx*half,y,a.z-sz*half],0,1,0,c)}}
function dashes(ctx,path,s0,s1,dash,gap,w,col,y){const c=C(col),o1={},o2={};
 for(let s=s0;s<s1;s+=dash+gap){const e=Math.min(s1,s+dash);path.at(s,o1);path.at(e,o2);const a=o1,b=o2;if(!ctx.has((a.x+b.x)/2,(a.z+b.z)/2))continue;
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,sx=-dz/l*w/2,sz=dx/l*w/2;
  ctx.sb.quad('ground',[a.x+sx,y,a.z+sz],[b.x+sx,y,b.z+sz],[b.x-sx,y,b.z-sz],[a.x-sx,y,a.z-sz],0,1,0,c)}}
// double sided quad (jet bridges etc.)
const dq=(sb,k,A_,B,Cc,D,n,col)=>{const u=[B[0]-A_[0],B[1]-A_[1],B[2]-A_[2]],v=[Cc[0]-A_[0],Cc[1]-A_[1],Cc[2]-A_[2]];
 const g=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],s=g[0]*n[0]+g[1]*n[1]+g[2]*n[2]>=0,P=s?[A_,B,Cc,D]:[D,Cc,B,A_];
 sb.quad(k,P[0],P[1],P[2],P[3],n[0],n[1],n[2],col);sb.quad(k,P[3],P[2],P[1],P[0],-n[0],-n[1],-n[2],col)};
// painted ground labels (runway numbers, gate numbers)
const planeG=new THREE.PlaneGeometry(1,1),flatMats=new Map();
function flatLabel(ctx,text,x,z,w,h,rot,color='#f2f2ee',font=200){const k=text+color+font;let mat=flatMats.get(k);if(!mat){const t=canvasTex(256,256,(x2,W,H)=>{x2.clearRect(0,0,W,H);x2.fillStyle=color;x2.font=`bold ${font}px Arial Narrow, Arial`;x2.textAlign='center';x2.textBaseline='middle';x2.fillText(text,W/2,H/2+8)},{clamp:true});
 mat=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:true});flatMats.set(k,mat)}
 const m=new THREE.Mesh(planeG,mat);m.rotation.set(-Math.PI/2,0,rot,'YXZ');m.scale.set(w,h,1);m.position.set(x,.075,z);ctx.add(m);return m}
// ---------- shared departure board ----------
const boardCanvas=document.createElement('canvas');boardCanvas.width=1024;boardCanvas.height=512;
const boardTex=new THREE.CanvasTexture(boardCanvas);boardTex.colorSpace=THREE.SRGBColorSpace;boardTex.anisotropy=4;
const boardMat=new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false});
function boardMesh(ctx,x,y,z,yaw,w=11,h=5.5){const m=new THREE.Mesh(planeG,boardMat);m.scale.set(w,h,1);m.position.set(x,y,z);m.rotation.y=yaw;ctx.add(m);
 const sb=ctx.sb;sb.bb('metal',x-w/2-.15,y-h/2-.15,z-.12,x+w/2+.15,y+h/2+.15,z+.12,0x1b1d22,{ao:1});return m}
// ---------- terminal gate module ----------
const TX=-650,TD=45,TH=11,FY=.05;
function gateModule(ctx,gi){const gz=A.GATES[gi],f=new Frame(ctx,'E',TX,gz),sb=ctx.sb,own=ctx.owner,H=TH,col=0xdfe3e8;
 f.floor(-21,0,21,TD,FY,0xe8e6e0,'marble');
 f.wallU(0,-21,21,0,H,.5,col,[{a:-7.6,b:-4.4,k:'door',yt:3.4},{a:-20.6,b:-8.2,k:'win',yb:.4,yt:H-.8},{a:-3.8,b:20.6,k:'win',yb:.4,yt:H-.8}]);
 f.wallU(TD,-21,21,0,H,.5,col,[{a:-7.4,b:-4.6,k:'door',yt:3.4},{a:-20.6,b:-8.2,k:'win',yb:.3,yt:H-.8},{a:-3.8,b:20.6,k:'win',yb:.3,yt:H-.8}]);
 if(gi===0)f.wallV(-21,0,TD,0,H,.5,col);if(gi===5)f.wallV(21,0,TD,0,H,.5,col);
 // roof + canopy
 const r=f.r(-21.2,-.6,21.2,TD+.6);sb.bb('solid',r[0],H,r[1],r[2],H+.7,r[3],0xdfe3e8,{ao:1,rc:0xe6e9ec});Col.addBox(own,r[0],r[1],r[2],r[3],H,H+.7,{cam:true});sb.bb('solid',r[0],H+.7,r[1],r[2],H+.74,r[3],0x2b3a55,{ao:1,noBottom:true,rc:0x59667a});
 const rc=f.r(-21.2,-10,21.2,-.6);sb.bb('solid',rc[0],4.7,rc[1],rc[2],5.1,rc[3],0xe8ebee,{ao:1,rc:0xc9ced4});Col.addBox(own,rc[0],rc[1],rc[2],rc[3],4.7,5.1,{cam:true});
 for(const u of[-20,-10,0,10,20])f.fb(u,-9.2,.5,.5,0,4.7,0xe8ebee);
 {const zn=f.zone(-21,0,21,TD,0,H);zn.shop='airport';zn.name='NEON AIRPORT DUTY FREE';zn.out={x:-633,z:gz+8,h:Math.PI}}
 // ceiling light strips + lamps
 for(const v of[10,24,38])f.box('emisN',-19,v-.2,19,v+.2,H-.12,H-.02,0xfff6e0,false,{noTop:true});
 for(const[u,v]of[[-12,12],[12,12],[-12,34],[12,34]])f.lamp(u,H-1.1,v,0xfff0d8,260,false);
 // exterior sign + gate sign
 if(gi===0||gi===3)f.sign('NEON INTERNATIONAL AIRPORT',0,H+2,-.2,22,2.4,'#06233a','#7df0ff');
 f.sign('GATE A'+(gi+1),-6,6.4,TD-.35,5.5,1.0,'#06233a','#ffd23f');
 f.sign('DEPARTURES · GATES A1–A6',-6,6.0,.3,9,1.0,'#06233a','#ffd23f');
 // security partition (lane left open at the corridor u=-6)
 f.box('solid',-21,21.7,-7.8,22.3,FY,FY+1.2,0x7d8794,true,{ao:1});f.box('solid',-4.2,21.7,21,22.3,FY,FY+1.2,0x7d8794,true,{ao:1});
 f.box('metal',-8.9,20.2,-7.8,24,FY,FY+1.0,0x2a2f36,true);f.box('metal',-4.2,20.2,-3.1,24,FY,FY+1.0,0x2a2f36,true);
 f.sign('SECURITY CHECK',-6,3.9,21.8,5,.8,'#2a1206','#ffb347');
 for(const u of[-9.8,-2.2])f.npc(u,23.2,FY,'work','cop',0,-1);
 // check-in desks
 for(const u of[7,16]){f.fb(u,8,7.6,1.5,FY,1.1,0x2b3a55);f.fb(u,8,7.8,1.7,FY+1.1,.07,0xe8e6e0,false);f.fb(u,9.2,.0+7,.05,FY+1.3,.6,0x35a0ff,false,'emis');f.npc(u-1.8,9.6,FY,'work','staff',0,-1);f.npc(u+1.8,9.6,FY,'work','staff',0,-1)}
 f.sign('CHECK-IN',11.5,4.4,2.0,6,.9,'#06233a','#7df0ff');
 // lounge: seating, café, podium, plants
 for(let k=0;k<5;k++){const u=2.5+k*3.6;f.fb(u,31,2.6,.8,FY,.5,0x2e3a5e);f.fb(u,30.5,2.6,.15,FY+.5,.6,0x2e3a5e,false);f.fb(u,36,2.6,.8,FY,.5,0x2e3a5e);f.fb(u,35.5,2.6,.15,FY+.5,.6,0x2e3a5e,false)}
 f.npc(6,31,FY,'sit',null,0,1);f.npc(13.5,36,FY,'sit',null,0,1);f.npc(17,31,FY,'sit',null,0,1);
 f.fb(16,41.2,8,1.2,FY,1.1,0x7a5636);f.fb(16,41.2,8.2,1.3,FY+1.1,.07,0xe8e6e0,false);f.npc(16,42.6,FY,'work','chef',0,-1);f.sign('COFFEE',16,3.6,43.7,3.4,.7,'#2a1a0a','#ffd9a0');
 f.fb(-1.2,40,1.6,.9,FY,1.05,0x2b3a55);f.npc(-1.2,41.2,FY,'work','staff',0,-1);
 f.npc(-14,36,FY,'talk','traveler',1,0);f.npc(-13,36,FY,'talk','traveler',-1,0);f.npc(-18,12,FY,'idle',null,0,1);
 f.plant(-19.5,3);f.plant(19.5,3);f.plant(-19.5,43);f.plant(19.5,26);f.plant(-10,43.5);
 f.pace(-18,16,-10,16,FY,'traveler');f.pace(18,27,3,27,FY,'traveler');
 // departure board hanging in front of the security line
 const bp=f.p(14,20.5);boardMesh(ctx,bp[0],8,bp[1],f.yaw,10,4.6);
 // gate info + flight info interactions
 f.inter(-6,40,FY,4.5,()=>{const p=G.air&&G.air.planes.find(q=>q.gate&&q.gate.i===gi);return `F — Gate A${gi+1}: ${p?p.flight+' to '+p.dest+' · '+p.status:'no flight at the moment'}`},()=>{const p=G.air&&G.air.planes.find(q=>q.gate&&q.gate.i===gi);toast(p?`Gate A${gi+1} — ${p.flight} to ${p.dest}: ${p.status}.`:`Gate A${gi+1} is free — the next arrival will be assigned automatically.`)});
 if(gi===2)f.inter(16,12.5,FY,4.5,'F — Flight to the Private Island Airport ($300)',()=>{if(payAny(300)){UI.splash('✈ BOARDING','#7df0ff',1500);setTimeout(()=>G.teleportTo({x:1250,y:.1,z:-210,yaw:0}),600);toast('Welcome to the Private Island Airport.')}});
 if(gi===1||gi===4){const bp2=f.p(-14,3);sb.bb('solid',bp2[0]-.5,FY,bp2[1]-.4,bp2[0]+.5,FY+2.3,bp2[1]+.4,0x1b3d8f,{ao:1});Col.addBox(own,bp2[0]-.5,bp2[1]-.4,bp2[0]+.5,bp2[1]+.4,FY,FY+2.3);f.sign('ATM',-14,3.1,2.58,.9,.35,'#06233a','#7df0ff')}
}
// ---------- jet bridge ----------
function jetBridge(ctx,gi){const gz=A.GATES[gi],sb=ctx.sb,own=ctx.owner,zc=gz-6,z0=zc-1.3,z1=zc+1.3,xa=-695.2,xb=-716.6,yA=.05,yB=3.0;
 const fy=x=>yA+(yB-yA)*(xa-x)/(xa-xb),cW=C(0xe3e6ea),cF=C(0x2c3036),cG=C(0xaad4ea),cR=C(0xdfe3e8),cS=C(0xfff3d6);
 // floor, roof, light strip
 dq(sb,'solid',[xa,fy(xa)+.01,z1],[xb,fy(xb)+.01,z1],[xb,fy(xb)+.01,z0],[xa,fy(xa)+.01,z0],[0,1,0],cF);
 dq(sb,'solid',[xa,fy(xa)+2.8,z1+.1],[xb,fy(xb)+2.8,z1+.1],[xb,fy(xb)+2.8,z0-.1],[xa,fy(xa)+2.8,z0-.1],[0,1,0],cR);
 dq(sb,'emisN',[xa,fy(xa)+2.76,zc+.3],[xb,fy(xb)+2.76,zc+.3],[xb,fy(xb)+2.76,zc-.3],[xa,fy(xa)+2.76,zc-.3],[0,-1,0],cS);
 for(const[z,n]of[[z1,1],[z0,-1]]){const zz=z+n*.05;
  dq(sb,'solid',[xa,fy(xa),zz],[xb,fy(xb),zz],[xb,fy(xb)+1,zz],[xa,fy(xa)+1,zz],[0,0,n],cW);
  dq(sb,'glass',[xa,fy(xa)+1,zz],[xb,fy(xb)+1,zz],[xb,fy(xb)+2.45,zz],[xa,fy(xa)+2.45,zz],[0,0,n],cG);
  dq(sb,'solid',[xa,fy(xa)+2.45,zz],[xb,fy(xb)+2.45,zz],[xb,fy(xb)+2.85,zz],[xa,fy(xa)+2.85,zz],[0,0,n],cW);
  for(let x=xa;x>xb+.1;x-=2){const x2=Math.max(xb,x-2);Col.addBox(own,x2,z-(n>0?0:.12),x,z+(n>0?.12:0),0,Math.max(fy(x),fy(x2))+2.9)}}
 // supports
 for(const x of[-704,-712]){const pz=zc;sb.cyl('metal',x,0,pz,.32,.32,fy(x)-.05,0x9aa3ad,8);Col.addBox(own,x-.32,pz-.32,x+.32,pz+.32,0,fy(x))}
 Col.addSurf(own,xb,z0,xa,z1,yB,yA,'x');
 Col.addZone(own,xb-4,z0-.2,xa,z1+.2,-1,7);
 // cab
 const cx0=-720.6,cx1=xb,cz0=gz-7.3,cz1=gz-2.0;
 sb.bb('solid',cx0,2.78,cz0,cx1,3.0,cz1,0x3a3f46,{ao:1,noBottom:false});Col.addSurf(own,cx0,cz0,cx1,cz1,3.0);
 sb.bb('solid',cx0-.1,3.0,cz0-.1,cx1+.1,3.9,cz1+.1,0xe3e6ea,{ao:1});sb.bb('glass',cx0-.08,3.9,cz0-.08,cx1+.08,5.5,cz1+.08,0xaad4ea,{ao:1,noTop:true,noBottom:true});sb.bb('solid',cx0-.15,5.5,cz0-.15,cx1+.15,5.85,cz1+.15,0xe3e6ea,{ao:1});
 Col.addBox(own,cx0-.1,cz0-.1,cx0+.1,cz1+.1,0,6);Col.addBox(own,cx0,cz0-.1,cx1,cz0+.1,0,6);Col.addBox(own,cx1-.1,zc+1.3,cx1+.1,cz1,0,6);Col.addBox(own,cx0,cz1-.05,cx1,cz1+.1,0,6);
 sb.bb('solid',cx0+.4,3.0,cz1-.1,cx1-.4,5.3,cz1+.4,0x16181c,{ao:1}); // rubber bellows docking at the aircraft door
 sb.bb('emisN',cx0+.3,5.4,cz0+.3,cx1-.3,5.46,cz1-.3,0xfff3d6,{noBottom:true});
 Col.addZone(own,cx0-.2,cz0-.2,cx1,cz1+.2,2,7);
 Lamps.add(own,-718.6,5.2,gz-4.6,0xfff0d8,160);
 // stand number painted on the apron + lead-in line + stop bar
 flatLabel(ctx,'A'+(gi+1),-706,gz+9,7,7,Math.PI/2,'#f2f2ee',150);
 if(ctx.has(-745,gz)){const sx=-765,L=37;bxc(ctx,'solid',sx,.06,gz-.15,sx+L,.075,gz+.15,YEL,false);bxc(ctx,'solid',-712.9,.06,gz-4,-712.5,.075,gz+4,0xe0462e,false)}
}
// ---------- control tower ----------
function tower(ctx){const TXc=-655.5,TZ=215,f=new Frame(ctx,'E',TXc,TZ),sb=ctx.sb,own=ctx.owner,LH=4.4,CY=34;
 f.floor(-4.5,0,4.5,9,FY,0xe8e6e0,'marble');
 f.wallU(0,-4.5,4.5,0,LH,.4,0xdfe3e8,[{a:-1.5,b:1.5,k:'door',yt:3.3},{a:-4.1,b:-1.9,k:'win',yb:.5,yt:3.6},{a:1.9,b:4.1,k:'win',yb:.5,yt:3.6}]);
 f.wallU(9,-4.5,4.5,0,LH,.4,0xdfe3e8,[{a:-3,b:3,k:'win',yb:.5,yt:3.6}]);f.wallV(-4.5,0,9,0,LH,.4,0xdfe3e8,[{a:2,b:7,k:'win',yb:.5,yt:3.6}]);f.wallV(4.5,0,9,0,LH,.4,0xdfe3e8,[{a:2,b:7,k:'win',yb:.5,yt:3.6}]);
 f.zone(-4.5,0,4.5,9,0,LH);f.lamp(-2.5,LH-.3,6,0xfff0d8,200,false);f.lamp(2.5,LH-.3,6,0xfff0d8,200,false);
 // solid shaft body with a hollow for the elevator
 const hole=f.r(-1.7,2.8,1.7,6.2),bx=f.r(-4.5,0,4.5,9);
 const parts=[[bx[0],bx[1],bx[2],hole[1]],[bx[0],hole[3],bx[2],bx[3]],[bx[0],hole[1],hole[0],hole[3]],[hole[2],hole[1],bx[2],hole[3]]];
 for(const p of parts){if(p[2]-p[0]<.05||p[3]-p[1]<.05)continue;sb.bb('win',p[0],LH,p[1],p[2],CY-.5,p[3],0xcfd3d8,{su:1/4,sv:1/4,top:'solid',rc:0x6a7a90});Col.addBox(own,p[0],p[1],p[2],p[3],LH,CY-.5)}
 makeElevator(ctx,{x0:hole[0],z0:hole[1],x1:hole[2],z1:hole[3],front:'E',stops:[{y:FY,name:'Lobby'},{y:CY,name:'Control Room'}],speed:5,name:'Tower Elevator',wall:0x9aa1a9});
 sb.bb('solid',hole[0],37.4,hole[1],hole[2],38.0,hole[3],0x9aa1a9,{ao:1});
 f.sign('AIR TRAFFIC CONTROL',0,LH+1.6,-.05,7,1.0,'#06233a','#7df0ff');
 f.sign('NEON TOWER · F to call the elevator',0,2.6,2.7,3.2,.5,'#06233a','#ffd23f');
 f.npc(-3,6,FY,'work','staff',1,0);f.plant(3.4,7.8);
 // control room
 const rx0=bx[0]-4.3,rx1=bx[2]+4.3,rz0=bx[1]-4.3,rz1=bx[3]+4.3;
 slab(ctx,rx0,rz0,rx1,rz1,CY,.5,0x4a5058,[{x0:hole[0]-.05,z0:hole[1]-.05,x1:hole[2]+.05,z1:hole[3]+.05}],{ceil:0x8a9099});
 sb.bb('glass',rx0,CY,rz0,rx1,CY+5.6,rz1,0x9fd0e6,{ao:1,noTop:true,noBottom:true});
 for(const[a,b,c,d]of[[rx0,rz0,rx1,rz0+.12],[rx0,rz1-.12,rx1,rz1],[rx0,rz0,rx0+.12,rz1],[rx1-.12,rz0,rx1,rz1]])Col.addBox(own,a,b,c,d,CY,CY+5.6);
 for(let k=0;k<=4;k++){const t=k/4,x=rx0+(rx1-rx0)*t,z=rz0+(rz1-rz0)*t;sb.bb('metal',x-.07,CY,rz0-.04,x+.07,CY+5.6,rz0+.1,0x1b1d22,{ao:1});sb.bb('metal',x-.07,CY,rz1-.1,x+.07,CY+5.6,rz1+.04,0x1b1d22,{ao:1});sb.bb('metal',rx0-.04,CY,z-.07,rx0+.1,CY+5.6,z+.07,0x1b1d22,{ao:1});sb.bb('metal',rx1-.1,CY,z-.07,rx1+.04,CY+5.6,z+.07,0x1b1d22,{ao:1})}
 const cons=[[rx0+1,rz0+.8,rx1-1,rz0+2.2],[rx0+1,rz1-2.2,rx1-1,rz1-.8],[rx0+.8,rz0+3,rx0+2.2,rz1-3]];
 for(const c of cons){sb.bb('solid',c[0],CY,c[1],c[2],CY+1.05,c[3],0x2a2f36,{ao:1});Col.addBox(own,c[0],c[1],c[2],c[3],CY,CY+1.05);sb.bb('emisN',c[0]+.3,CY+1.06,c[1]+.2,c[2]-.3,CY+1.1,c[3]-.2,0x1c6fa8,{noBottom:true})}
 People.addSpawn(own,{x:(rx0+rx1)/2-3,y:CY,z:rz0+3.2,h:Math.PI,anim:'work',outfit:'staff'});People.addSpawn(own,{x:(rx0+rx1)/2+3,y:CY,z:rz1-3.2,h:0,anim:'work',outfit:'staff'});People.addSpawn(own,{x:rx0+3.2,y:CY,z:(rz0+rz1)/2,h:-Math.PI/2,anim:'work',outfit:'staff'});
 Col.addZone(own,rx0,rz0,rx1,rz1,CY,CY+5.6);Lamps.add(own,(rx0+rx1)/2+3,CY+4.8,(rz0+rz1)/2+3,0xfff0d8,260);Lamps.add(own,(rx0+rx1)/2-3,CY+4.8,(rz0+rz1)/2-3,0xcfe8ff,200);
 sb.bb('solid',rx0-1,CY+5.6,rz0-1,rx1+1,CY+6.4,rz1+1,0x2b3a55,{ao:1,rc:0x6a7a90});Col.addBox(own,rx0-1,rz0-1,rx1+1,rz1+1,CY+5.6,CY+6.4,{cam:true});
 const mx=(rx0+rx1)/2,mz=(rz0+rz1)/2;sb.cyl('metal',mx,CY+6.4,mz,.2,.2,9,0xcfd3d8,6);sb.box('emisN',mx,CY+15.6,mz,.6,.6,.6,0xff3030);sb.bb('emisN',rx0-1,CY+6.4,rz0-1,rx0-.8,CY+6.7,rz0-.8,0xff3030);
 f.inter(0,-1.5,0,3,'F — Air Traffic Control: view the airport traffic',()=>{const l=(G.air?G.air.planes:[]).map(p=>`${p.flight} ${p.status}`).join(' · ');toast('Traffic: '+l)});
}
// ---------- hangars ----------
function hangar(ctx,n,zc){const x0=-770,x1=-740,z0=zc-25,z1=zc+25,H=12,sb=ctx.sb,own=ctx.owner,wallC=0xcfd3d8;
 const wall=(a,b,c,d,y0=0,y1=H)=>{if(c-a<.02||d-b<.02)return;sb.bb('solid',a,y0,b,c,y1,d,wallC,{ao:1,top:'solid'});Col.addBox(own,a,b,c,d,y0,y1)};
 wall(x0,z0,x1,z0+.4);wall(x1-.4,z0,x1,z1);
 // south wall with a personnel door
 wall(x0,z1-.4,-753,z1);wall(-749.8,z1-.4,x1,z1);wall(-753,z1-.4,-749.8,z1,3.3,H);
 sb.bb('metal',-753.05,0,z1-.45,-752.9,3.3,z1+.05,0x1b1d22,{ao:1});sb.bb('metal',-749.9,0,z1-.45,-749.75,3.3,z1+.05,0x1b1d22,{ao:1});
 sb.bb('solid',x0,H,z0,x1,H+.8,z1,0x6a7a90,{ao:1});Col.addBox(own,x0,z0,x1,z1,H,H+.8,{cam:true});
 // open front: gantry beam with sign
 sb.bb('solid',x0-.2,9.2,z0,x0+.2,H,z1,0x2b3a55,{ao:1});sign(ctx,'PRIVATE AVIATION · HANGAR '+n,x0-.3,10.6,zc,14,1.4,-Math.PI/2,'#06233a','#7df0ff');
 sb.bb('solid',x0-.1,0,z0,x0+.5,9.2,z0+.5,wallC,{ao:1});Col.addBox(own,x0-.1,z0,x0+.5,z0+.5,0,9.2);sb.bb('solid',x0-.1,0,z1-.5,x0+.5,9.2,z1,wallC,{ao:1});Col.addBox(own,x0-.1,z1-.5,x0+.5,z1,0,9.2);
 Col.addZone(own,x0,z0,x1,z1,0,H);
 for(const dz of[-12,12])Lamps.add(own,-755,H-1,zc+dz,0xfff0d8,300);
 sb.bb('emisN',-757,H-.2,z0+3,-753,H-.1,z1-3,0xfff6e0,{noBottom:true});
 // workshop corner
 const bx0=x1-3.2;sb.bb('solid',bx0,0,z0+1,x1-.6,1.05,z0+10,0x7a5636,{ao:1});Col.addBox(own,bx0,z0+1,x1-.6,z0+10,0,1.05);sb.bb('solid',bx0,0,z0+12,x1-.6,1.5,z0+13.2,0xb5342a,{ao:1});Col.addBox(own,bx0,z0+12,x1-.6,z0+13.2,0,1.5);
 People.addSpawn(own,{x:x1-4.8,y:0,z:z0+5,h:Math.PI/2,anim:'work',outfit:'staff'});People.addSpawn(own,{x:x1-5,y:0,z:z1-8,h:-Math.PI/2,anim:'talk',outfit:'pilot'});
 sb.bb('solid',-766,0,zc-.4,-764,.05,zc+.4,YEL,{noBottom:true});
}
// ---------- landside: forecourt, parking ----------
function landside(ctx){const sb=ctx.sb,own=ctx.owner;
 road(ctx,-628,-175,-628,235,16);
 pave(ctx,-650,-150,-636,150,.07,0xb9bbb8);          // sidewalk in front of the terminal
 pave(ctx,-620,-132,-545,132,.04,0x4d5054);          // car park
 for(let z=-129;z<=129;z+=3){for(const[x0,x1]of[[-616,-606],[-604,-594],[-580,-570],[-568,-558]])bxc(ctx,'solid',x0,.04,z-.05,x1,.055,z+.05,0xe6e6de)}
 sign(ctx,'AIRPORT PARKING',-620.5,4,-132.5,0,0,0);
 // parked cars (deterministic so every chunk agrees)
 const geos=[getGeos(DEFS.sedan),getGeos(DEFS.hatch),getGeos(DEFS.suv)],cols=[0xe5e8ed,0x11151d,0x9d1022,0x153c74,0x777d83,0xf2f0e8,0x2b3a55];
 const rows=[[-611,Math.PI/2],[-599,-Math.PI/2],[-575,Math.PI/2],[-563,-Math.PI/2]];
 for(const[x,h]of rows)for(let z=-127.5;z<=127.5;z+=3){if(!ctx.has(x,z))continue;const r=hash2(Math.round(x),Math.round(z*2),77);if(r>.3)continue;addCar(sb,geos[Math.floor(r*10)%3],x,.04,z,h+(hash2(z,x,5)-.5)*.05,cols[Math.floor(r*23)%cols.length])}
 for(let z=-120;z<=120;z+=40)for(const x of[-587,-545.5]){if(!ctx.has(x,z))continue;sb.cyl('metal',x,0,z,.1,.14,8,0x3a3f46,6);sb.box('emisN',x,8.1,z,.9,.12,.5,0xffe3b0);Lamps.add(ctx.owner,x,7.8,z,0xffd9a0,320);sb.quad('lampglow',[x-9,.07,z+9],[x+9,.07,z+9],[x+9,.07,z-9],[x-9,.07,z-9],0,1,0,C(0xffcf90))}
}
// ---------- airfield ----------
function airfield(ctx){
 const sb=ctx.sb,RW=22.5,ZR=720;
 // runway, shoulders, taxiway, stopways, hold bay
 pave(ctx,RWX-RW,-ZR,RWX+RW,ZR,.03,ASPH);pave(ctx,RWX-RW-7,-ZR,RWX-RW,ZR,.03,ASPH2);pave(ctx,RWX+RW,-ZR,RWX+RW+7,ZR,.03,ASPH2);
 pave(ctx,-843,-660,-827,ZR,.03,ASPH);pave(ctx,-832,-640,-742,-452,.06,CONC);pave(ctx,-905,382,-827,442,.03,ASPH);
 pave(ctx,-843,200,-760,290,.03,ASPH);
 // north exit (R_IN1/R_IN2) and apron lane
 const rin1=R_IN1(),rin2=R_IN2(0),rout=R_OUT(215);
 ribbon(ctx,rin1,0,rin1.len,13,ASPH,.03);ribbon(ctx,rin2,0,rin2.len,13,ASPH,.03);
 pave(ctx,-780,-232,-756,-130,.03,ASPH);pave(ctx,-780,145,-756,230,.03,ASPH);

 // apron (concrete) + GA ramp
 pave(ctx,-805,-145,-695,150,.06,CONC);pave(ctx,-832,-450,-742,-282,.06,CONC);
 // ---- runway markings ----
 for(let z=-690;z<690;z+=30)bxc(ctx,'solid',RWX-.5,.03,z,RWX+.5,.06,z+18,WHITE);
 for(const sx of[-1,1])bxc(ctx,'solid',RWX+sx*21.5-.2,.03,-ZR,RWX+sx*21.5+.2,.06,ZR,WHITE);
 for(const sz of[-1,1]){const z0=sz>0?ZR-48:-ZR+4;for(let k=-8;k<=8;k++)if(k)bxc(ctx,'solid',RWX+k*2.4-.5,.03,z0,RWX+k*2.4+.5,.06,z0+44-(sz>0?0:0),WHITE);
  for(const a of[420,270]){const zz=sz*a;for(const sx of[-1,1]){bxc(ctx,'solid',RWX+sx*9-1.5,.03,zz-15,RWX+sx*9+1.5,.06,zz+15,WHITE);if(a===270){bxc(ctx,'solid',RWX+sx*6.5-.9,.03,zz-9,RWX+sx*6.5+.9,.06,zz+9,WHITE)}}}
  // threshold lights + edge lights
  for(const sx of[-1,1])for(let k=-8;k<=8;k++)if(ctx.has(RWX+k*2.6,sz*(ZR-1)))sb.box('emisN',RWX+k*2.6,.1,sz*(ZR-1),.5,.12,.5,sz>0?0x33ff66:0xff4a3a)}
 for(let z=-ZR+10;z<ZR;z+=24)for(const sx of[-1,1]){if(ctx.has(RWX+sx*23.6,z))sb.box('emisN',RWX+sx*23.6,.1,z,.5,.14,.5,0xaad4ff)}
 // numbers: "36" (north-facing landing) at the south end, "18" at the north end
 flatLabel(ctx,'36',RWX,ZR-75,16,16,0,'#f2f2ee',210);flatLabel(ctx,'18',RWX,-ZR+75,16,16,Math.PI,'#f2f2ee',210);
 // ---- taxi centre lines ----
 const yl=.06,w=.32;
 bxc(ctx,'solid',-835-w/2,.03,-232,-835+w/2,yl,392,YEL);bxc(ctx,'solid',-835-w/2,.03,392,-835+w/2,yl,720,YEL);
 const lane=new Path(A.LANE_X,-232,Math.PI);lane.line(447);const ln=pa=>dashes(ctx,pa,0,pa.len,3.2,0,w,YEL,.062);ln(lane);ln(rout);ln(R_LINEUP());ln(rin1);ln(rin2);
 // hold-short lines (double) at the runway edge + stop bars
 bxc(ctx,'solid',RWX+RW+7.5,.03,414,RWX+RW+7.8,.06,426,YEL);
 bxc(ctx,'solid',-878,.03,414,-877.4,.06,426,YEL);bxc(ctx,'solid',-876.8,.03,414,-876.2,.06,426,YEL,false);
 // apron floodlight masts
 for(const[x,z]of[[-700,-148],[-700,148],[-806,-148],[-806,148],[-700,0],[-806,0]]){if(!ctx.has(x,z))continue;sb.cyl('metal',x,0,z,.2,.3,26,0x6a7078,6);sb.bb('emisN',x-1.6,26,z-.3,x+1.6,26.4,z+.3,0xfff4e0,{noBottom:true});Lamps.add(ctx.owner,x,24,z,0xfff1d6,700);Col.addBox(ctx.owner,x-.3,z-.3,x+.3,z+.3,0,26);sb.quad('lampglow',[x-18,.09,z+18],[x+18,.09,z+18],[x+18,.09,z-18],[x-18,.09,z-18],0,1,0,C(0xfff0d0))}
 // wind socks + beacon near the tower
 if(ctx.has(-860,330)){sb.cyl('metal',-860,0,330,.08,.08,7,0xdddddd,5);sb.bb('solid',-860,6.4,330,-856,6.9,330.5,0xff7a1a,{ao:1})}
}
registerGen(function airport(ctx){
 if(ctx.i<-15||ctx.i>-5||Math.abs(ctx.j)>8)return;
 airfield(ctx);
 if(ctx.i>=-8&&ctx.i<=-5)landside(ctx);
 for(let gi=0;gi<6;gi++){const gz=A.GATES[gi];if(ctx.has(-670,gz))gateModule(ctx,gi);if(ctx.has(-700,gz))jetBridge(ctx,gi)}
 if(ctx.has(-660,215))tower(ctx);
 if(ctx.has(-755,-315))hangar(ctx,1,-315);if(ctx.has(-755,-415))hangar(ctx,2,-415);
 if(ctx.has(-650,0))G.pois.push({x:-650,z:0,name:'International Airport',col:'#7df0ff',big:true});
});
G.tp['International Airport']={x:-640,y:.1,z:-30,yaw:Math.PI/2};G.tp['Runway']={x:-900,y:.1,z:380,yaw:0};
G.tp['Airport Gates']={x:-690,y:.1,z:-27,yaw:Math.PI/2};G.tp['Control Tower']={x:-648,y:.1,z:215,yaw:Math.PI/2};G.tp['Airport Hangars']={x:-775,y:.1,z:-365,yaw:Math.PI/2};G.tp['GA Ramp']={x:-770,y:.1,z:-520,yaw:Math.PI/2};

// =====================================================================================
// RUNTIME: autonomous airline traffic, passengers, departure boards, ambient overflights
// =====================================================================================
const T=createTraffic({rand:Math.random,hooks:{}});G.air=T;
let warm=true;
const gateName=g=>g?'A'+(g.i+1):'—';
const nearTerminal=(r=220)=>{const pp=G.player&&G.player.g.position;return pp&&Math.hypot(pp.x+680,pp.z)<r};
T.hooks.pax=(dir,gi,p)=>{if(!warm)spawnPax(dir,gi,p)};
T.hooks.event=(k,p)=>{if(warm||!nearTerminal(260))return;
 if(k==='gate')toast(`✈ ${p.flight} from ${p.dest} has arrived at gate ${gateName(p.gate)}`);
 else if(k==='push')toast(`✈ ${p.flight} to ${p.dest} is pushing back and will depart shortly`);
 else if(k==='lof')toast(`✈ ${p.flight} to ${p.dest} has taken off`)};
// initial fleet
T.addPlane(0,'gate',{g:1,t:30});T.addPlane(1,'gate',{g:4,t:12});T.addPlane(2,'air',{s:900});T.addPlane(3,'air',{s:AIR_TOTAL*.55});T.addPlane(4,'air',{s:AIR_TOTAL-3300});
// warm-up so the airport is in a random, lively state when the player first arrives
{const n=Math.floor((60+Math.random()*540)/.25);for(let k=0;k<n;k++)T.update(.25);warm=false}
const jets=[],gateCols=[];
function ensureVisuals(){if(jets.length)return;
 for(const p of T.planes){const j=new Jet(p.x,p.z,p.h,0xf2f2ee,2.2,p.y,{airline:p.airline});j.scripted=true;j.locked=true;j.awake=false;j.label=p.flight;jets.push(j)}
 // collision for parked aircraft (fuselage + wing), enabled only while an aircraft sits at that gate
 for(const gz of A.GATES){const PX=A.PX,own='airport-ac';gateCols.push([Col.addBox(own,PX-23.5,gz-2.1,PX+14.3,gz+2.1,1.0,6.2),Col.addBox(own,PX-12,gz-17.5,PX+1,gz+17.5,1.0,3.4)]);}
 // ambient overflights: always some airliners crossing the sky above the city
 for(const[sc,al,col]of[[2.2,'sky',0xf2f2ee],[2.2,'gulf',0xf2f2ee],[1,'vip',0xf4f4f0]]){const j=new Jet(0,0,0,col,sc,400,{airline:sc>1.5?al:undefined});j.scripted=true;j.locked=true;j.awake=false;j.label='Flight';j.amb={spd:78+Math.random()*14,alt:280+Math.random()*190};j.amb.gk=1;amb.push(j);resetAmb(j,true)}}
const amb=[];
function resetAmb(j,first){const pp=G.player?G.player.g.position:{x:0,z:0},a=Math.random()*Math.PI*2,fx=-Math.sin(a),fz=-Math.cos(a),off=(Math.random()-.5)*1100,back=first?(Math.random()*2600-1300):-2000;
 j.amb.x=pp.x+fx*back-fz*off;j.amb.z=pp.z+fz*back+fx*off;j.amb.h=a;j.amb.alt=260+Math.random()*210;j.amb.spd=76+Math.random()*16;j.amb.t=Math.random()*10}
// ---------- passengers walking between the terminal and the aircraft ----------
function spawnPax(dir,gi){const gz=A.GATES[gi],pp=G.player.g.position;if(Math.hypot(pp.x+700,pp.z-gz)>150||People.list.length>250)return;
 const zc=gz-6,lat=(Math.random()-.5)*1.1,r=Math.random;let x,y=0,z,wp;
 if(dir==='in'){x=-641;z=zc+(r()-.5)*9;wp=[[-653,zc+lat*.5],[-672,zc+lat],[-695.5,zc+lat],[-716,zc+lat],[-718.6,zc+lat*.4],[-718.6,gz-2.35]]}
 else{x=-718.6;y=3;z=gz-2.6;wp=[[-718.6,zc+lat*.4],[-716,zc+lat],[-696,zc+lat],[-672,zc+lat],[-653,zc+lat*.6],[-640,zc+(r()-.5)*10],[-633,gz+(r()-.5)*34]]}
 People.make({x,y,z,mode:'path',spd:1.2+r()*.4,outfit:'traveler',wp})}
// ---------- departure board ----------
function drawBoard(){const c=boardCanvas.getContext('2d'),W=1024,H=512;c.fillStyle='#04101c';c.fillRect(0,0,W,H);c.fillStyle='#0c2a44';c.fillRect(0,0,W,66);
 c.font='bold 38px Arial';c.textBaseline='middle';c.fillStyle='#7df0ff';c.textAlign='left';c.fillText('NEON INTERNATIONAL  ·  FLIGHTS',22,34);
 const hr=Math.floor(G.hour||0),mn=Math.floor(((G.hour||0)%1)*60);c.textAlign='right';c.fillStyle='#ffd23f';c.fillText(String(hr).padStart(2,'0')+':'+String(mn).padStart(2,'0'),W-22,34);
 c.font='bold 26px Arial';c.fillStyle='#7d93a8';c.textAlign='left';const X=[22,190,560,700];['FLIGHT','DESTINATION','GATE','STATUS'].forEach((t,i)=>c.fillText(t,X[i],92));
 const rows=T.planes.slice().sort((a,b)=>(a.gate?a.gate.i:9)-(b.gate?b.gate.i:9)||a.id-b.id);
 c.font='bold 34px Arial';rows.forEach((p,i)=>{const y=140+i*68;if(i%2){c.fillStyle='rgba(125,240,255,.06)';c.fillRect(0,y-30,W,64)}
  const st=p.status||'';c.fillStyle='#e8f4ff';c.fillText(p.flight,X[0],y);c.fillText(p.dest,X[1],y);c.fillStyle='#ffd23f';c.fillText(gateName(p.gate),X[2],y);
  c.fillStyle=/BOARD|LANDED/.test(st)?'#5dff8f':/CLOSED|PUSH/.test(st)?'#ff6b5c':/TAXI|LINE|DEPART|HOLD|EN ROUTE|APPROACH/.test(st)?'#ffb347':'#e8f4ff';c.font='bold 30px Arial';c.fillText(st,X[3],y);c.font='bold 34px Arial'});
 boardTex.needsUpdate=true}
drawBoard();
// ---------- per-frame ----------
let acc=0,boardT=0;
window.__MODS=window.__MODS||[];
window.__MODS.push({update(dt,pp){
 ensureVisuals();acc=Math.min(acc+dt,.25);while(acc>=1/30){T.update(1/30);acc-=1/30}
 for(let i=0;i<jets.length;i++){const a=T.planes[i],j=jets[i];if(j.dead)continue;
  const far=Math.hypot(a.x-pp.x,a.z-pp.z)>2600;j.group.visible=!far;if(far)continue;
  j.group.position.set(a.x,a.y,a.z);j.group.rotation.set(a.pitch,a.h,a.roll,'YXZ');j.heading=a.h;j.speed=a.spd;j.pitch=a.pitch;j.roll=a.roll;j.vx=-Math.sin(a.h)*a.spd;j.vz=-Math.cos(a.h)*a.spd;j.onGround=!a.airborne;
  j.gk+=clamp(a.gearT-j.gk,-dt*.45,dt*.45);j.m.setGear(j.gk);j.m.tick(dt,{speed:a.spd,airborne:a.airborne,engines:a.eng})}
 for(let g=0;g<gateCols.length;g++){const o=T.gates[g].occ,on=!!o&&o.state==='gate';for(const b of gateCols[g])b.en=on}
 for(const j of amb){if(j.dead)continue;const o=j.amb;o.t+=dt;o.x+=-Math.sin(o.h)*o.spd*dt;o.z+=-Math.cos(o.h)*o.spd*dt;
  if(Math.hypot(o.x-pp.x,o.z-pp.z)>2300)resetAmb(j,false);
  j.group.position.set(o.x,o.alt,o.z);const roll=Math.sin(o.t*.17)*.03;j.group.rotation.set(.025,o.h,roll,'YXZ');j.heading=o.h;j.speed=o.spd;j.m.setGear(1);j.m.tick(dt,{speed:o.spd,airborne:true,engines:true})}
 boardT-=dt;if(boardT<=0){boardT=1.5;if(nearTerminal(380))drawBoard()}
 const dim=.3+.7*(G.daylight??1);for(const m of flatMats.values())m.color.setScalar(dim)}});

// ================= PASSENGER MODE (M) =================
{
const PX={i:-1,ext:false,yaw0:0,cabin:null,hud:null,hudT:0,msgT:0};G.pax=null;
const SEAT={x:-1.3,y:3.95,z:-3.3};
function buildCabin(){
 const g=new THREE.Group();
 const cv=document.createElement('canvas');cv.width=2048;cv.height=1024;const c=cv.getContext('2d');
 c.fillStyle='#e4e7ec';c.fillRect(0,0,2048,1024);c.fillStyle='#c9ced6';c.fillRect(0,0,2048,1024*0);
 for(let r=0;r<28;r++){const y=(19-(-6+r*.9))*36.57;for(const ux of[.25,.75]){c.fillStyle='#8f97a3';c.beginPath();c.ellipse(ux*2048,y,70,16,0,0,6.2832);c.fill()}}
 c.globalCompositeOperation='destination-out';
 for(let r=0;r<28;r++){const y=(19-(-6+r*.9))*36.57;for(const ux of[.25,.75]){c.beginPath();c.ellipse(ux*2048,y,62,13,0,0,6.2832);c.fill()}}
 const tex=new THREE.CanvasTexture(cv);
 const tube=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.85,28,32,1,true),new THREE.MeshBasicMaterial({map:tex,alphaTest:.5,side:THREE.BackSide}));
 tube.rotation.x=Math.PI/2;tube.position.set(0,3.7,5);g.add(tube);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(3.1,28),new THREE.MeshBasicMaterial({color:0x2b3a55}));floor.rotation.x=-Math.PI/2;floor.position.set(0,2.72,5);g.add(floor);
 const aisle=new THREE.Mesh(new THREE.PlaneGeometry(.5,28),new THREE.MeshBasicMaterial({color:0x6b7a99}));aisle.rotation.x=-Math.PI/2;aisle.position.set(0,2.725,5);g.add(aisle);
 for(const z of[-9,19]){const w=new THREE.Mesh(new THREE.CircleGeometry(1.85,32),new THREE.MeshBasicMaterial({color:0xcfd3da,side:THREE.DoubleSide}));w.position.set(0,3.7,z);g.add(w)}
 const rows=28,xs=[-1.3,-.78,-.26,.26,.78,1.3].filter(x=>true);
 const cu=new THREE.InstancedMesh(new THREE.BoxGeometry(.46,.12,.5),new THREE.MeshBasicMaterial({color:0x1d4f91}),rows*6);
 const bk=new THREE.InstancedMesh(new THREE.BoxGeometry(.46,.62,.1),new THREE.MeshBasicMaterial({color:0x1a447d}),rows*6);
 const hr=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.14,.06),new THREE.MeshBasicMaterial({color:0xe8e8ee}),rows*6);
 const m=new THREE.Matrix4();let n=0;
 for(let r=0;r<rows;r++){const z=-6+r*.9;for(const x of xs){
  m.makeTranslation(x,3.1,z);cu.setMatrixAt(n,m);m.makeTranslation(x,3.45,z+.28);bk.setMatrixAt(n,m);m.makeTranslation(x,3.85,z+.31);hr.setMatrixAt(n,m);n++}}
 g.add(cu,bk,hr);
 const cols=[0x7a3b2e,0x2e4a7a,0x3b7a4e,0x7a6a2e,0x5b2e7a,0x2e7a76,0x8a2f4a,0x444b55],skin=[0xe0b494,0xc68a5f,0x8d5a3b,0xf0c8a8,0x6b4128];
 function person(x,z,sd,standing){const pg=new THREE.Group(),h=standing?2.72:3.1,tc=cols[(sd*7)%cols.length],sk=skin[(sd*3)%skin.length];
  const tor=new THREE.Mesh(new THREE.BoxGeometry(.4,standing?.7:.5,.24),new THREE.MeshBasicMaterial({color:standing?0x1b2f66:tc}));tor.position.y=h+(standing?.9:.45);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),new THREE.MeshBasicMaterial({color:sk}));hd.position.y=h+(standing?1.45:.95);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.115,12,10,0,6.3,0,1.4),new THREE.MeshBasicMaterial({color:[0x1a1410,0x3b2a1a,0x7a5a2a,0x222222][sd%4]}));hair.position.y=hd.position.y+.01;
  pg.add(tor,hd,hair);if(standing){const lg=new THREE.Mesh(new THREE.BoxGeometry(.32,.9,.2),new THREE.MeshBasicMaterial({color:0x14224d}));lg.position.y=h+.45;pg.add(lg)}else{const lg=new THREE.Mesh(new THREE.BoxGeometry(.36,.14,.4),new THREE.MeshBasicMaterial({color:0x2a2a33}));lg.position.set(0,h+.12,-.18);pg.add(lg)}
  pg.position.set(x,0,z);if(standing)pg.rotation.y=Math.PI;g.add(pg)}
 const taken=new Set(['-1.3,-3.3']);
 const nb=[[-.78,-3.3,1],[.26,-3.3,2],[-1.3,-2.4,3],[.78,-4.2,4]];for(const[x,z,sd]of nb){person(x,z,sd,false);taken.add(x+','+z)}
 let sd2=5;for(let r=0;r<rows;r++){const z=-6+r*.9;for(const x of xs){const k=x+','+Math.round(z*10)/10;if(taken.has(x+','+z))continue;if(Math.abs(z+3.3)<2.5&&Math.abs(x+1.3)<.1)continue;if(((r*7+Math.round(x*10))*2654435761>>>0)%100<55){person(x,z,sd2++,false)}}}
 person(0,-7.4,9,true);
 g.visible=false;return g}
const TALK={Amira:['Hi! First time flying with NEON AIR? The window seat view is the best part.','I am visiting my sister — I cannot wait to land.','The coffee on this airline is surprisingly good.','Did you see the city lights during take-off? Unreal.'],Daniel:['Business trip again… at least the seats are comfortable.','I fly this route every month. Smoothest airline in the sky.','Tip: ask the flight attendant for a drink once we are airborne.','Nice weather today — should be a gentle flight.'],Yuki:['Oh, hello! I am heading home to Japan for the cherry blossoms.','Would you like a mint? Take one.','I love watching the clouds from up here.','Please lean the seat back and enjoy the flight!'],Marco:['Ciao! I am from Rome — you should visit, the food is amazing.','Everything feels calmer at 10,000 metres, no?','The captain sounds very relaxed today.','Great plane, huh? So quiet inside.'],Sofia:['Welcome aboard! I am Sofia, your flight attendant. Can I get you a drink?','Here is a cold juice — please enjoy it. Fasten your seatbelt when the sign is on.','We will arrive on time. Anything else I can do for you?','You can look out of the window by pressing Q.']};
const WHO=['Amira','Daniel','Yuki','Marco','Sofia'];let talkI=0,talkN={};
function pickPlane(){
 const pp=window.__P.g.position,near=pp.x<-600;let best=-1,bd=1e9;
 for(let i=0;i<T.planes.length;i++){const a=T.planes[i];if(!a||jets[i]&&jets[i].dead)continue;
  const want=near?(a.state==='gate'):a.airborne;if(!want)continue;
  const d=Math.hypot(a.x-pp.x,a.z-pp.z);if(d<bd){bd=d;best=i}}
 if(best<0)for(let i=0;i<T.planes.length;i++){const a=T.planes[i];if(!a)continue;const d=Math.hypot(a.x-pp.x,a.z-pp.z);if(d<bd){bd=d;best=i}}
 return best}
function hud(){if(PX.hud)return PX.hud;const d=document.createElement('div');d.style.cssText='position:fixed;left:50%;top:104px;transform:translateX(-50%);padding:8px 16px;background:rgba(8,14,26,.72);color:#dbe8ff;font:600 13px system-ui,sans-serif;border:1px solid rgba(120,170,255,.4);border-radius:10px;z-index:30;pointer-events:none;display:none;white-space:nowrap';document.body.appendChild(d);return PX.hud=d}
function board(){
 ensureVisuals();const i=pickPlane();if(i<0){G.notify('No flights available right now');return}
 const j=jets[i],a=T.planes[i];
 if(!PX.cabin){PX.cabin=buildCabin()}
 PX.cabin.parent&&PX.cabin.parent.remove(PX.cabin);j.group.add(PX.cabin);PX.cabin.visible=true;
 PX.i=i;PX.ext=false;PX.yaw0=window.__P.yaw;window.__P.pitch=.28;G.pax=PX;
 window.__P.g.visible=false;hud().style.display='block';
 G.notify('Welcome aboard flight '+(a.flight||'')+(a.dest?' — destination: '+a.dest:'')+'. Seat 12A. F talk to people · Q window view · C outside view · M leave at the gate')}
function leave(force){
 const a=T.planes[PX.i];
 if(!force&&a&&a.airborne){G.notify('Seatbelt sign is ON — you can leave once the plane is at the gate');return}
 if(!force&&a&&a.state!=='gate'&&a.spd>3){G.notify('Please remain seated until the plane stops at the gate');return}
 if(PX.cabin){PX.cabin.visible=false;PX.cabin.parent&&PX.cabin.parent.remove(PX.cabin)}
 const t=G.tp&&(G.tp['Airport Gates']||G.tp['International Airport'])||{x:-640,y:.1,z:-30,yaw:0};
 window.__P.teleport(t.x,t.y,t.z,t.yaw);window.__P.g.visible=true;G.pax=null;PX.i=-1;PX.hud&&(PX.hud.style.display='none');G.notify('Thank you for flying NEON AIR')}
G.togglePax=()=>{if(G.pax)leave(false);else board()};
document.addEventListener('keydown',e=>{if(!G.pax||e.repeat||G.modal)return;
 if(e.code==='KeyC'){PX.ext=!PX.ext;e.preventDefault()}
 else if(e.code==='KeyQ'){PX.win=!PX.win;G.notify(PX.win?'Looking out of the window — press Q to sit back':'Back in your seat')}
 else if(e.code==='KeyE'&&false){}
 else if(e.code==='KeyG'){const d=['an orange juice','a sparkling water','a hot coffee','a cola','a mint tea'][PX.dr=((PX.dr||0)+1)%5];G.notify('✈ Sofia brings you '+d+' and a warm towel. Enjoy your flight!')}
 else if(e.code==='KeyF'){const who=WHO[talkI%WHO.length];talkI++;const n=talkN[who]=(talkN[who]||0)+1,L=TALK[who];G.notify((who==='Sofia'?'✈ Sofia (flight attendant): ':'💬 '+who+': ')+L[(n-1)%L.length]);e.stopImmediatePropagation()}},true);
PX.k=0;
const q1=new THREE.Quaternion(),q2=new THREE.Quaternion(),e1=new THREE.Euler(0,0,0,'YXZ'),v3=new THREE.Vector3();
window.__MODS.push({update(dt,pp){
 if(!G.pax)return;const i=PX.i,a=T.planes[i],j=jets[i];
 if(!a||!j||j.dead){leave(true);return}
 const P=window.__P,cam=window.__cam;j.group.updateMatrixWorld(true);
 // keep player attached to plane (hidden), so world streaming follows
 v3.set(SEAT.x,SEAT.y,SEAT.z);j.group.localToWorld(v3);P.g.position.set(v3.x,v3.y-1.4,v3.z);P.vy=0;P.g.visible=false;
 if(PX.ext){v3.set(0,11,44);j.group.localToWorld(v3);cam.position.copy(v3);
  e1.set(-.12-(P.pitch-.28)*.6,(P.yaw-PX.yaw0)*.6,0);q1.setFromEuler(e1);q2.copy(j.group.quaternion);cam.quaternion.copy(q2).multiply(q1)}
 else{PX.k+=((PX.win?1:0)-PX.k)*Math.min(1,dt*4);cam.position.copy(v3.set(SEAT.x-.22*PX.k,SEAT.y-.05*PX.k,SEAT.z).applyMatrix4(j.group.matrixWorld));
  e1.set(-(P.pitch-.28)*(1-.5*PX.k)-.05*PX.k,(P.yaw-PX.yaw0)*(1-.7*PX.k)+1.45*PX.k,0);q1.setFromEuler(e1);cam.quaternion.copy(j.group.quaternion).multiply(q1)}
 {const st2=a.airborne?(a.y>250?'cruise':'climb'):a.state;if(PX.last!==st2){const L=PX.last;PX.last=st2;if(L!==undefined){
  if(st2==='climb')G.notify('🧑‍✈️ Captain: Cabin crew, take-off. Enjoy the view over the city!');
  else if(st2==='cruise')G.notify('🧑‍✈️ Captain: We have reached cruising altitude. Next stop: '+(a.dest||'your destination')+'. Press G for a drink from Sofia.');
  else if(a.state==='in1'||a.state==='in2')G.notify('🧑‍✈️ Captain: Fasten your seatbelts — we are preparing to land.');
  else if(a.state==='gate')G.notify('🧑‍✈️ Captain: Welcome! Thank you for flying NEON AIR. Press M to leave the plane.')}}}
 if(a.airborne&&!PX.ext){const tt=G.t||0,k2=Math.min(1,Math.max(0,(a.y-100)/200))*.004;cam.rotation.z+=Math.sin(tt*2.3)*k2;cam.rotation.x+=Math.sin(tt*3.1)*k2*.6}
 PX.hudT-=dt;if(PX.hudT<=0){PX.hudT=.4;const h=hud();const st=a.airborne?'IN FLIGHT':(a.state==='gate'?'AT GATE':'ON GROUND');
  h.textContent='✈ '+(a.flight||'NEON AIR')+(a.dest?' → '+a.dest:'')+'  ·  '+st+'  ·  ALT '+Math.max(0,Math.round(a.y))+' m  ·  '+Math.round((a.spd||0)*3.6)+' km/h  ·  F talk  ·  G drink  ·  Q window  ·  C outside  ·  M leave (at gate)'}
}});
}

// ================= PILOT MODE (E next to an airliner) =================
{
const PL={jet:null,t:0,hud:null,hudT:0,ex:0};G.pilotJet=null;
function plHud(){if(PL.hud)return PL.hud;const d=document.createElement('div');d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 16px;background:rgba(6,12,22,.78);color:#aef0c0;font:700 13px ui-monospace,Menlo,monospace;border:1px solid rgba(110,240,160,.45);border-radius:10px;z-index:30;pointer-events:none;display:none;white-space:nowrap';document.body.appendChild(d);return PL.hud=d}
function nearAirliner(){ensureVisuals();const pp=window.__P.g.position;let bi=-1,bd=60;
 for(let i=0;i<T.planes.length;i++){const a=T.planes[i];if(a.airborne)continue;const d=Math.hypot(a.x-pp.x,a.z-pp.z);if(d<bd&&Math.abs(a.y-pp.y)<8){bd=d;bi=i}}return bi}
function takeCommand(i){
 const a=T.planes[i],P=window.__P;
 const j=new Jet(A.RWX,715,0,0xf2f2ee,2.2,0,{airline:a.airline});j.label='NEON AIR '+a.flight;j.awake=true;j.owned=false;G.pilotJet=PL.jet=j;PL.ex=0;
 P.teleport(A.RWX,0,715,0);P.yaw=0;P.pitch=.28;P.enter(j);plHud().style.display='block';
 G.notify('🧑‍✈️ You are the CAPTAIN of '+a.flight+' to '+a.dest+'. Tower: runway 36 cleared for take-off. Hold SHIFT for throttle, rotate with S at ~'+Math.round(j.stall*1.2*3.6)+' km/h, V cockpit view, E to leave after landing.')}
document.addEventListener('keydown',e=>{if(e.code!=='KeyE'||e.repeat||G.modal||!G.started||G.active||G.pax||G.pendingBuy)return;
 const i=nearAirliner();if(i<0)return;
 const{v}=window.__nearestVehicle?window.__nearestVehicle(6):{v:null};if(v)return;
 e.stopImmediatePropagation();e.preventDefault();takeCommand(i)},true);
const q1=new THREE.Quaternion(),e1=new THREE.Euler(0,0,0,'YXZ'),v3=new THREE.Vector3();
window.__MODS.push({update(dt,pp){
 const j=PL.jet;if(!j)return;const P=window.__P,cam=window.__cam;
 if(j.dead){PL.jet=G.pilotJet=null;plHud().style.display='none';return}
 if(G.active!==j){ // player left the plane
  plHud().style.display='none';PL.ex+=dt;
  if(PL.ex>7){const t=G.tp['Airport Gates']||{x:-640,y:.1,z:-30,yaw:0};j.destroy();PL.jet=G.pilotJet=null;P.teleport(t.x,t.y,t.z,t.yaw);G.notify('Thank you, Captain! The aircraft has been towed to the hangar.')}return}
 // cockpit view
 if(P.fp){j.group.updateMatrixWorld(true);v3.set(0,4.1,-11.5).applyMatrix4(j.group.matrixWorld);cam.position.copy(v3);
  e1.set(-(P.pitch-.28),P.yaw-j.heading,0);q1.setFromEuler(e1);cam.quaternion.copy(j.group.quaternion).multiply(q1)}
 PL.hudT-=dt;if(PL.hudT<=0){PL.hudT=.2;const h=plHud(),alt=Math.max(0,Math.round(j.y-0)),kmh=Math.round((j.speed||0)*3.6),hd=Math.round((((-j.heading*180/Math.PI)%360)+360)%360);
  const warn=!j.onGround&&j.speed<j.stall?'  ⚠ STALL':'';
  h.textContent='CAPTAIN  ·  SPD '+kmh+' km/h  ·  ALT '+alt+' m  ·  HDG '+String(hd).padStart(3,'0')+'°  ·  THR '+Math.round((j.throttle||0)*100)+'%  ·  '+(j.onGround?'ON GROUND':'AIRBORNE')+warn+'  ·  V cockpit · E exit (landed)'}
}});
}

// ================= GPS ARROW TO THE AIRPORT =================
{const d=document.createElement('div');d.style.cssText='position:fixed;left:50%;top:150px;transform:translateX(-50%);display:none;align-items:center;gap:10px;padding:6px 14px;background:rgba(6,14,28,.72);color:#bfe8ff;font:700 13px system-ui,sans-serif;border:1px solid rgba(110,200,255,.45);border-radius:20px;z-index:25;pointer-events:none';
 d.innerHTML='<div id="gpsA" style="font-size:26px;line-height:1;transition:transform .1s">➤</div><div id="gpsT"></div>';document.body.appendChild(d);
 const arrow=d.querySelector('#gpsA'),txt=d.querySelector('#gpsT');G.gps=true;let on=true;
 document.addEventListener('keydown',e=>{if(e.code==='KeyK'&&G.started&&!G.modal&&!e.repeat){on=!on;G.notify(on?'✈ Airport GPS ON — follow the arrow (K to hide)':'Airport GPS hidden')}});
 const tx=-640,tz=-30;
 window.__MODS.push({update(dt,pp){const P=window.__P;if(!on||G.pax||!G.started){d.style.display='none';return}
  const dx=tx-pp.x,dz=tz-pp.z,dist=Math.hypot(dx,dz);if(dist<140){d.style.display='none';return}
  const cam=window.__cam;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);const ang=Math.atan2(-dx,-dz);let rel=ang-Math.atan2(-fx,-fz);while(rel>Math.PI)rel-=2*Math.PI;while(rel<-Math.PI)rel+=2*Math.PI;
  d.style.display='flex';arrow.style.transform='rotate('+(-rel*180/Math.PI-90)+'deg)';txt.textContent='✈ International Airport · '+(dist>1000?(dist/1000).toFixed(1)+' km':Math.round(dist)+' m')+'  (K hides)'}})}
