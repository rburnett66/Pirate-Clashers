# PIRATE BASH — supplied-art screen refresh

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

## Fullscreen on Safari and Chrome

Refresh the phone preview. The ⛶ button is in the menu header and between the two ship health panels during battle. Settings also offers Full screen and Phone setup. Supported browsers request fullscreen from that tap, with browser navigation hidden, and the same button exits. Display changes preserve the live battle renderer and aim; they do not reload the game. Browser denial or missing API opens setup instructions.

On iPhone, open the preview in Safari → Share → Add to Home Screen → enable Open as Web App if shown → Add. Launch Pirate Clashers from the new icon and rotate to landscape. The manifest and Apple web-app metadata allow this launch without Safari’s browser bars. Chrome on iPhone has the same Safari setup fallback when fullscreen is unavailable. Export the captain from Settings first; if the Home Screen app starts with separate storage, import the backup there. This LAN preview still needs the computer and same Wi-Fi; no offline cache was added.

The app respects safe-area insets around notches and the home indicator. Short landscape battles fit the dynamic viewport rather than retaining the former minimum battlefield height. Supplied art and desktop reference proportions are preserved.

`node scripts/browser-fullscreen.cjs http://<computer-wifi-address>:4174` verifies real Chromium fullscreen enter/exit over LAN HTTP, retained renderer/aim, rejected and unavailable API fallbacks, simulated iPhone/standalone modes, manifest/icon delivery, and landscape sizes 844×390, 844×320 and 667×375 including simulated safe areas. Screenshots are in `test-results/fullscreen/`. The menu, scaling and phone browser suites, all 55 model tests and `npm run check` pass. Automated Safari and physical-device fullscreen/install behavior have not been verified here; the owner’s next phone playtest covers that.

Platform references: [Fullscreen request API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen), [Apple Home Screen web-app instructions](https://support.apple.com/en-nz/guide/iphone/iphea86e5236/ios).

## Compact menu and city-map revision

The visible game name is now **PIRATE BASH**, including the shared header, browser/embedded-renderer titles, Home Screen manifest and fullscreen help. Existing local save keys and ocean interchange format identifiers remain compatible with saved captains and presets. Prototype originals remain intact; generated runtime titles also use the new name when rebuilt.

Battle, Crew, Leaders, Booty Pass, Store, Settings and Water Workshop now place the screen name and tagline in the shared header. Supplied carved title banners appear there at desktop size, with live headings on small screens. Primary navigation uses larger consistently aligned artwork and one label size per layout. The desktop composition still scales uniformly from 1792×1008; the header is 112 logical pixels high and Battle uses two content rows instead of reserving another row for its title.

Leaders uses the owner's [map.JPG from Google Drive](https://drive.google.com/file/d/19YmQ7McEmoKHuZlF6_HGe7QGICJeyCW-/view), downloaded unchanged to `public/menu-art/world-map.jpg` (1,212,207 bytes, 1792×1008). `src/port-map.js` contains explicit pixel anchors for the stylized illustration. A clipped, proportionally zoomed window eases to each selected city in 750ms. The supplied map title/footer stay outside the city window; the continent label overlays the top. Previous/next buttons flank Port # / # above the city name. Arrow keys and horizontal swipes also cycle all fifteen existing game ports, wrapping at either end. Reduced motion removes the pan animation. The standings update without rebuilding the map, and all 100 captains remain available in their own scrolling panel. Decorative cities on the illustration do not add progression destinations; Mombasa and Singapore receive live labels because they are not lettered in the artwork.

Battle's scenery picker opens from Scenery on the harbor. Booty Pass's weekly quest opens from Weekly Orders above the reward track. These dialogs retain scenery persistence and claim behavior while removing stacked content. Battle, Leaders and Booty Pass fit 844×390 landscape without main-panel scrolling. Desktop Settings also fits; Crew, Store and smaller Settings layouts retain scrolling for their longer content. Portrait layouts remain stacked and scroll naturally.

Find Match now selects `public/menu-art/find-match-shadow-v2.png`, an AI-assisted transparent extraction revision with outer shadow and dark interior shading. This is a regenerated variant, not a pixel-identical extraction. The original JPG and prior PNG are preserved for review. See [the exact edit prompt and provenance](FIND-MATCH-SHADOW-REVISION.md).

Validation: `npm test` (55/55), `npm run check`, and browser menu-art, UI-scale, phone and fullscreen suites pass. `node scripts/browser-menu-refresh.cjs` checks every screen at 1792×1008, 844×390 and 390×844, header placement/name, required no-scroll layouts, map cycling/wrap, swipe/keyboard controls, reduced motion, standings/scouting, persistent scenery and one-time weekly claiming. Screenshots are in `test-results/menu-refresh/`. Automated checks use isolated Chromium/Edge; physical iPhone Safari visual acceptance remains with the owner. Reality graph was unavailable for project 1002, so implementation was grounded in the checkout and supplied assets.
