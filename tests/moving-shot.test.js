import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as H from '../src/hull-mask.js';
import {movingContact,poseOf} from '../src/moving-shot.js';
import {shipToWorld} from '../src/ship-pose.js';
import {facing} from '../src/ballistics.js';
import {aimGuide} from '../src/aim-guide.js';
const T=Date.UTC(2026,8,13,12),battle=()=>{const s=M.fresh(T);M.startBattle(s,T);return s;};
test('moving hull sweep catches a single texel in both firing directions',()=>{
 for(const side of ['player','enemy']){
  const f=battle().battle[side==='player'?'enemy':'player'],dir=-facing(side),col=360,row=110,p=H.pixelPoint(col,row),pixels=new Uint8Array(H.HULL_MASK.width*H.HULL_MASK.height);
  pixels[row*H.HULL_MASK.width+col]=255;H.replaceHullPixels(f,pixels);
  const previous={heave:-.1,roll:-.08},current={heave:.1,roll:.08},t=.091234,end=.18,r=t/end;
  const pose={heave:previous.heave+(current.heave-previous.heave)*r,roll:previous.roll+(current.roll-previous.roll)*r};
  const point=shipToWorld({...f,pose},dir,p),angle=5,speed=20,rad=angle*Math.PI/180,origin={x:point.x-facing(side)*speed*Math.cos(rad)*t,y:point.y-speed*Math.sin(rad)*t+1.6*t*t};
  f.pose=current;const hit=movingContact(f,side,origin,speed,angle,0,end,previous);
  assert.equal(hit?.impact.kind,'hull');assert.ok(Math.abs(hit.duration-t)<.001);assert.ok(H.maskSolid(f,hit.impact.x,hit.impact.y));
 }
});
test('live flight keeps its launch origin while both ships rock and survives reload',()=>{
 const s=battle();s.battle.player.pose={heave:.1,roll:.08};
 const flight=M.launchShot(s,{gunner:1,angle:25,live:true}),origin={...flight.origin};
 for(let i=1;i<=8;i++){s.battle.player.pose={heave:-.1,roll:-.08};s.battle.enemy.pose={heave:Math.sin(i)*.1,roll:Math.cos(i)*.03};M.advanceShot(s,i*.03);}
 const restored=M.restore(JSON.stringify(s),T);
 assert.deepEqual(M.pendingFlight(restored).origin,origin);assert.deepEqual(M.pendingFlight(restored),M.pendingFlight(s));
 for(let t=.25;t<4&&s.battle.pending;t+=.01){
  for(const game of [s,restored]){game.battle.enemy.pose={heave:.08*Math.sin(t),roll:.04*Math.cos(t)};M.advanceShot(game,t);}
 }
 assert.equal(s.battle.pending,null);assert.deepEqual(restored.battle.events,s.battle.events);assert.deepEqual(restored.battle.enemy,s.battle.enemy);
 assert.equal(s.battle.events.length,1);assert.equal(M.resolveShot(s),null);
});
test('live collision agrees across frame sizes against a stationary ship',()=>{
 const a=battle(),b=M.restore(JSON.stringify(a),T);M.launchShot(a,{gunner:1,angle:25,live:true});M.launchShot(b,{gunner:1,angle:25,live:true});
 for(let t=.013;t<4&&a.battle.pending;t+=.013)M.advanceShot(a,t);
 M.resolveShot(b);
 assert.equal(a.battle.events[0].target,b.battle.events[0].target);assert.equal(a.battle.events[0].damage,b.battle.events[0].damage);
 assert.equal(a.battle.enemy.hullMask.bits,b.battle.enemy.hullMask.bits);
});
test('aim guide ends at half the curved path length',()=>{
 const path=[{x:0,y:0},{x:3,y:4},{x:6,y:4},{x:6,y:0}],short=aimGuide(path),length=points=>points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
 assert.equal(length(short),length(path)/2);assert.deepEqual(short.at(-1),{x:4,y:4});
});

test('live grape volley resumes after a pellet impact without repeating damage',()=>{
 const s=M.fresh(T);s.levels[6]=1;s.slots.d0=6;M.startBattle(s,T);
 M.launchShot(s,{gunner:6,angle:20,live:true});
 let time=0;
 for(time=.005;time<4&&s.battle.pending;time+=.005){
  s.battle.enemy.pose={heave:.03*Math.sin(time*3),roll:.02*Math.cos(time*2)};M.advanceShot(s,time);
  if(s.battle.pending?.impacts.length&&s.battle.pending.resolved.length<7)break;
 }
 assert.ok(s.battle.pending?.impacts.length,'fixture reaches a partially resolved live volley');
 const restored=M.restore(JSON.stringify(s),T),already=s.battle.pending.resolved.slice(),damage=s.battle.pending.impacts.reduce((n,i)=>n+i.damage,0);
 assert.deepEqual(restored.battle.pending.resolved,already);
 for(time+=.005;time<4&&s.battle.pending;time+=.005)for(const game of [s,restored]){
  game.battle.enemy.pose={heave:.03*Math.sin(time*3),roll:.02*Math.cos(time*2)};M.advanceShot(game,time);
 }
 assert.equal(s.battle.pending,null);assert.equal(s.battle.events.length,1);
 assert.deepEqual(restored.battle.events,s.battle.events);assert.deepEqual(restored.battle.enemy,s.battle.enemy);
 assert.ok(s.battle.events[0].damage>=damage);assert.ok(s.battle.events[0].impacts.length<=7);
});
