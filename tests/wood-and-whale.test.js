import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
test('wood bundle charges gold once and persists, with no changes on insufficient funds',()=>{
 const s=M.fresh(),wood=s.mats.wood,gold=s.gold;
 assert.equal(M.buyWood(s),true);assert.equal(s.mats.wood,wood+100);assert.equal(s.gold,gold-500);
 assert.equal(M.restore(JSON.stringify(s)).mats.wood,wood+100);
 s.gold=499;const before=structuredClone(s);assert.equal(M.buyWood(s),false);assert.deepEqual(s,before);
});
test('every Captain share grants three times free wood, including attack and gem milestones',()=>{
 for(let level=1;level<=50;level++)assert.equal(M.rewardAt(level,true).wood,M.rewardAt(level,false).wood*3);
 const s=M.fresh();s.xp=4900;s.premium=true;
 for(const level of [1,5,6,14])for(const premium of [false,true]){
  const wood=s.mats.wood,reward=M.rewardAt(level,premium);assert.ok(M.claim(s,level,premium));assert.equal(s.mats.wood,wood+reward.wood);
  assert.equal(M.claim(s,level,premium),false);assert.equal(s.mats.wood,wood+reward.wood);
  if(reward.move!==undefined)assert.ok(s.moves.includes(reward.move));
 }
 assert.equal(M.restore(JSON.stringify(s)).mats.wood,s.mats.wood);
});
test('successive whales crush remaining hull at impact and persist their HP loss exactly once',()=>{
 const s=M.fresh();s.moves.push(2);s.move=2;M.startBattle(s);
 for(let i=0;i<3;i++){
  const before=s.battle.enemy.hull,bits=s.battle.enemy.hullMask.bits;s.battle.charged=true;
  assert.ok(M.finishMove(s));assert.equal(s.battle.enemy.hull,before);assert.ok(M.resolveFinishMove(s));
  const damage=before-s.battle.enemy.hull;assert.ok(Math.abs(damage-Math.min(before,M.SPECIAL_TUNING.whaleHullDamage))<.1);
  assert.notEqual(s.battle.enemy.hullMask.bits,bits);assert.match(s.battle.log.at(-1),/hull damage/);
  const restored=M.restore(JSON.stringify(s));assert.equal(M.resolveFinishMove(restored),false);assert.equal(restored.battle.enemy.hull,s.battle.enemy.hull);
  M.completeFinishMove(s);
 }
 assert.equal(s.battle.enemy.hull,0);
});
