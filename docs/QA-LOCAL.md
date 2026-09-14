# Local QA evidence

## Automated checks
- npm run build regenerated the extracted catalog and original-renderer adapters.
- npm run check passed for model.js and app.js.
- npm test passed 50 tests, including 40 full seeded battle simulations.
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
- 50 model tests pass, including rotated single-texel collisions through the full 15-degree control range, saved shot poses, water JSON validation and captain-backup migration.
- scripts/browser-ocean.cjs passes both-hull GPU coupling, visible rocking, sampled contact foam, frozen shot poses, exact analytic miss-to-splash coordinates, no premature/duplicate splash, no damage on a miss, portrait alignment and reduced-motion stability.
- scripts/browser-workshop.cjs passes 66 exposed sliders, named-look persistence, manual-copy fallback, validated paste/preview, invalid-import preservation, reload, selected values reaching combat and zero rocking/foam-look settings. No console/page errors. Desktop and portrait screenshots inspected.
- scripts/browser-hull-mask.cjs still passes all 163,840 GPU mask comparisons with zero mismatches, opaque interior behind breaches, equally sized crew layers and exposed-crew collision.
- Reports/screenshots: test-results/ocean-report.json, water-workshop-report.json, ocean-combat.png, ocean-miss-splash.png, water-workshop.png and water-workshop-portrait.png.
