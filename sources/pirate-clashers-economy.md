# The economy

**Model:** `econ.js`, `run.js`, `store.js` and `plating.js` — the tables, the year-long simulation and the store ladder behind every number here
**Companions:** the crew, leaderboard and Pirate's Booty specs

---

## 1. Three loops, at three speeds

| | Feeds on | Pays for | Gated by | Pace |
|---|---|---|---|---|
| **The shipwright** | Sailing between ports | Ship levels, which are gun positions | Materials, mostly metal | **Weeks** |
| **The gunsmith** | Playing matches | Character gun levels | Cards for one pirate, and the bench clock | **Months to years** |
| **The deep** | Two rare events | Finishing moves | Gems | **A season each** |

The ship is deliberately the fast one: a heavy player has a fearsome ship inside a month and a finished one by week 16. Collecting and levelling 36 gunners is the long game, and the six finishing moves are the longest thread of all.

The first two are joined by one thing: **gold**, which both need and neither produces enough of. That is deliberate. A single shared currency between two otherwise separate loops is what makes a player choose, and it is what gives every other faucet — chests, the battle pass, match rewards — something to be worth.

The second loop is wired to the leaderboard: **travel is promotion and demotion**. A captain who moves port gets a full haul; one who finishes mid-table every week gets a much smaller one. So the ladder is not just a scoreboard, it is the ship's supply line.

---

## 2. Faucets and sinks

| Faucet | Gives |
|---|---|
| Losing a match | **A third of the gold. Nothing else.** |
| Winning a match | **Full gold, and one bonus chest** |
| Chests | Cards for specific pirates, plus gold |
| Changing port | A large haul of wood, metal and cloth, and a fresh market |
| Staying put | A small haul of the same |
| Pirate's Booty | Gold, gems, gunner cards along the season track |

| Sink | Takes |
|---|---|
| Gun upgrade | Cards for that pirate, escalating gold, and time at the bench |
| Skipping the bench clock | Gems |
| Ship upgrade | Wood, metal and cloth |
| Trade Shop | Gold as a fee on every exchange |

---

## 3. Cards, chests and the gunsmith

**A card belongs to a pirate, not to a rarity.** A chest rolls a rarity, then picks one of the pirates at that rarity. With 14 commons, 10 rares, 9 epics and 3 legendaries, a common card lands on the pirate you want one time in fourteen. That, not the drop rate, is what makes a *particular* gunner slow, and it is why players end up with a broad roster rather than one maxed favourite.

**Four chests.**

| Chest | Cards | Gold | Common | Rare | Epic | Legendary |
|---|---|---|---|---|---|---|
| Wooden | 6 | 120 | 80% | 18% | 2% | — |
| Iron | 14 | 340 | 62% | 29% | 8.5% | 0.5% |
| Gold | 32 | 900 | 48% | 34% | 15.5% | 2.5% |
| Captain's | 70 | 2,400 | 34% | 38% | 23.5% | 4.5% |

**Cards to take one gun from level 1 to 12:** 947 common, 727 rare, 499 epic, 320 legendary. Rarer pirates need fewer cards because their cards arrive far less often; the two curves are meant to roughly cancel, so a legendary is a little slower than a common rather than ten times slower.

**Gold is the same curve for everyone** — 60 at the first upgrade rising to 15,000 at the last, 40,980 to max one gun. The card is the scarce thing; the gold is the drain.

**One reconciliation.** The crew screen currently prices upgrades in premium coins. That was a placeholder. Upgrades cost **cards and gold**; premium coins are the skip — buying the cards you are short of — and that is the only place they touch this loop.

---

### 3a. Winning, losing, and the chest cap

**A loss pays a third of the gold and nothing else.** No chest, no bonus. A win pays in full and drops one bonus chest: usually wooden, occasionally better.

| Bonus chest | Wooden | Iron | Gold | Captain's |
|---|---|---|---|---|
| Chance on a win | 62% | 27% | 9% | 2% |

**Five chests can be held.** Beyond that, a win drops nothing until the cap clears. It clears **once a day on its own**, and a promo video for the Pirate Pass clears it again on demand.

**That free daily clear is not optional, and the simulation is blunt about why.** With the cap clearing *only* by promo, as first proposed, a captain who will not watch one is locked out of the card economy permanently: after five wins ever, they receive nothing. Over a year a regular player ends at an **average gun level of 1.7 instead of 8.9**, having lost 936 chests. That is not a monetisation nudge, it is a paywall with an ad in front of it, and it would fall hardest on exactly the players least likely to spend.

With one free clear a day, the shape is right:

| | Promos a week | Cost of refusing every one |
|---|---|---|
| Casual, 10 matches a week | 0.0 | nothing |
| Regular, 35 a week | 0.0 | nothing |
| Grinder, 90 a week | 2.8 | 10.7 instead of 11.4 average gun level |

Nobody is blocked, and the promo becomes what it should be: an accelerator for the player who has already run out of daily headroom.

**One thing this does not solve.** At a cap of five, only grinders ever see the promo, and grinders are the players most likely to own the Pirate Pass already. If the point of a house ad is conversion, it is reaching the wrong segment. Tightening the cap does not fix it either: at a cap of two, a regular player sees it 1.5 times a week but a grinder sees it **17 times a week**, which is nagging rather than promoting.

The better shape is to stop using the cap as the only trigger. Offer the promo as an **optional bonus on any chest** — watch to upgrade this wooden chest to iron — so every segment is offered it, nobody is blocked, and the impression reaches the players who have not bought the pass. The cap then does what a cap is for: stopping chests piling up unopened.

---

### 3a2. The gunsmith's clock

**An upgrade takes time, and the work grows with the level.** Five minutes at the bottom, four days at the top.

**Ten gems an hour, flat.** A flat rate is worth more here than a clever curve: a captain reads the price straight off the clock without doing sums, and the same rule holds whether they are clearing five minutes or four days.

| Level | 1→2 | 4→5 | 7→8 | 9→10 | 11→12 |
|---|---|---|---|---|---|
| Time | 5 min | 2 h | 20 h | 2 days | 4 days |
| Gems to skip | 1 | 20 | 200 | 480 | 960 |

One gun is **286 hours — about 12 days of shop time** end to end. The whole roster of 36 is 429 days on a single bench. That is more shop time than a year holds, which is the point: the clock is what finally makes the gunners the long game.

**Who actually feels it.** Measured over a year, the bench changes nothing for a casual or a regular player: they never earn enough cards to keep a single bench busy, so their year is identical with or without it. It bites only the heavy player, taking a grinder from **23 maxed guns to 8**. That is the right shape for a timer — a brake on the top end, invisible at the bottom.

One caveat the model cannot see: it measures throughput over a week, not the moment of standing in front of a four-day timer. That friction is real even for a player whose throughput is nowhere near the ceiling, and it is the thing the gem skip is actually selling.

**Benches matter far more than gems.** A second bench takes the grinder from 8 maxed guns to 24 — roughly a tripling. Buying time with gems, at the rate above, takes them from 8 to 10.

| Grinder, one year | Maxed guns | Finishing moves |
|---|---|---|
| One bench, no gems on time | 8 of 36 | 6 by week 26 |
| One bench, gems on short skips | 10 of 36 | 6 by week 33 |
| Two benches | 24 of 36 | 6 by week 26 |

### 3a3. Time is the gem engine

Gems are bought, so a gem sink is not a competitor for a fixed budget — it is a reason to open the store. Time is the best of them, because it renews: a gun bought to level 12 is bought once, but the wait in front of the next upgrade comes back every single time.

At ten an hour the cheap end stays an impulse — 1 to 8 gems clears anything under an hour — and the expensive end becomes a decision: 960 gems for the last upgrade, and **2,862 to take one gun from 1 to 12**. Skipping the whole roster would be 103,000 gems. The ceiling on skipping is nothing at all; it is the only sink in the game with no end.

**What that is in money.** At a mid-sized gem pack, a two-hour wait clears for about 17 cents, a four-day wait for about eight dollars — and every finishing move in the game costs about nine. Those two prices sitting side by side is the whole tension of the store, and it is worth pricing them deliberately rather than by accident: one purchase is gone in four days and the other is permanent. If the four-day skip is meant to be the everyday purchase and the moves the aspirational one, the moves should cost visibly more than one skipped afternoon.

**Benches are the other half of it.** A second bench takes a heavy player from 8 maxed guns to 24 over a year, where gem skips take them from 8 to 10. Sell the bench as a permanent gem unlock and the same player has a reason to spend once for something they feel forever, and a reason to keep spending on skips afterward. The two do not compete: more bench means more jobs running means more waits to skip.

---

### 3a4. What gold buys, and what gems buy

| | Gold | Gems |
|---|---|---|
| Ship levels | ✓ (plus materials — see below) | |
| Gunner upgrades | ✓ | |
| Speed: skipping the bench clock | | ✓ |
| Custom sails | ✓ | |
| Ship enhancements | ✓ | ✓ |
| Hull plating, hardwood | ✓ (plus wood) | |
| Hull plating, iron | ✓ (plus metal) | ✓ |
| Sail upgrade, heavy canvas | ✓ (plus cloth) | |
| Sail upgrade, storm canvas | ✓ (plus cloth) | ✓ |
| Repairing either, as they wear | | |
| Figureheads, and upgrading them | ✓ | ✓ |

**Custom sails are gold only and cosmetic** — sail art, not sailcloth — so a free captain can always look the part. They are a separate thing from the sail *upgrades* in §5a, which change how the ship handles and carry durability.

**Ship enhancements:** four systems — hull plating for defence, rigging for movement, gun mounts and powder store for attack — five grades each. Gold pays the yard, gems buy the parts. That split is what makes them a repeating gem sink rather than a one-off.

**Figureheads:** six, one fitted at a time, each biased toward movement, attack or defence, with the Leviathan favouring all three. Gold and gems to buy, gold and gems for each of three grades. It is the deepest gem sink in the game.

**What a complete account costs:**

| | Gold | Gems |
|---|---|---|
| Gunner upgrades, all 36 | 1,475,280 | — |
| Custom sails, all six | 20,800 | — |
| Ship enhancements, 4 × 5 | 176,000 | 1,960 |
| Figureheads, all six fully upgraded | 200,000 | 3,510 |
| Finishing moves, all six | — | 1,100 |
| **Total** | **1,872,080** | **6,570** |

Time skips sit on top and have no ceiling: skipping the gunsmith entirely would be 103,000 gems on its own, which is more than fifteen times everything else combined.

**The gap the store fills.** Against 6,570 gems of demand:

| | Gems earned a year | Share of a complete account | Years to finish free |
|---|---|---|---|
| Casual | 380 | 6% | 17 |
| Regular | 879 | 13% | 7.5 |
| Grinder | 1,638 | 25% | 4 |

Every captain is short, which is the design. What matters is that the free road still goes somewhere: in year one, earned gems alone buy a casual player **three finishing moves, a figurehead and the first grade on all four enhancements**. That is a real ship, not a teaser.

**One consequence worth naming once.** Figureheads and enhancements change movement, attack and defence, and gems are purchasable, so this sells power rather than only speed and cosmetics. The measurement from the leaderboard work says the ladder absorbs it: rating tracks equipment at 0.86, so a captain who buys a Leviathan climbs until they meet other captains with one. Position is games won, and nothing in the store buys games won. The thing to protect is exactly that — as long as no bundle sells wins, trophies or promotion, spending changes which port you settle in rather than whether the game is fair once you are there.

**A conflict to settle.** Ship levels were specified as wood, metal and cloth through the Trade Shop, and are now also specified as gold. The model keeps both — materials gate the upgrade, gold pays the shipwright — because the whole travel and Trade Shop loop exists to supply those materials. If ship levels are meant to be gold only, that loop loses its purpose and should be repointed at enhancements instead.

---

### 3b. Gems and the finishing moves

**Gems buy finishing moves and nothing else.** There are exactly two ways to get them, and both are events rather than a trickle:

| Source | Gems | Notes |
|---|---|---|
| Reaching a port you have never reached | 25 | **Once per port.** Fourteen of these exist, ever |
| The fifth chest of a run, the one that fills the cap | 3 | Renewable, and the only steady supply |

Making the port bonus a one-time thing is the whole design. If falling back to Puerto Rico and climbing again paid out, the ladder would become a gem farm and every other reason to climb would stop mattering. As written, sailing new water is worth 350 gems over a whole career, and after that the only supply is chest runs.

It also gives the chest cap a second job. The fifth chest is no longer just the one that stops the run; it is the one that pays.

| Move | Hits | Gems |
|---|---|---|
| Shark Strike | One gunner | 40 |
| Kraken Haul | Sails | 75 |
| Whale Breach | Hull | 125 |
| Storm Bolt | A mast | 190 |
| Swordfish Run | Sails | 270 |
| Gull Swarm | Deck gunners | 400 |

**Measured over a year:**

| | Move 1 | Move 2 | Move 3 | Move 4 | Move 5 | Move 6 | Gems a week |
|---|---|---|---|---|---|---|---|
| Casual | week 6 | week 16 | week 31 | — | — | — | 7.3 |
| Regular | week 2 | week 5 | week 12 | week 19 | week 35 | — | 16.9 |
| Grinder | week 1 | week 3 | week 5 | week 8 | week 14 | week 26 | 36.0 |

Everyone gets a finishing move early, which matters: it is the most memorable thing in the game and no player should be a month from seeing one. Nobody collects all six quickly. A casual player is on their third by the end of a year, which is a reason to still be playing.

**This also settles the Pirate's Booty question.** Finishing moves were on the paid track with no free path, which was the one line worth not crossing. Gems are that path: the pass sells **early access**, gems earn the same move eventually, and a player who never spends still collects. That is the position the Booty spec recommended, now with a mechanism behind it.

**Climbing is worth about a fifth of gem income.** A captain who never changes port still gets four moves in a year against five, since chest runs carry most of the load. Promotion is a meaningful bonus, not the only road.

---

## 4. Materials, travel and the Trade Shop

**A ship costs 6,100 wood, 3,000 metal and 2,800 cloth** to go from level 1 to 8. That is deliberately reachable: a heavy player has ship level 6 by week 5 and a full ship by week 16, a regular player a full ship by week 22, and a casual one by week 38. The hull is the part of the game that should feel like it is moving.

**Travel supplies it.** Arriving at a new port pays 420 wood, 190 metal and 230 cloth. Staying put pays about a quarter of that.

**The haul is the wrong shape on purpose.** It arrives at roughly 1 wood : 0.45 metal, and a ship wants 1 : 0.61. Every captain is wood-rich and metal-poor, always.

**So the Trade Shop trades — it does not retail.** Gold cannot buy a ship. What a port offers is an exchange: give up the surplus you sailed in with, take the material you are short of, at that port's rate and for a fee in gold. A port exchanges only so much in a week, and arriving somewhere new restocks it. That makes moving between cities worth it twice: the haul, and a fresh market to convert it in.

This is the part the name was already telling us. A shop that sells wood for gold is a general store, and in the first model it saw **45 gold of business in a year** because gold always went to the gunsmith instead. As an exchange it handles between 120 and 1,300 units a year depending on how much a captain sails.

---

## 5. A year, measured

Three players, 52 weeks, everything above running:

| | Ship 4 | Ship 6 | Ship 8 | Average gun level | Guns maxed | Moves |
|---|---|---|---|---|---|---|
| Casual — 10 matches a week, 45% wins | week 1 | week 12 | week 38 | 6.2 | 0 of 36 | 3 of 6 |
| Regular — 35 a week, 50% wins | week 1 | week 9 | week 22 | 8.9 | 0 of 36 | 5 of 6 |
| Grinder — 90 a week, 55% wins | week 1 | week 5 | week 16 | 11.4 | 23 of 36 | 6 of 6 |

The three loops finish at three different times, which is the point. Everyone has a ship worth looking at within a couple of months. Nobody has finished their gunners after a year — even the grinder is 13 guns short. Finishing moves sit in between: a season each.

Losing paying almost nothing pulled the gunner curves down by roughly a gun level and a half against the old doubling rule. That is a tighter economy and a healthier one: there is still somewhere to go at week 52.

A casual player spends a year getting a workmanlike ship and a roster in the sevens. A regular player ends the year one step off a full ship with most guns around ten. Only heavy play maxes anything, and maxing the whole roster takes about a year of it. Gold ends near zero for everyone except the player who has run out of things to buy.

**What each lever is worth**, at 35 matches a week:

| Change | Ship | Average gun level |
|---|---|---|
| Win rate 40% | 8 | 8.6 |
| Win rate 50% | 8 | 8.9 |
| Win rate 60% | 8 | 9.5 |
| Never changes port | 7 | 8.9, and 4 finishing moves instead of 5 |
| Changes port every week | 8 | 8.9 |

Volume is the strongest lever, which matches the leaderboard's decision to rank on games won. Winning is second. Travel moves the ship and nothing else, exactly as intended.

---

## 6. Four things the simulation caught

**The ship maxed far too fast.** In the first pass a casual player had a full ship by week 26 and a grinder by week 4 — and ship level is the biggest power step in the game, because it is gun positions. Ship costs went up about four times at the top end, and the shop stopped selling materials outright.

**Gold piled up and meant nothing.** A grinder ended the first year with 1.1 million gold. The cause was a modelling error worth keeping in mind: the first version fed only four favourite gunners. Once cards land on specific pirates across all 36, gold is spent almost as fast as it arrives, and every player but the fully-maxed one ends the year near zero. Gold is only scarce because the roster is wide.

**Winning barely mattered, and now it does.** Under the old doubling rule, a 40% and a 60% win rate were 0.2 of a gun level apart over a year, because doubling a small chance of a wooden chest is still a wooden chest. Paying a third on a loss and a guaranteed chest on a win widens that to 0.9 of a level. Winning is now the second strongest lever after volume, which is the right order for a game that ranks on games won.

**Never moving port was a death spiral.** With hauls only on a port change, a captain who finished mid-table every week was stuck at ship level 1 forever: fewer gun positions, more losses, never promoted, never any materials. A smaller haul for working your own harbour fixes it — they reach ship 6 instead of 1, while a captain who sails still gets to 8. Demotion counts as travel too; falling back to Puerto Rico is still a voyage.

---

## 5a. Durability: hull plating and sail upgrades

**Two things in the game have durability**: hull plating and sail upgrades. Both degrade under fire and are repaired with the material they were made from. Soft decay — the plate and the canvas never disappear, they just stop working until they are seen to.

This is what finally gives the three materials distinct jobs, instead of three names for the same pile:

| Material | Goes into | Why it is wanted again next week |
|---|---|---|
| Wood | Hardwood plating | Repairs after every bad match |
| Metal | Iron plating | Repairs, and it is the scarce one |
| Cloth | Sail upgrades | Sails tear in almost every match |

Nothing else has durability. Gunner levels, ship levels, figureheads and enhancements are permanent; the two things that take visible damage in a match are the two things that wear.

### Hull plating

A large hull has **eight sections**, each plated on its own. Two materials, two prices, two very different supply lines:

| | Protection | Costs | Where it comes from |
|---|---|---|---|
| Hardwood | 20% | 220 wood + 1,800 gold | The Trade Shop and travel — fully earnable |
| Iron plate | 30% | 140 metal + 3,000 gold + 25 gems | Metal is the scarce material, and gems are bought |

Smaller hulls carry fewer sections, so a large hull is both more to protect and more that can be protected.

**What it is actually worth.** Measured by running the match maths with the same captain on both sides, so the plating is the only difference:

| | Win rate |
|---|---|
| Bare against bare | 49.8% |
| All hardwood against bare | 54.9% |
| All iron against bare | 55.4% |
| **All iron against all hardwood** | **52.4%** |
| Half hardwood against bare | 52.9% |
| Half iron against bare | 54.1% |

A fully plated hull wins about 55% against a bare one: worth doing, not decisive. Plating is a partial defence because only about a third of shots go to the hull at all, and plenty of matches end on crew losses instead — which is what stops an armour meta forming.

**The important number is 52.4%.** Iron over hardwood is worth just 2.4 points, so the free material gets a captain almost the whole way. Gems buy the last sliver, not the advantage. That is the shape to protect: half a hull in iron (54.1%) and a whole hull in hardwood (54.9%) come out level, so the real decision is which material a captain happens to be rich in, not which one they paid for.

**A measurement note worth keeping.** The first run showed a bare hull beating a bare hull 70% of the time, because whichever side fired first always won more. Tossing for the first shot put the baseline back to 49.8%. Any future balance reading on this model needs that toss, or every number is five points of armour too generous.

### Sail upgrades

Canvas is the other half of it. Heavier cloth takes less damage, and because torn sails cost accuracy, **a sail upgrade defends the guns rather than the hull**.

| | Sail damage taken | Costs |
|---|---|---|
| Plain canvas | full | — |
| Heavy canvas | 20% less | cloth + gold |
| Storm canvas | 30% less | cloth + gold + gems |

Measured the same way, on an otherwise bare ship:

| | Win rate |
|---|---|
| Plain against plain | 50.7% |
| Heavy canvas against plain | 52.0% |
| Storm canvas against plain | 52.2% |
| Storm against heavy | 50.9% |

Canvas is worth about a third of what plating is worth, which is right: it is an indirect defence, protecting accuracy rather than the hull itself. And as with plating, the free tier takes almost all of it — storm over heavy is worth 0.9 of a point.

**Both together, iron plating and storm canvas against a bare ship: 58.0%.** That is the ceiling on what a fully outfitted hull is worth, and it is a good ceiling. A captain who has bought everything wins six times in ten against one who has bought nothing, which rewards the investment without deciding the match.

### Why durability matters here

As one-time purchases these are eight decisions and a few sails, and then the Trade Shop goes quiet for good. With durability they become a **repair sink**: wood, metal and cloth turn into recurring demand, travel keeps a permanent reason to exist, and a captain who has just taken a beating actually wants a Shipwright's Order.

The failure mode to design against is the one WoW eventually hit, where repair bills stayed flat while income grew until durability was a tax people clicked through rather than a decision. Pricing repairs in **materials rather than gold** avoids it here, because materials are gated by travel rather than by playtime and so do not inflate the way gold does.

---

## 6a. The store

**The gem ladder.** The base rate is 100 gems a dollar, and the discount climbs to 25% at the top. The rate is set so the **$19.99 tier holds at 2,400 gems**, which is what keeps the four-day skip at $8.00 and the full set of finishing moves at $9.16 — the two prices the design is anchored on.

| Pack | Price | Gems | Gems per $ | Discount |
|---|---|---|---|---|
| Handful | $0.99 | 100 | 101 | — |
| Pouch | $4.99 | 550 | 110 | 10% |
| Strongbox | $9.99 | 1,150 | 115 | 15% |
| Chest | $19.99 | 2,400 | 120 | 20% |
| Hoard | $49.99 | 6,100 | 122 | 22% |
| King's Ransom | $99.99 | 12,500 | 125 | 25% |

A complete account's 6,570 gems costs $65 at the smallest pack and $52.55 at the largest. That spread is the reward for buying big, and it is small enough that nobody buying the $0.99 pack feels cheated.

**Themed bundles** carry gems alongside the things gems cannot buy — gold, materials, cards — at the same 10% to 25% band, deepest at the top.

| Bundle | Price | Gems | Gold | Materials | Cards | Saving | Offered |
|---|---|---|---|---|---|---|---|
| Shipwright's Order | $4.99 | 300 | 8,000 | 340 | — | 10% | after a ship upgrade |
| Gunner's Kit | $9.99 | 700 | 14,000 | — | 100 | 15% | when a chest run fills |
| New Horizons | $19.99 | 1,400 | 30,000 | 1,860 | — | 20% | on reaching a new port |
| Captain's Fortune | $49.99 | 4,000 | 70,000 | 2,400 | 340 | 25% | season opening |

Two things about these are deliberate.

**They sit in the same discount band as the gem packs.** The first pass came out at 40% to 49% savings, which reads generous and is not: a bundle that halves the price teaches a captain that the gem packs are a bad deal and that waiting for an offer is the right move. Holding every route to gems inside one band means no purchase ever feels like the foolish one.

**Each is offered at a moment rather than parked in a shop.** A shipwright's bundle after a ship upgrade, a gunner's kit the moment a chest run fills, new horizons on reaching a port for the first time. The offer arrives when the want is already there, which is worth more than any discount, and it means the store is never a screen a captain has to go and visit.

---

## 7. Open questions

| # | Question | Default |
|---|---|---|
| 1 | Do premium coins buy cards, chests, or both? | Cards you are short of |
| 1b | Does the cap clear once a day, or more often? | Once a day |
| 1c | Should the promo also be offered as an optional chest upgrade, not only as a cap reset? | Recommended |
| 2 | Can gold be bought, or is it play-only? | Play-only |
| 3 | Do duplicate cards for a maxed gunner convert to something? | Not modelled |
| 4 | Do port exchange rates differ by port, so some ports are better for metal? | One rate everywhere for now |
| 5 | What does a fully maxed player spend on? | Nothing — this is what seasons and new pirates are for |
| 6 | Should the roster keep growing, and at what pace? | New content is the plan; the curves assume 36 |
| 6b | Are gems ever purchasable, or strictly earned? | Earned only |
| 6c | Does the Pirate Pass pay gems as well as early access to moves? | Not modelled |
| 6d | How many benches does a captain start with, and is the second bought with gems? | One free, a second recommended as a gem unlock |
| 6f | Are ship levels gold, materials, or both? | Both: materials gate it, gold pays for it |
| 6g | Can gems be earned fast enough that a free captain ever finishes, or is completion a spender goal? | Completion is a spender goal |
| 6h | A four-day skip and the whole finishing-move set cost about the same in money. Is that the intended relationship? | Settled: yes, $8 and $9 |
| 6i | Should bundles ever be discounted deeper than the gem ladder, for a launch or a win-back? | Not without a reason; it devalues the ladder |
| 6j | How many sections does each hull size carry? | Eight on a large hull; smaller sizes undecided |
| 6k | Does plating have durability, or is it bought once? | Recommended: soft decay, repaired in materials |
| 6l | Does anything else carry durability? | No: plating and sails only |
| 6m | Do plating and canvas wear per match, or per point of damage taken? | Per damage taken |
| 6n | Can a captain fight with worn plating, or is there a floor below which it must be repaired? | No floor; it simply stops protecting |
| 6e | Can several upgrades queue behind one bench, or must the player return to start each? | Not modelled |
| 7 | Does the Booty track's gold materially change these curves? | Not yet modelled |
| 8 | Is a year to max the whole roster the right ceiling? | Assumed yes |

---

## 8. Verification

Every number here comes from running the tables, not from estimating them: a 52-week simulation of three play patterns, with cards landing on individual pirates, chests rolled per match, the win multiplier and chest-tier bump applied, hauls paid on travel and on staying, and the Trade Shop exchanging within a weekly stock limit. The sensitivity table is the same simulation with one lever changed at a time. The four findings in §6 are each the difference between a run before and after a change.

Not modelled: the Pirate's Booty track's contribution, premium spending, the acquisition of pirates themselves as opposed to their cards, and any seasonal reset.

**One thing that now needs re-running.** The rematch offer on a defeat, accepted 65% of the time, adds about a third more *matches* a week. It adds far fewer *wins*: a challenger is the side that just lost, and even with the opponent's accuracy cut 20% they take the rematch only 21.6% of the time, so wins rise 14% for a 50% captain and 21% for a 40% one. Match rewards, which pay a third of the gold even on a loss, therefore move more than win-gated rewards do. Every curve in this document was measured without the rematch; nothing should be priced off them until the model has been re-run with it.
