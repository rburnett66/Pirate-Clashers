import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../src/model.js';
import * as H from '../src/hull-mask.js';
import {rigLayout,collisionAt,stationPosition} from '../src/ballistics.js';
import {shipToWorld} from '../src/ship-pose.js';
import {artToWorld,worldToArt,shipAppearance,SHIP_ART,MAST_MOUNTS,RIG_SAILS,RIG_FLAGS,sailPanels,clothPlacement} from '../src/ship-art-layout.js';

test('prototype saves migrate to the art silhouette without healing damaged sections',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/legacy-ship-mask.json',import.meta.url),'utf8')),s=M.fresh();M.startBattle(s);
 Object.assign(s.battle.player,old,{shipLevel:1,legacySections:3});const before=old.hullParts.map(p=>p.hp/p.maxHp),restored=M.restore(JSON.stringify(s)),f=restored.battle.player;
 assert.equal(f.hullMask.version,H.HULL_MASK.version);f.hullParts.forEach((p,i)=>assert.ok(Math.abs(p.hp/p.maxHp-before[i])<.001));
 assert.deepEqual(M.restore(JSON.stringify(restored)).battle.player.hullMask,f.hullMask);
 const malformed=structuredClone(s);malformed.battle.player.hullMask.bits='corrupted';assert.throws(()=>M.restore(JSON.stringify(malformed)));
});
test('five supplied cloth panels retain eight damage zones and break with their mast',()=>{
 const s=M.fresh();s.sailLevel=5;M.startBattle(s);const f=s.battle.enemy,rig=rigLayout();f.crew.forEach(g=>g.hp=0);
 assert.equal(rig.masts.length,3);assert.equal(rig.sails.length,8);
 for(let i=0;i<3;i++){
  const cells=rig.sails.map((p,j)=>({...p,index:j})).filter(p=>p.mast===i);let sample;
  for(const cell of cells)for(let t=0;t<20;t++){const p={x:cell.x-cell.halfW+(t+.5)*cell.halfW/10,y:cell.y};const hit=collisionAt(f,'enemy',shipToWorld(f,-1,p));if(hit?.kind==='sails'&&hit.index===cell.index)sample=p;}
  assert.ok(sample,'visible sail is hittable for mast '+i);f.mastParts[i].hp=0;assert.equal(collisionAt(f,'enemy',shipToWorld(f,-1,sample)),null);
 }
});
test('hold crew stay below the intact deck boundary and emerge through a real breach',()=>{
 const s=M.fresh();M.startBattle(s);const f=s.battle.enemy,g=f.crew.find(g=>g.slot==='h0'),q=stationPosition(f,g.slot);
 const air=shipToWorld(f,-1,{x:q.x,y:q.y+q.height-.01});assert.notEqual(collisionAt(f,'enemy',air)?.kind,'crew');
 const p={x:q.x-.07,y:-.3};assert.equal(collisionAt(f,'enemy',shipToWorld(f,-1,p)).kind,'hull');H.chipHull(f,p.x,p.y,8);assert.equal(collisionAt(f,'enemy',shipToWorld(f,-1,p)).id,g.id);
});
test('art keeps a uniform scale and owned sail choices map to the supplied designs',()=>{
 for(const p of [[0,0],[810,960],[1792,1008]]){const back=worldToArt(artToWorld(p));back.forEach((v,i)=>assert.ok(Math.abs(v-p[i])<1e-9));}
 assert.equal(shipAppearance(3,null,'player').sails.id,'IMG_7255');assert.equal(shipAppearance(3,null,'enemy').sails.id,'IMG_7256');
 for(let i=0;i<6;i++)assert.ok(shipAppearance(3,i).sails.sails.every(s=>s.cloth));
 assert.equal(shipAppearance(6).hull.id,'IMG_7287');
});


test('template assembly has five unstretched sails, two flags and native mast registration',()=>{
 assert.deepEqual(MAST_MOUNTS,SHIP_ART.masts.map(m=>m.pivot));
 assert.equal(RIG_SAILS.length,5);assert.deepEqual([0,1,2].map(i=>RIG_SAILS.filter(s=>s.mast===i).length),[1,2,2]);
 assert.deepEqual(RIG_FLAGS.map(f=>f.mast),[1,2]);
 assert.equal(new Set(rigLayout().sails.map(s=>s.panel)).size,5);
 for(let cosmetic=0;cosmetic<6;cosmetic++){
  const panels=sailPanels(shipAppearance(3,cosmetic).sails);assert.equal(panels.length,5);
  panels.forEach((part,i)=>{const p=clothPlacement(i,part),o=p.point([0,0]),x=p.point([100,0]),y=p.point([0,100]);assert.ok(Math.abs(Math.hypot(x[0]-o[0],x[1]-o[1])-Math.hypot(y[0]-o[0],y[1]-o[1]))<1e-8);assert.ok(Math.max(...part.outline.map(v=>p.point(v)[1]))<=RIG_SAILS[i].bottom+.001);});
 }
 assert.ok(SHIP_ART.registration.interior.right.includes('xray-hull-nomast'));
});
