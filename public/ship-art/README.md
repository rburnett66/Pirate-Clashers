# PIRATE BASH ship art

Deterministic cutouts from all 48 supplied JPEGs. No AI-generated pixels are used in this pack.

Open `review.html` through the local game server to combine hulls, sails and flags, mirror the assembly, preview the x-ray interior, and toggle each mast together with its attached sail and flag. This is an art assembly preview; these assets have not replaced the gameplay renderer yet.

## Contents

- `hulls/`: 16 exterior designs and one x-ray interior, with original masts/rigging intact. Each has exact left/right PNG variants.
- `bodies/`: the same 17 designs cut at their visible decks for use with the common mast kit, in both directions.
- `masts/`: three shared masts extracted from the x-ray hull, each in both directions. Original full-canvas coordinates are retained.
- `sails/`: 29 transparent set sheets, 87 individual sails, and 58 accompanying pirate flags. `sails/cloth/` contains 87 fabric layers cut below the original yards to avoid double crossbars in the common-mast assembly.
- `flags/`: the transparent source sheet and 33 individual flag cutouts. Numbered spatially; emblems and colors remain as supplied.
- `references/`: the assembled ship in `IMG_7253.JPG`, which was supplied in the sails folder, cut out and mirrored as a reference.
- `manifest.json`: source links/checksums, component rectangles, file paths, mast pivots, yard attachment points and flag anchors.

## Preservation and assembly

The 1792 × 1008 source compositions are retained for full hulls, bodies and masts. Component crops use original-resolution pixels plus transparent padding. Mirrored PNGs are exact horizontal reversals, without resampling.

Opaque interiors retain the decoded JPEG RGB values. Only the white background, narrow antialiased boundaries, and neutral ground-shadow matte are processed. White fabric is enclosed before background removal; hull rigging openings use a separate mask. Edge colors are analytically unmatted to prevent a white halo, and the ground shadow is represented as translucent black. No texture is invented or repainted.

The untouched JPEGs remain in `art-review/ship-art-20260914/source/`. Alpha-only masters in the sibling `pixel-masters/` folder retain **all** original RGB pixels, including the background, for later mask adjustments. The earlier AI-assisted sample is not part of this pack.

Mast coordinates and hull mounting points use source-image pixels. In the preview, each mast translates to its hull mount without stretching. The same transforms stay in place when opening the interior. A mast owns its sail and flag; mirroring applies to the whole assembly. Flags keep their supplied poles; sail fabric attaches to the common mast's yard.

The body cuts preserve the visible deck and short mast/stay feet. Hidden wood behind the original masts is not synthesized. The x-ray hull is its own supplied silhouette, so it is not an exact outline match for every exterior skin; gameplay integration will need a hull-specific interior opening mask.

## Rebuild

From the project root, run `python scripts/prepare-ship-art.py` with Pillow, NumPy, SciPy and OpenCV installed. The script checks source sizes, original canvas dimensions, unchanged opaque pixels, the five components in every sail set, and exact mirror equality. Source provenance is recorded in the manifest.
