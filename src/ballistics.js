// Combat coordinates match the supplied hull and rig prototype (one ship ~2.4 units wide).
export const BALLISTICS = Object.freeze({speed:4.8, gravity:3.2, minAngle:5, maxAngle:75, step:1/180, sea:-.67});
export const SHIP_LADDER={1:[1,0],2:[2,0],3:[2,1],4:[2,2],5:[3,2],6:[3,3],7:[4,3],8:[4,4]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const facing=side=>side==='enemy'?-1:1;
export function rigLayout(){
 const xs=[-.62,.02,.62],heights=[1.8,2.35,1.65],counts=[3,3,2],sails=[];
 for(let mast=0;mast<3;mast++){
  const span=heights[mast]-.34-.12,n=counts[mast];
  for(let j=0;j<n;j++)sails.push({mast,x:xs[mast]+.02,y:.34+.18+span*((j+.55)/n),halfW:.30-.035*j,halfH:span/(n+.6)*.5*.9});
 }
 return {masts:xs.map((x,i)=>({x,foot:-.1,top:heights[i]})),sails};
}
export function ensureGeometry(f,side){
 f.x??=side==='enemy'?8.4:2.8;f.shipLevel??=f.plates?.length||Math.max(1,f.crew.length);
 f.hullParts??=Array.from({length:f.shipLevel},()=>({hp:f.hull/f.shipLevel,maxHp:f.maxHull/f.shipLevel}));
 f.mastParts??=Array.from({length:3},()=>({hp:80,maxHp:80}));
 f.sailParts??=rigLayout().sails.map(()=>({hp:35*f.sails/100,maxHp:35}));
 return f;
}
export function stationPosition(f,slot){
 const [deck,ports]=SHIP_LADDER[f.shipLevel]||SHIP_LADDER[3],port=slot[0]==='h',n=port?ports:deck,i=Number(slot[1]);
 const x=n<=1?0:(i/(n-1)-.5)*1.45,foot=port?-.065:.34*(1+.42*x*x);
 return {x,y:foot,port,width:port?.22:.32,height:port?.22:.44};
}
export function muzzle(f,side,g){
 const st=stationPosition(f,g.slot),dir=facing(side);
 return {x:f.x+dir*(st.x+.17),y:st.y+(st.port?.16:.23)};
}
export function projectileFor(p){
 const mast=[10,16,26].includes(p.id),bonus=mast?'masts':p.primary;
 const type=mast?(p.id===10?'chain':'bolt'):p.id===6||p.id===21?'grape':p.tags.includes('burn')?'fire':bonus==='hull'?'iron':bonus==='sails'?'element':'bullet';
 return {name:p.projectile,type,bonus,icon:p.icon,count:type==='grape'?7:1,color:{iron:'#26343f',grape:'#32323c',fire:'#ff831b',chain:'#bac6cc',bolt:'#dfd4ae',element:'#73dfef',bullet:'#f1c769'}[type],effect:type==='fire'?'fire':type==='grape'?'grape':type==='chain'?'chain':type==='bolt'?'rail':'roundshot'};
}
export function hullInside(x,y){
 const deck=.34*(1+.42*x*x),ax=Math.min(Math.abs(x),1),keel=-.56*Math.sqrt(Math.max(0,1-Math.pow(ax,x>0?1.8:3)));
 const up=clamp(y/.34,0,1.6);
 return Math.min(deck-y,y-keel,1+.22*up-x,x-(-1-.04*up))>=0;
}
export function collisionAt(f,side,point){
 const x=(point.x-f.x)*facing(side),y=point.y;if(x < -1.2 || x > 1.4 || y > 2.4 || y < -.57)return null;const rig=rigLayout();
 // Crew are separate sprites. Hull masks occlude port crew until that section is gone.
 const section=clamp(Math.floor((x+1.08)/2.44*f.hullParts.length),0,f.hullParts.length-1);
 const hull=hullInside(x,y)&&f.hullParts[section].hp>0;
 for(const g of f.crew){
  if(g.hp<=0)continue;const q=stationPosition(f,g.slot);
  if(q.port&&hull)continue;
  if(Math.abs(x-q.x)<q.width/2&&y>=q.y&&y<=q.y+q.height)return {kind:'crew',id:g.id,slot:g.slot,x,y};
 }
 // Wood is a different object from the canvas attached to it.
 for(let i=0;i<rig.masts.length;i++){const m=rig.masts[i];if(f.mastParts[i].hp>0&&Math.abs(x-m.x)<.031&&y>=m.foot&&y<=m.top&&!hull)return {kind:'masts',index:i,x,y};}
 for(let i=0;i<rig.sails.length;i++){const s=rig.sails[i];if(f.sailParts[i].hp>0&&f.mastParts[s.mast].hp>0&&Math.abs(x-s.x)<=s.halfW*.97&&Math.abs(y-s.y)<=s.halfH*.97)return {kind:'sails',index:i,x,y};}
 if(hull)return {kind:'hull',index:section,x,y};
 return null;
}
export function traceProjectile(f,side,origin,angle,speed=BALLISTICS.speed){
 const rad=angle*Math.PI/180,dir=facing(side),vx=speed*Math.cos(rad)*dir,vy=speed*Math.sin(rad);
 const path=[{...origin,t:0}],foe=side==='player'?'enemy':'player';
 let impact=null,last=path[0];
 for(let t=BALLISTICS.step;t<=5;t+=BALLISTICS.step){
  let p={x:origin.x+vx*t,y:origin.y+vy*t-.5*BALLISTICS.gravity*t*t,t};
  const hit=collisionAt(f,foe,p);
  if(hit){
   let lo=last.t,hi=t;
   for(let k=0;k<9;k++){const mid=(lo+hi)/2,q={x:origin.x+vx*mid,y:origin.y+vy*mid-.5*BALLISTICS.gravity*mid*mid};if(collisionAt(f,foe,q))hi=mid;else lo=mid;}
   p={x:origin.x+vx*hi,y:origin.y+vy*hi-.5*BALLISTICS.gravity*hi*hi,t:hi};
   impact=collisionAt(f,foe,p)||hit;path.push(p);break;
  }
  if(p.y<=BALLISTICS.sea){const ts=(vy+Math.sqrt(vy*vy+2*BALLISTICS.gravity*(origin.y-BALLISTICS.sea)))/BALLISTICS.gravity;p={x:origin.x+vx*ts,y:BALLISTICS.sea,t:ts};path.push(p);break;}
  if(Math.abs(p.x)>20){path.push(p);break;}
  path.push(p);last=p;
 }
 return {path,impact,duration:path.at(-1).t};
}
export function trajectory(b,side,g,spec,angle){
 const own=ensureGeometry(b[side],side),otherSide=side==='player'?'enemy':'player',foe=ensureGeometry(b[otherSide],otherSide);
 const origin=muzzle(own,side,g),shots=Array.from({length:spec.count},(_,i)=>traceProjectile(foe,side,origin,angle+(spec.count===1?0:(i-(spec.count-1)/2)*.8),spec.speed));
 return {side,gunnerId:g.id,angle,spec,origin,shots,duration:Math.max(...shots.map(s=>s.duration))};
}
export function pointAt(path,t){
 let lo=0,hi=path.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(path[mid].t<t)lo=mid;else hi=mid;}
 const a=path[lo],b=path[hi],r=clamp((t-a.t)/(b.t-a.t||1),0,1);return {x:a.x+(b.x-a.x)*r,y:a.y+(b.y-a.y)*r};
}
