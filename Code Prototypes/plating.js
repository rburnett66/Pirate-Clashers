// What hull plating is worth in a real match. Shots land on whichever section they
// hit, so a hull's protection is the average across its sections — which is what
// makes plating some of them, and choosing which, a decision.
const { rng, makePlayer, loadout } = require('./sim.js');

const SECTIONS = 8;
const PROTECT = { bare: 0, hardwood: 0.20, iron: 0.30 };
// Sail upgrades work the same way on the other half of the ship: heavier cloth
// takes less damage, and since torn sails cost accuracy, canvas is a defence that
// protects the guns rather than the hull.
const CANVAS = { plain: 0, heavy: 0.20, storm: 0.30 };

const avgProtect = (plan) => plan.reduce((a, k) => a + PROTECT[k], 0) / SECTIONS;

// The same match maths as the ladder simulation, with one addition: hull damage is
// reduced by the section's protection. A shot lands on a random section, so over a
// match a hull behaves like its average.
function match(a, b, planA, planB, rand, ROUNDS = 24, canvasA = 'plain', canvasB = 'plain') {
  const cut = { A: avgProtect(planA), B: avgProtect(planB) };
  const canvas = { A: CANVAS[canvasA], B: CANVAS[canvasB] };
  const side = (p, key) => {
    const guns = loadout(p);
    return { guns, key, hull: 300 + p.shipLevel * 55, sails: 100, crew: guns.length * 34, turn: 0 };
  };
  const A = side(a, 'A'), B = side(b, 'B');
  const beaten = (s) => s.hull <= 0 || s.crew <= 0;
  // Whoever fires first has a real edge, so the first shot is tossed for. Without
  // this, two identical ships show a 70% win rate and every reading is skewed.
  const order = rand() < 0.5 ? [[A, B], [B, A]] : [[B, A], [A, B]];
  for (let round = 0; round < ROUNDS; round++) {
    for (const [att, def] of order) {
      if (beaten(A) || beaten(B)) break;
      const working = Math.max(1, Math.round(att.guns.length * Math.max(0, att.crew) / (att.guns.length * 34)));
      for (let g = 0; g < working; g++) {
        const pick = att.guns[(att.turn + g) % att.guns.length];
        const steadiness = 0.72 + 0.28 * Math.max(0, att.sails) / 100;
        if (rand() > pick.o.accuracy * steadiness) continue;
        const onTarget = rand() < 0.45 + pick.o.aim * 0.5;
        const kind = onTarget ? pick.s.primary : (rand() < 0.5 ? 'hull' : rand() < 0.5 ? 'sails' : 'crew');
        const dmg = pick.s.damage * pick.s.rate * (onTarget ? 1 : 0.45);
        if (kind === 'hull') def.hull -= dmg * (1 - cut[def.key]);   // plating bites here
        else if (kind === 'sails') def.sails -= dmg * 0.55 * (1 - canvas[def.key]);
        else def.crew -= dmg * 0.5;
      }
      att.turn++;
    }
    if (beaten(A) || beaten(B)) break;
  }
  if (beaten(A) && beaten(B)) return A.hull >= B.hull ? 1 : 0;
  if (beaten(B)) return 1;
  if (beaten(A)) return 0;
  return A.hull > B.hull ? 1 : 0;
}
const plan = (n, kind) => Array.from({ length: SECTIONS }, (_, i) => i < n ? kind : 'bare');

const rand = rng(4242);
const pool = Array.from({ length: 400 }, (_, i) => makePlayer(i, rand)).filter(p => p.shipLevel >= 4);

// Same captain on both sides, so the only difference is what is being tested.
function winRate(planA, planB, n = 6000, canvasA = 'plain', canvasB = 'plain') {
  let w = 0;
  for (let i = 0; i < n; i++) {
    const p = pool[i % pool.length];
    w += match(p, p, planA, planB, rand, 24, canvasA, canvasB);
  }
  return w / n;
}

console.log('Win rate for the first ship against the second, both otherwise matched.\n');
const cases = [
  ['bare', plan(0,'bare'), 'bare', plan(0,'bare')],
  ['all hardwood', plan(8,'hardwood'), 'bare', plan(0,'bare')],
  ['all iron', plan(8,'iron'), 'bare', plan(0,'bare')],
  ['all iron', plan(8,'iron'), 'all hardwood', plan(8,'hardwood')],
  ['half hardwood', plan(4,'hardwood'), 'bare', plan(0,'bare')],
  ['half iron', plan(4,'iron'), 'bare', plan(0,'bare')],
  ['all hardwood', plan(8,'hardwood'), 'half iron', plan(4,'iron')],
];
for (const [la, pa, lb, pb] of cases) {
  const r = winRate(pa, pb);
  const avgA = avgProtect(pa), avgB = avgProtect(pb);
  console.log(`  ${la.padEnd(14)} vs ${lb.padEnd(14)}  ${(r*100).toFixed(1).padStart(5)}%   `
    + `(hull protection ${(avgA*100).toFixed(0)}% vs ${(avgB*100).toFixed(0)}%)`);
}


console.log('\nSail upgrades, on an otherwise bare ship. Torn canvas costs accuracy,');
console.log('so heavier cloth defends the guns rather than the hull.\n');
const bare = plan(0, 'bare');
for (const [la, ca, lb, cb] of [
  ['plain', 'plain', 'plain', 'plain'],
  ['heavy canvas', 'heavy', 'plain', 'plain'],
  ['storm canvas', 'storm', 'plain', 'plain'],
  ['storm canvas', 'storm', 'heavy canvas', 'heavy'],
]) {
  const r = winRate(bare, bare, 6000, ca, cb);
  console.log(`  ${la.padEnd(14)} vs ${lb.padEnd(14)}  ${(r * 100).toFixed(1).padStart(5)}%`);
}
console.log('\nAnd both defences together against a bare ship:');
console.log(`  iron + storm   vs bare            ${(winRate(plan(8,'iron'), bare, 6000, 'storm', 'plain') * 100).toFixed(1)}%`);
