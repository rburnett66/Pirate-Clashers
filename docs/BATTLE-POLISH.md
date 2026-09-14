# PIRATE BASH battle polish

Implemented from the owner's [Pirate Bash Battle Polish](https://docs.google.com/document/d/1BHcVVCeXisdIwCh2gmSIC4Zd-A-zCdDzQGfeEEidtfI/edit), including the movement and crew-reaction additions read on September 14, 2026. MetaMax tracking was suspended for this round at the owner's request while the database binding and tickets were being repaired.

## Battle presentation and controls

- Match introduction uses supplied port artwork, captain portraits, names, trophy counts, ship/sail previews and crew portraits with weapon names and levels. Rivals remain the game's seeded local opponents. The current first crew portrait represents each captain; no separate captain-avatar system is introduced.
- Begin in a close view of deck and hold crew, with exterior hull and sails hidden. Weapon icons, damage specialties and range labels identify selectable crew. The telescope shows both complete ships. The chosen pirate receives a gold pedestal; their name and weapon appear in the bottom bar.
- Forward/backward arrows sit on the water below the player hull and retain the existing two-move budget. Desktop, portrait and short landscape layouts reserve room for the controls and device safe areas.
- Choose a gunner, pull backward and release to fire forward. The gesture remains anchored while the camera moves. A launch direction straight up or backward cancels selection without spending a shot. Escape also cancels. Angle slider, Fire button and Space remain available after choosing a gunner.
- A short, tapering dot arc shows an approximate 15% distance hint. Aiming opens the camera to both ships; flight drifts toward the target. Each new shot requires a gunner selection.
- Attack messages appear in the header. Bold white percentages show hull health; sails and living crew remain separate indicators.

## Damage and reactions

Crew sprites and collision rectangles are 30% larger, with adjusted muzzle positions. Cosmetic wood debris is twice its previous size. Hits shake ships and ocean together, proportional to damage.

Five response strengths span a disappointed miss through a kill celebration. Hits stretch and bounce living crew, seagulls trigger bouncing laughter, and the shark triggers a cringe. Destruction throws surviving crew outward with rotation while the ship fades and sinks beneath a powder-magazine burst. Winners receive a close view with exposed interior, jumping crew and pistol-fire sparks before results.

Destroying both hull and sails defeats a ship regardless of surviving crew. Eliminating all crew while the ship can still be looted awards 10% additional match gold, displayed in results and paid once. Existing turn-limit adjudication and retreat remain available.

The current sounds are synthesized placeholders, not recorded voices. The explosion is an original bounded CSS/particle effect; the linked ShaderToy example could not be retrieved and its shader was not copied. Elaborate finisher character animations remain represented by the existing spectacle, as the design defers those animations.

## Runtime and validation

`src/combat-view.js` contains camera, gesture, dot-arc and reaction math. `src/combat-polish.css` owns the new battle layout. `scripts/hull-adapter.txt` and `scripts/combat-renderer.cjs` generate the ship integration through `npm run build`; supplied prototypes are preserved.

Camera and water updates no longer invoke collision forecasts. Projectiles reuse SVG nodes and sample their precomputed paths instead of rebuilding and filtering complete paths every frame. Crew portrait nodes are cached; ship render surfaces stay a fixed size through zooms; closed match previews are removed. Exact hull-mask collision remains intact rather than adopting the design's optional 2×2 approximation. No physical-phone framerate claim is made.

Validation commands:

```text
npm test
npm run check
node scripts/browser-battle-polish.cjs
node scripts/browser-fullscreen.cjs
node scripts/browser-phone.cjs http://192.168.1.9:4174
```

The battle-polish suite covers the introduction, selection, pedestal, movement, telescope, cancellation, drag release, full enemy turn, steep aim, flight reload, desktop/phone control bounds, seagull reaction, destruction and victory celebration. Screenshots and the report are written under `test-results/battle-polish-*`. Fullscreen checks include simulated safe areas and iPhone fallback paths. These browser checks use Edge/Chromium; physical iPhone Safari and Chrome playtesting remains on the device.
