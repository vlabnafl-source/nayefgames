import {THREE,SB,C,G,M,scene,labelTex,clamp,shade,TAU,CURB,canvasTex} from './core.js';
import {Col,Inter,subtractRects,groundH} from './world.js';
import {Lamps} from './sky.js';
import {People} from './peds.js';

export const PAL={wall:0xe9e4da,wall2:0xcfd6dc,floor:0xb9a98f,marble:0xe8e6e0,dark:0x24282e,wood:0x7a5636,steel:0x9aa3ad,gold:0xd5a94f,glass:0x9fd0e6,white:0xf3f3f1,black:0x15171b,red:0xc0392b,green:0x3f8f5a,blue:0x2e6fb5};
const planeG=new THREE.PlaneGeometry(1,1);
export function sign(ctx,text,x,y,z,w,h,yaw,bg,fg){const m=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:labelTex(text,bg||'#0b1c2b',fg||'#7df0ff',512,Math.round(512*h/w)||128),toneMapped:false}));m.scale.set(w,h,1);m.position.set(x,y,z);m.rotation.y=yaw;ctx.add(m);return m}
export function lampAt(ctx,x,y,z,color=0xffe0b0,inten=240,vis=true){Lamps.add(ctx.owner,x,y,z,color,inten);if(vis)ctx.sb.box('emisN',x,y,z,.5,.08,.5,color)}
export function tree(sb,x,z,s=1,y0=0){const g=treeGeo;sb.cyl('solid',x,y0,z,.22*s,.3*s,2.6*s,0x5b4330,6);const m=new THREE.Matrix4();
 for(const[dx,dy,dz,r]of[[0,3.4,0,1.7],[.9,2.8,.4,1.2],[-.8,3,-.5,1.3],[.2,4.3,-.2,1.2]]){m.compose(new THREE.Vector3(x+dx*s,y0+dy*s,z+dz*s),new THREE.Quaternion(),new THREE.Vector3(r*s,r*s*.9,r*s));sb.addGeo('solid',g,m,[0x2f6b45,0x3a7a4a,0x2a5f3d][(Math.abs(x*7+z*3)|0)%3])}}
const treeGeo=new THREE.IcosahedronGeometry(1,1);
export function palm(sb,x,z,s=1,y0=0){sb.cyl('solid',x,y0,z,.2*s,.3*s,6*s,0x8a6a45,6);const m=new THREE.Matrix4(),g=new THREE.BoxGeometry(.5,.05,3);for(let k=0;k<7;k++){const a=k/7*TAU;m.compose(new THREE.Vector3(x+Math.cos(a)*1.2*s,y0+6*s,z+Math.sin(a)*1.2*s),new THREE.Quaternion().setFromEuler(new THREE.Euler(.5,-a+Math.PI/2,0,'YXZ')),new THREE.Vector3(s,s,s));sb.addGeo('solid',g,m,0x3c8c4a)}}
export class Frame{
 constructor(ctx,side,fx,fz){this.ctx=ctx;this.sb=ctx.sb;this.side=side;this.fx=fx;this.fz=fz;this.yaw={S:0,N:Math.PI,E:Math.PI/2,W:-Math.PI/2}[side];this.owner=ctx.owner;this.wk='solid';this.trim=0}
 p(u,v){const{fx,fz}=this;switch(this.side){case'S':return[fx+u,fz-v];case'N':return[fx-u,fz+v];case'E':return[fx-v,fz+u];default:return[fx+v,fz-u]}}
 r(u0,v0,u1,v1){const a=this.p(u0,v0),b=this.p(u1,v1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]}
 ang(du,dv){const a=this.p(0,0),b=this.p(du,dv);return Math.atan2(b[0]-a[0],b[1]-a[1])}
 box(key,u0,v0,u1,v1,y0,y1,color,col,o){const[x0,z0,x1,z1]=this.r(u0,v0,u1,v1);this.sb.bb(key,x0,y0,z0,x1,y1,z1,color,o);if(col)Col.addBox(this.owner,x0,z0,x1,z1,y0,y1);return[x0,z0,x1,z1]}
 fb(u,v,w,d,y0,h,color,col=true,key='solid'){return this.box(key,u-w/2,v-d/2,u+w/2,v+d/2,y0,y0+h,color,col,{ao:1})}
 floor(u0,v0,u1,v1,y,color,key='solid'){const[x0,z0,x1,z1]=this.r(u0,v0,u1,v1);this.sb.bb(key,x0,y-.04,z0,x1,y,z1,color,{noBottom:true,ao:1,rc:color,tu:.5})}
 // wall along u at depth v. openings in u: {a,b,yb,yt,k:'door'|'win'}
 wallU(v,u0,u1,y0,y1,th,color,ops=[],glassColor=PAL.glass){this._wall(true,v,u0,u1,y0,y1,th,color,ops,glassColor)}
 wallV(u,v0,v1,y0,y1,th,color,ops=[],glassColor=PAL.glass){this._wall(false,u,v0,v1,y0,y1,th,color,ops,glassColor)}
 _wall(alongU,c,a0,a1,y0,y1,th,color,ops,gc){ops=[...ops].sort((p,q)=>p.a-q.a);let cur=a0;const K=this.wk;
  const seg=(s,e,ya,yb,col)=>{if(e-s<.01||yb-ya<.01)return;const r=alongU?this.r(s,c-th/2,e,c+th/2):this.r(c-th/2,s,c+th/2,e);this.sb.bb(K,r[0],ya,r[1],r[2],yb,r[3],color,{ao:y0<1?.8:1,su:1/3.6,sv:1/3.8,top:'solid',rc:color});if(col)Col.addBox(this.owner,r[0],r[1],r[2],r[3],ya,yb);
   if(this.trim&&ya===y0&&yb-ya>2.4&&th<.35){const q=alongU?this.r(s,c-th/2-.025,e,c+th/2+.025):this.r(c-th/2-.025,s,c+th/2+.025,e);this.sb.bb('solid',q[0],ya,q[1],q[2],ya+.13,q[3],0x4a3a2c,{ao:1});this.sb.bb('solid',q[0],yb-.12,q[1],q[2],yb,q[3],0xf4f1ea,{ao:1})}};
  const bar=(a,b,ya,yb)=>{const r=alongU?this.r(a,c-th/2-.03,b,c+th/2+.03):this.r(c-th/2-.03,a,c+th/2+.03,b);this.sb.bb('metal',r[0],ya,r[1],r[2],yb,r[3],0x1b1d22,{ao:1})};
  for(const o of ops){seg(cur,o.a,y0,y1,true);const yb=o.yb??(o.k==='door'?y0:y0+.9),yt=o.yt??(o.k==='door'?y0+2.7:y1-.5);seg(o.a,o.b,y0,yb,true);seg(o.a,o.b,yt,y1,true);
   if(o.k==='win'||o.k==='glass'){const r=alongU?this.r(o.a,c-.03,o.b,c+.03):this.r(c-.03,o.a,c+.03,o.b);this.sb.bb('glass',r[0],yb,r[1],r[2],yt,r[3],gc,{ao:1,noTop:true});Col.addBox(this.owner,r[0],r[1],r[2],r[3],yb,yt);
    if(o.k==='win'){bar(o.a,o.b,yb,yb+.09);bar(o.a,o.b,yt-.09,yt);bar(o.a,o.a+.09,yb,yt);bar(o.b-.09,o.b,yb,yt);const n=Math.max(1,Math.round((o.b-o.a)/2.6));for(let k=1;k<n;k++){const m=o.a+(o.b-o.a)*k/n;bar(m-.04,m+.04,yb,yt)}if(yt-yb>2.2)bar(o.a,o.b,(yb+yt)/2-.03,(yb+yt)/2+.03);bar(o.a-.05,o.b+.05,yb-.07,yb)}}
   else if(o.k==='door'){bar(o.a,o.a+.08,y0,yt);bar(o.b-.08,o.b,y0,yt);bar(o.a,o.b,yt-.08,yt)}
   cur=o.b}seg(cur,a1,y0,y1,true)}
 sign(text,u,y,v,w,h,bg,fg){const[x,z]=this.p(u,v);return sign(this.ctx,text,x,y,z,w,h,this.yaw,bg,fg)}
 lamp(u,y,v,color,inten,vis){const[x,z]=this.p(u,v);lampAt(this.ctx,x,y,z,color,inten,vis)}
 npc(u,v,y,anim,outfit,faceU=0,faceV=-1,extra){const[x,z]=this.p(u,v);return People.addSpawn(this.owner,{x,y,z,h:this.ang(faceU,faceV),anim,outfit,...extra})}
 pace(u0,v0,u1,v1,y,outfit,extra){const a=this.p(u0,v0),b=this.p(u1,v1);return People.addSpawn(this.owner,{x:a[0],y,z:a[1],mode:'pace',pa:a,pb:b,outfit,spd:1.1,...extra})}
 inter(u,v,y,r,text,act){const[x,z]=this.p(u,v);return Inter.add(this.owner,{x,y,z,r,text,act})}
 plant(u,v,y=CURB){const[x,z]=this.p(u,v);this.sb.cyl('solid',x,y,z,.3,.25,.55,0x7a5a40,8);const m=new THREE.Matrix4();m.compose(new THREE.Vector3(x,y+1.0,z),new THREE.Quaternion(),new THREE.Vector3(.55,.7,.55));this.sb.addGeo('solid',treeGeo,m,0x3f8f4a)}
 // roof/ceiling slab with optional zone
 zone(u0,v0,u1,v1,y0,y1){const r=this.r(u0,v0,u1,v1);return Col.addZone(this.owner,r[0],r[1],r[2],r[3],y0,y1)}
}
// floor slab with holes [{x0,z0,x1,z1}], registers walkable surface + camera collider
export function slab(ctx,x0,z0,x1,z1,y,thick,color,holes=[],opt={}){const rects=subtractRects([x0,z0,x1,z1],holes);
 for(const r of rects){ctx.sb.bb(opt.key||'solid',r[0],y-thick,r[1],r[2],y,r[3],color,{ao:1,rc:opt.top??color,top:'solid'});if(opt.ceil!=null)ctx.sb.bb('solid',r[0],y-thick-.03,r[1],r[2],y-thick,r[3],opt.ceil,{ao:1,rc:opt.ceil,noTop:true});if(!opt.noSurf)Col.addSurf(ctx.owner,r[0],r[1],r[2],r[3],y);Col.addBox(ctx.owner,r[0],r[1],r[2],r[3],y-thick,y,{cam:true})}}
export function stairs(ctx,x0,z0,x1,z1,ya,yb,axis,color=0x8c8478,sideCol=true,rail=true){
 const n=Math.max(4,Math.round(Math.abs(yb-ya)/.2)),w=Math.abs(axis==='x'?x1-x0:z1-z0);const lo=Math.min(x0,x1),hi=Math.max(x0,x1),zlo=Math.min(z0,z1),zhi=Math.max(z0,z1);
 for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,y=ya+(yb-ya)*t1,top=Math.max(y,ya+(yb-ya)*t1);
  if(axis==='x'){const a=lo+(hi-lo)*t0,b=lo+(hi-lo)*t1;ctx.sb.bb('solid',a,Math.min(ya,yb)-.2,zlo,b,y,zhi,color,{ao:1})}
  else{const a=zlo+(zhi-zlo)*t0,b=zlo+(zhi-zlo)*t1;ctx.sb.bb('solid',lo,Math.min(ya,yb)-.2,a,hi,y,b,color,{ao:1})}}
 Col.addSurf(ctx.owner,lo,zlo,hi,zhi,ya,yb,axis);
 if(rail){const h=1;if(axis==='x'){for(const z of[zlo+.04,zhi-.04])ctx.sb.bb('metal',lo,Math.min(ya,yb)+h-.02,z-.03,hi,Math.min(ya,yb)+h+.02,z+.03,0xcfd3d8,{ao:1})}}}
export function addCar(sb,geos,x,y,z,h,hex){const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),h),new THREE.Vector3(1,1,1));
 sb.addGeo('metal',geos.body,m,hex);sb.addGeo('glass',geos.glass,m,0x0d1a24);for(const w of geos.wheels){const wm=new THREE.Matrix4().compose(new THREE.Vector3(w.x,w.y,w.z),new THREE.Quaternion(),new THREE.Vector3(1,1,1));sb.addGeo('solid',geos.wheel,m.clone().multiply(wm),null)}}
export const sideOf=(i,j)=>[['S',i*90,j*90+30],['N',i*90,j*90-30],['E',i*90+30,j*90],['W',i*90-30,j*90]];
export function toast(t){G.notify&&G.notify(t)}
// Payment: during a "dry run" (before the player accepts) nothing is charged; the price is only recorded.
export function payAny(n){if(G.dryRun){G.dryCost=(G.dryCost||0)+n;return false}
 if(G.cash>=n){G.cash-=n;G.hud&&G.hud();return true}
 if(G.cash+G.bank>=n){const r=n-G.cash;G.cash=0;G.bank-=r;G.hud&&G.hud();toast(`Paid by card: $${r.toLocaleString()} taken from your bank account.`);return true}
 toast('Not enough money — visit a bank/ATM or use admin.');return false}
export function pay(n){return payAny(n)}
