// Realistic aircraft models: narrow-body airliner + business jet (real-world proportions, metres).
// Model space: nose toward -Z, +Y up, +X starboard, origin = main-gear wheel contact point (wheel bottoms at y=0).
import {THREE,G,SB,C,clamp,lerp,TAU,canvasTex,std,scene} from './core.js';
const V3=THREE.Vector3;
const DS=THREE.DoubleSide;

// ---------- small helpers ----------
function interp(pts,s){let i=0;while(i<pts.length-2&&s>pts[i+1][0])i++;
 const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];const dx=p2[0]-p1[0],t=clamp((s-p1[0])/dx,0,1);
 const m1=(p2[1]-p0[1])/Math.max(p2[0]-p0[0],1e-6)*dx,m2=(p3[1]-p1[1])/Math.max(p3[0]-p1[0],1e-6)*dx;
 const t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*p1[1]+(t3-2*t2+t)*m1+(-2*t3+3*t2)*p2[1]+(t3-t2)*m2}
function rrect(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function seamFix(geo,P,rows){const n=geo.attributes.normal;for(let k=0;k<rows;k++){const a=k*P,b=k*P+P-1;const x=n.getX(a)+n.getX(b),y=n.getY(a)+n.getY(b),z=n.getZ(a)+n.getZ(b),l=Math.hypot(x,y,z)||1;n.setXYZ(a,x/l,y/l,z/l);n.setXYZ(b,x/l,y/l,z/l)}n.needsUpdate=true}
// fuselage as rings. s: 0 nose..L tail. stations [[s,r,cyOff]]
function fuselageGeo(spec){const{L,zN,st,cy,N=36,K=140}=spec;const rp=st.map(a=>[a[0],a[1]]),cp=st.map(a=>[a[0],a[2]]);
 const pos=[],uv=[],idx=[],P=N+1;
 for(let k=0;k<=K;k++){const s=L*k/K,r=Math.max(.012,interp(rp,s)),c=cy+interp(cp,s);
  for(let a=0;a<=N;a++){const th=a/N*TAU;pos.push(Math.sin(th)*r,c-Math.cos(th)*r,-zN+s);uv.push(s/L,a/N)}}
 for(let k=0;k<K;k++)for(let a=0;a<N;a++){const i00=k*P+a,i01=i00+1,i10=i00+P,i11=i10+1;idx.push(i00,i01,i10,i01,i11,i10)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();seamFix(g,P,K+1);g.computeBoundingSphere();return g}
// lofted aerofoil surface. sts:[{le:[x,y,z],c,t,n:[nx,ny,nz]}]  u: 0..0.5 upper LE->TE, 0.5..1 lower TE->LE ; v: root->tip
function loft(sts,nu=12,cap=true){const S=sts.length,P=2*nu+1,pos=[],uv=[],idx=[];const a=[];for(let i=0;i<=nu;i++)a.push((1-Math.cos(Math.PI*i/nu))/2);
 const yt=(x,t)=>5*t*(.2969*Math.sqrt(x)-.126*x-.3516*x*x+.2843*x**3-.1036*x**4);
 for(let k=0;k<S;k++){const s=sts[k];const pr=[];for(let i=0;i<=nu;i++)pr.push([a[i],yt(a[i],s.t)]);for(let i=nu-1;i>=0;i--)pr.push([a[i],-yt(a[i],s.t)]);
  pr.forEach((p,i)=>{pos.push(s.le[0]+s.n[0]*p[1]*s.c,s.le[1]+s.n[1]*p[1]*s.c,s.le[2]+p[0]*s.c+s.n[2]*p[1]*s.c);uv.push(i/(2*nu),k/(S-1))})}
 for(let k=0;k<S-1;k++)for(let i=0;i<2*nu;i++){const A=k*P+i,B=A+1,Cc=A+P,D=Cc+1;idx.push(A,B,Cc,B,D,Cc)}
 if(cap){const base=pos.length/3,k=S-1;let cx=0,cy=0,cz=0;for(let i=0;i<P;i++){cx+=pos[(k*P+i)*3];cy+=pos[(k*P+i)*3+1];cz+=pos[(k*P+i)*3+2]}cx/=P;cy/=P;cz/=P;
  pos.push(cx,cy,cz);uv.push(.25,1);for(let i=0;i<P;i++){pos.push(pos[(k*P+i)*3],pos[(k*P+i)*3+1],pos[(k*P+i)*3+2]);uv.push(i/(2*nu),1)}
  for(let i=0;i<P-1;i++)idx.push(base,base+1+i,base+2+i)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();seamFix(g,P,S);g.computeBoundingSphere();return g}
const M4=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V3(sx,sy,sz));

// ---------- materials ----------
const PAINT=std({vertexColors:true,roughness:.34,metalness:.35,side:DS}),DARK=std({vertexColors:true,roughness:.55,metalness:.7,side:DS}),CHROME=std({vertexColors:true,roughness:.18,metalness:1,side:DS});
const TIRE=std({color:0x111214,roughness:.9}),HUB=std({color:0xaeb4ba,roughness:.35,metalness:.8});
const KEYMAT={paint:PAINT,dark:DARK,chrome:CHROME};
function sbGroup(gs,shadow=true){const g=new THREE.Group();for(const k in gs){const m=new THREE.Mesh(gs[k],KEYMAT[k]||(k==='emis'?new THREE.MeshBasicMaterial({vertexColors:true}):PAINT));m.castShadow=shadow&&k!=='emis';m.receiveShadow=true;g.add(m)}return g}
let fanTex=null;function getFanTex(){if(fanTex)return fanTex;fanTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#16181b';x.fillRect(0,0,w,h);x.translate(128,128);
  for(let b=0;b<22;b++){x.save();x.rotate(b/22*TAU);const g=x.createLinearGradient(0,0,0,-120);g.addColorStop(0,'#2a2d31');g.addColorStop(1,'#8a9097');x.fillStyle=g;x.beginPath();x.moveTo(-3,-30);x.quadraticCurveTo(14,-70,6,-122);x.lineTo(-10,-120);x.quadraticCurveTo(-4,-70,-9,-30);x.fill();x.restore()}
  x.fillStyle='#4a4e54';x.beginPath();x.arc(0,0,30,0,TAU);x.fill();x.fillStyle='#8f959c';x.beginPath();x.arc(-6,-6,10,0,TAU);x.fill();x.strokeStyle='#9aa0a6';x.lineWidth=4;x.beginPath();x.arc(0,0,124,0,TAU);x.stroke()},{clamp:true});return fanTex}
let glowTex=null;function getGlow(){if(glowTex)return glowTex;glowTex=canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},{clamp:true});return glowTex}

// ---------- liveries (fictional airlines) ----------
export const AIRLINES={
 neon:{name:'NEON AIR',a:'#0b8fd6',b:'#19e0ff',tail:'#0a2a5c',txt:'#0a2a5c',reg:'NX-'},
 gulf:{name:'GULFSTAR',a:'#b0172c',b:'#f3c34a',tail:'#7c0f1f',txt:'#7c0f1f',reg:'GS-'},
 sky:{name:'SKY ROYAL',a:'#1f7a52',b:'#e9d9a6',tail:'#12503a',txt:'#12503a',reg:'SR-'},
 vip:{name:'',a:'#c9a24a',b:'#1b1d22',tail:'#1b1d22',txt:'#1b1d22',reg:'N8'},
 vip2:{name:'',a:'#2b6cb0',b:'#e8eef4',tail:'#1b3a6b',txt:'#1b3a6b',reg:'N7'},
 vip3:{name:'',a:'#d6342a',b:'#15161a',tail:'#15161a',txt:'#15161a',reg:'N9'}};
const texCache={};
function paintHull(spec,al,emissive){const W=3072,H=1024,L=spec.L,ppm=W/L;const ppy=H/(TAU*(spec.rmax||1.97));
 return canvasTex(W,H,(x)=>{
  x.fillStyle=emissive?'#000':'#f2f3f4';x.fillRect(0,0,W,H);
  const side=(sd,fn)=>{x.save();if(sd==='port')x.setTransform(1,0,0,-1,0,H*.25);else x.setTransform(1,0,0,1,0,H*.75);fn(sd);x.restore()};
  const mx=m=>m*ppm,my=m=>m*ppy;
  if(!emissive){
   // belly grey with soft edge
   for(const half of[0,1]){const g=x.createLinearGradient(0,half?H:0,0,half?H*.8:H*.2);g.addColorStop(0,'#8f969d');g.addColorStop(.62,'#aab1b7');g.addColorStop(1,'rgba(242,243,244,0)');x.fillStyle=g;x.fillRect(0,half?H*.8:0,W,H*.2)}
  }
  const win=spec.win;
  for(const sd of['port','starboard'])side(sd,(sd)=>{
   const flipX=(cx,fn)=>{if(sd==='starboard'){x.save();x.translate(cx,0);x.scale(-1,1);x.translate(-cx,0);fn();x.restore()}else fn()};
   if(!emissive){
    // cheat line + swoosh
    if(spec.cheat){const ch=spec.cheat;x.fillStyle=al.a;x.beginPath();x.moveTo(mx(ch.s0),my(ch.y0));x.lineTo(mx(ch.s1),my(ch.y0));x.quadraticCurveTo(mx(L*.93),my(ch.y0),mx(L),my(ch.yTail));x.lineTo(mx(L),my(ch.yTail+.62));x.quadraticCurveTo(mx(L*.9),my(ch.y0+ch.w),mx(ch.s1),my(ch.y0+ch.w));x.lineTo(mx(ch.s0),my(ch.y0+ch.w));x.closePath();x.fill();
     x.fillStyle=al.b;x.beginPath();x.moveTo(mx(ch.s0),my(ch.y0+ch.w+.07));x.lineTo(mx(ch.s1),my(ch.y0+ch.w+.07));x.quadraticCurveTo(mx(L*.9),my(ch.y0+ch.w+.07),mx(L*.985),my(ch.yTail+.85));x.lineTo(mx(L*.985),my(ch.yTail+.98));x.quadraticCurveTo(mx(L*.9),my(ch.y0+ch.w+.2),mx(ch.s1),my(ch.y0+ch.w+.2));x.lineTo(mx(ch.s0),my(ch.y0+ch.w+.2));x.closePath();x.fill()}
    // airline name
    if(al.name&&spec.nameAt){const n=spec.nameAt;x.fillStyle=al.txt;x.textBaseline='middle';x.textAlign='center';let f=n.h;x.font=`italic 900 ${my(f)}px Arial Black, Arial, sans-serif`;while(x.measureText(al.name).width>mx(n.s1-n.s0)&&f>.1){f-=.02;x.font=`italic 900 ${my(f)}px Arial Black, Arial, sans-serif`}
     const cx=mx((n.s0+n.s1)/2);flipX(cx,()=>x.fillText(al.name,cx,my(n.y)))}
    // tail registration
    {x.fillStyle='#3a4046';x.font=`bold ${my(.26)}px Arial`;x.textAlign='center';x.textBaseline='middle';const cx=mx(spec.regAt+1.4);flipX(cx,()=>x.fillText((al.reg||'N')+(spec.regNo||'801'),cx,my(spec.regY??-.55)))}
    // doors
    for(const d of spec.doors){x.strokeStyle='#8d949b';x.lineWidth=2.2;rrect(x,mx(d.s),my(d.y-d.h/2),mx(d.w),my(d.h),9);x.stroke();x.fillStyle='rgba(120,128,136,.35)';x.fillRect(mx(d.s+d.w*.78),my(d.y-.04),9,5)}
    // cockpit side windows
    const ck=spec.cockpit;x.fillStyle='#10161d';x.strokeStyle='#cfd4d8';x.lineWidth=2;
    for(const p of ck.side){x.beginPath();x.moveTo(mx(p[0][0]),my(p[0][1]));for(let i=1;i<p.length;i++)x.lineTo(mx(p[i][0]),my(p[i][1]));x.closePath();x.fill();x.stroke()}
   }
   // cabin windows
   for(let s=win.s0,k=0;s<=win.s1+1e-6;s+=win.pitch,k++){const ex=win.skip&&win.skip(s,k);if(ex==='gap')continue;
    const w=mx(win.w),h=my(win.h),X=mx(s)-w/2,Y=my(win.y)-h/2;
    if(emissive){const lit=((k*7919)%13)>2;if(!lit)continue;x.fillStyle='#ffd9a8';rrect(x,X+2,Y+2,w-4,h-4,w*.4);x.fill()}
    else{x.fillStyle='#b9bfc4';rrect(x,X-3,Y-3,w+6,h+6,w*.5);x.fill();const g=x.createLinearGradient(X,Y,X,Y+h);g.addColorStop(0,'#3e556b');g.addColorStop(.55,'#16222e');g.addColorStop(1,'#0c141c');x.fillStyle=g;rrect(x,X,Y,w,h,w*.4);x.fill();x.fillStyle='rgba(255,255,255,.22)';rrect(x,X+3,Y+3,w*.35,h*.5,3);x.fill()}
    if(ex==='exit'&&!emissive){x.strokeStyle='#8d949b';x.lineWidth=2;rrect(x,X-6,Y-8,w+12,h+16,8);x.stroke()}}
  });
  // windscreen (wraps over the nose top)
  if(!emissive){const ck=spec.cockpit;x.save();x.fillStyle='#0d131a';x.strokeStyle='#cfd4d8';x.lineWidth=2.5;
   for(const part of ck.wind){const X0=mx(part.s0),X1=mx(part.s1),Y0=H*(.5-part.u),Y1=H*(.5+part.u);x.beginPath();x.moveTo(X0+4,Y0+part.cut);x.lineTo(X1-2,Y0);x.lineTo(X1-2,Y1);x.lineTo(X0+4,Y1-part.cut);x.closePath();x.fill();x.stroke();
    const g=x.createLinearGradient(X0,Y0,X1,Y1);g.addColorStop(0,'rgba(120,160,200,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fill();x.fillStyle='#0d131a'}
   x.strokeStyle='#cfd4d8';x.lineWidth=3;x.beginPath();x.moveTo(mx(ck.wind[0].s0)+4,H*.5);x.lineTo(mx(ck.wind[0].s1)-2,H*.5);x.stroke();x.restore();
   // APU / tail cone black
   x.fillStyle='#2a2d31';x.fillRect(mx(L-.5),0,mx(.5),H)}
 })}
function finTex(al,spec){return canvasTex(512,512,(x,w,h)=>{x.fillStyle=al.tail;x.fillRect(0,0,w,h);
 for(const half of[0,1]){x.save();x.beginPath();x.rect(half*256,0,256,512);x.clip();const cx=half*256+128,cy=190;
  x.fillStyle=al.a;x.beginPath();x.moveTo(cx-120,512);x.lineTo(cx-20,512);x.lineTo(cx+120,150);x.lineTo(cx+120,60);x.closePath();x.globalAlpha=.9;x.fill();x.globalAlpha=1;
  x.fillStyle=al.b;x.beginPath();x.moveTo(cx-60,512);x.lineTo(cx+0,512);x.lineTo(cx+120,250);x.lineTo(cx+120,200);x.closePath();x.fill();
  if(spec.emblem!==false){x.fillStyle='#fff';x.beginPath();x.arc(cx,cy,46,0,TAU);x.fill();x.fillStyle=al.a;x.beginPath();x.arc(cx,cy,34,0,TAU);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(cx-18,cy+16);x.lineTo(cx+2,cy-24);x.lineTo(cx+12,cy-24);x.lineTo(cx-4,cy+8);x.lineTo(cx+20,cy+8);x.lineTo(cx+20,cy+16);x.closePath();x.fill()}x.restore()}
 x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,0,w,3)})}
let wingTexC=null;function wingTex(){if(wingTexC)return wingTexC;wingTexC=canvasTex(1024,1024,(x,w,h)=>{
 x.fillStyle='#d3d7da';x.fillRect(0,0,512,h);x.fillStyle='#a9afb5';x.fillRect(512,0,512,h);
 for(let i=0;i<1400;i++){x.fillStyle=`rgba(${100+Math.random()*90|0},${100+Math.random()*90|0},${105+Math.random()*90|0},.05)`;x.fillRect(Math.random()*w,Math.random()*h,3,2)}
 const Y=v=>(1-v)*h;x.strokeStyle='rgba(70,76,84,.8)';x.lineWidth=1.8;
 const panel=(a0,a1,v0,v1,lower)=>{const xa=lower?512+(1-a1)*512:a0*512,xb=lower?512+(1-a0)*512:a1*512;x.strokeRect(xa,Y(v1),xb-xa,Y(v0)-Y(v1))};
 for(const lw of[0,1]){panel(0,.1,.1,.97,lw);panel(.74,1,.08,.38,lw);panel(.74,1,.41,.68,lw);panel(.8,1,.72,.95,lw);if(!lw){for(let k=0;k<5;k++)panel(.6,.74,.1+k*.11,.1+k*.11+.1,0)}}
 x.fillStyle='rgba(60,64,70,.18)';x.fillRect(120,Y(.6),140,Y(.12)-Y(.6));x.fillStyle='rgba(200,40,40,.55)';x.fillRect(5,Y(.995),500,5);
 x.fillStyle='rgba(60,60,60,.35)';for(let k=0;k<6;k++)x.fillRect(560+k*55,Y(.52),22,70)});return wingTexC}
const liveryCache={};
function liveryMats(spec,key,airline){const k=spec.id+'|'+airline;let m=liveryCache[k];if(m)return m;const al=AIRLINES[airline]||AIRLINES.neon;
 const hull=std({map:paintHull(spec,al,false),emissiveMap:paintHull(spec,al,true),emissive:0xffffff,emissiveIntensity:0,roughness:.3,metalness:.28,side:DS});
 const fin=std({map:finTex(al,spec),roughness:.4,metalness:.2,side:DS});
 m=liveryCache[k]={hull,fin,wing:null};return m}
const wingMat=()=>{if(!wingMat.m)wingMat.m=std({map:wingTex(),roughness:.42,metalness:.35,side:DS});return wingMat.m};

// ---------- specs ----------
const SPECS={
 airliner:{id:'airliner',L:37.6,zN:14.3,cy:3.7,rmax:1.97,
  st:[[0,.02,-.30],[.35,.55,-.28],[.9,.98,-.24],[1.8,1.45,-.17],[3.2,1.77,-.08],[5,1.92,-.02],[7,1.97,0],[26,1.97,0],[28.5,1.85,.1],[31,1.5,.38],[33.5,1.05,.7],[35.8,.6,1.0],[37.3,.28,1.2],[37.6,.08,1.25]],
  win:{s0:6.3,s1:30,pitch:.508,w:.23,h:.32,y:-.50,skip:(s)=>(s>15.7&&s<17.7)?((Math.abs(s-16.2)<.3||Math.abs(s-17.2)<.3)?'exit':'gap'):((s>5&&s<7)?null:null)},
  cheat:{s0:3.2,s1:27,y0:.38,w:.2,yTail:-.9},nameAt:{s0:8.5,s1:24,y:-1.16,h:.56},
  doors:[{s:4.25,y:-.2,w:1.0,h:1.85},{s:29.6,y:-.2,w:.85,h:1.7}],
  cockpit:{side:[[[2.55,-.9],[3.3,-.92],[3.5,-.35],[2.8,-.3]],[[3.55,-.92],[4.2,-.95],[4.1,-.37],[3.7,-.35]]],wind:[{s0:1.55,s1:2.7,u:.115,cut:26}]},
  regAt:31.2,regY:-.5,regNo:'320',
  wing:{x0:1.75,c0:6.2,le0:-2.5,y0:2.45,kx:6.2,ckx:4.7,tipX:17.9,tipC:1.45,sweep:.5095,dih:.0875,t0:.13,t1:.095,wl:{h:2.5,c:.75,sw:1.6,cant:.35}},
  fin:{y:4.9,z:12.7,c0:6.6,tipC:2.2,h:6.4,sweep:.7,t:.1},
  stab:{x:.9,y:4.55,z:16.0,c0:3.4,tipX:6.3,tipC:1.15,sweep:.58,dih:.09,t:.085},
  eng:{x:5.75,y:1.62,z0:-3.7,len:4.3,r:.96,pylon:true,rear:false},
  gear:{main:{x:2.6,y:2.45,z:.2,r:.58,w:.42,sep:.46,twin:true},nose:{y:1.78,z:-9.7,r:.38,w:.24,sep:.2},leg:.13},
  doorLocal:{x:-1.97,y:3.0,z:-9.4},lights:{tip:17.95,tipY:3.95,tipZ:6.1,tailZ:19.3,tailY:11.2,beaconTop:[0,5.7,6],beaconBot:[0,1.7,2]},
  speedKt:70},
 biz:{id:'biz',L:26,zN:11.2,cy:2.9,rmax:1.32,tailCone:true,
  st:[[0,.02,-.35],[.4,.5,-.32],[1.2,.9,-.25],[2.6,1.2,-.1],[4.5,1.3,0],[6,1.32,0],[19,1.32,0],[21.5,1.15,.12],[23.5,.8,.3],[25.2,.45,.45],[26,.18,.5]],
  win:{s0:6.6,s1:17.2,pitch:.95,w:.3,h:.4,y:-.36},
  cheat:{s0:2.2,s1:19,y0:.34,w:.26,yTail:-.55},nameAt:null,
  doors:[{s:3.7,y:-.1,w:1.05,h:1.7}],
  cockpit:{side:[[[2.0,-.62],[2.9,-.66],[2.95,-.22],[2.35,-.18]]],wind:[{s0:1.3,s1:2.1,u:.1,cut:20}]},
  regAt:19.2,regY:-.45,regNo:'650',
  wing:{x0:1.15,c0:4.7,le0:-1.9,y0:2.3,kx:5.2,ckx:3.4,tipX:13.5,tipC:1.2,sweep:.58,dih:.06,t0:.12,t1:.08,wl:{h:1.9,c:.75,sw:1.2,cant:.3}},
  fin:{y:3.3,z:9.6,c0:4.4,tipC:2.0,h:4.7,sweep:.85,t:.1,tee:true},
  stab:{x:.15,y:7.75,z:11.9,c0:2.4,tipX:3.5,tipC:1.0,sweep:.55,dih:0,t:.08,tee:true},
  eng:{x:2.05,y:3.45,z0:6.6,len:4.6,r:.58,pylon:true,rear:true},
  gear:{main:{x:1.55,y:1.8,z:.3,r:.4,w:.28,sep:.2,twin:true},nose:{y:1.45,z:-7.5,r:.3,w:.2,sep:.15},leg:.1},
  doorLocal:{x:-1.32,y:1.9,z:-7.5},lights:{tip:13.55,tipY:3.0,tipZ:5.3,tailZ:12.5,tailY:8.0,beaconTop:[0,4.3,5],beaconBot:[0,1.6,1]},
  speedKt:60}};

// ---------- shared geometry per type ----------
const baseCache={};
function buildBase(spec){const b={};const w=spec.wing,cy=spec.cy;
 b.hull=fuselageGeo(spec);
 // wings (starboard sx=+1, port sx=-1)
 const wingSts=(sx)=>{const le=x=>w.le0+(x-w.x0)*w.sweep,yy=x=>w.y0+(x-w.x0)*w.dih,t=[[w.x0,w.c0,w.t0],[w.kx,w.ckx,(w.t0+w.t1)/2],[w.tipX,w.tipC,w.t1]];
  return t.map(([x,c,th])=>({le:[sx*x,yy(x),le(x)],c,t:th,n:[0,1,0]}))};
 b.wings=[loft(wingSts(1),12),loft(wingSts(-1),12)];
 // winglets
 const wl=w.wl;b.winglets=[1,-1].map(sx=>{const x=w.tipX,y=w.y0+(x-w.x0)*w.dih,z=w.le0+(x-w.x0)*w.sweep;return loft([{le:[sx*x,y-.1,z+.08],c:w.tipC,t:.1,n:[1,0,0]},{le:[sx*(x+wl.cant*.5),y+wl.h*.5,z+wl.sw*.45],c:w.tipC*.8,t:.07,n:[1,0,0]},{le:[sx*(x+wl.cant),y+wl.h,z+wl.sw],c:wl.c,t:.05,n:[1,0,0]}],8)});
 // vertical fin
 const f=spec.fin;b.fin=loft([{le:[0,f.y,f.z],c:f.c0,t:f.t,n:[1,0,0]},{le:[0,f.y+f.h*.5,f.z+f.h*.5*f.sweep],c:(f.c0+f.tipC)/2,t:f.t*.85,n:[1,0,0]},{le:[0,f.y+f.h,f.z+f.h*f.sweep],c:f.tipC,t:f.t*.7,n:[1,0,0]}],10);
 // stabilisers
 const st=spec.stab;b.stabs=[1,-1].map(sx=>loft([{le:[sx*st.x,st.y,st.z],c:st.c0,t:st.t,n:[0,1,0]},{le:[sx*(st.x+(st.tipX-st.x)*.5),st.y+(st.tipX-st.x)*.5*st.dih,st.z+(st.tipX-st.x)*.5*st.sweep],c:(st.c0+st.tipC)/2,t:st.t*.85,n:[0,1,0]},{le:[sx*st.tipX,st.y+(st.tipX-st.x)*st.dih,st.z+(st.tipX-st.x)*st.sweep],c:st.tipC,t:st.t*.7,n:[0,1,0]}],10));
 // static painted/dark parts merged
 const sb=new SB(),e=spec.eng;
 for(const sx of[-1,1]){const ex=sx*e.x,r=e.r,len=e.len;
  // nacelle: radius / axial (0 = inlet lip) rotated so +axial = +z
  const pr=[[r*.55,len*.30],[r*.86,len*.07],[r*.935,0],[r*.99,len*.035],[r,len*.2],[r*.96,len*.45],[r*.8,len*.75],[r*.62,len*.97],[r*.5,len]].map(p=>new V3(p[0],p[1],0));
  const lat=new THREE.LatheGeometry(pr,28);lat.rotateX(Math.PI/2);
  sb.addGeo('paint',lat,M4(ex,e.y,e.z0),0xe6e9ec);
  // inlet lip ring (chrome) + inner dark duct
  sb.addGeo('chrome',new THREE.TorusGeometry(r*.93,r*.035,8,28),M4(ex,e.y,e.z0+.02),0xcfd4d9);
  sb.addGeo('dark',new THREE.CylinderGeometry(r*.86,r*.55,len*.3,24,1,true),M4(ex,e.y,e.z0+len*.15,Math.PI/2,0,0),0x2a2d31);
  // core nozzle + plug
  sb.addGeo('dark',new THREE.CylinderGeometry(r*.5,r*.42,len*.18,20,1,true),M4(ex,e.y,e.z0+len*1.04,Math.PI/2,0,0),0x3b3f45);
  sb.addGeo('dark',new THREE.ConeGeometry(r*.22,r*1.1,16),M4(ex,e.y,e.z0+len*1.05+.15,Math.PI/2,0,0),0x25282c);
  // pylon
  if(!e.rear){sb.bb('paint',ex-.16,e.y+r*.78,e.z0+len*.12,ex+.16,e.y+r*.78+.55,e.z0+len*.96,0xe6e9ec,{ao:1,noBottom:true})}
  else{sb.bb('paint',Math.min(ex*.4,ex)-.001,e.y-.22,e.z0+len*.15,Math.max(ex*.4,ex),e.y+.22,e.z0+len*.85,0xe6e9ec,{ao:1})}}
 // tail cone APU exhaust + belly fairing
 const L=spec.L;sb.addGeo('dark',new THREE.ConeGeometry(.2,.7,12),M4(0,cy+interp(spec.st.map(a=>[a[0],a[2]]),L-.05),-spec.zN+L+.1,Math.PI/2,0,0),0x1c1e21);
 sb.addGeo('paint',new THREE.SphereGeometry(1,16,10),M4(0,cy-spec.rmax*.84,-1.2,0,0,0,spec.rmax*.9,.5,spec.wing.c0*.62),0xcfd3d6);
 b.statGeos=sb.geos();b.legGeos={nose:gearLeg(spec,'nose').geos(),main:gearLeg(spec,'main').geos()};
 b.fanGeo=new THREE.CircleGeometry(e.r*.9,28);b.fanGeo.rotateY(Math.PI);
 b.spinGeo=new THREE.ConeGeometry(e.r*.2,e.r*.5,14);b.spinGeo.rotateX(-Math.PI/2);
 return b}
function gearLeg(spec,kind){const gp=spec.gear,sb=new SB();const g=kind==='nose'?gp.nose:gp.main,len=g.y-g.r;
 sb.addGeo('paint',new THREE.CylinderGeometry(spec.gear.leg,spec.gear.leg*1.1,len*.55,10),M4(0,-len*.27,0),0xd4d8dc);
 sb.addGeo('chrome',new THREE.CylinderGeometry(spec.gear.leg*.72,spec.gear.leg*.72,len*.55,10),M4(0,-len*.72,0),0xdfe3e7);
 sb.addGeo('dark',new THREE.BoxGeometry(.08,len*.35,.14),M4(.0,-len*.45,-.2),0x3a3f45);
 sb.addGeo('dark',new THREE.CylinderGeometry(.05,.05,g.sep*2+g.w*.5,8),M4(0,-len,0,0,0,Math.PI/2),0x2a2d31);
 return sb}
let cyl=null;
function wheelGroup(r,w){const grp=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,22).rotateZ(Math.PI/2),TIRE);t.castShadow=true;grp.add(t);
 const h=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,w*1.04,16).rotateZ(Math.PI/2),HUB);grp.add(h);
 const sp=new THREE.Mesh(new THREE.BoxGeometry(w*1.06,r*.12,r*1.05),HUB);grp.add(sp);return grp}
function glowSprite(col,size){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlow(),color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));m.scale.setScalar(size);return m}

// ---------- instance ----------
export function makeAircraft(type,opts={}){const spec=SPECS[type];let base=baseCache[type];if(!base)base=baseCache[type]=buildBase(spec);
 const airline=opts.airline||(type==='biz'?'vip':'neon'),mt=liveryMats(spec,type,airline);
 const g=new THREE.Group();const add=(geo,mat,cast=true)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=true;g.add(m);return m};
 add(base.hull,mt.hull);for(const w of base.wings)add(w,wingMat());for(const w of base.winglets)add(w,wingMat());add(base.fin,mt.fin);for(const s of base.stabs)add(s,wingMat());
 g.add(sbGroup(base.statGeos));
 // fans (rotating)
 const fans=[],e=spec.eng;for(const sx of[-1,1]){const fg=new THREE.Group();fg.position.set(sx*e.x,e.y,e.z0+e.len*.2);const fm=new THREE.Mesh(base.fanGeo,new THREE.MeshStandardMaterial({map:getFanTex(),roughness:.5,metalness:.6}));fg.add(fm);const sp=new THREE.Mesh(base.spinGeo,DARK);sp.position.z=-e.r*.22;fg.add(sp);g.add(fg);fans.push(fg)}
 // landing gear
 const gp=spec.gear,wheels=[],mkLeg=(kind,x,z)=>{const gg=kind==='nose'?gp.nose:gp.main,grp=new THREE.Group();grp.position.set(x,gg.y,z);const legs=sbGroup(base.legGeos[kind]);grp.add(legs);
  const len=gg.y-gg.r,twin=true;for(const s of[-1,1]){const w=wheelGroup(gg.r,gg.w);w.position.set(s*gg.sep,-len,0);grp.add(w);wheels.push({o:w,r:gg.r})}g.add(grp);return grp};
 const gear={nose:mkLeg('nose',0,gp.nose.z),mainL:mkLeg('main',-gp.main.x,gp.main.z),mainR:mkLeg('main',gp.main.x,gp.main.z)};
 let gk=0;
 // lights
 const lt=spec.lights,lights=[];const addLight=(col,x,y,z,size,kind)=>{const core=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:col}));core.position.set(x,y,z);g.add(core);const gl=glowSprite(col,size);gl.position.set(x,y,z);g.add(gl);lights.push({core,gl,kind,col});return core};
 addLight(0xff2020,-lt.tip,lt.tipY,lt.tipZ,3.2,'nav');addLight(0x20ff50,lt.tip,lt.tipY,lt.tipZ,3.2,'nav');
 addLight(0xffffff,-lt.tip,lt.tipY+.05,lt.tipZ+.55,4.6,'strobe');addLight(0xffffff,lt.tip,lt.tipY+.05,lt.tipZ+.55,4.6,'strobe');addLight(0xffffff,0,lt.tailY,lt.tailZ,3.6,'strobe2');
 addLight(0xff2a2a,...lt.beaconTop,3.4,'beacon');addLight(0xff2a2a,...lt.beaconBot,3.4,'beacon');
 const hull=mt.hull,m={g,gear,fans,wheels,lights,spec,L:spec.L,zN:spec.zN,gearH:0,doorLocal:spec.doorLocal,hullMat:hull,
  setGear(k){gk=k;const up=clamp(k,0,1),a=up*Math.PI/2;gear.nose.rotation.x=a;gear.mainL.rotation.z=a;gear.mainR.rotation.z=-a;const v=up<.97;gear.nose.visible=gear.mainL.visible=gear.mainR.visible=v},
  get gearK(){return gk},
  tick(dt,st){const t=G.t||0;const night=G.night||0,flying=st.airborne,eng=st.engines!==false;
   hull.emissiveIntensity=clamp(night*1.2,0,1.2);
   for(const f of fans)f.rotation.z+=dt*(eng?(st.speed>1||st.airborne?60:22):0);
   if(!st.airborne&&st.speed>.3){for(const w of wheels)w.o.rotation.x-=st.speed*dt/w.r}
   const vis=night>.04||flying?1:.0;
   for(const l of lights){let on=eng;if(l.kind==='strobe'||l.kind==='strobe2'){const p=(t*1.0+(l.kind==='strobe2'?.5:0))%1.15;on=eng&&(p<.07||(p>.17&&p<.24))&&(flying||st.speed>2)}else if(l.kind==='beacon'){on=eng&&((t*.9)%1<.4)}else if(l.kind==='nav'){on=eng}
    l.core.visible=on||false;l.gl.material.opacity=on?(.35+.65*clamp(night*1.4+(flying?.35:0),0,1))*(l.kind==='nav'?.7:1):0}}};
 m.setGear(0);g.traverse(o=>{o.frustumCulled=true});return m}
export const PLANE_SPECS=SPECS;
