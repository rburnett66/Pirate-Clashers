# Ship upgrade audit

Source: [Pirate Bash Ship Upgrades](https://docs.google.com/document/d/1HRXtR8BByO5kTxAR6Kg2q2FZbsmCKJ__dP3EMej-5pc/edit), read September 15, 2026. The full source is preserved in `sources/ship-upgrades-brief.txt`.

| Requirement | Existing implementation | Integration |
|---|---|---|
| Victory / defeat | `app.js` finish dialog; `model.js` settle, lastResult, rewarded guard | Full supplied result artwork, live values from one saved settlement snapshot |
| Ship inventories | Crew tabs, cosmetic purchase/ownership, figurehead grades | Reuse cards/actions, add right-side Sails / Flags / Figureheads inventories |
| Hull progression | Eight-level ladders in model, ballistics and hull adapter | One six-level configuration for all consumers; migrate old level 3–8 to 1–6 |
| HP / movement / cost | fighter HP, moveShip, prototype E.SHIP prices | Central configuration; retain material-only costs and capped movement |
| Crew / cannon ports | stationPosition and portrait layers; unrelated fixed UI slot positions | Shared anchors for rendered crew, hit boxes, placement targets and port overlays |
| Hull layers | ShipArtRenderer body/interior, gamePorts, gameCrew | Keep inner hull present behind outer hull and hold crew |
| Sails / masts | Five fixed cloth panels, eight saved damage zones, three masts | Independent sail level; active panel/mast configuration; preserve old battle geometry |
| Figureheads | Six old definitions and generic attack/defence percentages | Seven configured bonus types; preserve old ownership in migration; integrate existing damage/movement paths |
| Upgrade celebration | Immediate model transaction and toast | Persist once, block input, smoke hides asynchronous renderer swap, rays and comparison modal |
| Saves / regression | Version-one local saves; node tests; browser scripts | Versioned progression migration and targeted transaction, geometry and browser tests |

## Source assets

Victory and defeat originals are already in `art-review/menu-art-20260914/source/`. The approved sheets have blank value areas for gold, gems, battle XP and honor. Honor will display the existing trophy delta; no new reward currency is introduced.

The supplied rig, hulls and 33 flag cutouts are already available. Audio Videos contains seven generically named videos; source 0 is the construction ship clip. Sources are preserved in `sources/upgrade-media`.

## Balance and compatibility decisions

The brief specifies capacity but no replacement HP or price table. Reuse the prior level 3–8 HP and material price sequence for new levels 1–6. Movement gains 5% per new hull level from the existing 3 m base step, as a configurable local tuning value. Sail costs are separately configured material costs pending balance acceptance. Old saves retain their five-sail rig, cosmetics, resources, crew assignments and ongoing battle damage. New captains begin at hull 1 / sail 1.

Future jib/spanker levels are represented but cannot be purchased until their art is available. Missing figurehead art and reveal audio must be identified explicitly rather than replaced with invented assets.
