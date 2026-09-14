// The gem ladder. The base rate is 100 gems a dollar and the discount climbs to 25%
// at the top, which is what keeps the $19.99 tier at the 2,400 gems the four-day
// skip and the finishing-move set were priced against.
const BASE_RATE = 100;                       // gems per dollar at no discount
const PACKS = [
  { name: 'Handful',   price:  0.99, discount: 0.00 },
  { name: 'Pouch',     price:  4.99, discount: 0.10 },
  { name: 'Strongbox', price:  9.99, discount: 0.15 },
  { name: 'Chest',     price: 19.99, discount: 0.20 },
  { name: 'Hoard',     price: 49.99, discount: 0.22 },
  { name: "King's Ransom", price: 99.99, discount: 0.25 },
];
const round = (g) => g >= 1000 ? Math.round(g / 50) * 50 : Math.round(g / 10) * 10;
for (const p of PACKS) {
  p.gems = round(p.price * BASE_RATE * (1 + p.discount));
  p.rate = p.gems / p.price;
}
module.exports = { PACKS, BASE_RATE };

// Themed bundles: gems plus the things gems cannot buy, at a headline discount on
// the whole basket. These are the offers that follow a moment — a mast just came
// down, a new port just opened — rather than sitting in a shop forever.
const REFERENCE = { gemPerDollar: 120, goldPerGem: 34, matPerGem: 2.6 };  // what each is worth in the mid pack
// Contents are sized so the saving lands in the same 10 to 25 per cent band as the
// gem ladder, deepest at the top. A bundle that saves half is not a better offer,
// it is a smaller number written on a bigger box, and it teaches captains to wait.
const BUNDLES = [
  { name: 'Shipwright\'s Order', price:  4.99, discount: 0.10, gems:  300, gold:  8000, mats:  340, cards:   0, when: 'after a ship upgrade' },
  { name: 'Gunner\'s Kit',       price:  9.99, discount: 0.15, gems:  700, gold: 14000, mats:    0, cards: 100, when: 'when a chest run fills' },
  { name: 'New Horizons',        price: 19.99, discount: 0.20, gems: 1400, gold: 30000, mats: 1860, cards:   0, when: 'on reaching a new port' },
  { name: 'Captain\'s Fortune',  price: 49.99, discount: 0.25, gems: 4000, gold: 70000, mats: 2400, cards: 340, when: 'season opening' },
];
module.exports.BUNDLES = BUNDLES;
module.exports.REFERENCE = REFERENCE;
