import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {rigLayout} from '../src/ballistics.js';
const T=Date.UTC(2026,8,16,12),copy=x=>structuredClone(x);
test('every special unlocks for 10 gold during testing without gems or duplicate charges',()=>{
 const s=M.fresh(T);s.gems=0;
 for(const m of M.FINISHERS){assert.deepEqual(m.cost,{gold:10});if(s.moves.includes(m.id))continue;
  s.gold=9;assert.equal(M.buyMove(s,m.id),false);assert.equal(s.gold,9);
  s.gold=10;assert.equal(M.buyMove(s,m.id),true);assert.equal(s.gold,0);assert.equal(s.gems,0);
  assert.equal(M.buyMove(s,m.id),false);assert.equal(s.gold,0);
 }
 assert.deepEqual(M.restore(JSON.stringify(s),T).moves,M.FINISHERS.map(m=>m.id));
});
function setup(id=0){const s=M.fresh(T);s.sailLevel=5;s.moves=M.FINISHERS.map(m=>m.id);s.move=id;M.startBattle(s,T);return s;}
// Feed controlled contacts through the real fired-attack resolver, including pellet timing.
function fire(s,hit=true,side='player',kind='sails'){
 const b=s.battle;b.phase=side;if(side==='player')b.shots=2;else b.enemyShots=1;
 const f=M.launchShot(s,{side,gunner:b[side].crew[0].id,angle:25});assert.ok(f);
 const foe=b[side==='player'?'enemy':'player'];
 f.shots.forEach((p,i)=>{p.impact=hit?{kind,index:(b.events.length+i)%8,x:-.7,y:-.15,id:foe.crew[0].id,slot:foe.crew[0].slot}:null;if(kind==='masts'&&p.impact)p.impact.index=0;});
 return M.resolveShot(s);
}
test('four successful fired attacks charge; misses reset incomplete progress; enemy turns preserve it',()=>{
 const s=setup(),b=s.battle;fire(s);assert.equal(b.streak,1);fire(s);assert.equal(b.streak,2);
 fire(s,false,'enemy');assert.equal(b.streak,2);fire(s,false);assert.equal(b.streak,0);
 for(let i=1;i<=4;i++){assert.ok(fire(s).damage>0);assert.equal(b.streak,i);assert.equal(b.charged,i===4);}
 fire(s,false);assert.equal(b.streak,4);assert.equal(b.charged,true);
 assert.ok(M.finishMove(s));assert.equal(b.streak,0);assert.equal(b.charged,false);M.resolveFinishMove(s);M.completeFinishMove(s);
 assert.equal(b.streak,0);for(let i=0;i<4;i++)fire(s);assert.equal(b.charged,true);assert.ok(M.finishMove(s));
});
test('seven grapeshot pellets count once, after the fired attack finishes',()=>{
 const s=setup(),b=s.battle;b.player.crew[0].id=6;const f=M.launchShot(s,{gunner:6,angle:25});assert.equal(f.shots.length,7);
 f.shots.forEach((p,i)=>{p.impact={kind:'sails',index:i,x:0,y:1};});
 const first=Math.min(...f.shots.map(p=>p.duration));M.advanceShot(s,first);assert.equal(b.streak,0);
 const e=M.resolveShot(s);assert.ok(e.impacts.length>1);assert.equal(b.streak,1);assert.equal(M.resolveShot(s),null);assert.equal(b.streak,1);
});
test('hull, sails, mast and crew damage all count, zero damage does not',()=>{
 for(const kind of ['hull','sails','masts','crew']){const s=setup();assert.ok(fire(s,true,'player',kind).damage>0);assert.equal(s.battle.streak,1);}
 const s=setup();s.battle.enemy.sailParts.forEach(p=>p.hp=0);s.battle.streak=2;assert.equal(fire(s).damage,0);assert.equal(s.battle.streak,0);
});
test('turn timeout preserves progress and special sequences lock shots, movement and clock',()=>{
 const s=setup(),b=s.battle;b.streak=2;M.elapse(s,30);assert.equal(b.streak,2);b.phase='player';b.charged=true;b.seconds=19;M.finishMove(s);
 assert.equal(M.elapse(s,100),false);assert.equal(b.seconds,19);assert.equal(M.launchShot(s),null);assert.equal(M.moveShip(s,1),false);assert.equal(M.finishMove(s),false);assert.equal(M.completeFinishMove(s),false);
});
test('shark and Kraken preserve charge when no valid target remains',()=>{
 for(const id of [0,1]){const s=setup(id),b=s.battle;b.charged=true;b.streak=4;if(id===0)b.enemy.crew.forEach(g=>g.hp=0);else b.enemy.mastParts.forEach(m=>m.hp=0);
 assert.match(M.specialUnavailable(s),/charge is kept/);assert.equal(M.finishMove(s),false);assert.equal(b.charged,true);assert.equal(b.streak,4);}
});
test('shark only takes deck gunners and keeps its charge when only hull gunners remain',()=>{
 const s=setup(),b=s.battle,hull=b.enemy.crew.filter(g=>g.slot.startsWith('h'));
 assert.ok(hull.some(g=>g.hp>0));const before=copy(hull);
 b.charged=true;const p=M.finishMove(s);assert.ok(b.enemy.crew.find(g=>g.id===p.targetCrew).slot.startsWith('d'));
 M.resolveFinishMove(s);M.completeFinishMove(s);assert.deepEqual(hull,before);
 b.enemy.crew.filter(g=>g.slot.startsWith('d')).forEach(g=>g.hp=0);b.charged=true;b.streak=4;
 assert.match(M.specialUnavailable(s),/Hull gunners are protected/);assert.equal(M.finishMove(s),false);
 assert.equal(b.charged,true);assert.equal(b.streak,4);assert.equal(b.phase,'player');assert.deepEqual(hull,before);
});
test('Kraken removes exactly the selected mast and its attached sails',()=>{
 const s=setup(1),b=s.battle;b.charged=true;b.enemy.mastParts[0].hp=0;const before=copy(b.enemy);const p=M.finishMove(s);assert.equal(p.targetMast,1);M.resolveFinishMove(s);
 b.enemy.mastParts.forEach((m,i)=>assert.equal(m.hp,i===1?0:before.mastParts[i].hp));
 rigLayout().sails.forEach((r,i)=>assert.equal(b.enemy.sailParts[i].hp,r.mast===1?0:before.sailParts[i].hp));
});
test('all special saves resume before and after impact without duplicate damage',()=>{
 for(const move of M.FINISHERS){let s=setup(move.id);s.battle.charged=true;M.finishMove(s);const before=copy(s.battle.enemy);
 s=M.restore(JSON.stringify(s),T);assert.deepEqual(s.battle.enemy,before);assert.ok(M.resolveFinishMove(s));const after=copy(s.battle.enemy);
 s=M.restore(JSON.stringify(s),T);assert.equal(M.resolveFinishMove(s),false);assert.deepEqual(s.battle.enemy,after);assert.equal(s.battle.phase,'special');assert.ok(M.completeFinishMove(s));assert.equal(M.completeFinishMove(s),false);}
});
test('shark keeps the victim snapshot alive and delays victory and rewards until aftermath',()=>{
 const s=setup(),b=s.battle;b.enemy.crew.slice(1).forEach(g=>g.hp=0);b.charged=true;const p=M.finishMove(s);M.resolveFinishMove(s);
 assert.equal(M.active(b.enemy).length,0);assert.equal(M.active(p.before).length,1);assert.equal(b.phase,'special');assert.equal(M.settle(s),null);
 M.completeFinishMove(s);assert.equal(b.phase,'result');assert.equal(b.won,true);assert.ok(M.settle(s));assert.equal(M.settle(s),null);
});
test('whale destroys a hull with living crew and intact sails after its aftermath',()=>{
 let s=M.fresh(T);s.moves.push(2);s.move=2;M.startBattle(s,T);
 for(let i=0;i<3;i++){
  s.battle.charged=true;s.battle.streak=4;assert.ok(M.finishMove(s));assert.ok(M.resolveFinishMove(s));
  const hull=s.battle.enemy.hull;
  s=M.restore(JSON.stringify(s),T);assert.equal(M.resolveFinishMove(s),false);assert.equal(s.battle.enemy.hull,hull);
  assert.equal(s.battle.phase,'special');
  M.completeFinishMove(s);
 }
 assert.equal(s.battle.enemy.hull,0);assert.ok(s.battle.enemy.sails>0);assert.ok(M.active(s.battle.enemy).length>0);
 assert.equal(s.battle.phase,'result');assert.equal(s.battle.won,true);
 assert.equal(M.settle(s,T).looted,false);assert.equal(M.settle(s,T),null);
});
test('exhausted attack targets stay unavailable across turns and incomplete charge',()=>{
 for(const id of [0,1,5]){
  const s=M.fresh(T);s.moves.push(id);s.move=id;M.startBattle(s,T);
  if(id===1)s.battle.enemy.mastParts.forEach(p=>p.hp=0);
  else s.battle.enemy.crew.filter(g=>g.slot.startsWith('d')).forEach(g=>g.hp=0);
  for(const phase of ['player','enemy','flight'])for(const charged of [false,true]){
   s.battle.phase=phase;s.battle.charged=charged;
   assert.match(M.specialTargetUnavailable(s),/No /);
  }
 }
});
