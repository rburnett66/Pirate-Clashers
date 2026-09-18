# Local QA evidence

## Automated checks
- npm run build regenerated the extracted catalog and original-renderer adapters.
- npm run check passed for model.js and app.js.
- npm test passed 55 tests, including 40 full seeded battle simulations.
- scripts/browser-combat.cjs passed regional ordering, explicit turn labels, movement, gunner details, angle-only controls, slow visible flight, damage-after-impact timing, full enemy response, steep-arc framing, mid-flight reload and portrait/landscape control bounds without console/page errors.
- scripts/browser-acceptance.cjs passed 17 named acceptance checks with no JavaScript or HTTP resource errors.

Acceptance covers 36 successfully loaded portraits, upgrade reload/skip, material ship upgrades, independent plating sections, canvas, figurehead upgrades, cosmetics, contextual-offer decline, disabled payments, trade costs, idempotent season claims, 100-seat boards, victory/chest opening, all six finisher presentations, landscape layout, corrupt-save preservation and WebGL-unavailable messaging.

Model tests additionally cover invalid placements/payments, deterministic chest results, rollover catch-up, rematch identity, no repeat payouts, equipment wear/repair isolation, offer expiry/cooldown and turn timeout.

## How to interpret the evidence
Browser acceptance uses an isolated earned-resource fixture to reach upgrades and equipment, a saved battle near victory to exercise results, and explicitly charged moves to exercise all six presentations. Full battles and outcome termination are separately exercised across 40 seeds. These are complementary checks, not a claim that a human played every progression level.

Screenshots were inspected at 1440×900, 390×844 and 932×430. The earlier opaque iframe backgrounds were fixed, full desktop mast framing restored, and the short landscape layout adjusted to clear the combat controls. The environment uses headless Edge with software WebGL; physical iPhone GPU performance, Safari, touch feel and production asset acceptance remain unverified.

The Windows sandbox helper remains broken outside the project. Tests were run with approved external execution; no Windows ACL or Codex permission configuration was modified.

The combat tests additionally check parabolic samples against the analytic equations, weapon range against launch speed, first-contact hull occlusion and deeper-pixel exposure, port crew cover, one specialty per projectile, independent part HP, mast/sail coupling, deterministic grape pellets, turn/movement locks and safe pending-shot reload. Original material-wear tests use explicit physical impacts; browser victory fixtures retain a small real material patch rather than mutating aggregate hull HP.

The pixel-mask regression suite checks local chipping, all mask pixel centers, single-texel interception in both firing directions, legacy-save conversion, corrupt-mask rejection, and reload after a partial pellet volley without repeat damage. scripts/browser-hull-mask.cjs compares all 163,840 uploaded GPU texels with the saved collision mask and reads framebuffer alpha to prove both wood layers disappear inside holes while nearby wood remains opaque. It also verifies equally sized deck/port portraits on separate layers; an 800 x 900 hull close-up was inspected.

Interior clarification: the browser test verifies an opaque interior image beneath open hull pixels, correct interior/crew/exterior layer order, and a transparent boundary outside the ship. A regression test proves planking initially protects port crew, removal exposes them, and exposed port/deck crew take equal damage without changing hull health. Their exposure persists across reload.

## Ocean and Water Workshop checkpoint
- 55 model tests pass, including rotated single-texel collisions through the full 15-degree control range, saved shot poses, water JSON validation and captain-backup migration.
- scripts/browser-ocean.cjs passes both-hull GPU coupling, visible rocking, sampled contact foam, continuous rocking during flight, exact analytic miss-to-splash coordinates, no premature/duplicate splash, no damage on a miss, portrait alignment and reduced-motion stability.
- scripts/browser-workshop.cjs passes 66 exposed sliders, named-look persistence, manual-copy fallback, validated paste/preview, invalid-import preservation, reload, selected values reaching combat and zero rocking/foam-look settings. No console/page errors. Desktop and portrait screenshots inspected.
- scripts/browser-hull-mask.cjs still passes all 163,840 GPU mask comparisons with zero mismatches, opaque interior behind breaches, equally sized crew layers and exposed-crew collision.
- Reports/screenshots: test-results/ocean-report.json, water-workshop-report.json, ocean-combat.png, ocean-miss-splash.png, water-workshop.png and water-workshop-portrait.png.

## Continuous rocking and aim-guide correction
Both ships now keep rocking while either side fires. Live collision sweeps moving ship-local material, crew and rig bounds while the saved muzzle origin and ballistic path stay fixed. Five focused regressions cover a moving single texel from either direction, persistent launch origin/reload, stationary-target results across frame sizes, partial live grapeshot reload, and a guide trimmed to exactly half the full arc length. The aim guide is solid red with a 5 px stroke and contrasting angle text. Browser ocean and combat passes confirm continued rocking, exact missed-shot splashes, the red guide, turn locks, impacts, reload and responsive layouts. The prior frozen-pose notes on the MetaMax ticket are superseded by the owner correction.


## Responsive spacing audit — 2026-09-17

Owner authorized local fixes while MetaMax is unavailable, with project 1002 tracking deferred. Follow-up: attach this spacing work and validation to the board when access returns. No ticket or deployment is claimed for this pass.

`src/responsive-spacing.css` centralizes fluid gaps and content-sized panels. Ordinary dialogs place the close control beside their heading; the chest uses intrinsic grid rows and whole-dialog scrolling, and closed dialogs occupy no space. Removed the old chest minimum heights and flex-stretch rules. Ship previews, equipment art and portrait maps use aspect ratios; inventory, standings and Water Workshop use viewport-relative scroll/preview sizes. Booty reward lanes share intrinsic rows so longer text grows the row. Menu side panels and empty states no longer reserve excess space. Scene coordinates, desktop canvas scaling and tap-target dimensions remain intentional.

Validation through Chrome responsive emulation:
- Six main screens at 320×568, 390×844, 430×932, 640×960, 768×1024, 844×390, 932×430 and 1440×900: no page-width overflow. The tablet orders-panel stretch found during testing was corrected and rechecked; desktop side panels were visually rechecked after their final adjustment.
- All five Ship tabs at narrow-phone, landscape-phone and desktop sizes: no horizontal overflow or clipped stat/equipment containers.
- Eight ordinary dialogs at those three sizes: 24 checks, no horizontal overflow or heading/close-button overlap.
- Chest at six phone/desktop sizes: all four rewards visible without inner scrolling or collapsed rows; footer-to-frame gap approximately 23–30 screen pixels. Closing removes the dialog from layout.
- A temporary long reward label grew its shared reward row from about 110px to 163px without clipping or misaligning the lanes.
- Water Workshop, match introduction, touch battle HUD, retreat confirmation and defeat result received browser smoke checks. No browser errors recorded.
- `npm test`: 115/115 passed. `npm run check` and `git diff --check` passed. Wi-Fi server returns the updated page and stylesheet with HTTP 200.

These are local Chromium checks, not physical-device Safari validation. Changes are available from the existing Wi-Fi preview after refresh; public publishing was not part of this pass.

Phone scenery follow-up: Wi-Fi preview rejected uppercase .JPG files. Updated its public-file extension allowlist to accept case variants and normalize MIME lookup. Restarted port 4174; all 21 location images return 200 with image/jpeg. Verified the picker via the Wi-Fi origin at 390x844, with loaded visible thumbnails and no horizontal overflow. Private paths remain 404. npm test: 115 passed; npm run check passed.

Challenge crew and mobile special-camera follow-up: reproduced seed 1 generating five challenger crew against a three-crew sender. New captains now receive the sender's base crew count on a suitable randomized hull, plus one temporary bonus gunner. Empty-station bonuses no longer enter the saved crew or accumulate on replay. Added coverage across hull sizes, compressed links, empty/partial crews and replay. Special attacks now frame the target using proportional viewport margins instead of subtracting 130 pixels. Browser verified four versus three crew in the intro and a larger target during Shark Attack at 844x390 (310px combat field, 93 pixels/world unit versus the previous 64.3). Isolated localhost test save restored. npm test: 118 passing; npm run check and git diff --check passed. Changes remain local; board tracking deferred.

Mobile camera/shader follow-up: interpolate visual ship heave/roll between 10 Hz water-contact messages; these paints no longer echo unchanged camera/settings back to water. Camera transitions retarget from their current position on viewport changes, and rebuilding the arena cancels stale camera/pose animations. Mobile ship backing resolution capped at 1x and ocean at 1.5x (desktop remains 2x); source generators updated and runtime assets rebuilt. Preserved existing wind scenery and death-effects output when reconciling generator drift. Verified 844x390 / 390x844 rotation during telescope and special transitions, correct 93px/world-unit special framing, no browser errors, ship canvases 700x660 and water 1266x465 at emulated DPR 3. Foreground desktop animation observation: 472 frames and 472 ship transform updates over two seconds; this is not a phone GPU benchmark. npm test: 118 passed, build/check passed. Physical-phone stutter acceptance remains to be tested. Local tracking deferred.

Pirate polish: Special Attack now sits after Equipment in the Crew navigation; the removed loadout banner is replaced by a mast-side icon. Ship page shows rig and fits level-1 and level-6 hull/sails in landscape; portrait ship stays within the first viewport. Main screen uses the actual equipped ship preview, with Challenge to the left of Results; Results is disabled until available. Portrait, landscape and desktop checks show actions inside the panel and no horizontal overflow. Fixed landscape scenery/hold overlap while keeping the layout proportional. Added owner-supplied At Sea values as the mobile default and selectable built-in look, preserving explicitly selected custom looks. Exterior-only wet gradient and moving foam follow the 32 sampled water heights; cutaways and breach interiors remain dry. Verified live battle settings speed .6, swell .52 and line width 4.6. Local changes only; tracking deferred. npm test: 119 passing; npm run build/check and diff check passed.
Final wet-hull check caught and fixed typed-array coordinate conversion (Float32Array.map coerced coordinate pairs). Rechecked a fresh live mobile battle: both ship renderers ready, exterior wet shading visible, player cutaway dry, and zero browser errors. Test captain restored after verification.

Website package: scripts/package-web.py stages only browser runtime/art/audio and rewrites asset URLs for portable root or nested-folder hosting. Per-document base paths keep inline modules and iframe images consistent; stylesheet and manifest paths resolve independently. ZIP includes upload instructions and optional iframe embed. Verified archive CRC and required runtime/assets/audio, 21 loaded scenery images, rendered ship and battle, compressed challenge URL retaining /games/pirate-bash/, and no same-origin asset requests escaping that prefix. Root-hosted home also loads; no browser errors. 119 tests and syntax checks passed. Package created in .runtime; no website or public repo was published.
