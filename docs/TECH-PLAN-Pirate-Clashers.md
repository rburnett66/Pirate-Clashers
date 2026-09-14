# Pirate Clashers — agentic integration plan

Project 1002. Owner direction: create epics/stories and build the local game; target a couple of hours. No dates, staffing model or conversion of complexity to elapsed time. GitHub later. All work stays in this Pirate folder and its MetaMax records.

## Execution
Reuse the five supplied HTML prototypes, five JS balance models, and existing Pirate Art. Complexity: 1 trivial, 2 small adapter, 3 bounded integration, 5 cross-system integration, 8 external/architectural uncertainty. Follow dependencies, not calendar dates. K01–K23 are the local playable implementation; K24–K28 explicitly track service/provider and final production work that cannot honestly be represented as completed by a local build. Target duration is not a guarantee of unconfigured external services.

Planning brain preview refused its current MCP path because it loses epic parents. Work is filed through create_ticket as directed by the tool. Reality is UNGRADED: the graph bundle is unavailable (missing node table). Local code now exists. The seven local source documents were read; no MetaMax source documents were listed.

## Reuse map
- Water: original simPass/render, shared GLSL drawnHeight, camera, particles and latest 64×12 state. Preserve shader-only owner prototype; do not rebuild into CPU water merely for a hypothetical live-PvP requirement.
- Hull: scatterPoints/stampPass/fire/applyCrewDamage/applyRigDamage/breakMast/render/updateScopeLabels. Actual crew/rig behavior exists beyond the older notes. Add integration API and connect authoritative local battle events.
- Crew: ROSTER, BASE, RARITY_MULT, stats, LADDER, positions/onSlot, cards/details. Preserve all names and roles; replace demo-only wallet/state.
- Leaderboard: rng/makePlayer/playMatch/elo, PORTS, chart/zoom/board and scouting patterns. Adapt shared roster and persistent local scores.
- Booty: MOVES/buildSeason/cellState/claim/render/centreOnLevel and synchronized lanes. Replace temporary claims with shared save.
- Economy: econ.js tables, run.js progression, plating.js/rematch.js battle studies and store.js catalog. Old econ.playWeek is stale (references missing MATCH.chestChance); do not call it as the current economy.
- Art: use inspected supplied PNG segments; filename count is not finished-character coverage.

## Working decisions
Use later explicit source reconciliation: cards+gold+bench time; purchasable gems reserved for a real provider integration; level-free weekly ports; latest 12-row sea. Local build uses a clearly labeled local profile and seeded rivals. No claim of account security or live networking. New local profile/demo grants must be labeled; currency cannot be bought for real without a provider.
Core GDD and deconstruct are missing: document local assumptions rather than invent their text. Baseline two player shots per turn, local game state independent of cosmetic GPU masks, hull/crew victory and 24-turn cap. Retain proposals as configurable defaults: 50 season levels, one finisher after four consecutive dual-hit turns, simulated rematch 65%/-20%, one per loss. Season duration/price, queue/duplicate policy, durable equipment tuning and season rewards use explicit local defaults in docs/LOCAL-BUILD.md. Ship upgrades are materials only.
Honor UI rail/shared wallet, landscape focus, four states, keyboard/focus, 44px controls, reduced motion. Do not reset unopened chests when daily earning capacity resets. Do not confuse visual holes with simulated structural flooding. No speculative new networking stack, art remake, or water research experiments on the local critical path.

## Epics and stories

### E01 — Resolve design and delivery baseline

Source: sources/pirate-clashers-ux-handoff.md

#### K01 — Reconcile prototype interfaces and shared rules

Complexity 2; depends on none. Local delivery.

Done: Record source precedence and missing GDD assumptions; map actual reusable functions and data. Keep local playable scope distinct from later service integration.

### E02 — Establish local game foundation and shared UI

Source: sources/pirate-clashers-ux-handoff.md

#### K02 — Create local app shell and persistent shared state

Complexity 5; depends on K01. Local delivery.

Done: One landscape shell with shared wallet, navigation and versioned local saves; reload retains progress; local Git/build commands documented.
#### K24 — Add remote authority and account synchronization

Complexity 8; depends on K23. Follow-up beyond local delivery.

Done: Follow-up beyond local target: configured account/service saves, conflict/retry and cross-device sync with authoritative economy/time; requires chosen service and credentials.

### E03 — Integrate sea, ships and destructive combat

Source: sources/pirate-clashers-hull-damage.md

#### K04 — Embed supplied water and ship rendering

Complexity 5; depends on K02. Local delivery.

Done: Reuse water and hull shaders, expose lifecycle API, render two ships over water and handle resize/WebGL failure without rebuilding effects.
#### K05 — Connect attacks to damage, crew and rig effects

Complexity 5; depends on K03, K04. Local delivery.

Done: Player aims at enemy; shared weapon/target rules drive hull, sail and crew state; supplied scatter, mask, burn and mast effects respond to hits.
#### K06 — Complete playable battle turns and outcomes

Complexity 5; depends on K05. Local delivery.

Done: Two shots per turn baseline, enemy turns, damage/accuracy, victory/loss and round cap; controls lock during resolution; saved match can recover.

### E04 — Deliver crew collection and ship loadouts

Source: sources/pirate-clashers-crew.md

#### K03 — Reuse roster and wire crew placement

Complexity 3; depends on K02. Local delivery.

Done: Import all 36 actual roster rows and stats; eight-level station ladder; no duplicate or locked placements; collection/details and loadout persist.

### E05 — Deliver opponents, battle flow and rematches

Source: sources/pirate-clashers-leaderboard.md

#### K07 — Reuse opponent simulation and temperament

Complexity 3; depends on K03, K06. Local delivery.

Done: Use supplied seeded captain/rating/loadout logic as reference for real roster opponents; enemy actions and emotes reflect temperament and current crew.
#### K08 — Build result, learning and rematch flow

Complexity 3; depends on K07. Local delivery.

Done: Loss-only one rematch, simulated 65% acceptance and -20% accuracy; refusal grants nothing; results explain damage/rewards and no defeat sales pitch.

### E06 — Deliver rewards, upgrades and material economy

Source: sources/pirate-clashers-economy.md

#### K09 — Wire rewards, chest contents and daily capacity

Complexity 3; depends on K08, K02. Local delivery.

Done: Full win gold/one chest, one-third loss gold; four tiers and specific-pirate cards; five slots, daily reset without discarded contents; once-only claims and fifth-chest gems.
#### K10 — Wire gunsmith timers and ship progression

Complexity 3; depends on K09, K03. Local delivery.

Done: Cards/gold upgrades, persisted bench timer and gem skip; approved materials ship ladder; no negative wallets or duplicate completion.
#### K11 — Wire port hauls and Trade Shop exchange

Complexity 3; depends on K10. Local delivery.

Done: Trade material surplus with fee/stock limits; smaller stay haul and travel haul; first-visit gem award once.

### E07 — Deliver ports and weekly competition

Source: sources/pirate-clashers-leaderboard.md

#### K12 — Reuse Ports chart and board presentation

Complexity 3; depends on K07, K02. Local delivery.

Done: Use supplied port list/chart and ranking behavior; 100-seat boards, own row and captain scouting; no progression level gates.
#### K13 — Persist weekly standings and promotion

Complexity 3; depends on K12, K11. Local delivery.

Done: Monday reset with deterministic tie ordering; top/bottom ten movement with bounds; one settlement/haul per week; local clock limitations documented.
#### K25 — Connect shared player boards and ghost population

Complexity 5; depends on K24. Follow-up beyond local delivery.

Done: Follow-up: submit verified scores, replace seeds with real profiles and server-side settlement; no claim that local seeded opponents are network players.

### E08 — Deliver ship equipment and repair economy

Source: sources/pirate-clashers-economy.md

#### K14 — Wire equipment, canvas and repairs

Complexity 3; depends on K11, K05. Local delivery.

Done: Supplied plating/canvas protection, wear and material repairs; worn equipment never blocks battle; costs shown and state saved.
#### K15 — Wire enhancements, figureheads and cosmetic loadout

Complexity 3; depends on K14. Local delivery.

Done: Reuse supplied four-system and six-figurehead tables; one equipped figurehead, permanent upgrades and gold-only sail cosmetics influence/display correctly.

### E09 — Deliver finishing moves and Pirate's Booty

Source: sources/pirate-clashers-booty.md

#### K16 — Wire all six finishing moves into battle

Complexity 5; depends on K06. Local delivery.

Done: Four consecutive dual-hit turns charge selected owned move once per match; each move affects its specified target; poster/animation/cheer and timer pause/short repeat mode.
#### K17 — Reuse Booty track and persistent claims

Complexity 3; depends on K09, K16. Local delivery.

Done: 50-level free/paid track with aligned wide cells, current-level focus and single/bulk claim; progress/claims persist; local premium demonstration clearly separate from real purchase.
#### K18 — Wire quests and season lifecycle

Complexity 3; depends on K17, K13. Local delivery.

Done: Match/daily/weekly progress grants XP once; season clock and rollover/catch-up policy explicit; unlocked moves survive rollover.

### E10 — Deliver store and purchase lifecycle

Source: sources/pirate-clashers-ux-handoff.md

#### K19 — Build Store from supplied catalog and offers

Complexity 3; depends on K11, K15, K17. Local delivery.

Done: Six gem packs/four bundles, item/offer layouts, max three offers, real expiry/cooldown, no loss trigger; no fake charge or misleading real purchase success.
#### K26 — Connect real storefront purchases and restore

Complexity 8; depends on K24, K19. Follow-up beyond local delivery.

Done: Follow-up: selected provider sandbox receipts, restore/cancel/pending/duplicate callback coverage; live enablement separate. Local build must not simulate real payment success.

### E11 — Produce and integrate release art and sound

Source: sources/pirate-clashers-ux-handoff.md

#### K20 — Reuse existing pirate art and unify presentation

Complexity 3; depends on K03, K04. Local delivery.

Done: Inspect supplied segmented images; use suitable art in crew/battle/UI, preserve source attribution, shared palette/type and readable landscape layouts.
#### K21 — Add onboarding, sound and accessibility settings

Complexity 3; depends on K08, K20. Local delivery.

Done: First-run explains placement/aim/finisher/rewards; mute and reduced-motion controls, keyboard/focus, Escape sheets, minimum tap targets and usable error states.
#### K27 — Complete missing production art and audio

Complexity 5; depends on K23, K20. Follow-up beyond local delivery.

Done: Follow-up: inspect remaining asset gaps against all 36 pirates/six finishers; replace only missing placeholders and obtain owner art acceptance; no blanket recreation of supplied art.

### E12 — Validate full game and prepare release candidate

Source: sources/pirate-clashers-ux-handoff.md

#### K22 — Verify battle and progression invariants

Complexity 5; depends on K13, K15, K18, K19, K21. Local delivery.

Done: Meaningful tests cover placement, battle outcomes/rematch, wallet/claims/timers, weekly/season rollover and restart; all pass and source-model discrepancies recorded.
#### K23 — Run browser QA and deliver local game

Complexity 3; depends on K22. Local delivery.

Done: Play through shell→crew→battle→result→rewards→upgrade; inspect landscape/PC views, console and WebGL; fix defects; provide local URL/start command and truthful limitations.
#### K28 — Validate live release readiness

Complexity 5; depends on K25, K26, K27. Follow-up beyond local delivery.

Done: Follow-up: real target-phone performance, network/purchase recovery and owner acceptance; platform distribution/GitHub connection separate from local build.
