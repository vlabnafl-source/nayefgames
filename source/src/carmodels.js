import {THREE,SB,strHash,mulberry32,std,phys,M,blobTex} from './core.js';
const V3=THREE.Vector3,IDENT=new THREE.Matrix4();
const M4=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V3(sx,sy,sz));
const D0={L:4.8,W:1.86,roof:1.45,cl:.15,rear:.98,hood:.96,nose:.66,cabS:.17,cabE:.6,rw:.8,ws:.8,wr:.34,ww:.24,of:.9,wb:2.75,cabW:.86,type:'sedan',rim:0xc2c7ce,top:58,acc:11,grip:6.5,steer:.55,brake:22,price:60000,paint:0xdddddd,grille:'std',spoiler:false,doors:'swing'};
export const DEFS={
 tesla:{name:'Tesla Roadster 2030',L:4.3,W:1.95,roof:1.12,cl:.13,rear:.93,hood:.78,nose:.5,cabS:.27,cabE:.62,rw:.5,ws:.7,wr:.35,ww:.27,of:.8,wb:2.7,type:'super',top:80,acc:17,grip:7.8,steer:.5,price:250000,paint:0xc8102e,spoiler:true,grille:'slit',flight:true,doors:'swing',rim:0xdfe3e8},
 lamborghini:{name:'Lamborghini Revuelto',L:4.8,W:2.05,roof:1.13,cl:.12,rear:.92,hood:.72,nose:.44,cabS:.22,cabE:.66,rw:.85,ws:.9,wr:.37,ww:.3,of:.92,wb:2.7,type:'super',top:76,acc:16,grip:8,steer:.48,price:540000,paint:0xf2c200,spoiler:true,grille:'wedge',doors:'scissor',rim:0x23262b},
 bugatti:{name:'Bugatti Chiron',L:4.55,W:2.0,roof:1.2,cl:.13,rear:1.0,hood:.86,nose:.58,cabS:.22,cabE:.6,rw:.9,ws:.9,wr:.38,ww:.3,of:.92,wb:2.7,type:'super',top:92,acc:18,grip:8.2,steer:.46,price:3200000,paint:0x143a8f,spoiler:true,grille:'horseshoe',doors:'swing',rim:0xcfd3d8},
 ferrari:{name:'Ferrari SF90',L:4.7,W:2.0,roof:1.15,cl:.12,rear:.95,hood:.8,nose:.5,cabS:.25,cabE:.62,rw:.85,ws:.9,wr:.36,ww:.29,of:.9,wb:2.7,type:'super',top:78,acc:16.5,grip:8,steer:.48,price:520000,paint:0xd40000,spoiler:true,grille:'slit',doors:'swing',rim:0x2a2c30},
 rolls:{name:'Rolls-Royce Phantom',L:5.75,W:2.0,roof:1.62,cl:.22,rear:1.2,hood:1.18,nose:.86,cabS:.15,cabE:.57,rw:.4,ws:.75,wr:.41,ww:.28,of:1.05,wb:3.5,type:'lux',top:54,acc:9,grip:5.8,steer:.5,price:480000,paint:0x16181d,grille:'rolls',doors:'swing',rim:0xd8dce2},
 mclaren:{name:'McLaren 765LT',L:4.6,W:2.0,roof:1.12,cl:.12,rear:.9,hood:.68,nose:.42,cabS:.3,cabE:.66,rw:.8,ws:.9,wr:.36,ww:.3,of:.9,wb:2.65,type:'super',top:78,acc:16.5,grip:8.2,steer:.48,price:380000,paint:0xff6a00,spoiler:true,grille:'wedge',doors:'scissor',rim:0x25282d},
 porsche:{name:'Porsche 911 Turbo S',L:4.5,W:1.88,roof:1.3,cl:.13,rear:1.02,hood:.8,nose:.58,cabS:.15,cabE:.6,rw:1.0,ws:.8,wr:.35,ww:.28,of:.85,wb:2.65,type:'sport',top:68,acc:14,grip:7.6,steer:.52,price:210000,paint:0x9aa2ab,spoiler:true,grille:'slit',doors:'swing',rim:0xcdd1d6},
 mercedes:{name:'Mercedes-Benz S-Class',L:5.2,W:1.92,roof:1.5,cl:.17,rear:1.03,hood:1.02,nose:.7,cabS:.15,cabE:.6,rw:.85,ws:.85,wr:.36,ww:.25,of:.95,wb:3.1,type:'lux',top:60,acc:10.5,grip:6.2,steer:.54,price:125000,paint:0x0e1013,grille:'star',doors:'swing',rim:0xc9ced5},
 bmw:{name:'BMW M5',L:4.95,W:1.9,roof:1.45,cl:.15,rear:1.0,hood:.98,nose:.66,cabS:.16,cabE:.6,rw:.85,ws:.8,wr:.35,ww:.26,of:.92,wb:2.95,type:'sedan',top:64,acc:12.5,grip:6.9,steer:.55,price:115000,paint:0x1d4ed8,grille:'kidney',doors:'swing',rim:0x2b2e33},
 audi:{name:'Audi RS7',L:5.0,W:1.95,roof:1.42,cl:.15,rear:1.0,hood:.97,nose:.66,cabS:.1,cabE:.6,rw:1.2,ws:.85,wr:.36,ww:.27,of:.93,wb:2.95,type:'sedan',top:66,acc:13,grip:7,steer:.54,price:130000,paint:0x7d8087,grille:'wide',doors:'swing',rim:0xbfc5cc},
 rangerover:{name:'Range Rover Autobiography',L:5.05,W:2.0,roof:1.87,cl:.28,rear:1.3,hood:1.13,nose:.82,cabS:.08,cabE:.62,rw:.25,ws:.9,wr:.43,ww:.3,of:.98,wb:2.95,type:'suv',top:50,acc:9.5,grip:6,steer:.5,price:165000,paint:0x1f3b2c,grille:'wide',doors:'swing',rim:0xc2c7ce},
 cybertruck:{name:'Cybertruck',L:5.85,W:2.03,roof:1.9,cl:.3,rear:1.28,hood:.9,nose:.86,cabS:.1,cabE:.62,rw:1,ws:1,wr:.45,ww:.34,of:.95,wb:3.6,type:'cyber',top:52,acc:11,grip:6.5,steer:.5,price:99000,paint:0x8e949a,grille:'bar',doors:'swing',rim:0x33363b},
 sedan:{name:'City Sedan',type:'sedan',price:28000},
 hatch:{name:'City Hatch',L:4.0,W:1.76,roof:1.5,cl:.15,rear:1.0,hood:.95,nose:.62,cabS:.08,cabE:.55,rw:.55,ws:.85,wr:.31,ww:.2,of:.75,wb:2.5,type:'hatch',top:46,acc:9,price:19000,grille:'std'},
 suv:{name:'City SUV',L:4.7,W:1.9,roof:1.75,cl:.24,rear:1.25,hood:1.1,nose:.78,cabS:.1,cabE:.6,rw:.3,ws:.85,wr:.4,ww:.25,of:.9,wb:2.8,type:'suv',top:46,acc:9,price:42000,grille:'wide'},
 van:{name:'City Van',L:5.2,W:1.95,roof:2.15,cl:.24,rear:1.95,hood:1.15,nose:.8,cabS:.02,cabE:.27,rw:.08,ws:.75,wr:.38,ww:.23,of:.95,wb:3.1,type:'van',top:40,acc:8,price:36000,grille:'wide',cabW:.9},
 taxi:{name:'Taxi',type:'sedan',price:30000,roofSign:true,paint:0xf2c300},
 police:{name:'Police Cruiser',type:'sedan',price:60000,lightbar:true,livery:'police',paint:0xf5f5f5,top:64,acc:14,grip:7.2,steer:.58},
 ambulance:{name:'Ambulance',L:5.4,W:2.0,roof:2.3,cl:.26,rear:2.0,hood:1.2,nose:.85,cabS:.02,cabE:.24,rw:.08,ws:.7,wr:.4,ww:.25,of:.95,wb:3.3,type:'van',top:48,acc:10,price:90000,lightbar:true,livery:'ambulance',paint:0xf6f6f6,grille:'wide',cabW:.9}
};
for(const k in DEFS){DEFS[k]={...D0,...DEFS[k],id:k,key:k}}
export const ALIASES={'rolls-royce':'rolls','rolls royce':'rolls','rollsroyce':'rolls','phantom':'rolls','tesla':'tesla','roadster':'tesla','tesla roadster':'tesla','lambo':'lamborghini','lamborghini':'lamborghini','aventador':'lamborghini','revuelto':'lamborghini','huracan':'lamborghini','bugatti':'bugatti','chiron':'bugatti','veyron':'bugatti','ferrari':'ferrari','sf90':'ferrari','mercedes':'mercedes','mercedes-benz':'mercedes','benz':'mercedes','s-class':'mercedes','merc':'mercedes','bmw':'bmw','m5':'bmw','porsche':'porsche','911':'porsche','range rover':'rangerover','rangerover':'rangerover','range-rover':'rangerover','mclaren':'mclaren','audi':'audi','rs7':'audi','cybertruck':'cybertruck','cyber truck':'cybertruck','truck':'cybertruck','sedan':'sedan','car':'sedan','hatch':'hatch','hatchback':'hatch','suv':'suv','van':'van','taxi':'taxi','cab':'taxi','police':'police','police car':'police','cop':'police','ambulance':'ambulance'};
export function resolveDef(name){const n=(name||'').toLowerCase().trim();if(!n)return null;if(ALIASES[n])return DEFS[ALIASES[n]];
 for(const k in ALIASES)if(n.includes(k))return DEFS[ALIASES[k]];return null}
export function fallbackDef(name){const h=strHash(name.toLowerCase()),r=mulberry32(h),styles=['super','sport','lux','suv','sedan'];const base=DEFS[['lamborghini','porsche','mercedes','rangerover','audi'][Math.floor(r()*5)]];
 const s=.92+r()*.16;const hue=Math.floor(r()*360);const col=new THREE.Color().setHSL(hue/360,.55+r()*.3,.35+r()*.2);
 const L=base.L*s,W=base.W*(.97+r()*.06);return {...base,id:'proc_'+h,key:'proc_'+h,name:name.replace(/\b\w/g,c=>c.toUpperCase()),L,W,wb:base.wb*s,paint:col.getHex(),price:Math.round((80000+r()*400000)/1000)*1000,top:base.top*(.9+r()*.15),procedural:true}}

function bodyShape(d){const {L,cl,rear,hood,nose,wr,of,wb}=d,s=new THREE.Shape(),xf=L-of,xr=L-of-wb,ar=wr+.07,wy=wr,dy=Math.sqrt(Math.max(ar*ar-(cl-wy)*(cl-wy),.0001)),aL=Math.atan2(cl-wy,-dy),aR=Math.atan2(cl-wy,dy);
 s.moveTo(.14,cl);s.lineTo(xr-dy,cl);s.absarc(xr,wy,ar,aL,aR,true);s.lineTo(xf-dy,cl);s.absarc(xf,wy,ar,aL,aR,true);s.lineTo(L-.16,cl);s.quadraticCurveTo(L,cl,L,cl+.16);s.lineTo(L,nose-.08);
 if(d.type==='cyber'){const T=d.top2;s.lineTo(L,nose);for(const p of T)s.lineTo(p[0],p[1]);s.lineTo(0,d.rear-.2)}
 else{s.quadraticCurveTo(L,nose,L-.3,nose+.05);const hx=d.cabE*L;s.quadraticCurveTo((L-.3+hx)/2,nose+.05+(hood-nose-.05)*.3,hx,hood);s.lineTo(d.cabS*L,rear);s.lineTo(.25,rear);s.quadraticCurveTo(0,rear,0,rear-.2)}
 s.lineTo(0,cl+.16);s.quadraticCurveTo(0,cl,.14,cl);return s}
function cabinShape(d){const {L,rear,hood,roof,cabS,cabE}=d,xr=cabS*L,xf=cabE*L,Lc=xf-xr,rw=Math.min(d.rw,Lc*.5),ws=Math.min(d.ws,Lc*.46),s=new THREE.Shape();
 s.moveTo(xr,rear-.04);s.quadraticCurveTo(xr+rw*.2,roof-.01,xr+rw,roof);s.lineTo(xf-ws,roof);s.lineTo(xf,hood-.04);s.lineTo(xr,rear-.04);return {s,xr,xf,rw,ws}}
const geoCache=new Map();
export function getGeos(def){let g=geoCache.get(def.key);if(g)return g;const d=def,{L,W,roof,cl,rear,hood,nose,wr,ww,of,wb}=d,sb=new SB(),zOf=x=>L/2-x;
 if(d.type==='cyber'){d.top2=[[L*.62,1.25],[L*.45,1.28]];d.top2=[[L*.7,1.12],[L*.2,1.28]]}
 const eg=(shape,depth,bv)=>{const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,curveSegments:10});g.translate(-L/2,0,-depth/2);g.rotateY(Math.PI/2);return g};
 sb.addGeo('body',eg(bodyShape(d),W-.14,.07),IDENT,0xffffff);
 const cb=cabinShape(d),cw=W*d.cabW;
 if(d.type==='cyber'){
  const cs=new THREE.Shape();cs.moveTo(L*.74,1.1);cs.lineTo(L*.5,1.92);cs.lineTo(L*.27,1.9);cs.lineTo(L*.08,1.3);cs.lineTo(L*.74,1.1);
  sb.addGeo('body',eg(cs,cw-.1,.03),IDENT,0xffffff);
  for(const sx of[-1,1])sb.box('glass',sx*(cw/2-.04),1.55,zOf(L*.4),.04,.5,L*.22,0x0b141c);
  sb.box('glass',0,1.5,zOf(L*.6),cw*.9,.04,.9,0x0b141c);
  sb.box('lamp',0,nose-.05,-L/2-.012,W*.9,.05,.04,0xeaf6ff);sb.box('tail',0,rear-.1,L/2+.01,W*.92,.06,.04,0xff1c2c);
 }else{
  sb.addGeo('glass',eg(cb.s,cw-.1,.05),IDENT,0x0d1a24);
  const rl=(cb.xf-cb.ws)-(cb.xr+cb.rw)+.14;if(rl>.05)sb.box('body',0,roof-.015,zOf((cb.xf-cb.ws+cb.xr+cb.rw)/2),cw+.03,.06,rl,0xffffff);
  for(const sx of[-1,1]){sb.box('body',sx*(cw/2),(roof+rear)/2-.02,zOf((cb.xr+cb.xf)/2+.05),.07,roof-rear-.05,.1,0x0a0a0c)}
  // lamps
  const hy=nose-.14,hz=-L/2-.012;
  if(d.grille==='slit'||d.grille==='wedge'){for(const sx of[-1,1]){sb.box('lamp',sx*(W/2-.4),hy,hz,.5,.07,.05,0xf4fbff);sb.box('lamp',sx*(W/2-.4),hy+.08,hz+.01,.3,.03,.05,0xffe9a8)}}
  else{for(const sx of[-1,1])sb.box('lamp',sx*(W/2-.38),hy+.04,hz,.46,.15,.05,0xfff4d0)}
  sb.box('tail',0,rear-.17,L/2+.012,W*.78,.07,.05,0xff1c2c);for(const sx of[-1,1])sb.box('tail',sx*(W/2-.3),rear-.17,L/2+.012,.38,.13,.05,0xff1c2c);
  // grille
  const gy=nose-.28,gw=d.grille==='rolls'?W*.2:d.grille==='horseshoe'?W*.3:W*.46;
  if(d.grille==='rolls'){sb.box('body',0,nose-.3,-L/2-.03,.62,.62,.06,0xcfd3d8);sb.box('body',0,nose-.3,-L/2-.04,.54,.54,.05,0x101114);sb.box('body',0,nose+.05,-L/2-.04,.05,.09,.05,0xdfe3e8)}
  else if(d.grille==='horseshoe'){sb.box('body',0,gy,-L/2-.03,.62,.4,.05,0xcfd3d8);sb.box('body',0,gy,-L/2-.04,.5,.3,.05,0x0b0b0d)}
  else if(d.grille==='kidney'){for(const sx of[-1,1]){sb.box('body',sx*.2,gy+.04,-L/2-.03,.34,.22,.05,0x0b0b0d);sb.box('body',sx*.2,gy+.04,-L/2-.035,.38,.26,.04,0xcfd3d8)}}
  else if(d.grille!=='bar'){sb.box('body',0,gy,-L/2-.03,gw,.16,.05,0x0b0b0d);sb.box('body',0,gy-.18,-L/2-.03,W*.7,.1,.05,0x0b0b0d)}
 }
 // mirrors, seams, rocker, underbody, liners
 const mx=cb.xf?zOf(cb.xf-.12):0;
 if(d.type!=='cyber')for(const sx of[-1,1]){sb.box('body',sx*(cw/2+.12),hood+.12,mx,.2,.1,.14,0xffffff);sb.box('body',sx*(W/2+.012),(cl+rear)/2-.02,zOf(L*d.cabE-.1),.015,rear-cl-.34,.02,0x0b0b0d);sb.box('body',sx*(W/2+.012),(cl+rear)/2-.02,zOf(L*d.cabS+.35),.015,rear-cl-.34,.02,0x0b0b0d)}
 for(const sx of[-1,1])sb.box('body',sx*(W/2+.01),cl+.12,0,.03,.1,L*.44,0x15161a);
 const xf=L-of,xr=L-of-wb;sb.box('body',0,cl+.04,zOf((xf+xr)/2),W-.3,.09,wb,0x0a0a0c);
 for(const ax of[xf,xr])sb.box('body',0,(cl+wr+.4)/2,zOf(ax),W-.3,wr+.4-cl,(wr+.06)*2,0x0b0b0d);
 sb.box('body',0,cl+.06,zOf(L-.15),W-.2,.07,.3,0x0b0b0d);sb.box('body',0,cl+.06,zOf(.2),W-.2,.07,.34,0x0b0b0d);
 if(d.spoiler){const y=rear+.26,z=zOf(.3);sb.box('body',0,y,z,W*.86,.04,.38,0xffffff);for(const sx of[-1,1]){sb.box('body',sx*W*.3,y-.15,z,.05,.3,.12,0x0b0b0d);sb.box('body',sx*W*.43,y+.03,z,.03,.12,.38,0x0b0b0d)}}
 if(d.type==='super'||d.type==='sport'||d.type==='lux'){for(const sx of[-1,1])sb.addGeo('body',new THREE.CylinderGeometry(.05,.05,.2,10),M4(sx*.5,cl+.15,L/2+.05,Math.PI/2,0,0),0xb8bcc4)}
 if(d.livery==='police'){for(const sx of[-1,1]){sb.box('body',sx*(W/2+.012),(cl+rear)/2+.05,zOf(L*.45),.012,.3,L*.5,0x1b3d8f);sb.box('body',sx*(W/2+.014),(cl+rear)/2-.1,zOf(L*.3),.012,.1,L*.2,0x1b3d8f)}sb.box('body',0,hood+.003,zOf(L*.78),W*.5,.01,1.0,0x1b3d8f)}
 if(d.livery==='ambulance'){for(const sx of[-1,1]){sb.box('body',sx*(W/2+.012),1.15,zOf(L*.45),.012,.25,L*.7,0xd0121b);sb.box('body',sx*(W/2+.014),1.55,zOf(L*.5),.012,.5,.12,0xd0121b);sb.box('body',sx*(W/2+.014),1.55,zOf(L*.5),.012,.12,.5,0xd0121b)}}
 if(d.roofSign)sb.box('lamp',0,roof+.12,zOf(L*.38),.6,.2,.25,0xfff2b0);
 // interior (hero only)
 {const sy=rear-.38,cx0=(cb.xr||0);const f=zOf((d.cabE*L)-.9),r=zOf((d.cabS*L)+.6);
  for(const sx of[-1,1]){sb.box('int',sx*W*.2,sy,f,.5,.22,.5,0x2a2522);sb.box('int',sx*W*.2,sy+.3,f+.26,.5,.55,.1,0x2a2522)}
  if(d.type!=='super'){sb.box('int',0,sy,r,W*.7,.22,.5,0x3a322c);sb.box('int',0,sy+.3,r+.26,W*.7,.5,.1,0x3a322c)}
  sb.box('int',0,rear-.12,zOf(d.cabE*L-.12),W*.78,.2,.45,0x1a1a1c);sb.box('int',0,sy+.08,(f+r)/2,.2,.2,.9,0x1a1a1c)}
 const geos=sb.geos();
 // wheel
 const wsb=new SB(),rimR=wr*.68;
 wsb.addGeo('wheel',new THREE.CylinderGeometry(wr,wr,ww,26),M4(0,0,0,0,0,Math.PI/2),0x151517);
 wsb.addGeo('wheel',new THREE.CylinderGeometry(rimR,rimR,ww+.02,22),M4(0,0,0,0,0,Math.PI/2),0x26292e);
 wsb.addGeo('wheel',new THREE.CylinderGeometry(rimR*.55,rimR*.55,ww+.03,14),M4(0,0,0,0,0,Math.PI/2),d.rim);
 for(let k=0;k<5;k++)wsb.addGeo('wheel',new THREE.BoxGeometry(ww+.03,rimR*1.9,.07),M4(0,0,0,k*Math.PI/5,0,0),d.rim);
 const wg=wsb.geos().wheel;
 const hw=W/2-ww/2+.03,wp=[];for(const sx of[-1,1]){wp.push({x:sx*hw,y:wr,z:zOf(xf),front:true,left:sx<0});wp.push({x:sx*hw,y:wr,z:zOf(xr),front:false,left:sx<0})}
 const doorX=W/2+.012,doorZ=zOf(L*d.cabE-.12),dl=(d.cabE-d.cabS)*L*.62;
 g={body:geos.body,glass:geos.glass,lamp:geos.lamp,tail:geos.tail,int:geos.int,wheel:wg,def:d,wheels:wp,door:{x:doorX,z:doorZ,len:dl,y0:cl+.28,y1:rear-.05,hingeY:rear-.05}};geoCache.set(d.key,g);return g}

// ---------- hero vehicle model ----------
const glassMat=phys({color:0x0a141c,roughness:.04,metalness:.9,transparent:true,opacity:.55,clearcoat:1,vertexColors:true,depthWrite:false});
const wheelMat=std({vertexColors:true,roughness:.45,metalness:.55});
const intMat=std({vertexColors:true,roughness:.8});
export const carMats={glass:glassMat,wheel:wheelMat};
export function buildHero(def,paint){const g=getGeos(def),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const paintMat=phys({color:paint,roughness:.3,metalness:.6,clearcoat:1,clearcoatRoughness:.06,vertexColors:true});
 const head=new THREE.MeshBasicMaterial({vertexColors:true}),tail=new THREE.MeshBasicMaterial({vertexColors:true});
 const mk=(geo,mat,cast=true)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=true;body.add(m);return m};
 const bm=mk(g.body,paintMat);mk(g.glass,glassMat,false).renderOrder=3;if(g.lamp)mk(g.lamp,head,false);if(g.tail)mk(g.tail,tail,false);if(g.int)mk(g.int,intMat,false);
 const wheels=[];for(const w of g.wheels){const piv=new THREE.Group();piv.position.set(w.x,w.y,w.z);const m=new THREE.Mesh(g.wheel,wheelMat);m.castShadow=true;piv.add(m);body.add(piv);wheels.push({piv,mesh:m,front:w.front,left:w.left})}
 // doors
 const doors=[];const dd=g.door;for(const sx of[-1,1]){const pv=new THREE.Group();pv.position.set(sx*dd.x,dd.hingeY,dd.z);const h=dd.y1-dd.y0;
  const panel=new THREE.Mesh(new THREE.BoxGeometry(.04,h,dd.len),paintMat.clone());panel.material.vertexColors=false;panel.material.color.set(paint);panel.position.set(sx*.015,-h/2,dd.len/2);panel.castShadow=true;pv.add(panel);body.add(pv);doors.push({pv,side:sx,open:0,target:0,style:def.doors})}
 // blob shadow
 const blob=new THREE.Mesh(new THREE.PlaneGeometry(def.W*1.6,def.L*1.25),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,opacity:.85}));blob.rotation.x=-Math.PI/2;blob.position.y=.03;root.add(blob);
 let flash=null;if(def.lightbar||def.roofSign){const fm1=new THREE.MeshBasicMaterial({color:0xff1111}),fm2=new THREE.MeshBasicMaterial({color:0x1133ff}),y=def.roof+.08,z=g.door.z-.2;
  const a=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.22),fm1),b=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.22),fm2);a.position.set(-.3,y,z);b.position.set(.3,y,z);
  if(def.lightbar){body.add(a,b)}flash={a,b,m1:fm1,m2:fm2};if(def.roofSign){}}
 return {root,body,wheels,doors,paintMat,head,tail,blob,flash,def,geos:g}}
// ---------- cached solid mats for traffic instancing ----------
export const trafficMats={body:phys({color:0xffffff,roughness:.3,metalness:.5,clearcoat:.8,clearcoatRoughness:.1,vertexColors:true}),glass:glassMat,wheel:wheelMat,
 lamp:new THREE.MeshBasicMaterial({vertexColors:true,color:0x999999}),tail:new THREE.MeshBasicMaterial({vertexColors:true,color:0x999999})};
