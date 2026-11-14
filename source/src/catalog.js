// ADMIN SHOP CATALOG — press I inside any shop while logged in as ADMIN to buy anything.
// Every purchase still goes through the live Accept / Reject card (free for admin by default, switchable).
import {G,CURB,clamp} from './core.js';
import {UI} from './ui.js';
import {P,OUTFITS} from './player.js';
import {Vehicle,paints} from './vehicles.js';
import {DEFS,resolveDef,fallbackDef} from './carmodels.js';
import {payAny,toast} from './lib.js';
import {confirmPurchase,placeAhead} from './game.js';
import {Col} from './world.js';
G.adminFree=true;
const $=n=>Math.round(n).toLocaleString();
const fmt=n=>'$'+$(n);
// ---------- where purchases appear ----------
function outsideSpot(){const z=G.shopZone;if(z&&z.out)return{x:z.out.x,z:z.out.z,h:z.out.h};const a=placeAhead(10);return{x:a.x,z:a.z,h:a.yaw}}
const GA=[[-800,-495],[-800,-550],[-800,-605]];let gaN=0;
function gaSlot(){const s=GA[gaN++%GA.length];return{x:s[0],z:s[1]}}
// ---------- catalog data ----------
const CARCOL=[['Default',null],['Black',0x111111],['White',0xf2f2f0],['Red',0xc40018],['Blue',0x153c74],['Silver',0x9aa0a6],['Yellow',0xf2c200],['Green',0x1f7a46]];
let carCol=null;
function carItems(){return Object.values(DEFS).filter(d=>d.price).sort((a,b)=>b.price-a.price).map(d=>({name:d.name,price:d.price,sub:`Top speed ${Math.round((d.top||60)*3.6)} km/h${d.flight?' · FLIGHT MODE':''}`,give:()=>giveCar(d,true)}))}
function giveCar(def,persist){const s=outsideSpot(),col=carCol??def.paint??paints[Math.floor(Math.random()*paints.length)];
 const v=new Vehicle(def,col,s.x,s.z,s.h);v.owned=true;v.fromShowroom=true;v.awake=false;v.home={x:-22,z:12,h:Math.PI};G.extraCars.push(v);
 if(persist&&DEFS[def.key]===def){G.ownedExtra.push({k:def.key,col});G.owned.push(def.key)}
 G.hud();UI.splash('PURCHASED','#ffd23f',1500);toast(`The ${def.name} is waiting outside the shop — and it's in your garage list.`)}
const AIRSALE=[['Private Jet','private jet',4500000,'Twin-jet executive aircraft · delivered to the GA ramp at the International Airport'],['Airliner','airliner',95000000,'Full-size airliner · GA ramp, International Airport'],['Helicopter','helicopter',1800000,'Luxury helicopter · GA ramp'],['Yacht','yacht',3200000,'26 m yacht · delivered to the Marina'],['Speedboat','speedboat',240000,'Fast open boat · delivered to the Marina']];
function airItems(){return AIRSALE.map(([name,key,price,sub])=>({name,price,sub,give:()=>{const air=key==='private jet'||key==='airliner'||key==='helicopter';let x,z,h=Math.PI/2;
  if(air){const s=gaSlot();x=s.x;z=s.z}else{const a=placeAhead(10);x=a.x;z=a.z;h=a.yaw}
  const v=G.specials[key](x,z,h,key);if(v){v.owned=true;v.awake=false;v.label=name;v.locked=false}
  G.hud();UI.splash('PURCHASED','#ffd23f',1500);toast(air?`Your ${name} is parked on the GA ramp at the International Airport (admin teleport: “Airport Hangars”).`:`Your ${name} is moored at the Marina.`)}}))}
const OUTNAMES=['Navy Suit','Crimson Blazer','Emerald Casual','Gold Evening Wear','White Linen','Violet Streetwear'];
function outfitItems(){return OUTFITS.map((o,i)=>({name:OUTNAMES[i]||('Outfit '+(i+1)),price:150,sub:i===G.outfit?'Currently wearing':'Designer outfit',give:()=>{P.setOutfit(i);toast('Looking sharp!')}}))}
const heal=(name,price,hp,sub)=>({name,price,sub:`${sub} · +${hp} health`,give:()=>{G.health=Math.min(100,G.health+hp);G.hud();toast(`${name} — delicious. +${hp} health.`)}});
const FOOD=[heal('Margherita Pizza',18,25,'Napoli wood-fired'),heal('Latte',6,8,'Bean & Cloud'),heal('Gourmet Meal',65,40,'Sky Grill tasting menu'),heal('Groceries',45,15,'Fresh Mart bag'),heal('Snack',8,5,'Chips'),heal('Sushi Platter',120,35,'24 pieces'),heal('Burger Combo',14,20,'With fries'),heal('Champagne Bottle',900,10,'Vintage'),heal('Energy Drink',4,6,'Cold can'),heal('Birthday Cake',35,12,'Whole cake')];
const item=(name,price,sub,id)=>({name,price,sub,give:()=>{(G.items=G.items||[]).push(id);toast(`${name} purchased.`)}});
const TECH=[item('Smartphone',999,'Newest flagship','phone'),item('Laptop Pro',2499,'16-inch workstation','laptop'),item('Gaming Console',599,'4K / 120 fps','console'),item('8K OLED TV',3999,'85 inch','tv'),item('Camera Drone',1299,'4K gimbal','drone'),item('VR Headset',799,'Wireless','vr'),item('Noise-cancelling Headphones',349,'Studio quality','headphones'),item('Mirrorless Camera',2799,'Full frame','camera')];
const LUXE=[item('Gold Watch',18500,'18k gold chronograph','watch'),item('Diamond Ring',75000,'3 carat, flawless','ring'),item('Designer Handbag',7800,'Limited edition','handbag'),item('Abstract Painting',250000,'Original canvas','painting'),item('Case of Champagne',4200,'6 bottles','champagne'),item('Platinum Cufflinks',2400,'Hand-made','cufflinks'),item('Penthouse Deed',12000000,'Skyline penthouse','penthouse'),item('Private Island Deed',90000000,'Your own island','island')];
const TABS={Cars:carItems,'Aircraft & Boats':airItems,Outfits:outfitItems,'Food & Drink':()=>FOOD,Electronics:()=>TECH,Luxury:()=>LUXE};
const DEFTAB={showroom:'Cars',workshop:'Cars',electronics:'Electronics',clothing:'Outfits',pizza:'Food & Drink',coffee:'Food & Drink',restaurant:'Food & Drink',supermarket:'Food & Drink',kiosk:'Food & Drink',gas:'Food & Drink',mall:'Luxury',airport:'Aircraft & Boats',carwash:'Cars'};
// ---------- buying ----------
function buy(it){UI.close();
 if(G.adminFree)confirmPurchase(it.name,it.price,()=>{it.give();G.hud()},null,{free:true});
 else confirmPurchase(it.name,it.price,()=>{if(payAny(it.price)){it.give();G.hud()}},null)}
// ---------- UI ----------
let tab=null;
export function openCatalog(){
 const z=G.shopZone;
 if(!G.admin){toast(z?'ADMIN catalog: press T, choose ADMIN and enter the password to buy anything here.':'Press T to log in as ADMIN, then press I inside any shop to open the catalog.');return}
 if(!z){toast('Walk into a shop first (pizza, electronics, showroom, mall, gas station, airport…) and press I.');return}
 if(G.modal||G.pendingBuy)return;
 tab=DEFTAB[z.shop]||'Cars';render(z)}
function render(z){
 const b=UI.modal(`<h3>ADMIN CATALOG — ${z.name||'Shop'}</h3><div class="muted">Buy anything. Each purchase shows the live Accept / Reject card.</div>
  <label class="muted" style="display:block;margin:8px 0"><input type="checkbox" id="cfree" ${G.adminFree?'checked':''}> Admin: free of charge (untick to pay from cash/bank)</label>
  <div class="row" id="ctabs" style="flex-wrap:wrap"></div><div id="cextra"></div><div id="cl" style="max-height:44vh;overflow:auto;margin-top:8px"></div>
  <div class="row"><button class="alt" id="cx">Close</button></div>`);
 b.querySelector('#cx').onclick=()=>UI.close();b.querySelector('#cfree').onchange=e=>{G.adminFree=e.target.checked};
 const tabs=b.querySelector('#ctabs');for(const t of Object.keys(TABS)){const x=document.createElement('button');x.textContent=t;if(t!==tab)x.className='alt';x.onclick=()=>{tab=t;render(z)};tabs.appendChild(x)}
 const ex=b.querySelector('#cextra'),list=b.querySelector('#cl');
 if(tab==='Cars'){ex.innerHTML=`<div class="muted" style="margin-top:8px">Paint</div><div class="row" id="ccol" style="flex-wrap:wrap"></div>
  <div class="muted" style="margin-top:8px">Any other car — type a name (e.g. “Koenigsegg Jesko”, “Lotus Evija”). Unknown names get a custom-built model.</div>
  <div class="row"><input type="text" id="cname" placeholder="Car name…" style="flex:1" autocomplete="off"><button id="cbuy">Buy</button></div>`;
  const cc=ex.querySelector('#ccol');for(const[n,c]of CARCOL){const x=document.createElement('button');x.textContent=n;if(c!==carCol)x.className='alt';x.onclick=()=>{carCol=c;render(z)};cc.appendChild(x)}
  const nm=ex.querySelector('#cname');nm.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')ex.querySelector('#cbuy').click()};
  ex.querySelector('#cbuy').onclick=()=>{const n=nm.value.trim();if(!n){toast('Type a car name first.');return}const def=resolveDef(n)||fallbackDef(n);buy({name:def.name||n,price:def.price||90000,give:()=>giveCar(def,true)})}}
 for(const it of TABS[tab]()){const d=document.createElement('div');d.className='item';d.innerHTML=`<div><b>${it.name}</b><div class="muted">${fmt(it.price)} · ${it.sub||''}</div></div>`;const bt=document.createElement('button');bt.textContent='Buy';bt.onclick=()=>buy(it);d.appendChild(bt);list.appendChild(d)}}
G.openCatalog=openCatalog;
