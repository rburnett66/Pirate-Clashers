# Battle sky assets

Original Drive JPGs are retained unchanged in `sources/`.

- `IMG_7309.JPG`: white clouds, Drive file `15MNlF9SfKO8c9zMQW7aVNgbGyVq3Hxwq`.
- `IMG_7310.JPG`: storm clouds, Drive file `1L1Ge41UtS-NQfT4_q213kUnW7MPBk5EW` (retained, unused).
- `IMG_7311.JPG`: smoke puffs, Drive file `1oL828yMiYFOp185MlvPK3QKLwIy8R-zS` (retained, unused).
- Folder: https://drive.google.com/drive/folders/1cDothZlV8NIUaKL6x0s3q3QECW0SQVyB
- City reference: existing `public/menu-art/bombay__ab7b9def.png`, from supplied `bombay.JPG`, Drive file `18NgWIYTJXENqxYTkP7-UzVDiUIJbUtgj`.

Built-in ImageGen produced the transparent PNG derivatives in `public/sky-art/`. These are AI-assisted extractions/adaptations, not byte-exact source crops. The cloud atlas contains four equal 768×512 cells on a 1536×1024 canvas. The city is a separate transparent 1536×1024 asset. The runtime reuses the atlas at scales .32, .50, .74 and 1, with progressively stronger opacity, motion and camera parallax. The city base follows the far ocean row. Game motion settings and OS reduced-motion settings stop cloud drift.

## Cloud prompt

Use case: background-extraction. Create a transparent PNG sprite atlas from the supplied white cloud artwork. Extract four distinct complete clouds from the reference (the broad upper-left cloud, triangular center cloud, small left-middle cloud, and broad right-middle cloud). Remove all blue sky. Preserve the supplied painterly white shapes and soft pale blue shading faithfully, no redesign. Arrange these FOUR isolated clouds in an exact 2 by 2 equal-cell grid on a 1536 by 1024 transparent canvas. One cloud fully inside each cell, centered, with at least 40 pixels transparent margin on all sides of each cell. Each cloud should fill most of its cell width; preserve natural aspect ratio. True alpha transparency, no checkerboard, no text, no borders, no shadows outside clouds. This atlas will be cut into equal rectangular cells by the game renderer.

## City prompt

Use case: background-extraction. Edit target: supplied Bombay pirate harbor illustration. Extract the existing coastal city, its golden dome, blue and red buildings, palms and wooded cliffs as one distant horizon cutout. Keep recognizable original architecture and painterly style. Remove ALL blue sky and clouds and ALL sea water to actual transparency. Remove foreground dock, treasure and foreground market stalls so the result reads as the distant city shoreline, with a nearly horizontal coastal base. Wide 1536x1024 transparent PNG canvas with the extracted city centered, entire silhouette visible, clear transparent margins. No invented buildings, no new text, no solid background, no checkerboard. This will be rendered very small, behind ocean waves.
