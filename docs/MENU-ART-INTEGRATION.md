# Supplied-art screen refresh

Implemented in the local game for MetaMax project 1002, E11 / K20 (`story_mu091sxb_w`).

- Main menu: independent navigation, wallet, harbor scene, crew/orders panels and chest hold. Five selectable harbor scenes persist as a visual preference; the captain's actual progression port is shown separately.
- Crew: Ship, Collection, Shipyard and Equipment; portraits also appear in pirate details, crew stations and chest rewards. All 36 existing character mappings are preserved.
- Leaders: existing regions, map, standings and captain inspection, with supplied panoramas for Hawaii, Mumbai/Bombay and Madagascar.
- Booty, Store, Settings and Water Workshop: shared wood/brass surfaces and typography, supplied banners/icons where available. Existing actions remain connected.
- Battle: shared wood/brass controls around the existing ocean/ship renderers.
- Victory, defeat, rematch refusal and chest rewards: supplied illustrations/banners with live game data. The main menu can reopen the latest settled result without paying again.

## Asset assembly

`public/menu-art/` contains unchanged copies of the 23 PNG exports in `art-review/menu-art-20260914/processed/images/`. That review folder retains the original JPGs, export settings, approval records and source manifest. Approved drop shadows are preserved. Scene/title approval status remains as recorded by the art review; implementation does not imply final art acceptance.

`scripts/assemble-menu-art.cjs` uses SVG viewports to assemble the wood texture and a reusable border from the supplied menu reference, plus currency details from the supplied header. These SVG files are already included in `public/menu-art/`; regeneration uses the preserved source batch. Original raster pixels are not rewritten.

`src/menu-art.js` maps assets and defines portrait crop controls. Each portrait has an independent overflow mask matching the opening; the frame overlays it. A matching clip excludes the residual checkerboard rim in the supplied frame. `src/menu-art.css` handles the separate responsive pieces. The carved banners remain artwork; editable headings use Lilita One, with Barlow Condensed labels and counters. Fonts use the existing Google Fonts delivery pattern and have local fallbacks.

## Validation

Run `npm start`, then `node scripts/browser-menu-art.cjs`. The isolated browser fixture does not change the user's browser save. Screenshots are written to `test-results/menu-art/`.

Verified at 1440×1000, 844×390 and 390×844: six main sections without page-width overflow; all Crew tabs, 36 portraits, details, placement, persistent scenery, store shortcut with a 44px target, combat/defeat, settled victory, chest rewards, matching regional panorama and idempotent result reopening. Browser checks report no page exceptions or failed local resources. Also verified: `npm test` (55 passing) and `npm run check`.

This is a local game with seeded rivals. Existing purchase controls remain disconnected; no live accounts, online multiplayer or payment integration were added.
