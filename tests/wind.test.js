import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {seaShot} from '../src/moving-shot.js';
import {pointAt} from '../src/ballistics.js';
import {battleWind,windSpeed} from '../src/wind.js';

test('wind moves both sides downwind with proportional strength',()=>{
 for(const side of ['player','enemy']){
  const shot=wind=>seaShot({x:5,y:0},side,4.8,35,wind).path.at(-1);
  const calm=shot(0),light=shot(1),strong=shot(3),left=shot(-3);
  assert.ok(strong.x>light.x&&light.x>calm.x&&left.x<calm.x);
  assert.ok(Math.abs(strong.x-calm.x-3*(light.x-calm.x))<1e-10);
  assert.equal(strong.y,calm.y);assert.equal(strong.t,calm.t);
 }
});
test('battle wind is seeded, bounded and survives refresh; old battles remain calm',()=>{
 for(let seed=1;seed<100;seed++){const wind=battleWind(seed);assert.ok(Number.isInteger(wind)&&Math.abs(wind)<=3);assert.equal(wind,battleWind(seed));}
 const s=M.fresh();M.startBattle(s,12345);s.battle.wind=-3;
 assert.equal(M.restore(JSON.stringify(s)).battle.wind,-3);
 delete s.battle.wind;assert.equal(M.restore(JSON.stringify(s)).battle.wind,0);
 s.battle.wind=4;assert.throws(()=>M.restore(JSON.stringify(s)));
});
test('aim preview and launched volley use the same wind',()=>{
 const s=M.fresh();M.startBattle(s,12345);s.battle.wind=3;
 const preview=M.previewShot(s,{gunner:1,angle:35}),flight=M.launchShot(s,{gunner:1,angle:35});
 assert.deepEqual(flight.shots,preview.shots);assert.equal(flight.wind,3);
});
test('in-flight wind and positions survive reload without duplicate impacts',()=>{
 const s=M.fresh();M.startBattle(s,12345);s.battle.wind=-3;
 const flight=M.launchShot(s,{gunner:1,angle:35,live:true});M.advanceShot(s,.2);
 const restored=M.restore(JSON.stringify(s)),resumed=M.pendingFlight(restored);
 assert.equal(resumed.wind,-3);assert.deepEqual(pointAt(resumed.shots[0].path,.4),pointAt(flight.shots[0].path,.4));
 M.advanceShot(s,5);M.advanceShot(restored,5);assert.deepEqual(restored.battle.enemy,s.battle.enemy);
 const enemy=structuredClone(restored.battle.enemy);M.advanceShot(restored,5);assert.deepEqual(restored.battle.enemy,enemy);
 assert.equal(windSpeed(0),0);
});
