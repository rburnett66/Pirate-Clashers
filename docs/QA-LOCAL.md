# Local QA evidence

## Automated checks
- npm run build regenerated the extracted catalog and original-renderer adapters.
- npm run check passed for model.js and app.js.
- npm test passed 23 tests, including 40 full seeded battle simulations.
- scripts/browser-qa.cjs passed the navigation, two-shot/enemy-turn, loss settlement and reload smoke flow without JavaScript or resource errors.
- scripts/browser-acceptance.cjs passed 17 named acceptance checks with no JavaScript or HTTP resource errors.

Acceptance covers 36 successfully loaded portraits, upgrade reload/skip, material ship upgrades, independent plating sections, canvas, figurehead upgrades, cosmetics, contextual-offer decline, disabled payments, trade costs, idempotent season claims, 100-seat boards, victory/chest opening, all six finisher presentations, landscape layout, corrupt-save preservation and WebGL-unavailable messaging.

Model tests additionally cover invalid placements/payments, deterministic chest results, rollover catch-up, rematch identity, no repeat payouts, equipment wear/repair isolation, offer expiry/cooldown and turn timeout.

## How to interpret the evidence
Browser acceptance uses an isolated earned-resource fixture to reach upgrades and equipment, a saved battle near victory to exercise results, and explicitly charged moves to exercise all six presentations. Full battles and outcome termination are separately exercised across 40 seeds. These are complementary checks, not a claim that a human played every progression level.

Screenshots were inspected at 1440×900 and 932×430. The earlier opaque iframe backgrounds were fixed, full desktop mast framing restored, and the short landscape layout adjusted to clear the combat controls. The environment uses headless Edge with software WebGL; physical iPhone GPU performance, Safari, touch feel and production asset acceptance remain unverified.

The Windows sandbox helper remains broken outside the project. Tests were run with approved external execution; no Windows ACL or Codex permission configuration was modified.
