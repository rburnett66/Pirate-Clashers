// A year in the life of three kinds of player. Cards land on a SPECIFIC gunner,
// which is what makes one particular pirate slow even when cards are plentiful.
const E = require('./econ.js');
const FREE_CLEARS_PER_WEEK = Number(process.env.FREE_CLEARS ?? 7);   // one a day
const SLOTS = Number(process.env.SLOTS ?? 1);            // benches at the gunsmith
const SKIPS = process.env.SKIPS !== '0';                  // will the captain spend gems on time
const GEM_SKIP_BUDGET = Number(process.env.SKIP_BUDGET ?? 25);   // most gems they will spend on one skip
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

// The roster, by the same rule the crew screen uses.
const ROSTER = [];
for (let id = 1; id <= 36; id++) {
  const statusy = id % 3 === 0 || id % 5 === 0;
  ROSTER.push({ id, rarity: id % 12 === 0 ? 'legendary' : (statusy && id % 3 === 0) ? 'epic'
                       : (statusy || id % 4 === 0) ? 'rare' : 'common' });
}
const BY_RARITY = {};
for (const g of ROSTER) (BY_RARITY[g.rarity] ||= []).push(g);

function simulate(label, matchesPerWeek, winRate, portMoveChance, weeks = 52, seed = 7, watchesPromos = true) {
  const rand = rng(seed);
  const cards = {}, level = {};
  for (const g of ROSTER) { cards[g.id] = 0; level[g.id] = 1; }
  const st = { gold: 0, mats: { wood:0, metal:0, cloth:0 }, stock: { ...E.SHOP_STOCK }, shipLevel: 1,
               slots: 0, promosWatched: 0, chestsLost: 0,
               gems: 0, moves: 0, portsReached: 1, gemsOnTime: 0, skips: 0, benchUsed: 0 };
  const reached = {};
  let chestCards = 0, goldOnGuns = 0, goldOnMats = 0, traded = 0;

  for (let w = 1; w <= weeks; w++) {
    st.freeClears = FREE_CLEARS_PER_WEEK;                   // the cap clears on its own too
    for (let m = 0; m < matchesPerWeek; m++) {
      if (rand() >= winRate) { st.gold += E.MATCH.gold * E.MATCH.lossShare; continue; }  // a loss pays a third
      st.gold += E.MATCH.gold;
      // The bonus chest goes into one of five slots. Full slots mean the chest is
      // lost, unless the captain clears the cap by watching the Pirate Pass promo.
      if (st.slots >= E.CHEST_CAP) {
        // The cap clears on its own a set number of times a day, and the promo
        // clears it again on demand. Without the free clears, a captain who will
        // not watch a promo is locked out of the card economy entirely.
        if (st.freeClears > 0) { st.slots = 0; st.freeClears--; }
        else if (watchesPromos) { st.slots = 0; st.promosWatched++; }
        else { st.chestsLost++; continue; }
      }
      st.slots++;
      if (st.slots === E.CHEST_CAP) st.gems += E.GEMS.fifthChest;   // the chest that fills the run
      let roll = rand(), acc = 0, kind = 'wooden';
      for (const [k, p] of Object.entries(E.BONUS_ODDS)) { acc += p; if (roll < acc) { kind = k; break; } }
      const c = E.CHESTS[kind];
      st.gold += c.gold;
      for (let k = 0; k < c.cards; k++) {
        let rr = rand(), a2 = 0, picked = 'common';
        for (const [rar, p] of Object.entries(c.odds)) { a2 += p; if (rr < a2) { picked = rar; break; } }
        const pool = BY_RARITY[picked];
        cards[pool[Math.floor(rand() * pool.length)].id]++;
        chestCards++;
      }
    }
    if (rand() < portMoveChance) {
      for (const k of Object.keys(E.TRAVEL_HAUL)) st.mats[k] += E.TRAVEL_HAUL[k];
      st.stock = { ...E.SHOP_STOCK };                        // a new market to trade in
      // Gems only for ground never covered before, so there are 14 of these ever.
      if (st.portsReached < 15) { st.portsReached++; st.gems += E.GEMS.newPort; }
    } else {
      for (const k of Object.keys(E.LOCAL_HAUL)) st.mats[k] += E.LOCAL_HAUL[k];
    }

    // The gunsmith works a bench: 168 hours a week per slot, and no more. Cheapest
    // job first, so the bench turns over as often as possible.
    let benchHours = 168 * SLOTS;
    for (;;) {
      const options = ROSTER.filter((g) => level[g.id] < 12
        && cards[g.id] >= E.CARDS[g.rarity][level[g.id] - 1]
        && st.gold >= E.GOLD[level[g.id] - 1]);
      if (!options.length) break;
      options.sort((a, b) => E.HOURS[level[a.id]-1] - E.HOURS[level[b.id]-1]);
      const g = options[0];
      const hours = E.HOURS[level[g.id] - 1];
      if (hours > benchHours) {
        // The bench is busy for the rest of the week. Gems can buy the clock off,
        // but they are the same gems the finishing moves want.
        const cost = E.SKIP_GEMS(hours - benchHours);
        if (!SKIPS || st.gems < cost || cost > GEM_SKIP_BUDGET) break;
        st.gems -= cost; st.gemsOnTime += cost; st.skips++;
      }
      benchHours = Math.max(0, benchHours - hours);
      cards[g.id] -= E.CARDS[g.rarity][level[g.id] - 1];
      st.gold -= E.GOLD[level[g.id] - 1];
      goldOnGuns += E.GOLD[level[g.id] - 1];
      st.benchUsed += hours;
      level[g.id]++;
      const key = `${g.rarity}12`;
      if (level[g.id] === 12 && !reached[key]) reached[key] = w;
    }

    // Finishing moves, cheapest first.
    while (st.moves < E.MOVES.length && st.gems >= E.MOVES[st.moves].gems) {
      st.gems -= E.MOVES[st.moves].gems;
      st.moves++;
      if (!reached[`move${st.moves}`]) reached[`move${st.moves}`] = w;
    }

    // Ship: buy what the port has on the shelf, then upgrade when the pile is enough.
    while (st.shipLevel < 8) {
      const need = E.SHIP[st.shipLevel - 1];
      const short = Object.keys(need).filter((k) => st.mats[k] < need[k]);
      if (!short.length) {
        for (const k of Object.keys(need)) st.mats[k] -= need[k];
        st.shipLevel++;
        if (!reached[`ship${st.shipLevel}`]) reached[`ship${st.shipLevel}`] = w;
        continue;
      }
      // Trade surplus for what is short, at this port's rate and for a fee.
      const k = short[0];
      const from = Object.keys(need).find((o) => o !== k && st.mats[o] > need[o] * 1.15);
      if (!from) break;
      const rate = E.RATES[from][k];                        // units of `from` per unit of `k`
      const want = Math.min(need[k] - st.mats[k], st.stock[k],
                            Math.floor((st.mats[from] - need[from]) / rate),
                            Math.floor(st.gold / E.SHOP.fee));
      if (want <= 0) break;
      st.mats[k] += want; st.mats[from] -= Math.ceil(want * rate); st.stock[k] -= want;
      st.gold -= want * E.SHOP.fee; goldOnMats += want * E.SHOP.fee; traded += want;
    }
  }
  const levels = ROSTER.map((g) => level[g.id]);
  return { label, st, reached, levels, chestCards, goldOnGuns, goldOnMats, traded,
           promos: st.promosWatched, lost: st.chestsLost, weeks,
           maxed: levels.filter((l) => l === 12).length,
           avg: (levels.reduce((a,b)=>a+b,0) / levels.length) };
}

const RUNS = [
  ['casual   (10/wk, 45% wins)', 10, 0.45, 0.20],
  ['regular  (35/wk, 50% wins)', 35, 0.50, 0.55],
  ['grinder  (90/wk, 55% wins)', 90, 0.55, 0.95],
];
const fmt = (r, k) => (r.reached[k] ? `wk ${String(r.reached[k]).padStart(2)}` : '  —  ');
const rows = RUNS.map(([l,m,w,p]) => simulate(l,m,w,p));

console.log('One year. A dash means it did not happen inside the year.\n');
console.log('player                        ship 4  ship 6  ship 8   first maxed gun');
for (const r of rows) {
  const first = ['common12','rare12','epic12','legendary12'].filter(k=>r.reached[k])
    .sort((a,b)=>r.reached[a]-r.reached[b])[0];
  console.log(`${r.label.padEnd(28)} ${fmt(r,'ship4')} ${fmt(r,'ship6')} ${fmt(r,'ship8')}   `
    + (first ? `${first.replace('12','')} at ${fmt(r,first).trim()}` : 'none'));
}
console.log('\nafter 52 weeks:');
for (const r of rows) {
  const dist = [1,2,3,4,5,6,7,8,9,10,11,12].map(l => r.levels.filter(x=>x===l).length);
  console.log(`  ${r.label.padEnd(28)} ship ${r.st.shipLevel}   guns maxed ${String(r.maxed).padStart(2)}/36   `
    + `average gun level ${r.avg.toFixed(1)}   gold left ${Math.round(r.st.gold).toLocaleString()}`);
  console.log(`      gun levels 1..12: ${dist.join(' ')}`);
  console.log(`      gold spent: ${Math.round(r.goldOnGuns).toLocaleString()} on guns, `
    + `${Math.round(r.goldOnMats).toLocaleString()} in fees at the Trade Shop`);
  console.log(`      traded for ${r.traded.toLocaleString()} units of the material they were short of`);
  console.log(`      materials left over: ` + Object.entries(r.st.mats).map(([k,v])=>`${k} ${Math.round(v)}`).join(', '));
}

// How much each lever is worth, holding everything else fixed.
console.log('\nFinishing moves, bought with gems:');
console.log('player                        move 1  move 2  move 3  move 4  move 5  move 6   gems a week');
for (const r2 of rows) {
  const perWeek = (r2.st.gems + E.MOVES.slice(0, r2.st.moves).reduce((a,b)=>a+b.gems,0)) / 52;
  console.log(`${r2.label.padEnd(28)} ${fmt(r2,'move1')} ${fmt(r2,'move2')} ${fmt(r2,'move3')} `
    + `${fmt(r2,'move4')} ${fmt(r2,'move5')} ${fmt(r2,'move6')}   ${perWeek.toFixed(1)}`);
}

console.log('\nThe promo gate — how often the cap is reached, and what it is worth:');
for (const [l,m,w,p] of RUNS) {
  const on = simulate(l,m,w,p), off = simulate(l,m,w,p,52,7,false);
  console.log(`  ${l.padEnd(28)} ${(on.promos/52).toFixed(1).padStart(5)} promos a week   `
    + `never watching: ${off.lost.toLocaleString()} chests lost in the year, `
    + `average gun level ${off.avg.toFixed(1)} instead of ${on.avg.toFixed(1)}`);
}

console.log('\nSensitivity, 35 matches a week for a year:');
const base = simulate('base', 35, 0.50, 0.55);
const cases = [
  ['win rate 40%', () => simulate('x', 35, 0.40, 0.55)],
  ['win rate 50%', () => base],
  ['win rate 60%', () => simulate('x', 35, 0.60, 0.55)],
  ['never moves port', () => simulate('x', 35, 0.50, 0.0)],
  ['moves port every week', () => simulate('x', 35, 0.50, 1.0)],
  ['double the matches', () => simulate('x', 70, 0.50, 0.55)],
];
for (const [label, fn] of cases) {
  const r = fn();
  console.log(`  ${label.padEnd(22)} ship ${r.st.shipLevel}   average gun level ${r.avg.toFixed(1)}   `
    + `maxed ${String(r.maxed).padStart(2)}/36   moves ${r.st.moves}/6   `
    + `bench used ${(r.st.benchUsed/24).toFixed(0)}d, ${r.st.skips} skips for ${r.st.gemsOnTime} gems`);
}
