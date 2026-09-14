// A rematch is not a fresh match: the challenger just lost, so without help they
// would mostly lose again. The opponent fights the rematch at reduced accuracy.
const { rng, makePlayer, loadout } = require('./sim.js');
let PENALTY = 0.20;
let LEARNING = 0;   // what the challenger takes from having already seen this ship

function match(a, b, rand, penaltyOn = null, ROUNDS = 24) {
  const side = (p, key) => {
    const guns = loadout(p);
    return { p, key, guns, hull: 300 + p.shipLevel * 55, sails: 100, crew: guns.length * 34, turn: 0 };
  };
  const A = side(a, 'A'), B = side(b, 'B');
  const beaten = (s) => s.hull <= 0 || s.crew <= 0;
  const order = rand() < 0.5 ? [[A, B], [B, A]] : [[B, A], [A, B]];   // toss for the first shot
  for (let round = 0; round < ROUNDS; round++) {
    for (const [att, def] of order) {
      if (beaten(A) || beaten(B)) break;
      const shaken = att.key === penaltyOn ? (1 - PENALTY) : 1;
      const working = Math.max(1, Math.round(att.guns.length * Math.max(0, att.crew) / (att.guns.length * 34)));
      for (let g = 0; g < working; g++) {
        const pick = att.guns[(att.turn + g) % att.guns.length];
        const steadiness = 0.72 + 0.28 * Math.max(0, att.sails) / 100;
        if (rand() > pick.o.accuracy * steadiness * shaken) continue;
        // A challenger has fought this ship once: they know which ports are manned,
        // where the plating is thin and which way the enemy aims. That shows up as
        // shots landing where they were meant to, not as better shooting.
        const learned = (penaltyOn && att.key === 'A') ? LEARNING : 0;
        const onTarget = rand() < 0.45 + pick.o.aim * 0.5 + learned;
        const kind = onTarget ? pick.s.primary : (rand() < 0.5 ? 'hull' : rand() < 0.5 ? 'sails' : 'crew');
        const dmg = pick.s.damage * pick.s.rate * (onTarget ? 1 : 0.45);
        if (kind === 'hull') def.hull -= dmg;
        else if (kind === 'sails') def.sails -= dmg * 0.55;
        else def.crew -= dmg * 0.5;
      }
      att.turn++;
    }
    if (beaten(A) || beaten(B)) break;
  }
  if (beaten(B)) return 'A';
  if (beaten(A)) return 'B';
  return A.hull > B.hull ? 'A' : 'B';
}

const rand = rng(9001);
const pool = Array.from({ length: 600 }, (_, i) => makePlayer(i, rand)).filter(p => p.shipLevel >= 3);

// Play a first match, then the rematch between the same two, with the winner shaken.
function study(penalty) {
  let rematchWins = 0, n = 0;
  for (let i = 0; i < 12000; i++) {
    const a = pool[i % pool.length], b = pool[(i * 13 + 5) % pool.length];
    if (a === b) continue;
    const first = match(a, b, rand);
    const challenger = first === 'A' ? b : a;          // the loser demands the rematch
    const opponent  = first === 'A' ? a : b;
    // The challenger is side A in the rematch; the opponent carries the penalty.
    const second = match(challenger, opponent, rand, penalty ? 'B' : null);
    if (second === 'A') rematchWins++;
    n++;
  }
  return rematchWins / n;
}
const plain = study(false);
console.log('At the chosen 20% penalty, with the challenger learning from fight one:\n');
for (const L of [0, 0.05, 0.10, 0.15, 0.20]) {
  PENALTY = 0.20; LEARNING = L;
  const r = study(true);
  console.log(`  opponent -20%, challenger aims ${(L*100).toFixed(0).padStart(2)} points better   `
    + `challenger wins ${(r*100).toFixed(1).padStart(5)}%`);
}
LEARNING = 0;
PENALTY = 0.20;
const shaken = study(true);
console.log('The challenger is whoever lost the first fight, so they are the weaker side.\n');
console.log(`  rematch with no penalty:           challenger wins ${(plain * 100).toFixed(1)}%`);
console.log(`  rematch with the opponent at -20%: challenger wins ${(shaken * 100).toFixed(1)}%`);
console.log(`  the penalty is worth ${((shaken - plain) * 100).toFixed(1)} points`);

console.log('\nWhat that does to a week, at 65% acceptance:\n');
console.log('win rate  matches  rematches  wins before  wins after  change');
for (const [w, n] of [[0.40, 35], [0.50, 35], [0.60, 35]]) {
  const extra = n * (1 - w) * 0.65;
  const before = n * w;
  const after = before + extra * shaken;
  console.log(`  ${(w*100).toFixed(0)}%      ${String(n).padStart(4)}   ${extra.toFixed(1).padStart(7)}   `
    + `${before.toFixed(1).padStart(9)}   ${after.toFixed(1).padStart(9)}   +${((after/before-1)*100).toFixed(0)}%`);
}
