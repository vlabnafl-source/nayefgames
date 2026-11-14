import {THREE,G,C,M,CURB,TAU,canvasTex,clamp,shade} from './core.js';
import {Col,registerGen} from './world.js';
import {Frame,slab,sign,lampAt,tree,toast} from './lib.js';
import {People} from './peds.js';
import {payAny} from './lib.js';

const clockTex=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#f4efe2';x.beginPath();x.arc(64,64,60,0,TAU);x.fill();x.strokeStyle='#2b2b2b';x.lineWidth=5;x.stroke();x.fillStyle='#222';for(let i=0;i<12;i++){const a=i/12*TAU;x.fillRect(64+Math.sin(a)*50-2,64-Math.cos(a)*50-2,4,4)}x.lineWidth=5;x.beginPath();x.moveTo(64,64);x.lineTo(64,24);x.stroke();x.lineWidth=4;x.beginPath();x.moveTo(64,64);x.lineTo(92,76);x.stroke()},{clamp:true});
const flagTex=canvasTex(128,80,(x,w,h)=>{for(let i=0;i<7;i++){x.fillStyle=i%2?'#f4f4f4':'#b22234';x.fillRect(0,i*h/7,w,h/7+1)}x.fillStyle='#3c3b6e';x.fillRect(0,0,56,h*4/7)},{clamp:true});
const KID=.76;
function school(ctx){const{cx,cz,sb}=ctx,own=ctx.owner,f=new Frame(ctx,'S',cx,cz+30),y0=CURB,FH=4.2,TOP=y0+FH*3;
 // ---------- ground floor shell ----------
 f.wk='brick';
 const win=(a,b,yb=1.0,yt=3.5)=>({a,b,k:'win',yb:y0+yb,yt:y0+yt});
 f.floor(-28,0,28,16,y0+.02,0xe8e2d6);f.floor(-9,0,9,16,y0+.03,0xffffff,'marble');f.floor(-28,0,-9,16,y0+.03,0xe2c49a,'wood');f.floor(19,0,28,16,y0+.03,0xd9b48a,'wood');f.floor(9,0,19,16,y0+.03,0xd8e0e0,'marble');
 f.wallU(0,-28,28,y0,y0+FH-.4,.5,0xffffff,[{a:-3,b:3,k:'door',yb:y0,yt:y0+3.5},win(-26.5,-19),win(-17,-10.5),win(-8.5,-5.5),win(5.5,8.5),win(10.5,17),win(19,26.5)]);
 f.wallU(16,-28,28,y0,y0+FH-.4,.5,0xffffff,[{a:-2,b:2,k:'door',yb:y0,yt:y0+3.3},win(-26.5,-19),win(-17,-10.5),win(-8.5,-4),win(4,8.5),win(10.5,17),win(19,26.5)]);
 f.wallV(-28,0,16,y0,y0+FH-.4,.5,0xffffff,[win(3,13)]);f.wallV(28,0,16,y0,y0+FH-.4,.5,0xffffff,[win(3,13)]);
 f.wk='wall';f.trim=1;
 f.wallV(-9,0,16,y0,y0+FH-.4,.3,0xf1ede4,[{a:6,b:8.6,k:'door',yb:y0,yt:y0+2.8},{a:11,b:13,k:'win',yb:y0+1,yt:y0+2.6}]);
 f.wallV(9,0,16,y0,y0+FH-.4,.3,0xf1ede4,[{a:2,b:5,k:'door',yb:y0,yt:y0+2.8},{a:10,b:13,k:'door',yb:y0,yt:y0+2.8}]);
 f.wallV(-18,0,16,y0,y0+FH-.4,.3,0xf1ede4,[{a:6,b:8.6,k:'door',yb:y0,yt:y0+2.8}]);f.wallV(19,0,16,y0,y0+FH-.4,.3,0xf1ede4,[{a:6,b:9,k:'door',yb:y0,yt:y0+2.8}]);
 f.trim=0;f.wk='solid';
 // ceiling slab + upper floors (brick) with window grids
 const r=f.r(-28.5,-.5,28.5,16.5);slab(ctx,r[0],r[1],r[2],r[3],y0+FH,.4,0xd9d4c8,[],{noSurf:true,ceil:0xf6f2ea});
 sb.bb('brick',r[0],y0+FH,r[1],r[2],TOP,r[3],0xffffff,{su:1/2,sv:1/1.2,top:'solid',rc:0x7a6a5a,tu:.3});Col.addBox(own,r[0],r[1],r[2],r[3],y0+FH,TOP);
 sb.bb('solid',r[0]-.3,TOP,r[1]-.3,r[2]+.3,TOP+.5,r[3]+.3,0xe8e2d6,{ao:1});sb.bb('solid',r[0]-.3,y0+FH-.3,r[1]-.3,r[2]+.3,y0+FH+.1,r[3]+.3,0xe8e2d6,{ao:1});sb.bb('solid',r[0]-.3,y0+FH*2-.1,r[1]-.3,r[2]+.3,y0+FH*2+.1,r[3]+.3,0xe8e2d6,{ao:1});
 for(let fl=1;fl<=2;fl++){const yb=y0+fl*FH+1;for(let u=-26;u<26;u+=4.4){for(const v of[-.56,16.56]){const q=f.r(u,v-.03,u+2.4,v+.03);sb.bb('glass',q[0],yb,q[1],q[2],yb+2.1,q[3],0x9fd0e6,{ao:1,noBottom:true});
   for(const[a,b,c2,d]of[[u,yb,u+2.4,yb+.08],[u,yb+2.02,u+2.4,yb+2.1],[u,yb,u+.08,yb+2.1],[u+2.32,yb,u+2.4,yb+2.1],[u+1.16,yb,u+1.24,yb+2.1]]){const z=f.r(a,v-.06,c2,v+.06);sb.bb('solid',z[0],b,z[1],z[2],d,z[3],0xf4f1ea,{ao:1})}}}}
 // entrance portico + columns + sign
 const pr=f.r(-7,-4,7,0);sb.bb('solid',pr[0],y0+4.0,pr[1],pr[2],y0+4.6,pr[3],0xf4f1ea,{ao:1,rc:0x9a9a9a});Col.addBox(own,pr[0],pr[1],pr[2],pr[3],y0+4,y0+4.6,{cam:true});
 for(const u of[-6.4,-2.2,2.2,6.4]){const p=f.p(u,-3.4);sb.cyl('solid',p[0],y0,p[1],.42,.36,4.0,0xf8f5ee,14);Col.box(own,p[0],y0+2,p[1],.8,4,.8)}
 const st=[f.r(-7.5,-4.6,7.5,-3.4),f.r(-7.5,-3.6,7.5,-2.4)];sb.bb('solid',st[0][0],y0,st[0][1],st[0][2],y0+.12,st[0][3],0xd9d4c8,{ao:1});
 sign(ctx,'NEON CITY SCHOOL',f.p(0,-4.1)[0],y0+5.4,f.p(0,-4.1)[1],14,1.6,f.yaw,'#2a3f8f','#ffd23f');
 // clock tower
 const tw=f.r(-4,4,4,12);sb.bb('brick',tw[0],TOP+.5,tw[1],tw[2],TOP+9.5,tw[3],0xffffff,{su:1/2,sv:1/1.2,top:'solid',rc:0x6a6a6a});Col.addBox(own,tw[0],tw[1],tw[2],tw[3],TOP,TOP+9.5);
 sb.bb('solid',tw[0]-.4,TOP+9.5,tw[1]-.4,tw[2]+.4,TOP+10,tw[3]+.4,0xe8e2d6,{ao:1});sb.cyl('solid',(tw[0]+tw[2])/2,TOP+10,(tw[1]+tw[3])/2,3.4,0,3.4,0x3a4a6a,4);
 for(const[u,v,yaw]of[[0,3.9,0],[0,12.1,Math.PI],[-4.1,8,-Math.PI/2],[4.1,8,Math.PI/2]]){const p=f.p(u,v),m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({map:clockTex,toneMapped:false}));m.position.set(p[0],TOP+6.2,p[1]);m.rotation.y=f.yaw+yaw*(f.yaw===0?1:1);ctx.add(m)}
 // flag
 {const p=f.p(-12,-6);sb.cyl('metal',p[0],y0,p[1],.1,.14,12,0xd0d4da,8);const fm=new THREE.Mesh(new THREE.PlaneGeometry(3,1.9),new THREE.MeshBasicMaterial({map:flagTex,side:THREE.DoubleSide,toneMapped:false}));fm.position.set(p[0]+1.6,y0+11,p[1]);ctx.add(fm);Col.box(own,p[0],y0+6,p[1],.4,12,.4)}
 // ---------- interior ----------
 const y=y0+.03,zr=f.r(-28,0,28,16);Col.addZone(own,zr[0],zr[1],zr[2],zr[3],0,y0+FH);
 for(const[u,v]of[[-18,5],[-18,12],[18,5],[18,12],[0,5],[0,12],[-24,8],[24,8]])f.lamp(u,y0+FH-.5,v,0xfff4e0,250);
 // hall
 f.fb(0,9,5,1.1,y,1.1,0x5a3d28);f.fb(0,9.1,5.1,1.2,y+1.1,.07,0xe8e6e0,false);f.npc(0,10.3,y,'work','staff',0,-1);
 for(const s of[-1,1])for(let k=0;k<6;k++)f.fb(s*8.6,2+k*2,.5,1.6,y,2.1,[0x2e6fb5,0xb02a2a,0x3a8a5a,0xd9a21b][k%4]);
 f.fb(-4.6,15.3,3,.4,y,2.3,0x5a3d28);f.fb(-4.6,15.15,2.8,.05,y+.8,1.2,0x7bd0e8,false,'glass');for(let k=0;k<3;k++)f.fb(-5.4+k*.8,15.1,.4,.1,y+.9,.3,0xd5a94f,false);
 f.fb(4.6,15.4,3.2,.1,y+.8,1.4,0x8a5a2a,false);f.sign('WELCOME BACK STUDENTS!',0,y+3.2,15.8,6,.8,'#2a3f8f','#ffd23f');
 f.inter(0,y,7,4.5,'F — School notice board: “Open day today — science fair at 3 PM!”',()=>toast('Notice board: Science fair at 3 PM · Sports day on Friday.'));
 f.pace(-6,3,6,14,y,null,{sc:KID});f.pace(5,13,-5,4,y,null,{sc:KID});f.npc(-7,6,y,'talk','staff',1,0);f.npc(-6,6,y,'talk',null,-1,0,{sc:KID});
 // classrooms
 for(const[u0,u1,board,subj]of[[-28,-18,-27.6,'MATH · 2 + 2 = 4'],[-18,-9,-17.6,'SCIENCE · H₂O']]){const cu=(u0+u1)/2;
  f.fb(board<0?u0+.5:u0+.5,8,.15,7,y,.9,0x2a2a2a,false);
  const bd=f.p(u0+.4,8);sign(ctx,subj,bd[0],y+2.0,bd[1],5.2,1.7,f.yaw-Math.PI/2*0+(Math.PI/2)*(f.yaw===0?-1:1),'#2f5d45','#f2f2f2');
  for(let r=0;r<3;r++)for(let c2=0;c2<2;c2++){const u=u0+3.2+r*2.1,v=3.5+c2*5;f.fb(u,v,.9,1.4,y+.62,.05,0xd9b48a);f.fb(u,v,.06,.06,y,.62,0x4a4d52,false);f.fb(u+.7,v,.5,.5,y+.35,.05,0x2e6fb5,false);f.fb(u+.7,v+.2,.04,.4,y+.4,.5,0x2e6fb5,false);f.npc(u+.75,v,y,'sit',null,-1,0,{sc:KID})}
  f.fb(u0+1.6,8,.8,1.6,y+.75,.06,0x5a3d28);f.fb(u0+1.6,8,.8,1.6,y,.75,0x3a2a1c);f.npc(u0+.9,8,y,'work','staff',1,0);
  f.fb(u1-.6,13.3,.5,3,y,2.1,0x5a3d28);f.fb(u1-.6,3,.5,.5,y,1.2,0x2e6fb5,false);
  f.inter(cu,y,8,5.5,'F — Join the lesson: “'+subj+'”',()=>toast('The teacher smiles: '+subj+' — class dismissed!'))}
 // cafeteria
 for(let k=0;k<3;k++){const v=3.5+k*3.8;f.fb(14,v,6,1,y+.72,.05,0xf0efe9);f.fb(14,v-.9,6,.3,y+.45,.05,0xd0cfc8,false);f.fb(14,v+.9,6,.3,y+.45,.05,0xd0cfc8,false);f.fb(14,v,.2,.2,y,.72,0x4a4d52,false);for(let q=0;q<3;q++){f.npc(12+q*2,v-.9,y+.45,'sit',null,0,1,{sc:KID});f.npc(12+q*2,v+.9,y+.45,'sit',null,0,-1,{sc:KID})}}
 f.fb(14,15.2,9,.9,y,1.1,0xd8d8d2);f.fb(14,15.2,9.1,1,y+1.1,.06,0x2a2d33,false);f.npc(12,14.2,y,'work','chef',0,1);f.npc(16,14.2,y,'work','chef',0,1);
 f.inter(14,y,13,4,'F — School lunch ($6, +10 health)',()=>{if(payAny(6)){G.health=Math.min(100,G.health+10);G.hud();toast('Mac & cheese, apple and milk. Nice.')}});
 // library
 for(let k=0;k<3;k++)f.fb(24,3+k*4.2,7,.6,y,2.2,[0x7a4a2a,0x5a3d28,0x6a4a30][k]);for(let k=0;k<3;k++)f.fb(24,3+k*4.2,6.6,.62,y+.5+k*.55,.35,[0xb02a2a,0x2e6fb5,0x3a8a5a][k],false);
 f.fb(22,14,2.4,1.1,y+.72,.05,0x8a6a3a);f.fb(22,14,.2,.2,y,.72,0x4a4d52,false);f.npc(24,14.3,y,'sit','staff',0,-1);f.npc(21,13.2,y,'sit',null,0,1,{sc:KID});
 f.sign('LIBRARY',23.5,y+3.1,15.8,3.4,.7,'#3a2a1c','#ffd28a');
 f.inter(23,y,10,4.5,'F — Read a library book',()=>{toast('You read a chapter. Knowledge +1.')});
 // ---------- grounds ----------
 const P=(u0,v0,u1,v1,col,yy=CURB+.02)=>{const q=f.r(u0,v0,u1,v1);sb.flat('ground',q[0],q[1],q[2],q[3],yy,col)};
 P(-33,19,-13,40,0xb0433a);P(-30,22,-16,30,0x2e6fb5);P(-34,-6,34,0,0xcfc9bb);P(-34,0,-28,19,0xcfc9bb);P(28,0,34,19,0xcfc9bb);
 P(-8,24,24,56,0x3f8a47,CURB+.03);for(let k=0;k<8;k++)P(-8,24+k*4,24,26+k*4,0x4a9a52,CURB+.035);
 // field lines + goals
 const lw=.12;P(-8,24,24,24+lw*2,0xf4f4f0,CURB+.04);P(-8,56-lw*2,24,56,0xf4f4f0,CURB+.04);P(-8,24,-8+lw*2,56,0xf4f4f0,CURB+.04);P(24-lw*2,24,24,56,0xf4f4f0,CURB+.04);P(-8,40-lw,24,40+lw,0xf4f4f0,CURB+.04);
 for(const v of[24.2,55.8]){for(const s of[-1,1]){const p=f.p(8+s*3.2,v);sb.cyl('metal',p[0],CURB,p[1],.07,.07,2.4,0xf4f4f0,6);Col.box(own,p[0],CURB+1.2,p[1],.3,2.4,.3)}const a=f.r(4.7,v-.07,11.3,v+.07);sb.bb('metal',a[0],CURB+2.35,a[1],a[2],CURB+2.45,a[3],0xf4f4f0,{ao:1})}
 // track ring
 P(-12,20,28,24,0xb0433a,CURB+.025);P(-12,56,28,60,0xb0433a,CURB+.025);P(-12,24,-8,56,0xb0433a,CURB+.025);P(24,24,28,56,0xb0433a,CURB+.025);
 // playground equipment
 {const sw=f.p(-28,24);for(const dx of[-2.2,2.2]){sb.cyl('metal',sw[0]+dx,CURB,sw[1],.08,.08,2.8,0xd6342a,6)}sb.bb('metal',sw[0]-2.3,CURB+2.75,sw[1]-.06,sw[0]+2.3,CURB+2.85,sw[1]+.06,0xd6342a,{ao:1});for(const dx of[-1,1]){sb.bb('solid',sw[0]+dx-.2,CURB+.6,sw[1]-.15,sw[0]+dx+.2,CURB+.66,sw[1]+.15,0x222,{ao:1});sb.bb('metal',sw[0]+dx-.01,CURB+.66,sw[1]-.01,sw[0]+dx+.01,CURB+2.8,sw[1]+.01,0x888,{ao:1,noBottom:true})}
  const sl=f.p(-20,28);sb.bb('solid',sl[0]-.8,CURB,sl[1]-.8,sl[0]+.8,CURB+2.4,sl[1]+.8,0x2e6fb5,{ao:1});for(let i=0;i<8;i++)sb.bb('solid',sl[0]-.5,CURB+2.4-i*.3-.3,sl[1]+.8+i*.35,sl[0]+.5,CURB+2.4-i*.3,sl[1]+1.15+i*.35,0xf2c230,{ao:1});Col.box(own,sl[0],CURB+1.2,sl[1],1.6,2.4,1.6)
  const mb=f.p(-27,35);for(let k=0;k<5;k++){sb.cyl('metal',mb[0]+k*1.2-2.4,CURB,mb[1],.06,.06,2.2,0xd6342a,6)}sb.bb('metal',mb[0]-2.5,CURB+2.15,mb[1]-.05,mb[0]+2.5,CURB+2.25,mb[1]+.05,0xd6342a,{ao:1});
  const sbx=f.p(-18,36);sb.bb('solid',sbx[0]-1.5,CURB,sbx[1]-1.5,sbx[0]+1.5,CURB+.3,sbx[1]+1.5,0xd9c9a8,{ao:1})}
 for(let k=0;k<9;k++)f.npc(-30+(k%3)*5,22+Math.floor(k/3)*5,CURB+.02,k%3===0?'talk':'idle',null,k%2?1:-1,0,{sc:KID});f.pace(-31,22,-14,38,CURB+.02,null,{sc:KID});f.pace(-14,24,-30,36,CURB+.02,null,{sc:KID});f.pace(-9,22,27,22,CURB+.02,null,{sc:KID});f.pace(27,58,-9,58,CURB+.02,'swim',{sc:KID});f.npc(-12,26,CURB+.02,'idle','staff',1,0);
 for(let k=0;k<4;k++)f.npc(0+k*4,40,CURB+.02,'idle',null,0,k%2?1:-1,{sc:KID});
 // gym building
 {const gf=new Frame(ctx,'S',cx,cz+30);gf.wk='brick';const g0=f.p(0,0);gf.wallU(44,-33,-15,y0,y0+8,.4,0xffffff,[{a:-26,b:-22,k:'door',yb:y0,yt:y0+3.2}]);gf.wallU(62,-33,-15,y0,y0+8,.4,0xffffff);gf.wallV(-33,44,62,y0,y0+8,.4,0xffffff);gf.wallV(-15,44,62,y0,y0+8,.4,0xffffff,[win2(48,52,y0),win2(54,58,y0)]);
  const gr=f.r(-33.3,43.7,-14.7,62.3);sb.bb('solid',gr[0],y0+8,gr[1],gr[2],y0+8.5,gr[3],0x3a4a6a,{ao:1,rc:0x55575b});Col.addBox(own,gr[0],gr[1],gr[2],gr[3],y0+8,y0+8.5,{cam:true});Col.addZone(own,gr[0],gr[1],gr[2],gr[3],0,y0+8);
  gf.floor(-33,44,-15,62,y0+.02,0xc99a5a,'wood');for(const[a,b,c2,d]of[[-32,45,-16,45.12],[-32,60.88,-16,61],[-32,45,-31.88,61],[-16.12,45,-16,61],[-32,52.94,-16,53.06]])gf.floor(a,b,c2,d,y0+.03,0xf4f4f0);
  for(const v of[46,60]){const p=f.p(-24,v);sb.cyl('metal',p[0],y0,p[1],.08,.08,3.1,0x888,6);sb.bb('solid',p[0]-.9,y0+3.05,p[1]+(v<50?-.05:-.05),p[0]+.9,y0+3.9,p[1]+.05,0xf4f4f0,{ao:1});Col.box(own,p[0],y0+1.5,p[1],.3,3,.3)}
  for(const[u,v]of[[-28,52],[-22,54],[-26,56],[-20,50]])gf.npc(u,v,y0+.03,'idle',null,1,0,{sc:KID});gf.pace(-30,47,-18,59,y0+.03,null,{sc:KID});gf.lamp(-24,y0+7,53,0xfff4e0,260);sign(ctx,'GYMNASIUM',...[f.p(-24,43.8)[0]],y0+8.9,...[f.p(-24,43.8)[1]],8,1.1,f.yaw,'#2a3f8f','#ffd23f')}
 // school bus
 {const b=f.p(31,32),bx=b[0],bz=b[1];sb.bb('solid',bx-1.3,CURB+.5,bz-5.5,bx+1.3,CURB+2.9,bz+5.5,0xf2b705,{ao:1});sb.bb('solid',bx-1.31,CURB+1.2,bz-5.4,bx+1.31,CURB+1.45,bz+5.4,0x15161a,{ao:1});for(let k=0;k<7;k++)for(const s of[-1,1])sb.bb('glass',bx+s*1.29,CURB+1.7,bz-5+k*1.4,bx+s*1.33,CURB+2.6,bz-4.1+k*1.4,0x0b1620,{ao:1,top:'glass'});
  sb.bb('glass',bx-1.1,CURB+1.7,bz-5.52,bx+1.1,CURB+2.7,bz-5.45,0x0b1620,{ao:1});for(const dz of[-3.6,3.6])for(const s of[-1,1])sb.cyl('solid',bx+s*1.2,CURB+.45,bz+dz,.5,.5,.3,0x151517,12);sb.box('emisN',bx,CURB+2.95,bz-5.2,2,.15,.15,0xff3030);Col.box(own,bx,CURB+1.7,bz,2.7,3.2,11.2);
  sign(ctx,'SCHOOL BUS',bx+1.34,CURB+2.2,bz,5,.7,Math.PI/2*(f.yaw===0?1:1)+f.yaw,'#f2b705','#111')}
 // fence + gate + trees
 const fen=(u0,v0,u1,v1)=>{const q=f.r(u0,v0,u1,v1);sb.bb('metal',q[0],CURB,q[1],q[2],CURB+2.0,q[3],0x2a2d33,{ao:1});Col.addBox(own,q[0],q[1],q[2],q[3],CURB,CURB+2)};
 fen(-34.3,-5.2,-4.5,-4.8);fen(4.5,-5.2,34.3,-4.8);fen(-34.3,-5,-33.9,64.3);fen(33.9,-5,34.3,64.3);fen(-34.3,63.9,34.3,64.3);
 for(const u of[-4.5,4.5]){const p=f.p(u,-5);sb.bb('solid',p[0]-.4,CURB,p[1]-.4,p[0]+.4,CURB+2.8,p[1]+.4,0xb9453a,{ao:1});Col.addBox(own,p[0]-.4,p[1]-.4,p[0]+.4,p[1]+.4,CURB,CURB+2.8)}
 for(const[u,v]of[[-26,-2],[26,-2],[-30,17],[31,17],[-2,48],[16,60],[30,62],[-32,62]])tree(sb,f.p(u,v)[0],f.p(u,v)[1],1,CURB);
 for(const u of[-20,-10,10,20])lampAt(ctx,f.p(u,-2)[0],7,f.p(u,-2)[1],0xffe0b0,0,false);
 G.pois.push({x:cx,z:cz+36,name:'School',col:'#ffd23f',big:true});
}
function win2(a,b,y0){return{a,b,k:'win',yb:y0+1.5,yt:y0+6}}
registerGen(function schoolGen(ctx){if(ctx.kind==='school')school(ctx)});
G.tp['School']={x:-90,y:CURB,z:222,yaw:Math.PI};
