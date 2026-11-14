import {THREE,G,C,CURB,TAU,clamp,shade,labelTex} from './core.js';
import {Col,Inter,registerGen,kinds} from './world.js';
import {Frame,slab,sign,lampAt,tree,PAL,toast,sideOf,payAny} from './lib.js';
import {People} from './peds.js';
import {Vehicle,spawnCar} from './vehicles.js';
import {DEFS} from './carmodels.js';
import {UI} from './ui.js';
G.ownedExtra=G.ownedExtra||[];G.extraCars=G.extraCars||[];
export {payAny};
G.payAny=payAny;
const MAP={shopsA:{S:'pizza',N:'coffee',E:'clothing',W:'electronics'},shopsB:{S:'restaurant',N:'supermarket',E:'pizza',W:'coffee'},fuel:{S:'workshop',N:'carwash',E:'gas'},bank:{S:'bank'},mall:{S:'mall'}};
const TYPES={
 pizza:{name:'PIZZA NAPOLI',color:0xc9573a,acc:0xe8e0cc,bg:'#7a1d12',fg:'#ffe8a8',floor:0xd9c9a8},coffee:{name:'BEAN & CLOUD COFFEE',color:0x7a5a3e,acc:0x3a2a1c,bg:'#2a1c12',fg:'#f3d9a8',floor:0x9a7a58},
 clothing:{name:'LUXE FASHION',color:0xd8d4cc,acc:0x15161a,bg:'#111',fg:'#ff9ae6',floor:0xe8e6e0},electronics:{name:'TECH WORLD',color:0x3a4a5e,acc:0x35a0ff,bg:'#06121f',fg:'#35e0ff',floor:0x2a2d33},
 restaurant:{name:'SKY GRILL RESTAURANT',color:0x8a6a48,acc:0x2a1c12,bg:'#1a1209',fg:'#ffd28a',floor:0x7a5a3a},supermarket:{name:'FRESH MART',color:0xe9efe9,acc:0x2e9b4a,bg:'#0a2a12',fg:'#9bff9b',floor:0xdcdcd4,w:24},
 workshop:{name:'AUTO WORKSHOP',color:0x8f9aa5,acc:0xf2c300,bg:'#1a1a1a',fg:'#ffd23f',floor:0x4a4d52,full:true},carwash:{name:'SPARKLE CAR WASH',color:0x7fb7d6,acc:0x2b6cb0,bg:'#06233a',fg:'#7df0ff',floor:0x4a4d52,full:true},
 gas:{name:'NEON FUEL',color:0xe9e9e4,acc:0xd6342a,bg:'#0a2a12',fg:'#fff',floor:0x6a6d72,w:18},bank:{name:'NEON NATIONAL BANK',color:0xd9d2c4,acc:0x1b3a6b,bg:'#0b1d38',fg:'#e8c36a',floor:0xe8e6e0,w:30,d:22,h:6},mall:{name:'NEON GALLERIA MALL',color:0xcfc8bc,acc:0x7a1fff,bg:'#1a0b33',fg:'#ff9ae6',floor:0xe8e6e0,w:50,d:34,h:9}};
function shell(ctx,side,fx,fz,type){const T=TYPES[type],w=T.w||20,d=T.d||16,h=T.h||4.6,hw=w/2,y0=CURB,y1=y0+h,f=new Frame(ctx,side,fx,fz),sb=ctx.sb;
 f.floor(-hw,0,hw,d,y0+.02,T.floor);
 const ops=T.full?[{a:-hw+1.2,b:hw-1.2,k:'door',yb:y0,yt:y0+3.8}]:[{a:-1.6,b:1.6,k:'door',yb:y0,yt:y0+2.9},{a:-hw+1.2,b:-3.2,k:'win',yb:y0+.5,yt:y1-1.2},{a:3.2,b:hw-1.2,k:'win',yb:y0+.5,yt:y1-1.2}];
 f.wallU(0,-hw,hw,y0,y1,.4,T.color,ops);f.wallV(-hw,0,d,y0,y1,.4,T.color);f.wallV(hw,0,d,y0,y1,.4,T.color);f.wallU(d,-hw,hw,y0,y1,.4,T.color);
 const r=f.r(-hw-.2,-.2,hw+.2,d+.2);sb.bb('solid',r[0],y1,r[1],r[2],y1+.5,r[3],shade(T.color,.75),{ao:1,rc:0x55575b});Col.addBox(ctx.owner,r[0],r[1],r[2],r[3],y1,y1+.5,{cam:true});
 f.box('solid',-hw-.2,-1.5,hw+.2,0,y1-1.1,y1-.8,T.acc,false);
 f.sign(T.name,0,y1+1.0,-.1,Math.min(w-2,13),1.5,T.bg,T.fg);
 const zr=f.r(-hw,0,hw,d),zn=Col.addZone(ctx.owner,zr[0],zr[1],zr[2],zr[3],0,y1);
 if(type!=='bank'){const o7=f.p(0,-7),ov={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[side];zn.shop=type;zn.name=T.name;zn.out={x:o7[0],z:o7[1],h:Math.atan2(-ov[0],-ov[1])}}
 f.lamp(-hw/2,y1-.5,d/2,0xfff0d8,230);f.lamp(hw/2,y1-.5,d/2,0xfff0d8,230);
 const dp=f.p(0,-5.5),ip=f.p(0,3);return{f,y:y0+.02,w,d,h,hw,dp,ip}}
function reg(ctx,side,i,j,s){const dp=s.dp,ip=s.ip;People.addDoor(ctx.owner,i,j,side,dp[0],dp[1],ip[0],ip[1])}
function counter(f,y,u,v,w,col=0x3a2a1c){f.fb(u,v,w,1,y,1.05,col);f.fb(u,v,w+.1,1.1,y+1.05,.07,0xe8e6e0,false)}
function chair(f,y,u,v,c=0x3a3f48){f.fb(u,v,.5,.5,y+.42,.07,c,false);f.fb(u,v,.1,.1,y,.42,0x222,false)}
function tbl(f,y,u,v,w,d,c=0x6b4a2e){f.fb(u,v,w,d,y+.7,.07,c);f.fb(u,v,.15,.15,y,.7,0x3a2a1c,false)}
const heal=(n,cost,msg)=>()=>{if(payAny(cost)){G.health=Math.min(100,G.health+n);G.hud();toast(msg)}};
function interior(ctx,type,s,side,i,j){const{f,y,hw,d}=s;
 const cust=(n,anims=['idle','talk','idle'],outf=null)=>{for(let k=0;k<n;k++)f.npc(-hw+3+((k*7.3)%(2*hw-6)),5+(k*3.7)%(d-8),y,anims[k%anims.length],outf,(k%2?1:-1),0)};
 if(type==='pizza'){counter(f,y,0,10,12,0x8a2a1a);f.fb(0,14.5,10,1.6,y,2.4,0xa8452c);f.fb(0,14.5,3,.2,y+.8,.8,0xff7a1a,false,'emisN');for(const u of[-6,-2,2,6]){tbl(f,y,u,5,1.5,1.5,0xe8e0cc);chair(f,y,u,3.9);chair(f,y,u,6.1)}
  f.npc(-3,11.8,y,'work','chef',0,-1);f.npc(3,11.8,y,'work','staff',0,-1);cust(4,['idle','talk'],null);f.inter(0,y,8.6,3.6,'F — Order a pizza ($18, +25 health)',heal(25,18,'Margherita! Delicious.'))}
 else if(type==='coffee'){counter(f,y,-3,11,10,0x3a2a1c);f.fb(-3,11.2,.8,.5,y+1.12,.6,0x9aa0a8,false);for(const u of[-7,0,6]){tbl(f,y,u,4.5,1.2,1.2,0x2a1c12);chair(f,y,u-.9,4.5,0x7a5a3e);chair(f,y,u+.9,4.5,0x7a5a3e)}f.fb(8,12,3,1.2,y,1.1,0x7a5a3e);
  f.npc(-3,12.4,y,'work','staff',0,-1);cust(3,['idle','talk']);f.inter(-3,y,9.4,3.6,'F — Buy a coffee ($6, +8 health)',heal(8,6,'Smooth latte.'))}
 else if(type==='clothing'){for(let k=0;k<4;k++){f.fb(-7+k*4.6,6,.2,3,y,1.6,0x9aa0a8);f.fb(-7+k*4.6,6,.5,2.8,y+1.2,.8,[0x2e3a5e,0xb02a2a,0xe8d9b0,0x3a8a5a][k],false)}counter(f,y,6,13,6,0x15161a);f.fb(-8,14.7,2,.1,y,2.4,0xaad4ea,false,'glass');f.fb(8,14.7,2,.1,y,2.4,0xaad4ea,false,'glass');
  for(const u of[-8,0,8])f.fb(u,15.5,3,.5,y,2.2,0xe8e6e0);f.npc(6,14.3,y,'work','staff',0,-1);cust(3);f.inter(-1,y,9,4,'F — Buy a new designer outfit ($150)',()=>{if(payAny(150)){G.outfit=((G.outfit||0)+1)%6;import('./player.js').then(m=>m.P.setOutfit(G.outfit));toast('Looking sharp!')}})}
 else if(type==='electronics'){for(let k=0;k<4;k++){f.fb(-8+k*5.2,14.4,3.6,.5,y,2.4,0x15161a);for(let q=0;q<3;q++)f.fb(-9.2+k*5.2+q*1.2,14.1,1,.05,y+.9+q*.25,.55,[0x35a0ff,0xff3df0,0x35ffa0][q],false,'emis')}for(const u of[-6,0,6])f.fb(u,7,3,1,y,1,0x2a2d33);for(const u of[-6,0,6])f.fb(u,7,2.6,.06,y+1.0,.5,0x35e0ff,false,'emis');
  counter(f,y,0,12,6,0x15161a);f.npc(0,13.2,y,'work','staff',0,-1);cust(3);f.inter(0,y,10,4,'F — Buy the newest smartphone ($999)',()=>{if(payAny(999)){G.items=(G.items||[]);G.items.push('phone');toast('Phone purchased. Enjoy!')}})}
 else if(type==='restaurant'){for(let r=0;r<2;r++)for(let c=0;c<4;c++){const u=-7.5+c*5,v=4+r*4.5;tbl(f,y,u,v,1.8,1.2,0xf2efe8);chair(f,y,u,v-1.1,0x5a2a1a);chair(f,y,u,v+1.1,0x5a2a1a)}f.fb(0,15,18,1.2,y,1.1,0x2a2d33);f.fb(0,15.2,17,1,y+1.1,1.6,0x9aa0a8);
  f.npc(-4,13.8,y,'work','chef',0,-1);f.npc(4,13.8,y,'work','chef',0,-1);f.npc(-7.5,3.0,y,'sit',null,0,1);f.npc(-7.5,5.2,y,'sit',null,0,-1);f.npc(2.5,6.6,y,'sit',null,0,1);f.npc(2.5,8.8,y,'sit',null,0,-1);f.pace(-9,10,9,10,y,'suit');
  f.inter(0,y,11.5,6,'F — Eat a gourmet meal ($65, +40 health)',heal(40,65,'A fantastic meal.'))}
 else if(type==='supermarket'){for(let k=0;k<5;k++){f.fb(-9+k*4.5,8,.8,9,y,2,[0xe8d9b0,0xd96a2b,0x7bd389,0x8ab4f0,0xff7a8a][k]);f.fb(-9+k*4.5,8,.82,9,y+2,.06,0xffffff,false)}counter(f,y,-6,2.8,3,0x2a2d33);counter(f,y,2,2.8,3,0x2a2d33);counter(f,y,10,2.8,3,0x2a2d33);
  f.npc(-6,1.6,y,'work','staff',0,1);f.npc(2,1.6,y,'work','staff',0,1);cust(5,['idle','idle','talk']);f.pace(-10,12,10,12,y,null);f.inter(2,y,5,5,'F — Buy groceries ($45, +15 health)',heal(15,45,'Stocked up on fresh food.'))}
 else if(type==='workshop'){for(const u of[-5.5,5.5]){f.fb(u,8,3.6,6.4,y,.25,0x6a6e74,false);f.fb(u-1.7,8,.3,.3,y,2.8,0xc0392b);f.fb(u+1.7,8,.3,.3,y,2.8,0xc0392b)}f.fb(-9.3,10,.8,10,y,1.0,0x3b4350);f.fb(9.3,10,.8,10,y,1.0,0x3b4350);for(let k=0;k<3;k++)f.fb(-6+k*2.2,15,1.6,.8,y,1.5,0xc0392b);f.fb(6,14.6,3,1,y,2.2,0x1b1d22);f.fb(8.5,14.6,2,.9,y,.6,0x15161a);
  f.npc(-8,12,y,'work','staff',0,-1);f.npc(8,11,y,'work','staff',0,-1);
  Inter.add(ctx.owner,{...ipos(f,0,8),r:9,needVeh:true,text:()=>{const v=G.active;if(!v||!v.repair)return null;const c=Math.round((100-v.health)*7)+(v.wrecked?500:0);return c<=0?'Workshop: your vehicle is in perfect shape':`F — Repair vehicle ($${c})`},act:()=>{const v=G.active;const c=Math.round((100-v.health)*7)+(v.wrecked?500:0);if(c>0&&payAny(c)){v.repair();toast('Vehicle fully repaired.')}}})}
 else if(type==='carwash'){for(const u of[-3,3])for(const v of[6,10]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,3,10),new THREE.MeshStandardMaterial({color:0x2b6cb0}));const p=f.p(u,v);m.position.set(p[0],CURB+1.8,p[1]);ctx.add(m);(ctx.spin||(ctx.spin=[])).push(m)}
  f.fb(-7.5,8,.6,12,y,3.2,0x2b6cb0);f.fb(7.5,8,.6,12,y,3.2,0x2b6cb0);f.box('emisN',-4,7,4,9,y+3.3,y+3.4,0x7df0ff,false);
  Inter.add(ctx.owner,{...ipos(f,0,5),r:9,needVeh:true,text:'F — Wash & polish vehicle ($15)',act:()=>{const v=G.active;if(v&&payAny(15)){v.health=Math.min(100,v.health+10);toast('Squeaky clean! +10 vehicle health.')}}})}
 else if(type==='bank'){counter(f,y,0,16,22,0x1b3a6b);for(const u of[-8,0,8]){f.fb(u,17.4,.8,.05,y+1.2,.5,0x35a0ff,false,'emis');f.npc(u,17.4,y,'work','suit',0,-1)}f.fb(0,21,8,.8,y,3.4,0x9aa0a8);f.fb(0,21.1,6,.4,y+1.2,1.4,0xd5a94f,false);
  for(const u of[-12,-9.5,9.5,12]){f.fb(u,2,.9,.7,y,2,0x2a3340);f.fb(u,2.38,.6,.05,y+1.2,.5,0x35e0ff,false,'emis');f.inter(u,y,3.2,2.6,'F — Use ATM',()=>G.openATM())}
  f.inter(0,y,13.5,5,'F — Open the teller window (deposit / withdraw)',()=>G.openATM());for(let k=0;k<3;k++)chair(f,y,-7+k*7,7,0x1b3a6b);f.fb(-12,9,3,1,y,.5,0x1b3a6b);f.npc(-3,9,y,'idle',null,0,1);f.npc(7,8,y,'talk',null,1,0);f.npc(8,8,y,'talk',null,-1,0);f.npc(-13,13,y,'idle','cop',0,-1)}
 else if(type==='mall'){for(let k=0;k<6;k++){const u=-21+k*8.4;f.fb(u,4,6.4,.4,y,3.2,[0xff9ae6,0x7a1fff,0x35e0ff,0xffd23f,0x7bd389,0xff6a00][k]);f.fb(u,3.8,5.6,.06,y+.5,2.2,0x08101e,false,'emis')}
  for(const u of[-21,-12.6,12.6,21])f.fb(u,30,6.4,.4,y,3.2,[0x2e3a5e,0xb02a2a,0xe8d9b0,0x3a8a5a][Math.abs(u)%4|0]);
  const pc=f.p(0,17);ctx.sb.cyl('solid',pc[0],y,pc[1],4.5,4.5,.6,0xe8e6e0,22);ctx.sb.cyl('glass',pc[0],y+.58,pc[1],4.2,4.2,.02,0x35c0e8,22);Col.box(ctx.owner,pc[0],y+.3,pc[1],9,.6,9);f.plant(-8,17);f.plant(8,17);f.plant(-8,10);f.plant(8,10);
  for(let k=0;k<4;k++){f.fb(-15+k*10,17,2,.6,y,.5,0x6b4a2e);f.npc(-15+k*10,17.6,y,'sit',null,0,-1)}cust(8,['idle','talk','idle']);f.pace(-22,22,22,22,y,null);f.pace(22,12,-22,12,y,null);
  f.lamp(0,y+8,17,0xfff0d8,300);f.lamp(-16,y+8,17,0xfff0d8,260);f.lamp(16,y+8,17,0xfff0d8,260);f.lamp(0,y+8,26,0xfff0d8,260);
  f.sign('GOLD WATCH  $18,500',-12.6,3.2,5.6,5,.8,'#1a0b33','#ffd23f');f.sign('SHOPPING SPREE  $2,500',12.6,3.2,5.6,5.6,.8,'#1a0b33','#ff9ae6');
  f.inter(-12.6,y,6.4,4,'F — Luxury boutique: buy a gold watch ($18,500)',()=>{if(payAny(18500)){G.items=(G.items||[]);G.items.push('watch');toast('Gold watch purchased. Very luxurious.')}});
  f.inter(12.6,y,6.4,4,'F — Designer shopping spree ($2,500)',()=>{if(payAny(2500)){G.health=100;G.hud();toast('Retail therapy complete — health restored!')}})}
}
const ipos=(f,u,v)=>{const p=f.p(u,v);return{x:p[0],y:CURB,z:p[1]}};
function gas(ctx,side,fx,fz,i,j){const T=TYPES.gas,f=new Frame(ctx,side,fx,fz),sb=ctx.sb,y=CURB;
 const cu=f.p(0,9);sb.bb('solid',...[f.r(-12,3,12,15)].map(r=>r[0]),y+4.9,f.r(-12,3,12,15)[1],f.r(-12,3,12,15)[2],y+5.5,f.r(-12,3,12,15)[3],0xe9e9e4,{ao:1,rc:0xd6342a});
 for(const[u,v]of[[-10,5],[10,5],[-10,13],[10,13]]){const p=f.p(u,v);sb.cyl('solid',p[0],y,p[1],.4,.4,5,0xd6342a,8);Col.box(ctx.owner,p[0],y+2.5,p[1],.8,5,.8)}
 const r2=f.r(-12,3,12,15);Col.addBox(ctx.owner,r2[0],r2[1],r2[2],r2[3],y+4.9,y+5.5,{cam:true});sb.bb('emisN',r2[0],y+4.85,r2[1],r2[2],y+4.9,r2[3],0xffffff,{ao:1,noBottom:true});
 for(const u of[-5,5])for(const v of[6.5,11.5]){f.fb(u,v,.7,1.1,y,1.5,0xd6342a);f.fb(u,v,.5,.5,y+1.5,.6,0x35ff9a,false,'emis');
  const p=f.p(u,v);Inter.add(ctx.owner,{x:p[0],y:CURB,z:p[1],r:5,needVeh:true,text:()=>{const v2=G.active;return v2&&v2.fuel!=null?(v2.fuel>=99?'Tank is full':`F — Refuel / recharge ($${Math.ceil((100-v2.fuel)*.9)})`):null},act:()=>{const v2=G.active,c=Math.ceil((100-v2.fuel)*.9);if(c>0&&payAny(c)){v2.fuel=100;toast('Refueled.')}}})}
 // kiosk shop
 f.wallU(17,-5,5,y,y+3.6,.3,0xe9e9e4,[{a:-1.5,b:1.5,k:'door'},{a:-4.5,b:-2.2,k:'win'},{a:2.2,b:4.5,k:'win'}]);f.wallU(23,-5,5,y,y+3.6,.3,0xe9e9e4);f.wallV(-5,17,23,y,y+3.6,.3,0xe9e9e4);f.wallV(5,17,23,y,y+3.6,.3,0xe9e9e4);
 const rr=f.r(-5.2,16.8,5.2,23.2);sb.bb('solid',rr[0],y+3.6,rr[1],rr[2],y+4.0,rr[3],0xd6342a,{ao:1});f.floor(-5,17,5,23,y+.02,0xdcdcd4);f.counter=0;f.fb(0,20.8,4,.9,y,1.1,0x2a2d33);f.npc(0,21.8,y,'work','staff',0,-1);f.lamp(0,y+3.3,20,0xfff0d8,220);
 f.inter(0,y,19,3.5,'F — Buy a snack ($8)',heal(5,8,'Chips!'));f.sign(T.name,0,y+5.9,3,10,1.4,T.bg,T.fg);{const zn=Col.addZone(ctx.owner,rr[0],rr[1],rr[2],rr[3],0,y+3.6),o9=f.p(0,9),ov={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[side];zn.shop='kiosk';zn.name='NEON FUEL SHOP';zn.out={x:o9[0],z:o9[1],h:Math.atan2(-ov[0],-ov[1])}}
 const dp=f.p(0,-5.5);People.addDoor(ctx.owner,i,j,side,dp[0],dp[1],f.p(0,19)[0],f.p(0,19)[1]);
 G.pois.push({x:fx,z:fz,name:'Gas station',col:'#ffb04a'})}
const SHOW={lamborghini:{name:'LAMBORGHINI SHOWROOM',bg:'#111',fg:'#f2c200',cars:[['lamborghini',0xf2c200],['lamborghini',0x2ea84a],['lamborghini',0xff6a00]]},ferrari:{name:'FERRARI SHOWROOM',bg:'#1a0505',fg:'#ffd23f',cars:[['ferrari',0xd40000],['ferrari',0xf2c200],['ferrari',0x111111]]},bugatti:{name:'BUGATTI SHOWROOM',bg:'#050b1a',fg:'#7da8ff',cars:[['bugatti',0x143a8f],['bugatti',0x111111],['bugatti',0xe8e8e8]]},rolls:{name:'ROLLS-ROYCE MOTOR CARS',bg:'#0b0b0d',fg:'#e8e8ea',cars:[['rolls',0x16181d],['rolls',0xf3f0e8],['rolls',0x6a1f2e]]}};
function showroom(ctx,side,fx,fz,brand){const S=SHOW[brand],w=24,d=18,h=5.6,hw=12,y0=CURB,y1=y0+h,f=new Frame(ctx,side,fx,fz),sb=ctx.sb,own=ctx.owner;
 f.floor(-hw,0,hw,d,y0+.02,0xe8e6e0);f.floor(-9,2,9,15,y0+.03,0x15161a);
 f.wallU(0,-hw,hw,y0,y1,.4,0x1b1d22,[{a:-2.5,b:2.5,k:'door',yb:y0,yt:y0+3},{a:-hw+.8,b:-2.8,k:'win',yb:y0+.3,yt:y1-.6},{a:2.8,b:hw-.8,k:'win',yb:y0+.3,yt:y1-.6}]);
 f.wallV(-hw,0,d,y0,y1,.4,0xcfd3d8);f.wallV(hw,0,d,y0,y1,.4,0xcfd3d8);f.wallU(d,-hw,hw,y0,y1,.4,0xcfd3d8);
 const r=f.r(-hw-.3,-.3,hw+.3,d+.3);sb.bb('solid',r[0],y1,r[1],r[2],y1+.5,r[3],0x15161a,{ao:1,rc:0x55575b});Col.addBox(own,r[0],r[1],r[2],r[3],y1,y1+.5,{cam:true});
 f.sign(S.name,0,y1+1.1,-.1,15,1.8,S.bg,S.fg);const zr=f.r(-hw,0,hw,d),zn=Col.addZone(own,zr[0],zr[1],zr[2],zr[3],0,y1);{const o9=f.p(0,-9),ov={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[side];zn.shop='showroom';zn.name=S.name;zn.out={x:o9[0],z:o9[1],h:Math.atan2(-ov[0],-ov[1])}}
 for(const[u,v]of[[-8,6],[0,9],[8,6]]){f.lamp(u,y1-.4,v,0xffffff,260)}
 const out={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[side],head=Math.atan2(-out[0],-out[1]);
 S.cars.forEach(([k,col],n)=>{const[u,v]=[[-7.5,8],[0,10],[7.5,8]][n],p=f.p(u,v);const pod=sb.cyl('solid',p[0],y0,p[1],2.8,2.8,.3,0x2a2d33,20);sb.cyl('emisN',p[0],y0+.3,p[1],2.8,2.8,.01,0x35e0ff,20);
  const tg=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex(DEFS[k].name.split(' ')[0]+'  $'+DEFS[k].price.toLocaleString(),'#0b0b0d','#ffd23f',512,128),depthWrite:false}));tg.scale.set(4.2,1.05,1);tg.position.set(p[0],y0+DEFS[k].roof+1.5,p[1]);ctx.add(tg);
  const car=new Vehicle(DEFS[k],col,p[0],p[1],head+Math.PI*.2*(n-1),y0+.3);car.locked=true;car.awake=false;car.display=true;car.group.position.y=y0+.3;
  ctx.cleanup.push(()=>car.destroy());
  f.inter(u,y0,v,4.3,`F — Buy ${DEFS[k].name} — $${DEFS[k].price.toLocaleString()}`,()=>buyCar(k,col,f,side))});
 f.npc(-10,3,y0,'idle','suit',1,1);f.npc(10,13,y0,'talk','suit',-1,0);f.npc(9,13.9,y0,'talk',null,-1,0);
 return{dp:f.p(0,-5.5),ip:f.p(0,3)}}
function buyCar(k,col,f,side){const d=DEFS[k];if(!payAny(d.price))return;const p=f.p(0,-9),out={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[side],head=Math.atan2(-out[0],-out[1]);
 const v=new Vehicle(d,col,p[0],p[1],head);v.owned=true;v.fromShowroom=true;v.home={x:-22,z:12,h:Math.PI};G.extraCars.push(v);G.ownedExtra.push({k,col});G.owned.push(k);G.hud();UI.splash('CONGRATULATIONS','#ffd23f',1800);toast(`You bought the ${d.name}! It is parked outside — and listed in your garage.`)}
G.onReady.push(()=>{(G.ownedExtra||[]).slice().forEach((e,n)=>{if(!DEFS[e.k])return;const v=new Vehicle(DEFS[e.k],e.col,-14+(n%5)*4.4,14+Math.floor(n/5)*7,Math.PI);v.owned=true;v.fromShowroom=true;v.awake=false;v.home={x:-22,z:12,h:Math.PI};G.extraCars.push(v)})});
registerGen(function shopGen(ctx){if(!ctx.city||!ctx.kind)return;const kind=ctx.kind,{i,j,cx,cz}=ctx;
 if(kind==='luxrow'){const sides=sideOf(i,j),br=['lamborghini','ferrari','bugatti','rolls'];
  sides.forEach(([s,fx,fz],n)=>{const o=showroom(ctx,s,fx,fz,br[n]);People.addDoor(ctx.owner,i,j,s,o.dp[0],o.dp[1],o.ip[0],o.ip[1])});
  // plaza
  ctx.sb.cyl('solid',cx,CURB,cz,3,3,.5,0xd9d4c8,16);ctx.sb.cyl('emisN',cx,CURB+.5,cz,2.7,2.7,.02,0x37e8ff,16);tree(ctx.sb,cx+6,cz+6,.8,CURB);tree(ctx.sb,cx-6,cz-6,.8,CURB);
  G.pois.push({x:cx,z:cz,name:'Supercar Row',col:'#ff4b5c',big:true});G.tp['Supercar Showrooms']={x:cx,y:CURB,z:cz-14,yaw:0};return}
 const m=MAP[kind];if(!m)return;
 for(const[s,fx,fz]of sideOf(i,j)){const type=m[s];if(!type)continue;
  if(type==='gas'){gas(ctx,s,fx,fz,i,j);continue}
  const T=TYPES[type];const sh=shell(ctx,s,fx,fz,type);interior(ctx,type,sh,s,i,j);reg(ctx,s,i,j,sh)}
 // plaza ATM kiosk + trees
 const sb=ctx.sb,k=kind;sb.bb('metal',cx-.5,CURB,cz-.35,cx+.5,CURB+2,cz+.35,0x2a3340,{ao:1});sb.bb('emis',cx-.35,CURB+1.1,cz+.35,cx+.35,CURB+1.7,cz+.37,0x35e0ff,{ao:1});Col.addBox(ctx.owner,cx-.5,cz-.35,cx+.5,cz+.35,CURB,CURB+2);
 Inter.add(ctx.owner,{x:cx,y:CURB,z:cz+1,r:3,text:'F — Use ATM',act:()=>G.openATM()});
 for(const[dx,dz]of[[8,8],[-8,8],[8,-8],[-8,-8]])tree(sb,cx+dx,cz+dz,.7,CURB);
 for(const[s,fx,fz]of sideOf(i,j)){const type=m[s];if(type&&TYPES[type]){const n=TYPES[type].name;G.pois.push({x:fx,z:fz,name:n,col:type==='bank'?'#4aa3ff':type==='mall'?'#ff9ae6':'#ffd45a'})}}
 if(kind==='bank')G.tp['Bank']={x:cx,y:CURB,z:cz+22,yaw:Math.PI};if(kind==='mall')G.tp['Mall']={x:cx,y:CURB,z:cz+22,yaw:Math.PI};if(kind==='shopsA')G.tp['High Street']={x:cx,y:CURB,z:cz,yaw:0};if(kind==='fuel')G.tp['Gas / Workshop']={x:cx,y:CURB,z:cz,yaw:0}});
G.tp['Mansion']={x:12,y:.12,z:-10,yaw:Math.PI};G.tp['Garage']={x:-22,y:.12,z:-8,yaw:Math.PI};G.tp['Mansion Roof']={x:8,y:24.1,z:-14,yaw:Math.PI};
