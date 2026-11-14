import * as THREE from 'three';
export {THREE};
const __SELF=(typeof document!=='undefined'&&document.currentScript)?document.currentScript.textContent:null;
export const PITCH=90, ROAD=16, HR=8, PLOT=37, SEA=-0.9, CURB=0.12, GRIDN=4;
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const TAU=Math.PI*2;
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function hash2(i,j,s=0){let h=Math.imul((i*374761393+j*668265263+s*1442695041)|0,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
export function strHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export const G={downloadGame(){if(!__SELF){G.notify&&G.notify('Download is only available from the packaged HTML file');return}const head='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>NEON CITY 2030 — REAL CITY 2.0 Luxury Life</title></head><body>\n';const blob=new Blob([head+'<script>'+__SELF+'<\/script></body></html>'],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='NEON_CITY_2030.html';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);G.notify&&G.notify('⬇ Game downloaded — open NEON_CITY_2030.html offline')},tp:{},specials:{},vehicles:[],keys:{},cash:25000,bank:1500000,health:100,wanted:0,owned:[],admin:false,daylight:1,night:0,hour:8,weather:'clear',rain:0,paused:true,modal:false,player:null,active:null,interact:[],noticeT:0,trafficDensity:1,outfit:0,fov:68};

export const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.body.appendChild(renderer.domElement);
export const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bbbd0);scene.fog=new THREE.Fog(0x9bbbd0,90,720);
export const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,3200);
scene.add(camera);

const _c=new THREE.Color();const ccache=new Map();
export function C(hex){let v=ccache.get(hex);if(!v){_c.set(hex);v=[_c.r,_c.g,_c.b];ccache.set(hex,v)}return v}
export function canvasTex(w,h,draw,opt={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=opt.linear?THREE.NoColorSpace:THREE.SRGBColorSpace;t.wrapS=t.wrapT=opt.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}

// ---------- procedural textures ----------
const rr=mulberry32(77);
const winLit=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)winLit.push(rr()<.5?(rr()<.7?'#ffd9a0':'#bfe0ff'):null);
export const winTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#e6e9ec';x.fillRect(0,0,w,h);
 for(let i=0;i<900;i++){x.fillStyle=`rgba(${120+rr()*100|0},${120+rr()*100|0},${120+rr()*100|0},.08)`;x.fillRect(rr()*w,rr()*h,2,2)}
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const X=c*64+8,Y=r*64+7;x.fillStyle='#b8bdc2';x.fillRect(X-2,Y-2,52,50);const g=x.createLinearGradient(X,Y,X,Y+46);g.addColorStop(0,'#5f86a8');g.addColorStop(.5,'#243b52');g.addColorStop(1,'#16283a');x.fillStyle=g;x.fillRect(X,Y,48,46);x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.moveTo(X,Y);x.lineTo(X+22,Y);x.lineTo(X,Y+26);x.fill();x.fillStyle='#9aa0a6';x.fillRect(X,Y+22,48,2)}
 x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,0,w,3);});
export const winEmis=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++){const l=winLit[r*4+c];if(l){x.fillStyle=l;x.fillRect(c*64+8,r*64+7,48,46)}}});
export const roadTex=canvasTex(128,256,(x,w,h)=>{x.fillStyle='#2c3036';x.fillRect(0,0,w,h);
 for(let i=0;i<5000;i++){const v=30+rr()*40|0;x.fillStyle=`rgba(${v},${v},${v+3},.5)`;x.fillRect(rr()*w,rr()*h,1.5,1.5)}
 x.fillStyle='rgba(20,20,22,.35)';x.fillRect(24,0,16,h);x.fillRect(88,0,16,h);
 x.fillStyle='#d9d8cf';x.fillRect(4,0,3,h);x.fillStyle='#d9d8cf';for(let y=0;y<h;y+=64)x.fillRect(63,y,2.5,40);
 x.fillStyle='#d6b02e';x.fillRect(121,0,2.5,h);x.fillRect(126,0,2.5,h);});
roadTex.wrapS=THREE.ClampToEdgeWrapping;
export const plainRoadTex=canvasTex(64,64,(x,w,h)=>{x.fillStyle='#2c3036';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=30+rr()*40|0;x.fillStyle=`rgba(${v},${v},${v+3},.6)`;x.fillRect(rr()*w,rr()*h,1.5,1.5)}});
const R2=mulberry32(4242);
export const plankTex=canvasTex(256,256,(x,w,h)=>{for(let p=0;p<6;p++){const y0=p*42.67,b=185+R2()*35;x.fillStyle=`rgb(${b},${b*.8|0},${b*.58|0})`;x.fillRect(0,y0,w,43);
  for(let g=0;g<26;g++){x.strokeStyle=`rgba(80,50,25,${.05+R2()*.12})`;x.lineWidth=1;const yy=y0+R2()*40;x.beginPath();x.moveTo(0,yy);x.bezierCurveTo(70,yy+R2()*4-2,150,yy+R2()*4-2,256,yy+R2()*3-1.5);x.stroke()}
  const sx=R2()*256;x.fillStyle='rgba(50,30,15,.55)';x.fillRect(sx,y0,1.5,43);x.fillStyle='rgba(40,25,10,.7)';x.fillRect(0,y0,256,1.5)}});
export const marbleTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#ecebe6';x.fillRect(0,0,w,h);for(let v=0;v<26;v++){x.strokeStyle=`rgba(${110+R2()*40|0},${115+R2()*40|0},${125+R2()*40|0},${.06+R2()*.16})`;x.lineWidth=.6+R2()*1.8;x.beginPath();let px=R2()*256,py=0;x.moveTo(px,py);for(let k=0;k<6;k++){px+=R2()*70-35;py+=45;x.lineTo(px,py)}x.stroke()}
  x.strokeStyle='rgba(90,90,90,.55)';x.lineWidth=1.5;x.strokeRect(0,0,128,128);x.strokeRect(128,128,128,128);x.strokeRect(128,0,128,128);x.strokeRect(0,128,128,128)});
export const stuccoTex=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#efece6';x.fillRect(0,0,w,h);for(let i=0;i<1800;i++){const v=205+R2()*45|0;x.fillStyle=`rgba(${v},${v-3},${v-8},.28)`;x.fillRect(R2()*w,R2()*h,2,2)}x.fillStyle='rgba(120,115,105,.18)';x.fillRect(0,0,w,1.5)});
export const brickTex=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#b9b0a4';x.fillRect(0,0,w,h);for(let r=0;r<8;r++){const off=(r%2)*16;for(let c=-1;c<5;c++){const v=R2()*40;x.fillStyle=`rgb(${165+v|0},${78+v*.5|0},${58+v*.4|0})`;x.fillRect(c*32+off+1,r*16+1,30,14);x.fillStyle='rgba(0,0,0,.08)';x.fillRect(c*32+off+1,r*16+11,30,4)}}});
const lblCache=new Map();
export function labelTex(text,bg='#0b1c2b',fg='#7df0ff',w=512,h=128,font='bold 64px Arial'){const k=text+bg+fg;let t=lblCache.get(k);if(t)return t;
 t=canvasTex(w,h,(x)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=6;x.strokeRect(5,5,w-10,h-10);x.fillStyle=fg;x.font=font;x.textAlign='center';x.textBaseline='middle';
  let f=64;x.font=`bold ${f}px Arial`;while(x.measureText(text).width>w-40&&f>14){f-=4;x.font=`bold ${f}px Arial`}x.fillText(text,w/2,h/2+3)},{clamp:true});lblCache.set(k,t);return t}
export const blobTex=canvasTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h)},{clamp:true});
export const cloudTex=canvasTex(128,64,(x,w,h)=>{for(let i=0;i<14;i++){const cx=20+Math.random()*88,cy=26+Math.random()*14,r=12+Math.random()*16;const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}},{clamp:true});

// ---------- materials ----------
const envList=[];
export function std(o){const m=new THREE.MeshStandardMaterial(o);envList.push(m);return m}
export function phys(o){const m=new THREE.MeshPhysicalMaterial(o);envList.push(m);return m}
export function setEnvIntensity(v){for(const m of envList)m.envMapIntensity=v}
export const M={
 wood:std({vertexColors:true,map:plankTex,roughness:.5}),
 marble:std({vertexColors:true,map:marbleTex,roughness:.18,metalness:.05}),
 wall:std({vertexColors:true,map:stuccoTex,roughness:.92}),
 brick:std({vertexColors:true,map:brickTex,roughness:.9}),
 solid:std({vertexColors:true,roughness:.78,metalness:.04}),
 metal:std({vertexColors:true,roughness:.32,metalness:.85}),
 win:std({vertexColors:true,map:winTex,emissiveMap:winEmis,emissive:0xffffff,emissiveIntensity:0,roughness:.22,metalness:.55}),
 glass:std({vertexColors:true,transparent:true,opacity:.42,roughness:.03,metalness:.92,depthWrite:false}),
 road:std({map:roadTex,roughness:.9}),
 plainroad:std({map:plainRoadTex,roughness:.9}),
 ground:std({vertexColors:true,roughness:.95}),
 emis:new THREE.MeshBasicMaterial({vertexColors:true}),
 emisN:new THREE.MeshBasicMaterial({vertexColors:true}),
 lampglow:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}),
};
M.road.map.anisotropy=8;
const SHADOW={wood:[0,1],marble:[0,1],wall:[1,1],brick:[1,1],solid:[1,1],win:[1,1],metal:[1,1],glass:[0,1],road:[0,1],plainroad:[0,1],ground:[0,1],emis:[0,0],emisN:[0,0],lampglow:[0,0]};

// ---------- static geometry builder (merged chunks) ----------
export class SB{
 constructor(){this.c={}}
 ch(k){let c=this.c[k];if(!c)c=this.c[k]={p:[],n:[],u:[],c:[],i:[]};return c}
 quad(k,A,B,Cc,D,nx,ny,nz,col,uv,m){const ch=this.ch(k),o=ch.p.length/3,V=[A,B,Cc,D];
  for(let q=0;q<4;q++){const v=V[q],mm=m?m[q]:1;ch.p.push(v[0],v[1],v[2]);ch.n.push(nx,ny,nz);ch.c.push(col[0]*mm,col[1]*mm,col[2]*mm)}
  if(uv)ch.u.push(uv[0],uv[1],uv[2],uv[1],uv[2],uv[3],uv[0],uv[3]);else ch.u.push(0,0,1,0,1,1,0,1);
  ch.i.push(o,o+1,o+2,o,o+2,o+3)}
 box(k,cx,cy,cz,w,h,d,hex,o){return this.bb(k,cx-w/2,cy-h/2,cz-d/2,cx+w/2,cy+h/2,cz+d/2,hex,o)}
 bb(k,x0,y0,z0,x1,y1,z1,hex,o={}){
  const col=C(hex),ao=o.ao??(y0<1.2?.78:1),m=[ao,ao,1,1],su=o.su||1/3.6,sv=o.sv||1/3.8,uo=o.uo||0,vo=o.vo||0;
  const top=o.top||k,rc=o.rc!=null?C(o.rc):col.map(v=>v*.8);
  const v0=y0*sv+vo,v1=y1*sv+vo;
  this.quad(k,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0,col,[z1*su+uo,v0,z0*su+uo,v1],m);
  this.quad(k,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0,col,[z0*su+uo,v0,z1*su+uo,v1],m);
  this.quad(k,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1,col,[x0*su+uo,v0,x1*su+uo,v1],m);
  this.quad(k,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1,col,[x1*su+uo,v0,x0*su+uo,v1],m);
  if(!o.noTop){const tu=o.tu||.5;this.quad(top,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,rc,[x0*tu,z1*tu,x1*tu,z0*tu])}
  if(!o.noBottom&&Math.abs(y0)>.05)this.quad(top,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],0,-1,0,rc)}
 flat(k,x0,z0,x1,z1,y,hex,uv){this.quad(k,[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],0,1,0,C(hex),uv)}
 cyl(k,cx,y0,cz,rb,rt,h,hex,seg=10,o={}){const ch=this.ch(k),col=C(hex);
  for(let s=0;s<seg;s++){const a0=s/seg*TAU,a1=(s+1)/seg*TAU,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),b=ch.p.length/3;
   ch.p.push(cx+c0*rb,y0,cz+s0*rb,cx+c1*rb,y0,cz+s1*rb,cx+c1*rt,y0+h,cz+s1*rt,cx+c0*rt,y0+h,cz+s0*rt);
   const sl=(rb-rt)/Math.max(h,.001);ch.n.push(c0,sl,s0,c1,sl,s1,c1,sl,s1,c0,sl,s0);
   for(let q=0;q<4;q++)ch.c.push(col[0]*(q<2?(o.ao||.85):1),col[1]*(q<2?(o.ao||.85):1),col[2]*(q<2?(o.ao||.85):1));
   ch.u.push(0,0,1,0,1,1,0,1);ch.i.push(b,b+1,b+2,b,b+2,b+3)}
  if(rt>0&&!o.noTop){const b=ch.p.length/3;ch.p.push(cx,y0+h,cz);ch.n.push(0,1,0);ch.c.push(col[0],col[1],col[2]);ch.u.push(.5,.5);
   for(let s=0;s<=seg;s++){const a=s/seg*TAU;ch.p.push(cx+Math.cos(a)*rt,y0+h,cz+Math.sin(a)*rt);ch.n.push(0,1,0);ch.c.push(col[0],col[1],col[2]);ch.u.push(0,0)}
   for(let s=0;s<seg;s++)ch.i.push(b,b+2+s,b+1+s)}}
 addGeo(k,geo,mtx,hex){const ch=this.ch(k),o=ch.p.length/3,pos=geo.attributes.position,nor=geo.attributes.normal,uv=geo.attributes.uv,cl=geo.attributes.color;
  const v=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(mtx),col=hex!=null?C(hex):[1,1,1];
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(mtx);ch.p.push(v.x,v.y,v.z);
   if(nor){v.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();ch.n.push(v.x,v.y,v.z)}else ch.n.push(0,1,0);
   ch.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
   if(cl)ch.c.push(cl.getX(i)*col[0],cl.getY(i)*col[1],cl.getZ(i)*col[2]);else ch.c.push(col[0],col[1],col[2])}
  if(geo.index){for(let i=0;i<geo.index.count;i++)ch.i.push(geo.index.getX(i)+o)}else for(let i=0;i<pos.count;i++)ch.i.push(o+i)}
 geos(){const out={};for(const k in this.c){const ch=this.c[k];if(!ch.p.length)continue;const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(ch.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(ch.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(ch.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(ch.c,3));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(ch.i),1));g.computeBoundingSphere();g.computeBoundingBox();out[k]=g}return out}
 build(parent){const gs=this.geos(),ms=[];for(const k in gs){const m=new THREE.Mesh(gs[k],M[k]||M.solid);const s=SHADOW[k]||[1,1];m.castShadow=!!s[0];m.receiveShadow=!!s[1];
  if(k==='glass')m.renderOrder=2;parent.add(m);ms.push(m)}return ms}
}
// pre-multiplied helper for tinting colors
export function shade(hex,f){const c=new THREE.Color(hex);c.multiplyScalar(f);return c.getHex()}
export function dispose(obj){obj.traverse(o=>{if(o.geometry&&!o.userData.shared)o.geometry.dispose()})}
export function onResize(fn){addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);fn&&fn()})}
