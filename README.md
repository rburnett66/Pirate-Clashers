# Pirate Clashers — local playable build

Open http://127.0.0.1:4173 while the development server is running.

## Run
From this project root, with Node.js installed:
```
npm start
```
The server binds only to this computer. Opening index.html directly does not support the module and iframe integration.

## Play
1. Crew → Ship: select a recruited pirate, then a station. Select an occupied station with no pirate selected to remove its gunner.
2. Battle → Set sail: move ahead/back, choose a gunner, adjust the displayed angle, then Fire. Dragging across the battle also changes the angle. Weapon power is fixed; the selected gunner shows projectile, range and damage specialty. Two shots per turn; the local turn clock is 30 seconds and pauses during shot resolution, cinematics, dialogs and while the tab is hidden.
3. Land both shots four turns running to charge your selected finishing move. Finishing moves have skip controls and shorter repeat presentations.
4. Wins earn a chest and gold; losses earn one-third gold and may offer one rematch. Open chests, collect specific crew cards, and upgrade at the gunsmith.
5. Ship upgrades use materials. Equipment includes individual hull sections, canvas, repairs, permanent enhancements, figureheads and sail emblems.
6. Leaders shows local seeded boards, grouped Europe → Americas → Africa / India → Asia → Pacific. Booty contains free/preview reward tracks. Settings provides sound, reduced motion and save export/import.

## Validation
```
npm ci
npm run build
npm run check
npm test
node scripts/browser-combat.cjs
node scripts/browser-acceptance.cjs
```
Browser scripts require the local server and Microsoft Edge at its standard Windows installation path. They use isolated browser profiles and explicit test fixtures; they do not alter the player's existing browser save. Tested with Node 22 and Edge on Windows 11. Generated screenshots and detailed test output go to test-results/.

## Scope
This is a local playable integration, not a live-service release. Progress is stored in this browser; opponents and standings are seeded simulations. Dollar-price catalog buttons are disabled. Captain's Share in Settings is an explicit local preview.

See [implementation notes](docs/LOCAL-BUILD.md) for source reconciliation, defaults and remaining production limitations; [QA evidence](docs/QA-LOCAL.md) for checks and their limits. The original sources, prototypes and artwork are preserved.

MetaMax project 1002 holds 12 epics and 28 stories with relative complexity and dependencies. K01–K23 cover the local build; K24–K28 cover accounts, live boards, payment providers, production assets and release validation. GitHub remote binding is the next separate step.
