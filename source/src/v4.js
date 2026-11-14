// NEON CITY V4 — admin command console, gravity, fly, photo mode, achievements/paycheck
setTimeout(()=>{
const G=window.__G,P=window.__P,cam=()=>window.__cam;
const $=(t,css,html)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e};
G.gravity=24;
{const st=document.getElementById('start');if(st){const d=$('button','position:absolute;right:18px;bottom:18px;padding:10px 16px;background:#0b2a44;color:#bfe8ff;border:1px solid #3aa0ff;border-radius:10px;font:700 14px system-ui;cursor:pointer;z-index:5','⬇ DOWNLOAD GAME');d.onclick=e=>{e.stopPropagation();G.downloadGame()};st.appendChild(d)}}
// ---------- physics hooks ----------
{ // gravity is read by player.js each frame
}
// ---------- admin console ----------
const CMDS={
 GODMODE:{h:'Toggle invincibility + no police',f:()=>{G.godmode=!G.godmode;if(G.godmode){G.wanted=0;G.health=100}G.hud&&G.hud();return'GODMODE '+(G.godmode?'ON':'OFF')}},
 FLY:{h:'Toggle fly mode (Space up, X down, WASD move, Shift fast)',f:()=>{G.flyOn=!G.flyOn;return'FLY '+(G.flyOn?'ON — Space up / X down':'OFF')}},
 SPAWNCAR:{h:'SPAWNCAR <name>  e.g. ferrari, bmw, police',f:a=>{if(!a)return'Usage: SPAWNCAR <name>';window.__GAME.spawnVehicle(a);return'Spawned '+a}},
 SPAWNHELICOPTER:{h:'Spawn a helicopter in front of you',f:()=>{window.__GAME.spawnVehicle('helicopter');return'Helicopter spawned — press E to enter'}},
 TELEPORT:{h:'TELEPORT <place>  (type TELEPORT to list places)',f:a=>{const k=Object.keys(G.tp||{});if(!a)return'Places: '+k.join(', ');const n=a.toLowerCase()==='airport'?'international airport':a.toLowerCase();const m=k.find(x=>x.toLowerCase()===n)||k.find(x=>x.toLowerCase().includes(n));if(!m)return'Unknown place. '+k.join(', ');const t=G.tp[m];if(G.active&&P.exit)P.exit();P.teleport(t.x,t.y??.1,t.z,t.yaw);return'Teleported to '+m}},
 SETWEATHER:{h:'SETWEATHER clear|cloudy|rain|storm|fog|snow',f:a=>{if(!a)return'clear, cloudy, rain, storm, fog, snow';G.setWeather(a.toLowerCase());return'Weather: '+a}},
 SETTIME:{h:'SETTIME <0-24>  e.g. SETTIME 18',f:a=>{const h=parseFloat(a);if(isNaN(h))return'Usage: SETTIME 0-24';G.time=((h%24)+24)%24/24;return'Time set to '+h+':00'}},
 INFINITEMONEY:{h:'Toggle unlimited cash',f:()=>{G.infMoney=!G.infMoney;if(G.infMoney){G.cash=999999999;G.bank=Math.max(G.bank||0,999999999)}return'INFINITE MONEY '+(G.infMoney?'ON':'OFF')}},
 SPAWNNPC:{h:'SPAWNNPC [count]  spawn pedestrians around you',f:a=>{const n=Math.max(1,Math.min(30,parseInt(a)||5));const p=P.g.position;window.__People.spawnAround(p.x,p.y,p.z,n);return n+' NPCs spawned'}},
 CHANGEGRAVITY:{h:'CHANGEGRAVITY <0-60>  (24 = normal, 4 = moon)',f:a=>{const v=parseFloat(a);if(isNaN(v)||v<0||v>60)return'Usage: CHANGEGRAVITY 0-60 (normal 24)';G.gravity=v;return'Gravity = '+v}},
 HELP:{h:'List all commands',f:()=>Object.keys(CMDS).join(', ')},
};
const box=$('div','position:fixed;left:50%;top:14%;transform:translateX(-50%);width:min(560px,92vw);background:rgba(8,12,22,.94);border:1px solid #3aa0ff;border-radius:12px;padding:12px;z-index:60;display:none;color:#dbe8ff;font:600 14px ui-monospace,Menlo,monospace');
box.innerHTML='<div style="color:#7fd0ff;margin-bottom:6px">⌨ ADMIN CONSOLE — type to search, Enter to run, Esc to close</div><input id="cin" autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;padding:9px;background:#05080f;color:#fff;border:1px solid #2a6aa8;border-radius:8px;font:inherit"><div id="cls" style="margin-top:8px;max-height:230px;overflow:auto"></div><div id="cout" style="margin-top:8px;color:#9ff0b0;min-height:18px"></div>';
document.body.appendChild(box);
const inp=box.querySelector('#cin'),ls=box.querySelector('#cls'),out=box.querySelector('#cout');let sel=0,hist=[],hi=0;
function render(){const q=inp.value.trim().split(/\s+/)[0].toUpperCase();const m=Object.keys(CMDS).filter(k=>k.includes(q));sel=Math.min(sel,Math.max(0,m.length-1));
 ls.innerHTML=m.map((k,i)=>`<div data-k="${k}" style="padding:5px 8px;border-radius:6px;cursor:pointer;${i===sel?'background:#12304f':''}"><b>${k}</b> <span style="opacity:.7">— ${CMDS[k].h}</span></div>`).join('')||'<i style="opacity:.6">no match</i>';
 ls.querySelectorAll('div[data-k]').forEach(d=>d.onclick=()=>{const k=d.dataset.k;inp.value=k+' ';inp.focus();render()})}
function run(){const raw=inp.value.trim();if(!raw)return;const parts=raw.split(/\s+/);let k=parts[0].toUpperCase();const arg=parts.slice(1).join(' ');
 if(!CMDS[k]){const m=Object.keys(CMDS).filter(x=>x.includes(k));if(m.length===1)k=m[0];else{out.textContent='Unknown command. Type HELP.';return}}
 try{out.textContent=CMDS[k].f(arg)}catch(e){out.textContent='Error: '+e.message}hist.push(raw);hi=hist.length;inp.value='';render();G.save&&G.save()}
G.openConsole=()=>{if(!G.admin){G.notify('ACCESS DENIED — log in as ADMIN first (T, password)');return}box.style.display='block';G.modal=true;inp.value='';out.textContent='';render();setTimeout(()=>inp.focus(),10);if(document.pointerLockElement)document.exitPointerLock()};
const closeC=()=>{box.style.display='none';G.modal=false;inp.blur()};
inp.addEventListener('input',render);
inp.addEventListener('keydown',e=>{e.stopPropagation();
 if(e.key==='Escape'||e.key==='`'){e.preventDefault();closeC()}
 else if(e.key==='Enter'){e.preventDefault();run()}
 else if(e.key==='ArrowDown'){e.preventDefault();sel++;render()}
 else if(e.key==='ArrowUp'){e.preventDefault();if(e.shiftKey||!inp.value){hi=Math.max(0,hi-1);inp.value=hist[hi]||''}else{sel=Math.max(0,sel-1);render()}}
 else if(e.key==='Tab'){e.preventDefault();const q=inp.value.trim().split(/\s+/)[0].toUpperCase();const m=Object.keys(CMDS).filter(k=>k.includes(q));if(m[sel]){inp.value=m[sel]+' ';render()}}});
inp.addEventListener('keyup',e=>e.stopPropagation());
document.addEventListener('keydown',e=>{if(e.code==='Backquote'&&G.started&&box.style.display==='none'&&!G.modal){e.preventDefault();e.stopImmediatePropagation();G.openConsole()}},true);
// ---------- fly mode ----------
const keys={};addEventListener('keydown',e=>{keys[e.code]=1});addEventListener('keyup',e=>{keys[e.code]=0});
window.__MODS.push({update(dt){
 if(G.infMoney){G.cash=Math.max(G.cash,999999999)}
 if(G.flyOn&&!G.active&&!G.photoOn&&!G.modal){const up=(keys.Space?1:0)-(keys.KeyX?1:0);P.vy=0;P.g.position.y+=up*(keys.ShiftLeft?30:12)*dt}
}});
// ---------- photo mode (P) ----------
{const st=$('style',null,'body.photo>*:not(canvas):not(#photoUI){display:none!important}');document.head.appendChild(st);
 const ui=$('div','position:fixed;left:50%;bottom:18px;transform:translateX(-50%);padding:8px 14px;background:rgba(0,0,0,.6);color:#fff;font:600 13px system-ui;border-radius:10px;z-index:70;display:none;text-align:center;line-height:1.5');ui.id='photoUI';document.body.appendChild(ui);
 let pos=null,fov=60,roll=0,fx=0;
 function enter(){if(G.pax||G.modal||!G.started)return;const c=cam();pos=c.position.clone();fov=c.fov;roll=0;G.photoOn=true;G.photoFreeze=P.g.position.clone();G.timeWasPaused=G.timePaused;document.body.classList.add('photo');ui.style.display='block';if(G.active)G.photoVeh=G.active}
 function exit(){G.photoOn=false;document.body.classList.remove('photo');ui.style.display='none';G.timePaused=G.timeWasPaused;const c=cam();c.fov=fov0;c.updateProjectionMatrix()}
 let fov0=60;
 addEventListener('keydown',e=>{if(e.code==='KeyP'&&G.started&&!e.repeat&&!G.modal){e.preventDefault();e.stopImmediatePropagation();if(G.photoOn)exit();else{fov0=cam().fov;enter()}}
  else if(G.photoOn){if(e.code==='Escape'){exit()}
   else if(e.code==='KeyT'){G.timePaused=!G.timePaused}
   else if(e.code==='KeyC'){const a=document.createElement('a');a.href=window.__shot();a.download='neon_city_photo_'+Date.now()+'.png';a.click()}
   else if(e.code==='KeyR'){roll=0;fov=fov0}}},true);
 addEventListener('wheel',e=>{if(G.photoOn){fov=Math.max(15,Math.min(100,fov+e.deltaY*.03))}},{passive:true});
 window.__MODS.push({update(dt){
  if(!G.photoOn)return;const c=cam();
  P.g.position.copy(G.photoFreeze);P.vy=0;
  const sp=(keys.ShiftLeft?25:6)*dt,yaw=P.yaw,pit=P.pitch-.28;
  const fwd=new c.position.constructor(-Math.sin(yaw)*Math.cos(pit),Math.sin(pit)*-1*-1*0+(-Math.sin(pit)),-Math.cos(yaw)*Math.cos(pit));
  const right=new c.position.constructor(Math.cos(yaw),0,-Math.sin(yaw));
  if(keys.KeyW)pos.addScaledVector(fwd,sp);if(keys.KeyS)pos.addScaledVector(fwd,-sp);if(keys.KeyD)pos.addScaledVector(right,sp);if(keys.KeyA)pos.addScaledVector(right,-sp);
  if(keys.Space||keys.KeyE)pos.y+=sp;if(keys.KeyQ||keys.KeyX)pos.y-=sp;
  if(keys.KeyZ)roll+=dt*.6;if(keys.KeyV)roll-=dt*.6;
  if(keys.BracketRight)fov=Math.min(100,fov+30*dt);if(keys.BracketLeft)fov=Math.max(15,fov-30*dt);
  c.position.copy(pos);c.rotation.order='YXZ';c.rotation.set(-(pit),yaw,roll);c.fov=fov;c.updateProjectionMatrix();
  ui.innerHTML='📷 PHOTO MODE · WASD move · Space/Q up/down · Shift fast · mouse look · wheel/[ ] zoom · Z/V tilt · T freeze time ('+(G.timePaused?'frozen':'running')+') · C save photo · R reset · P exit'}});
}
// ---------- achievements + paycheck ----------
{const A=[['First $100k','cash',()=>G.cash+G.bank>=1e5],['Millionaire','cash',()=>G.cash+G.bank>=1e6],['Wanted level 3','crime',()=>G.wanted>=3],['Own a vehicle','own',()=>(G.owned||[]).length>0],['Fly a plane','fly',()=>G.active&&G.active.isAir&&G.active.y>30],['Passenger','pax',()=>!!G.pax],['Night owl','night',()=>G.hour>=1&&G.hour<4]];
 let done={};try{done=JSON.parse(localStorage.getItem('neon_v4_ach')||'{}')}catch(e){}
 let t=0,pay=0;window.__MODS.push({update(dt){t+=dt;pay+=dt;if(t<1.5)return;t=0;
  for(const[n,k,f]of A)if(!done[n]){let ok=false;try{ok=f()}catch(e){}if(ok){done[n]=1;G.notify('🏆 Achievement unlocked: '+n);try{localStorage.setItem('neon_v4_ach',JSON.stringify(done))}catch(e){}}}
  if(pay>=300&&G.started){pay=0;const s=500;G.cash+=s;G.notify('💼 Paycheck received: $'+s+' (every 5 min of play)')}}});
}

},0);
