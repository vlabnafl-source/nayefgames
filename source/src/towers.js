import {THREE,G,C,CURB,TAU,clamp,shade} from './core.js';
import {Col,Inter,registerGen} from './world.js';
import {Frame,slab,sign,lampAt,PAL,toast} from './lib.js';
import {makeElevator} from './elevator.js';
import {People} from './peds.js';
import {payAny} from './shops.js';
const NEON=[0x00e5ff,0xff2bd6,0xb6ff3b,0xff8a1f,0x7a5cff];
function tower(ctx,cfg){const{cx,cz,sb}=ctx,own=ctx.owner,f=new Frame(ctx,'S',cx,cz+22),y0=CURB,LH=7;
 const tiers=cfg.tiers,top=cfg.top;
 // lobby base (v 0..42, u -22..22)
 f.floor(-22,0,22,42,y0+.02,0xe8e6e0);f.floor(-4,0,4,14,y0+.03,0x8a1f2a);
 f.wallU(0,-22,22,y0,y0+LH,.5,0x2b3a55,[{a:-3,b:3,k:'door',yb:y0,yt:y0+4},{a:-20.5,b:-5,k:'win',yb:y0+.4,yt:y0+LH-.8},{a:5,b:20.5,k:'win',yb:y0+.4,yt:y0+LH-.8}]);
 f.wallV(-22,0,42,y0,y0+LH,.5,0x2b3a55,[{a:6,b:36,k:'win',yb:y0+.4,yt:y0+LH-.8}]);f.wallV(22,0,42,y0,y0+LH,.5,0x2b3a55,[{a:6,b:36,k:'win',yb:y0+.4,yt:y0+LH-.8}]);f.wallU(42,-22,22,y0,y0+LH,.5,0x2b3a55);
 const sh=f.r(-1.7,8.6,1.7,12.0);const hole=[{x0:sh[0],z0:sh[1],x1:sh[2],z1:sh[3]}];
 const rr=f.r(-22.5,-.5,22.5,42.5);slab(ctx,rr[0],rr[1],rr[2],rr[3],y0+LH+.5,.5,0x1b2230,hole,{noSurf:true});
 Col.addZone(own,rr[0],rr[1],rr[2],rr[3],0,y0+LH);
 f.sign(cfg.name,0,y0+LH+1.6,-.3,16,2,'#06101f',cfg.fg||'#7df0ff');
 // lobby interior
 const y=y0+.02;f.fb(0,22,10,1.4,y,1.1,0x15161a);f.fb(0,22,10.2,1.5,y+1.1,.07,0xe8c36a,false);f.npc(-2,23.4,y,'work','suit',0,-1);f.npc(2,23.4,y,'work','suit',0,-1);
 for(const u of[-14,14]){f.fb(u,10,6,1.2,y,.5,0x2e3a5e);f.fb(u,10.8,6,.3,y+.5,.6,0x2e3a5e);f.fb(u,18,2,2,y,.5,0xe8e6e0);f.plant(u,26);f.plant(u*.6,34)}
 f.npc(-14,9.2,y,'sit',null,0,1);f.npc(14,9.2,y,'talk',null,1,0);f.npc(15,9.2,y,'talk','suit',-1,0);f.pace(-18,30,18,30,y,'suit');
 f.lamp(-10,y+6,12,0xfff0d8,300);f.lamp(10,y+6,12,0xfff0d8,300);f.lamp(0,y+6,28,0xfff0d8,300);
 // tower body tiers
 let yb=y0+LH+1;for(const t of tiers){const w=t.w,d=t.d,x0=cx-w/2,x1=cx+w/2,z1=cz+10,z0=z1-d;
  sb.bb('win',x0,yb,z0,x1,t.h,z1,cfg.hex,{su:1/3.6,sv:1/3.8,uo:(t.h%7)/3,top:'solid',rc:0x8a9099,ao:1});Col.addBox(own,x0,z0,x1,z1,yb,t.h);
  sb.bb('emisN',x0-.05,t.h-1.3,z0-.05,x1+.05,t.h-.6,z1+.05,cfg.neon,{ao:1,noBottom:true,top:'emisN'});yb=t.h}
 if(cfg.spire){const sx=cx,sz=cz+10-cfg.tiers[cfg.tiers.length-1].d/2;sb.cyl('metal',sx,yb,sz,1.2,.15,cfg.spire,0xd0d4da,8);sb.box('emisN',sx,yb+cfg.spire,sz,.5,.5,.5,0xff3030)}
 // elevator + decks
 const stops=[{y:y0,name:'Lobby'}];for(const d of cfg.decks)stops.push({y:d.y,name:d.name});
 makeElevator(ctx,{x0:sh[0],z0:sh[1],x1:sh[2],z1:sh[3],front:'S',stops,speed:cfg.speed,glass:true,name:cfg.elev});
 for(const d of cfg.decks){const dr=f.r(-14,-3,14,12),yy=d.y,dh=[{x0:sh[0],z0:sh[1],x1:sh[2],z1:sh[3]}];slab(ctx,dr[0],dr[1],dr[2],dr[3],yy,.5,0x2b2f36,dh);
  for(const q of[f.r(-14,-3,14,-2.9),f.r(-14,-3,-13.9,12),f.r(13.9,-3,14,12)]){sb.bb('glass',q[0],yy,q[1],q[2],yy+1.3,q[3],0xaad4ea,{ao:1,noBottom:true});Col.addBox(own,q[0],q[1],q[2],q[3],yy,yy+1.3);sb.bb('metal',q[0],yy+1.28,q[1],q[2],yy+1.34,q[3],0xcfd3d8,{ao:1})}
  f.floor(-14,-3,14,12,yy+.02,d.rest?0x9a7048:0xb5a88f);
  if(d.rest){// restaurant canopy + tables
   const ca=f.r(-14,-3,14,12);for(const p of[f.p(-13.5,-2.5),f.p(13.5,-2.5),f.p(-13.5,11.5),f.p(13.5,11.5)])sb.cyl('metal',p[0],yy,p[1],.15,.15,4.2,0xaab2bb,6);
   sb.bb('solid',ca[0],yy+4.2,ca[1],ca[2],yy+4.5,ca[3],0x1b2230,{ao:1,rc:0x3a4455});Col.addBox(own,ca[0],ca[1],ca[2],ca[3],yy+4.2,yy+4.5,{cam:true});
   for(let k=0;k<3;k++)for(let r=0;r<2;r++){const u=-9+k*8,v=r?8.2:2.5;f.fb(u,v,1.6,1.6,yy,.75,0xf2efe8);f.fb(u-1.2,v,.5,.5,yy,.5,0x2a2d33,false);f.fb(u+1.2,v,.5,.5,yy,.5,0x2a2d33,false);f.npc(u-1.2,v,yy+.5,'sit',null,1,0);if(k!==1||r)f.npc(u+1.2,v,yy+.5,'sit',null,-1,0)}
   f.fb(0,-1.6,10,.9,yy,1.1,0x15161a);f.lamp(-8,yy+4,5,0xffc977,260);f.lamp(8,yy+4,5,0xffc977,260);f.lamp(0,yy+4,9,0xffc977,200);f.npc(0,-2.6,yy,'work','chef',0,1);
   f.sign(d.sign||'SKY RESTAURANT',0,yy+5.4,-3,10,1.2,'#1a1209','#ffd28a');
   f.inter(0,yy,2,5,`F — ${d.sign||'Sky restaurant'}: fine dining ($120, +50 health)`,()=>{if(payAny(120)){G.health=Math.min(100,G.health+50);G.hud();toast('A table with a view of the whole city.')}})}
  else{f.fb(-8,-1.6,.7,.7,yy,1.5,0x2a2d33);f.fb(8,-1.6,.7,.7,yy,1.5,0x2a2d33);f.inter(-8,yy,-.6,3,'F — Look through the telescope',()=>toast(`You see the whole city from ${Math.round(yy)} m up.`));f.inter(8,yy,-.6,3,'F — Look through the telescope',()=>toast('Islands, bridges, the airport… all of it.'));f.npc(0,4,yy,'idle',null,0,-1);f.npc(-6,6,yy,'talk',null,1,0);f.npc(-5,6,yy,'talk',null,-1,0);f.lamp(0,yy+4,4,0xffe3b0,260)}
 }
 const zr=f.r(-22,0,22,42);
 G.pois.push({x:cx,z:cz+24,name:cfg.name,col:'#ff9ae6',big:true});G.tp[cfg.name]={x:cx,y:y0+.02,z:cz+16,yaw:Math.PI};}
registerGen(function towers(ctx){if(!ctx.city)return;const r=ctx.rnd;
 if(ctx.kind==='burj')tower(ctx,{name:'BURJ NEON',hex:0x8fb6d8,neon:0x00e5ff,speed:22,elev:'Burj Neon Elevator',spire:60,
  tiers:[{w:30,d:30,h:110},{w:26,d:26,h:190},{w:20,d:22,h:250},{w:14,d:16,h:300}],decks:[{y:150,name:'Level 40 — Sky Restaurant',rest:true,sign:'ATMOSPHERE SKY RESTAURANT'},{y:300.4,name:'Level 80 — Observation Deck'}]});
 else if(ctx.kind==='tower'){const names={'2,2':'AURORA TOWER','-2,2':'CRYSTAL TOWER','2,-2':'HELIX TOWER','-2,-2':'ZENITH TOWER'},H=[150,130,170,140][Math.abs(ctx.i+ctx.j*2)%4];
  tower(ctx,{name:names[ctx.key],hex:[0x7aa3c6,0x9fc2e0,0x86a8c2,0x6f93b3][Math.abs(ctx.i)%4],neon:NEON[Math.abs(ctx.i*3+ctx.j)%5],speed:14,elev:'Glass Elevator',spire:20,fg:'#ffd23f',
   tiers:[{w:28,d:28,h:H*.7},{w:22,d:24,h:H}],decks:[{y:H+.4,name:'Rooftop Restaurant & Lounge',rest:true,sign:'ROOFTOP LOUNGE'}]})}});
