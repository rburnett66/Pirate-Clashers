# Killstreak artwork

Source: owner's [Killstreaks Google Drive folder](https://drive.google.com/drive/folders/18jgI1vTESlFuG8h5lJM41P1udzplxnw_).
All eleven supplied JPEGs were downloaded and visually inspected. The original bytes remain in `originals/`; these files are not included in the public game's asset bundle.

| Original | Inspected content | Runtime use |
| --- | --- | --- |
| IMG_7338 | Purple tentacles with green undersides | `tentacles.png`, behind enemy ship |
| IMG_7339 | Purple, single-eyed Kraken | `kraken.png`, foreground |
| IMG_7342 | Shark with water/splash | Preserved alternate |
| IMG_7343 | Blue-haired singing siren on a rock | `siren.png` |
| IMG_7348 | Shark without surrounding water | `shark.png` |
| IMG_7349 | Angry white whale | `whale.png` |
| IMG_7350 | Unlit cannonball | `ball.png` |
| IMG_7351 | Flaming cannonball | `flaming-ball.png` |
| IMG_7352 | Streaking fireball | `fireball.png` |
| IMG_7354 | Grey angry whale | Preserved alternate |
| IMG_7355 | Angry gull | `gull.png` |

Transparent PNG derivatives in `public/killstreaks/` were prepared with the image-generation editing tool. They are separate from the originals. The runtime calculates alpha bounds and scales each image uniformly; it does not stretch the artwork. Only the equipped creature's assets are loaded for an attack. Cannonball artwork loads through CSS.

Ejected crew use the existing character portrait matching the chosen victim. Falling rig uses a captured canvas of the actual targeted mast and its remaining sails, before damage.
