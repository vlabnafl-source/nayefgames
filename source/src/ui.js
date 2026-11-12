import {G,clamp,TAU,SEA} from './core.js';
import {terrainH,BOUNDS,ISLANDS} from './world.js';
const css=`*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#081321;color:#fff;font-family:Arial,sans-serif}canvas{display:block}
#hud{position:fixed;z-index:2;top:14px;left:14px;padding:12px 15px;min-width:230px;background:#101b2deF;border:1px solid #50d9f2;border-radius:12px;box-shadow:0 8px 30px #0008}
#hud h2{margin:0 0 8px;color:#65e7ff;letter-spacing:3px;font-size:18px}#hud small{font-size:10px;color:#fff;letter-spacing:0}.stat{font-size:13px;margin:5px 0;color:#d5e8fa}
.bar{height:7px;background:#1b2a3d;border-radius:4px;overflow:hidden;margin-top:3px}.bar i{display:block;height:100%;background:linear-gradient(90deg,#00a9d6,#37d7ee);width:50%}
#hbar i{background:linear-gradient(90deg,#d6314a,#ff7b6b)}#fbar i{background:linear-gradient(90deg,#c79a1d,#ffd45a)}
#stars{letter-spacing:3px;font-size:16px;color:#3a4658}#stars b{color:#ff3b4a;text-shadow:0 0 8px #f33}#notice{margin-top:8px;color:#ffe58b;font-size:12px;line-height:1.4;max-width:250px}
#mini{position:fixed;z-index:2;top:14px;right:14px;width:190px;height:190px;border-radius:50%;border:2px solid #50d9f2;box-shadow:0 8px 30px #0008;background:#0b1420}
#clock{position:fixed;z-index:2;top:212px;right:14px;width:190px;text-align:center;font-size:12px;color:#bfe9f5;text-shadow:0 1px 3px #000}
#help{position:fixed;z-index:2;bottom:13px;left:50%;transform:translateX(-50%);padding:9px 16px;background:#101a2de8;border:1px solid #38536c;border-radius:10px;text-align:center;font-size:12px;line-height:1.6;max-width:92vw}
#prompt{position:fixed;z-index:3;bottom:84px;left:50%;transform:translateX(-50%);padding:10px 20px;background:#0c1d2bee;border:1px solid #ffe58b;border-radius:10px;color:#ffe58b;font-weight:700;display:none}
#toast{position:fixed;z-index:4;top:18px;left:50%;transform:translateX(-50%);padding:10px 16px;background:#0c1d2b;border:1px solid #50d9f2;border-radius:9px;opacity:0;transition:opacity .2s;pointer-events:none;max-width:70vw;text-align:center}
#fly,#race{position:fixed;z-index:2;left:50%;transform:translateX(-50%);padding:8px 16px;background:#0c1d2bdd;border:1px solid #50d9f2;border-radius:10px;font-size:14px;display:none;text-align:center;white-space:pre}
#fly{bottom:130px}#race{top:70px;font-size:18px;border-color:#ffd45a;color:#ffe58b}
#splash{position:fixed;inset:0;z-index:7;display:none;place-items:center;font-size:clamp(40px,9vw,110px);font-weight:900;letter-spacing:8px;text-shadow:0 0 30px #000;background:#0008}
#start,#loading{position:fixed;inset:0;z-index:9;display:grid;place-items:center;text-align:center;background:radial-gradient(ellipse,#193b58,#08111e 70%)}
.panel{padding:30px;max-width:620px;margin:20px;background:#0d1b2add;border:1px solid #47d9f4;border-radius:18px}
#start h1{font-size:clamp(34px,6vw,60px);letter-spacing:5px;margin:0;color:#6cecff}#start p{color:#c4d8eb;line-height:1.6}
button,.btn{border:0;border-radius:9px;padding:12px 20px;background:linear-gradient(90deg,#00a9d6,#37d7ee);color:#04121b;font-weight:800;font-size:14px;cursor:pointer;margin:3px}
button.alt{background:#1d3248;color:#bfe9f5;border:1px solid #38536c}button.warn{background:#7a2230;color:#fff}button:disabled{opacity:.4;cursor:default}
#modal{position:fixed;inset:0;z-index:8;display:none;place-items:center;background:#000a}
#mbox{background:#0d1b2af2;border:1px solid #47d9f4;border-radius:16px;padding:22px;min-width:340px;max-width:min(860px,94vw);max-height:88vh;overflow:auto;box-shadow:0 20px 80px #000}
#mbox h3{margin:0 0 12px;color:#6cecff;letter-spacing:2px}#mbox .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
#mbox input[type=text],#mbox input[type=password],#mbox input[type=number]{padding:11px;border-radius:8px;border:1px solid #47d9f4;background:#08141f;color:#fff;font-size:15px;min-width:220px}
.tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}.tabs button{padding:8px 13px;font-size:12px}.tabs button.on{background:linear-gradient(90deg,#00a9d6,#37d7ee);color:#04121b;border:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.grid button{margin:0;font-size:12px;padding:10px 6px}
.item{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:9px 12px;border:1px solid #28435c;border-radius:9px;margin:6px 0;background:#10233602}
.denied{color:#ff4b5c;font-size:30px;font-weight:900;letter-spacing:5px;animation:sh .4s}@keyframes sh{20%{transform:translateX(-10px)}60%{transform:translateX(10px)}}
.muted{color:#8fa9bd;font-size:12px}kbd{background:#1d3248;border:1px solid #38536c;border-radius:4px;padding:1px 6px;font-size:11px}
input[type=range]{width:240px}`;
const html=`<div id="hud"><h2>REAL CITY <small>2.0 · NEON CITY 2030</small></h2>
<div class="stat">💵 Cash: <b id="cash">$25,000</b> &nbsp; 🏦 <b id="bank">$0</b></div>
<div class="stat">🚘 <b id="vehicle">On foot</b> <span id="speed"></span><div class="bar" id="fbar" style="display:none"><i></i></div></div>
<div class="stat">❤️ Health<div class="bar" id="hbar"><i></i></div></div>
<div class="stat">🚨 Wanted <span id="stars">☆☆☆☆☆</span></div>
<div class="stat">🏠 Home: <b>Luxury Villa</b> &nbsp; 👥 <b id="population">0</b></div>
<div id="notice">Welcome home. Your luxury cars are in the garage.</div></div>
<canvas id="mini" width="190" height="190"></canvas><div id="clock"></div>
<div id="help"></div><div id="prompt"></div><div id="toast"></div><div id="fly"></div><div id="race"></div><div id="splash"></div>
<div id="modal"><div id="mbox"></div></div>
<div id="loading"><div class="panel"><h1 style="color:#6cecff;letter-spacing:4px;margin:0">NEON CITY 2030</h1><p id="lmsg">Building the city…</p><div class="bar" style="height:10px"><i id="lbar" style="width:0%"></i></div></div></div>
<div id="start" style="display:none"><div class="panel"><h1>REAL CITY 2.0</h1><p style="letter-spacing:4px">NEON CITY 2030 · LIVE THE LUXURY LIFE</p>
<p>Wake up in your five-floor mansion. Five supercars wait in your garage. Explore a huge luxury city with traffic, pedestrians, shops, police, aircraft, islands and more.</p>
<p class="muted">Press <kbd>T</kbd> any time for Player / Admin · <kbd>Esc</kbd> pauses · <kbd>H</kbd> shows controls</p><button id="play">ENTER YOUR MANSION</button></div></div>`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const wrap=document.createElement('div');wrap.innerHTML=html;document.body.append(...wrap.children);
const $=id=>document.getElementById(id);
export const UI={$,
 loading(p,msg){$('lbar').style.width=(p*100)+'%';if(msg)$('lmsg').textContent=msg},
 loaded(){$('loading').style.display='none';$('start').style.display='grid'},
 toastT:0,
 prompt(t){const e=$('prompt');if(t){e.textContent=t;e.style.display='block'}else e.style.display='none'},
 splash(t,col='#fff',ms=2600){const e=$('splash');e.textContent=t;e.style.color=col;e.style.display='grid';clearTimeout(UI._sp);UI._sp=setTimeout(()=>e.style.display='none',ms)},
 modal(html,onClose){const m=$('modal'),b=$('mbox');b.innerHTML=html;m.style.display='grid';G.modal=true;G.keys={};UI._onClose=onClose;if(document.pointerLockElement)document.exitPointerLock();return b},
 close(){$('modal').style.display='none';G.modal=false;const f=UI._onClose;UI._onClose=null;f&&f();G.lockPointer&&G.lockPointer()},
 isOpen(){return G.modal},
 menu(title,rows,extra=''){const b=UI.modal(`<h3>${title}</h3>${extra}<div id="mrows"></div><div class="row"><button class="alt" id="mclose">Close</button></div>`);const c=b.querySelector('#mrows');
  rows.forEach(r=>{const d=document.createElement('div');d.className='item';d.innerHTML=`<div><b>${r.label}</b><div class="muted">${r.sub||''}</div></div>`;const bt=document.createElement('button');bt.textContent=r.btn||'Select';bt.disabled=!!r.disabled;bt.onclick=()=>{r.onClick();if(r.keep){}else UI.close()};d.appendChild(bt);c.appendChild(d)});b.querySelector('#mclose').onclick=()=>UI.close();return b},
 flyHud(t){const e=$('fly');if(t){e.textContent=t;e.style.display='block'}else e.style.display='none'},
 raceHud(t){const e=$('race');if(t){e.textContent=t;e.style.display='block'}else e.style.display='none'},
 setHelp(t){if(UI._help!==t){UI._help=t;$('help').innerHTML=t}},
};
G.notify=t=>{$('notice').textContent=t;const e=$('toast');e.textContent=t;e.style.opacity=1;clearTimeout(UI.toastT);UI.toastT=setTimeout(()=>e.style.opacity=0,2800)};
G.hud=()=>{$('cash').textContent='$'+Math.round(G.cash).toLocaleString();$('bank').textContent='$'+Math.round(G.bank).toLocaleString();
 const v=G.active;$('vehicle').textContent=v?(v.label||v.def&&v.def.name||'Vehicle'):'On foot';
 $('hbar').firstElementChild.style.width=G.health+'%';let s='';for(let i=1;i<=5;i++)s+=i<=G.wanted?'<b>★</b>':'☆';$('stars').innerHTML=s;$('population').textContent=G.pedCount||0};
// ---------- minimap ----------
const MS=.5,mw=Math.ceil((BOUNDS.x1-BOUNDS.x0)*MS/ 5*5/5*5/5),MW=Math.round((BOUNDS.x1-BOUNDS.x0)/6),MH=Math.round((BOUNDS.z1-BOUNDS.z0)/6);
const map=document.createElement('canvas');map.width=MW;map.height=MH;let mapReady=false;
export function buildMap(){const x=map.getContext('2d'),im=x.createImageData(MW,MH);
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const wx=BOUNDS.x0+i*6,wz=BOUNDS.z0+j*6,h=terrainH(wx,wz);let c;if(h<SEA){const k=Math.min(1,-h/8);c=[30-15*k,90-35*k,140-45*k]}else if(h<.05&&(wx>480)){c=[215,200,150]}else c=[62,92,62];
  if(Math.abs(wx)<=410&&Math.abs(wz)<=410){const bx=((wx+45)%90+90)%90-45,bz=((wz+45)%90+90)%90-45;c=(Math.abs(bx)>37||Math.abs(bz)>37)?[70,76,84]:[116,122,126]}
  const o=(j*MW+i)*4;im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255}
 x.putImageData(im,0,0);mapReady=true}
G.pois=[];const mini=$('mini'),mc=mini.getContext('2d');
UI.minimap=(px,pz,yaw)=>{if(!mapReady)return;const S=.55,r=95;mc.save();mc.clearRect(0,0,190,190);mc.beginPath();mc.arc(r,r,r,0,TAU);mc.clip();mc.translate(r,r);mc.rotate(yaw);
 // map pixel scale = 1/6 per metre -> draw scaled
 const k=S*6;mc.imageSmoothingEnabled=true;mc.drawImage(map,0,0,MW,MH,(BOUNDS.x0-px)*S,(BOUNDS.z0-pz)*S,MW*k,MH*k);
 for(const p of G.pois){const dx=(p.x-px)*S,dz=(p.z-pz)*S;if(dx*dx+dz*dz>r*r*.95)continue;mc.fillStyle=p.col||'#ffd45a';mc.beginPath();mc.arc(dx,dz,p.big?5:3.5,0,TAU);mc.fill();mc.strokeStyle='#000';mc.lineWidth=1;mc.stroke()}
 for(const p of G.blips||[]){const dx=(p.x-px)*S,dz=(p.z-pz)*S;if(dx*dx+dz*dz>r*r)continue;mc.fillStyle=p.col;mc.beginPath();mc.arc(dx,dz,3,0,TAU);mc.fill()}
 mc.restore();mc.save();mc.translate(r,r);mc.fillStyle='#fff';mc.strokeStyle='#08f';mc.lineWidth=2;mc.beginPath();mc.moveTo(0,-8);mc.lineTo(6,6);mc.lineTo(0,3);mc.lineTo(-6,6);mc.closePath();mc.fill();mc.stroke();mc.restore()};
UI.clock=()=>{const h=G.hour,hh=Math.floor(h),mm=Math.floor((h-hh)*60);$('clock').textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} · ${G.weather}`};
