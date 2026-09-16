# Ship upgrades — implementation and acceptance

Implemented from [Pirate Bash Ship Upgrades](https://docs.google.com/document/d/1HRXtR8BByO5kTxAR6Kg2q2FZbsmCKJ__dP3EMej-5pc/edit), read September 15, 2026. See [architecture audit](SHIP-UPGRADE-AUDIT.md) and the preserved full brief in `sources/ship-upgrades-brief.txt`.

## Available locally

- Victory and defeat use the complete supplied boards with live gold, gems, battle XP and honor values. Honor represents the existing trophy reward. Settlement remains in `model.js`, with a saved reward snapshot and the existing once-only guard. Opening results again cannot grant rewards. Result artwork is decoded before opening the dialog.
- Crew → Ship contains Upgrade Hull, Upgrade Sails and the three customization shortcuts. Sails, Flags and Figureheads have scrollable inventories; owned items sort first and equipped items are marked. The existing placement interaction is available under Gunners; Collection, Shipyard, Equipment and the gunsmith remain available.
- Six hull configurations define 2+1, 2+2, 3+2, 3+3, 4+3 and 4+4 gunner layouts. `ship-config.js` supplies the same anchors to placement buttons, portraits, collision and cannon-port rendering. Hold crew fit below the deck. One port is drawn per hold position; deck positions do not create ports. Port doors remain protective exterior material until breached.
- The inner hull remains behind the outer hull and hold crew. During closed views it is clipped to the exterior silhouette. Cutaway mode reveals the supplied interior. Clean supplied exterior variants avoid baked-in extra cannons and figureheads that would contradict equipment counts.
- Independent sail levels implement 1/1, 2/2, 2/3, 3/4 and 3/5 mast/sail counts. Inactive rig pieces are absent from rendering and collision. Existing eight damage zones retain stable indexes for saved shots. Planned front-jib and rear-spanker levels are in configuration and cannot be purchased before their artwork exists.
- Seven named figureheads use one configurable 5% base bonus. Fire resistance, cannon resistance, crew protection, movement, cannon attack, crew attack and fire attack feed the existing damage/movement calculations. Only one figurehead can be equipped. Existing figurehead grades and upgrade prices remain; additional grades add a configurable 2.5 percentage points each.
- Hull purchases deduct resources and save once before presentation. Failed saving rolls back the purchase. The expected-level guard and locked input prevent replayed purchases. Thirty puffs obscure the hull; the renderer changes hull, anchors and ports while hidden, then golden rays reveal it and a modal compares HP, movement distance, capacity and ports. The supplied construction clip provides three seconds of audio. Sound and reduced-motion settings are honored. Artwork loading failure returns to the saved upgraded ship with an error message.

## Save and balance compatibility

Progression migration version 2 maps old hull levels 3–8 to new levels 1–6, retaining their capacity. Old levels 1–2 migrate to level 1. Resources, posted crew, plating, cosmetic ownership, battle damage, pending shot state and results survive. Old saves retain their five-sail configuration; new captains begin at hull 1 / sail 1.

Legacy figurehead ownership/grades are retained in `legacyFigureheads` and mapped to the closest new category; overlapping Dolphin ownership keeps the highest grade. This migration runs once. New bonuses follow the updated brief.

The brief does not supply replacement HP, prices or precise movement values. New hull HP/costs reuse the old level 3–8 values. Movement uses the existing 3 m action with a configurable 5% base gain per hull level. Sail and flag prices are local tuning defaults in `ship-config.js`. These require balance acceptance, rather than being represented as supplied values.

## Remaining supplied assets

The following are not complete and are not substituted:

- Seven figurehead images: inventory ownership and bonuses work, but the cards explicitly show that artwork is pending; ship-mounted figurehead artwork awaits those assets. Each definition has an asset field consumed by the shared renderer.
- Angelic “ooh/aah” reveal clip: no matching source was identified in the seven generically named Audio Videos files or the other listed art folders. `UPGRADE_MEDIA.reveal` remains null, so the reveal is silent instead of playing an unrelated effect.
- Front jib/rear spanker: future content explicitly deferred by the brief.

Original artwork, prototypes and the user's untracked `art-review` assets remain intact. Downloaded source metadata is in `sources/upgrade-media/source-manifest.json`. No MetaMax tracking, MCP/Codex configuration, token access, GitHub binding or deployment was performed.

## Validation

```text
npm test
npm run check
npm run build
node scripts/browser-ship-upgrades.cjs
node scripts/browser-ship-art.cjs
node scripts/browser-hull-mask.cjs
node scripts/browser-camera-hold.cjs
```

Final validation: 76 unit tests passed; syntax check and build passed; all four browser scripts listed above passed.

Unit coverage includes every capacity level, replayed purchase guards, independent sail configuration, all seven bonus paths, old-save migration, ongoing battle preservation and actual reward deltas. Browser coverage includes the smoke/swap/reveal order, supplied construction-audio request, inventory persistence, six rendered hulls, crew and port counts, interior pixels, result reopening, and desktop/landscape/portrait bounds. Screenshots and JSON evidence are in `test-results/upgrades-*` and `test-results/ship-upgrades-browser.json`.

Browser checks use isolated Edge/Chromium profiles with software WebGL. They do not alter the user's existing captain save and do not establish physical-phone performance or Safari acceptance.
