import {THREE,G,clamp,C} from './core.js';
import {Col,Inter} from './world.js';
import {Lamps} from './sky.js';
import {UI} from './ui.js';
const glassM=new THREE.MeshStandardMaterial({color:0x9fd0e6,transparent:true,opacity:.28,roughness:.05,metalness:.7,depthWrite:false});
const steelM=new THREE.MeshStandardMaterial({color:0xaab2bb,roughness:.35,metalness:.8});
const lightM=new THREE.MeshBasicMaterial({color:0xfff3d6});
const gateM=new THREE.MeshStandardMaterial({color:0x4b535c,roughness:.4,metalness:.8});
const BG=new THREE.BoxGeometry(1,1,1);
export const Elev={list:[],
 update(dt){for(const e of Elev.list){const d=e.dyn,old=e.y;if(e.moving){const dy=e.stops[e.target].y-e.y,spd=e.speed,mv=clamp(dy*1.8,-spd,spd),mn=.5;let st=Math.abs(mv)<mn?Math.sign(dy)*mn:mv;if(Math.abs(dy)<=Math.abs(st)*dt){e.y=e.stops[e.target].y;e.moving=false;e.cur=e.target;e.gate();G.notify&&G.notify(`${e.name}: ${e.stops[e.cur].name}`)}else e.y+=st*dt}
   d.y=e.y+.17;d.dy=e.y-old;d.dx=0;d.dz=0;e.cab.position.y=e.y;e.inter.y=e.y}},
 digit(n){const p=G.player.g.position;for(const e of Elev.list){if(p.x>e.x0&&p.x<e.x1&&p.z>e.z0&&p.z<e.z1&&Math.abs(p.y-(e.y+.17))<1.5){if(e.stops[n-1])e.go(n-1);return true}}return false},
 remove(e){const i=Elev.list.indexOf(e);if(i>=0)Elev.list.splice(i,1)}};
// o:{x0,z0,x1,z1,front:'S'|'N'|'E'|'W',stops:[{y,name}],speed,glass:bool,name,wall:hex}
export function makeElevator(ctx,o){const{x0,z0,x1,z1}=o,F=o.front,sb=ctx.sb,own=ctx.owner,stops=o.stops,yb=stops[0].y-.2,yt=stops[stops.length-1].y+3.4;
 const cx=(x0+x1)/2,cz=(z0+z1)/2,th=.18,wallCol=o.wall??0x8a9099,gl=!!o.glass,sideKey=gl?'glass':'solid';
 const wall=(a0,b0,a1,b1,y0,y1,key=sideKey)=>{if(y1-y0<.02)return;sb.bb(key,a0,y0,b0,a1,y1,b1,key==='glass'?0xaad4ea:wallCol,{ao:1,noBottom:true,top:key});Col.addBox(own,a0,b0,a1,b1,y0,y1)};
 const sides={S:[x0,z1-th,x1,z1],N:[x0,z0,x1,z0+th],E:[x1-th,z0,x1,z1],W:[x0,z0,x0+th,z1]};
 for(const k of['S','N','E','W']){if(k===F)continue;const r=sides[k];wall(r[0],r[1],r[2],r[3],yb,yt)}
 // front wall with door openings
 const alongX=F==='S'||F==='N',r=sides[F],dw=Math.min((alongX?x1-x0:z1-z0)-.7,2.4),a0=alongX?x0:z0,a1=alongX?x1:z1,ac=(a0+a1)/2;
 const fw=(s,e,y0,y1)=>{if(e-s<.02)return;if(alongX)wall(s,r[1],e,r[3],y0,y1,'solid');else wall(r[0],s,r[2],e,y0,y1,'solid')};
 fw(a0,ac-dw/2,yb,yt);fw(ac+dw/2,a1,yb,yt);
 let prev=yb;const gates=[];
 stops.forEach((s,i)=>{fw(ac-dw/2,ac+dw/2,prev,s.y);prev=s.y+2.7;
  // gate collider + visual
  const gx0=alongX?ac-dw/2:r[0],gx1=alongX?ac+dw/2:r[2],gz0=alongX?r[1]:ac-dw/2,gz1=alongX?r[3]:ac+dw/2;
  const col=Col.addBox(own,gx0,gz0,gx1,gz1,s.y,s.y+2.7);const m=new THREE.Mesh(BG,gateM);m.scale.set(gx1-gx0,2.7,gz1-gz0);m.position.set((gx0+gx1)/2,s.y+1.35,(gz0+gz1)/2);ctx.add(m);gates.push({col,m,i});
  // floor-number plate
  });
 fw(ac-dw/2,ac+dw/2,prev,yt);
 // cabin
 const cab=new THREE.Group();cab.position.set(0,stops[0].y,0);const iw=x1-x0-.5,id=z1-z0-.5;
 const fl=new THREE.Mesh(BG,steelM);fl.scale.set(x1-x0-.3,.17,z1-z0-.3);fl.position.set(cx,.0,cz);cab.add(fl);
 const ce=new THREE.Mesh(BG,steelM);ce.scale.set(x1-x0-.3,.1,z1-z0-.3);ce.position.set(cx,2.85,cz);cab.add(ce);const lm=new THREE.Mesh(BG,lightM);lm.scale.set(iw*.6,.04,id*.6);lm.position.set(cx,2.78,cz);cab.add(lm);
 for(const k of['S','N','E','W']){if(k===F)continue;const g=new THREE.Mesh(BG,glassM);const R=sides[k];g.scale.set(Math.max(R[2]-R[0]-.3,.05),2.7,Math.max(R[3]-R[1]-.3,.05));g.position.set((R[0]+R[2])/2,1.4,(R[1]+R[3])/2);cab.add(g)}
 ctx.add(cab);
 const dyn=Col.addDyn(own,{x0:x0+.15,z0:z0+.15,x1:x1-.15,z1:z1-.15,y:stops[0].y+.17,dx:0,dy:0,dz:0});
 const e={x0,z0,x1,z1,x:cx,z:cz,stops,cab,dyn,y:stops[0].y,cur:0,target:0,moving:false,speed:o.speed||5,name:o.name||'Elevator',gates,front:F};
 e.gate=()=>{for(const g of gates){const here=g.i===e.cur&&!e.moving;g.col.en=!here;g.m.visible=!here}};
 e.go=(i)=>{if(i===e.cur&&!e.moving){G.notify(`${e.name}: already at ${stops[i].name}`);return}e.target=i;e.moving=true;for(const g of gates){g.col.en=true;g.m.visible=true}};
 e.gate();
 e.inter=Inter.add(own,{x:cx,y:stops[0].y,z:cz,r:1.9,text:()=>`F — ${e.name}: choose floor (or press 1-${stops.length})`,act:()=>{UI.menu(e.name,stops.map((s,i)=>({label:`${i===e.cur?'● ':''}${s.name}`,sub:`Height ${Math.round(s.y)} m`,btn:'Go',onClick:()=>e.go(i)})))}});
 // call buttons
 const fx=F==='S'?cx:F==='N'?cx:F==='E'?x1+1.4:x0-1.4,fz=F==='S'?z1+1.4:F==='N'?z0-1.4:cz;
 stops.forEach((s,i)=>Inter.add(own,{x:fx,y:s.y,z:fz,r:2.2,text:()=>e.cur===i&&!e.moving?`Elevator is here — step inside`:`F — Call elevator`,act:()=>{if(!(e.cur===i&&!e.moving))e.go(i)}}));
 Elev.list.push(e);ctx.cleanup.push(()=>Elev.remove(e));return e}
