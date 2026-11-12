import {THREE,SB,C,G,M,canvasTex,clamp,TAU,CURB,PITCH,hash2,mulberry32,shade} from './core.js';
import {Col,registerGen,kinds,subtractRects} from './world.js';
import {Lamps} from './sky.js';
import {Traffic} from './traffic.js';
import {People} from './peds.js';
import {tree,addCar,Frame} from './lib.js';
import {getGeos,DEFS} from './carmodels.js';

export const holeTable={},reserved={};
export const PLOTCOL={park:0x4e7a43,estate:0x4e7a43,parking:0x6e7073,fuel:0x7b7d80,default:0xa9aaa8,plaza:0xb6b2a6,luxrow:0xcfcac0,mall:0xb8b4aa,hospital:0xb9bec2,police:0xa7adb4,bank:0xbdb7aa,burj:0xc9c5bb};
for(const[k,v]of Object.entries({'0,0':'estate','0,1':'luxrow','1,0':'shopsA','-1,0':'shopsB','0,-1':'mall','1,1':'hospital','-1,1':'police','-1,-1':'bank','1,-1':'fuel','0,-2':'burj','2,2':'tower','-2,2':'tower','2,-2':'tower','-2,-2':'tower','2,0':'park','-2,0':'park','0,2':'park'}))kinds[k]=v;
M.lampglow.map=canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,210,150,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},{clamp:true});
const NEON=[0x00e5ff,0xff2bd6,0xb6ff3b,0xff8a1f,0x7a5cff];
const WALL=[0xd9d4c8,0xbfc5cc,0xcfc3ae,0x9fa8b2,0xe4e0d6,0xb7b2a8,0x8e9aa6,0xd8c9b6];
const GLASS=[0x8fb6d8,0x7aa3c6,0x9fc2e0,0x86a8c2,0x6f93b3];
const ro=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
function roads(ctx){const{cx,cz,sb}=ctx,W=[1,1,1];
 const e0=cx+37,e1=cx+45,w0=cx-45,w1=cx-37,z0=cz-37,z1=cz+37,n0=cz-45,n1=cz-37,s0=cz+37,s1=cz+45;
 sb.quad('road',[e0,0,z1],[e1,0,z1],[e1,0,z0],[e0,0,z0],0,1,0,W,[0,z1/16,1,z0/16]);
 sb.quad('road',[w0,0,z1],[w1,0,z1],[w1,0,z0],[w0,0,z0],0,1,0,W,[1,z1/16,0,z0/16]);
 sb.quad('road',[cx+37,0,s1],[cx+37,0,s0],[cx-37,0,s0],[cx-37,0,s1],0,1,0,W,[1,(cx+37)/16,0,(cx-37)/16]);
 sb.quad('road',[cx+37,0,n1],[cx+37,0,n0],[cx-37,0,n0],[cx-37,0,n1],0,1,0,W,[0,(cx+37)/16,1,(cx-37)/16]);
 for(const sx of[-1,1])for(const sz of[-1,1]){const xa=sx>0?cx+37:cx-45,xb=sx>0?cx+45:cx-37,za=sz>0?cz+37:cz-45,zb=sz>0?cz+45:cz-37;sb.quad('plainroad',[xa,0,zb],[xb,0,zb],[xb,0,za],[xa,0,za],0,1,0,W,[0,0,1,1])}
 // crosswalks + stop lines
 const zc=0xe6e6de;for(const sz of[-1,1]){const zz=cz+sz*35.5;for(let x=cx+37.6;x<cx+44.6;x+=1.1){sb.bb('solid',x,0,zz-1.4,x+.5,.03,zz+1.4,zc,{ao:1,noBottom:true});}for(let x=cx-44.6;x<cx-37.6;x+=1.1)sb.bb('solid',x,0,zz-1.4,x+.5,.03,zz+1.4,zc,{ao:1,noBottom:true})}
 for(const sx of[-1,1]){const xx=cx+sx*35.5;for(let z=cz+37.6;z<cz+44.6;z+=1.1)sb.bb('solid',xx-1.4,0,z,xx+1.4,.03,z+.5,zc,{ao:1,noBottom:true});for(let z=cz-44.6;z<cz-37.6;z+=1.1)sb.bb('solid',xx-1.4,0,z,xx+1.4,.03,z+.5,zc,{ao:1,noBottom:true})}
 sb.bb('solid',e0+.2,0,cz+31.6,e1-.2,.03,cz+32.4,zc,{ao:1,noBottom:true});sb.bb('solid',w0+.2,0,cz-32.4,w1-.2,.03,cz-31.6,zc,{ao:1,noBottom:true});
 sb.bb('solid',cx-32.4,0,s0+.2,cx-31.6,.03,s1-.2,zc,{ao:1,noBottom:true});sb.bb('solid',cx+31.6,0,n0+.2,cx+32.4,.03,n1-.2,zc,{ao:1,noBottom:true});
 // signal heads (corner poles)
 const i=ctx.i,j=ctx.j,defs=[[1,1,0,-1,i,j,'z'],[-1,1,1,0,i-1,j,'x'],[1,-1,-1,0,i,j-1,'x'],[-1,-1,0,1,i-1,j-1,'z']];
 for(const[sx,sz,fx,fz,a,b,axis]of defs){const px=cx+sx*38,pz=cz+sz*38;sb.cyl('metal',px,0,pz,.09,.09,5.4,0x2a2d33,6);
  const hx=px+fx*.2,hz=pz+fz*.2;sb.box('solid',hx,5.0,hz,fx?.42:.42,1.05,fz?.42:.42,0x111315,{ao:1});
  Traffic.addHead(ctx.owner,px+fx*.0,5.0,pz+fz*.0,fx,fz,a,b,axis);ctx.cleanup.push(()=>{});}
}
function plot(ctx,col){const{cx,cz,sb}=ctx,hs=holeTable[ctx.key]||[];const r=subtractRects([cx-37,cz-37,cx+37,cz+37],hs);
 for(const q of r)sb.bb('ground',q[0],-.4,q[1],q[2],CURB,q[3],col,{ao:1,top:'ground',rc:col,noBottom:true});
 // curb face darker is automatic via side faces using same colour * ao; add curb strip
}
function lights(ctx){const{cx,cz,sb}=ctx;
 for(const sd of[[0,1],[0,-1],[1,0],[-1,0]]){const[dx,dz]=sd;for(const t of[-24,0,24]){const x=cx+(dx?dx*36:t),z=cz+(dz?dz*36:t);
   // pole + arm toward road
   sb.cyl('metal',x,CURB,z,.1,.14,7.5,0x3a3f46,6);const ax=x+dx*1.9,az=z+dz*1.9;sb.bb('metal',Math.min(x,ax)-.06,7.3,Math.min(z,az)-.06,Math.max(x,ax)+.06,7.5,Math.max(z,az)+.06,0x3a3f46,{ao:1});
   const hx=x+dx*2.6,hz=z+dz*2.6;sb.box('emisN',hx,7.2,hz,.9,.12,.45,0xffe3b0);Lamps.add(ctx.owner,hx,7.0,hz,0xffd9a0,300);
   sb.quad('lampglow',[hx-6,.05,hz+6],[hx+6,.05,hz+6],[hx+6,.05,hz-6],[hx-6,.05,hz-6],0,1,0,C(0xffcf90))}}}
function sideTrees(ctx,skip){const{cx,cz,sb,rnd}=ctx;for(const sd of[[0,1],[0,-1],[1,0],[-1,0]]){for(const t of[-33,-12,12,33]){if(rnd()<.3)continue;const x=cx+(sd[0]?sd[0]*35.4:t),z=cz+(sd[1]?sd[1]*35.4:t);
   if(Math.abs(t)>30)continue;if(skip&&skip(x,z))continue;tree(sb,x,z,.8,CURB)}}}
function box(ctx,x0,z0,x1,z1,h,col,opt={}){const sb=ctx.sb,r=ctx.rnd;sb.bb(opt.key||'win',x0,CURB,z0,x1,h,z1,col,{su:1/3.6,sv:1/3.8,uo:r()*4,vo:r()*4,top:'solid',rc:opt.roof??0x66686b});Col.addBox(ctx.owner,x0,z0,x1,z1,CURB,h)}
function building(ctx,x,z,w,d,h,rnd){const sb=ctx.sb,glass=rnd()<.42,hex=glass?GLASS[Math.floor(rnd()*GLASS.length)]:WALL[Math.floor(rnd()*WALL.length)];
 const st=rnd();let top=h;
 if(h>55&&st<.45){const h0=7+rnd()*5;box(ctx,x-w/2,z-d/2,x+w/2,z+d/2,h0,shade(hex,.8));const tw=w*.68,td=d*.68;box(ctx,x-tw/2,z-td/2,x+tw/2,z+td/2,h,hex);
   // podium roof trim
  }else if(h>40&&st<.7){const h1=h*.62;box(ctx,x-w/2,z-d/2,x+w/2,z+d/2,h1,hex);box(ctx,x-w*.34,z-d*.34,x+w*.34,z+d*.34,h,shade(hex,1.05))}
  else box(ctx,x-w/2,z-d/2,x+w/2,z+d/2,h,hex);
 // roof gear
 const rx=x+(rnd()-.5)*w*.3,rz=z+(rnd()-.5)*d*.3;sb.bb('solid',rx-2,top,rz-1.5,rx+2,top+1.6,rz+1.5,0x7d8084,{ao:1});if(rnd()<.35)sb.cyl('metal',x,top,z,.15,.15,6+rnd()*10,0xb0b5ba,5);
 if(h>35&&rnd()<.55){const nc=NEON[Math.floor(rnd()*NEON.length)];const t2=h>55&&st<.45?h:h;sb.bb('emisN',x-w*.34-.05,t2-1.2,z-d*.34-.05,x+w*.34+.05,t2-.7,z+d*.34+.05,nc,{ao:1,noBottom:true,top:'emisN'})}}
function house(ctx,x,z,w,d,h,rnd){const hex=[0xe8dccb,0xd9c7a8,0xcbd3d8,0xe5e0d6,0xc9a98a][Math.floor(rnd()*5)];box(ctx,x-w/2,z-d/2,x+w/2,z+d/2,h,hex,{roof:0x7a4a3a});
 const sb=ctx.sb;sb.bb('solid',x-w/2-.3,h,z-d/2-.3,x+w/2+.3,h+.4,z+d/2+.3,0x6b4a3d,{ao:1});tree(sb,x+w/2+3,z+d/2+2,.7,CURB);tree(sb,x-w/2-3,z-d/2-2,.6,CURB)}
function procedural(ctx,kind){const{cx,cz,rnd,i,j}=ctx,D=Math.max(Math.abs(i),Math.abs(j)),res=reserved[ctx.key]||[];
 const pr=rnd(),isPark=kind==='park'||pr<.1,isPark2=!isPark&&pr<.2;
 if(isPark)return park(ctx);if(isPark2)return parking(ctx);
 const downtown=D<=1||(Math.abs(i)+Math.abs(j))<=3&&D<=2;const mode=rnd();let lots=[];
 const S=D>=4?3:0;
 if(mode<.3)lots=[[cx,cz,54,54]];else if(mode<.6)lots=[[cx-15,cz,26,54],[cx+15,cz,26,54]];else lots=[[cx-15,cz-15,26,26],[cx+15,cz-15,26,26],[cx-15,cz+15,26,26],[cx+15,cz+15,26,26]];
 for(const[x,z,w,d]of lots){const rect=[x-w/2,z-d/2,x+w/2,z+d/2];if(res.some(q=>ro(rect,q)))continue;
  let h=downtown?45+rnd()*85:D===2?28+rnd()*50:D===3?16+rnd()*30:6+rnd()*14;
  if(D>=4&&w<30){house(ctx,x,z,w-8,d-8,5+rnd()*3,rnd);continue}
  building(ctx,x,z,w-(w>40?0:0),d,h,rnd)}
 sideTrees(ctx,(x,z)=>res.some(q=>x>q[0]-1&&x<q[2]+1&&z>q[1]-1&&z<q[3]+1))}
function park(ctx){const{cx,cz,sb,rnd}=ctx;
 sb.flat('ground',cx-8,cz-8,cx+8,cz+8,CURB+.02,0x3d7fb0);sb.bb('ground',cx-9,CURB,cz-9,cx+9,CURB+.1,cz-8,0x9a8f80,{ao:1});sb.bb('ground',cx-9,CURB,cz+8,cx+9,CURB+.1,cz+9,0x9a8f80,{ao:1});sb.bb('ground',cx-9,CURB,cz-8,cx-8,CURB+.1,cz+8,0x9a8f80,{ao:1});sb.bb('ground',cx+8,CURB,cz-8,cx+9,CURB+.1,cz+8,0x9a8f80,{ao:1});
 sb.flat('ground',cx-1.5,cz-36,cx+1.5,cz+36,CURB+.02,0xc9c0a8);sb.flat('ground',cx-36,cz-1.5,cx+36,cz+1.5,CURB+.02,0xc9c0a8);
 for(let k=0;k<26;k++){const x=cx+(rnd()-.5)*66,z=cz+(rnd()-.5)*66;if(Math.abs(x-cx)<11&&Math.abs(z-cz)<11)continue;if(Math.abs(x-cx)<2.5||Math.abs(z-cz)<2.5)continue;tree(sb,x,z,.8+rnd()*.7,CURB)}
 for(const[bx,bz,r]of[[cx+14,cz+2.8,0],[cx-14,cz-2.8,0],[cx+2.8,cz-14,1],[cx-2.8,cz+14,1]]){sb.bb('solid',bx-1,CURB,bz-.3,bx+1,CURB+.5,bz+.3,0x6b4a2f,{ao:1});sb.bb('solid',bx-1,CURB+.5,bz+(r?.3:.3),bx+1,CURB+1.0,bz+.4,0x6b4a2f,{ao:1})}
 // people strolling
 People.addSpawn(ctx.owner,{x:cx+14,y:CURB,z:cz+4,h:0,anim:'idle'});People.addSpawn(ctx.owner,{x:cx-20,y:CURB,z:cz-6,h:2,anim:'talk'});People.addSpawn(ctx.owner,{x:cx-19,y:CURB,z:cz-5,h:-1,anim:'talk'});
 sideTrees(ctx)}
function parking(ctx){const{cx,cz,sb,rnd}=ctx;const geos=getGeos(DEFS.sedan),geosH=getGeos(DEFS.hatch),geosS=getGeos(DEFS.suv);
 for(const zz of[-26,-8,10,28])for(let k=0;k<9;k++){const x=cx-27+k*6.3;sb.bb('solid',x-.06,CURB,cz+zz-3.3,x+.06,CURB+.02,cz+zz+3.3,0xe8e8e0,{ao:1,noBottom:true});if(rnd()<.55){const g=[geos,geosH,geosS][Math.floor(rnd()*3)];addCar(sb,g,x+3.1,CURB,cz+zz,Math.PI/2*(rnd()<.5?1:-1)+0,[0xe5e8ed,0x11151d,0x9d1022,0x153c74,0x777d83,0xf2f0e8,0x2b3a55][Math.floor(rnd()*7)])}}
 sb.bb('win',cx-5,CURB,cz-36+1,cx+5,3.2,cz-30,0x9fb0be,{uo:rnd()*2,top:'solid'});Col.addBox(ctx.owner,cx-5,cz-35,cx+5,cz-30,CURB,3.2);sideTrees(ctx)}
registerGen(function cityGen(ctx){if(!ctx.city)return;const kind=ctx.kind;
 plot(ctx,PLOTCOL[kind]||PLOTCOL.default);roads(ctx);lights(ctx);
 if(!kind||kind==='park'&&false)procedural(ctx,null);else if(kind==='park')park(ctx);
});
export{box as cityBox,building as cityBuilding,house as cityHouse};
