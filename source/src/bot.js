import {THREE,scene,G,clamp,lerp,TAU,CURB,labelTex,SEA} from './core.js';
import {Col,inWater} from './world.js';
import {UI} from './ui.js';
import {P,human} from './player.js';
import * as GAME from './game.js';

const tmp={};
const NAME='ARIA';
// ---------- android body (re-uses the human rig with metal materials) ----------
const rig=human();rig.visible=false;Object.defineProperty(rig,'visible',{get:()=>false,set:()=>{}});scene.add(rig);
{const m=rig.userData.m;m.shirt.color.set(0xf4f7fa);m.shirt.metalness=.35;m.shirt.roughness=.35;m.pants.color.set(0x232833);m.skin.color.set(0xc9d3dc);m.skin.metalness=.7;m.skin.roughness=.28;m.hair.color.set(0x7df0ff);m.hair.emissive=new THREE.Color(0x1aa8c8);
 const visor=new THREE.Mesh(new THREE.BoxGeometry(.2,.045,.02),new THREE.MeshBasicMaterial({color:0x7df0ff,toneMapped:false}));visor.position.set(0,.022,.108);rig.userData.head.add(visor);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.13,.008,6,24),new THREE.MeshBasicMaterial({color:0x7df0ff,toneMapped:false}));halo.rotation.x=Math.PI/2;halo.position.set(0,.2,0);rig.userData.head.add(halo);rig.userData.halo=halo;
 const core=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),new THREE.MeshBasicMaterial({color:0x7df0ff,toneMapped:false}));core.position.set(0,1.42,.14);rig.add(core)}
const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex('ARIA · AI BOT','#06233a','#7df0ff',320,80,'bold 38px Arial'),depthWrite:false,transparent:true}));tag.scale.set(1.5,.38,1);tag.position.set(0,2.35,0);rig.add(tag);
let bubble=null,bubbleT=0;
function say(text){return;const t=text.length>70?text.slice(0,68)+'…':text;if(bubble)rig.remove(bubble);bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTex(t,'#0d2233','#ffffff',512,128,'bold 30px Arial'),depthWrite:false,transparent:true}));bubble.scale.set(3.4,.85,1);bubble.position.set(0,2.95,0);rig.add(bubble);bubbleT=5}
const B={mode:'follow',phase:0,stuck:0,vis:false,hist:[],started:false};
// ---------- place lookup ----------
const ALIAS={airport:'International Airport',terminal:'International Airport',gates:'Airport Gates','jet bridge':'Airport Gates','control tower':'Control Tower',hangar:'Airport Hangars',hangars:'Airport Hangars','ga ramp':'GA Ramp',runway:'Runway','island airport':'Island Airport',home:'Mansion',house:'Mansion',mansion:'Mansion',roof:'Mansion Roof',helipad:'Mansion Helipad',garage:'Garage',school:'School',hospital:'Hospital',police:'Police Station',cops:'Police Station',bank:'Bank',mall:'Mall',shopping:'Mall',showroom:'Supercar Showrooms','car shop':'Supercar Showrooms','car dealer':'Supercar Showrooms',dealership:'Supercar Showrooms',supercar:'Supercar Showrooms',beach:'Beach',marina:'Marina',yacht:'Marina',bridge:'Harbor Bridge',tunnel:'Harbor Tunnel',overpass:'Highway Overpass',race:'Race Track',track:'Race Track',circuit:'Race Track',metro:'Metro Station',subway:'Metro Station',train:'Metro Platform',gas:'Gas / Workshop',workshop:'Gas / Workshop',fuel:'Gas / Workshop',burj:'BURJ NEON',tower:'BURJ NEON',skyscraper:'BURJ NEON',restaurant:'High Street',pizza:'High Street',coffee:'High Street','high street':'High Street',island:'Island A (Villas)',villa:'Island A (Villas)'};
function findPlace(q){q=q.toLowerCase().replace(/^(the|a|an|my)\s+/,'').replace(/[?.!]+$/,'').trim();if(!q)return null;
 for(const k in G.tp)if(k.toLowerCase()===q)return k;
 let best=null,bl=0;for(const k in ALIAS)if(q.includes(k)&&k.length>bl){best=ALIAS[k];bl=k.length}if(best&&G.tp[best])return best;
 for(const k in G.tp)if(k.toLowerCase().includes(q))return k;return null}
G.setWay=(n)=>setWay(n);function setWay(name){const t=G.tp[name];if(!t)return false;G.waypoint={x:t.x,z:t.z,name};beam.visible=true;beam.position.set(t.x,150,t.z);return true}
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,300,10,1,true),new THREE.MeshBasicMaterial({color:0xff5ad8,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));beam.visible=false;scene.add(beam);
// ---------- intent engine ----------
const JOKES=['Why did the supercar go to therapy? Too many unresolved issues at 300 km/h.','I tried to start a pizza business… it was a slice of the action.','Why don\'t robots panic? We have nerves of steel.','Parallel lines have so much in common — it\'s a shame they\'ll never meet. Like traffic on the ring road.'];
const fmtD=m=>m>1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m';
function nearestPoi(){let b=null,bd=1e9;const p=P.g.position;for(const q of G.pois){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;b=q}}return b?`${b.name} (${fmtD(bd)} away)`:'open streets'}
function clock(){const h=Math.floor(G.hour),m=Math.floor((G.hour-h)*60);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function local(text){const t=text.toLowerCase().trim();let m;
 if(/^(hi|hello|hey|hola|salam|yo|good (morning|evening))\b/.test(t))return`Hello! I'm ${NAME}, your AI companion. Ask me for directions, your balance, a car, or type "help".`;
 if(/\b(help|what can you do|commands)\b/.test(t))return'I can: guide you ("take me to the airport"), teleport you ("teleport me to the school"), fetch cars ("bring my Ferrari"), spawn cars ("spawn a Bugatti"), change weather/time ("make it night", "make it rain"), report money, health & wanted level, and tell jokes. Say "follow me" or "stay here" to control me.';
 if(/(clear|cancel|remove|stop).*(waypoint|gps|route|marker|navigation)|^(cancel|stop navigation)/.test(t)){G.waypoint=null;beam.visible=false;return'Navigation cleared.'}
 if(m=t.match(/(?:teleport|tp|warp)\s+(?:me\s+)?(?:to\s+)?(.+)/)){const k=findPlace(m[1]);if(!k)return`I don't know a place called "${m[1]}". Try: airport, school, hospital, beach, marina, Burj, race track, metro, bank, mall…`;setTimeout(()=>{GAME.teleportTo(G.tp[k])},400);return`Teleporting you to ${k}. Hold on!`}
 if(m=t.match(/(?:take me|guide me|navigate|directions?|where is|find|go|lead me|route|waypoint|gps)\s*(?:me\s+)?(?:to\s+|for\s+)?(?:the\s+)?(.+)/)){const k=findPlace(m[1]);if(!k)return`I can't find "${m[1]}". Try: airport, school, hospital, police, beach, marina, Burj, race track, metro, mall, bank, showrooms…`;setWay(k);const p=P.g.position,t2=G.tp[k];return`Route set to ${k} — ${fmtD(Math.hypot(t2.x-p.x,t2.z-p.z))} away. Follow the pink marker on your minimap and the pink beam!`}
 if(/where am i|my location|\bposition\b/.test(t)){const p=P.g.position;return`You're near ${nearestPoi()}. Coordinates: x ${Math.round(p.x)}, z ${Math.round(p.z)}.`}
 if(/\b(time|clock|hour)\b/.test(t)&&!/make|set|change/.test(t))return`It's ${clock()} (a full day lasts ${Math.round(G.cycle)} seconds).`;
 if(m=t.match(/(?:make|set|change|turn).*\b(day|night|noon|midnight|sunrise|sunset|morning|evening)\b/)){const w=m[1];G.time={day:.42,noon:.5,morning:.3,sunrise:.25,evening:.72,sunset:.75,night:.92,midnight:0}[w];return`Done — it's ${w} now.`}
 if(/\b(rain|storm|fog|cloudy|clear|sunny)\b/.test(t)&&/make|set|change|turn|let it|start|stop|want|bring/.test(t)){const w=t.match(/\b(rain|storm|fog|cloudy|clear|sunny)\b/)[1];G.weather=w==='sunny'?'clear':w;return`Weather set to ${G.weather}.`}
 if(/\bweather\b/.test(t))return`It's ${G.weather} right now.`;
 if(/\b(money|cash|balance|bank|rich|funds)\b/.test(t)&&!/atm|where|take|go/.test(t))return`You have $${Math.round(G.cash).toLocaleString()} in cash and $${Math.round(G.bank).toLocaleString()} in the bank.`;
 if(/\bhealth|hp|hurt|heal\b/.test(t))return G.health>=100?'You are in perfect health.':`Your health is ${Math.round(G.health)}%. Eat at a restaurant, or ask me to "take me to the hospital".`;
 if(/wanted|police|cops|star/.test(t)&&!/take|go|where|teleport/.test(t))return G.wanted?`You are wanted at level ${G.wanted}. Break line of sight and get far away — or pay bail at the police station.`:'You have a clean record. Keep it that way!';
 if((m=t.match(/(?:bring|call|fetch|get)\s+(?:me\s+)?(?:my\s+)?(.+?)(?:\s+car)?$/))&&!/spawn/.test(t)){const q=m[1].replace(/^(the|a|an|my)\s+/,''),list=G.garageCars.concat(G.extraCars||[]).filter(v=>!v.dead);const v=list.find(c=>c.label.toLowerCase().includes(q))||(/car|ride|vehicle/.test(q)?list[0]:null);
  if(v){const f={x:-Math.sin(P.yaw),z:-Math.cos(P.yaw)},p=P.g.position;if(v.flight){v.flight.on=false;v.flight.p=0}v.group.position.set(p.x+f.x*8,Math.max(p.y,0),p.z+f.z*8);v.heading=P.yaw;v.group.rotation.y=P.yaw;v.vx=v.vz=v.speed=0;v.awake=true;return`Your ${v.label} is waiting right in front of you.`}}
 if(m=t.match(/(?:spawn|give me|get me|i want|create)\s+(?:me\s+)?(?:a|an|the)?\s*(.+)/)){const v=GAME.spawnVehicle(m[1].replace(/\s+car$/,''));return v?`Spawned a ${v.label} in front of you.`:'Hmm, I couldn\'t build that one.'}
 if(/follow me|come (with me|here)|walk with me/.test(t)){B.mode='follow';return'Following you!'}
 if(/\b(stay|wait|stop here|hold)\b/.test(t)){B.mode='stay';return'Okay, I\'ll wait here. Say "follow me" when you want me back.'}
 if(/joke|funny|laugh/.test(t))return JOKES[Math.floor(Math.random()*JOKES.length)];
 if(/who are you|your name|what are you/.test(t))return`I'm ${NAME}, the AI companion of NEON CITY 2030. I stick with you, guide you and handle quick jobs.`;
 if(/thank|thanks|cheers|great|awesome|nice/.test(t))return'Anytime! 😊';
 if(/recommend|suggest|what should i|bored|what to do/.test(t)){const o=['Race the supercars at the circuit north of the city','Ride the elevator up the Burj Neon to the sky restaurant','Take the metro under Grand Plaza','Visit the Supercar Showrooms and test a Bugatti','Fly the Tesla Roadster (press F) over the skyline','Fly a jet from the International Airport','Sail a yacht from the marina to the villa islands'];return'How about this: '+o[Math.floor(Math.random()*o.length)]+'.'}
 return null}
// ---------- optional real AI ----------
async function remote(text){const key=localStorage.getItem('aria_key');if(!key)return null;
 const sys=`You are ARIA, a friendly AI companion robot inside the open-world game NEON CITY 2030 (a luxury city with a mansion, garage with a Tesla Roadster that can fly, supercar showrooms, airport, jets, helicopters, yachts, islands, metro, race track, police, hospital, school, endless city). The player is at ${nearestPoi()}, has $${Math.round(G.cash)} cash and $${Math.round(G.bank)} in the bank, health ${Math.round(G.health)}%, wanted level ${G.wanted}. Reply in at most two short sentences, friendly and in character.`;
 const msgs=B.hist.slice(-8).map(h=>({role:h.who==='me'?'user':'assistant',content:h.text}));if(!msgs.length||msgs[msgs.length-1].role!=='user')msgs.push({role:'user',content:text});
 try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:200,system:sys,messages:msgs})});
  const j=await r.json();if(j.content&&j.content[0])return j.content.map(c=>c.text||'').join('');return'(AI error: '+(j.error&&j.error.message||'no reply')+')'}catch(e){return'(Could not reach the AI service: '+e.message+')'}}
async function reply(text){let a=local(text);if(a)return a;a=await remote(text);if(a)return a;return localStorage.getItem('aria_key')?'…':'I\'m not sure about that one. Type "help" to see what I can do — or add an API key (button below) so I can chat about anything.'}
// ---------- chat window ----------
function render(b){const log=b.querySelector('#alog');log.innerHTML=B.hist.map(h=>`<div style="margin:6px 0;text-align:${h.who==='me'?'right':'left'}"><span style="display:inline-block;max-width:82%;padding:8px 12px;border-radius:12px;background:${h.who==='me'?'#1d5a7a':'#17304a'};text-align:left">${h.who==='me'?'':'<b style="color:#7df0ff">ARIA</b><br>'}${h.text.replace(/</g,'&lt;')}</span></div>`).join('');log.scrollTop=log.scrollHeight}
function open(){if(G.modal)return;if(!B.hist.length)B.hist.push({who:'bot',text:`Hi! I'm ${NAME}, your AI companion. Ask me for directions, a car, the weather… or say "help".`});
 const hasKey=!!localStorage.getItem('aria_key');
 const b=UI.modal(`<h3>🤖 ARIA — AI COMPANION</h3><div id="alog" style="height:260px;overflow:auto;background:#08141f;border:1px solid #28435c;border-radius:10px;padding:8px;min-width:min(520px,80vw)"></div>
 <div class="row"><input type="text" id="ain" placeholder="Talk to ARIA…  (try: take me to the airport)" style="flex:1" autocomplete="off"><button id="asend">Send</button></div>
 <div class="row"><button class="alt" id="aq1">Take me to the airport</button><button class="alt" id="aq2">Bring my Ferrari</button><button class="alt" id="aq3">Make it night</button><button class="alt" id="aq4">Recommend something</button></div>
 <div class="muted">Real-AI chat: ${hasKey?'<b style="color:#7dff9a">key saved</b>':'optional'} — <a href="#" id="akey" style="color:#7df0ff">${hasKey?'change / remove key':'add your Anthropic API key'}</a> (stored only in this browser). Esc closes.</div>`);
 render(b);const inp=b.querySelector('#ain');inp.focus();
 const send=async(txt)=>{txt=(txt||inp.value).trim();if(!txt)return;inp.value='';B.hist.push({who:'me',text:txt});render(b);const a=await reply(txt);B.hist.push({who:'bot',text:a});render(b);say(a)};
 inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')send()};b.querySelector('#asend').onclick=()=>send();
 for(const[i,t]of[['aq1','take me to the airport'],['aq2','bring my ferrari'],['aq3','make it night'],['aq4','recommend something']])b.querySelector('#'+i).onclick=()=>send(t);
 b.querySelector('#akey').onclick=ev=>{ev.preventDefault();const k=prompt('Paste your Anthropic API key (leave empty to remove). It is saved only in this browser and sent only to api.anthropic.com:',localStorage.getItem('aria_key')||'');if(k===null)return;if(k.trim())localStorage.setItem('aria_key',k.trim());else localStorage.removeItem('aria_key');UI.close();setTimeout(open,50)}}
// ---------- world behaviour ----------
const tmpv=new THREE.Vector3();
function placeNear(){const p=P.g.position,a=P.yaw+Math.PI/2+(Math.random()-.5);const x=p.x+Math.cos(a)*2.2,z=p.z+Math.sin(a)*2.2;rig.position.set(x,p.y,z);Col.surf(x,z,p.y+1,2,tmp);if(tmp.y>-1e8)rig.position.y=tmp.y;B.stuck=0}
function update(dt){if(!B.started)return;const p=P.g.position,pos=rig.position,u=rig.userData;
 if(G.active){rig.visible=false;B.vis=false;pos.set(G.active.x,G.active.y,G.active.z)}
 else{if(!B.vis){B.vis=true;rig.visible=true;placeNear()}
  const dx=p.x-pos.x,dz=p.z-pos.z,d=Math.hypot(dx,dz);let spd=0;
  if(B.mode==='follow'){const want=2.6;if(d>want+.6){spd=clamp((d-want)*2.2,1.4,d>14?9.5:6)}
   if(d>40||Math.abs(p.y-pos.y)>5&&d>7||(B.stuck>2.5&&d>6)){placeNear();spd=0}}
  if(spd>0){const nx=dx/d,nz=dz/d;pos.x+=nx*spd*dt;pos.z+=nz*spd*dt;const before={x:pos.x,z:pos.z};Col.pushCircle(pos,.4,pos.y,1.75,.5);if(Math.hypot(before.x-pos.x,before.z-pos.z)>.001)B.stuck+=dt;else B.stuck=Math.max(0,B.stuck-dt);rig.rotation.y=Math.atan2(nx,nz)}
  else{B.stuck=Math.max(0,B.stuck-dt);if(B.mode==='follow'&&d>.5)rig.rotation.y=lerpA(rig.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*4))}
  Col.surf(pos.x,pos.z,pos.y+.5,.62,tmp);if(tmp.y>-1e8)pos.y+=(tmp.y-pos.y)*Math.min(1,dt*12);else pos.y-=9*dt;
  B.phase+=dt*spd*1.8;const sw=Math.sin(B.phase)*clamp(spd/5,0,1)*.8;u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.kneeL.rotation.x=-Math.max(0,-sw)*1.1;u.kneeR.rotation.x=-Math.max(0,sw)*1.1;u.armL.rotation.x=-sw*.9;u.armR.rotation.x=sw*.9;u.elbowL.rotation.x=.2+Math.abs(sw)*.5;u.elbowR.rotation.x=.2+Math.abs(sw)*.5;
  u.halo.rotation.z+=dt*2;rig.position.y+=Math.sin(G.t*2)*.0003}
 if(bubbleT>0){bubbleT-=dt;if(bubbleT<=0&&bubble){rig.remove(bubble);bubble=null}}
 // waypoint
 const wy=document.getElementById('way');
 if(G.waypoint){const d=Math.hypot(G.waypoint.x-p.x,G.waypoint.z-p.z);wy.style.display='block';wy.textContent=`➤ ${G.waypoint.name} · ${fmtD(d)}`;beam.material.opacity=.3+Math.sin(G.t*3)*.1;if(d<14){toast(`You have arrived at ${G.waypoint.name}.`);G.waypoint=null;beam.visible=false;wy.style.display='none'}}else wy.style.display='none'}
function toast(t){G.notify(t)}
function lerpA(a,b,t){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return a+d*t}
export const Bot={open,rig,say,reply:local};
window.__Bot=Bot;
G.onReady.push(()=>{B.started=true;placeNear();B.vis=true});
{const l=document.createElement('div');l.id='ariaLogo';l.title='ARIA AI assistant (press B)';
 l.style.cssText='position:fixed;top:14px;right:222px;width:52px;height:52px;z-index:20;cursor:pointer;filter:drop-shadow(0 0 8px rgba(80,220,255,.7))';
 l.innerHTML='<svg viewBox="0 0 64 64" width="52" height="52"><defs><linearGradient id="alg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7df0ff"/><stop offset="1" stop-color="#8a5cff"/></linearGradient></defs><polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#07131f" stroke="url(#alg)" stroke-width="3"/><path d="M19 44 L32 17 L45 44 M24.5 35 H39.5" fill="none" stroke="url(#alg)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="12" r="0" fill="#fff"/></svg>';
 l.onclick=()=>open();document.body.appendChild(l)}
window.__MODS=window.__MODS||[];window.__MODS.push({update});
