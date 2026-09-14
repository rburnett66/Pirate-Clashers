# Pirate Clashers — UX handoff

**For:** the UX designer picking this up
**From:** the prototypes in this folder, which are working but were built one at a time and have drifted
**Targets:** iPhone 15 Pro Max in landscape, and PC. Landscape only.

This document does two things: it reports what the prototypes actually do today, including where they disagree with each other, and it proposes one shell that all of them should sit inside. Everything measured here came from the files, not from memory.

---

## 1. The constraint that decides everything

The game is landscape on a phone and windowed on a PC. On the target device that is **814 × 409 points** after safe areas — wide and very short. Almost every layout decision follows from the shortness.

| Where navigation lives | Content left | Share of screen |
|---|---|---|
| Bottom tab bar + top bar | 814 × 313 | 77% |
| Top bar only | 814 × 361 | 88% |
| **Left rail + top bar** | **742 × 361** | **80%** |
| Left rail only | 742 × 409 | 91% |

A bottom tab bar costs 12% of a height that is already scarce. A left rail costs 9% of a width there is plenty of. **Navigation goes down the left side.** This is the single most important rule in the document and the prototypes are inconsistent about it today.

The notch eats the **left** edge in landscape, which is where the rail goes, so the rail owns `env(safe-area-inset-left)` and every other element is inset from it.

---

## 2. What the prototypes do today

Six built screens, three different approaches to chrome:

| Prototype | Navigation | Header | Footer | Modal |
|---|---|---|---|---|
| Pirate's Booty | left rail | in the rail | in the rail | yes |
| Crew | top tabs | top bar | none | yes |
| Leaderboard | none | top bar | none | yes |
| Hull damage | none | floating title | none | no |
| Water | none | floating title | none | no |

**Token drift, measured.** The three product screens share a palette almost exactly — `--ink`, `--brass`, `--foam`, `--parchment` and the rest match across Booty, Crew and Leaderboard. The combat prototypes use a different one: `--ink` is `#0C2D4C` there against `#0A2438` elsewhere, `--brass` is called `--rope`, and the sky ramps disagree between the two water builds. Card radius is 14px in Booty and 12px in Crew. The top bar is 48px in both Crew and Leaderboard but is called `--tabs-h` in one and `--topbar-h` in the other.

None of this is visible in isolation and all of it will be visible the moment two screens sit next to each other.

**Accessibility is uneven rather than absent.** Every screen has visible focus rings. Three of six respect `prefers-reduced-motion`. Three of six guard hover behind `hover: hover`. Safe-area insets are handled everywhere but at different levels of care. `aria-label` counts run from 2 to 9.

**Breakpoints disagree.** Booty breaks at 760. Crew at 720 and 760. Leaderboard at 720, 760, 900 and 1180. They should be one set.

---

## 3. The shell

Every screen outside a match sits in the same frame.

```
┌────┬──────────────────────────────────────────────────┐
│    │  screen title            gold 12,400  gems 640   │  top bar, 48
│ ⚓ ├──────────────────────────────────────────────────┤
│ ⚔  │                                                  │
│ 👥 │                  content                         │
│ 🏆 │                                                  │
│ 📜 │                                                  │
│ 🛒 │                                                  │
│    ├──────────────────────────────────────────────────┤
│ ⚙  │  primary action                  secondary       │  action bar, 56, optional
└────┴──────────────────────────────────────────────────┘
  72                        742
```

**Left rail, 72 wide.** Icon plus a short label beneath, five destinations and settings pinned to the bottom. The current destination is marked by a filled brass tile, not by colour alone. On PC at widths over 1180 the rail expands to 200 and shows labels beside icons; the icon-only form is the phone form.

**Top bar, 48 tall.** Screen title on the left, wallet on the right — gold always, gems always, materials only on screens where they can be spent. The wallet is the one element that must be in the same place on every screen, because it is what a player checks before every decision.

**Action bar, 56 tall, only when a screen has a primary action.** Buying the pass, upgrading the ship, confirming a placement. Screens without one — Leaderboard, Crew collection — do not reserve the space. Never put navigation here.

**Matches use none of this.** A match is full-bleed with its own HUD. Leaving the shell is how a player knows they are in a match.

---

## 4. Navigation model

Five destinations. Flat: no destination is reached only through another.

| Rail | Destination | What lives under it |
|---|---|---|
| ⚔ | **Battle** | Find a match, loadout summary, last result |
| 👥 | **Crew** | Ship placement, collection, shipyard — the three tabs already built |
| 🏆 | **Ports** | The chart, port boards, captain sheets |
| 📜 | **Booty** | The season track |
| 🛒 | **Store** | Gem packs, bundles, Trade Shop |
| ⚙ | Settings | Pinned bottom, not a peer |

**Second-level navigation is tabs inside the content area**, as Crew already does. Two levels only; if a third is needed the information architecture is wrong.

**Three things that are currently screens but should not be:**

- The **Trade Shop** is inside Store, not a destination of its own. It is where materials get exchanged and it belongs beside the things bought with gems.
- The **captain sheet** on a leaderboard row is a sheet, not a screen. It already is.
- The **finishing-move detail** in Booty is a sheet. It already is.

---

## 5. Layout archetypes

Every screen built so far is one of four shapes. A designer should not invent a fifth without a reason.

**A — Split, 50/50.** Crew's ship tab: something to arrange on the left, something to choose from on the right. Selection on the right, placement on the left.

**B — Three columns, 40/20/40.** Ports: a map, the detail of what is selected, and a list. The narrow middle column is a detail panel, not a third list, and its facts stack vertically because at 20% of a phone it is about 160 wide.

**C — Rail plus track.** Booty: the left rail carries identity and the buy, and the whole content area is one horizontally scrolling thing. Use when the content is a long sequence.

**D — Full-bleed canvas.** Matches. No shell, own HUD.

**Grid.** 12 columns across the content area with a 16 gutter. 40/20/40 is 5/2/5 columns. 50/50 is 6/6. Rail-plus-track is 12.

---

## 6. The defeat screen and the rematch

Losing is the most fragile moment in the game, so it gets its own specification.

**A defeat offers a rematch. A win does not.** One rematch per fight, and a rematch cannot itself be rematched — so the worst a fight can go is two losses, never a spiral.

### The flow

1. **Result.** The match ends and the defeat screen shows what was lost and what was still earned: a third of the gold, and any damage taken to plating and canvas.
2. **The challenge.** A single primary action: *Demand a rematch*. It is the loudest thing on the screen, louder than Continue.
3. **The wait.** The opponent considers. Hold it to about **1.5 seconds** — long enough to feel like a decision being made, short enough not to be a loading screen. Their captain portrait and temperament are on screen while they think, which is where the seven temperaments pay off: a rager looks like they will accept.
4. **Accepted, 65% of the time.** Straight into the rematch. No lobby, no reload, same opponent, same loadout unless the player changes it.
5. **Refused, 35% of the time.** The **running scared** message: their ship turns and makes off, and the line lands over it. This is the consolation prize, and it should be genuinely satisfying — it is the only thing the player gets for having been refused.

### Rules

- Offered on a loss only. A winner never sees it.
- One per fight. Once refused or once played, the offer is gone.
- **The opponent fights the rematch at 20% reduced accuracy.** They have already had their win and are being dragged back into a fight they did not ask for, and their shooting shows it.
- A rematch counts as a normal match in every system: full rewards on a win, a third of the gold on a loss, and the win counts toward the weekly board.
- The refusal is not a free win and awards nothing but the message. If it paid out, players would fish for refusals.

### What it does to the numbers

**The first thing to know is that a rematch is a hard fight.** The challenger is by definition the side that just lost, and because equipment decides matches — rating tracks gear at 0.86 — the same two ships produce the same result. Measured by playing a first match, then a rematch between the same pair:

| Opponent's accuracy penalty | Challenger wins |
|---|---|
| None | 14.1% |
| −15% | 19.8% |
| **−20% (chosen)** | **21.6%** |
| −25% | 24.7% |
| −35% | 31.0% |

At −20% the challenger takes about one rematch in five. That is the floor the design starts from, and the rest has to come from the player.

### What the challenger learns

The hope behind the penalty is that a captain who has already fought this ship knows something. They do, and it is worth being specific about what, because it is all information the game already shows:

- **Which gun ports are manned.** Port gunners only appear when they fire, so one fight is exactly how a captain finds out where the guns are.
- **Where the plating is thin.** The hull damage from the first fight is visible on the enemy hull.
- **Which way they aim.** Whether the opponent went for sails, hull or crew.
- **Who is on deck.** Named through the telescope, or simply seen.

That knowledge does not make a captain shoot straighter. It makes their shots **land where they meant them to**, which is the aim value in the model rather than the accuracy value. Measured at the chosen −20%:

| Challenger's aim improves by | Challenger wins |
|---|---|
| nothing | 22.1% |
| 5 points | 23.7% |
| 10 points | 25.4% |
| 15 points | 26.5% |
| 20 points | 28.0% |

So a captain who reads the first fight well is at about **one win in four**, and one who reads it very well approaches three in ten — which is the −35% territory the penalty alone could not reach without feeling like a handout. The hope is a reasonable one: the penalty and the knowledge together get to the same place, and only one of them has to be given away.

**This is a design instruction, not a hope.** If the rematch is meant to reward learning, the defeat screen has to hand the player what there is to learn: which ports fired, where the hull took damage, what the opponent aimed at. Without that the knowledge is only available to the attentive, and the rematch stays a one-in-five proposition for everyone else.

**What it adds to a week**, at 65% acceptance and −20%:

| Win rate | Rematches a week | Wins before | Wins after | Change |
|---|---|---|---|---|
| 40% | 13.7 | 14.0 | 17.0 | +21% |
| 50% | 11.4 | 17.5 | 19.9 | +14% |
| 60% | 9.1 | 21.0 | 23.0 | +9% |

This corrects an earlier estimate in this document that assumed a challenger would win a rematch at their usual rate. They do not, and the effect on the weekly board is about a third of what that assumed. It still favours weaker captains, just far less: a 40% captain gains 19% where a 60% captain gains 8%.

**One number for playtesting.** At −20%, **51% of all fights end in the challenger losing twice**, for a 50% captain; a captain who learns well brings that to about 47%. It is the most common outcome of demanding a rematch either way, so the running-scared refusal and the second defeat both need to land well.

### Why this belongs here

The Store section that follows deliberately excludes losing as a trigger for offers. This is what replaces it. The defeat moment gets a response that costs the player nothing and gives them a way back at the opponent, rather than a purchase prompt aimed at someone who has just been beaten.

---

## 7. The Store

The Store is the only screen where the layout has a commercial job as well as a usability one, so it gets specified rather than left to archetype.

### Shape

Two columns, **30 / 70**, both inside the shell. Deals are always on screen; browsing happens beside them rather than instead of them.

```
┌────┬───────────────────────────────────────────────────┐
│ ⚓ │ Store                      gold 12,400  gems 640   │
├────┼──────────────┬────────────────────────────────────┤
│ ⚔  │  FOR YOU     │  Items  │  Bundles                 │  tabs, 36
│ 👥 │ ┌──────────┐ │ ┌──────┐ ┌──────┐ ┌──────┐         │
│ 🏆 │ │ deal 1   │ │ │ tile │ │ tile │ │ tile │         │
│ 📜 │ │ 2h 14m   │ │ └──────┘ └──────┘ └──────┘         │
│ 🛒 │ ├──────────┤ │ ┌──────┐ ┌──────┐ ┌──────┐         │
│    │ │ deal 2   │ │ │ tile │ │ tile │ │ tile │         │
│ ⚙  │ └──────────┘ │ └──────┘ └──────┘ └──────┘         │
└────┴──────────────┴────────────────────────────────────┘
       223               503, three tiles across at 150
```

On the target device that is a 223 deals column and a 503 browse column, three tiles across. Below 760 the columns stack with deals on top. Above 1180 the browse column goes to four across.

**Deals never scroll off.** The column holds a maximum of three and does not scroll; if a fourth qualifies it waits. A deals column that scrolls is a feed, and a feed is where a store stops being a shop and starts being advertising.

### The three sections

**Deals** — personalised, time-limited, at most three. Each card carries art, what is inside, the price, the saving against the gem ladder, and a **real** countdown.

**Items** — the gem ladder, gold, and the Trade Shop exchange. Everything permanently available at a fixed price. This is the section a player comes to deliberately, so it is the default tab when no deal is live.

**Bundles** — the four themed bundles, permanently listed at their standing 10% to 25%. A bundle that also appears as a deal appears once, in Deals, with its improved price.

### Targeting

The signal is **deck gunners**, which comes straight off the ship ladder and needs no new tracking:

| Deck gunners | Ship level | A regular captain is here | Offer |
|---|---|---|---|
| 1 | 1 | week 1 | Intro bundle |
| 2 | 2–4 | weeks 1–2 | Flag options |
| 3 | 5–6 | weeks 2–9 | Custom sails: big symbols, skulls, cartoon faces, flag patterns |
| 4 | 7–8 | week 9 on | Figureheads and enhancement parts |

Plus event triggers, which fill any remaining slot:

| Trigger | Offer |
|---|---|
| No purchase and account under three days | Intro bundle, always slot one |
| Ship upgraded | Shipwright's Order |
| Chest run filled | Gunner's Kit |
| Reached a port for the first time | New Horizons |
| Season opened | Captain's Fortune |

**Slot rules.**

1. A new account's intro bundle owns slot one until it is bought or expires. Nothing outranks it.
2. Progression offers outrank event offers, because they match where a captain *is* rather than what they just did.
3. One offer per category on screen at a time. Never two sail packs.
4. A declined or expired offer does not return for **seven days**. Re-serving a refused offer is the fastest way to teach a player to ignore the column.
5. Countdowns are real. If a deal says two hours it is gone in two hours and does not reappear at a different price.

**One trigger deliberately not on the list: losing.** Offers fire after a ship upgrade, a full chest run, a new port — things a captain has just achieved. Selling into a defeat converts well and is the reason players come to distrust a store. The defeat moment has its own answer in §6: the rematch.

### Cosmetics worth specifying

**Flags** and **custom sails** are the cosmetic line, gold-priced and gem-free, so a free captain can always look the part. Sails carry big readable marks — skulls, cartoon faces, flag patterns, house symbols — because a sail is the largest surface either player sees in a match and it is the one place personality shows at combat zoom.

This has a production consequence worth flagging early: the sail sprite path in the hull damage prototype already takes an atlas, so a sail design is an art file and nothing else. Flags are a smaller surface and will need testing at match zoom before a set is commissioned.

### Store states

| State | Treatment |
|---|---|
| Affordable | Full colour, price on the button |
| Not affordable | Price shown, shortfall named, button dimmed — never hidden |
| Owned | Marked owned, no price, still visible |
| Expiring soon | Countdown turns `--flag` under ten minutes |
| Sold out or limit reached | Greyed with the reason |

Never hide a price because a player cannot afford it. Naming the shortfall is honest and converts better than a mystery.

---

## 8. Tokens

One palette, replacing the three in use.

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#0A2438` | App background |
| `--ink-deep` | `#061A29` | Recesses, wells, the rail |
| `--ink-line` | `#16405C` | Borders, dividers |
| `--bone` | `#F3EDDF` | Primary text |
| `--muted` | `#8FB7CE` | Secondary text, labels |
| `--brass` | `#E9A23B` | Gold, premium, the current destination |
| `--brass-deep` | `#A86A18` | Brass shadow and borders |
| `--foam` | `#7FD8D0` | Gems, focus, claimable, promotion |
| `--flag` | `#B8352C` | Danger, demotion, damage |
| `--parchment` | `#E8D9B0` | Free-tier surfaces |
| `--wood` / `--wood-lit` | `#4A2A17` / `#6B3E22` | Premium surfaces |

Rarity is its own ramp and must never be reused for state: `--common #9BB2C2`, `--rare #4FA3E3`, `--epic #B072E8`, `--legendary #F0A733`.

**The combat prototypes' sky and sea colours are a separate art palette**, not UI tokens, and should be named as such so nobody unifies them by mistake.

**Type.** One family, weights doing the work: 900 for numbers and titles, 800 for labels, 700 for body. Scale: 22 / 17 / 14 / 12.5 / 11 / 10.5. Tabular figures on every number a player compares.

**Spacing** on a 4 base: 4, 8, 12, 16, 24. **Radii:** 10 on controls, 14 on cards, 18 on sheets — Booty and Crew currently disagree and 14 wins. **Chrome:** rail 72 (200 expanded), top bar 48, action bar 56.

---

## 9. Components

Already built and worth keeping: reward card, crew card, leaderboard row, tier header, promotion and demotion cut lines, gun position slot, map pin, port fact block, rarity chip, detail sheet, primary and ghost buttons, progress rail, currency readout.

Needed and not yet built: match result and defeat screen with the rematch flow, the running-scared moment, chest opening, finishing-move cinematic frame, store pack tile, bundle offer, deal card with countdown, Trade Shop exchange, flag and sail preview, empty states, error and offline states, first-run. The Store's own layout is specified in §7.

**Every component needs four states designed, not one:** default, selected or active, unavailable, and busy. The prototypes are strong on default and selected and thin on the other two.

---

## 10. Interaction rules

**Sheets, not screens, for detail.** Anything reached from a row or a card opens as a sheet over the current screen: it returns the player where they were and keeps the rail visible. Escape closes, focus returns to whatever opened it.

**Selection is a mode with a visible exit.** Crew's placement flow — tap a card, every valid position lights up — is the right pattern. It needs a way out that is not "tap the card again", which is currently the only one.

**PC needs input the phone does not.** A vertical wheel over a horizontal list does nothing by default; both Booty and Ports handle this and every horizontal surface must. Arrow keys, Page Up and Down, Home and End. Hover effects behind `hover: hover` and `pointer: fine`, because a finger cannot hover.

**Open where the player is**, never at the start. Booty opens on the current level, Ports on the player's own port. Any long scroll must do this, and must re-centre on resize.

---

## 11. The accessibility floor

Not aspirations — the bar below which a screen is not finished.

- Tap targets **44 × 44 minimum**. Position slots in Crew measure 50 on the target device; nothing may go below 44.
- Visible focus on everything reachable: 3px `--foam`, 2px offset.
- **Never colour alone.** Promotion and demotion carry an arrow and a label as well as green and red. Rarity carries a name as well as a colour. Locked carries a padlock as well as desaturation.
- `prefers-reduced-motion` respected everywhere. Three of six screens do today.
- Every interactive element has an accessible name that says what it does, not what it is.
- Contrast: body text against `--ink` and `--muted` against `--ink` both need checking against 4.5:1; `--muted` on the deepest recesses is the one most likely to fail.

---

## 12. What to resolve first

1. **Pick the rail** and move Crew and Ports off top tabs onto it.
2. **Unify the palette and radii** across the three product screens; leave the combat art palette alone and rename it.
3. **One breakpoint set.** Proposal: 760 (stack), 1180 (expand the rail, show secondary columns).
4. **Design the four states** for every existing component.
5. **Build the missing screens** in §9 — the defeat screen with its rematch, the match result and chest opening are on the critical path and none of them exists in any form.
6. **Run a contrast pass.** No prototype has had one.

---

## 13. Open questions for the designer

| # | Question |
|---|---|
| 1 | Does the wallet show materials everywhere, or only where they can be spent? |
| 2 | Is there a persistent "find a match" affordance outside the Battle destination? |
| 3 | Where do notifications live — chest ready, season ending, promotion — given there is no room for a badge tray? |
| 4 | Does the rail expand on PC, or stay icon-only for consistency with the phone? |
| 5 | Portrait is currently a graceful fallback rather than a supported orientation. Should it stay that way? |
| 6 | Is the finishing-move cinematic full-bleed over the match, or its own presented layer? |
| 7 | How does a player exit selection mode in Crew without deselecting by tapping the same card? |
| 8 | Do deals appear anywhere outside the Store, or only there? |
| 9 | Should the rail badge the Store when a deal is live, and how loudly? |
| 10 | Is there a "no thanks" on a deal, or does it only expire? |
| 11 | Is the rematch acceptance a flat 65%, or does temperament move it — a rager accepting more often than a supportive captain? |
| 11b | Does the defeat screen show what there is to learn — ports that fired, hull damage taken, what the opponent aimed at? Without it the rematch cannot reward learning. |
| 12 | Does the rematch compressing the skill gap on the leaderboard need offsetting, or is it the intent? |
