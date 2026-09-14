# Find Match shadow revision

Owner correction: background removal was too aggressive and removed the drop shadow.

- Output used by the game: `public/menu-art/find-match-shadow-v2.png` (1672×941 RGBA).
- Method: built-in image generation/editing tool, background-extraction edit.
- Original edit target: `art-review/menu-art-20260914/source/find-match.JPG`.
- Error reference: `public/menu-art/find-match__794c6851.png`.
- Original and previous processed artwork are preserved. This output is a regenerated variant; it is not guaranteed pixel-identical to the original. Its transparent alpha, lettering and shadow were inspected, including in the harbor UI.

## Exact edit prompt

Edit target: first image, the original FIND MATCH wooden/brass pirate game button. Second image is a faulty background extraction ONLY for reference to the error: it erased the black drop shadows and dark interior areas. Create a corrected transparent PNG cutout from the FIRST image. Remove ONLY the checkerboard background OUTSIDE the silhouette and soft outer shadow. Retain all original internal dark pixels, letter extrusion, black outlines, wood crevices, cutlass shadows, and the full soft natural dark drop shadow beneath and surrounding the wooden banner. Preserve the original artwork's exact composition, shapes, colors, wood grain, metal ornaments, skull shield, anchor, cutlasses, and engraved lettering. Exact text: FIND MATCH. Do not redesign, redraw, simplify, retouch, brighten, add objects, or change lettering. Genuine transparent alpha outside the art; semitransparent alpha for soft shadow, no checkerboard in the output. Keep entire banner and shadow within canvas with a small transparent margin. Output one wide landscape transparent PNG game UI asset.
