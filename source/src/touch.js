// On-screen touch controls: joystick (WASD), drag-to-look, action buttons. Works by sending the same key events the keyboard sends.
import {G} from './core.js';
import {UI} from './ui.js';
const $=(t,css,h)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(h!=null)e.innerHTML=h;return e};
let root=null,on=false;const held={};
const fire=(code,down)=>{if(!!held[code]===down)return;held[code]=down;document.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code.replace('Key','').toLowerCase(),bubbles:true,cancelable:true}))};
const tap=code=>{fire(code,true);setTimeout(()=>fire(code,false),60)};
function build(){
 root=$('div','position:fixed;inset:0;z-index:5;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none;font:800 14px system-ui');document.body.appendChild(root);
 // look area (right 60% of screen)
 const look=$('div','position:absolute;right:0;top:0;width:62%;height:100%;pointer-events:auto;touch-action:none');root.appendChild(look);
 let lid=null,lx=0,ly=0;
 look.addEventListener('pointerdown',e=>{lid=e.pointerId;lx=e.clientX;ly=e.clientY;try{look.setPointerCapture(e.pointerId)}catch(_){}});
 look.addEventListener('pointermove',e=>{if(e.pointerId!==lid)return;const P=window.__P,dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;P.yaw-=dx*.0055*(G.sens||1);P.pitch=Math.max(-.35,Math.min(1.1,P.pitch-dy*.0042*(G.sens||1)));P.lastMouse=performance.now()});
 const end=e=>{if(e.pointerId===lid)lid=null};look.addEventListener('pointerup',end);look.addEventListener('pointercancel',end);
 // joystick
 const base=$('div','position:absolute;left:26px;bottom:26px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.35);pointer-events:auto;touch-action:none');
 const knob=$('div','position:absolute;left:45px;top:45px;width:50px;height:50px;border-radius:50%;background:rgba(120,200,255,.75);border:2px solid #fff');base.appendChild(knob);root.appendChild(base);
 let jid=null;const setJ=(dx,dy)=>{const r=70,m=Math.hypot(dx,dy),k=m>r?r/m:1,x=dx*k,y=dy*k;knob.style.transform=`translate(${x}px,${y}px)`;fire('KeyW',y<-22);fire('KeyS',y>22);fire('KeyA',x<-22);fire('KeyD',x>22)};
 const jm=e=>{const b=base.getBoundingClientRect();setJ(e.clientX-b.left-70,e.clientY-b.top-70)};
 base.addEventListener('pointerdown',e=>{jid=e.pointerId;try{base.setPointerCapture(e.pointerId)}catch(_){}jm(e)});
 base.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e)});
 const je=e=>{if(e.pointerId===jid){jid=null;setJ(0,0)}};base.addEventListener('pointerup',je);base.addEventListener('pointercancel',je);
 // buttons
 const btn=(label,css,code,hold,fn)=>{const b=$('div',`position:absolute;${css};min-width:58px;height:58px;padding:0 10px;box-sizing:border-box;border-radius:30px;display:flex;align-items:center;justify-content:center;background:rgba(10,25,45,.62);border:2px solid rgba(160,210,255,.7);color:#fff;pointer-events:auto;touch-action:none`,label);
  if(fn){b.addEventListener('pointerdown',e=>{e.preventDefault();fn()})}
  else if(hold){b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}fire(code,true);b.style.background='rgba(60,140,220,.8)'});const up=()=>{fire(code,false);b.style.background='rgba(10,25,45,.62)'};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)}
  else b.addEventListener('pointerdown',e=>{e.preventDefault();tap(code)});root.appendChild(b);return b};
 btn('JUMP / BRAKE','right:26px;bottom:26px;width:110px','Space',true);
 btn('RUN / THROTTLE','right:150px;bottom:26px;width:120px','ShiftLeft',true);
 btn('E<br><span style="font-size:10px">enter</span>','right:26px;bottom:100px','KeyE');
 btn('F<br><span style="font-size:10px">use</span>','right:96px;bottom:100px','KeyF');
 btn('V<br><span style="font-size:10px">view</span>','right:166px;bottom:100px','KeyV');
 btn('X<br><span style="font-size:10px">down</span>','right:236px;bottom:100px','KeyX');
 const yes=btn('✔ ACCEPT','left:50%;top:90px;transform:translateX(-50%);margin-left:-70px;width:120px;background:rgba(20,120,60,.9)','KeyY');
 const no=btn('✖ REJECT','left:50%;top:90px;transform:translateX(-50%);margin-left:70px;width:120px;background:rgba(150,30,40,.9)','KeyN');
 yes.style.display=no.style.display='none';
 // menu button + menu
 btn('☰','right:216px;top:78px;width:52px','',false,()=>{if(G.modal)return;const m=UI.modal('<h3>MENU</h3><div class="row" id="tm" style="flex-wrap:wrap;gap:8px"></div>');const row=m.querySelector('#tm');
  const add=(t,f)=>{const b=document.createElement('button');b.className='alt';b.textContent=t;b.onclick=()=>{UI.close();setTimeout(()=>{G.modal=false;f()},30)};row.appendChild(b)};
  add('▶ Resume',()=>{});add('📋 Missions',()=>G.openMissions&&G.openMissions());add('🌐 Multiplayer',()=>G.openMultiplayer&&G.openMultiplayer());add('🔑 Admin / Player (T)',()=>tap('KeyT'));add('⌨ Console (admin)',()=>G.openConsole&&G.openConsole());
  add('📷 Photo mode',()=>tap('KeyP'));add('🧭 GPS arrow on/off',()=>tap('KeyK'));add('🛒 Admin shop (I)',()=>tap('KeyI'));add('✈ Passenger (M)',()=>tap('KeyM'));add('🤖 ARIA',()=>tap('KeyB'));add('⬇ Download game',()=>G.downloadGame());add('Controls help',()=>tap('KeyH'))});
 // quick extras row
 btn('📋','right:276px;top:78px;width:52px','',false,()=>G.openMissions&&!G.modal&&G.openMissions());
 setInterval(()=>{if(!root)return;const pb=!!G.pendingBuy;const hp=document.getElementById('help');if(hp)hp.style.display='none';yes.style.display=no.style.display=pb?'flex':'none';root.style.display=(G.modal&&!pb)||!G.started||G.photoOn?'none':'block'},250);
}
G.enableTouch=function(v=true){on=v;try{localStorage.setItem('neon_device',v?'mobile':'laptop')}catch(e){}
 if(v){if(!root)build();root.style.display='block';G.touch=true;try{const el=document.documentElement;(el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el);if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}
 else if(root){root.style.display='none';G.touch=false}};
