import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.js';
const T=Date.UTC(2026,8,13,12);
const clone=x=>JSON.parse(JSON.stringify(x));
function rich(){const s=M.fresh(T);s.gold=1e6;s.gems=1e5;s.mats={wood:1e5,metal:1e5,cloth:1e5};return s}
test('station ladder and placement preserve unique recruited crew',()=>{
const s=M.fresh(T);assert.equal(M.PIRATES.length,36);
assert.equal(M.assign(s,36,'d0'),false);assert.equal(M.assign(s,1,'h3'),false);
assert.equal(M.assign(s,1,'h0'),true);assert.equal(s.slots.d0,undefined);
assert.equal(new Set(Object.values(s.slots)).size,Object.values(s.slots).length);
for(let l=1;l<=8;l++){s.shipLevel=l;assert.equal(M.positions(s).length,l);}
});
test('ship progression consumes exact prototype materials, no gold',()=>{
const s=rich(),before=clone(s),c=M.E.SHIP[s.shipLevel-1];
assert.ok(M.shipUpgrade(s));assert.equal(s.gold,before.gold);
for(const k of Object.keys(c))assert.equal(s.mats[k],before.mats[k]-c[k]);
s.shipLevel=8;assert.equal(M.shipUpgrade(s),false);
});
test('insufficient wallet and invalid exchange leave state untouched',()=>{
const s=M.fresh(T),before=clone(s);assert.equal(M.pay(s,{wood:1,gems:999}),false);assert.deepEqual(s,before);
for(const n of [0,-1,NaN,Infinity,1.5])assert.equal(M.exchange(s,'wood','metal',n),false);
assert.deepEqual(s,before);
});
test('gunsmith survives reload and completes exactly once',()=>{
const s=rich();s.cards[1]=10;assert.ok(M.upgrade(s,1,T));const end=s.bench.ends;
const resumed=M.restore(JSON.stringify(s),end);assert.equal(resumed.levels[1],2);assert.equal(resumed.bench,null);
M.advance(resumed,end+1);assert.equal(resumed.levels[1],2);assert.equal(M.skip(resumed,end),false);
});
test('chest claims are specific, deterministic and idempotent',()=>{
const s=M.fresh(T);s.chests=[{id:'reward',kind:'captain',seed:12}];const other=clone(s);
const a=M.openChest(s,'reward');assert.deepEqual(a,M.openChest(other,'reward'));
assert.equal(Object.values(a.cards).reduce((a,b)=>a+b,0),70);
const after=clone(s);assert.equal(M.openChest(s,'reward'),null);assert.deepEqual(s,after);
});
test('daily reset retains unopened chest contents',()=>{
const s=M.fresh(T);s.chests=[{id:'hold',kind:'wooden',seed:1}];s.dailyChests=5;
M.advance(s,T+86400000);assert.equal(s.dailyChests,0);assert.equal(s.chests[0].id,'hold');
});
test('season entitlements reject fractional and duplicate claims',()=>{
const s=M.fresh(T);s.xp=1300;assert.equal(M.claim(s,1,true),false);
for(const n of [NaN,1.5,0,51])assert.equal(M.claim(s,n,false),false);
s.premium=true;assert.ok(M.claim(s,14,true));assert.ok(s.moves.includes(1));
assert.equal(M.claim(s,14,true),false);
});
test('rollover catches up earned rewards once and retains finishers',()=>{
const s=M.fresh(T);s.premium=true;s.xp=4500;
const next=(s.season+1)*28*86400000;M.advance(s,next);
assert.deepEqual(s.moves,[0,1,2,3,4,5]);assert.equal(s.xp,0);assert.equal(s.premium,false);
const after=clone(s);M.advance(s,next);assert.deepEqual(s,after);
});
test('weekly promotion, boundary and haul settle once',()=>{
const s=M.fresh(T);s.weeklyWins=999;const next=Date.UTC(2026,8,14);
M.advance(s,next);assert.equal(s.port,1);assert.equal(s.gems,65);
const after=clone(s);M.advance(s,next);assert.deepEqual(s,after);
const top=M.fresh(T);top.port=14;top.weeklyWins=999;M.advance(top,next);assert.equal(top.port,14);
});
test('battle ends across seeded opponents and pays only once',()=>{
for(let i=1;i<=40;i++){const s=M.fresh(T);const b=M.startBattle(s,T+i);
let attempts=0;while(b.phase!=='result'&&attempts++<110){
if(b.phase==='player')M.attack(s,{target:'hull'});else M.enemyTurn(s);
}
assert.equal(b.phase,'result');assert.ok(b.player.hull>=0&&b.enemy.hull>=0);
const gold=s.gold;const r=M.settle(s,T+i+1000);assert.equal(s.gold,gold+r.gold);
const after=clone(s);assert.equal(M.settle(s),null);assert.deepEqual(s,after);
}
});
test('battle rejects acting for the wrong side without mutating state',()=>{
const s=M.fresh(T);M.startBattle(s,T);const before=clone(s);
assert.equal(M.attack(s,{side:'enemy'}),null);assert.equal(M.attack(s,{side:'invalid'}),null);assert.deepEqual(s,before);
});
test('rematch preserves rival loadout after player changes crew',()=>{
const s=M.fresh(T),b=M.startBattle(s,T),opponent=clone(b.enemy);
b.phase='result';b.won=false;M.settle(s,T+1);s.shipLevel=8;s.slots.d2=10;
assert.ok(M.requestRematch(s,()=>0));assert.deepEqual(s.battle.enemy,opponent);
assert.equal(M.requestRematch(s,()=>0),null);
});
test('refused rematch grants nothing and cannot be repeated',()=>{
const s=M.fresh(T),b=M.startBattle(s,T);b.phase='result';b.won=false;M.settle(s,T);
const gold=s.gold;assert.equal(M.requestRematch(s,()=>.99),false);assert.equal(s.gold,gold);
assert.equal(M.requestRematch(s,()=>0),null);
});
test('all six finishers affect intended target once',()=>{
for(let id=0;id<6;id++){const s=M.fresh(T);s.moves=[0,1,2,3,4,5];s.move=id;
const b=M.startBattle(s,T);b.charged=true;const before=clone(b.enemy);
assert.ok(M.finishMove(s));assert.equal(M.finishMove(s),false);
if(id===2)assert.ok(b.enemy.hull<before.hull);
else if([1,3,4].includes(id))assert.ok(b.enemy.sails<before.sails);
else assert.ok(M.active(b.enemy).length<M.active(before).length);
}
});
test('malformed saved state is rejected before gameplay',()=>{
for(const change of [
s=>s.mats.wood=-1,s=>s.slots.d0=999,s=>s.levels[1]=15,s=>delete s.quests,
s=>s.chests.push({id:'bad',kind:'garbage',seed:1}),s=>s.move=99
]){const s=M.fresh(T);change(s);assert.throws(()=>M.restore(JSON.stringify(s),T))}
});

test('mid-battle save resumes identical deterministic next shot',()=>{
const s=M.fresh(T);M.startBattle(s,T);M.attack(s);const resumed=M.restore(JSON.stringify(s),T);
assert.deepEqual(M.attack(s),M.attack(resumed));assert.deepEqual(s.battle,resumed.battle);
});
test('only the hit section wears and repairs use its material',()=>{
const s=rich();M.equip(s,'plating','iron',0);M.equip(s,'plating','hardwood',1);M.equip(s,'canvas','heavy');
const b=M.startBattle(s,T);b.phase='enemy';b.rng=1;
const before=clone(b.player.plates);const e={hit:M.impactDamage(b.player,{kind:'hull',index:0},46,{bonus:'hull'})>0};
assert.ok(e.hit);assert.ok(b.player.plates[0].durability<100);assert.equal(b.player.plates[1].durability,before[1].durability);assert.equal(b.player.canvasDurability,100);
b.phase='result';b.won=false;M.settle(s,T);const rc=M.repairCost(s);
assert.ok(rc.metal>0);assert.equal(rc.wood,undefined);assert.equal(rc.cloth,undefined);
const gold=s.gold;assert.ok(M.repair(s));assert.equal(s.gold,gold);assert.equal(M.repair(s),false);
});
test('equipment section count follows ship level',()=>{
const s=rich();const before=clone(s);assert.equal(M.equip(s,'plating','iron',3),false);assert.deepEqual(s,before);
assert.ok(M.equip(s,'plating','iron',2));assert.equal(s.plates[0].kind,'bare');
});
test('figureheads upgrade permanently at source prices',()=>{
const s=rich();assert.ok(M.figure(s,1));const gold=s.gold;
assert.ok(M.upgradeFigure(s,1));assert.equal(s.gold,gold-M.E.FIG_UPGRADE.gold[0]);assert.equal(s.figureheads[1],2);
assert.ok(M.upgradeFigure(s,1));assert.ok(M.upgradeFigure(s,1));assert.equal(M.upgradeFigure(s,1),false);
});
test('offers cap at three with real expiry and seven-day cooldown',()=>{
const s=M.fresh(T);s.offerQueue=[0,1,2,3].map((bundle)=>({key:'q'+bundle,bundle,category:'bundle-'+bundle,created:T}));
assert.equal(M.offers(s,T).length,3);assert.ok(M.declineOffer(s,'q0',T));assert.equal(M.offers(s,T).length,3);
assert.equal(s.declined['bundle-0'],T+7*86400000);
assert.equal(M.offers(s,T+2*3600000).length,0);assert.equal(s.deals.q1,undefined);
});
test('losses do not trigger store offers and fifth chest grants gems once',()=>{
const s=M.fresh(T);let b=M.startBattle(s,T);b.phase='result';b.won=false;M.settle(s,T);assert.equal(s.offerQueue.length,0);
s.chestRun=4;s.dailyChests=4;b=M.startBattle(s,T+1);b.phase='result';b.won=true;
const gems=s.gems;M.settle(s,T+1);assert.equal(s.gems,gems+M.E.GEMS.fifthChest);assert.equal(s.offerQueue[0].bundle,1);
M.settle(s,T+1);assert.equal(s.gems,gems+M.E.GEMS.fifthChest);
});
test('crew hit geometry ignores empty sky and sea',()=>{
assert.equal(M.aimedTarget(2,0),null);assert.equal(M.aimedTarget(0,-1),null);
assert.equal(M.aimedTarget(0,.4),'crew');assert.equal(M.aimedTarget(0,1.2),'sails');assert.equal(M.aimedTarget(0,0),'hull');
});

test('turn timeout yields once and enemy resolution resets clock',()=>{const s=M.fresh(T);const b=M.startBattle(s,T);assert.equal(M.elapse(s,29),false);assert.equal(b.seconds,1);assert.equal(M.elapse(s,1),true);assert.equal(b.phase,'enemy');assert.equal(M.elapse(s,1),false);M.enemyTurn(s);assert.equal(b.seconds,30);assert.equal(b.phase,'player');});
