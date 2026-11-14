import {THREE,scene,camera,G,C,M,CURB,SEA,TAU,clamp,lerp,mulberry32,hash2,shade,PITCH} from './core.js';
import {Col,Inter,registerGen,ISLANDS,coastX,terrainH,groundH,islandT} from './world.js';
import {Frame,slab,sign,lampAt,tree,palm,toast} from './lib.js';
import {People} from './peds.js';
import {Lamps} from './sky.js';
import {payAny} from './shops.js';
import {Boat,Jet,Heli} from './aircraft.js';
import {UI} from './ui.js';
const V3=THREE.Vector3;
// ---------- ocean ----------
const wmat=new THREE.ShaderMaterial({transparent:true,fog:false,uniforms:{t:{value:0},sunDir:{value:new V3(0,1,0)},deep:{value:new THREE.Color(0x0a3a58)},shallow:{value:new THREE.Color(0x2fa7b8)},skyC:{value:new THREE.Color(0x9ec6ea)},fogC:{value:new THREE.Color(0x9bbbd0)},fogN:{value:90},fogF:{value:720},day:{value:1}},
 vertexShader:'uniform float t;varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.);float h=sin(w.x*.05+t*.9)*.2+sin(w.z*.07+t*1.2)*.16+sin((w.x+w.z)*.11+t*1.7)*.08;w.y+=h;vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
 fragmentShader:`uniform float t,fogN,fogF,day;uniform vec3 sunDir,deep,shallow,skyC,fogC;varying vec3 vW;varying float vD;
 void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;vec3 n=normalize(vec3(sin(p.x*.4+t*1.3)*.09+sin(p.y*.9+t*2.)*.05,1.,sin(p.y*.35+t*1.1)*.09+sin(p.x*.8-t*1.7)*.05));
  float f=pow(1.-max(dot(n,V),0.),3.);vec3 col=mix(mix(shallow,deep,.55),skyC,f*.85);vec3 R=reflect(-V,n);float sp=pow(max(dot(R,sunDir),0.),220.)*3.*day;col+=vec3(1.,.95,.8)*sp;
  col*=.18+.82*day;float fg=clamp((vD-fogN)/(fogF-fogN),0.,1.);col=mix(col,fogC,fg);gl_FragColor=vec4(col,mix(.62,.97,f)*(1.-fg*.0));}`});
export const ocean=new THREE.Mesh(new THREE.PlaneGeometry(2300,2900,190,240),wmat);ocean.rotation.x=-Math.PI/2;ocean.position.set(1590,SEA,0);ocean.renderOrder=1;ocean.frustumCulled=false;scene.add(ocean);
window.__MODS=window.__MODS||[];window.__MODS.push({update(){}});
G.updateOcean=()=>{const pz=G.player?G.player.g.position.z:0;ocean.position.z=Math.round(pz/12.0833)*12.0833;wmat.uniforms.t.value=G.t;wmat.uniforms.sunDir.value.copy(G.sunDir||new V3(0,1,0));wmat.uniforms.day.value=G.daylight;wmat.uniforms.fogC.value.copy(scene.fog.color);wmat.uniforms.skyC.value.copy(scene.background).lerp(new THREE.Color(.1,.15,.3),0);wmat.uniforms.fogN.value=scene.fog.near;wmat.uniforms.fogF.value=scene.fog.far};
// ---------- helpers ----------
const fl=(ctx,key,x0,z0,x1,z1,y,col)=>{const r=ctx.clip(x0,z0,x1,z1);if(r)ctx.sb.flat(key,r[0],r[1],r[2],r[3],y,col)};
const bxc=(ctx,key,x0,y0,z0,x1,y1,z1,col,solid=false,o)=>{const r=ctx.clip(x0,z0,x1,z1);if(!r)return;ctx.sb.bb(key,r[0],y0,r[1],r[2],y1,r[3],col,{ao:1,...o});if(solid)Col.addBox(ctx.owner,r[0],r[1],r[2],r[3],y0,y1)};
export function road(ctx,ax,az,bx,bz,w,y=.03){const x0=Math.min(ax,bx),x1=Math.max(ax,bx),z0=Math.min(az,bz),z1=Math.max(az,bz),hz=w/2,alongX=Math.abs(bx-ax)>=Math.abs(bz-az);
 if(alongX){fl(ctx,'ground',x0,az-hz,x1,az+hz,y,0x34373c);fl(ctx,'ground',x0,az-hz,x1,az-hz+.25,y+.005,0xe6e6de);fl(ctx,'ground',x0,az+hz-.25,x1,az+hz,y+.005,0xe6e6de);for(let x=Math.ceil(x0/12)*12;x<x1;x+=12)bxc(ctx,'solid',x,y,az-.1,x+5,y+.03,az+.1,0xe6c84a);
  for(let x=Math.ceil(x0/40)*40;x<x1;x+=40){const r=ctx.clip(x,az-hz-1.5,x+1,az-hz-.5);if(r){ctx.sb.cyl('metal',x,0,az-hz-1,.1,.14,7,0x3a3f46,6);ctx.sb.box('emisN',x,7,az-hz-1,.6,.12,.6,0xffe3b0);Lamps.add(ctx.owner,x,6.8,az-hz-1,0xffd9a0,300)}}}
 else{fl(ctx,'ground',ax-hz,z0,ax+hz,z1,y,0x34373c);fl(ctx,'ground',ax-hz,z0,ax-hz+.25,z1,y+.005,0xe6e6de);fl(ctx,'ground',ax+hz-.25,z0,ax+hz,z1,y+.005,0xe6e6de);for(let z=Math.ceil(z0/12)*12;z<z1;z+=12)bxc(ctx,'solid',ax-.1,y,z,ax+.1,y+.03,z+5,0xe6c84a);
  for(let z=Math.ceil(z0/40)*40;z<z1;z+=40){const r=ctx.clip(ax+hz+.5,z,ax+hz+1.5,z+1);if(r){ctx.sb.cyl('metal',ax+hz+1,0,z,.1,.14,7,0x3a3f46,6);ctx.sb.box('emisN',ax+hz+1,7,z,.6,.12,.6,0xffe3b0);Lamps.add(ctx.owner,ax+hz+1,6.8,z,0xffd9a0,300)}}}}
function cable(sb,a,b,r,col){const d=new V3().subVectors(b,a),len=d.length(),mid=new V3().addVectors(a,b).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new V3(0,1,0),d.clone().normalize());sb.addGeo('metal',new THREE.CylinderGeometry(r,r,len,5),new THREE.Matrix4().compose(mid,q,new V3(1,1,1)),col)}
// ---------- bridges ----------
export const BRIDGES=[{n:'Harbor Bridge',ax:'x',c:45,a:540,b:765,w:15,h:15,tw:true},{n:'Island Link',ax:'x',c:120,a:975,b:1150,w:14,h:9,tw:true},{n:'North Causeway',ax:'z',c:870,a:-5,b:-245,w:14,h:9,tw:false},{n:'South Causeway',ax:'z',c:875,a:245,b:400,w:14,h:8,tw:false}];
const OV={ax:'x',c:45,a:405,b:540,w:15,prof:t=>{const x=405+t*135;return x<435?(x-405)/30*7.6:x<495?7.6:x<525?(525-x)/30*7.6:0}};
function deckPieces(ctx,B,prof,len,tw){const sb=ctx.sb,own=ctx.owner,step=6,n=Math.ceil(len/step),dir=B.b>B.a?1:-1;
 for(let k=0;k<n;k++){const t0=k*step,t1=Math.min(len,(k+1)*step),y0=prof(t0/len),y1=prof(t1/len);const a=B.a+dir*t0,b=B.a+dir*t1,mid=(a+b)/2;
  const mx=B.ax==='x'?mid:B.c,mz=B.ax==='x'?B.c:mid;if(!ctx.has(mx,mz))continue;const hw=B.w/2,th=.9;
  const P=(s,o)=>B.ax==='x'?[s,o]:[o,s];
  const q=(s0,o0,y0_,s1,o1,y1_)=>0;
  const pa=P(a,B.c-hw),pb=P(a,B.c+hw),pc=P(b,B.c+hw),pd=P(b,B.c-hw);
  // top
  sb.quad('plainroad',[pa[0],y0,pa[1]],[pb[0],y0,pb[1]],[pc[0],y1,pc[1]],[pd[0],y1,pd[1]],0,1,0,[1,1,1],[0,0,1,1]);
  const sideN=(B.ax==='x')?[0,0,1]:[1,0,0];
  // sides + bottom
  const cs=C(0xb9bdc2);sb.quad('solid',[pb[0],y0-th,pb[1]],[pc[0],y1-th,pc[1]],[pc[0],y1,pc[1]],[pb[0],y0,pb[1]],sideN[0],sideN[1],sideN[2],cs);
  sb.quad('solid',[pd[0],y1-th,pd[1]],[pa[0],y0-th,pa[1]],[pa[0],y0,pa[1]],[pd[0],y1,pd[1]],-sideN[0],-sideN[1],-sideN[2],cs);
  sb.quad('solid',[pa[0],y0-th,pa[1]],[pd[0],y1-th,pd[1]],[pc[0],y1-th,pc[1]],[pb[0],y0-th,pb[1]],0,-1,0,cs);
  // rails
  for(const sgn of[-1,1]){const o=B.c+sgn*(hw-.15),r0=P(a,o),r1=P(b,o);sb.quad('solid',[r0[0],y0+.0,r0[1]],[r1[0],y1,r1[1]],[r1[0],y1+1,r1[1]],[r0[0],y0+1,r0[1]],0,0,0,C(0xe6e6e0));
   const bb={x0:Math.min(r0[0],r1[0])-.2,x1:Math.max(r0[0],r1[0])+.2,z0:Math.min(r0[1],r1[1])-.2,z1:Math.max(r0[1],r1[1])+.2};Col.addBox(own,bb.x0,bb.z0,bb.x1,bb.z1,Math.min(y0,y1),Math.max(y0,y1)+1,{})}
  // walkable/drivable
  const lo=Math.min(a,b),hi=Math.max(a,b),ya=a<b?y0:y1,yb=a<b?y1:y0;
  if(B.ax==='x')Col.addSurf(own,lo,B.c-hw,hi,B.c+hw,ya,yb,'x');else Col.addSurf(own,B.c-hw,lo,B.c+hw,hi,ya,yb,'z');
  // pillars
  if(k%6===3&&y1>2){const px=B.ax==='x'?mid:B.c,pz=B.ax==='x'?B.c:mid;for(const o of[-hw*.55,hw*.55]){const X=B.ax==='x'?px:px+o,Z=B.ax==='x'?pz+o:pz;sb.cyl('solid',X,-9,Z,1.3,1.1,y1+9-th,0xa9adb2,8);}}
  if(k%5===2){const lx=B.ax==='x'?mid:B.c+hw-1,lz=B.ax==='x'?B.c+hw-1:mid,ly=(y0+y1)/2;sb.cyl('metal',lx,ly,lz,.08,.12,6,0x3a3f46,5);sb.box('emisN',lx,ly+6,lz,.5,.1,.5,0xffe3b0);Lamps.add(own,lx,ly+5.8,lz,0xffd9a0,260)}
 }
 if(tw){// two towers + cables
  for(const f of[.33,.67]){const s=B.a+dir*len*f,y=prof(f),X=B.ax==='x'?s:B.c,Z=B.ax==='x'?B.c:s;if(!ctx.has(X,Z))continue;const hw=B.w/2;
   for(const o of[-hw-.6,hw+.6]){const x=B.ax==='x'?X:X+o,z=B.ax==='x'?Z+o:Z;sb.bb('solid',x-.9,y-1,z-.9,x+.9,y+36,z+.9,0xcfd3d8,{ao:1});Col.addBox(own,x-.9,z-.9,x+.9,z+.9,y-1,y+36)}
   const top=y+34,A1=B.ax==='x'?[X,top,Z-hw-.6]:[X-hw-.6,top,Z],A2=B.ax==='x'?[X,top,Z+hw+.6]:[X+hw+.6,top,Z];
   for(let q=1;q<=8;q++){const ds=q*7*(f<.5?1:1);for(const sgn of[-1,1]){const t2=f+sgn*ds/len,p2=prof(clamp(t2,0,1)),s2=B.a+dir*len*clamp(t2,0,1);
     for(const[top3,o]of[[A1,-hw+.3],[A2,hw-.3]]){const P2=B.ax==='x'?new V3(s2,p2,B.c+o):new V3(B.c+o,p2,s2);cable(sb,new V3(top3[0],top3[1],top3[2]),P2,.07,0xe85a2a)}}}
  }}}
G.bridgeY=null;
registerGen(function bridges(ctx){
 for(const B of BRIDGES){const len=Math.abs(B.b-B.a),prof=t=>B.h*(1-Math.pow(2*t-1,2));deckPieces(ctx,B,prof,len,B.tw)}
 deckPieces(ctx,OV,OV.prof,135,false);
 // highway approach roads
 road(ctx,405,45,545,45,15);
 // coastal road
 road(ctx,465,-330,465,330,14);
 // tunnel
 tunnel(ctx);
 // approach roads on islands + connecting
 road(ctx,765,45,835,45,15);road(ctx,835,45,835,150,12);
 road(ctx,1150,120,1250,120,14);road(ctx,870,-245,870,-290,14);road(ctx,875,400,875,440,14);
 // western highway to airport + north road to circuit
 road(ctx,-405,-45,-628,-45,15);road(ctx,-45,-405,-45,-520,15);
 if(ctx.i===-9&&ctx.j===0)0;
});
function tunnel(ctx){const x0=410,x1=458,z=-135,w=15;const sb=ctx.sb,own=ctx.owner;road(ctx,405,z,465,z,w);
 if(ctx.has((x0+x1)/2,z)){const hw=w/2+1.2;sb.bb('solid',x0,0,z-hw-1.5,x1,6.6,z-hw,0xb9bdc2,{ao:1});sb.bb('solid',x0,0,z+hw,x1,6.6,z+hw+1.5,0xb9bdc2,{ao:1});sb.bb('solid',x0,6.2,z-hw-1.5,x1,7.2,z+hw+1.5,0xa9adb2,{ao:1});
  Col.addBox(own,x0,z-hw-1.5,x1,z-hw,0,6.6);Col.addBox(own,x0,z+hw,x1,z+hw+1.5,0,6.6);Col.addBox(own,x0,z-hw-1.5,x1,z+hw+1.5,6.2,19,{});
  // hill mound
  const m=new THREE.Matrix4().compose(new V3((x0+x1)/2,6,z),new THREE.Quaternion(),new V3(30,14,hw+13));sb.addGeo('solid',new THREE.IcosahedronGeometry(1,2),m,0x4f7a43);
  for(let x=x0+4;x<x1;x+=8){sb.box('emisN',x,6.0,z,.8,.1,4,0xfff0c0);Lamps.add(own,x,5.6,z,0xfff0c0,200)}
  const f=new Frame(ctx,'W',x0,z);sign(ctx,'HARBOR TUNNEL',x0-.6,7.6,z,9,1.2,-Math.PI/2,'#06233a','#7df0ff');sign(ctx,'HARBOR TUNNEL',x1+.6,7.6,z,9,1.2,Math.PI/2,'#06233a','#7df0ff');
  Col.addZone(own,x0,z-hw,x1,z+hw,-1,6.4)}}
G.onReady.push(()=>{
 [[-800,-315],[-800,-365],[-800,-415]].forEach(([x,z],n)=>{const j=new Jet(x,z,Math.PI/2,[0xf4f4f0,0x1b3d8f,0x15161a][n]);j.owned=true;j.awake=false;j.label='Private Jet'});
 const h=new Heli(-795,0,-446,0,0xe8e8ee);h.awake=false;const h2=new Heli(G.helipad.x,G.helipad.y,G.helipad.z,0,0x15161a);h2.awake=false;h2.owned=true;h2.label='Your Helicopter';
 const b=new Jet(1250,-250,0,0xf4f4f0);b.awake=false;b.label='Private Jet';G.tp['Mansion Helipad']={x:G.helipad.x-6,y:G.helipad.y+.1,z:G.helipad.z,yaw:Math.PI}});
// ---------- coast: beach, marina, restaurant ----------
function pier(ctx,z,x0,len,boats){const sb=ctx.sb,own=ctx.owner,y=.5;const r=ctx.clip(x0,z-2,x0+len,z+2);if(r){sb.bb('solid',r[0],y-.3,r[1],r[2],y,r[3],0x8a6a45,{ao:1,rc:0x9a7a55});Col.addSurf(own,r[0],r[1],r[2],r[3],y);
   for(let x=Math.ceil(r[0]/6)*6;x<r[2];x+=6){for(const s of[-1.8,1.8])sb.cyl('solid',x,-3,z+s,.18,.18,y+3,0x5a4330,6)}
   for(let x=Math.ceil(r[0]/10)*10;x<r[2];x+=10)Lamps.add(own,x,y+2.2,z-1.8,0xffd9a0,200),sb.cyl('metal',x,y,z-1.8,.06,.06,2.2,0x3a3f46,5)}}
function marina(ctx){const cz=-160;if(ctx.has(coastX(cz)-10,cz)){const f=new Frame(ctx,'W',coastX(cz)-26,cz),y=0;}
 // clubhouse
 if(ctx.has(coastX(-150)-30,-150)){const X=coastX(-150)-34,Z=-150,sb=ctx.sb,own=ctx.owner,f=new Frame(ctx,'E',X+10,Z);f.floor(-14,0,14,12,.03,0xe8e6e0);
  f.wallU(0,-14,14,0,5,.4,0xf2efe8,[{a:-2,b:2,k:'door',yb:0,yt:2.8},{a:-12,b:-4,k:'win',yb:.5,yt:4},{a:4,b:12,k:'win',yb:.5,yt:4}]);f.wallV(-14,0,12,0,5,.4,0xf2efe8);f.wallV(14,0,12,0,5,.4,0xf2efe8);f.wallU(12,-14,14,0,5,.4,0xf2efe8,[{a:-3,b:3,k:'door'}]);
  const r=f.r(-14.3,-.3,14.3,12.3);sb.bb('solid',r[0],5,r[1],r[2],5.5,r[3],0x1b3a6b,{ao:1});Col.addBox(own,r[0],r[1],r[2],r[3],5,5.5,{cam:true});f.sign('NEON MARINA CLUB',0,6.6,-.1,12,1.6,'#06233a','#7df0ff');
  for(const u of[-8,0,8]){f.fb(u,5,2,2,0,.8,0xf2efe8);f.npc(u-1.2,5,0,'sit',null,1,0)}f.fb(0,9.5,12,1,0,1.1,0x1b3a6b);f.npc(0,10.8,0,'work','staff',0,-1);f.lamp(0,4.4,6,0xfff0d8,260);Col.addZone(own,r[0],r[1],r[2],r[3],0,5);
  f.inter(0,0,8,4,'F — Marina bar: cocktail ($30, +10 health)',()=>{if(payAny(30)){G.health=Math.min(100,G.health+10);G.hud();toast('Cheers!')}});
  G.pois.push({x:X,z:Z,name:'Marina Club',col:'#7df0ff',big:true})}
 for(const z of[-215,-185,-155,-125]){const cx=coastX(z);pier(ctx,z,cx+8,92,2)}}
function beach(ctx){const sb=ctx.sb,own=ctx.owner,r=mulberry32(ctx.i*97+ctx.j*13);
 if(ctx.j<-2||ctx.j>3)return;for(let k=0;k<9;k++){const z=ctx.cz+(r()-.5)*88,x=coastX(z)-14-r()*28;if(!ctx.has(x,z))continue;palm(sb,x,z,.8+r()*.5,terrainH(x,z))}
 for(let k=0;k<7;k++){const z=ctx.cz+(r()-.5)*80,x=coastX(z)-6-r()*16;if(!ctx.has(x,z)||z<-230||z>230)continue;const y=terrainH(x,z);sb.cyl('solid',x,y,z,.05,.05,2.2,0xe8e0d0,5);const cc=[0xff5a5f,0x2fb4e9,0xffd23f,0xffffff][k%4];sb.cyl('solid',x,y+2.1,z,2.0,0,.5,cc,10);sb.bb('solid',x-1.8,y,z+1,x-.6,y+.3,z+2.2,0xf0efe9,{ao:1});
  People.addSpawn(own,{x:x-1.2,y:y+.3,z:z+1.6,h:0,anim:'lie',outfit:'beach'})}}
function beachClub(ctx){const z=70,X=coastX(z)-34;if(!ctx.has(X,z))return;const f=new Frame(ctx,'E',X+8,z),sb=ctx.sb,own=ctx.owner,y=0;
 f.floor(-12,0,12,12,.03,0xd9c9a8);f.wallU(12,-12,12,0,4.4,.3,0xf2efe8);f.wallV(-12,0,12,0,4.4,.3,0xf2efe8,[{a:2,b:6,k:'door'}]);f.wallV(12,0,12,0,4.4,.3,0xf2efe8,[{a:2,b:6,k:'door'}]);
 const r=f.r(-12.3,-.3,12.3,12.3);sb.bb('solid',r[0],4.4,r[1],r[2],4.8,r[3],0xff8a5b,{ao:1});Col.addBox(own,r[0],r[1],r[2],r[3],4.4,4.8,{cam:true});f.sign('OCEAN CLUB BEACH RESTAURANT',0,5.8,-.1,14,1.6,'#2a1209','#ffd28a');
 for(let k=0;k<4;k++){f.fb(-8+k*5.3,-4,1.8,1.8,0,.75,0xf2efe8);f.npc(-9+k*5.3,-4,0,'sit',null,1,0);f.npc(-7+k*5.3,-4,0,'sit',null,-1,0);sb.cyl('solid',...(()=>{const p=f.p(-8+k*5.3,-4);return[p[0],0,p[1]]})(),.05,.05,2.4,0xe8e0d0,5)}
 f.fb(0,9,16,1.2,0,1.1,0x7a5a3a);f.npc(-3,10.2,0,'work','chef',0,-1);f.npc(3,10.2,0,'work','staff',0,-1);f.lamp(0,4,6,0xffd9a0,240);Col.addZone(own,r[0],r[1],r[2],r[3],0,4.4);
 f.inter(0,0,7.5,5,'F — Fresh seafood platter ($55, +30 health)',()=>{if(payAny(55)){G.health=Math.min(100,G.health+30);G.hud();toast('Grilled lobster. Heavenly.')}});
 G.pois.push({x:X,z,name:'Beach Restaurant',col:'#ff8a5b'})}
function swimmers(ctx){const r=mulberry32(ctx.i*31+ctx.j);if(ctx.j<-1||ctx.j>2||ctx.i<6||ctx.i>7)return;
 for(let k=0;k<4;k++){const z=ctx.cz+(r()-.5)*70,x=coastX(z)+34+r()*18;if(!ctx.has(x,z))continue;People.addSpawn(ctx.owner,{x,y:SEA,z,h:r()*6,anim:'swim',outfit:'swim'})}
 if(ctx.j===0||ctx.j===1){const z0=ctx.cz-40;for(let k=0;k<8;k++){const z=z0+k*10,x=coastX(z)+62;if(!ctx.has(x,z))continue;ctx.sb.addGeo('solid',new THREE.SphereGeometry(.35,6,5),new THREE.Matrix4().makeTranslation(x,SEA+.1,z),0xff7a1a)}}}
registerGen(function coast(ctx){if(ctx.i<5||ctx.i>7)return;marina(ctx);beach(ctx);beachClub(ctx);swimmers(ctx)});
G.tp['Beach']={x:coastX(40)-14,y:0,z:40,yaw:Math.PI/2};G.tp['Marina']={x:coastX(-155)+20,y:.5,z:-155,yaw:Math.PI/2};G.pois.push({x:coastX(-155),z:-155,name:'Marina',col:'#7df0ff',big:true});
G.onReady.push(()=>{const pz=[-215,-185,-155,-125];const b=(z,x,y,yh)=>{const bo=new Boat(x,z,Math.PI/2,y,y?0xf4f4f0:0xe33b2e);bo.awake=false;return bo};
 pz.forEach((z,k)=>{const cx=coastX(z);b(z-4.6,cx+42+k*3,true);b(z+4.6,cx+55,k%2===0)});});
// ---------- islands ----------
const VILLAS=[];{const R=mulberry32(77);for(const I of ISLANDS){const n=I.n==='B'?3:I.n==='A'?7:5;for(let k=0;k<n;k++){const a=R()*TAU,rad=.35+R()*.18;let x=I.x+Math.cos(a)*I.rx*rad,z=I.z+Math.sin(a)*I.rz*rad;if(I.n==='B'){x=I.x+(R()<.5?-1:1)*70;z=I.z+(-250+R()*500)}
 if(I.n==='B'&&Math.abs(z)<60)z+=100;if(VILLAS.some(v=>Math.hypot(v.x-x,v.z-z)<45))continue;const dx=x-I.x,dz=z-I.z;const side=Math.abs(dx)>Math.abs(dz)?(dx>0?'E':'W'):(dz>0?'S':'N');VILLAS.push({x:Math.round(x),z:Math.round(z),side,I:I.n,col:[0xf3f0e9,0xe8dcc8,0xdfe6ea][k%3]})}}}
function villa(ctx,V){const sb=ctx.sb,own=ctx.owner,f=new Frame(ctx,V.side,V.x,V.z),y=terrainH(V.x,V.z)+.05,H=4.6;
 const outV={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]}[V.side];
 // ground pad
 f.floor(-16,-14,16,16,y+.01,0xcfc8b8);
 f.floor(-12,0,12,14,y+.03,0xd9c9a8);
 f.wallU(0,-12,12,y,y+H,.4,V.col,[{a:-10,b:-2,k:'win',yb:y+.2,yt:y+H-.5},{a:-1.2,b:1.2,k:'door',yb:y,yt:y+2.8},{a:2,b:10,k:'win',yb:y+.2,yt:y+H-.5}]);f.wallV(-12,0,14,y,y+H,.4,V.col,[{a:3,b:11,k:'win',yb:y+.5,yt:y+H-.8}]);f.wallV(12,0,14,y,y+H,.4,V.col,[{a:3,b:11,k:'win',yb:y+.5,yt:y+H-.8}]);f.wallU(14,-12,12,y,y+H,.4,V.col);
 const r=f.r(-13,-2.5,13,15);sb.bb('solid',r[0],y+H,r[1],r[2],y+H+.45,r[3],0x2b2f36,{ao:1,rc:0x7a7e84});Col.addBox(own,r[0],r[1],r[2],r[3],y+H,y+H+.45,{cam:true});
 const zr=f.r(-12,0,12,14);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],y-1,y+H);
 f.fb(-6,6,4.5,1,y,.45,0x59606c);f.fb(-6,5,4.5,.25,y+.45,.5,0x59606c);f.fb(-6,9,2.4,1.2,y,.4,0x2a2d33);f.fb(6,9,6,1,y,1.1,0xe8e6e0);f.fb(5,12.6,2.2,2.2,y,.4,0xf0efe9);f.fb(-8,12.6,1,.3,y,2,0x6b4a2e,false);
 f.lamp(0,y+H-.5,6,0xffe2b0,240);f.lamp(-7,y+H-.5,10,0xffe2b0,200);f.lamp(7,y+H-.5,10,0xffe2b0,200);
 f.inter(0,y,7,4,'F — Relax in the villa (+10 health)',()=>{G.health=Math.min(100,G.health+10);G.hud();toast('Ocean breeze.')});
 f.npc(-4,10,y,'idle',null,0,-1);
 // pool in front
 const pr=f.r(-7,-11,7,-4);sb.bb('solid',pr[0],y,pr[1],pr[2],y+.12,pr[3],0xf0efe9,{ao:1});sb.bb('glass',pr[0]+.4,y+.1,pr[1]+.4,pr[2]-.4,y+.14,pr[3]-.4,0x35c0e8,{ao:1,top:'glass'});
 for(const[u,v]of[[-10,-8],[10,-8],[-14,-2],[14,-2]]){const p=f.p(u,v);palm(sb,p[0],p[1],1,y)}
 for(const u of[-9,9]){f.fb(u,-7,1,2,y,.35,0xf0efe9,false);f.npc(u,-7,y+.35,'lie','beach',0,0)}
 // road stub to dock
 }
function dock(ctx,x,z,dir,len,name){const sb=ctx.sb,own=ctx.owner,y=.5,w=3.5;const x0=dir>0?x:x-len,x1=dir>0?x+len:x;const r=ctx.clip(x0,z-w/2,x1,z+w/2);if(r){sb.bb('solid',r[0],y-.3,r[1],r[2],y,r[3],0x8a6a45,{ao:1,rc:0x9a7a55});Col.addSurf(own,r[0],r[1],r[2],r[3],y);for(let xx=Math.ceil(r[0]/6)*6;xx<r[2];xx+=6)for(const s of[-1.5,1.5])sb.cyl('solid',xx,-3,z+s,.18,.18,y+3,0x5a4330,6)}}
function islandB(ctx){const X=1250;fl(ctx,'ground',X-17,-300,X+17,300,.03,0x3b3e43);for(let z=-290;z<290;z+=30)bxc(ctx,'solid',X-.4,.03,z,X+.4,.06,z+16,0xf2f2ee,false);for(let z=-300;z<300;z+=25)for(const sx of[-1,1])bxc(ctx,'emisN',X+sx*18.5,0,z,X+sx*18.5+.4,.4,z+.4,0xaad4ff);
 fl(ctx,'ground',X+17,-260,X+60,-180,.03,0x9a9c9a);fl(ctx,'ground',X+17,-260,X+60,-180,.03,0x9a9c9a);
 if(ctx.has(X+75,-220)){const f=new Frame(ctx,'W',X+60,-220),sb=ctx.sb,own=ctx.owner;f.floor(-10,0,10,10,.03,0xe8e6e0);f.wallU(0,-10,10,0,4.4,.3,0xdfe3e8,[{a:-3,b:3,k:'win',yb:.5,yt:3.8},{a:-1,b:1,k:'door',yb:0,yt:2.8}].slice(1));f.wallU(10,-10,10,0,4.4,.3,0xdfe3e8);f.wallV(-10,0,10,0,4.4,.3,0xdfe3e8);f.wallV(10,0,10,0,4.4,.3,0xdfe3e8,[{a:-8,b:-1,k:'win',yb:.5,yt:3.8},{a:1,b:8,k:'win',yb:.5,yt:3.8}]);
  const r=f.r(-10.3,-.3,10.3,10.3);sb.bb('solid',r[0],4.4,r[1],r[2],4.8,r[3],0x2b3a55,{ao:1});Col.addBox(own,r[0],r[1],r[2],r[3],4.4,4.8,{cam:true});f.sign('PRIVATE ISLAND AIRPORT',0,5.8,-.1,12,1.5,'#06233a','#7df0ff');Col.addZone(own,r[0],r[1],r[2],r[3],0,4.4);f.lamp(0,4,5,0xfff0d8,260);
  f.fb(0,6,8,1,0,1.1,0x2b3a55);f.npc(0,7.2,0,'work','pilot',0,-1);f.inter(0,0,3.6,4,'F — Flight back to the International Airport ($300)',()=>{if(payAny(300)){UI.splash('✈ BOARDING','#7df0ff',1500);setTimeout(()=>G.teleportTo({x:-632,y:.1,z:0,yaw:Math.PI/2}),600)}});
  G.pois.push({x:1310,z:-220,name:'Island Airport',col:'#7df0ff',big:true})}}
registerGen(function islands(ctx){for(const V of VILLAS)if(ctx.has(V.x,V.z))villa(ctx,V);
 if(ctx.i>=13&&ctx.i<=15&&ctx.j>=-4&&ctx.j<=1)islandB(ctx);
 if(ctx.has(985,140))dock(ctx,975,140,1,44);if(ctx.has(985,100)){}
 if(ctx.has(930,-225))dock(ctx,880,-330,1,40);
 for(const I of ISLANDS)if(ctx.has(I.x,I.z)){const sb=ctx.sb;for(let k=0;k<10;k++){const a=k/10*TAU,x=I.x+Math.cos(a)*I.rx*.5,z=I.z+Math.sin(a)*I.rz*.5;if(ctx.has(x,z))palm(sb,x,z,1.1,terrainH(x,z))}}});
G.tp['Island A (Villas)']={x:850,y:.2,z:110,yaw:0};G.tp['Island C']={x:900,y:.2,z:-330,yaw:0};G.tp['Island E']={x:900,y:.2,z:500,yaw:0};G.tp['Island Airport']={x:1250,y:.2,z:-200,yaw:0};G.tp['Harbor Bridge']={x:620,y:12,z:45,yaw:-Math.PI/2};G.tp['Harbor Tunnel']={x:405,y:.2,z:-135,yaw:-Math.PI/2};G.tp['Highway Overpass']={x:430,y:6,z:45,yaw:-Math.PI/2};
G.pois.push({x:850,z:120,name:'Villa Island',col:'#ffd45a',big:true});
G.onReady.push(()=>{const A=ISLANDS[0];[[995,152,true],[995,186,false]].forEach(([x,z,y])=>{const b=new Boat(x+10,z,Math.PI/2,y,y?0xf4f4f0:0xe33b2e);b.awake=false})});
