import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
import {stationPosition,collisionAt} from '../src/ballistics.js';
import {shipToWorld} from '../src/ship-pose.js';
import {cutawaySide,battleCamera,aimDots,dragAim,crewReaction} from '../src/combat-view.js';
const setup=()=>{const s=M.fresh(1900000000000);M.startBattle(s,1900000000000);return s;};
test('defender stays closed through flight and impact hold, including a turn transition',()=>{
 assert.equal(cutawaySide({phase:'flight',pending:{side:'enemy'}},true,'enemy','impact','player'),'enemy');
 assert.equal(cutawaySide({phase:'player'},true,'enemy','impact','player'),'enemy');
 assert.equal(cutawaySide({phase:'player'},false,'enemy','impact','player'),'player');
 assert.equal(cutawaySide({phase:'enemy'},true,'player','impact','enemy'),'player');
 assert.equal(cutawaySide({phase:'result'},true,'player','wide','enemy'),null);
});
test('a hull or sails alone can survive, destruction requires both; empty crew can be boarded',()=>{
 const b=setup().battle;b.enemy.hull=0;assert.equal(M.outcome(b),null);b.enemy.sails=0;assert.equal(M.outcome(b),true);
 b.enemy.hull=10;assert.equal(M.outcome(b),null);b.enemy.crew.forEach(g=>g.hp=0);assert.equal(M.outcome(b),true);
 const other=setup().battle;other.player.hull=0;assert.equal(M.outcome(other),null);other.player.sails=0;assert.equal(M.outcome(other),false);
});
test('boarding earns exactly 10% extra gold once, destruction and retreat do not',()=>{
 for(const reason of ['board','destroy','retreat']){const s=setup(),b=s.battle,before=s.gold;b.phase='result';b.won=reason!=='retreat';
  if(reason==='board')b.enemy.crew.forEach(g=>g.hp=0);if(reason==='destroy'){b.enemy.hull=0;b.enemy.sails=0;b.enemy.crew.forEach(g=>g.hp=0);}
  const result=M.settle(s),base=Math.floor(M.E.MATCH.gold*(b.won?1:M.E.MATCH.lossShare)),bonus=reason==='board'?Math.floor(base*.1):0;
  assert.equal(result.lootBonus,bonus);assert.equal(result.gold,base+bonus);assert.equal(s.gold,before+base+bonus);assert.equal(M.settle(s),null);
  assert.equal(M.restore(JSON.stringify(s),1900000000000).lastResult.lootBonus,bonus);
 }
});
test('larger crew and hit boxes agree above the old head boundary',()=>{
 const f=setup().battle.player,g=f.crew[0],p=stationPosition(f,g.slot);assert.equal(p.height,.44*1.3);assert.equal(p.width,.32*1.3);
 const contact=collisionAt(f,'player',shipToWorld(f,1,{x:p.x+.12,y:p.y+.50}));assert.equal(contact?.kind,'crew');assert.equal(contact.id,g.id);
});
test('wide camera contains both entire ships and reserves water room below hull',()=>{
 for(const [w,h] of [[1440,668],[932,265],[390,516]])for(const [px,ex] of [[1.9,9.3],[3.7,7.5]]){
  for(const mode of ['wide','impact']){const c=battleCamera(w,h,px,ex,mode,ex);for(const x of [px-1.3,ex+1.3])assert.ok(c.ox+x*c.ppu>=0&&c.ox+x*c.ppu<=w);assert.ok(c.oy-2.5*c.ppu>=0);assert.ok(c.oy+.7*c.ppu<=h-40);}
  const close=battleCamera(w,h,px,ex);assert.ok(close.oy+.7*close.ppu<=h-40);
 }
});
test('aim dots taper, use the launch parabola and expose only a short hint',()=>{
 const origin={x:2,y:.5},speed=5,angle=35,distance=6,dots=aimDots(origin,speed,angle,distance);assert.equal(dots.length,9);
 assert.deepEqual({x:dots[0].x,y:dots[0].y},origin);assert.ok(dots.at(-1).x-origin.x<=distance*.15);
 dots.forEach((p,i)=>{const t=(p.x-origin.x)/(speed*Math.cos(angle*Math.PI/180));assert.ok(Math.abs(p.y-(origin.y+speed*Math.sin(angle*Math.PI/180)*t-1.6*t*t))<1e-9);if(i)assert.ok(p.r<dots[i-1].r);});
});
test('drag launch is anchored to the gesture, with no-shot taps and upward/backward cancellation',()=>{
 const start={x:300,y:200};assert.equal(dragAim(start,{x:200,y:258}).angle,30);assert.equal(dragAim(start,{x:200,y:258}).cancel,false);
 assert.equal(dragAim(start,{x:302,y:201}).moved,false);assert.equal(dragAim(start,{x:400,y:240}).cancel,true);assert.equal(dragAim(start,{x:300,y:300}).cancel,true);
});
test('five crew responses distinguish misses, glancing hits, solid hits, heavy hits and kills',()=>{
 const levels=[crewReaction(null,500),crewReaction({hit:true,damage:5},500),crewReaction({hit:true,damage:30},500),crewReaction({hit:true,damage:90},500),crewReaction({hit:true,damage:5},500,1)].map(c=>c.level);assert.deepEqual(levels,[0,1,2,3,4]);
});
