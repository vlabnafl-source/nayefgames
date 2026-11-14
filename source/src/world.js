import {THREE,scene,G,M,SB,C,clamp,lerp,sstep,mulberry32,hash2,PITCH,CURB,SEA,dispose} from './core.js';
import {Lamps} from './sky.js';

export const ISLANDS=[{n:'A',x:850,z:120,rx:170,rz:170},{n:'B',x:1250,z:0,rx:140,rz:420},{n:'C',x:900,z:-330,rx:120,rz:120},{n:'E',x:900,z:500,rx:130,rz:130}];
export const BOUNDS={x0:-1500,x1:1900,z0:-1050,z1:1050};
export const LIMITS={x0:-1e5,x1:2600,z0:-1e5,z1:1e5};
export const isCity=(i,j)=>i<=4&&!(i>=-15&&i<=-5&&j>=-8&&j<=8)&&!(i>=-4&&i<=4&&j>=-12&&j<=-5);
export const okI=(a,b)=>isCity(a,b)&&isCity(a+1,b)&&isCity(a,b+1)&&isCity(a+1,b+1);
export const onUnload=[];
function dynKind(i,j){if(Math.abs(i)<=4&&Math.abs(j)<=4)return null;const h=hash2(i,j,11);return h<.05?'shopsA':h<.09?'shopsB':h<.12?'fuel':h<.14?'bank':h<.155?'mall':h<.25?'park':null}
export const coastX=z=>520+22*Math.sin(z*.008)+14*Math.sin(z*.021+1);
export function terrainH(x,z){let h=0;const d=x-coastX(z);
 if(d>0)h=d<60?-d*.03:-1.8-(d-60)*.05;if(h<-9)h=-9;
 for(const I of ISLANDS){const dx=(x-I.x)/I.rx,dz=(z-I.z)/I.rz;if(Math.abs(dx)>1.5||Math.abs(dz)>1.5)continue;const t=Math.sqrt(dx*dx+dz*dz);let ih=t<.72?0:-(t-.72)*28;if(ih<-9)ih=-9;if(ih>h)h=ih}
 return h}
export function islandT(x,z){let m=9;for(const I of ISLANDS){const dx=(x-I.x)/I.rx,dz=(z-I.z)/I.rz;m=Math.min(m,Math.sqrt(dx*dx+dz*dz))}return m}
const holes=[];
function plotH(x,z){const i=Math.round(x/PITCH),j=Math.round(z/PITCH);if(!isCity(i,j))return 0;const bx=x-i*PITCH,bz=z-j*PITCH;return(Math.abs(bx)<=37&&Math.abs(bz)<=37)?CURB:0}
export function groundH(x,z){for(const h of holes)if(x>h.x0&&x<h.x1&&z>h.z0&&z<h.z1)return -1e9;return terrainH(x,z)+plotH(x,z)}
export function inWater(x,z){return groundH(x,z)<SEA-.25}

const CELL=12,cells=new Map(),own=new Map(),dyn=[],waters=[];
const ck=(a,b)=>(a+2000)*4096+(b+2000);
function cell(a,b,mk){const k=ck(a,b);let c=cells.get(k);if(!c&&mk){c={b:[],s:[],z:[]};cells.set(k,c)}return c}
function eachCell(x0,z0,x1,z1,f){const a0=Math.floor(x0/CELL),a1=Math.floor(x1/CELL),b0=Math.floor(z0/CELL),b1=Math.floor(z1/CELL);for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++)f(cell(a,b,true))}
function rec(owner){let r=own.get(owner);if(!r){r={b:[],s:[],z:[],h:[],i:[],d:[],w:[]};own.set(owner,r)}return r}
export const Col={
 addBox(owner,x0,z0,x1,z1,y0,y1,o){const b={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y0,y1,en:true,cam:!!(o&&o.cam),owner};eachCell(b.x0,b.z0,b.x1,b.z1,c=>c.b.push(b));rec(owner).b.push(b);return b},
 box(owner,cx,cy,cz,w,h,d,o){return Col.addBox(owner,cx-w/2,cz-d/2,cx+w/2,cz+d/2,cy-h/2,cy+h/2,o)},
 addSurf(owner,x0,z0,x1,z1,ya,yb,axis){const s={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),ya,yb:yb??ya,axis:axis||null};eachCell(s.x0,s.z0,s.x1,s.z1,c=>c.s.push(s));rec(owner).s.push(s);return s},
 addZone(owner,x0,z0,x1,z1,y0,y1,type='indoor'){const z={x0,x1,z0,z1,y0,y1,type};eachCell(x0,z0,x1,z1,c=>c.z.push(z));rec(owner).z.push(z);return z},
 addHole(owner,x0,z0,x1,z1){const h={x0,z0,x1,z1};holes.push(h);rec(owner).h.push(h);return h},
 addWater(owner,x0,z0,x1,z1,level){const w={x0,x1,z0,z1,level};waters.push(w);rec(owner).w.push(w);return w},
 waterAt(x,z){for(const w of waters)if(x>w.x0&&x<w.x1&&z>w.z0&&z<w.z1)return w.level;return null},
 addDyn(owner,d){dyn.push(d);rec(owner).d.push(d);return d},
 remove(owner){const r=own.get(owner);if(!r)return;for(const b of r.b)eachCell(b.x0,b.z0,b.x1,b.z1,c=>{const k=c.b.indexOf(b);if(k>=0)c.b.splice(k,1)});
  for(const s of r.s)eachCell(s.x0,s.z0,s.x1,s.z1,c=>{const k=c.s.indexOf(s);if(k>=0)c.s.splice(k,1)});
  for(const z of r.z)eachCell(z.x0,z.z0,z.x1,z.z1,c=>{const k=c.z.indexOf(z);if(k>=0)c.z.splice(k,1)});
  for(const h of r.h){const k=holes.indexOf(h);if(k>=0)holes.splice(k,1)}for(const d of r.d){const k=dyn.indexOf(d);if(k>=0)dyn.splice(k,1)}for(const w of r.w){const k=waters.indexOf(w);if(k>=0)waters.splice(k,1)}
  for(const f of r.i)Inter.list.splice(Inter.list.indexOf(f),1);own.delete(owner)},
 dyn,
 surf(x,z,refY,maxUp,out){let best=groundH(x,z),dy=null;if(best>refY+maxUp)best=-1e9;
  const c=cells.get(ck(Math.floor(x/CELL),Math.floor(z/CELL)));
  if(c)for(const s of c.s){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;let y=s.ya;if(s.axis==='x')y=s.ya+(s.yb-s.ya)*(x-s.x0)/Math.max(s.x1-s.x0,1e-6);else if(s.axis==='z')y=s.ya+(s.yb-s.ya)*(z-s.z0)/Math.max(s.z1-s.z0,1e-6);if(y<=refY+maxUp&&y>best)best=y}
  for(const d of dyn){if(!d.on&&d.on!==undefined)continue;if(x<d.x0||x>d.x1||z<d.z0||z>d.z1)continue;if(d.y<=refY+maxUp&&d.y>best){best=d.y;dy=d}}
  out.y=best;out.dyn=dy;return best},
 // is there a ceiling/solid surface just above (for indoor detection)
 zone(x,y,z){const c=cells.get(ck(Math.floor(x/CELL),Math.floor(z/CELL)));if(c)for(const q of c.z)if(x>=q.x0&&x<=q.x1&&z>=q.z0&&z<=q.z1&&y>=q.y0&&y<=q.y1)return q;return null},
 pushCircle(p,r,feetY,headH=1.75,stepH=.5){let hit=0;const a0=Math.floor((p.x-r)/CELL),a1=Math.floor((p.x+r)/CELL),b0=Math.floor((p.z-r)/CELL),b1=Math.floor((p.z+r)/CELL);
  for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++){const c=cells.get(ck(a,b));if(!c)continue;for(const bx of c.b){if(!bx.en||bx.cam)continue;if(bx.y1<=feetY+stepH||bx.y0>=feetY+headH)continue;
   const cx=clamp(p.x,bx.x0,bx.x1),cz=clamp(p.z,bx.z0,bx.z1);let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;
   if(d2<r*r){hit++;if(d2>1e-8){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r}else{const l=p.x-bx.x0,rr=bx.x1-p.x,t=p.z-bx.z0,bt=bx.z1-p.z,m=Math.min(l,rr,t,bt);if(m===l)p.x=bx.x0-r;else if(m===rr)p.x=bx.x1+r;else if(m===t)p.z=bx.z0-r;else p.z=bx.z1+r}}}}return hit},
 // vehicle OBB point sampling; returns {nx,nz,pen} accumulated or null
 vehicle(v,pts,y0,y1){let ax=0,az=0,n=0;for(let k=0;k<pts.length;k+=2){const px=pts[k],pz=pts[k+1];const c=cells.get(ck(Math.floor(px/CELL),Math.floor(pz/CELL)));if(!c)continue;
   for(const bx of c.b){if(!bx.en||bx.cam)continue;if(bx.y1<y0+.15||bx.y0>y1)continue;if(px<bx.x0||px>bx.x1||pz<bx.z0||pz>bx.z1)continue;
    const l=px-bx.x0,rr=bx.x1-px,t=pz-bx.z0,bt=bx.z1-pz,m=Math.min(l,rr,t,bt);if(m===l)ax-=l+.02;else if(m===rr)ax+=rr+.02;else if(m===t)az-=t+.02;else az+=bt+.02;n++}}
  return n?{x:ax,z:az,n}:null},
 hitSphere(x,y,z,r){const c=cells.get(ck(Math.floor(x/CELL),Math.floor(z/CELL)));if(!c)return null;for(const b of c.b){if(!b.en||b.cam)continue;if(y+r<b.y0||y-r>b.y1)continue;const cx=clamp(x,b.x0,b.x1),cz=clamp(z,b.z0,b.z1);if((x-cx)**2+(z-cz)**2<r*r)return b}return null},
 ray(ox,oy,oz,dx,dy,dz,maxT){let best=maxT;const seen=new Set();const steps=Math.ceil(maxT/(CELL*.6));
  for(let s=0;s<=steps;s++){const t=Math.min(maxT,s*CELL*.6);const a=Math.floor((ox+dx*t)/CELL),b=Math.floor((oz+dz*t)/CELL);
   for(let ia=a-0;ia<=a;ia++){const c=cells.get(ck(ia,b));if(!c||seen.has(c))continue;seen.add(c);
    for(const bx of c.b){if(!bx.en)continue;let t0=0,t1=best;
     for(const [o,d,mn,mx] of [[ox,dx,bx.x0,bx.x1],[oy,dy,bx.y0,bx.y1],[oz,dz,bx.z0,bx.z1]]){if(Math.abs(d)<1e-9){if(o<mn||o>mx){t0=2e9;break}}else{let a1=(mn-o)/d,a2=(mx-o)/d;if(a1>a2){const q=a1;a1=a2;a2=q}t0=Math.max(t0,a1);t1=Math.min(t1,a2);if(t0>t1)break}}
     if(t0<=t1&&t0<best&&t0>0)best=t0}}}return best}
};
export const Inter={list:[],add(owner,o){o.owner=owner;Inter.list.push(o);rec(owner).i.push(o);return o}};
G.interact=Inter.list;

// ---------- chunk manager ----------
const gens=[];export function registerGen(f){gens.push(f)}
export const kinds={};
export const chunks=new Map();G.chunks=chunks;
export function chunkKey(i,j){return i+','+j}
function sub(r,hs){let out=[r];for(const h of hs){const nx=[];for(const q of out){if(h.x1<=q[0]||h.x0>=q[2]||h.z1<=q[1]||h.z0>=q[3]){nx.push(q);continue}
  if(h.z0>q[1])nx.push([q[0],q[1],q[2],h.z0]);if(h.z1<q[3])nx.push([q[0],h.z1,q[2],q[3]]);const z0=Math.max(q[1],h.z0),z1=Math.min(q[3],h.z1);
  if(h.x0>q[0])nx.push([q[0],z0,h.x0,z1]);if(h.x1<q[2])nx.push([h.x1,z0,q[2],z1])}out=nx}return out}
export {sub as subtractRects};
function terrainChunk(ctx){const {cx,cz,sb}=ctx,x0=cx-45,z0=cz-45;
 // detail check
 let flat=true;for(let a=0;a<=4&&flat;a++)for(let b=0;b<=4;b++)if(Math.abs(terrainH(x0+a*22.5,z0+b*22.5))>.001){flat=false;break}
 const n=flat?2:18,st=90/n,pos=[],nor=[],col=[],idx=[];const r=mulberry32(ctx.i*131+ctx.j*7);
 for(let b=0;b<=n;b++)for(let a=0;a<=n;a++){const x=x0+a*st,z=z0+b*st,h=terrainH(x,z);pos.push(x,h,z);
  const e=1.5,hx=terrainH(x+e,z)-terrainH(x-e,z),hz=terrainH(x,z+e)-terrainH(x,z-e);const nl=Math.hypot(hx,2*e,hz);nor.push(-hx/nl,2*e/nl,-hz/nl);
  const t=islandT(x,z),dCoast=x-coastX(z);const sandy=h<-.05||dCoast>-40||t<.8;
  let c1;if(h<-.2){const k=clamp(-h/7,0,1);c1=[.62-.35*k,.55-.22*k,.42-.12*k]}else if(sandy&&(dCoast>-38||t<.78)){c1=[.84,.76,.58]}else{const v=.9+hash2(Math.floor(x/6),Math.floor(z/6))*.2;c1=[.24*v,.4*v,.19*v]}
  const k2=sstep(-45,-22,dCoast);if(h>=-.2&&dCoast<-22&&t>1.2){c1=[c1[0]*(1-k2)+.84*k2,c1[1]*(1-k2)+.76*k2,c1[2]*(1-k2)+.58*k2]}
  col.push(c1[0]*.8,c1[1]*.8,c1[2]*.78)}
 for(let b=0;b<n;b++)for(let a=0;a<n;a++){const i0=b*(n+1)+a;idx.push(i0,i0+n+1,i0+1,i0+1,i0+n+1,i0+n+2)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();
 const m=new THREE.Mesh(g,M.ground);m.receiveShadow=true;ctx.group.add(m)}
function buildChunk(i,j){const key=chunkKey(i,j),owner='c'+key,group=new THREE.Group();
 const ctx={i,j,key,owner,cx:i*PITCH,cz:j*PITCH,sb:new SB(),group,rnd:mulberry32(i*7919+j*104729+13),kind:kinds[key]||dynKind(i,j),cleanup:[],city:isCity(i,j),holes:[],
  has(x,z){return x>=this.cx-45&&x<this.cx+45&&z>=this.cz-45&&z<this.cz+45},
  clip(x0,z0,x1,z1){const a=Math.max(x0,this.cx-45),b=Math.max(z0,this.cz-45),c=Math.min(x1,this.cx+45),d=Math.min(z1,this.cz+45);return(a<c&&b<d)?[a,b,c,d]:null},
  add(o){group.add(o);return o}};
 if(!ctx.city)terrainChunk(ctx);
 const p0=G.pois.length;for(const g of gens)g(ctx);const myPois=G.pois.slice(p0);
 ctx.sb.build(group);scene.add(group);
 const ch={key,i,j,owner,group,ctx,pois:myPois};chunks.set(key,ch);return ch}
function unloadChunk(ch){scene.remove(ch.group);dispose(ch.group);Col.remove(ch.owner);Lamps.remove(ch.owner);for(const f of ch.ctx.cleanup)f();for(const f of onUnload)f(ch.owner);if(ch.pois.length)G.pois=G.pois.filter(p=>!ch.pois.includes(p));chunks.delete(ch.key)}
export const Chunks={R:3,
 update(px,pz,maxBuild=1){const ci=Math.round(px/PITCH),cj=Math.round(pz/PITCH),R=Chunks.R,need=[];
  for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++){const i=ci+a,j=cj+b;if(Math.abs(a)+Math.abs(b)>R+1)continue;need.push([a*a+b*b,i,j])}
  need.sort((p,q)=>p[0]-q[0]);let built=0;for(const [,i,j] of need){if(!chunks.has(chunkKey(i,j))){buildChunk(i,j);built++;if(built>=maxBuild)break}}
  for(const ch of [...chunks.values()]){if(Math.abs(ch.i-ci)>R+1||Math.abs(ch.j-cj)>R+1)unloadChunk(ch)}return built},
 count(){return chunks.size},
 ready(px,pz,r=1){const ci=Math.round(px/PITCH),cj=Math.round(pz/PITCH);for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)if(!chunks.has(chunkKey(ci+a,cj+b)))return false;return true}};
