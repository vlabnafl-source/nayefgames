import {THREE,scene,G,C,SB,M,CURB,TAU,clamp,sstep,mulberry32} from './core.js';
import {Col,Inter,registerGen} from './world.js';
import {Frame,sign,lampAt,toast} from './lib.js';
import {Lamps} from './sky.js';
import {People} from './peds.js';
import {holeTable,reserved} from './city.js';
import {P} from './player.js';
const ST=[-270,-90,90,270],NAMES=['NORTH TERMINAL','CENTRAL PARK','GRAND PLAZA','SOUTH TERMINAL'];
const Y=-10,CEIL=-3.6;
// holes + reserved footprints (static so city ground meshes know)
ST.forEach(bz=>{const j=Math.round(bz/90);holeTable['1,'+j]=[{x0:74,x1:82,z0:bz-2.4,z1:bz+2.4}];(reserved['1,'+j]=reserved['1,'+j]||[]).push([68,bz-9,90,bz+9])});
function tube(ctx){const own=ctx.owner,sb=ctx.sb,z0=Math.max(ctx.cz-45,-332),z1=Math.min(ctx.cz+45,332);if(z0>=z1)return;
 const stationsHere=ST.filter(s=>s>=ctx.cz-45&&s<ctx.cz+45);
 sb.bb('solid',37.5,Y-1,z0,57.5,Y,z1,0x8a8d92,{ao:1,noTop:false,top:'solid',rc:0xb5b8bc});// platforms floor slab (full width) - trackbed carved below
 sb.bb('solid',37.5,Y-1.4,z0,50.5,Y-.9,z1,0x3a3b3f,{ao:1});
 // trackbed visual: replace floor over track with darker bed
 sb.flat('solid',37.5,z0,50.5,z1,Y+.012,0x2a2b2e);
 for(const x of[38.7,41.3,46.7,49.3])sb.bb('metal',x-.04,Y-.0,z0,x+.04,Y+.16,z1,0x9aa0a6,{ao:1,noBottom:true});
 for(let z=Math.ceil(z0/1.6)*1.6;z<z1;z+=1.6)for(const c of[40,48])sb.bb('solid',c-1.35,Y,z,c+1.35,Y+.1,z+.35,0x4a3a2a,{ao:1,noBottom:true});
 Col.addSurf(own,50.5,z0,57,z1,Y);Col.addSurf(own,33,z0,37.5,z1,Y);Col.addSurf(own,37.5,z0,50.5,z1,Y-.9+.05-.05);
 // platform edge yellow strips
 sb.flat('solid',50.5,z0,51.1,z1,Y+.02,0xe6c84a);sb.flat('solid',36.9,z0,37.5,z1,Y+.02,0xe6c84a);
 // walls + ceiling
 const gaps=stationsHere.map(s=>[s-2.6,s+2.6]);let cur=z0;const wallE=(a,b)=>{if(b-a<.01)return;sb.bb('solid',57,Y,a,57.6,CEIL,b,0xc9ccd0,{ao:1});Col.addBox(own,57,a,57.6,b,Y,CEIL)};
 for(const g of gaps.sort((p,q)=>p[0]-q[0])){wallE(cur,g[0]);cur=g[1]}wallE(cur,z1);
 sb.bb('solid',32.4,Y,z0,33,CEIL,z1,0xc9ccd0,{ao:1});Col.addBox(own,32.4,z0,33,z1,Y,CEIL);
 sb.bb('solid',32.4,CEIL,z0,57.6,CEIL+.7,z1,0x6a6e74,{ao:1});Col.addBox(own,32.4,z0,57.6,z1,CEIL,CEIL+.7,{cam:true});
 if(ctx.cz-45<=-332+.1||z0<=-331){sb.bb('solid',32.4,Y,-333,57.6,CEIL,-332,0x8a8d92,{ao:1});Col.addBox(own,32.4,-333,57.6,-332,Y,CEIL)}
 if(z1>=331){sb.bb('solid',32.4,Y,332,57.6,CEIL,333,0x8a8d92,{ao:1});Col.addBox(own,32.4,332,57.6,333,Y,CEIL)}
 for(let z=Math.ceil(z0/10)*10;z<z1;z+=10){sb.box('emisN',45,CEIL-.05,z,2,.08,5,0xfff6e0);if(z%30===0)Lamps.add(own,45,CEIL-.6,z,0xfff2d6,260)}
 Col.addZone(own,32.4,z0,57.6,z1,Y-3,CEIL);
 // stations
 for(const bz of stationsHere){const idx=ST.indexOf(bz),name=NAMES[idx];
  sign(ctx,name+' STATION',56.9,Y+2.3,bz,10,1.1,-Math.PI/2,'#06233a','#7df0ff');sign(ctx,name,33.1,Y+2.3,bz,10,1.1,Math.PI/2,'#06233a','#7df0ff');sign(ctx,'EXIT ↑  Street level',56.9,Y+3.1,bz+10,6,.8,-Math.PI/2,'#0b2a12','#9bff9b');
  for(let k=-2;k<=2;k++){sb.bb('solid',51.8,Y,bz+k*10-1.1,52.9,Y+.5,bz+k*10+1.1,0x6b4a2e,{ao:1});Col.addBox(own,51.8,bz+k*10-1.1,52.9,bz+k*10+1.1,Y,Y+.5);People.addSpawn(own,{x:52.35,y:Y+.5,z:bz+k*10,h:-Math.PI/2,anim:'sit'});
   People.addSpawn(own,{x:54.5+(k%2)*.8,y:Y,z:bz+k*10+3.5,h:Math.PI/2,anim:k%2?'talk':'idle'});if(k%2===0)People.addSpawn(own,{x:34.5,y:Y,z:bz+k*8,h:-Math.PI/2,anim:'idle'})}
  for(let k=-3;k<=3;k++){if(k===0)continue;sb.bb('solid',55.9,Y,bz+k*8-.4,56.5,CEIL,bz+k*8+.4,0xb5b8bc,{ao:1});Col.addBox(own,55.9,bz+k*8-.4,56.5,bz+k*8+.4,Y,CEIL)}
  People.addSpawn(own,{x:54,y:Y,z:bz-12,mode:'pace',pa:[54,bz-20],pb:[54,bz+20],spd:1.2})}}
function corridor(ctx){const own=ctx.owner,sb=ctx.sb;for(const bz of ST){if(!ctx.has(70,bz))continue;
  // floor landing + stairs + walls + ceiling
  sb.bb('solid',57,Y-1,bz-2.6,62,Y,bz+2.6,0xb5b8bc,{ao:1});Col.addSurf(own,57,bz-2.4,62,bz+2.4,Y);
  const n=36;for(let i=0;i<n;i++){const x0=62+i*.5,y=Y+(CURB-Y)*(i+1)/n;sb.bb('solid',x0,Y-1,bz-2.4,x0+.5,y,bz+2.4,0xb5b8bc,{ao:1})}
  Col.addSurf(own,62,bz-2.4,80,bz+2.4,Y,CURB,'x');sb.bb('solid',80,Y-1,bz-2.4,82,CURB,bz+2.4,0xb5b8bc,{ao:1});Col.addSurf(own,80,bz-2.4,82,bz+2.4,CURB);
  for(const s of[-1,1]){const z=bz+s*2.55;sb.bb('solid',57,Y-1,z-.15,82,CURB-.01,z+.15,0xc9ccd0,{ao:1});Col.addBox(own,57,z-.15,82,z+.15,Y-1,CURB+.2);sb.bb('metal',62,Y+1.0,bz+s*2.3-.03,80,Y+(CURB-Y)+1.05,bz+s*2.3+.03,0xcfd3d8,{ao:1,noBottom:true})}
  sb.bb('solid',57,-1,bz-2.6,74,-.4,bz+2.6,0x6a6e74,{ao:1});Col.addBox(own,57,bz-2.6,74,bz+2.6,-1,-.4,{cam:true});
  sb.bb('solid',72,CURB,bz-2.6,74,3.6,bz+2.6,0x6a6e74,{ao:1,noTop:true,noBottom:true});
  for(let x=60;x<74;x+=4){sb.box('emisN',x,-.7,bz,1.5,.06,.5,0xfff6e0)}Lamps.add(own,66,-1.3,bz,0xfff2d6,220);Lamps.add(own,76,2.6,bz,0xfff2d6,220);
  Col.addZone(own,57,bz-2.6,74,bz+2.6,Y-2,-.4);
  // pavilion
  const px0=72,px1=86,pz0=bz-6,pz1=bz+6;
  const wall=(a,b,c,d)=>{sb.bb('glass',a,CURB,b,c,3.6,d,0x9fd0e6,{ao:1,noBottom:true,top:'glass'});Col.addBox(own,a,b,c,d,CURB,3.6)};
  wall(px0,pz0,px1,pz0+.15);wall(px0,pz1-.15,px1,pz1);wall(px0,pz0,px0+.15,pz1);wall(px1-.15,pz0,px1,bz-2.6);wall(px1-.15,bz+2.6,px1,pz1);
  sb.bb('solid',px0-.3,3.6,pz0-.3,px1+.3,4.1,pz1+.3,0x1b3a6b,{ao:1,rc:0x55575b});Col.addBox(own,px0,pz0,px1,pz1,3.6,4.1,{cam:true});
  for(const[x,z]of[[px0,pz0],[px1,pz0],[px0,pz1],[px1,pz1]]){sb.bb('solid',x-.25,CURB,z-.25,x+.25,3.6,z+.25,0x2b3a55,{ao:1})}
  sign(ctx,'METRO · '+NAMES[ST.indexOf(bz)],px1+.2,4.9,bz,8,1.2,Math.PI/2,'#06233a','#7df0ff');sign(ctx,'METRO',px0-.2,4.9,bz,5,1,-Math.PI/2,'#06233a','#7df0ff');
  sb.box('emisN',79,3.4,bz,5,.1,.5,0xfff6e0);Lamps.add(own,79,3.0,bz,0xfff2d6,220);
  Col.addHole(own,74,bz-2.4,82,bz+2.4);Col.addZone(own,px0,pz0,px1,pz1,-12,3.6);
  G.pois.push({x:79,z:bz,name:'Metro '+NAMES[ST.indexOf(bz)],col:'#7df0ff'})}}
registerGen(function metroGen(ctx){if(!ctx.city)return;if(ctx.i===0)tube(ctx);if(ctx.i===1)corridor(ctx)});
G.tp['Metro Station']={x:90,y:CURB,z:90,yaw:-Math.PI/2};G.tp['Metro Platform']={x:54,y:Y,z:96,yaw:Math.PI/2};
// ---------- trains ----------
function trainGeo(){const sb=new SB(),LEN=14,W=3,H=3.3,N=3,tot=N*LEN+ (N-1)*.6;
 for(let c=0;c<N;c++){const z0=-tot/2+c*(LEN+.6),zc=z0+LEN/2;
  sb.bb('metal',-W/2,.25,z0,W/2,H,z0+LEN,0xe8ecf0,{ao:1,noBottom:true});sb.bb('solid',-W/2-.02,.9,z0+.2,-W/2+.0,1.4,z0+LEN-.2,0x1b6fd1,{ao:1});sb.bb('solid',W/2,.9,z0+.2,W/2+.02,1.4,z0+LEN-.2,0x1b6fd1,{ao:1});
  sb.bb('solid',-W/2,0,z0,W/2,.25,z0+LEN,0x2a2d33,{ao:1});sb.bb('solid',-W/2+.1,.25,z0+.1,W/2-.1,.3,z0+LEN-.1,0x9aa0a8,{ao:1,noBottom:true});
  for(const s of[-1,1]){for(let k=0;k<4;k++){const wz=z0+1.6+k*3.2;sb.bb('glass',s*W/2-.04*s-.0,1.6,wz,s*W/2+.04*s,2.8,wz+1.9,0x0b1620,{ao:1,noBottom:true,top:'glass'})}
   for(const dz of[z0+.2,z0+LEN-1.8])sb.bb('glass',s*W/2-.05,.4,dz,s*W/2+.05,3.0,dz+1.6,0x8fa8bd,{ao:1,noBottom:true,top:'glass'});
   for(const sx of[s*1.1]){for(let k=0;k<2;k++){sb.bb('solid',sx-.35,.3,z0+2+k*5.2,sx+.35,.75,z0+6.4+k*5.2,0x2e6fb5,{ao:1});sb.bb('solid',sx-.35+s*.3,.75,z0+2+k*5.2,sx+.35+s*.3,1.4,z0+6.4+k*5.2,0x2e6fb5,{ao:1})}}}
  sb.box('emis',0,H-.2,zc,1.2,.06,LEN*.7,0xfff6e0)}
 sb.box('emis',-.8,1.0,-tot/2-.02,.5,.3,.05,0xfff6e0);sb.box('emis',.8,1.0,-tot/2-.02,.5,.3,.05,0xfff6e0);sb.box('emis',-.8,1.0,tot/2+.02,.5,.3,.05,0xff2a2a);sb.box('emis',.8,1.0,tot/2+.02,.5,.3,.05,0xff2a2a);
 const g=new THREE.Group();sb.build(g);return{g,tot}}
// schedule
const route=[];{const stops=[-270,-90,90,270,90,-90];let t=0;const seq=[];for(let k=0;k<stops.length;k++){const a=stops[k],b=stops[(k+1)%stops.length];seq.push({t0:t,t1:t+9,z0:a,z1:a});t+=9;seq.push({t0:t,t1:t+13,z0:a,z1:b});t+=13}route.push(...seq);route.total=t}
function trainZ(t){t=((t%route.total)+route.total)%route.total;for(const s of route){if(t>=s.t0&&t<s.t1){const u=(t-s.t0)/(s.t1-s.t0);return{z:s.z0+(s.z1-s.z0)*(u*u*(3-2*u)),moving:s.z0!==s.z1,u}}}return{z:-270,moving:false}}
const trains=[];function mkTrain(x,phase,east){const{g,tot}=trainGeo();g.position.set(x,Y,-270);scene.add(g);const rect=east?{dx0:-1.5,dx1:2.6}:{dx0:-2.6,dx1:1.5};
 const dyn=Col.addDyn('metro',{x0:x+rect.dx0,x1:x+rect.dx1,z0:-300,z1:-240,y:Y+.3,dx:0,dy:0,dz:0});trains.push({g,x,phase,dyn,tot,z:-270,east,pass:[],prev:-270})}
mkTrain(48,0,true);mkTrain(40,route.total/2,false);
G.metroT=0;
window.__MODS=window.__MODS||[];window.__MODS.push({update(dt,p){G.metroT+=dt;const near=Math.abs(p.x-45)<160&&Math.abs(p.y-Y)<40||(Math.abs(p.x-45)<30&&p.y<-3);
 for(const tr of trains){const s=trainZ(G.metroT+tr.phase);const nz=s.z;tr.dyn.dz=nz-tr.z;tr.dyn.dx=0;tr.dyn.dy=0;tr.z=nz;tr.g.position.z=nz;tr.dyn.z0=nz-tr.tot/2;tr.dyn.z1=nz+tr.tot/2;tr.g.visible=near||Math.abs(p.z-nz)<400;
  // passengers
  tr.pass=tr.pass.filter(q=>People.list.includes(q));if(near&&tr.pass.length<9){tr.pc=(tr.pc||0)-dt;if(tr.pc<=0){tr.pc=.4;const r=Math.random();const q=People.make({x:tr.x,z:nz,y:Y+.3,mode:'ride',anim:r<.5?'idle':'sit',h:Math.random()*6});q.ride={dx:(Math.random()<.5?-1:1)*1.1,dz:(Math.random()-.5)*36};if(q.anim==='sit')q.y=Y+.3;tr.pass.push(q)}}
  for(const q of tr.pass){q.x=tr.x+q.ride.dx;q.z=nz+q.ride.dz;q.y=Y+.35;q.hidden=false}
  if(s.moving&&Math.abs(nz-tr.prev)>0){const sp=Math.abs(nz-tr.prev)/Math.max(dt,.001);if(sp>3&&p.y<Y-.5&&p.y>Y-1.6&&p.x>tr.x-1.6&&p.x<tr.x+1.6&&Math.abs(p.z-nz)<tr.tot/2&&!G.active){P.hurt(80,'train');toast('You were hit by a train!')}}tr.prev=nz}}});
