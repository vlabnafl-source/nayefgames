// NEON CITY 2030 — multiplayer relay server (no dependencies, Node 16+).
//   node server.js            -> http://localhost:8080  (also serves the game, so friends can open http://<your-ip>:8080)
//   PORT=9000 MAX=16 node server.js
// Implements RFC 6455 WebSocket by hand. Clients send their own state (position, vehicle, chat); the server validates,
// rate-limits and relays it to everyone else. The city itself is deterministic, so every player sees the same streets and buildings.
'use strict';
const http=require('http'),crypto=require('crypto'),fs=require('fs'),path=require('path'),os=require('os');
const PORT=+process.env.PORT||8080,MAX=+process.env.MAX||16,GUID='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const GAME=[path.join(__dirname,'..','NEON_CITY_2030.html'),path.join(__dirname,'NEON_CITY_2030.html'),path.join(__dirname,'..','index.html')].find(f=>fs.existsSync(f));
const players=new Map();let nextId=1;
const server=http.createServer((req,res)=>{
 const u=req.url.split('?')[0];
 if(u==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,players:players.size,max:MAX}));return}
 if((u==='/'||u==='/index.html'||u==='/NEON_CITY_2030.html')&&GAME){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});fs.createReadStream(GAME).pipe(res);return}
 res.writeHead(404);res.end('Not found');
});
const enc=s=>{const p=Buffer.from(s),n=p.length;let h;if(n<126)h=Buffer.from([0x81,n]);else if(n<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(n,2)}else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(n),2)}return Buffer.concat([h,p])};
const send=(c,o)=>{if(c.sock.writable)c.sock.write(enc(JSON.stringify(o)))};
const bcast=(o,except)=>{const f=enc(JSON.stringify(o));for(const c of players.values())if(c!==except&&c.sock.writable)c.sock.write(f)};
const num=(v,lim)=>typeof v==='number'&&isFinite(v)?Math.max(-lim,Math.min(lim,v)):0;
const clean=(s,n)=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);
function onMessage(c,txt){
 let m;try{m=JSON.parse(txt)}catch(e){return}
 const now=Date.now();
 if(m.t==='join'&&!c.joined){
  c.name=clean(m.name,16)||('Player'+c.id);c.joined=true;c.color=Math.abs(+m.color|0)%0xffffff;
  send(c,{t:'welcome',id:c.id,max:MAX,players:[...players.values()].filter(p=>p.joined&&p!==c).map(p=>({id:p.id,name:p.name,color:p.color,s:p.s}))});
  bcast({t:'join',id:c.id,name:c.name,color:c.color},c);console.log(`+ ${c.name} (#${c.id}) — ${[...players.values()].filter(p=>p.joined).length} online`);
 }else if(!c.joined)return;
 else if(m.t==='state'){
  if(now-c.lastS<30)return;c.lastS=now;
  const s={x:num(m.x,1e5),y:num(m.y,5e3),z:num(m.z,1e5),h:num(m.h,1e3),v:m.v?clean(m.v,24):null,k:m.k==='air'||m.k==='boat'?m.k:'car',p:num(m.p,4),r:num(m.r,4),sp:num(m.sp,400),sw:m.sw?1:0};
  c.s=s;bcast({t:'state',id:c.id,s},c);
 }else if(m.t==='chat'){
  if(now-c.lastC<400)return;c.lastC=now;const text=clean(m.text,200);if(!text)return;
  const o={t:'chat',id:c.id,name:c.name,text};send(c,o);bcast(o,c);console.log(`[chat] ${c.name}: ${text}`);
 }else if(m.t==='ping')send(c,{t:'pong',n:m.n});
}
server.on('upgrade',(req,sock)=>{
 const key=req.headers['sec-websocket-key'];
 if(!key||players.size>=MAX){sock.end('HTTP/1.1 '+(key?'503 Server full':'400 Bad Request')+'\r\n\r\n');return}
 sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(key+GUID).digest('base64')+'\r\n\r\n');
 const c={id:nextId++,sock,joined:false,name:'',s:null,lastS:0,lastC:0,alive:Date.now()};players.set(c.id,c);sock.setNoDelay(true);
 let buf=Buffer.alloc(0);
 const drop=()=>{if(!players.has(c.id))return;players.delete(c.id);if(c.joined){bcast({t:'leave',id:c.id});console.log(`- ${c.name} left — ${players.size} online`)}try{sock.destroy()}catch(e){}};
 sock.on('data',d=>{c.alive=Date.now();buf=Buffer.concat([buf,d]);if(buf.length>1<<16){drop();return}
  while(buf.length>=2){
   const op=buf[0]&15,masked=buf[1]&128;let len=buf[1]&127,off=2;
   if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10}
   if(len>8192){drop();return}
   if(buf.length<off+(masked?4:0)+len)return;
   let payload;if(masked){const mk=buf.slice(off,off+4);payload=Buffer.from(buf.slice(off+4,off+4+len));for(let i=0;i<len;i++)payload[i]^=mk[i&3];off+=4}else payload=buf.slice(off,off+len);
   buf=buf.slice(off+len);
   if(op===8){try{sock.write(Buffer.from([0x88,0]))}catch(e){}drop();return}
   if(op===9){sock.write(Buffer.concat([Buffer.from([0x8a,payload.length]),payload]))}
   else if(op===1)onMessage(c,payload.toString('utf8'));
  }});
 sock.on('close',drop);sock.on('error',drop);
});
setInterval(()=>{const t=Date.now();for(const c of players.values()){if(t-c.alive>60000){try{c.sock.destroy()}catch(e){}}else if(c.sock.writable)c.sock.write(Buffer.from([0x89,0]))}},20000);
server.listen(PORT,'0.0.0.0',()=>{
 console.log('NEON CITY 2030 multiplayer server running (max '+MAX+' players)');
 console.log('  This computer : http://localhost:'+PORT);
 for(const l of Object.values(os.networkInterfaces()))for(const a of l)if(a.family==='IPv4'&&!a.internal)console.log('  Same Wi-Fi/LAN: http://'+a.address+':'+PORT+'   (friends open this address and press O)');
 console.log('  Over the internet: forward TCP port '+PORT+' on your router, or host this folder on any VPS (wss:// needs an https reverse proxy).');
 if(!GAME)console.log('  (NEON_CITY_2030.html not found next to the server — clients must open the game file themselves)');
});
