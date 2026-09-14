# Local implementation and source reconciliation

## Source priority and reuse
Owner direction and the seven supplied sources govern the integration. Later economy decisions replace the crew prototype's temporary premium-coin upgrade button: cards plus gold and a persistent gunsmith timer now apply. Ship upgrades consume the exact material table and no gold. Plating is purchased independently for each unlocked hull section, up to eight; only plating and canvas wear, and repairs consume their materials.

scripts/build-game.cjs extracts the original 36-row ROSTER and economy/store tables, and generates the original WebGL water and hull pages with an integration adapter. Source files remain unchanged. The adapter handles configuration, named crew, damage events, telescope visibility, finishers and a cosmetic sail emblem. The camera and transparent iframe color scheme are adjusted for the game layout.

src/model.js owns progression and battle state. src/app.js owns navigation, input and presentation. GPU masks depict damage; they do not determine logical health or rewards. The shared sim.js required by several supplied standalone simulation scripts was not supplied. Their balancing concepts are references, not a claim that the missing simulator runs in this build. The stale econ.playWeek path is not invoked.

The root technical plan is a dependency/complexity plan, not a dated schedule. Its “Done:” lines describe acceptance criteria, not ticket status.

## Explicit local defaults
- New captains start at ship level 3 with four recruited pirates, three assigned stations, 1,800 gold, 40 gems and starter materials.
- Two shots per turn, 30 seconds of active decision time, 24-turn cap. The first local turn belongs to the player. Timeout forfeits remaining shots and ends the hit streak. Dialogs, hidden tabs, shot resolution and finishers pause decision time.
- Hull/crew depletion wins. Logical aiming uses broad hull/crew/sail regions and primary damage types. Secondary roster status tags are shown as data; they are not a complete status-effect simulation. Covered crew currently receive reduced damage rather than an authoritative exposure-window damage model.
- Opponents use unique seeded roster selections near the player's crew level. Temperament influences target selection and battle lines. Rematches preserve the original rival loadout and temperament, accept with 65% probability, and reduce rival accuracy by 20%.
- UTC daily/weekly resets. Weekly top/bottom ten movement is bounded by the 15-port ladder. Only one settlement occurs for the last active week after a long absence; skipped weeks are not farmed. Trade rates use the supplied common rate table.
- Five held chests and five drops per UTC day; opening a chest frees storage but not daily earning capacity. Fifth-chest gems and first-port gems grant once per event.
- 28-day seasons, 50 levels and 100 XP per level. Finishers occupy premium levels 6, 14, 22, 30, 38 and 46. Other local track cells grant gold/gems. At rollover, earned unclaimed rewards are collected once before the season resets. Owned moves remain.
- Canvas acquisition amounts, wear coefficients, figurehead combat percentages and match health are local tuning defaults. Figurehead acquisition plus three upgrades uses all three supplied upgrade-price entries.
- Achievement-triggered bundle offers last two hours, show at most three, and enforce seven-day category cooldowns after decline/expiry. No defeat offer trigger. The supplied six gem packs and four bundles display catalog prices but cannot charge money.
- Portraits use all 36 supplied numbered character images. Final weapon/character art matching, bespoke finisher animation and production audio still need art acceptance. Current battle crew silhouettes come from the supplied renderer.

## Remaining production work
K24–K28 remain follow-ups: remote accounts and authoritative economy/time, real shared boards, storefront receipts/restore, production art/audio, and device/release acceptance. No deployment, mobile packaging or real purchase has been claimed.

Additional fidelity limits remain visible in the local integration: broad aim regions, secondary status mechanics, simplified crew cover, local reward-table defaults, a single cosmetic emblem rather than a textured sail skin, and a simplified port chart. These require source/design review before production acceptance; the review state on the board is not a claim of production completion.

The local static server is for development and listens on loopback only. Fonts use an optional Google Fonts stylesheet with system fallbacks.

## MetaMax integration evidence
Ticket creation, parent/dependency links, relative estimates and status updates work for project 1002. Reality graph calls report a missing database relation named node; this is an unavailable graph bundle, not evidence that code does not exist.

The planning brain MCP preview refused because its current path loses epic parents. Tickets were therefore created through the direct ticket tools as instructed by that refusal.

Coding brain run ca8ea9fb-7df0-40ff-aa5a-c764c55b8462 was requested as an integration-risk review. It followed a code-generation workflow and reported completed, but its persist event explicitly says no usable files were generated and nothing was written. files_written was empty. This is not independent code-review evidence. No MetaMax platform configuration was changed.

The local harness registration remains undelivered because project 1002 has no resolvable organization in that registration path. Undelivered payload:
```json
{"run_id":"pirate-1002-local-build-20260913","project_id":1002,"evidence":{"prompt":"Create epics/stories and build the local Pirate game by reusing supplied sources. Relative complexity only. Project 1002; GitHub later.","harness":"codex"}}
```
