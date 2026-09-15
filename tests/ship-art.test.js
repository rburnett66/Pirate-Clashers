import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../src/model.js';
import * as H from '../src/hull-mask.js';
import {rigLayout,collisionAt,stationPosition} from '../src/ballistics.js';
import {shipToWorld} from '../src/ship-pose.js';
import {artToWorld,worldToArt,shipAppearance} from '../src/ship-art-layout.js';

test('prototype saves migrate to the art silhouette without healing damaged sections',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/legacy-ship-mask.json',import.meta.url),'utf8')),s=M.fresh();M.startBattle(s);
 Object.assign(s.battle.player,old);const before=old.hullParts.map(p=>p.hp/p.maxHp),restored=M.restore(JSON.stringify(s)),f=restored.battle.player;
 assert.equal(f.hullMask.version,H.HULL_MASK.version);f.hullParts.forEach((p,i)=>assert.ok(Math.abs(p.hp/p.maxHp-before[i])<.001));
 assert.deepEqual(M.restore(JSON.stringify(restored)).battle.player.hullMask,f.hullMask);
 const malformed=structuredClone(s);malformed.battle.player.hullMask.bits='corrupted';assert.throws(()=>M.restore(JSON.stringify(malformed)));
});
test('three supplied cloth shapes retain eight damage zones and break with their mast',()=>{
 const s=M.fresh();M.startBattle(s);const f=s.battle.enemy,rig=rigLayout();f.crew.forEach(g=>g.hp=0);
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
 assert.equal(shipAppearance(8).hull.id,'IMG_7300');
});
