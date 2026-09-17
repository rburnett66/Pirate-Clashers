# Revised hull alignment

The active game now uses `bodies/revised-exterior.png` and the supplied `bodies/xray-hull-nomast-right.png`. All six progression levels use this pair; capacity, health, upgrades and port counts still follow their existing level rules. The 68 old exterior/interior PNGs were moved out of `public/ship-art/hulls` and `public/ship-art/bodies` into `retired-runtime/`. Original source artwork remains preserved.

The new exterior was produced with the built-in ImageGen tool, using the revised mast-free interior as its edit target. It is an AI-assisted matching exterior, not a supplied closed-hull source. The renderer maps its visible source rectangle `[176,383,1393,533]` to the revised interior rectangle `[340,492,1181,469]` (x, y, width, height) on the 1792×1008 canvas. The interior alpha is the common silhouette for both views. Their deck, keel and camera transform therefore stay fixed while toggling. Crew deck anchors were moved to the revised deck surface.

Collision mask version 3 comes from the revised interior silhouette. The old version 2 bitmask remains only as save-migration data, preserving per-section damage fractions. Legacy hole positions are reconstructed for the new shape. Neither old hull artwork nor old hull IDs are used by the active renderer.

Validation: `npm test`, `npm run check`, and `node scripts/browser-ship-art.cjs`. The browser check compares exterior and cutaway alpha silhouettes at every hull level, and covers sail styles, damage, rig destruction and reversible cutaway rendering.

## ImageGen prompt

Edit this exact game hull asset to produce its CLOSED EXTERIOR skin. Input is the NEW approved cutaway boat. Preserve exactly its canvas 1792x1008, position, scale, outer silhouette, keel, bowsprit, curved upper deck line, stern height and all exterior railings. Change ONLY the exposed interior below the upper deck into continuous warm brown exterior wooden planking with restrained dark red trim and gold edging matching this pirate art style. Hide the rooms, hammocks, barrels and structural cross sections behind the planks. Do not add masts, sails, flags, cannons, new decorations or a background. Keep all transparent regions actually alpha transparent, including the huge empty area above the hull. Do not center, crop, enlarge, shrink or rotate the boat. Exact registration to this source is critical because the two images will toggle as exterior and interior of the SAME boat.
