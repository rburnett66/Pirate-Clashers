// ---------------------------------------------------------------------------
// The economy, as numbers. Two loops that barely touch: matches feed characters,
// travel feeds the ship. Everything here is tunable in one place.
// ---------------------------------------------------------------------------

// Cards needed to take a gun from level N to N+1. Escalating, and steeper for
// rarer gunners because their cards drop far less often.
const CARDS = {
  common:    [2, 4, 8, 14, 24, 40, 65, 100, 150, 220, 320],
  rare:      [2, 3, 6, 10, 18, 30, 48, 75, 115, 170, 250],
  epic:      [1, 2, 4,  7, 12, 20, 32, 50,  78, 118, 175],
  legendary: [1, 1, 2,  4,  7, 12, 20, 32,  50,  76, 115],
};
// The gunsmith also needs TIME, and the work grows with the level. Hours to take a
// gun from level N to N+1. One gun is about 12 days of shop time end to end, so a
// full roster is far more shop time than a year holds: the clock, not the cards,
// is what finally binds.
const HOURS = [0.08, 0.25, 0.75, 2, 5, 10, 20, 32, 48, 72, 96];
// Gems buy the clock off at a flat ten an hour. A flat rate is worth more than a
// clever curve here: a captain can read the price off the clock without doing sums,
// and the same rule holds whether they are clearing five minutes or four days.
const GEMS_PER_HOUR = 10;
const SKIP_GEMS = (hoursLeft) => Math.max(1, Math.ceil(hoursLeft * GEMS_PER_HOUR));

// Gold to pay the gunsmith, the same curve for everyone: the card is the scarce
// part, the gold is the drain that keeps every other faucet meaningful.
const GOLD = [60, 120, 250, 450, 800, 1400, 2400, 4000, 6500, 10000, 15000];

const RARITY_SHARE = { common: 14/36, rare: 10/36, epic: 9/36, legendary: 3/36 };

// Chests. A chest is a number of cards and the odds of each card's rarity.
const CHESTS = {
  wooden: { cards: 6,  gold:  120, odds: { common: 0.80, rare: 0.18, epic: 0.02,  legendary: 0.000 } },
  iron:   { cards: 14, gold:  340, odds: { common: 0.62, rare: 0.29, epic: 0.085, legendary: 0.005 } },
  gold:   { cards: 32, gold:  900, odds: { common: 0.48, rare: 0.34, epic: 0.155, legendary: 0.025 } },
  captain:{ cards: 70, gold: 2400, odds: { common: 0.34, rare: 0.38, epic: 0.235, legendary: 0.045 } },
};
// What a match pays. Doubled on a win.
// A match pays gold. Losing pays a THIRD of it and nothing else: no chest, no
// bonus. Winning pays in full and drops one bonus chest.
const MATCH = { gold: 145, lossShare: 1 / 3 };
const CHEST_ORDER = ['wooden', 'iron', 'gold', 'captain'];
// Which chest a win drops.
const BONUS_ODDS = { wooden: 0.62, iron: 0.27, gold: 0.09, captain: 0.02 };
// You can hold five bonus chests. Once they are full, further wins drop nothing
// until the cap is reset by watching a promo for the Pirate Pass — a house ad, so
// the real yield is a guaranteed pass impression every five wins, not ad revenue.
const CHEST_CAP = 5;

// ---------------------------------------------------------------------------
// Gems buy finishing moves and nothing else. There are exactly two ways to get
// them, and both are events rather than a trickle: reaching a port you have never
// reached before, and the fifth chest of a run — the one that fills the cap.
// Reaching a port pays ONCE. Falling back and climbing again pays nothing, or the
// ladder becomes a gem farm.
// ---------------------------------------------------------------------------
const GEMS = { newPort: 25, fifthChest: 3 };
// ---------------------------------------------------------------------------
// What gold buys, and what gems buy. Gems are purchasable, so every gem sink is a
// reason to open the store; gold sinks keep playing worth something on its own.
// ---------------------------------------------------------------------------
// Custom sails: cosmetic, gold only, so a free captain can always look the part.
const SAILS = [400, 900, 1800, 3200, 5500, 9000];

// Ship enhancements: four systems, five grades each. Gold for the work, gems for
// the parts, which is what makes them a steady gem sink rather than a one-off.
const ENHANCEMENTS = {
  'Hull plating': { effect: 'defence' },
  'Rigging':      { effect: 'movement' },
  'Gun mounts':   { effect: 'attack' },
  'Powder store': { effect: 'attack' },
};
const ENH_GOLD = [1200, 2800, 6000, 12000, 22000];
const ENH_GEMS = [  15,   35,   70,   130,   240];

// Figureheads: one fitted at a time, each with its own bias. Gold and gems to buy,
// gold and gems to upgrade, which is the deepest gem sink in the game.
const FIGUREHEADS = [
  { name: 'Sea Hound',   bias: 'movement', gold:  2500, gems:  60 },
  { name: 'Iron Ram',    bias: 'attack',   gold:  4000, gems: 110 },
  { name: 'Turtle',      bias: 'defence',  gold:  4000, gems: 110 },
  { name: 'Storm Petrel',bias: 'movement', gold:  7500, gems: 220 },
  { name: 'Kraken Maw',  bias: 'attack',   gold: 12000, gems: 380 },
  { name: 'Leviathan',   bias: 'all three',gold: 20000, gems: 650 },
];
const FIG_UPGRADE = { gold: [3000, 7000, 15000], gems: [45, 95, 190] };   // three grades each

const MOVES = [
  { name: 'Shark Strike',  hits: 'One gunner',   gems:  40 },
  { name: 'Kraken Haul',   hits: 'Sails',        gems:  75 },
  { name: 'Whale Breach',  hits: 'Hull',         gems: 125 },
  { name: 'Storm Bolt',    hits: 'A mast',       gems: 190 },
  { name: 'Swordfish Run', hits: 'Sails',        gems: 270 },
  { name: 'Gull Swarm',    hits: 'Deck gunners', gems: 400 },
];

// Ship upgrades want materials, not gold. Level N to N+1, for levels 1..7.
// The ship is the fast half of the game: it should be impressive within weeks and
// finished within a couple of months. The long game is the 36 gunners, not the hull.
const SHIP = [
  { wood:   50, metal:   12, cloth:   20 },
  { wood:  120, metal:   40, cloth:   55 },
  { wood:  260, metal:  100, cloth:  115 },
  { wood:  520, metal:  220, cloth:  240 },
  { wood:  950, metal:  440, cloth:  420 },
  { wood: 1600, metal:  800, cloth:  740 },
  { wood: 2600, metal: 1400, cloth: 1200 },
];
// The Trade Shop sells materials for gold, and a port's stock is cheap in what it
// makes and dear in what it imports. Moving to a new port is the point: a fresh
// market restocks, and the first buy of the week there is the cheap one.
// The Trade Shop trades, it does not retail. Gold cannot buy a ship: what a port
// offers is an exchange, turning the surplus you sailed in with into the material
// you are short of, at that port's rate and for a small fee in gold.
// A haul is wood-heavy and a ship wants metal, so the exchange is the bridge.
const SHOP = { fee: 12 };                                // gold per unit received
const RATES = {                                          // units given up per unit received
  wood:  { metal: 0.35, cloth: 0.55 },
  metal: { wood: 3.1,   cloth: 2.0  },
  cloth: { wood: 2.0,   metal: 0.62 },
};
// What a port will exchange in a week. Arriving somewhere new restocks it, which is
// what makes moving between cities the thing that actually builds a ship.
const SHOP_STOCK = { wood: 500, metal: 220, cloth: 260 };
const TRAVEL_HAUL = { wood: 420, metal: 190, cloth: 230 };
// A captain who finishes mid-table all season never changes port, and without this
// they could never upgrade a ship at all: fewer guns, more losses, never promoted.
// Working your own harbour pays something; sailing somewhere new pays far more.
const LOCAL_HAUL = { wood: 95, metal: 40, cloth: 52 };

function playWeek(st, matchesPerWeek, winRate, movedPort, rand) {
  let cards = { common: 0, rare: 0, epic: 0, legendary: 0 };
  for (let m = 0; m < matchesPerWeek; m++) {
    const won = rand() < winRate;
    const mult = won ? 2 : 1;
    st.gold += MATCH.gold * mult;
    for (const [kind, chance] of Object.entries(MATCH.chestChance)) {
      if (rand() < chance * mult) {
        const c = CHESTS[kind];
        st.gold += c.gold;
        for (let k = 0; k < c.cards; k++) {
          const r = rand();
          let acc = 0, picked = 'common';
          for (const [rar, p] of Object.entries(c.odds)) { acc += p; if (r < acc) { picked = rar; break; } }
          cards[picked]++;
        }
      }
    }
  }
  // Cards land on a random gunner of that rarity, which is what makes a specific
  // gunner slow even when cards are plentiful.
  for (const [rar, n] of Object.entries(cards)) st.cards[rar] += n;
  if (movedPort) {
    for (const k of Object.keys(TRAVEL_HAUL)) st.mats[k] += TRAVEL_HAUL[k];
    st.stock = { ...SHOP_STOCK };                        // a fresh market to buy from
  }
  return cards;
}

module.exports = { CARDS, HOURS, SKIP_GEMS, GEMS_PER_HOUR, GOLD, SAILS, ENHANCEMENTS, ENH_GOLD, ENH_GEMS, FIGUREHEADS, FIG_UPGRADE, CHESTS, CHEST_ORDER, BONUS_ODDS, CHEST_CAP, GEMS, MOVES, MATCH, SHIP, SHOP, RATES, SHOP_STOCK, TRAVEL_HAUL, LOCAL_HAUL, RARITY_SHARE, playWeek };
