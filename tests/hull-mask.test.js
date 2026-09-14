
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import * as H from '../src/hull-mask.js';
import {collisionAt,traceProjectile,facing,BALLISTICS} from '../src/ballistics.js';
const T=Date.UTC(2026,8,13,12),battle=()=>{const s=M.fresh(T);M.startBattle(s,T);return s;};
test('blast removes only local pixels and preserves blocking wood within the same section',()=>{
 const s=battle(),f=s.battle.enemy,before=H.maskPixels(f).slice(),health=f.hull;
 H.chipHull(f,-.4,-.25,8);
 assert.equal(H.maskSolid(f,-.4,-.25),false);assert.equal(H.maskSolid(f,-.4,.25),true);
 assert.equal(collisionAt(f,'enemy',{x:f.x+.4,y:-.25}),null);
 assert.equal(collisionAt(f,'enemy',{x:f.x+.4,y:.25}).kind,'hull');
 assert.ok(f.hull>0&&f.hull<health);assert.ok(f.hullParts.every(p=>p.hp>0));
 const after=H.maskPixels(f);assert.ok(after.some((v,i)=>v!==before[i]));
 assert.ok(after.every((v,i)=>!v||before[i])); // No blast adds material.
 const restored=M.restore(JSON.stringify(s),T);
 assert.deepEqual(H.maskPixels(restored.battle.enemy),after);
 assert.equal(restored.battle.enemy.hull,f.hull);
});
test('each mask pixel center gives the same material answer before and after reload',()=>{
 const f=battle().battle.enemy;H.chipHull(f,.65,.1,20);
 const saved=structuredClone(f),pixels=H.maskPixels(f),C=H.HULL_MASK;
 for(let i=0;i<pixels.length;i++){const p=H.pixelPoint(i%C.width,Math.floor(i/C.width));assert.equal(H.maskSolid(saved,p.x,p.y),!!pixels[i]);}
});
test('swept parabola hits a single surviving texel from either direction',()=>{
 for(const side of ['player','enemy']){
  const s=battle(),foe=side==='player'?'enemy':'player',f=s.battle[foe],C=H.HULL_MASK;
  const col=Math.floor((.6-C.left)/C.spanX*C.width),row=Math.floor((-.25-C.bottom)/C.spanY*C.height),p=H.pixelPoint(col,row),pixels=new Uint8Array(C.width*C.height);
  pixels[row*C.width+col]=255;H.replaceHullPixels(f,pixels);
  const speed=20,angle=5,rad=angle*Math.PI/180,dt=.091234,x=f.x+facing(foe)*p.x;
  const origin={x:x-facing(side)*speed*Math.cos(rad)*dt,y:p.y-speed*Math.sin(rad)*dt+.5*BALLISTICS.gravity*dt*dt};
  const shot=traceProjectile(f,side,origin,angle,speed);
  assert.equal(shot.impact?.kind,'hull');assert.ok(Math.abs(shot.duration-dt)<.001);
  assert.ok(H.maskSolid(f,shot.impact.x,shot.impact.y));assert.ok(f.hull>0);
  H.chipHull(f,p.x,p.y,1);assert.equal(f.hull,0);assert.equal(traceProjectile(f,side,origin,angle,speed).impact,null);
 }
});
test('legacy section health becomes material once, then the bitmap controls collision',()=>{
 const f=battle().battle.enemy;delete f.hullMask;
 f.hullParts[0].hp*=.5;const target=f.hullParts[0].hp;H.ensureHullMask(f);
 assert.ok(Math.abs(f.hullParts[0].hp-target)<.03);
 const point={x:f.x-.6,y:0};assert.equal(collisionAt(f,'enemy',point).kind,'hull');
 f.hullParts[2].hp=0;assert.equal(collisionAt(f,'enemy',point).kind,'hull');
 H.syncHullHealth(f);assert.ok(f.hullParts[2].hp>0);
});
test('partial pellet volley resumes the original plan without repeating damage',()=>{
 const s=battle();s.battle.player.crew[0].id=6;const before=s.battle.enemy.hullMask.bits,flight=M.launchShot(s,{gunner:6,angle:25});
 const times=flight.shots.filter(p=>p.impact).map(p=>p.duration).sort((a,b)=>a-b),first=times[0];
 assert.ok(first<flight.duration);M.advanceShot(s,first-.001);assert.equal(s.battle.enemy.hullMask.bits,before);
 const step=M.advanceShot(s,first);assert.ok(step.impacts.length>0);assert.equal(step.event,null);
 const saved=JSON.stringify(s),same=M.advanceShot(s,first);assert.equal(same.impacts.length,0);assert.equal(JSON.stringify(s),saved);
 const restored=M.restore(saved,T);assert.deepEqual(M.pendingFlight(restored),flight);
 assert.deepEqual(M.resolveShot(restored),M.resolveShot(s));assert.deepEqual(restored.battle,s.battle);
 assert.equal(M.resolveShot(restored),null);assert.equal(restored.battle.events.length,1);
});
test('invalid masks fail restoration and replacement cannot add material outside the silhouette',()=>{
 for(const corrupt of [f=>f.hullMask.version=2,f=>f.hullMask.bits='not a mask',f=>{const raw=atob(f.hullMask.bits);f.hullMask.bits=btoa(String.fromCharCode(raw.charCodeAt(0)|1)+raw.slice(1));}]){
  const s=battle();corrupt(s.battle.enemy);assert.throws(()=>M.restore(JSON.stringify(s),T));
 }
 const f=battle().battle.enemy,pixels=H.maskPixels(f).slice();pixels[0]=255;H.replaceHullPixels(f,pixels);
 assert.equal(H.maskPixels(f)[0],0);assert.deepEqual(H.maskPixels(f),H.maskPixels(structuredClone(f)));
});

test('exposed hull crew take the same damage as deck crew and the interior cannot shield them',()=>{
 const s=battle(),f=s.battle.enemy,point={x:f.x+.07,y:.06},port=f.crew.find(g=>g.slot==='h0'),deck=f.crew.find(g=>g.slot==='d0');
 assert.equal(collisionAt(f,'enemy',point).kind,'hull');
 const protectedHp=port.hp;H.chipHull(f,-.07,.06,8);assert.equal(port.hp,protectedHp);
 const hit=collisionAt(f,'enemy',point);assert.equal(hit.kind,'crew');assert.equal(hit.id,port.id);
 const hull=f.hull,portBefore=port.hp,deckBefore=deck.hp;
 const damage=M.impactDamage(f,hit,20,{bonus:'crew'});
 assert.equal(damage,M.impactDamage(f,{kind:'crew',id:deck.id,slot:deck.slot},20,{bonus:'crew'}));
 assert.equal(portBefore-port.hp,32);assert.equal(deckBefore-deck.hp,32);assert.equal(f.hull,hull);
 const restored=M.restore(JSON.stringify(s),T);assert.equal(collisionAt(restored.battle.enemy,'enemy',point).kind,'crew');
 M.impactDamage(f,hit,1000,{bonus:'crew'});assert.equal(port.hp,0);assert.equal(collisionAt(f,'enemy',point),null);
});
