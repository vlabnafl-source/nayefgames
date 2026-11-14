import {THREE,scene,camera,renderer,G,M,clamp,lerp,sstep,TAU,cloudTex,setEnvIntensity,mulberry32} from './core.js';

G.time=0.33;G.cycle=12;G.timePaused=false;
const V3=THREE.Vector3,Col=THREE.Color;
export const sun=new THREE.DirectionalLight(0xfff1d6,3);sun.castShadow=true;
sun.shadow.mapSize.set(3072,3072);const sc=sun.shadow.camera;sc.left=-110;sc.right=110;sc.top=110;sc.bottom=-110;sc.near=1;sc.far=700;sun.shadow.bias=-.0004;sun.shadow.normalBias=.55;
scene.add(sun,sun.target);
export const moon=new THREE.DirectionalLight(0x8fa8ff,.0);scene.add(moon,moon.target);
export const hemi=new THREE.HemisphereLight(0xcfe6ff,0x4b5747,1.2);scene.add(hemi);

const domeMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new Col()},hor:{value:new Col()},sunDir:{value:new V3(0,1,0)},moonDir:{value:new V3(0,-1,0)},sunI:{value:1},night:{value:0},sunCol:{value:new Col(1,.9,.7)}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.9999;}',
 fragmentShader:`varying vec3 vD;uniform vec3 top,hor,sunDir,moonDir,sunCol;uniform float sunI,night;
 void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(hor,top,pow(clamp(y,0.,1.),.5));
  if(y<0.)c=mix(hor,hor*.55,clamp(-y*4.,0.,1.));
  float sd=max(dot(d,sunDir),0.);c+=sunCol*(pow(sd,900.)*8.*sunI+pow(sd,24.)*.25*sunI+pow(sd,5.)*.12*sunI);
  float md=max(dot(d,moonDir),0.);c+=vec3(.85,.9,1.)*(smoothstep(.99965,.9998,md)*1.4+pow(md,60.)*.07)*night;
  gl_FragColor=vec4(c,1.);}`});
const dome=new THREE.Mesh(new THREE.SphereGeometry(2800,32,16),domeMat);dome.renderOrder=-10;dome.frustumCulled=false;scene.add(dome);
// stars
{const r=mulberry32(5),n=1800,p=new Float32Array(n*3);for(let i=0;i<n;i++){const u=r()*2-1,a=r()*TAU,s=Math.sqrt(1-u*u);p[i*3]=Math.cos(a)*s*2600;p[i*3+1]=Math.abs(u)*2600*.98+60;p[i*3+2]=Math.sin(a)*s*2600}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
 var stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2.4,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));stars.frustumCulled=false;scene.add(stars)}
// clouds
const clouds=[];{const r=mulberry32(9);for(let i=0;i<46;i++){const m=new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:.3,depthWrite:false,fog:false});const s=new THREE.Sprite(m);
 s.userData={ox:(r()-.5)*3600,oz:(r()-.5)*3600,y:260+r()*160,sc:380+r()*420};s.scale.set(s.userData.sc,s.userData.sc*.45,1);scene.add(s);clouds.push(s)}}
// rain
const RN=2600,rainDX=new Float32Array(RN),rainDY=new Float32Array(RN),rainDZ=new Float32Array(RN);
{const r=mulberry32(21);for(let i=0;i<RN;i++){rainDX[i]=(r()-.5)*70;rainDY[i]=r()*40-20;rainDZ[i]=(r()-.5)*70}}
const rainGeo=new THREE.BufferGeometry();const rainPos=new Float32Array(RN*6);rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xbfd0e0,transparent:true,opacity:.4,fog:true,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
// lamp pool
export const lampLights=[];for(let i=0;i<8;i++){const l=new THREE.PointLight(0xffd9a0,0,38,2);scene.add(l);lampLights.push(l)}
const lamps=new Map();let lampT=0;
export const Lamps={add(owner,x,y,z,color=0xffd9a0,inten=260){let a=lamps.get(owner);if(!a){a=[];lamps.set(owner,a)}a.push({x,y,z,color,inten})},remove(owner){lamps.delete(owner)}};
// weather
const W={clear:{cloud:.12,rain:0,fog:1,storm:0},cloudy:{cloud:.75,rain:0,fog:.8,storm:0},rain:{cloud:.95,rain:1,fog:.5,storm:0},storm:{cloud:1,rain:1.4,fog:.38,storm:1},fog:{cloud:.6,rain:0,fog:.14,storm:0}};
const cur={cloud:.12,rain:0,fog:1,storm:0};let flash=0,flashT=5;
G.setWeather=(w)=>{G.weather=w};
// env map from a baked day sky
export function buildEnv(){const es=new THREE.Scene();const m=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{},vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(vec3(.82,.88,.95),vec3(.28,.5,.9),pow(clamp(y,0.,1.),.55));if(y<0.)c=mix(vec3(.62,.66,.62),vec3(.22,.24,.22),clamp(-y*3.,0.,1.));
 float sd=max(dot(d,normalize(vec3(.4,.8,.3))),0.);c+=vec3(1.,.9,.7)*(pow(sd,300.)*30.+pow(sd,12.)*.8);gl_FragColor=vec4(c,1.);}`});
 es.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),m));
 const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromScene(es,0,.1,100);scene.environment=rt.texture;pm.dispose()}
const tmpC=new Col(),cA=new Col(),cB=new Col();
const NT=new Col(.012,.02,.06),NH=new Col(.03,.05,.12),DT=new Col(.2,.42,.85),DH=new Col(.72,.84,.96),OR=new Col(1,.5,.22),OT=new Col(.35,.3,.55);
export const Sky={
 update(dt,px,py,pz){
  if(!G.timePaused)G.time=(G.time+dt/G.cycle)%1;G.hour=G.time*24;
  const w=W[G.weather]||W.clear;for(const k in cur)cur[k]+=(w[k]-cur[k])*Math.min(1,dt*.6);
  const a=(G.time-.25)*TAU,sd=new V3(Math.cos(a)*.88,Math.sin(a),.38).normalize(),e=sd.y;
  const dayF=sstep(-.06,.22,e),duskF=1-sstep(0,.38,Math.abs(e)),night=1-dayF;G.daylight=dayF;G.night=night;G.sunDir=sd;
  const cl=cur.cloud;G.indoorK=(G.indoorK||0)+((G.indoor?1:0)-(G.indoorK||0))*Math.min(1,dt*5);const ik=G.indoorK;
  cA.copy(NT).lerp(DT,dayF).lerp(OT,duskF*.5*dayF+duskF*.25);cB.copy(NH).lerp(DH,dayF).lerp(OR,duskF*.85);
  const gray=new Col(.45,.47,.5).multiplyScalar(.25+.75*dayF);cA.lerp(gray,cl*.65);cB.lerp(gray,cl*.5);
  if(flash>0){cA.lerp(new Col(1,1,1),flash*.5);cB.lerp(new Col(1,1,1),flash*.5)}
  domeMat.uniforms.top.value.copy(cA);domeMat.uniforms.hor.value.copy(cB);domeMat.uniforms.sunDir.value.copy(sd);
  domeMat.uniforms.moonDir.value.set(-sd.x,-sd.y,-sd.z);domeMat.uniforms.sunI.value=dayF*(1-cl*.85);domeMat.uniforms.night.value=night*(1-cl*.6);
  domeMat.uniforms.sunCol.value.setRGB(1,.85-duskF*.25,.65-duskF*.35);
  dome.position.copy(camera.position);stars.position.copy(camera.position);stars.rotation.z=G.time*TAU;stars.material.opacity=clamp(night*1.2-cl*.9,0,1)*.95;
  scene.background=cB;scene.fog.color.copy(cB).lerp(new Col(.5,.52,.55),0);
  const base=G.fogFar||720;scene.fog.near=lerp(4,90,clamp(cur.fog*1.2,0,1));scene.fog.far=base*cur.fog+80;
  // lights
  const dimC=1-cl*.62;
  sun.color.setRGB(1,.93-duskF*.25,.82-duskF*.45);sun.intensity=3.4*dayF*dimC*(.35+.65*clamp(e*2.2,0,1));
  const tx=px,tz=pz;sun.target.position.set(tx,0,tz);sun.position.set(tx+sd.x*220,Math.max(sd.y,.05)*220+10,tz+sd.z*220);
  moon.target.position.set(tx,0,tz);moon.position.set(tx-sd.x*200,Math.max(-sd.y,.2)*200,tz-sd.z*200);moon.intensity=.42*night*(1-cl*.7);
  hemi.color.copy(cA).lerp(new Col(1,1,1),.45);hemi.groundColor.setRGB(.28,.3,.26).multiplyScalar(.25+.75*dayF);hemi.intensity=((.06+1.0*dayF)*(1-cl*.35)+flash*4)*(1-.45*ik);
  renderer.toneMappingExposure=1.05;
  setEnvIntensity(((.05+.9*dayF)*(1-cl*.4)+flash*.8)*(1-.5*ik));
  // emissive controls
  M.win.emissiveIntensity=clamp(night*1.2+cl*.25*dayF,0,1.3);M.emisN.color.setScalar(.06+.94*clamp(night*1.15,0,1));M.lampglow.opacity=night*.5;
  M.road.roughness=lerp(.9,.3,clamp(cur.rain,0,1));M.plainroad.roughness=M.road.roughness;
  // lightning
  if(G.weather==='storm'){flashT-=dt;if(flashT<0){flash=1;flashT=2+Math.random()*7}}flash=Math.max(0,flash-dt*3.5);
  // clouds
  const wind=dt*9;for(const s of clouds){const u=s.userData;u.ox+=wind;if(u.ox>1800)u.ox-=3600;s.position.set(camera.position.x+u.ox,u.y,camera.position.z+u.oz);
   s.material.opacity=clamp(.12+cl*.72,0,.95)*(.4+.6*sstep(0,1,Math.min(1,(1800-Math.abs(u.ox))/500)));
   const lv=lerp(.1,1,dayF)*(1-cur.storm*.5);s.material.color.setRGB(lv*(.9+duskF*.1),lv*(.9-duskF*.15),lv*(.95-duskF*.3))}
  // rain
  const ri=clamp(cur.rain,0,1.4),vis=!G.indoor&&ri>.02;rain.visible=vis;G.rain=ri;
  if(vis){rain.position.set(camera.position.x,camera.position.y,camera.position.z);const n=Math.floor(RN*clamp(ri,0,1)),sp=36;
   for(let i=0;i<RN;i++){rainDY[i]-=sp*dt;if(rainDY[i]<-20)rainDY[i]+=40;const o=i*6,vv=i<n;rainPos[o]=rainDX[i];rainPos[o+1]=vv?rainDY[i]:-999;rainPos[o+2]=rainDZ[i];rainPos[o+3]=rainDX[i]+.15;rainPos[o+4]=vv?rainDY[i]+.9:-999;rainPos[o+5]=rainDZ[i]+.1}
   rainGeo.attributes.position.needsUpdate=true}
  // lamp pool
  lampT-=dt;if(lampT<=0){lampT=.2;const cand=[];for(const arr of lamps.values())for(const l of arr){const dx=l.x-px,dz=l.z-pz,dd=dx*dx+dz*dz;if(dd<3600)cand.push([dd,l])}
   cand.sort((a,b)=>a[0]-b[0]);for(let i=0;i<lampLights.length;i++){const L=lampLights[i],c=cand[i];if(c){L.position.set(c[1].x,c[1].y,c[1].z);L.color.setHex(c[1].color);L.userData.base=c[1].inten}else L.userData.base=0}}
  for(const L of lampLights)L.intensity=(L.userData.base||0)*clamp(night*1.3+(G.indoor?.38:0),0,1)*(G.indoor?.42:1);
 }};
