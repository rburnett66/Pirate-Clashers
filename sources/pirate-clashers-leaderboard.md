# Leaderboards, ports and simulated opponents

**Prototype:** `pirate-clashers-leaderboard.html` (standalone; the simulation runs on load)
**Targets:** iPhone 15 Pro Max landscape, and PC

---

## 1. The short version

A thousand opponents are seeded and rated by **simulated play** before the screen paints. No rendering, no frames: a match is arithmetic, so the whole population settles in under half a second. Every captain is then posted to the furthest port their level has opened, and each port keeps a board of 100.

---

## 2. Simulating a thousand opponents

**Why simulate at all.** Matchmaking has to be instant, and a new game has no players. Seeding a population of plausible opponents and rating them against each other gives a ladder that is populated on day one and behaves like a real one.

**A simulated captain is built from the same numbers a real one is.** Ship level sets how many guns they bring, using the same deck-then-hull ladder as the crew screen. Their roster is drawn against the same rarity odds. Damage comes from the same table: base numbers per primary target, scaled by rarity, grown by level.

**What the game watches in a real player, the simulation gives every captain:**

| Trait | What it is |
|---|---|
| **Inventory** | Which of the 36 they own, and at what level |
| **Preference** | Which gunners they reach for first; the loadout is their favourites, capped by ship level |
| **Accuracy, per gunner** | A separate hit chance for each one, varying around their hidden skill |
| **Aim** | How often they put a shot on that gunner's best target rather than somewhere else |
| **Temperament** | One of the seven, which drives emotes (§5) |

**A match, as arithmetic.** Sides alternate, firing one shot per working gun. Accuracy decides a hit; aim decides whether the damage lands on the gunner's best target or elsewhere at 45%. Damage goes into three pools that match the combat prototypes: hull, sails and crew. Two feedback loops make it more than a dice-off:

- **Crew losses cost tempo**, not just health — fewer working gunners means fewer shots next turn.
- **Torn sails cost accuracy**, because a ship that cannot hold station shoots worse.

A ship is beaten when its hull is gone or its crew can no longer work the guns. On the 24-round cap, remaining hull decides it.

**Rating.** Elo from 1200, paired by rating each round the way matchmaking would, with K falling from 40 to 12 as the ladder firms up.

**Measured.** 1,000 captains, 40,000 matches, **under half a second** in the browser, with ratings spread 819 to 1817. It scales about linearly: 20,000 captains and 200,000 matches run in roughly 1.5 seconds.

---

## 3. The result worth acting on: gear beats skill

Because skill and progression are generated **independently** — a new player can have good hands and a veteran poor ones — the simulation can answer a question the game cannot ask itself yet.

| Across the whole population | Correlation with rating |
|---|---|
| Progression (gear and ship level) | **0.86** |
| Skill (accuracy and aim) | 0.50 |

Head to head, a skilled but under-geared captain beats a well-geared but clumsy one **5% of the time**. Gear decides matches.

**Within a single band of progression, that flips:**

| Player levels | Rating vs skill | Rating vs gear |
|---|---|---|
| 15–20 | 0.59 | 0.33 |
| 21–26 | 0.66 | 0.25 |
| 27–32 | 0.64 | 0.16 |
| 33–40 | 0.68 | 0.30 |

**So the ports are not decoration — they are the fairness mechanism.** A leaderboard banded by level measures skill; one global ladder measures spending. This is the Castle Busters complaint from the deconstruct, arriving with a number attached. The design already had the right answer in it; this says keep it, and do not add a global ladder alongside.

---

## 4. Ports

Fifteen, in the order a captain works around the world: London, Calais, Lisbon, Bermuda, Puerto Rico, Caracas, Seattle, Hawaii, Manila, Singapore, Hong Kong, Shanghai, Mumbai, Mombasa, Madagascar.

**Two corrections to the list as given.** Bermuda appeared twice, so it is listed once. Bombay and Mumbai are the same city under two names, so the second is read as **Mombasa**, which fits the Indian Ocean leg and keeps fifteen distinct ports. Caracas is read from "Carucas". Worth confirming.

**Each port is a band of levels**, opening at level 1 + 2.6 per port along the route and spanning six levels, so bands overlap and a captain always has somewhere to go. A port shows: top captain, typical loot, gold per win, difficulty, level range of the players actually on it, and how many captains it holds.

**Boards hold 100, and a port that fills clones.** At 1,000 players the busiest port holds 96 and nothing clones. At 5,000 every port clones, the busiest holding 488 across five boards; at 20,000 it takes 208 boards. Clones are numbered — London I, London II — and captains are spread evenly across them rather than piled into the first, so no clone is the "real" board.

**The chart.** Coarse coastlines on an equirectangular projection: enough to know where a port is, not an atlas. The route between ports is drawn as a dashed course line, ports are pins, and ports not yet open to the player are grey. The chart drags, scrolls and takes the wheel, and it opens centred on the player's own waters.

---

## 5. Temperament and emotes

Each simulated captain has one of the seven temperaments, which decides how likely they are to react to each moment of a match: a hit, a miss, a big hit, taking damage, a mast coming down, a finishing move, winning, losing.

**The first pass was unbearable.** Reacting at the natural rate produced 15 to 24 emotes a match — an emote almost every turn. Ordinary moments are now scaled to a quarter and put on a three-turn cooldown; the big ones are never suppressed, because those are the moments worth reacting to.

| Temperament | Emotes per match |
|---|---|
| supportive | 4.9 |
| angry | 6.7 |
| fun | 6.8 |
| playful | 7.1 |
| competitive | 7.8 |
| rager | 8.6 |
| silly | 8.9 |

A rager is the loudest and a supportive captain the calmest, which is the point: the temperament should be readable from behaviour without ever being named on screen. A rager mostly reacts to their own misses and to taking damage; a supportive captain mostly to the other player's good shots.

---

## 6. Ranking, the week, and promotion

**Position is games won this week.** Ties go to the bigger career trophy count. Wins reset every Monday; trophies never do.

**Ranking by wins rewards playing more, which is the point.** Wins correlate 0.62 with matches played and 0.41 with skill, so the top of a board is whoever put the hours in. That is the intended reward for activity.

**Ties are common, so the tiebreakers do real work.** On a full board, **37% of adjacent pairs are tied on wins**, which means career trophies settle over a third of all positions. Where trophies also tie, the more recent win ranks higher, so a board rewards still being out there rather than having stopped on Tuesday. In the seeded population that third key never had to fire — trophies are generated across a wide spread and rarely collide exactly — but in a live game trophies are a count of wins, so identical totals will be common and the recency key will decide places every week.

**Ports are rungs, not gates.** Level does not cap anything. A port's level range is a statistic about whoever happens to be there this week, and it comes out looking like one: London holds levels 1–13, Bermuda 2–24, Singapore 16–40, Madagascar 28–40. The bands overlap heavily and rise along the route, which is what an earned ladder looks like rather than an assigned one.

**One thing to watch: the ladder fills slowly from cold.** Promotion is ten per board per week, and reaching the last of fifteen ports takes at least fourteen weeks of finishing top ten. Started with 1,500 captains all in London, after forty simulated weeks only seven ports had anyone in them and the last eight were empty. A live launch therefore wants either a seeded population across the ports, more than ten promoted per board, or fewer ports to climb. The prototype seeds the population, and says so.

| Setting | Value |
|---|---|
| Board size | 100 |
| Promoted each week | Top 10 of each board |
| Demoted each week | Bottom 10 of each board |
| Level cap on movement | None: a port is a rung, not a gate |
| Ranking | Games won this week |
| First tiebreak | Career trophies |
| Second tiebreak | The most recent win |

---

## 7. The screen

Three columns at **40 / 20 / 40**: the chart on the far left, the port's details in the middle, the board on the right.

**The chart has a simple 2× zoom.** At 1× the whole world fits the column; at 2× it is twice that and pans, and either zoom recentres on the selected port. Tapping a pin while zoomed in brings that port to the middle. The chart opens at 2× on the player's own waters, because that is the port they actually care about. It drags on both axes, since at 2× it is taller than its column on a phone.

**The middle column** carries the port name, its clone buttons when it has more than one board, and the facts asked for — top captain, typical loot, difficulty, level range — plus four the screen needs: gold per win, how many captains the port holds, what level it opens at, and what happens at the end of the week. The facts stack rather than tile, because at 20% of a phone in landscape the column is about 160px wide.

**Selecting a captain opens their ship.** A row is a button: tapping it shows that rival's ship drawn with every gun position their ship level gives them, filled with the gunners they actually bring, deck positions ringed green and gun ports gold. Beside it is their crew — the posted ones first, then a few on the bench — with each gunner's role, rarity and level, and their captain marked. Underneath: won this week, career trophies, when they last won, how many guns and how much of the roster they have collected. It is the scouting screen the telescope work implies, applied to the ladder instead of a match.

**The board** shows rank, captain, level, wins, career trophies and when they last won, since recency now decides places. The top ten are tinted green under a "sail on to the next port" line, the bottom ten red under a "fall back" line, so both cuts are visible without reading the rules. The player's own row is marked. The temperament label drops out below 1180px, where the name column gets too tight to carry both.

| | Chart | Port | Board | Name column |
|---|---|---|---|---|
| iPhone 15 Pro Max landscape | 326px | 163px | 326px | 98px |
| PC 1280×720 | 512 | 256 | 512 | 284 |
| PC 1920×1080 | 768 | 384 | 768 | 540 |

---

## 7. Open questions

| # | Question | Default |
|---|---|---|
| 1 | Bermuda twice, and Bombay versus Mumbai: is Mombasa right for the second? | Mombasa |
| 2 | Does a player post to one port at a time, or hold a place on every port they have opened? | The furthest one opened |
| 3 | Does "most recent win" mean the later win ranks higher, or first-to-reach? | The more recent win ranks higher |
| 3b | Career trophies as the tiebreaker favour veterans over new captains. Accept that? | Accept, as specified |
| 4 | Wins reset weekly and trophies carry. Does anything else carry? | Nothing else |
| 4b | Where does a captain at the top port go when promoted, and the bottom port when demoted? | They stay |
| 4c | At launch, is the ladder seeded across ports, or does everyone start at London? | Seeded |
| 5 | Are simulated captains ever replaced by real players as the population grows? | Yes, as real scores are posted |
| 6 | Should the player be told an opponent is simulated? | No |
| 7 | Does a cloned board dilute the reward for topping it? | Not modelled |
| 8 | Do emotes come from a shared pool, or does each pirate have their own? | Shared |

---

## 8. What it does not do

- **No real art.** The chart is schematic and captains are gun icons with generated names.
- **State is in memory.** Every reload reseeds the same population from the same seed.
- **No real backend.** Posting a score, storing a player as a future opponent and replacing simulated captains with real ones are all described, not built.
- **No accuracy heatmap.** The simulation gives each captain one aim number per gunner; a real player's *where* they target is richer than that and should feed back into how their ghost behaves.

---

## 9. Verification

The simulation was run outside the browser and then in the page's own script against DOM stubs, unmodified: 1,000 captains and 75,750 matches — the rating pass plus a full week of play inside every port — complete in about 400 ms. Probing the page's own data confirms every captain sits on exactly one board, every board is ordered by wins and then career trophies with no exceptions, and nobody sits outside the level window they are allowed. The weekly ladder was run for forty weeks from a cold start with no level cap: promotions and demotions balance, every rung stays in use, and the fill rate above is measured from that run. The page's own data confirms the board is ordered by wins, then trophies, then recency, and that every port is populated. The skill-versus-gear correlations and the head-to-head result in §3 come from that run. Matchmaking by rating band was measured over 100,000 lookups: an opponent found every time, 0.13 ms each, 181 candidates in band on average, never needing to search wider than ±320 rating. Board cloning was checked at 1,000, 5,000 and 20,000 players. Emote rates were tuned against a model of a 24-round match. Every element id and CSS class the script touches exists. It has not been opened in a browser, so the chart's look and the list's feel need a pass on real hardware.
