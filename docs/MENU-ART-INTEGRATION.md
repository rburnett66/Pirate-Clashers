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

## Proportions and resolution scaling

Desktop menus use the source mockup's 1792×1008 reference coordinates. The rail is 244px wide; central and right panels start at x=264 and x=1288. `src/ui-scale.js` fits that 16:9 composition with a single uniform scale; `src/ui-scale.css` keeps layout, type, artwork, borders and controls in the same proportions. Other aspect ratios center the composition over the wood background. Long collection/store/settings content scrolls within the main panel; the main menu fits in one view. Scenery choices now live beside the crew, and the hold occupies the lower central panel.

Reference scaling applies to landscape windows at least 1000×560 CSS pixels. Smaller windows retain the adapted layout. The header always preserves its 1758:464 source ratio. Navigation artwork is positioned according to each export's visible tile so transparent margins no longer make some icons look undersized. Raster sources and their shadows remain unchanged.

The live combat scene continues to use its existing viewport projection and pointer coordinates; it is not zoomed with the menu stage. Desktop dialogs, including results, use the common UI scale.

`node scripts/browser-ui-scale.cjs` measures invariant reference rectangles and centering at 1280×720, 1792×1008, 1920×1080, 2560×1440, 3840×2160, 2560×1080 and 1600×1200. It also checks all other main menu sections at 1440p. Screenshots are in `test-results/ui-scale/`. The original browser flow suite and all 55 model tests continue to pass.

## Testing on a phone

Run `npm run start:phone` from the project root. Open the printed `http://<computer-wifi-address>:4174` URL on a phone connected to the same Wi-Fi. Keep the computer awake and the server running. Ctrl+C stops it. If multiple private network interfaces are present, select one with `npm run start:phone -- --host <assigned-private-ip>`.

The phone server binds only the selected private interface and serves GET/HEAD requests for the game entry point, source modules/styles, public runtime assets and pirate PNGs. It does not serve project guidance, Git data, documentation or arbitrary repository files. Firewall settings are not modified.

Phone progress is stored separately in that browser. To transfer a captain, use Settings → Export captain on the original browser and Import backup on the phone. Refresh to load UI updates. Water preset IDs have a `getRandomValues` fallback because `randomUUID` is not available on plain HTTP LAN origins.

`node scripts/browser-phone.cjs http://<computer-wifi-address>:4174` checks allowed/excluded routes and an isolated mobile HTTP browser flow: touch navigation, water-preset saving, battle entry, aim control and retreat/results. This verifies the network server from the development computer, not physical-device connectivity. Haptics have not been implemented.
