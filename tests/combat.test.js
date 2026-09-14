
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {BALLISTICS,traceProjectile,collisionAt,pointAt} from '../src/ballistics.js';
import {chipHull} from '../src/hull-mask.js';
const T=Date.UTC(2026,8,13,12),clone=x=>structuredClone(x);
const battle=()=>{const s=M.fresh(T);M.startBattle(s,T);return s;};
test('angle trajectory is repeatable, independent of legacy target coordinates',()=>{
 const a=battle(),b=clone(a);
 assert.deepEqual(M.previewShot(a,{gunner:1,angle:25}),M.previewShot(a,{gunner:1,angle:25}));
 assert.deepEqual(M.attack(a,{gunner:1,angle:25,target:'crew',x:99,y:99}),M.attack(b,{gunner:1,angle:25,target:'hull'}));
});
test('flight samples follow one parabola and displayed range determines launch speed',()=>{
 const s=battle(),flight=M.previewShot(s,{gunner:1,angle:45}),{speed}=flight.spec,rad=Math.PI/4;
 assert.ok(Math.abs(speed*speed/BALLISTICS.gravity*10-M.stats(M.PIRATES[0]).range)<1e-10);
 for(const p of flight.shots[0].path){
  assert.ok(Math.abs(p.x-(flight.origin.x+speed*Math.cos(rad)*p.t))<1e-8);
  assert.ok(Math.abs(p.y-(flight.origin.y+speed*Math.sin(rad)*p.t-.5*BALLISTICS.gravity*p.t*p.t))<1e-8);
 }
 const rifle=M.previewShot(s,{gunner:2,angle:45});assert.ok(rifle.spec.speed>speed);
 assert.deepEqual(pointAt(flight.shots[0].path,0),flight.origin);
});
test('launch locks input and cannot change health until resolution',()=>{
 const s=battle(),before=clone(s.battle.enemy);assert.ok(M.launchShot(s,{gunner:1,angle:25}));
 assert.equal(s.battle.phase,'flight');assert.deepEqual(s.battle.enemy,before);
 assert.equal(M.moveShip(s,1),false);assert.equal(M.launchShot(s),null);assert.equal(M.finishMove(s),false);
 const e=M.resolveShot(s);assert.ok(e.hit);assert.ok(e.damage>0);assert.notDeepEqual(s.battle.enemy,before);
 const after=clone(s);assert.equal(M.resolveShot(s),null);assert.deepEqual(s,after);
});
test('reload during flight preserves trajectory and applies damage only once',()=>{
 const s=battle();M.launchShot(s,{gunner:1,angle:25});const resumed=M.restore(JSON.stringify(s),T);
 assert.deepEqual(M.pendingFlight(s),M.pendingFlight(resumed));assert.deepEqual(M.resolveShot(s),M.resolveShot(resumed));
 assert.deepEqual(s.battle,resumed.battle);assert.equal(M.resolveShot(resumed),null);
});
test('invalid angles and unassigned gunners cannot launch',()=>{
 const s=battle(),before=clone(s);
 for(const angle of [NaN,Infinity,4,76])assert.equal(M.launchShot(s,{angle}),null);
 assert.equal(M.launchShot(s,{gunner:36}),null);assert.deepEqual(s,before);
});
test('movement changes the trajectory origin, obeys turn and per-turn limits',()=>{
 const s=battle(),p=M.previewShot(s,{gunner:1,angle:25});
 assert.equal(M.moveShip(s,1),true);assert.equal(M.moveShip(s,-1),true);
 assert.ok(Math.abs(M.previewShot(s,{gunner:1,angle:25}).origin.x-p.origin.x)<1e-10);
 assert.equal(s.battle.movesLeft,0);assert.equal(M.moveShip(s,1),false);
 M.elapse(s,30);assert.equal(M.moveShip(s,-1),false);M.enemyTurn(s);assert.equal(s.battle.movesLeft,2);
});
test('a blast chips the first collision and the next shot reaches deeper wood',()=>{
 const f=battle().battle.enemy,origin={x:6,y:-.2};
 const first=traceProjectile(f,'player',origin,5,4);assert.equal(first.impact.kind,'hull');assert.equal(first.impact.index,2);
 chipHull(f,first.impact.x,first.impact.y,8);
 const next=traceProjectile(f,'player',origin,5,4);assert.equal(next.impact.kind,'hull');assert.ok(f.hullParts[2].hp>0);
 assert.ok(next.path.at(-1).x>first.path.at(-1).x);
});
test('intact planking covers port crew and a pixel hole exposes them',()=>{
 const f=battle().battle.enemy,point={x:f.x,y:0};
 assert.equal(collisionAt(f,'enemy',point).kind,'hull');
 chipHull(f,0,0,8);assert.equal(collisionAt(f,'enemy',point).kind,'crew');
});
test('every projectile has exactly one specialty and does less damage off specialty',()=>{
 for(const p of M.PIRATES){const spec=M.projectileFor(p);assert.ok(['hull','crew','sails','masts'].includes(spec.bonus));assert.equal(typeof spec.bonus,'string');}
 for(const kind of ['hull','crew','sails','masts']){
  const a=battle().battle.enemy,b=clone(a),hit={kind,index:0,x:-.7,y:-.15,id:a.crew[0].id,slot:a.crew[0].slot};
  const bonus=M.impactDamage(a,hit,20,{bonus:kind}),ordinary=M.impactDamage(b,hit,20,{bonus:kind==='hull'?'crew':'hull'});
  if(kind==='hull'){assert.ok(bonus>ordinary&&ordinary>0);}else{assert.equal(bonus,32);assert.equal(ordinary,13);}
 }
 assert.equal(M.projectileFor(M.PIRATES[0]).bonus,'hull');
 assert.equal(M.projectileFor(M.PIRATES[5]).bonus,'crew');
 assert.equal(M.projectileFor(M.PIRATES[4]).bonus,'sails');
 assert.equal(M.projectileFor(M.PIRATES[9]).bonus,'masts');
});
test('crew, sails, masts and hull sections retain independent health',()=>{
 const f=battle().battle.enemy,before=clone(f);
 M.impactDamage(f,{kind:'sails',index:0},10,{bonus:'sails'});
 assert.ok(f.sailParts[0].hp<before.sailParts[0].hp);
 assert.deepEqual(f.sailParts.slice(1),before.sailParts.slice(1));assert.deepEqual(f.mastParts,before.mastParts);assert.deepEqual(f.crew,before.crew);assert.equal(f.hull,before.hull);
 M.impactDamage(f,{kind:'masts',index:1},100,{bonus:'masts'});
 assert.equal(f.mastParts[1].hp,0);assert.equal(f.mastParts[0].hp,80);
 assert.ok(f.sailParts.slice(3,6).every(p=>p.hp===0));assert.ok(f.sailParts[6].hp>0);
});
test('grapeshot consists of reproducible pellets with separate first collisions',()=>{
 const s=battle();s.battle.player.crew[0].id=6;
 const a=M.previewShot(s,{gunner:6,angle:25}),b=M.previewShot(s,{gunner:6,angle:25});
 assert.equal(a.shots.length,7);assert.deepEqual(a,b);
 assert.equal(new Set(a.shots.map(p=>p.path.at(-1).y)).size,7);
});
test('save validation rejects damaged geometry and unusable pending shots',()=>{
 for(const alter of [s=>s.battle.enemy.hullParts[0].hp=-1,s=>s.battle.enemy.mastParts.pop(),s=>s.battle.player.x=13,s=>s.battle.pending.gunner=36]){
  const s=battle();M.launchShot(s,{angle:25});alter(s);assert.throws(()=>M.restore(JSON.stringify(s),T));
 }
});
test('town migration retains the captain town while arranging regions in requested order',()=>{
 assert.deepEqual(M.PORT_REGIONS.map(r=>r.name),['Europe','Americas','Africa / India','Asia','Pacific']);
 const s=M.fresh(T);delete s.portLayout;s.port=7;s.visited=[0,7,13];
 const restored=M.restore(JSON.stringify(s),T);assert.equal(M.PORTS[restored.port],'Hawaii');
 assert.deepEqual(restored.visited.map(i=>M.PORTS[i]),['London','Hawaii','Mombasa']);
 assert.deepEqual(M.restore(JSON.stringify(restored),T),restored);
});
