// Hidden billionaire garage (no map marker, no teleport entry) + mission system
import {G} from './core.js';
import {Col,registerGen,Inter} from './world.js';
import {People} from './peds.js';
import {Lamps} from './sky.js';
import {UI} from './ui.js';
const X0=-1028,X1=-992,Z0=45,Z1=75,H=6,CX=-1010,CZ=60;
const CARS=[['Bugatti',-1022],['McLaren',-1016],['Lamborghini',-1010],['Rolls-Royce',-1004],['Cybertruck',-998]];
const unlocked=()=>G.admin||G.secretUnlocked;
registerGen(function secretGarage(ctx){
 if(!ctx.has(CX,CZ))return;const sb=ctx.sb,own=ctx.owner,wc=0x4a5260;
 const wall=(a,b,c,d,y0=0,y1=H)=>{if(c-a<.02||d-b<.02)return;sb.bb('solid',a,y0,b,c,y1,d,wc,{ao:1,top:'solid'});Col.addBox(own,a,b,c,d,y0,y1)};
 wall(X0,Z0,X1,Z0+.5);wall(X0,Z0,X0+.5,Z1);wall(X1-.5,Z0,X1,Z1);
 wall(X0,Z1-.5,CX-1.6,Z1);wall(CX+1.6,Z1-.5,X1,Z1);wall(CX-1.6,Z1-.5,CX+1.6,Z1,3.3,H);       // door gap 3.2 m wide
 sb.bb('solid',X0,0,Z0,X1,.03,Z1,0x3a414d,{ao:1});                                           // floor
 sb.bb('solid',X0-.5,H,Z0-.5,X1+.5,H+.6,Z1+.5,0x3d6b3a,{ao:1});Col.addBox(own,X0-.5,Z0-.5,X1+.5,Z1+.5,H,H+.6,{cam:true}); // grass roof
 sb.bb('solid',X0-8,0,Z0-8,X1+8,.9,Z0-.2,0x3d6b3a,{ao:1});                                      // earth bank behind
 Col.addZone(own,X0,Z0,X1,Z1,0,H);
 for(const x of[-1022,-1010,-998])for(const z of[52,66])Lamps.add(own,x,H-.8,z,0xdfeeff,420);
 sb.bb('emisN',X0+2,H-.12,Z0+2,X1-2,H-.02,Z0+2.6,0xbfe8ff,{noBottom:true});sb.bb('emisN',X0+2,H-.12,Z1-2.6,X1-2,H-.02,Z1-2,0xbfe8ff,{noBottom:true});
 sb.bb('emis',CX-1.7,0,Z1-.52,CX+1.7,.05,Z1-.3,0x00e0ff);                                       // glowing threshold
 for(const[nm,px]of CARS){const pz=56;
  sb.bb('solid',px-2.4,0,pz-3.6,px+2.4,.28,pz+3.6,0x101319,{ao:1});Col.addBox(own,px-2.4,pz-3.6,px+2.4,pz+3.6,0,.28);
  for(const[a,b,c,d]of[[px-2.4,pz-3.6,px+2.4,pz-3.45],[px-2.4,pz+3.45,px+2.4,pz+3.6],[px-2.4,pz-3.6,px-2.25,pz+3.6],[px+2.25,pz-3.6,px+2.4,pz+3.6]])sb.bb('emis',a,.28,b,c,.32,d,0x00e0ff);
  Inter.add(own,{x:px,y:0,z:pz,r:4,text:()=>unlocked()?`F — Summon the ${nm} (exclusive)`:`🔒 ${nm} — locked. Earn it through special missions (J)`,act:()=>{
   if(!unlocked()){G.notify('Locked — complete the Speed Demon, Package Run and Sky Captain missions (J)');return}
   window.__GAME.spawnVehicle(nm);G.notify('The '+nm+' rolls off the turntable — press E to drive')}});}
 Inter.add(own,{x:CX,y:0,z:66,r:3,text:'F — Concierge terminal',act:()=>G.notify(unlocked()?'Welcome, billionaire. Every car on the turntables is yours.':'Access limited. Complete the special missions to unlock the garage.')});
 People.addSpawn(own,{x:CX+9,y:0,z:67,h:Math.PI,anim:'talk',outfit:'staff'});
});
setTimeout(()=>{
 let found=false;try{found=!!localStorage.getItem('neon_v4_secret')}catch(e){}
 window.__MODS.push({update(){if(found||!G.started)return;const p=window.__P.g.position;if(p.x>X0&&p.x<X1&&p.z>Z0&&p.z<Z1&&p.y<8){found=true;try{localStorage.setItem('neon_v4_secret','1')}catch(e){}G.notify('🏆 Secret discovered: the Billionaire Garage')}}})
},0);
// ===================== MISSIONS =====================
setTimeout(()=>{
 const P=window.__P,$=(t,css,h)=>{const e=document.createElement(t);if(css)e.style.cssText=css;if(h!=null)e.innerHTML=h;return e};
 const dist=(x,z)=>Math.hypot(P.g.position.x-x,P.g.position.z-z);
 const tp=n=>G.tp[n];
 const M=[
  {id:'air',name:'Airport Run',desc:'Get to the International Airport within 6 minutes — on foot, by car, any way you like.',reward:2500,limit:360,steps:[{way:'International Airport',text:'Reach the International Airport',ok:()=>dist(-640,-30)<30}]},
  {id:'tower',name:'Tower Top',desc:'Ride the lift to the control room at the top of the airport tower.',reward:3000,limit:0,steps:[{way:'Control Tower',text:'Take the tower lift up to the control room',ok:()=>dist(-660,215)<20&&P.g.position.y>30}]},
  {id:'speed',name:'Speed Demon',desc:'Hit 200 km/h in any road vehicle within 4 minutes. Find a long straight road.',reward:4000,limit:240,steps:[{way:'Highway Overpass',text:'Reach 200 km/h in a vehicle',ok:()=>G.active&&!G.active.isAirV&&Math.abs(G.active.speed||0)*3.6>=200}]},
  {id:'pkg',name:'Package Run',desc:'Pick up the package at the Mall, then deliver it to the School within 7 minutes.',reward:3500,limit:420,steps:[{way:'Mall',text:'Pick up the package at the Mall',ok:()=>dist(0,-68)<25},{way:'School',text:'Deliver the package to the School',ok:()=>dist(-90,222)<25}]},
  {id:'sky',name:'Sky Captain',desc:'Fly any aircraft above 150 m. (Helicopters and jets can be spawned by admins, or press E beside an airliner.)',reward:6000,limit:0,steps:[{way:'Airport Hangars',text:'Take off and climb above 150 m',ok:()=>G.active&&G.active.isAirV&&G.active.y>150}]},
 ];
 let S={done:{},active:null,stage:0,t:0};try{S=Object.assign(S,JSON.parse(localStorage.getItem('neon_v4_missions')||'{}'))}catch(e){}
 const save=()=>{try{localStorage.setItem('neon_v4_missions',JSON.stringify({done:S.done,active:S.active,stage:S.stage,t:S.t}))}catch(e){}};
 const refreshUnlock=()=>{const was=G.secretUnlocked;G.secretUnlocked=!!(S.done.speed&&S.done.pkg&&S.done.sky);if(G.secretUnlocked&&!was&&G.started)G.notify('🔓 Rare vehicles unlocked. Not everything is on the map…')};refreshUnlock();
 const hud=$('div','position:fixed;left:50%;top:196px;transform:translateX(-50%);padding:7px 14px;background:rgba(10,18,32,.8);color:#ffe9a8;font:700 13px system-ui;border:1px solid rgba(255,210,100,.5);border-radius:10px;z-index:24;pointer-events:none;display:none;white-space:nowrap');document.body.appendChild(hud);
 const cur=()=>M.find(m=>m.id===S.active);
 function setWay(){const m=cur();if(!m)return;const st=m.steps[S.stage];if(G.setWay)G.setWay(st.way)}
 function start(id){const m=M.find(x=>x.id===id);if(!m||S.done[id])return;S.active=id;S.stage=0;S.t=0;save();setWay();G.notify('📋 Mission started: '+m.name)}
 function cancel(){S.active=null;G.waypoint=null;save();G.notify('Mission cancelled')}
 G.openMissions=function(){if(G.modal)return;const rows=()=>M.map(m=>{const d=S.done[m.id],a=S.active===m.id;return `<div style="padding:8px 10px;margin:6px 0;border:1px solid #28435c;border-radius:10px;background:${d?'#0c2a1a':'#0b1824'}"><div style="display:flex;justify-content:space-between;gap:10px"><b>${d?'✅ ':''}${m.name}</b><span style="color:#ffe9a8">$${m.reward.toLocaleString()}</span></div><div style="opacity:.8;font-size:13px;margin:4px 0">${m.desc}${m.limit?` <i>(${Math.floor(m.limit/60)} min limit)</i>`:''}</div>${d?'<i style="opacity:.6">Completed</i>':a?`<button class="alt" data-c="1">Cancel mission</button>`:`<button data-s="${m.id}">Accept</button>`}</div>`}).join('');
  const b=UI.modal(`<h3>📋 MISSIONS</h3><div id="mlist" style="min-width:min(520px,82vw);max-height:60vh;overflow:auto">${rows()}</div><div class="muted">Completed: ${Object.keys(S.done).length}/${M.length} · rewards are paid instantly and progress is saved.</div>`);
  b.addEventListener('click',e=>{const t=e.target;if(t.dataset.s){if(S.active){G.notify('Finish or cancel your current mission first');return}start(t.dataset.s);UI.close()}else if(t.dataset.c){cancel();UI.close()}})};
 addEventListener('keydown',e=>{if(e.code==='KeyJ'&&G.started&&!e.repeat&&!G.modal&&!G.photoOn){e.preventDefault();e.stopImmediatePropagation();G.openMissions()}},true);
 window.__MODS.push({update(dt){const m=cur();if(!m||!G.started){hud.style.display='none';return}
  S.t+=dt;const st=m.steps[S.stage];let ok=false;try{ok=st.ok()}catch(e){}
  if(ok){if(S.stage+1<m.steps.length){S.stage++;setWay();G.notify('✔ '+st.text+' — next: '+m.steps[S.stage].text);save()}
   else{S.done[m.id]=1;S.active=null;G.waypoint=null;G.cash+=m.reward;save();refreshUnlock();G.notify(`🏁 Mission complete: ${m.name} — +$${m.reward.toLocaleString()}`);G.save&&G.save();hud.style.display='none';return}}
  if(m.limit&&S.t>m.limit){S.active=null;G.waypoint=null;save();G.notify('⏱ Mission failed: '+m.name+' — time ran out');hud.style.display='none';return}
  const left=m.limit?Math.max(0,m.limit-S.t):0;hud.style.display='block';hud.textContent='📋 '+m.name+' · '+st.text+(m.limit?' · '+Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0'):'')+'  (J)'}});
},0);
