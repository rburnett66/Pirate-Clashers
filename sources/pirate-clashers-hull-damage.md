# Ship hull damage: design and prototype notes

**Prototype:** `pirate-clashers-hull-damage.html` (standalone, WebGL2)
**Companion:** the water prototype and `pirate-clashers-water-research.md`

---

## 1. What the owner asked for

- The ship is an **inner structure** (a cross-section) plus an **outside hull**.
- The inner structure carries **2–4 gun stations on the decks** and **2–4 in the hull**, seen as gun ports from outside.
- Players **collect gunner characters** and use them to man stations.
- The inside is **static**; the outside hull **breaks away** as it is hit.
- A shader draws the outer hull and **removes sections using a mask**.
- Many projectile types, each with its **own removal pattern**.
- Process: hit location → scatter points → removal pattern at each point → damage persists → the hull image lasts the whole match.
- Effects: impact, explosion and screen shake scaled by damage, smoke and hull debris, then the **full damage revealed once particles clear**.

---

## 2. The shape of the answer

**Three layers, drawn back to front.** The inner structure is a full quad; the hull is the same quad over it, with the mask punching holes; the effects sit on top. Because the inner structure is drawn first, a hole in the hull reveals the deck and the gunners behind it for free. No cutting geometry, no stencil, no CPU mesh work.

The undamaged hull must cover the inner structure completely, so the hull reaches full opacity slightly *inside* the silhouette. Otherwise the interior shows through along the outline, where the hull's own edge is still fading in.

**The damage mask is the whole system.** One texture in ship space (512 × 320 in the prototype), ping-ponged, holding:

| Channel | Meaning |
|---|---|
| r | damage, 0 intact to 1 gone |
| g | the time that texel was damaged |

It is only ever combined with `max`, so damage can grow but never heal, and it is never cleared during a match. That single rule is what makes steps 4 and 5 of the process free.

The second channel is what makes the reveal work: the hull shader knows how old each piece of damage is, so a fresh tear can glow and cool while old damage stays cold, with no extra pass and no per-frame work.

**Cost.** One draw per hit, over the mask only. Nothing runs per frame except drawing. A match of 200 hits costs 200 small draws in total.

---

## 3. The process, step by step

**1. Hit location.** Ship-local coordinates, from a tap in the prototype and from the projectile's collision in the game.

**2. Scatter points.** JavaScript expands one hit into that weapon's scatter points. Round shot is a single point; grapeshot is 14 in a cone; chain shot and heavy bolts lay their points along a line. Spread is wider than it is tall, because shots arrive roughly level.

**3. Removal pattern at each point.** One fragment pass stamps every scatter point at once, so a full volley is still one draw. The pattern is a ragged, plank-aware tear rather than a circle:

```
q      = rotate(point - texel) ; q.y *= grain     // grain > 1 tears along the planks
edge   = radius * (1 + ragged * noise(angle) + spikeDepth * max(0, sin(angle * spikes)))
remove = 1 - smoothstep(edge * (1 - soft), edge, |q|)
```

**4. Damage persists.** `max` against what is already there.

**5. The hull image lasts the match.** The mask is only reset by "Repair hull".

---

## 4. Projectile types are data, not code

Every weapon is a row of numbers. A new weapon is a new row.

| Field | What it does |
|---|---|
| `points`, `spread`, `alongLine`, `lineAngle` | how one hit becomes many |
| `radius`, `radiusVar` | size of each removal, and how much it varies |
| `ragged` | how uneven the torn edge is |
| `grain` | >1 tears sideways along the planks |
| `spikes`, `spikeDepth` | radial splinters off the hole |
| `soft` | width of the partly-damaged rim |
| `shake`, `debris`, `smoke` | the effect mix |

**Measured on a headless copy of the same removal maths** — hull area removed by one hit at the centre, as a percentage of the whole hull:

| Weapon | Hull removed | Character |
|---|---|---|
| Round shot | 1.8% | one clean punched hole |
| Grapeshot | 2.3% | a spray of small bites |
| Chain shot | 2.3% | a torn horizontal slash |
| Explosive shell | 11.1% | a wide ragged blast |
| Incendiary | 7.4% | irregular burnt patches |
| Heavy bolt | 1.3% | a narrow rip along the grain |

Twelve mixed shots across the hull took it to 34.9% gone, and damage never decreased at any step. Five round shots at the same spot went 2.2% → 2.6% → 3.0% → 3.2% → 3.2%: a hole saturates, so repeatedly hitting the same plank stops paying. That is a real balance lever, and it comes out of the model rather than being written in.

---

## 4a. Masts and sails

**Owner direction.** 1–3 masts with up to 8 sails. Sails break under damage, limiting the ship's ability to close or run. Heavy hull damage can bring a mast down. A break starts with debris shattering from the break point, the sail above it burns away, and the broken mast falls and disappears.

**Sails are sprites with their own mask, not part of the hull mask.** Extending the hull mask upward over the rigging would have pushed the hull down to about a quarter of the texture's height, costing hull detail for something canvas does not need.

Each sail is a **sprite**: the shader samples a texture whose alpha carries the sail's shape, and two masks eat that sprite away. Real art drops straight in by binding a different texture; nothing in the shader changes. The prototype ships a generated 2 × 2 atlas of four sail shapes (cloth weave, panel seams, reef band, tapered foot) so the sprite path is exercised end to end rather than stubbed.

**The rip mask** is accumulated shot damage thresholding a noise field. **The burn mask** is a ragged front advancing from wherever the sail caught fire, with embers on the front line and a charred band behind it. Both multiply the sprite's alpha, so they compose: a half-torn sail burns from its remaining canvas.

**Layout.** Masts are placed and sized like a real three-master: fore, main (tallest) and mizzen. The sail budget is spent in full and any remainder goes to the taller masts first, so three masts asking for three sails each gives 3 + 3 + 2 = 8 rather than being capped at 2 apiece. Every combination of 1–3 masts and 1–4 sails per mast was checked against the limits.

**Two ways a mast comes down.**

1. **Shots through the rigging** tear sails and shake the mast a little.
2. **Heavy hull damage near the mast step** does the real work, because a mast is stepped on the keel. Damage is weighted by how close a hit lands to the foot.

At the default toughness a mast takes about **8 well-placed round shots** at its step, against roughly 4 at the lowest setting and 15 at the highest. The first pass had it at 2 hits, which made masts far more fragile than the hull they stand on.

**Speed.** Sail power is the intact sail area as a fraction of the whole, with anything above a break counted as lost. Ten chain-shot volleys through the rigging took a three-master from 100% to 29%, and it never recovered at any step. The prototype shows it in the readout; in the game this is what limits closing and running.

**The break sequence**, in the order the owner described:

1. **Debris shatters from the break point.** A hit record is pushed into the same effects system the guns use, sited at the break with four scatter points, so splinters burst out of the snap.
2. **The sail above the break burns away.** Every sail above the break catches at its foot, nearest the break, and the burn front spreads outward from there over `burnTime`. Measured on the same maths, canvas left goes 100% → 75% → 60% → 40% → 18% → 0% across the burn, and never increases. Because the origin is a point rather than a direction, the same mask handles an incendiary round setting fire wherever it strikes: that is now wired up, so incendiaries light the sail at the point of impact and the fire spreads from there.
3. **The broken mast falls and disappears.** The piece above the break turns about the break point at an accelerating rate, drops as it goes, and fades out. Over the default 2.2 s it passes 3°, 13°, 30°, 53°, 83° and 100°, fading from 62% of the way through and gone at the end.

The falling piece is drawn by the same shader as the standing rig, in a second pass **after** the hull, so a topple reads in front of the ship while the standing rig stays behind it and the hull covers the mast feet. The shader undoes the rotation to test the fragment against the upright geometry, so there is no second copy of the mast and sail drawing.

**Controls added:** masts, sails per mast, mast toughness, fall time, burn time, a "Draw masts and sails" toggle, and two buttons: **Rake the rigging** (a chain-shot volley high into the sails) and **Snap a mast**. Incendiary rounds set sails alight where they hit.

---

### 4b. The sail mask, and why it needed fixing twice

**Sails were born full of holes.** The rip mask thresholded the noise field at 0.52 for an undamaged sail. Measured over 300,000 samples, that field runs 0.068 to 0.984 with a median of 0.524 — so the threshold sat exactly at its middle and removed **49% of a brand new sail**. The threshold had been written as though the noise were centred on zero.

**Then the fix was still wrong in a subtler way.** Moving the threshold below the field's floor fixed the fresh sail, but the field is clustered: with a linear threshold, damage 0 to 0.25 removed almost nothing and then the sail tore open all at once between 0.4 and 0.75. A damage number that does nothing for its first quarter and everything in its third is not a useful number to balance against.

**The fix is to flatten the noise first.** The field is close to normal, with mean 0.5254 and standard deviation 0.1472, so it is pushed through a logistic fit of its own distribution, which spreads it evenly over 0 to 1 and is within 4 percentage points everywhere. After that a threshold of *t* removes about *t* of the surface, and the band is placed just below the damage value so zero removes nothing and full removes everything:

| Sail damage | 0 | 0.10 | 0.25 | 0.50 | 0.75 | 1.00 |
|---|---|---|---|---|---|---|
| Canvas left | **100%** | 90% | 68% | 46% | 25% | **0%** |

The lesson generalises to the hull: any mask built by thresholding noise has to be calibrated against that noise's actual distribution, or the number driving it means something different at each end of its range.

## 5. Crew: who can be seen, and who can be hit

**Owner direction.** The four deck gunners are visible above the hull. The four port gunners stick out of the port holes to take their shots. An enemy telescope can view the deck and identify the gunners. Gunners below decks have extra protection and cannot be seen until they fire.

That is an information rule as much as a drawing rule, so the crew moved out of the interior layer into their own pass **after** the hull. The interior still draws decks, ribs, alcoves and the guns; the crew layer draws the figures the enemy can actually see.

**Deck gunners** stand above the rail, on the deck curve at their station's x, always in the open.

**Port gunners** sit behind planking, which is cover and concealment at once. They lean out through the port to fire and duck back: over `leanTime` (0.9 s by default) they swing out in 0.12 s, hold, and pull back in the last 0.25 s. While out they are clipped by the port opening, so only the part through the hole shows — enough to know a port is manned, not much more.

**One figure, two places.** The gunner is a single shared function, so the man an enemy glasses at the rail is the same man you glimpse through a hole shot in the planking. Four hat shapes — tricorn, bandana, watch cap, helmet — are the identifying marks, one per collected gunner archetype.

**Exposure decides casualties.**

| | Seen at rest | Odds a covering shot hits them |
|---|---|---|
| Deck gunner | yes | 100% |
| Port gunner, firing | yes, briefly | 35% |
| Port gunner, ducked | no | 0% |

Over a minute with each gun firing every 4 s, a deck gunner is exposed the whole 60 s and a port gunner 4.7 s: **about 13× the exposure** for standing in the open. That is the trade the player is making when they post a collected gunner on deck instead of below.

**The telescope.** Glassing the deck darkens everything outside the eyepiece, draws a brass ring and a reticle, and labels every gunner it can actually read. Deck gunners are named. Port gunners return nothing but a shut port — unless they fire while you are watching, which names them for the length of their shot. The labels are HTML over the canvas, so the text stays crisp; the scope itself is a fullscreen shader pass.

**Consequence worth keeping.** Because the interior still draws port gunners behind the hull, blowing a hole in the planking exposes the crew behind it. Concealment is something the enemy can shoot away.

**Controls added:** a telescope toggle and a "Glass the deck" button, "Ship returns fire" (which ripples down the stations so port gunners pop out in turn), and an exposure-time slider. Deck and port stations now default to 4 and 4, with 8 gunners assigned.

**A crash this caught.** `buildStations` reads the clock to work out how far a gunner has leaned out, and it was being called at definition time, before the clock variable existed. In a browser that throws immediately and the page never draws. The mock WebGL harness ran the page start to finish and surfaced it; it is now called from `repair()` at startup instead, with a comment saying why.

## 6. Effects

All four effects come from one program and one draw, keyed off the last few hits and their scatter points.

1. **Impact flash** — a few bright quads at the scatter points, gone in 0.16 s.
2. **Explosion and screen shake** — shake amplitude scales with the shot's power and decays over about 0.4 s.
3. **Smoke and hull debris** — debris chunks are wood-coloured splinters that tumble under gravity and are sized from the scatter point that threw them, so a shell throws bigger pieces than grapeshot. Smoke rises, spreads, drifts and thins.

   **Debris is hull, so it only comes from hull.** Each debris particle tests its own scatter point against the hull silhouette and does not spawn if that point is in the air. A shell that detonates off the bow, above the rail or below the keel still flashes and smokes; it just throws no splinters. A shot that clips the edge of the hull throws debris only from the points that landed. The same test drops the shot's damage and screen shake to zero, so an air burst costs the ship nothing.
4. **Full damage revealed after the particles clear** — the mask is stamped immediately, but the hole **opens outward** rather than popping into existence. The damage level that counts as "gone" starts above 1 and descends to its normal value over `reveal` seconds (0.35 by default), so the hull is eaten away from the worst-damaged point outward while the flash and smoke cover it. A scorched patch appears first, then the hole grows through it. Traced across a slice of one hole, the removed area goes 0 → 1 → 2 → 4 → 5 texels and never shrinks. The torn edge then glows and cools over `charTime` (1.6 s), and smoke outlasts both, so the player sees the final extent as it clears.

**On "shake based on damage amount".** Measuring the hull area a shot actually removed would mean reading the mask back off the GPU, which stalls the frame. The prototype estimates it from the scatter points instead, calibrated against the headless run above (hull removed ≈ 70 × the summed r²). It is an estimate and is labelled as one. If exact numbers are ever needed — for a hull integrity bar, or a sinking condition — the right way is a mipmap reduction of the mask read back once a second, not per hit.

---

## 6a. Three bugs the first build had

**The ship drew as half a ship.** Both the inner structure and the hull are one quad built from `gl_VertexID` with no vertex buffer. The expression generating the six corners produced `(1, 1)` for both vertex 4 and vertex 5, so the second triangle had zero area and only the lower-left half of the quad ever rasterised. Rewritten so the two triangles are `(0,1,2)` and `(3,4,5)` with no repeated corner; a rasterisation check of the same expression now reports two triangles of area 2 each and 100% coverage of the quad.

This is worth a standing check on any attribute-less quad: the shader compiles, nothing errors, and half the picture is simply missing.

**Explosions in the air threw wooden splinters.** Debris spawned from every scatter point, whether or not it was on the ship. Fixed as described above.

**The hull never broke at all, because the mask always read as zero.** The mask textures were created as 32-bit float with `LINEAR` filtering. In WebGL2 a 32-bit float texture is renderable with `EXT_color_buffer_float` but **not filterable** without `OES_texture_float_linear`. Set to `LINEAR` without it, the texture is *incomplete*, and every sample silently returns `(0, 0, 0, 1)`. No error, no warning: the stamping pass wrote damage correctly every time, and the hull shader read zero damage everywhere, so the ship looked untouched. The mask debug view looked empty for the same reason.

Rather than depend on an extension, the shaders now filter the mask themselves: four `texelFetch` calls, bilinear on the damage so hole edges stay smooth, and **nearest** on the timestamp, because blending the times of two separate hits is meaningless and would smear the glow across old damage. The textures are `NEAREST`, which is complete for every format. This is also the more correct design, since the two channels want different filtering and hardware filtering cannot give them that.

The trap generalises: any float render target used as an input needs either `NEAREST`, the filter extension checked, or its own sampling in the shader. A standing check now scans the page for a float texture set to `LINEAR` without the extension.

## 7. What this prototype does not do yet

- **No structural consequence.** Damage is visual. Hull integrity, flooding, listing and the sink condition from the design document are not modelled.
- **Gun ports do not react.** Destroying the hull around a station does not disable its gun or hurt its gunner. The mask makes this easy later: sample it at the station and disable above a threshold.
- **Placeholder art.** Ships and gunners are procedural stand-ins for real art. The mask approach works the same with painted hull art: the hull shader samples a hull texture instead of generating planks.
- **One ship, one side.** No bow/stern views, no second ship, no waterline interaction with the sea prototype.
- **Not yet joined to the water.** The two prototypes are separate. Compositing means drawing the ship between water rows, as the water prototype's hull test already does.

---

## 8. Open questions for the owner

| # | Question | Prototype's assumption |
|---|---|---|
| 1 | Does hull damage have gameplay effect, or is it only spectacle? | Spectacle only |
| 2 | Should destroying the hull around a station disable that gun or kill the gunner? | No |
| 3 | Is the hull painted art, or generated as it is here? | Generated planks |
| 4 | Do gunners differ mechanically, or only visually? | Visually |
| 11 | Does identifying a gunner through the telescope give a concrete advantage — aimed fire at that station, or intel only? | Intel only |
| 12 | Can the enemy's telescope be countered: smoke, dropping below the rail, a decoy? | No |
| 13 | Should a deck gunner be able to take cover, trading rate of fire for safety? | No |
| 5 | How many stations does a real ship have, and is it fixed per ship class or upgradable? | Sliders, 2–4 of each |
| 6 | Does damage need to be exact (an integrity bar, a sink condition) or is the estimate enough? | Estimate |
| 7 | Does the inner structure ever change, e.g. fire spreading inside or a flooded hold? | Static, as directed |
| 8 | How exactly should sail power map to movement: speed, repositioning cost, or a hard cap on closing? | Shown as a percentage only |
| 9 | Can a fallen mast leave wreckage on deck, or does it vanish cleanly? | Vanishes |
| 10 | Should a mast coming down damage the hull or the crew under it? | No |

---

## 9. Controls in the prototype

- **Tap the ship** to fire the selected weapon at that point.
- **Weapon buttons** along the bottom pick the projectile type.
- **Tune** opens sliders for station counts, gunners assigned, reveal and char timing, debris and smoke, and screen shake.
- **Show the damage mask** draws the mask itself in the corner.
- **Draw the inner structure** can be turned off to see the hull alone.
- **Repair hull** clears the mask; **Take a broadside** fires four staggered shots.

---

## 10. Verification

All eleven shaders compile under a GLSL ES 3.00 validator. The quad's corner generation is checked by rasterising it (100% coverage, two triangles of equal area); the hull test that gates debris is checked against six hit positions on and off the ship; the damage-to-alpha path is traced across a hole to confirm it opens progressively; a check scans for float textures set to `LINEAR` without the filter extension; and the rig model is checked for its mast and sail limits, the number of hits a mast survives, that sail power never recovers, and that a topple completes and vanishes. The sail mask is measured across its damage range and through a full burn, from both a foot origin and a mid-sail one, the sprite atlas is checked cell by cell for shape coverage and cloth range; and the crew rules are checked for visibility and exposure at rest, through a firing window, and over a minute of exchange. Every uniform each shader declares is set from JavaScript, and none is set on the wrong program — checked with a mock WebGL context that tracks the active program and would have caught it. The page runs 260 frames plus every slider and button handler without error. The damage model was measured on a headless copy of the same maths, reported in §4.

It has not yet been seen in a browser, so sizes, timings and colours will need a tuning pass on real hardware.
