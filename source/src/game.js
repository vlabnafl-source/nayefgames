import {THREE,scene,camera,G,SB,clamp,TAU,CURB,SEA} from './core.js';
import {Col,Inter,Chunks,groundH,inWater} from './world.js';
import {UI} from './ui.js';
import {P,OUTFITS} from './player.js';
import {Vehicle,spawnCar,paints} from './vehicles.js';
import {resolveDef,DEFS,fallbackDef} from './carmodels.js';
import {People} from './peds.js';
import {Traffic} from './traffic.js';
import {Elev} from './elevator.js';
import {cityBuilding,cityHouse} from './city.js';
import {Lamps} from './sky.js';
import {payAny} from './lib.js';

const tmp={};
G.crime=G.crime||((l)=>{G.wanted=Math.max(G.wanted,Math.min(5,l));G.hud()});
G.tp=G.tp||{};G.specials=G.specials||{};
// ---------- save ----------
export function save(){try{localStorage.setItem('neoncity2030',JSON.stringify({cash:G.cash,bank:G.bank,owned:G.owned,outfit:G.outfit,items:G.items||[],extra:G.ownedExtra||[]}))}catch(e){}}
export function load(){try{const s=JSON.parse(localStorage.getItem('neoncity2030')||'null');if(s){G.cash=s.cash??G.cash;G.bank=s.bank??G.bank;G.owned=s.owned||G.owned;G.outfit=s.outfit||0;G.items=s.items||[];G.ownedExtra=s.extra||[];P.setOutfit(G.outfit)}}catch(e){}}
export function resetSave(){try{localStorage.removeItem('neoncity2030')}catch(e){}location.reload()}
// ---------- helpers ----------
const fwd=()=>({x:-Math.sin(P.yaw),z:-Math.cos(P.yaw)});
export function placeAhead(d=9){const f=fwd(),p=P.g.position;let x=p.x+f.x*d,z=p.z+f.z*d;if(G.active){const v=G.active;x=v.x+f.x*(d+6);z=v.z+f.z*(d+6)}return{x,z,yaw:P.yaw}}
export function teleportTo(t){if(G.active)P.exit();Chunks.update(t.x,t.z,60);P.teleport(t.x,(t.y??5)+0,t.z,t.yaw??P.yaw);Col.surf(t.x,t.z,(t.y??5)+3,5,tmp);if(tmp.y>-1e8)P.g.position.y=tmp.y;G.notify('Teleported')}
G.teleportTo=teleportTo;
const spawned=[];
export function spawnVehicle(name){const a=placeAhead(9),n=name.toLowerCase().trim();let v=null;
 const sp=G.specials;let key=null;for(const k in sp){if(n.includes(k)&&(!key||k.length>key.length))key=k}
 if(key){v=sp[key](a.x,a.z,a.yaw+Math.PI,n)}
 else{const def=resolveDef(n)||fallbackDef(name);v=spawnCar(def,a.x,a.z,a.yaw,undefined,{y:Math.max(P.g.position.y,0)});v.heading=a.yaw;if(!resolveDef(n))G.notify(`“${name}” isn't in the garage list — built a custom ${v.label} for you.`)}
 if(v){v.awake=true;spawned.push(v);while(spawned.length>30){const o=spawned.shift();if(o!==G.active&&!o.owned)o.destroy()}
  G.notify(`Spawned ${v.label}`)}return v}
// ---------- admin spawns ----------
let admN=0;
export function spawnBuilding(type){const a=placeAhead(32),x=Math.round(a.x),z=Math.round(a.z),own='adm'+(++admN),grp=new THREE.Group(),sb=new SB(),ctx={sb,owner:own,rnd:Math.random,add:o=>grp.add(o),cleanup:[]};
 const S={skyscraper:[30,30,140],glass:[28,28,110],office:[30,26,52],apartment:[24,24,66],hotel:[40,26,74],tower:[26,26,190],house:[16,13,7],mansion:[28,20,13]};const d=S[type]||S.office;
 if(type==='house'||type==='mansion')cityHouse(ctx,x,z,d[0],d[1],d[2],Math.random);else cityBuilding(ctx,x,z,d[0],d[1],d[2],Math.random);
 sb.build(grp);scene.add(grp);G.notify(`Spawned ${type}`)}
export function spawnObject(type){const a=placeAhead(8),x=a.x,z=a.z,own='obj'+(++admN),sb=new SB(),grp=new THREE.Group(),y=groundH(x,z);
 const ctx={sb,owner:own,add:o=>grp.add(o),cleanup:[]};
 if(type==='atm'){sb.bb('metal',x-.5,y,z-.35,x+.5,y+2,z+.35,0x2a3340,{ao:1});sb.bb('emis',x-.35,y+1.1,z+.35,x+.35,y+1.7,z+.37,0x35e0ff,{ao:1});Col.addBox(own,x-.5,z-.35,x+.5,z+.35,y,y+2);Inter.add(own,{x,y,z,r:3,text:'F — Use ATM',act:()=>G.openATM()})}
 else if(type==='shop'){sb.bb('solid',x-5,y,z-4,x+5,y+3.4,z+4,0xcfc3ae,{ao:1});sb.bb('glass',x-4,y+.2,z+4.02,x+4,y+2.8,z+4.1,0x9fd0e6,{ao:1});Col.addBox(own,x-5,z-4,x+5,z+4,y,y+3.4);
  import('./lib.js').then(L=>{L.sign(ctx,'CORNER SHOP',x,y+3.8,z+4.2,6,1.2,0,'#0b1c2b','#7df0ff')});Inter.add(own,{x,y,z:z+5.5,r:4,text:'F — Buy a snack ($8)',act:()=>{if(payAny(8)){G.health=Math.min(100,G.health+5);G.hud();G.notify('Yum.')}}})}
 else if(type==='ramp'){const n=12;for(let i=0;i<n;i++)sb.bb('solid',x-4,y,z-6+i,x+4,y+(i+1)*.5,z-5+i,0xc9c0a8,{ao:1});Col.addSurf(own,x-4,z-6,x+4,z+6,y,y+6,'z')}
 else if(type==='barrier'){for(let i=-2;i<=2;i++){sb.bb('solid',x+i*2-.9,y,z-.3,x+i*2+.9,y+1,z+.3,0xe5e5e0,{ao:1});sb.bb('solid',x+i*2-.9,y+.4,z-.31,x+i*2+.9,y+.7,z+.31,0xd6342a,{ao:1});Col.addBox(own,x+i*2-.9,z-.3,x+i*2+.9,z+.3,y,y+1)}}
 else if(type==='tree'){import('./lib.js').then(L=>{L.tree(sb,x,z,1.2,y);sb.build(grp)})}
 else if(type==='light'){sb.cyl('metal',x,y,z,.1,.14,7.5,0x3a3f46,6);sb.box('emisN',x,7.4,z,.9,.14,.45,0xffe3b0);Lamps.add(own,x,7,z,0xffd9a0,300)}
 else if(type==='crate'){for(let i=0;i<3;i++){sb.bb('solid',x-1+i*.1,y+i*1.1,z-1,x+1+i*.1,y+i*1.1+1.1,z+1,0xa07a45,{ao:1})}Col.addBox(own,x-1,z-1,x+1.2,z+1,y,y+3.3)}
 sb.build(grp);scene.add(grp);G.notify(`Spawned ${type}`)}
// ---------- economy UIs ----------
G.openATM=function(){const render=()=>{const b=UI.modal(`<h3>🏧 NEON BANK — ATM</h3><div class="row"><div class="item" style="flex:1"><div><b>Wallet</b><div class="muted">cash on you</div></div><b>$${Math.round(G.cash).toLocaleString()}</b></div><div class="item" style="flex:1"><div><b>Bank account</b><div class="muted">safe balance</div></div><b>$${Math.round(G.bank).toLocaleString()}</b></div></div>
  <div class="muted">Withdraw</div><div class="row" id="wd"></div><div class="muted">Deposit</div><div class="row" id="dp"></div><div class="row"><input type="number" id="amt" placeholder="Custom amount" min="1"><button id="cw">Withdraw</button><button id="cd" class="alt">Deposit</button></div><div class="row"><button class="alt" id="cl">Close</button></div>`);
  const mk=(id,amts,f)=>{for(const a of amts){const bt=document.createElement('button');bt.className='alt';bt.textContent=a==='all'?'All':'$'+a.toLocaleString();bt.onclick=()=>{f(a);save();G.hud();render()};b.querySelector(id).appendChild(bt)}};
  const wd=a=>{const n=a==='all'?G.bank:a;if(n<=0||G.bank<n){G.notify('Insufficient bank balance');return}G.bank-=n;G.cash+=n},dp=a=>{const n=a==='all'?G.cash:a;if(n<=0||G.cash<n){G.notify('Insufficient cash');return}G.cash-=n;G.bank+=n};
  mk('#wd',[500,2000,10000,100000,'all'],wd);mk('#dp',[500,2000,10000,100000,'all'],dp);
  b.querySelector('#cw').onclick=()=>{wd(Math.floor(+b.querySelector('#amt').value));save();G.hud();render()};b.querySelector('#cd').onclick=()=>{dp(Math.floor(+b.querySelector('#amt').value));save();G.hud();render()};b.querySelector('#cl').onclick=()=>UI.close()};render()};
G.openGarage=function(){const rows=[];const list=G.garageCars.concat(G.extraCars||[]);
 list.forEach(v=>{if(v.dead)return;rows.push({label:v.label,sub:v.fromShowroom?'Purchased':'Garage vehicle'+(v.flight&&v.def.flight?' · FLIGHT MODE':''),btn:'Drive',onClick:()=>{summon(v)}})});
 UI.menu('🚘 Your Garage',rows,'<div class="muted">Pick a vehicle — it will be brought to you and you will get in. Press F on the Tesla Roadster to fly.</div>')};
export function summon(v){if(G.active)P.exit();const inGarage=v.x<-10&&v.x>-35&&v.z<-4&&v.z>-34;
 if(!inGarage){const h=v.home||{x:-22,z:10,h:Math.PI};v.group.position.set(h.x,CURB,h.z);v.heading=h.h;v.group.rotation.y=h.h;v.vx=v.vz=0;v.speed=0;v.flight.on=false;v.flight.p=0}
 const p=v.exitSpot?v.exitSpot():{x:v.x+2,z:v.z};P.teleport(p.x,v.y,p.z,v.heading);P.enter(v);G.notify(`You are in the ${v.label}. E to exit.`)}
G.summon=summon;
G.sleep=function(){G.time=.27;G.health=100;G.hud();G.notify('You slept until sunrise.');UI.splash('☀ GOOD MORNING','#ffe58b',1800)};
// ---------- death / busted ----------
G.onDeath=function(why){UI.splash('WASTED','#ff4b5c',3200);setTimeout(()=>{if(G.active)P.exit();const fee=Math.min(Math.floor(G.cash*.05)+200,G.cash);G.cash-=fee;G.health=100;G.dead=false;G.wanted=0;const h=G.hospitalSpawn||G.spawn;teleportTo({x:h.x,y:h.y??CURB,z:h.z,yaw:h.yaw});G.hud();G.notify(`You woke up at the ${G.hospitalSpawn?'hospital':'mansion'}. Treatment fee: $${fee}`)},2600)};
// ---------- admin panel ----------
const LUX=['Rolls-Royce','Tesla Roadster','Lamborghini','Bugatti','Ferrari','Mercedes-Benz','BMW','Porsche','Range Rover','McLaren','Audi','Cybertruck'];
const CIV=['Sedan','SUV','Van','Taxi','Hatchback','Police Car','Ambulance'];
const AIR=['Helicopter','Police Helicopter','Private Jet','Airliner','Yacht','Speedboat'];
const POI=()=>Object.keys(G.tp);
export function openLogin(){if(G.modal)return;
 const b=UI.modal(`<h3>ACCESS</h3><div class="row"><button id="pl" style="font-size:18px;padding:18px 34px">PLAYER</button><button id="ad" class="alt" style="font-size:18px;padding:18px 34px">ADMIN</button></div><div class="muted">${G.admin?'Admin mode is active.':'Choose how to play.'}</div>`);
 b.querySelector('#pl').onclick=()=>{G.admin=false;UI.close();G.notify('Player mode')};
 b.querySelector('#ad').onclick=()=>{if(G.admin){adminPanel();return}
  b.innerHTML=`<h3>ADMIN LOGIN</h3><div class="row"><input type="password" id="pw" placeholder="Password" autocomplete="off"><button id="go">Unlock</button></div><div id="msg" style="min-height:44px"></div><div class="row"><button class="alt" id="bk">Back</button></div>`;
  const pw=b.querySelector('#pw');pw.focus();const go=()=>{if(pw.value==='121345'){G.admin=true;adminPanel()}else{b.querySelector('#msg').innerHTML='<div class="denied">ACCESS DENIED</div>';pw.value=''}};
  b.querySelector('#go').onclick=go;pw.onkeydown=e=>{if(e.key==='Enter')go();e.stopPropagation()};b.querySelector('#bk').onclick=()=>{UI.close();openLogin()}}};
let adminTab='veh';
function adminPanel(){const tabs=[['veh','Vehicles'],['lux','Luxury'],['air','Air & Sea'],['bld','Buildings'],['ppl','People'],['wx','Weather'],['time','Day / Night'],['tp','Teleport'],['trf','Traffic'],['obj','Objects & Shops'],['me','Player']];
 const b=UI.modal(`<h3>⚙ ADMIN CONTROL PANEL</h3><div class="tabs" id="tabs"></div><div id="tab"></div><div class="row"><button class="alt" id="cl">Close</button><button class="warn" id="sw">Switch to Player</button></div>`);
 const tabEl=b.querySelector('#tabs');tabs.forEach(([k,n])=>{const bt=document.createElement('button');bt.textContent=n;bt.className=k===adminTab?'on':'alt';bt.onclick=()=>{adminTab=k;adminPanel()};tabEl.appendChild(bt)});
 b.querySelector('#cl').onclick=()=>UI.close();b.querySelector('#sw').onclick=()=>{G.admin=false;UI.close();G.notify('Player mode')};
 const t=b.querySelector('#tab'),grid=(arr,fn,cls='')=>{const g=document.createElement('div');g.className='grid';arr.forEach(a=>{const bt=document.createElement('button');bt.className=cls;bt.textContent=a;bt.onclick=()=>fn(a);g.appendChild(bt)});t.appendChild(g)};
 const label=s=>{const d=document.createElement('div');d.className='muted';d.style.margin='10px 0 4px';d.textContent=s;t.appendChild(d)};
 if(adminTab==='veh'||adminTab==='lux'){label('Type any vehicle name (e.g. "Koenigsegg", "Rolls-Royce", "Lamborghini") and press Enter — unknown names get a custom-built car.');
  const r=document.createElement('div');r.className='row';r.innerHTML=`<input type="text" id="vn" list="vl" placeholder="Vehicle name…"><datalist id="vl">${LUX.concat(CIV,AIR).map(x=>`<option>${x}</option>`).join('')}</datalist><button id="vs">Spawn</button>`;t.appendChild(r);
  const inp=r.querySelector('#vn');const go=()=>{if(inp.value.trim()){spawnVehicle(inp.value);inp.value=''}};r.querySelector('#vs').onclick=go;inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')go()};
  label(adminTab==='lux'?'Luxury & supercars':'Everyday vehicles');grid(adminTab==='lux'?LUX:CIV.concat(LUX),spawnVehicle)}
 else if(adminTab==='air'){label('Aircraft & boats spawn in front of you (aircraft: take off from a runway/open area).');grid(AIR,spawnVehicle)}
 else if(adminTab==='bld'){label('Spawn buildings in front of you');grid(['skyscraper','glass','office','apartment','hotel','tower','house','mansion'],spawnBuilding)}
 else if(adminTab==='ppl'){label('Spawn pedestrians around you');grid([5,10,25,50],n=>{People.spawnAround(P.g.position.x,P.g.position.y,P.g.position.z,n);G.notify(`Spawned ${n} people`)});label('Population target (walkers in the city)');const s=document.createElement('input');s.type='range';s.min=20;s.max=240;s.value=G.pedTarget;s.oninput=()=>{G.pedTarget=+s.value};t.appendChild(s)}
 else if(adminTab==='wx'){label('Weather');grid(['clear','cloudy','rain','storm','fog'],w=>{G.weather=w;G.notify('Weather: '+w)})}
 else if(adminTab==='time'){label(`Time of day (now ${G.hour.toFixed(1)}h)`);const s=document.createElement('input');s.type='range';s.min=0;s.max=24;s.step=.25;s.value=G.hour;s.oninput=()=>{G.time=(+s.value%24)/24};t.appendChild(s);
  label('Day length (seconds per full day — default 12)');const c=document.createElement('input');c.type='range';c.min=6;c.max=600;c.value=G.cycle;c.oninput=()=>{G.cycle=+c.value};t.appendChild(c);
  grid(['Sunrise','Noon','Sunset','Midnight','Pause / resume time','Reset 12 s cycle'],a=>{if(a==='Sunrise')G.time=.25;else if(a==='Noon')G.time=.5;else if(a==='Sunset')G.time=.75;else if(a==='Midnight')G.time=0;else if(a.startsWith('Pause')){G.timePaused=!G.timePaused;G.notify(G.timePaused?'Time paused':'Time running')}else{G.cycle=12;G.timePaused=false}})}
 else if(adminTab==='tp'){label('Teleport');grid(POI(),n=>{const p=G.tp[n];teleportTo(p);UI.close()})}
 else if(adminTab==='trf'){label('Traffic density');const s=document.createElement('input');s.type='range';s.min=0;s.max=2;s.step=.1;s.value=G.trafficDensity;s.oninput=()=>{G.trafficDensity=+s.value};t.appendChild(s);grid(['Empty roads','Light','Normal','Heavy','Traffic jam here'],a=>{G.trafficDensity={'Empty roads':0,Light:.4,Normal:1,Heavy:1.8}[a]??G.trafficDensity;if(a==='Traffic jam here'){Traffic.addJam(P.g.position.x,P.g.position.z,70,90);G.notify('Traffic jam created')}})}
 else if(adminTab==='obj'){label('Spawn objects & shops in front of you');grid(['atm','shop','ramp','barrier','crate','tree','light'],spawnObject)}
 else if(adminTab==='me'){label('Money, health, police');grid(['+$100,000 cash','+$1,000,000 bank','Heal','God mode on/off','Wanted 0','Wanted 3','Wanted 5','Super jump'],a=>{if(a.startsWith('+$100'))G.cash+=1e5;else if(a.startsWith('+$1,'))G.bank+=1e6;else if(a==='Heal')G.health=100;else if(a.startsWith('God')){G.godmode=!G.godmode;G.notify('God mode '+(G.godmode?'ON':'OFF'))}else if(a.startsWith('Wanted')){G.wanted=0;G.crime(+a.slice(7))}else if(a==='Super jump'){P.vy=22}G.hud();save()})}
}

// ---------- live purchase card (world keeps running; Y/Enter = accept, N = reject) ----------
export function useInteract(o){if(G.pendingBuy)return;G.dryRun=true;G.dryCost=0;let err=null;try{o.act()}catch(e){err=e}G.dryRun=false;const cost=Math.round(G.dryCost||0);G.dryCost=0;if(err)throw err;
 if(cost>0){const label=(o._t||'Purchase').replace(/^F\s*—\s*/,'').replace(/\s*—\s*\$[\d,]+.*$/,'').replace(/\s*\(\$[\d,]+[^)]*\)/,'');confirmPurchase(label,cost,()=>{o.act();G.hud()},o)}}
const $b=id=>document.getElementById(id);
export function confirmPurchase(label,cost,go,o,opt){const p=G.player.g.position;G.pendingBuy={go,label,cost,free:!!(opt&&opt.free),x:o?o.x:p.x,z:o?o.z:p.z,r:(o&&o.r||5)+4};refreshBuy();$b('buycard').style.display='block'}
function refreshBuy(){const b=G.pendingBuy;if(!b)return;const tot=G.cash+G.bank,can=b.free||tot>=b.cost;b.can=can;$b('bc-l').textContent=b.label;$b('bc-p').textContent=b.free?'FREE · ADMIN':'$'+b.cost.toLocaleString();
 $b('bc-m').textContent=b.free?`Admin catalog — list price $${b.cost.toLocaleString()} · nothing will be charged`:can?`Cash $${Math.round(G.cash).toLocaleString()} · Bank $${Math.round(G.bank).toLocaleString()} → after: $${Math.round(tot-b.cost).toLocaleString()}`:`NOT ENOUGH MONEY — you are $${Math.round(b.cost-tot).toLocaleString()} short`;
 $b('buycard').classList.toggle('poor',!can);$b('bc-a').disabled=!can}
G.acceptBuy=()=>{const b=G.pendingBuy;if(!b)return;if(!b.can){G.notify('Not enough money for this purchase.');return}G.pendingBuy=null;$b('buycard').style.display='none';b.go()};
G.rejectBuy=(why)=>{if(!G.pendingBuy)return;G.pendingBuy=null;$b('buycard').style.display='none';G.notify(why||'Purchase rejected — nothing was charged.')};
G.updateBuy=()=>{const b=G.pendingBuy;if(!b)return;const p=G.player.g.position;if(Math.hypot(p.x-b.x,p.z-b.z)>b.r){G.rejectBuy('You walked away — purchase cancelled.');return}refreshBuy()};
document.addEventListener('DOMContentLoaded',()=>{});
setTimeout(()=>{$b('bc-a').onclick=()=>G.acceptBuy();$b('bc-r').onclick=()=>G.rejectBuy()},0);
