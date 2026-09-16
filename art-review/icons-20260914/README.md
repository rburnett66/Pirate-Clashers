# Pirate Bash icon review
Public name: Pirate Bash. Internal project and gameplay code unchanged.
Source: six original JPG icons from the approved Google Drive Menu Art folder:
https://drive.google.com/drive/folders/1CYvkML4lKWp31n-0Tv05JqStDHlK1UL8

- source/: original downloaded JPGs, preserved byte-for-byte through processing.
- processed/images/: six transparent PNG review exports produced by Game Asset Studio.
- Pirate-Bash-icons.gas: saved Studio project with per-image settings; every asset is Needs Review.
- icon-review.jpg: current PNGs over light and dark backgrounds.
- icon-review-adjusted.jpg: comparison experiment, not the final export set.
- verification.json: source hashes, output dimensions and alpha checks.

These are review exports, not production-ready assets. Crew and fight use the improved per-image pass. The offline color-based mask still leaves shadow residue and/or removes dark interior details, particularly in chest, gift, map and options. Gray/black backgrounds overlap wanted wood/metal/shadow colors. Precise foreground masking is still needed before approval, canvas normalization or atlas packing. No game files were changed and no atlas was built.
