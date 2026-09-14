# Pirate's Booty: season pass and finishing moves

**Prototype:** `pirate-clashers-booty.html` (standalone, the screen is interactive)
**Companions:** the water, hull damage and crew prototypes and their notes

**Markers**
- Unmarked is owner direction, or a direct consequence of it.
- **[Proposed]** is a fill needed to make the design buildable. Each has a default that holds until ruled on (§8).

---

## 1. The idea in one line

Two reward tracks running along one level axis: the **Crew's share** is free and pays gold, emotes and avatars; the **Captain's share** is paid and pays early access to premium pirates and to finishing moves.

---

## 2. The screen

**Owner direction.** A full screen with an upper and a lower prize tier, organised as a horizontal scrolling list.

**Layout.** Three lanes that scroll as one: Captain's share on top, Crew's share below, and between them a dotted course line carrying the level numbers and a marker for where the player is. Rewards sit directly above and below the level that pays them, which is the whole point of the two-tier shape: at any level you can see what you are getting and what you are missing.

Numbering is used because the track really is a sequence. The course line is the structural device — it is the only thing on screen that is decoration and information at once.

**Built for landscape.** The targets are iPhone 15 Pro Max held sideways and PC, both short and wide, so stacking a header, two tiers and a footer down the screen is the wrong shape. The chrome moved into a rail down the left — title, season, level, purse, buy and claim — and the whole height goes to the two tiers. The rail takes the notch's safe-area inset, since in landscape the cutout eats the left edge. A narrow window falls back to the stacked layout.

**Cell geometry comes from one number.** Icon size, cell width, wide-cell width and height all derive from the height left after the tier labels, the course line and padding, which is 94px. The wide card is defined as exactly two normal cells plus a gap, so the lanes stay in step by arithmetic rather than by three numbers happening to agree. The script never writes a pixel width; it adds a class. Sizing follows available height rather than fixed breakpoints, so one layout covers every target:

| | Layout | Icon | Cells in view | Vertical fit |
|---|---|---|---|---|
| iPhone 15 Pro Max landscape | rail | 98px | 4.4 | 409 of 409 |
| iPhone 15 Pro landscape | rail | 86px | 4.2 | 372 of 372 |
| PC 1280×720 | rail | 149px | 5.5 | 574 of 720 |
| PC 1920×1080 | rail | 149px | 9.0 | 574 of 1080 |
| PC window 1000×620 | rail | 149px | 4.0 | 574 of 620 |
| Portrait phone (fallback) | stacked | 136px | 2.4 | 700 of 898 |

Cell height is capped at 240px so a tall desktop window does not produce absurd cards; past that the track sits centred with more chart around it.

**PC needs input the phone does not.** A vertical mouse wheel over a horizontal list does nothing by default, and this page has no vertical scroll of its own, so a wheel would have felt broken. The track now answers the wheel on either axis, the arrow keys, Page Up and Page Down, Home and End. Hover lift is scoped to devices with a fine pointer, because a finger cannot hover, and the detail sheet returns focus to whatever opened it.

**The screen opens where the player is**, not at level 1, and re-centres on resize, because cell size follows window height and every column moves when the window does. Opening at the start of a 5,900-pixel track and making someone scroll to find themselves is the commonest mistake in this screen.

**Wide cards for finishing moves.** A finishing move is the headline drop, so its card is twice the width of an ordinary one, with a poster treatment. The lanes stay in step because the level waypoint and the free reward below widen to match; a check of the column offsets across all 50 levels reports zero drift.

**States.** Every cell is one of: claimable (raised and ringed), claimed (dimmed with a tick), or locked (desaturated). Locked captain cells carry a hatched veil, so the paid track reads as *withheld* rather than *absent* — that is the whole persuasion of the screen and it should not be coy about it.

**Copy.** The buy button says what the money does, including the part players most want to know: *keeps everything you have already passed*. Buying at level 14 makes 14 captain rewards claimable at once, two of them finishing moves.

---

## 3. Earning levels

**[Proposed]** 50 levels in a season, and a season runs the length of the live-ops season already in the plan.

| Source | [Proposed] |
|---|---|
| Finishing a match | small, win or lose, so the track pays for showing up |
| Winning | a bonus on top |
| Daily quests | the main engine, capped so a heavy day cannot burn a week of content |
| Weekly quests | a larger, slower lump |

Deliberately **not** on the list: buying levels. See §6.

---

## 4. Finishing moves

**Owner direction.** An attack charges when the player lands a streak of 4 successful dual attacks that damage the enemy's gunners, hull or sails. A cartoon poster appears warning of the attack, then an animation and a crew cheer. It plays as if it were a pirate movie in a theatre.

### 4.1 The six moves

| Move | Hits | What it does |
|---|---|---|
| Shark Strike | One gunner | Takes a single gunner off the deck |
| Kraken Haul | Sails | Tears every sail on the nearest mast |
| Whale Breach | Hull | The heaviest hull damage in the game |
| Storm Bolt | A mast | Snaps it: the mast falls and its sails burn away |
| Swordfish Run | Sails | Wide, shallow damage across every mast |
| Gull Swarm | Deck gunners | Every gunner above the rail; below decks untouched |

### 4.2 Why these are cheap to build

**Every one of the six drives a system that already exists.** Shark and Gull are crew knockouts. Kraken and Swordfish are the sail rip and burn masks. Whale is a large removal pattern in the hull damage mask — the same stamping pass the guns use, with a bigger row of numbers. Storm Bolt is the mast break, already built with its debris, burning sails and topple.

So a finishing move is **presentation over machinery that is already running**. The work is the poster, the animation and the sound, not the damage. That is a good position to be in six moves deep, and it is the argument for adding more later.

### 4.3 The two that overlap, and the two that pair

Kraken and Swordfish both hit sails; Shark and Gull both hit gunners. That is not a duplication problem if they differ in **shape**: Kraken is deep on one mast, Swordfish is shallow across all of them; Shark takes the one man you chose, Gull takes everyone standing in the open. Deep-versus-wide is a real choice, and it rewards the telescope: Shark is worth more once you know who is at the rail.

### 4.4 Charging

**[Proposed] What counts as a "dual attack".** Read as **both of a turn's shots landing damage**. A turn where one shot hits and one misses does not advance the streak; a turn where both hit does. This makes the streak about consistency rather than volume, and it is legible on screen: two hits, one tick.

**[Proposed] Which of the six fires.** The player picks from the moves they own, before the match, the way a loadout works. Not chosen by what the streak damaged: that would make the reward feel arbitrary at the moment it should feel earned.

**[Proposed] The streak breaks** on any turn that does not land both shots. It does not decay on its own.

**[Proposed] One charge per match**, until this is seen in play. Two crews trading finishing moves every fourth turn would eat the match.

### 4.5 The theatre

The owner's framing is the strongest thing here and worth taking literally.

1. **The poster.** Play stops, letterbox bars close in, and a cartoon poster slams on screen: the beast, and a shouted line. This is the warning: the defender knows what is coming and cannot stop it. Roughly one second.
2. **The feature.** The move plays with the camera following it, film grain and a projector flicker over the top. The existing damage lands under the animation.
3. **The house.** The crew cheers, and the audience of the theatre cheers with them.
4. **The lights.** Bars pull back and the turn timer resumes.

**[Proposed] The timer is paused for all of it**, exactly as it pauses for flight and resolution today. Spectacle must never cost the player time.

**[Proposed] Length, and repeat viewing.** Full version the first time a player sees each move in a season; a short version after, at about a third the length; skippable by tapping from the second viewing on. A five-second cinematic seen forty times in an evening stops being a reward and becomes a toll. Design for the fortieth viewing, not the first.

---

## 5. What goes on which track

**Crew's share (free):** gold, timber, gems in small amounts, emotes, avatars, gunner cards. Enough that a free player feels the season paying out, and none of it changes what happens in a match.

**Captain's share (paid):** larger gold and gems, banners and skins, **early access** to premium pirates, and finishing moves.

---

## 6. The pay-to-win line, and where this design sits on it

The Castle Busters deconstruct is blunt about it: the top player complaint is matchmaking against inflated levels and premium loadouts. This design puts two combat-affecting things on the paid track, so it has to answer for them.

**Early access, not exclusivity.** A premium pirate on the Captain's share reaches everyone at the end of the season. Paying buys time, not a permanent advantage. This should be stated on the card, not buried in patch notes — the prototype says it in the detail sheet.

**[Proposed] Finishing moves need a free path.** Right now all six sit on the paid track, which means a free player never gets the game's biggest moment. That is the line I would not cross. The recommendation is: **one move free on the Crew's share each season**, with the rest on early access like the pirates. A paying player gets the choice of six; a free player gets one, and it is the same strength.

**[Proposed] No level buying.** The moment levels are purchasable, the track stops measuring play and starts measuring spend, and every reward on it loses its meaning.

These three together let the pass sell hard on time, breadth and cosmetics, and not at all on power. That is the position to hold, and it is worth holding it in writing before the first season is priced.

---

## 7. What the prototype does not do

- **No real art.** Reward icons are placeholders. The poster is a coloured card with a letterbox frame, standing in for painted key art.
- **No economy.** Level costs, quest values, season length and price are all [Proposed] and unbalanced.
- **No cinematic.** The finishing moves are described and postered, not animated. Building one end to end is the next piece of work, and the Storm Bolt is the one to build first because the mast break already exists.
- **State is in memory.** Claims reset on reload.
- **No season rollover**, no catch-up, no end-of-season summary.

---

## 8. Open questions for the owner

| # | Question | Default |
|---|---|---|
| 1 | What is a "dual attack": both of a turn's shots landing? | Yes |
| 2 | Does the player choose which finishing move is loaded, or does the streak choose? | Player chooses, before the match |
| 3 | One finishing move per match, or per charge? | One per match |
| 4 | Should a finishing move be on the free track? | Recommended: one per season |
| 5 | Can levels be bought? | No |
| 6 | How long is a season, and what does the pass cost? | Undecided |
| 7 | Do finishing moves scale with anything, or are they flat? | Flat |
| 8 | Can a finishing move be defended against at all, or is the poster a promise? | Cannot be stopped |
| 9 | Does the theatre framing extend anywhere else — match intros, victory? | Finishing moves only |

---

## 9. Verification

The season model, the claim-state rules and the lane geometry were checked outside the browser: the three lanes hold zero column drift across all 50 levels including the six wide finishing-move cards, the state rules were exercised across locked, claimable, claimed and premium combinations, the layout was fitted against the stated targets — iPhone 15 Pro Max landscape including its safe-area insets, and PC windows from 1000×620 to 1920×1080 — plus a portrait fallback, and every element id and CSS class the script touches exists. The page has not yet been opened in a browser, so spacing, contrast and scroll feel need a pass on a real device.
