# Repeatable big attacks

Four successful fired player attacks charge the equipped special. Each volley counts once at its final projectile resolution, provided any contact caused positive damage. Misses reset incomplete progress. Enemy actions and turn timeouts preserve it; a full charge persists until activation.

`src/special-attacks.js` holds definitions and tuning separately from generated `catalog.js`. Existing IDs, purchases, season unlocks, whale damage (220), and seagull deck-crew damage remain intact. Storm Bolt and Swordfish Run remain available. Siren Song is appended as ID 6, with provisional tuning of 48 damage per living enemy crew member. All specials currently use the owner-requested testing price of 10 gold through the existing purchase/equip system (`SPECIAL_TUNING.testUnlockGold`). Original gem prices remain in the definitions for later balancing.

Model transitions:

1. `finishMove`: validate target, consume charge, persist a `special` phase containing a pre-impact enemy snapshot and chosen target. No damage yet.
2. `resolveFinishMove`: apply the equipped effect and mark `applied` in the same saved state. Repeated calls do nothing.
3. `completeFinishMove`: after animation aftermath, return control or resolve victory. Rewards cannot settle during the special phase.

The browser saves before presentation and immediately at impact. A resumed pending attack plays its anticipation; an already applied attack resumes its aftermath without another damage call. Input and the turn clock remain locked throughout. Reduced motion uses a short static presentation with an announcement and impact feedback. Siren audio uses a synthesized wordless melody, respects sound settings, and fades during descent.

`specialBehind` sits below ship iframes, `specialFront` above them, and announcements/charge controls above both. Effect positions follow world camera coordinates and live ship pose. Kraken rig and Shark victim snapshots survive normal HP synchronization. Seagull aftermath moves the camera back to the player's dancing crew.

## Verification

- `npm test`: model regression suite including charge/miss/repeat, pellets, target damage, invalid targets, impact idempotency, reloads, clock/input locks, and delayed victory.
- `npm run check`: application/model syntax.
- `node scripts/browser-special-attacks.cjs`: all five requested full sequences, phone controls, saved impact, and reduced-motion resume before/after impact.
- PowerShell: `$env:FLIP_VIEWPORTS='1'; node scripts/browser-special-attacks.cjs` checks the opposite portrait/landscape orientation for each attack.

Browser tests seed disposable captains in an isolated browser context; they do not alter the owner's normal save. Screenshots go to `test-results/`. These are Chromium mobile viewport checks, not physical iPhone/Safari verification.

