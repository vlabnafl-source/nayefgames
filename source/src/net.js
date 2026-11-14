// Real multiplayer client: WebSocket to server/server.js. Sends your position/vehicle 10x per second, renders other players, chat.
import {THREE,scene,G,labelTex,lerp} from './core.js';
import {UI} from './ui.js';
import {P,human} from './player.js';
const $=(t,css,h)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(h!=null)e.innerHTML=h;return e};
const N={ws:null,id:0,name:'',status:'offline',remotes:new Map(),names:new Map(),chat:[],sendT:0,last:null,panel:null,ping:0};
G.net=N;
const hex=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const PAL=[0xe64a4a,0x3aa0ff,0x39d98a,0xf5c542,0xb36bff,0xff8a3d,0x35d0d0,0xff5ad8];
const colorOf=(name)=>PAL[hex(name)%PAL.length];
// ---------- chat feed + badge ----------
const feed=$('div','position:fixed;left:16px;bottom:150px;width:min(420px,60vw);z-index:22;pointer-events:none;font:600 13px system-ui;color:#fff;text-shadow:0 1px 3px #000');document.body.appendChild(feed);
const badge=$('div','position:fixed;left:296px;top:14px;padding:5px 10px;background:rgba(8,20,34,.78);color:#8affb0;border:1px solid rgba(110,240,160,.45);border-radius:14px;font:700 12px system-ui;z-index:22;display:none;pointer-events:none');document.body.appendChild(badge);
function feedLine(html){const d=$('div','margin:2px 0;padding:3px 8px;background:rgba(0,0,0,.45);border-radius:6px;transition:opacity 1s',html);feed.appendChild(d);while(feed.children.length>7)feed.removeChild(feed.firstChild);setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),1100)},14000)}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function sys(t){feedLine('<span style="color:#9fd8ff">'+esc(t)+'</span>');N.chat.push({sys:1,text:t});refreshPanel()}
// ---------- remote avatars ----------
function ghostVehicle(kind,col){const g=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.3}),dark=new THREE.MeshStandardMaterial({color:0x10151c,roughness:.2,metalness:.5});
 if(kind==='air'){const fus=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.4,30,14),new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:.5}));fus.rotation.x=Math.PI/2;fus.position.y=3.5;g.add(fus);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(34,.3,5),paint);wing.position.set(0,3,2);g.add(wing);const tail=new THREE.Mesh(new THREE.BoxGeometry(10,.3,3),paint);tail.position.set(0,4,12);g.add(tail);const fin=new THREE.Mesh(new THREE.BoxGeometry(.3,5,4),paint);fin.position.set(0,6,12);g.add(fin);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(1.7,4,14),paint);nose.rotation.x=-Math.PI/2;nose.position.set(0,3.5,-17);g.add(nose);return g}
 if(kind==='boat'){const hull=new THREE.Mesh(new THREE.BoxGeometry(3,1,9),paint);hull.position.y=.4;g.add(hull);const cab=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,3),dark);cab.position.set(0,1.4,-.5);g.add(cab);return g}
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,.55,4.6),paint);body.position.y=.62;g.add(body);const cab=new THREE.Mesh(new THREE.BoxGeometry(1.6,.5,2.2),dark);cab.position.set(0,1.12,.3);g.add(cab);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(1.62,.06,2),paint);roof.position.set(0,1.4,.3);g.add(roof);
 const wg=new THREE.CylinderGeometry(.36,.36,.26,14);for(const[x,z]of[[-.95,-1.45],[.95,-1.45],[-.95,1.45],[.95,1.45]]){const w=new THREE.Mesh(wg,dark);w.rotation.z=Math.PI/2;w.position.set(x,.36,z);g.add(w)}
 const hl=new THREE.MeshBasicMaterial({color:0xfff2c0});for(const x of[-.65,.65]){const l=new THREE.Mesh(new THREE.BoxGeometry(.4,.14,.06),hl);l.position.set(x,.7,-2.31);g.add(l)}return g}
function makeRemote(id,name,color){const rig=human();const u=rig.userData;try{u.m.shirt.color.set(color)}catch(e){}
 const root=new THREE.Group();root.add(rig);
 const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex(name,'#0b1a2b','#'+color.toString(16).padStart(6,'0'),320,80,'bold 40px Arial'),depthWrite:false,transparent:true}));tag.scale.set(1.6,.4,1);tag.position.set(0,2.35,0);root.add(tag);
 scene.add(root);const r={id,name,color,root,rig,tag,u,veh:null,vk:null,cur:null,tgt:null,phase:0,seen:performance.now()};N.remotes.set(id,r);return r}
function removeRemote(id){const r=N.remotes.get(id);if(!r)return;scene.remove(r.root);N.remotes.delete(id)}
function applyState(id,s){const r=N.remotes.get(id);if(!r)return;r.seen=performance.now();r.tgt=s;if(!r.cur){r.cur={...s}}
 const k=s.v?s.k+'|'+s.v:'';if(k!==r.vk){if(r.veh){r.root.remove(r.veh);r.veh=null}r.vk=k;if(s.v){r.veh=ghostVehicle(s.k,r.color);r.root.add(r.veh)}r.rig.visible=!s.v;r.tag.position.y=s.v?(s.k==='air'?10:2.6):2.35}}
// ---------- network ----------
function connect(url,name){if(N.ws)disconnect();N.name=(name||'').trim().slice(0,16)||('Player'+Math.floor(Math.random()*900+100));try{localStorage.setItem('neon_mp_name',N.name);localStorage.setItem('neon_mp_url',url)}catch(e){}
 N.status='connecting';refreshPanel();let ws;try{ws=new WebSocket(url)}catch(e){N.status='offline';sys('Invalid server address');return}N.ws=ws;
 ws.onopen=()=>{ws.send(JSON.stringify({t:'join',name:N.name,color:colorOf(N.name)}))};
 ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
  if(m.t==='welcome'){N.id=m.id;N.status='online';for(const p of m.players){N.names.set(p.id,p.name);const r=makeRemote(p.id,p.name,p.color||colorOf(p.name));if(p.s)applyState(p.id,p.s)}sys('Connected as '+N.name+' — '+(m.players.length+1)+' player(s) online');G.notify&&G.notify('🌐 Connected to multiplayer server');}
  else if(m.t==='join'){N.names.set(m.id,m.name);makeRemote(m.id,m.name,m.color||colorOf(m.name));sys(m.name+' joined the city')}
  else if(m.t==='leave'){const r=N.remotes.get(m.id);sys((r?r.name:'A player')+' left');removeRemote(m.id)}
  else if(m.t==='state'){applyState(m.id,m.s)}
  else if(m.t==='chat'){const mine=m.id===N.id;feedLine('<b style="color:#'+(colorOf(m.name)).toString(16).padStart(6,'0')+'">'+esc(m.name)+'</b>: '+esc(m.text));N.chat.push({name:m.name,text:m.text,mine});refreshPanel()}
  else if(m.t==='pong'){N.ping=Math.round(performance.now()-m.n)}};
 ws.onclose=()=>{if(N.ws===ws){N.ws=null;for(const id of [...N.remotes.keys()])removeRemote(id);if(N.status!=='offline')sys('Disconnected from server');N.status='offline';refreshPanel()}};
 ws.onerror=()=>{if(N.status==='connecting')sys('Could not reach '+url+' — is the server running? (node server/server.js)')}}
function disconnect(){const ws=N.ws;N.ws=null;N.status='offline';if(ws)try{ws.close()}catch(e){}for(const id of [...N.remotes.keys()])removeRemote(id);refreshPanel()}
function localState(dt){const v=G.active,p=P.g.position;let s;
 if(v){s={x:v.x,y:v.y,z:v.z,h:v.heading||0,v:(v.def&&v.def.key)||(v.isAirV?'jet':'vehicle'),k:v.isAirV?'air':(v.isBoat?'boat':'car'),p:v.pitch||0,r:v.roll||0,sp:Math.abs(v.speed||0),sw:0}}
 else{const l=N.last;let sp=0;if(l&&dt>0)sp=Math.hypot(p.x-l.x,p.z-l.z)/dt;N.last={x:p.x,z:p.z};s={x:p.x,y:p.y,z:p.z,h:P.g.rotation.y,v:null,k:'car',p:0,r:0,sp,sw:P.swim?1:0}}return s}
// ---------- per-frame ----------
window.__MODS.push({update(dt){
 if(N.status==='online'&&N.ws&&N.ws.readyState===1){N.sendT+=dt;if(N.sendT>=.1){const el=N.sendT;N.sendT=0;const s=localState(el);N.ws.send(JSON.stringify({t:'state',...s}));
   N.pingT=(N.pingT||0)+el;if(N.pingT>3){N.pingT=0;N.ws.send(JSON.stringify({t:'ping',n:performance.now()}))}}
  badge.style.display='block';badge.textContent='🌐 '+(N.remotes.size+1)+' online · '+N.ping+' ms';}
 else badge.style.display='none';
 const cp=P.g.position;
 for(const r of N.remotes.values()){const c=r.cur,t=r.tgt;if(!t)continue;const k=Math.min(1,dt*10);
  c.x=lerp(c.x,t.x,k);c.y=lerp(c.y,t.y,k);c.z=lerp(c.z,t.z,k);let dh=t.h-c.h;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;c.h+=dh*k;c.p=lerp(c.p,t.p,k);c.r=lerp(c.r,t.r,k);c.sp=lerp(c.sp,t.sp,k);
  if(Math.hypot(t.x-c.x,t.z-c.z)>40){c.x=t.x;c.y=t.y;c.z=t.z}
  const far=Math.hypot(c.x-cp.x,c.z-cp.z)>900;r.root.visible=!far;if(far)continue;
  r.root.position.set(c.x,c.y,c.z);
  if(t.v){r.root.rotation.order='YXZ';r.root.rotation.set(t.k==='air'?c.p:0,c.h,t.k==='air'?-c.r:0)}
  else{r.root.rotation.set(0,0,0);r.rig.rotation.y=c.h;const u=r.u,sp=c.sp;r.phase+=dt*sp*1.8;const sw=Math.sin(r.phase)*Math.min(1,sp/5)*.8;
   if(u.legL){u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw*.9;u.armR.rotation.x=sw*.9}
   r.rig.rotation.x=t.sw?Math.PI/2*.9:0}}
}});
// ---------- panel ----------
function refreshPanel(){const b=N.panel;if(!b||!document.body.contains(b))return;
 b.querySelector('#mpst').innerHTML=N.status==='online'?`<b style="color:#7dff9a">● ONLINE</b> as <b>${esc(N.name)}</b> · ${N.remotes.size+1} player(s) · ${N.ping} ms`:N.status==='connecting'?'<b style="color:#ffd36a">● connecting…</b>':'<b style="color:#ff7a7a">● offline</b>';
 b.querySelector('#mpcon').style.display=N.status==='offline'?'':'none';b.querySelector('#mpdis').style.display=N.status==='offline'?'none':'';
 b.querySelector('#mpl').innerHTML=N.status==='online'?[N.name+' (you)',...[...N.remotes.values()].map(r=>r.name)].map(n=>`<span style="display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:10px;background:#12304f;color:#${colorOf(n.replace(' (you)','')).toString(16).padStart(6,'0')}">${esc(n)}</span>`).join(''):'<i style="opacity:.6">Not connected</i>';
 const log=b.querySelector('#mplog');log.innerHTML=N.chat.slice(-60).map(c=>c.sys?`<div style="color:#9fd8ff;opacity:.85">${esc(c.text)}</div>`:`<div><b style="color:#${colorOf(c.name).toString(16).padStart(6,'0')}">${esc(c.name)}</b>: ${esc(c.text)}</div>`).join('');log.scrollTop=log.scrollHeight}
G.openMultiplayer=function(){if(G.modal)return;let url='';try{url=localStorage.getItem('neon_mp_url')||''}catch(e){}
 if(!url)url=location.protocol.startsWith('http')?(location.protocol==='https:'?'wss://':'ws://')+location.host:'ws://localhost:8080';
 let nm='';try{nm=localStorage.getItem('neon_mp_name')||''}catch(e){}
 const b=UI.modal(`<h3>🌐 MULTIPLAYER</h3><div id="mpst" style="margin-bottom:8px"></div>
 <div class="row" id="mpcon"><input type="text" id="mpurl" value="${esc(url)}" style="flex:2" placeholder="ws://server-address:8080" autocomplete="off"><input type="text" id="mpname" value="${esc(nm)}" style="flex:1" placeholder="Your name" maxlength="16" autocomplete="off"><button id="mpgo">Connect</button></div>
 <div class="row" id="mpdis" style="display:none"><button class="alt" id="mpoff">Disconnect</button></div>
 <div class="muted" style="margin:6px 0">Players online</div><div id="mpl" style="min-height:24px"></div>
 <div class="muted" style="margin:6px 0">Chat</div><div id="mplog" style="height:150px;overflow:auto;background:#08141f;border:1px solid #28435c;border-radius:10px;padding:8px;min-width:min(560px,82vw);font-size:13px"></div>
 <div class="row"><input type="text" id="mpmsg" placeholder="Type a message and press Enter…" style="flex:1" maxlength="200" autocomplete="off"><button id="mpsend">Send</button></div>
 <div class="muted">Run <b>server/server.js</b> with Node (double-click START_SERVER.bat / start_server.sh). Same Wi-Fi: friends open the address it prints, then press O. Esc closes.</div>`);
 N.panel=b;refreshPanel();
 const go=()=>connect(b.querySelector('#mpurl').value.trim(),b.querySelector('#mpname').value);b.querySelector('#mpgo').onclick=go;b.querySelector('#mpoff').onclick=disconnect;
 const msg=b.querySelector('#mpmsg'),sendMsg=()=>{const t=msg.value.trim();if(!t)return;if(N.status!=='online'){sys('Connect to a server first');return}N.ws.send(JSON.stringify({t:'chat',text:t}));msg.value=''};
 b.querySelector('#mpsend').onclick=sendMsg;
 for(const el of b.querySelectorAll('input')){el.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){if(el===msg)sendMsg();else go()}};el.onkeyup=e=>e.stopPropagation()}
 setTimeout(()=>(N.status==='online'?msg:b.querySelector('#mpname')).focus(),30)};
addEventListener('keydown',e=>{if(e.code==='KeyO'&&G.started&&!e.repeat&&!G.modal&&!G.photoOn&&!G.pendingBuy){e.preventDefault();e.stopImmediatePropagation();G.openMultiplayer()}},true);
window.__Net=N;G.netConnect=connect;
