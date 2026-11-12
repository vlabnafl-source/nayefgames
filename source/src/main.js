import {THREE,scene,camera,renderer,G,onResize,clamp,TAU,CURB} from './core.js';
import {Sky,buildEnv,lampLights} from './sky.js';
import {Chunks,Col,Inter} from './world.js';
import {UI,buildMap} from './ui.js';
import './city.js';
import './estate.js';
import './shops.js';
import './civic.js';
import './aircraft.js';
import './regions.js';
import './towers.js';
import './race.js';
import './metro.js';
import {Traffic} from './traffic.js';
import {People} from './peds.js';
import {Elev} from './elevator.js';
import {P} from './player.js';
import {updateBeams} from './vehicles.js';
import * as GAME from './game.js';
const MODS=window.__MODS;
G.t=0;G.started=false;buildEnv();Traffic.init();
const tmp={};
G.lockPointer=()=>{try{const r=renderer.domElement.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}};
function helpText(){const v=G.active;if(!v)return'<b>WASD</b> move · <b>SHIFT</b> run · <b>SPACE</b> jump · <b>MOUSE</b> look · <b>E</b> enter vehicle · <b>F</b> interact · <b>V</b> 1st person · <b>T</b> Admin/Player · <b>H</b> help · <b>ESC</b> pause';
 if(v.kind==='car')return v.def.flight?'<b>WASD</b> drive · <b>SPACE</b> handbrake · <b>SHIFT</b> nitro · <b>F</b> FLIGHT MODE · <b>E</b> exit · <b>V</b> cockpit cam':'<b>WASD</b> drive · <b>SPACE</b> handbrake · <b>SHIFT</b> nitro · <b>E</b> exit · <b>V</b> cockpit cam · <b>F</b> interact';
 return v.helpText||'<b>E</b> exit'}
// ---------- input ----------
document.addEventListener('keydown',e=>{const c=e.code;
 if(G.modal){if(c==='Escape')UI.close();return}
 if(!G.started)return;G.keys[c]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(c))e.preventDefault();if(e.repeat)return;
 if(c==='KeyT'){GAME.openLogin();return}
 if(c==='KeyE'){P.tryEnter();return}
 if(c==='KeyV'){P.fp=!P.fp;return}
 if(c==='KeyH'){showHelp();return}
 if(c.startsWith('Digit')){const n=+c.slice(5);if(n>=1&&Elev.digit(n))return}
 if(c==='KeyF'){const o=P.nearInter();if(o){o.act();G.hud()}else if(G.active&&G.active.toggleFlight)G.active.toggleFlight();else if(G.active&&G.active.onF)G.active.onF();return}
 });
document.addEventListener('keyup',e=>{G.keys[e.code]=false});
window.addEventListener('blur',()=>{G.keys={}});
renderer.domElement.addEventListener('click',()=>{if(G.started&&!G.modal&&document.pointerLockElement!==renderer.domElement)G.lockPointer()});
document.addEventListener('pointerlockchange',()=>{if(G.started&&!G.modal&&document.pointerLockElement!==renderer.domElement&&!G.noPause)pauseMenu()});
function showHelp(){UI.modal(`<h3>CONTROLS</h3><div class="muted" style="line-height:1.9"><b>On foot</b> — WASD move · Shift sprint · Space jump · Mouse look · V first-person<br><b>E</b> enter / exit vehicles (also steals traffic cars) · <b>F</b> interact (shops, ATMs, elevators, showrooms, race start)<br><b>Cars</b> — WASD drive · Space handbrake · Shift nitro<br><b>Tesla Roadster</b> — F flight mode: W/S fly, A/D turn, Space up, C down, Shift speed, F to land<br><b>Helicopter</b> — W/S pitch, A/D turn, Space up, C down, Shift boost<br><b>Jet</b> — Shift/C throttle, W/S pitch, A/D bank, Space brakes<br><b>Boats</b> — W/S throttle, A/D steer<br><b>T</b> Admin/Player login · <b>Esc</b> pause · <b>1-9</b> elevator floors</div><div class="row"><button id="cl">Close</button></div>`).querySelector('#cl').onclick=()=>UI.close()}
function pauseMenu(){const b=UI.modal(`<h3>PAUSED</h3><div class="row"><button id="rs">Resume</button><button class="alt" id="hp">Controls</button></div>
 <div class="muted">Draw distance</div><div class="row"><button class="alt" data-r="2">Low</button><button class="alt" data-r="3">Medium</button><button class="alt" data-r="4">High</button></div>
 <div class="muted">Shadows</div><div class="row"><button class="alt" id="sh">Toggle shadows</button></div>
 <div class="muted">Field of view <span id="fv"></span></div><div class="row"><input type="range" id="fov" min="55" max="95" value="${G.fov}"></div>
 <div class="muted">Mouse sensitivity</div><div class="row"><input type="range" id="sn" min="30" max="200" value="${(G.sens||1)*100}"></div>
 <div class="row"><button class="alt" id="sv">Save game</button><button class="warn" id="rst">Reset save</button></div>`);
 b.querySelector('#rs').onclick=()=>UI.close();b.querySelector('#hp').onclick=()=>{UI.close();setTimeout(showHelp,10)};
 b.querySelectorAll('[data-r]').forEach(x=>x.onclick=()=>{Chunks.R=+x.dataset.r;G.fogFar=[0,0,420,720,980][+x.dataset.r];G.notify('Draw distance set')});
 b.querySelector('#sh').onclick=()=>{renderer.shadowMap.enabled=!renderer.shadowMap.enabled;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})};
 b.querySelector('#fov').oninput=e=>{G.fov=+e.target.value};b.querySelector('#sn').oninput=e=>{G.sens=+e.target.value/100};
 b.querySelector('#sv').onclick=()=>{GAME.save();G.notify('Game saved')};b.querySelector('#rst').onclick=()=>GAME.resetSave()}
// ---------- vehicles tick ----------
function tickVehicles(dt){const px=P.g.position.x,pz=P.g.position.z;
 for(const v of [...G.vehicles]){if(v===G.active||v.dead)continue;const d2=(v.x-px)**2+(v.z-pz)**2;if(d2>420*420&&!v.ai)continue;
  if(v.ai){v.update(dt,v.ai(v,dt))}else{v.update(dt,null);if(v.awake&&Math.abs(v.speed||0)<.25&&!v.flight?.on){v.sleepT=(v.sleepT||0)+dt;if(v.sleepT>2){v.awake=false;v.sleepT=0}}else v.sleepT=0}}
 // vehicle-vehicle collisions
 const act=G.vehicles.filter(v=>v.kind==='car'&&!v.dead&&(v.awake||v===G.active||v.ai)&&(v.x-px)**2+(v.z-pz)**2<250*250);
 for(const a of act)for(const b of G.vehicles){if(a===b||b.kind!=='car'||b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,R=(a.def.L+b.def.L)*.5;if(dx*dx+dz*dz>R*R)continue;if(a.id>b.id&&(b.awake||b.ai||b===G.active))continue;
  if(Math.abs(a.y-b.y)>2)continue;
  const af=[-Math.sin(a.heading),-Math.cos(a.heading)],bf=[-Math.sin(b.heading),-Math.cos(b.heading)];let hit=false;
  for(const sa of[-.28,0,.28])for(const sb of[-.28,0,.28]){const ax=a.x+af[0]*a.def.L*sa,az=a.z+af[1]*a.def.L*sa,bx=b.x+bf[0]*b.def.L*sb,bz=b.z+bf[1]*b.def.L*sb;const ddx=bx-ax,ddz=bz-az,dd=Math.hypot(ddx,ddz),rr=(a.def.W+b.def.W)*.46;
   if(dd<rr&&dd>1e-4){hit=true;const nx=ddx/dd,nz=ddz/dd,pen=(rr-dd)*.5;a.group.position.x-=nx*pen*.5;a.group.position.z-=nz*pen*.5;b.group.position.x+=nx*pen*.5;b.group.position.z+=nz*pen*.5;
    const rv=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(rv>0){const j=rv*.65;a.vx-=nx*j;a.vz-=nz*j;b.vx+=nx*j;b.vz+=nz*j;b.awake=true;a.awake=true;if(rv>4){a.damage(rv*.9);b.damage(rv*.9);if(a===G.active||b===G.active)G.shake=Math.max(G.shake||0,clamp(rv/14,0,1))}}}}}}
// ---------- loop ----------
let hudT=0,miniT=0,saveT=0;
function frame(dt){G.t+=dt;const p=P.g.position;
 if(G.started&&!G.modal){
  P.update(dt);tickVehicles(dt);Elev.update(dt);
  const camFwd={x:-Math.sin(P.yaw),z:-Math.cos(P.yaw)};Traffic.update(dt,p.x,p.z,camFwd);People.update(dt,p.x,p.z,camFwd);
  for(const m of MODS)m.update&&m.update(dt,p);
  // interaction prompt
  const o=P.nearInter();let pr=o?o._t:null;if(!pr&&G.active&&G.active.def&&G.active.def.flight&&G.active.kind==='car')pr=G.active.flight.on?'F — Land (flight mode OFF)':'F — Flight mode';UI.prompt(pr);
  G.indoor=!!Col.zone(p.x,p.y+1.2,p.z);
 }else if(G.started){G.indoor=!!Col.zone(p.x,p.y+1.2,p.z)}
 Chunks.update(p.x,p.z,G.started?1:3);
 Sky.update(dt,p.x,p.y,p.z);G.updateOcean&&G.updateOcean();
 hudT-=dt;if(hudT<=0){hudT=.1;const v=G.active;G.pedCount=People.list.length;
  document.getElementById('speed').textContent=v?(v.kind==='car'?Math.round(Math.abs(v.speed)*3.6)+' km/h':v.speedText?v.speedText():''):'';
  const fb=document.getElementById('fbar');if(v&&v.kind==='car'){fb.style.display='block';fb.firstElementChild.style.width=v.fuel+'%'}else fb.style.display='none';
  G.hud();UI.setHelp(helpText());UI.clock()}
 miniT-=dt;if(miniT<=0){miniT=.12;UI.minimap(p.x,p.z,P.yaw)}
 saveT-=dt;if(saveT<=0){saveT=15;if(G.started)GAME.save()}
 if(!window.__noRender)renderer.render(scene,camera)}
window.__frame=frame;window.__G=G;window.__P=P;window.__cam=camera;window.__scene=scene;window.__GAME=GAME;window.__Chunks=Chunks;window.__UI=UI;window.__THREE=THREE;window.__Traffic=Traffic;window.__Elev=Elev;window.__Col=Col;window.__People=People;
window.__R=renderer;window.__shot=()=>{renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png')};
async function boot(){GAME.load();
 const s=G.spawn;P.teleport(s.x,s.y,s.z,s.yaw);P.g.visible=true;
 // pre-build around spawn
 const total=26;let n=0;await new Promise(res=>{const step=()=>{const b=Chunks.update(s.x,s.z,2);n+=b;UI.loading(Math.min(1,n/total),'Building the city… '+Chunks.count()+' chunks');if(b===0||n>=total)res();else setTimeout(step,0)};step()});
 buildMap();for(const f of G.onReady)await f();
 for(let k=0;k<4;k++)People.update(.1,s.x,s.z,{x:0,z:1});
 UI.loaded();G.hud()}
let last=performance.now();
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;frame(dt)}
document.getElementById('play').onclick=()=>{document.getElementById('start').style.display='none';G.started=true;G.paused=false;G.lockPointer();G.notify('Welcome home! Your five supercars are in the garage next door.')};
onResize();
boot().then(()=>{if(!location.hash.includes('test'))loop();window.__booted=true}).catch(e=>{console.error(e);document.getElementById('lmsg').textContent='Error: '+e.message});
// static teleport table (so Admin can teleport before chunks exist)
Object.assign(G.tp,{'BURJ NEON':{x:0,y:.14,z:-164,yaw:Math.PI},'AURORA TOWER':{x:180,y:.14,z:196,yaw:Math.PI},'CRYSTAL TOWER':{x:-180,y:.14,z:196,yaw:Math.PI},'HELIX TOWER':{x:180,y:.14,z:-164,yaw:Math.PI},'ZENITH TOWER':{x:-180,y:.14,z:-164,yaw:Math.PI},
 'Bank':{x:-90,y:.12,z:-68,yaw:Math.PI},'Mall':{x:0,y:.12,z:-68,yaw:Math.PI},'High Street':{x:90,y:.12,z:0,yaw:0},'Gas / Workshop':{x:90,y:.12,z:-90,yaw:0},'Supercar Showrooms':{x:0,y:.12,z:76,yaw:0},
 'Hospital':{x:95,y:.12,z:126,yaw:Math.PI},'Police Station':{x:-90,y:.12,z:128,yaw:Math.PI}});
