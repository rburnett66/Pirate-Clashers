import {SHIP_ART} from './ship-art-data.js';
export {SHIP_ART};
export const ART_SCALE=1/480,ART_ORIGIN={x:810,y:960},ART_KEEL=-.56;
export const artToWorld=([x,y])=>({x:(x-810)*ART_SCALE,y:(960-y)*ART_SCALE+ART_KEEL});
export const worldToArt=({x,y})=>[810+x/ART_SCALE,960-(y-ART_KEEL)/ART_SCALE];
export const MAST_MOUNTS=[[566,696],[807,794],[1133,727]];
export const SAIL_STYLES=[['IMG_7254','Emerald Roger'],['IMG_7255','Crimson Roger'],['IMG_7256','Royal Blue'],['IMG_7257','White Pearl'],['IMG_7258','Black Flag'],['IMG_7261','Golden Star']];
export function shipAppearance(level=3,cosmetic=null,side='player',plating='bare'){
 const levels=['IMG_7285','IMG_7289','IMG_7298','IMG_7291','IMG_7299','IMG_7294','IMG_7287','IMG_7300'];
 const hull=plating==='iron'?'IMG_7294':levels[Math.max(0,Math.min(7,level-1))];
 return {hull:SHIP_ART.hulls.find(h=>h.id===hull),sails:SHIP_ART.sailSets.find(s=>s.id===(SAIL_STYLES[cosmetic]?.[0]||(side==='enemy'?'IMG_7256':'IMG_7255'))),flag:SHIP_ART.flags.find(f=>f.id===7)};
}
export function clothPlacement(index,part){
 const mast=SHIP_ART.masts[index],[a,b]=part.attachment,[u,v]=mast.yard;
 const scale=Math.hypot(v[0]-u[0],v[1]-u[1])/Math.hypot(b[0]-a[0],b[1]-a[1]);
 const angle=Math.atan2(v[1]-u[1],v[0]-u[0])-Math.atan2(b[1]-a[1],b[0]-a[0]);
 const dx=MAST_MOUNTS[index][0]-mast.pivot[0],dy=MAST_MOUNTS[index][1]-mast.pivot[1];
 const point=([x,y])=>[u[0]+dx+scale*((x-a[0])*Math.cos(angle)-(y-a[1])*Math.sin(angle)),u[1]+dy+8+scale*((x-a[0])*Math.sin(angle)+(y-a[1])*Math.cos(angle))];
 return {scale,angle,origin:point([0,0]),point};
}
export function insidePolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
const canonical=SHIP_ART.sailSets.find(s=>s.id==='IMG_7255');
const rig={masts:SHIP_ART.masts.map((m,i)=>{const [dx,dy]=[MAST_MOUNTS[i][0]-m.pivot[0],MAST_MOUNTS[i][1]-m.pivot[1]],foot=artToWorld(MAST_MOUNTS[i]),tip=artToWorld([m.flagAnchor[0]+dx,m.flagAnchor[1]+dy]);return {x:foot.x,foot:foot.y,top:tip.y};}),sails:[]};
canonical.sails.forEach((s,mast)=>{const place=clothPlacement(mast,s),polygon=s.outline.map(p=>artToWorld(place.point(p))),xs=polygon.map(p=>p.x),ys=polygon.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys),n=[3,3,2][mast];for(let j=0;j<n;j++)rig.sails.push({mast,x:(left+right)/2,y:bottom+(j+.5)*(top-bottom)/n,halfW:(right-left)/2,halfH:(top-bottom)/(2*n),polygon});});
export const artRig=()=>rig;
// Feet follow the visible deck; the hold crew use the lower interior deck.
export function deckFoot(x){const points=[[-1,.28],[-.63,.12],[-.38,-.015],[0,-.115],[.25,-.085],[.65,.025],[1,.10]];for(let i=1;i<points.length;i++)if(x<=points[i][0]){const a=points[i-1],b=points[i],t=Math.max(0,(x-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*t;}return .10;}
