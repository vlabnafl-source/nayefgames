// Start flow: ADMIN / PLAYER -> (password) -> PLAYER / MULTIPLAYER -> (admin: friend name | player: $36) -> play
import {G} from './core.js';
setTimeout(()=>{
 const play=document.getElementById('play');if(!play||location.hash.includes('test'))return;
 const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#0d2540,#05080f 70%);font:600 16px system-ui;color:#dbe8ff';
 const card=document.createElement('div');card.style.cssText='width:min(440px,90vw);padding:26px;border:1px solid #3aa0ff;border-radius:16px;background:rgba(8,14,26,.9);text-align:center';ov.appendChild(card);document.body.appendChild(ov);
 const btn=(t,id,alt)=>`<button id="${id}" style="display:block;width:100%;margin:10px 0;padding:14px;border-radius:10px;border:1px solid ${alt?'#456':'#3aa0ff'};background:${alt?'#14202e':'#0d3a66'};color:#fff;font:700 17px system-ui;cursor:pointer">${t}</button>`;
 const inp=(id,ph,type)=>`<input id="${id}" type="${type||'text'}" placeholder="${ph}" autocomplete="off" style="width:100%;box-sizing:border-box;padding:12px;margin:8px 0;border-radius:10px;border:1px solid #2a6aa8;background:#05080f;color:#fff;font:600 16px system-ui;text-align:center">`;
 const title=t=>`<div style="font:800 24px system-ui;color:#7fd0ff;margin-bottom:6px">NEON CITY 2030</div><div style="opacity:.8;margin-bottom:12px">${t}</div>`;
 const $=s=>card.querySelector(s);let isAdmin=false;
 const start=()=>{ov.remove();play.click()};
 function step0(){card.innerHTML=title('Choose your device')+btn('💻 LAPTOP / PC (keyboard + mouse)','lp')+btn('📱 MOBILE (touch keys on screen)','mb',1);$('#lp').onclick=()=>{G.enableTouch&&G.enableTouch(false);step1()};$('#mb').onclick=()=>{G.enableTouch&&G.enableTouch(true);step1()}}
 function step1(){card.innerHTML=title('Choose how you want to play')+btn('🛡 ADMIN','a')+btn('🎮 PLAYER','p',1);$('#a').onclick=pw;$('#p').onclick=()=>{isAdmin=false;step2()}}
 function pw(){card.innerHTML=title('Admin password')+inp('pw','Enter password','password')+'<div id="err" style="color:#ff6b6b;min-height:22px;font-weight:800"></div>'+btn('Enter','go')+btn('Back','bk',1);
  const f=$('#pw');setTimeout(()=>f.focus(),30);const ok=()=>{if(f.value==='121345'){isAdmin=true;G.admin=true;step2()}else{$('#err').textContent='ACCESS DENIED';f.value=''}};
  $('#go').onclick=ok;f.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')ok()};$('#bk').onclick=step1}
 function step2(){card.innerHTML=title(isAdmin?'Admin mode unlocked':'Player mode')+btn('🏙 PLAYER (single player)','sp')+btn('🌐 MULTIPLAYER','mp',1);$('#sp').onclick=start;$('#mp').onclick=()=>{let paid=false;try{paid=localStorage.getItem('neon_mp_paid')==='1'}catch(e){}if(isAdmin||paid)friend();else pay()}}
 function pay(){card.innerHTML=title('Multiplayer')+`<div style="font:800 30px system-ui;color:#ffd36a;margin:10px 0">36 DOLLARS FOR IT</div><div id="err" style="color:#ff6b6b;min-height:22px;font-weight:800"></div>`+btn('✔ Accept — pay $36','ac')+btn('✖ Reject','rj',1);
  $('#ac').onclick=()=>{if(G.cash<36){$('#err').textContent='Not enough cash';return}G.cash-=36;try{localStorage.setItem('neon_mp_paid','1')}catch(e){}G.save&&G.save();friend()};$('#rj').onclick=step2}
 function friend(){card.innerHTML=title('Play with a friend')+inp('fn','Your name')+inp('ff',"Other friend's name")+'<div id="st" style="min-height:22px;opacity:.85"></div>'+btn('Connect & play','cn')+btn('Back','bk',1);
  let nm='';try{nm=localStorage.getItem('neon_mp_name')||''}catch(e){}$('#fn').value=nm;for(const e of card.querySelectorAll('input'))e.onkeydown=ev=>ev.stopPropagation();
  $('#bk').onclick=step2;$('#cn').onclick=()=>{const me=$('#fn').value.trim(),fr=$('#ff').value.trim();if(!me||!fr){$('#st').textContent='Type both names';return}
   const url=location.protocol.startsWith('http')?(location.protocol==='https:'?'wss://':'ws://')+location.host:'ws://localhost:8080';G.netConnect(url,me);G.mpFriend=fr.toLowerCase();$('#st').textContent='Connecting…';
   const t=setInterval(()=>{const N=G.net;if(N.status==='online'){clearInterval(t);const f=[...N.remotes.values()].find(r=>r.name.toLowerCase()===G.mpFriend);start();G.notify&&G.notify(f?'🌐 Playing with '+f.name:'🌐 Online — waiting for '+fr+' to join (you will be teleported to them)')}},300);setTimeout(()=>{clearInterval(t);if(G.net.status!=='online')$('#st').textContent='Could not reach the server — start server/server.js first'},6000)}}
 step0();
 // teleport to the friend when they appear
 let done=false;window.__MODS.push({update(){if(done||!G.mpFriend||!G.started||G.net.status!=='online')return;const f=[...G.net.remotes.values()].find(r=>r.name.toLowerCase()===G.mpFriend);if(f&&f.tgt){done=true;window.__P.teleport(f.tgt.x+2,f.tgt.y,f.tgt.z+2,0);G.notify('🌐 Teleported to '+f.name)}}});
},0);
