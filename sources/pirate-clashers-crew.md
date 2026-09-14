# Crew and ship: the character screens

**Prototype:** `pirate-clashers-crew.html` (standalone, fully interactive)
**Targets:** iPhone 15 Pro Max landscape, and PC

**Markers**
- Unmarked is owner direction, or a direct consequence of it.
- **[Proposed]** is a fill needed to make it buildable, with a default that holds until ruled on (§7).

---

## 1. Three tabs

| Tab | Job |
|---|---|
| **Ship** | Placement. The ship on the left, crew cards on the right. |
| **Crew** | Collection and upgrading: all 36 pirates, owned and not. |
| **Shipyard** [Proposed] | The position ladder, and buying the next ship level. |

The third tab was not specified. Shipyard is the natural one: the owner's upgrade ladder is what creates positions, and it has nowhere else to live. Putting it behind the Ship tab would hide the single clearest reason to spend.

---

## 2. Ship tab: placement

**Layout.** Left half is the ship in cross-section, right half is the crew cards. On a narrow window the two stack, ship on top.

**Positions.** Up to 8: four on deck and four at the gun ports. Every position is a real button on top of the drawing, so it can be tapped, tabbed to and read aloud — not a hotspot on an image. Deck positions are ringed in foam, gun ports in brass, and locked ones are dimmed and struck out.

**The ladder**, exactly as given:

| Ship level | Deck | Hull | Guns |
|---|---|---|---|
| 1 [Proposed] | 1 | 0 | 1 |
| 2 | 2 | 0 | 2 |
| 3 | 2 | 1 | 3 |
| 4 | 2 | 2 | 4 |
| 5 | 3 | 2 | 5 |
| 6 | 3 | 3 | 6 |
| 7 | 4 | 3 | 7 |
| 8 | 4 | 4 | 8 |

Level 1 was not given and is assumed to be a single deck gun. Positions equal ship level throughout, and the deck always fills first, which is a real design statement: an early ship fights from the open, where its gunners can be seen and picked off, and only a late ship gets the cover of planking. That is worth keeping deliberately rather than by accident.

**Selecting and posting.** Tapping a card outlines it and every open position lights up. Tapping a position posts that pirate there. If the position was manned, the previous gunner is simply relieved, as directed.

**[Proposed] Two rules the brief implies but does not state.**

1. **A pirate cannot stand in two places.** Posting someone who is already stationed vacates their old position rather than cloning them.
2. **Tapping a manned position with nobody selected stands that gunner down.** Otherwise there is no way to leave a position empty.

Both were checked outside the browser across a sequence of posts, moves, replacements and a tap on a locked position: no duplicates, nobody in a locked position, and locked positions ignore taps rather than failing silently somewhere else.

**Upgrading never strands anyone.** Because positions only ever get added, a gunner posted at level 5 is still validly posted at level 8. Checked for every level from 5 to 8. Downgrading would strand the last position, which is the case to watch if refunds or resets ever exist.

---

## 3. The card

Each card carries, as directed: the main gun icon, the level, the title, and the rarity. Cards are colour-keyed by rarity on the border as well as the label, so rarity survives a glance.

**VIEW** appears on the selected card, below the image, and opens the full view. Posted pirates carry an "ON SHIP" flag, which is the one thing the brief did not ask for and the screen needs: without it, a full roster gives no clue who is already stationed.

---

## 4. Full view: details left, gunner right

Exactly the split asked for.

**Left:** name, rarity, level, hit points, range, damage, projectile, and damage type as tags. Each stat that an upgrade would change carries the gain beside it in green — `93 m  +2` — so the number and what the next level adds to it sit together instead of being described in a sentence somewhere else on the screen. The gain dims when the upgrade is out of reach, which keeps it a promise rather than a claim, and a gain of zero prints nothing rather than an empty `+0`. Across all 132 level steps of every primary target and rarity, no step gains nothing, so the blank case is a guard rather than a common state. Damage types are split into the three that do damage — hull, sails, crew — and the status effects, which are tinted differently so a glance separates "what it hurts" from "what it does". The pirate's best target is marked. A posting line says where they are stationed and what that means: on deck in the open, or behind planking until they fire.

**Right:** the gunner, with the gun badge in the corner, and the upgrade button directly below as directed. The price is on the button, in premium coins. The button is lit when affordable and dimmed when not, with the shortfall named underneath and nothing else — what the level buys is read off the stat rows themselves.

---

## 5. The 36 pirates are one table

The roster is the owner's own 36, entered as four columns: name, gun icon, projectile, and tags. Everything else is derived.

- **Primary target** is the first damage tag. The split comes out at 9 hull, 8 sails, 19 crew, matching the owner's own count exactly.
- **Base numbers** come from the primary target, so a hull-breaker is always slow, heavy and short-ranged, and a crew weapon is always light, quick and long. Three rows of numbers to balance instead of thirty-six.
- **Rarity** scales those numbers, and **level** grows them.

This is the part worth defending as the game grows: adding pirate 37 should be one line, and rebalancing every hull-breaker at once should be one number.

**The crew-heavy split is still the open balance question** raised when the roster arrived: 19 of 36 fight over the smallest and best-protected target surface. Nothing in this prototype fixes that; it just makes it visible.

---

## 6. Fit

Split in half on landscape, stacked on narrow windows, with safe-area insets taken at every edge.

| | Layout | Ship drawing | Position button | Card columns |
|---|---|---|---|---|
| iPhone 15 Pro Max landscape | split | 383 × 230 | 50px | 3 |
| PC 1280×720 | split | 616 × 370 | 80px | 5 |
| PC 1920×1080 | split | 936 × 562 | 122px | 7 |
| PC window 1000×620 | split | 476 × 286 | 62px | 3 |
| Portrait phone (fallback) | stacked | 406 × 244 | 53px | 3 |

Position buttons never fall below 44px, which is the floor for a reliable tap. Tabs answer the arrow keys, the detail view returns focus to whatever opened it, and Escape closes it.

---

## 7. Open questions

| # | Question | Default |
|---|---|---|
| 1 | What is the third tab? | Shipyard: the position ladder and ship upgrades |
| 2 | What does ship level 1 look like? | One deck gun |
| 3 | Can a pirate be posted twice? | No; posting moves them |
| 4 | How is a position emptied? | Tap it with nobody selected |
| 5 | Do upgrades cost only premium coins, or coins and duplicate cards? | Coins only, as stated |
| 6 | Does a position type matter to a pirate — is a sniper better on deck, a bomb thrower better at a port? | No; any pirate fits any position |
| 7 | What is the level ceiling, and does rarity change it? | 12 for everyone |
| 8 | Does ship level do anything besides add positions — hull strength, speed? | Positions only |
| 9 | Should the crew-heavy roster split be rebalanced, or should crew targeting be deepened? | Unresolved |

---

## 8. What it does not do

- **Placeholder art.** Gun icons and the pirate portrait stand in for the 36 images. The portrait frame is sized for real art and swaps to an image with no layout change.
- **State is in memory.** Postings, levels and purchases reset on reload.
- **No acquisition.** Chests, duplicates and the card economy are out of scope here; unowned pirates simply say where they come from.
- **The ship drawing is schematic.** It reads as a cross-section for placement, not as the combat art, which the hull damage prototype already renders properly.

---

## 9. Verification

Checked outside the browser: all 36 roster rows parse with ids 1–36 complete and a primary-target split matching the owner's own counts; the placement rules hold across posts, moves, replacements and locked positions with no duplicates; ship upgrades strand nobody at any level; the ladder is internally consistent, with positions equal to ship level at every rung; every element id and CSS class the script touches exists; and the layout fits all stated targets with tap targets at or above 44px. It has not yet been opened in a browser, so spacing, colour and feel need a pass on real hardware.
