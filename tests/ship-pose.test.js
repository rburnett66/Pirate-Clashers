
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as H from '../src/hull-mask.js';
import {shipToWorld,worldToShip} from '../src/ship-pose.js';
import {collisionAt,traceProjectile,facing} from '../src/ballistics.js';
const T=Date.UTC(2026,8,13,12),battle=()=>{const s=M.fresh(T);M.startBattle(s,T);return s;};
test('rocking and mirroring preserve local hull and crew coordinates',()=>{
 for(const dir of [1,-1])for(const roll of [-.08,0,.08]){
  const f={x:8.4,pose:{heave:.12,roll}};
  for(const p of [{x:.8,y:-.3},{x:-.7,y:1.6},{x:0,y:.06}]){
   const back=worldToShip(f,dir,shipToWorld(f,dir,p));assert.ok(Math.abs(back.x-p.x)<1e-12&&Math.abs(back.y-p.y)<1e-12);
  }
 }
});
test('rocked hull pixels and exposed crew collide at their rendered positions',()=>{
 for(const side of ['player','enemy']){
  const f=battle().battle[side],dir=facing(side);f.pose={heave:.09,roll:-.07};
  const wood=shipToWorld(f,dir,{x:.65,y:-.25}),crew=shipToWorld(f,dir,{x:-.07,y:.06});
  assert.equal(collisionAt(f,side,wood).kind,'hull');assert.equal(collisionAt(f,side,crew).kind,'hull');
  H.chipHull(f,.65,-.25,8);H.chipHull(f,-.07,.06,8);
  assert.equal(collisionAt(f,side,wood),null);assert.equal(collisionAt(f,side,crew).kind,'crew');
 }
});
test('a parabolic shot cannot skip a single rotated hull texel',()=>{
 for(const side of ['player','enemy'])for(const roll of [-Math.PI/12,Math.PI/12]){
  const f=battle().battle[side==='player'?'enemy':'player'],dir=-facing(side),C=H.HULL_MASK;
  f.pose={heave:.06,roll};
  const col=360,row=110,p=H.pixelPoint(col,row),pixels=new Uint8Array(C.width*C.height);pixels[row*C.width+col]=255;H.replaceHullPixels(f,pixels);
  const point=shipToWorld(f,dir,p),angle=5,speed=20,t=.091234,rad=angle*Math.PI/180;
  const origin={x:point.x-facing(side)*speed*Math.cos(rad)*t,y:point.y-speed*Math.sin(rad)*t+1.6*t*t};
  const shot=traceProjectile(f,side,origin,angle,speed);
  assert.equal(shot.impact?.kind,'hull');assert.ok(Math.abs(shot.duration-t)<.001);assert.ok(H.maskSolid(f,shot.impact.x,shot.impact.y));
 }
});
test('a saved shot retains its rocked pose and rejects invalid pose data',()=>{
 const s=battle();s.battle.player.pose={heave:.03,roll:.02};s.battle.enemy.pose={heave:-.02,roll:-.025};
 M.launchShot(s,{gunner:1,angle:25});const restored=M.restore(JSON.stringify(s),T);
 assert.deepEqual(M.pendingFlight(restored),M.pendingFlight(s));assert.deepEqual(M.resolveShot(restored),M.resolveShot(s));
 for(const pose of [{heave:NaN,roll:0},{heave:0,roll:1},{heave:1,roll:0}]){const bad=battle();bad.battle.enemy.pose=pose;assert.throws(()=>M.restore(JSON.stringify(bad),T));}
});
