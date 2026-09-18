"""Build a portable static-site ZIP containing only the browser runtime and assets."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
output = ROOT / '.runtime' / 'website-package' / stamp
site = output / 'pirate-bash'
site.mkdir(parents=True)
asset_path = re.compile(r'''(["'`(])/(src|public)/''')
public_pages = {'public/ship.html', 'public/water.html', 'public/water-tuner.html'}
asset_types = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2', '.ttf',
               '.mp3', '.m4a', '.wav', '.ogg', '.webmanifest'}
files = [ROOT / 'index.html']
files += [p for p in (ROOT / 'src').rglob('*') if p.is_file() and p.suffix in {'.js', '.css'}]
files += [p for p in (ROOT / 'public').rglob('*') if p.is_file() and
          (p.suffix.lower() in asset_types or p.relative_to(ROOT).as_posix() in public_pages)]
for source in sorted(files):
    relative = source.relative_to(ROOT)
    target = site / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix.lower() not in {'.html', '.js', '.css', '.webmanifest'}:
        target.write_bytes(source.read_bytes())
        continue
    text = source.read_text(encoding='utf-8')
    # Inline modules and runtime image URLs share the document's game-root base.
    # CSS URLs are resolved from the stylesheet, independently of that base.
    prefix = '../' * len(relative.parts[:-1]) if source.suffix == '.css' else './'
    text = asset_path.sub(lambda m: m[1] + prefix + m[2] + '/', text)
    if source.suffix == '.html':
        base = '../' * len(relative.parts[:-1]) or './'
        text, count = re.subn(r'<head>', '<head><base href="' + base + '">', text, count=1)
        if count != 1:
            raise ValueError(f'Missing document head: {relative}')
    if source.suffix == '.webmanifest':
        manifest = json.loads(text)
        manifest['id'] = manifest['scope'] = manifest['start_url'] = '../'
        for icon in manifest.get('icons', []):
            icon['src'] = icon['src'].replace('./public/', './')
        text = json.dumps(manifest, indent=2)
    if asset_path.search(text):
        raise ValueError(f'Unconverted root asset URL: {relative}')
    target.write_text(text, encoding='utf-8')

readme = '''PIRATE BASH — website upload package

1. Extract this ZIP on your computer.
2. Upload the entire pirate-bash folder to your website's public web directory.
3. Open https://YOUR-WEBSITE/pirate-bash/ (keep the trailing slash).

You may rename the folder, nest it within another folder, or upload its contents
directly to the website root. Keep the index.html, src and public structure intact.
Use a static-file host that serves JavaScript modules and JPEG/PNG/SVG files.
HTTPS enables the normal mobile Share/Copy features. No npm, Python, database or
Node server is needed on the website. Opening index.html with file:// is unsupported.

For WordPress or a site builder, upload the folder using your host's file manager
or SFTP; pasting these files into an HTML editor will not install the game.
Link to the game directly for the best mobile fullscreen and sharing experience.

Optional embedded page (change the src to your uploaded folder):
<iframe src="/pirate-bash/" title="Pirate Bash" allow="fullscreen; clipboard-write; web-share"
  allowfullscreen style="width:100%;height:90dvh;border:0"></iframe>

The package contains the current local build, including unpublished polish fixes.
Progress is saved in each browser on the website's origin. Moving from the Wi-Fi
preview or GitHub site does not automatically move a captain; use Settings >
Export captain / Import backup. Create fresh challenge links on the new website
so recipients land on the right host. Challenges are asynchronous ship snapshots,
not live multiplayer; accounts and payments are not connected.

Before replacing an existing website copy, back up its files. After uploading,
test Ship, Scenery, a battle, Water Workshop, and a new shared challenge on a phone.
Google-hosted fonts are optional; the game has local fallback fonts.
'''
(output / 'UPLOAD-README.txt').write_text(readme, encoding='utf-8')
archive = ROOT / '.runtime' / f'Pirate-Bash-website-{stamp}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=6) as bundle:
    for file in sorted(output.rglob('*')):
        if file.is_file():
            bundle.write(file, file.relative_to(output).as_posix())
print(json.dumps({'zip': str(archive), 'folder': str(site),
                  'files': len(files), 'zipMB': round(archive.stat().st_size / 1024**2, 1)}))
