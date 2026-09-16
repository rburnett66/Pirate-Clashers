import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {HULLS,SHIP_TUNING,figureBonus,stationAnchors,sailConfig} from '../src/ship-config.js';
import {rigLayout,stationPosition,collisionAt} from '../src/ballistics.js';
import {shipToWorld} from '../src/ship-pose.js';
const rich=()=>{const s=M.fresh();s.gold=1e6;s.gems=1e5;s.mats={wood:1e5,metal:1e5,cloth:1e5};return s;};

test('six hulls preserve assignments, share capacity/ports/anchors, and reject replayed purchases',()=>{
 const s=rich();for(const h of HULLS){assert.equal(s.shipLevel,h.level);assert.equal(M.positions(s).length,h.capacity);assert.equal(h.holdAnchors.length,h.ports);assert.equal(stationAnchors(h.level).length,h.capacity);
  for(const p of stationAnchors(h.level))assert.deepEqual(stationPosition({shipLevel:h.level},p.slot),p);
  const before=structuredClone(s),paid=M.shipUpgrade(s,h.level);assert.equal(paid,h.level<6);
  if(paid){assert.deepEqual(s.slots,before.slots);for(const [k,v]of Object.entries(h.cost))assert.equal(s.mats[k],before.mats[k]-v);const after=structuredClone(s);assert.equal(M.shipUpgrade(s,h.level),false);assert.deepEqual(s,after);}
 }
 assert.equal(M.restore(JSON.stringify(s)).shipLevel,6);
});

test('sail progression controls visible/hittable rig independently of cosmetic and hull choices',()=>{
 const s=rich();M.cosmetic(s,2);for(let level=1;level<=5;level++){
  assert.equal(s.sailLevel,level);const b=M.startBattle(s),f=b.enemy,config=sailConfig(level),rig=rigLayout();
  assert.equal(f.mastParts.filter(p=>p.hp>0).length,config.masts.length);
  assert.deepEqual([...new Set(rig.sails.filter((p,i)=>f.sailParts[i].hp>0).map(p=>p.panel))].sort(),[...config.panels].sort());
  for(const p of rig.sails.filter(p=>!config.panels.includes(p.panel))){const hit=collisionAt(f,'enemy',shipToWorld(f,-1,{x:p.x,y:p.y}));if(hit?.kind==='sails')assert.ok(config.panels.includes(rig.sails[hit.index].panel));}
  M.impactDamage(f,{kind:'hull',index:0,x:-.5,y:-.3},10,{bonus:'hull',type:'iron'});assert.equal(f.sails,100);
  assert.equal(M.sailUpgrade(s),false,'cannot alter rig in active battle');s.battle=null;
  assert.equal(M.sailUpgrade(s,level),level<5);assert.equal(s.cosmetic,2);assert.equal(s.shipLevel,1);
 }
 assert.equal(sailConfig(6).future,true);assert.equal(sailConfig(7).panels.length,7);
});

test('figurehead ownership persists and exactly one configurable bonus is active',()=>{
 const s=rich();for(const figure of M.FIGUREHEADS){assert.ok(M.figure(s,figure.id));const gold=s.gold;assert.ok(M.figure(s,figure.id));assert.equal(s.gold,gold);const restored=M.restore(JSON.stringify(s));assert.equal(restored.figurehead,figure.id);for(const other of M.FIGUREHEADS)assert.equal(figureBonus(restored,other.bonusType),other===figure?SHIP_TUNING.figureBonus:0);}
 assert.equal(Object.keys(s.figureheads).length,7);assert.equal(M.figure(s,'unknown'),false);
});

test('figurehead defenses and movement affect existing combat paths',()=>{
 const make=id=>{const s=rich();M.figure(s,id);return {s,f:M.startBattle(s).player};};
 for(const [id,type,kind]of [['siren','fire','crew'],['unicorn','iron','crew'],['skull','bullet','crew']]){
  const {f}=make(id),plain=structuredClone(f);plain.figure=null;const g=f.crew[0],impact={kind,id:g.id,slot:g.slot,x:0,y:0},spec={type,bonus:'crew'};
  const reduced=M.impactDamage(f,impact,40,spec),normal=M.impactDamage(plain,impact,40,spec);assert.ok(reduced<normal,id);
 }
 const {s,f}=make('dolphin'),x=f.x;M.moveShip(s,1);assert.ok(Math.abs(f.x-x-SHIP_TUNING.baseMove*1.05)<1e-9);
});

test('attack figureheads modify resolved weapon damage and do not boost unrelated weapons',()=>{
 for(const [figure,gunner]of [['endowed-female',1],['shark',2],['asian-dragon',5]]){
  const s=rich();s.sailLevel=5;M.figure(s,figure);const b=M.startBattle(s);let option;
  for(let angle=5;angle<=75;angle++){const f=M.previewShot(s,{gunner,angle});if(f?.shots.some(q=>q.impact?.kind==='hull')){option={gunner,angle};break;}}
  assert.ok(option,figure+' has a hittable trajectory');const plain=structuredClone(s);plain.battle.player.figure=null;const unrelated=structuredClone(plain);unrelated.battle.player.figure='siren';
  const enhanced=M.attack(s,option),normal=M.attack(plain,option);assert.ok(enhanced.damage>normal.damage,figure);assert.equal(M.attack(unrelated,option).damage,normal.damage);
 }
});

test('active legacy battles retain health and geometry through repeated reloads',()=>{
 const s=rich();s.sailLevel=5;const b=M.startBattle(s);b.player.hullParts[0].hp*=.6;
 delete s.progressionVersion;s.shipLevel=3;s.figureheads={};s.figurehead=null;
 for(const f of [b.player,b.enemy,b.opponent]){f.shipLevel=3;f.figure=null;delete f.sailLevel;}
 const original=b.player.hullMask.bits,restored=M.restore(JSON.stringify(s));assert.equal(restored.shipLevel,1);assert.equal(restored.battle.player.shipLevel,1);assert.equal(restored.battle.player.sailLevel,5);assert.equal(restored.battle.player.hullMask.bits,original);assert.deepEqual(M.restore(JSON.stringify(restored)).battle,restored.battle);
});

test('legacy progression migrates once without losing resources, assignments or paid figurehead grades',()=>{
 const s=rich();delete s.progressionVersion;s.shipLevel=8;s.figureheads={0:4,3:2,5:3};s.figurehead=0;delete s.sailLevel;const before=structuredClone(s),restored=M.restore(JSON.stringify(s));
 assert.equal(restored.shipLevel,6);assert.equal(restored.sailLevel,5);assert.equal(restored.figurehead,'dolphin');assert.equal(restored.figureheads.dolphin,4);assert.deepEqual(restored.slots,before.slots);assert.equal(restored.gold,before.gold);assert.deepEqual(restored.mats,before.mats);assert.deepEqual(M.restore(JSON.stringify(restored)),restored);
});

test('result snapshots record actual gem/XP/trophy deltas and never settle twice',()=>{
 const s=rich();s.chestRun=4;const before={gold:s.gold,gems:s.gems,xp:s.xp,honor:s.trophies},b=M.startBattle(s);b.won=true;b.phase='result';b.enemy.crew.forEach(g=>g.hp=0);const r=M.settle(s);
 for(const key of ['gold','gems','xp'])assert.equal(r[key],s[key]-before[key]);assert.equal(r.honor,s.trophies-before.honor);assert.equal(r.lootBonus,Math.floor(M.E.MATCH.gold*.1));const saved=JSON.stringify(s);assert.equal(M.settle(s),null);assert.equal(JSON.stringify(s),saved);const restored=M.restore(saved);assert.equal(M.settle(restored),null);
 M.startBattle(s,Date.now()+1);s.battle.won=false;s.battle.phase='result';const loss=M.settle(s);assert.equal(loss.gems,0);assert.equal(loss.honor,0);assert.equal(loss.xp,20);assert.notEqual(loss.id,r.id);
});
