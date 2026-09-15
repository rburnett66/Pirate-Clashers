"""Deterministic cutouts of the supplied ship art. No generated/repainted artwork.

Run from the project root: python scripts/prepare-ship-art.py
Requires Pillow, NumPy, SciPy and OpenCV. Originals remain in art-review.
"""
from pathlib import Path
import hashlib
import json
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[1]
assert Path.cwd().resolve() == ROOT, 'Run from the project root'
SOURCE = ROOT / 'art-review/ship-art-20260914'
OUT = ROOT / 'public/ship-art'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {'method': 'Deterministic masking; exact horizontal flips; no AI artwork.',
            'canvas': [1792, 1008], 'sources': [], 'hulls': [], 'sailSets': [], 'flags': []}
hulls_only = '--hulls-only' in sys.argv
if hulls_only:
    manifest = json.loads((OUT/'manifest.json').read_text())
    manifest['hulls'] = []
    manifest['sources'] = [s for s in manifest['sources'] if s['category'] != 'hulls']


def save(im, name):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)
    return name


def mask_polygon(size, points):
    im = Image.new('L', size)
    ImageDraw.Draw(im).polygon(points, fill=255)
    return np.array(im) > 0


def components(binary, minimum=500):
    n, labels, stats, centers = cv2.connectedComponentsWithStats(binary.astype('uint8'), 8)
    return labels, [(i, stats[i], centers[i]) for i in range(1, n) if stats[i, 4] >= minimum]


def matte(rgb, hull=False, stem=''):
    """Protect enclosed white fabric. Retain fine rigging holes in hull images.

    Only a narrow edge band is unmatted from the white JPEG background. All
    opaque interior pixels remain exactly equal to the decoded source RGB.
    Neutral ground-shadow pixels become equivalent translucent black.
    """
    a = np.array(rgb).astype(float)
    darkness = 255 - a.min(2)
    chroma = a.max(2) - a.min(2)
    fg = darkness > 18
    shadow = np.zeros(fg.shape, bool)
    if hull:
        # Locate the wooden keel by color, leaving its neutral ground shadow out.
        yy = np.arange(a.shape[0])[:, None]
        wood = (chroma > 12) & (darkness > 35) & (yy > 800)
        bottom = np.where(wood, yy, 0).max(0)
        valid = np.flatnonzero(bottom)
        if len(valid):
            bottom = np.interp(np.arange(a.shape[1]), valid, bottom[valid], left=880, right=880)
            bottom = nd.maximum_filter1d(bottom, 7)
            shadow = (yy > bottom + 2) & (yy > 880) & (chroma < 18) & (a.mean(2) > 80)
        fg &= ~shadow
        if stem != 'IMG_7253':
            # JPEG shading in small rope-ladder gaps is darker than the open
            # white backdrop. Remove that neutral matte above the deck only;
            # white hull paint and the cutaway rooms stay protected.
            neutral = (chroma < 18) & (a.min(2) > 185) & ~body_mask(stem, rgb.size)
            labs, entries = components(neutral, 8)
            fg &= ~np.isin(labs, [i for i, _, _ in entries])
        # Even tiny enclosed white gaps are real openings in rope ladders.
        # White hull paint is below the rail; do not make it translucent.
        protected = nd.binary_fill_holes(fg[740:])
        fg[740:] |= protected
    else:
        fg = nd.binary_fill_holes(nd.binary_closing(fg, iterations=1))
        labs, entries = components(fg)
        fg = np.isin(labs, [i for i, _, _ in entries])

    # Estimate the local foreground from the darkest nearby sample. This is
    # analytical white-matte removal, not texture synthesis or image generation.
    local_min = nd.minimum_filter(a.mean(2), size=5)
    core = fg & ((a.mean(2) <= local_min + 5) | nd.binary_erosion(fg, iterations=2))
    _, nearest = nd.distance_transform_edt(~core, return_indices=True)
    ref = a[nearest[0], nearest[1]]
    edge = nd.binary_dilation(fg, iterations=2) & ~nd.binary_erosion(fg, iterations=2)
    v = 255 - ref
    coverage = np.clip(np.sum((255-a)*v, axis=2) / np.maximum(1, np.sum(v*v, axis=2)), 0, 1)
    alpha = fg.astype(float)
    alpha[edge] = coverage[edge]
    alpha[(~fg) & (darkness < 8)] = 0
    color = a.copy()
    blend = edge & (alpha > 0) & (alpha < 1)
    color[blend] = np.clip((a[blend] - 255*(1-alpha[blend, None])) / alpha[blend, None], 0, 255)
    if hull:
        strength = np.clip((255-a.mean(2))/255, 0, 1)
        strength[strength < .025] = 0
        alpha[shadow] = strength[shadow]
        color[shadow] = 0
        # JPEG ringing can leave isolated one-pixel dashes beside spars.
        # Keep connected artwork, its immediate edge, and the continuous shadow.
        labs, entries = components(alpha > 10/255, 48)
        support = np.isin(labs, [i for i, _, _ in entries])
        alpha[~nd.binary_dilation(support, iterations=1)] = 0
    result = np.dstack((np.rint(color), np.rint(alpha*255))).astype('uint8')
    result[result[:, :, 3] == 0, :3] = 0
    # Store the alpha-only master as well: its RGB is byte-for-byte source data.
    master = Image.fromarray(np.dstack((np.array(rgb), result[:, :, 3])))
    opaque = (result[:, :, 3] == 255) & ~shadow
    assert np.array_equal(result[:, :, :3][opaque], np.array(rgb)[opaque])
    return Image.fromarray(result), master, int(opaque.sum())


def cut_component(im, component_mask, padding=4):
    rgba = np.array(im)
    rgba[:, :, 3] *= nd.binary_dilation(component_mask, iterations=2).astype('uint8')
    rgba[rgba[:, :, 3] == 0, :3] = 0
    piece = Image.fromarray(rgba)
    box = piece.getbbox()
    box = (max(0, box[0]-padding), max(0, box[1]-padding),
           min(im.width, box[2]+padding), min(im.height, box[3]+padding))
    return piece.crop(box), list(box)


def pair(im, stem):
    right = save(im, stem+'-right.png')
    left = save(ImageOps.mirror(im), stem+'-left.png')
    assert np.array_equal(np.array(Image.open(OUT/left)), np.array(im)[:, ::-1])
    return {'right': right, 'left': left}


def body_mask(stem, size):
    # Cut at the visible deck. No hidden pixels are painted in behind masts.
    # Keeping the supplied gunwales/fixtures intact leaves mast feet and short
    # stay attachments visible on the deck, covered by the shared mast roots.
    if stem == 'xray-hull':
        points = [(0,495),(350,495),(525,572),(610,604),(745,666),(904,666),
                  (969,616),(1272,602),(1365,612),(1528,540),(1792,540)]
    elif stem == 'IMG_7300':
        points = [(0,570),(350,570),(510,628),(600,672),(737,740),(920,731),
                  (929,672),(946,648),(1004,630),(1073,619),(1117,634),
                  (1123,614),(1177,590),(1210,570),(1261,566),(1329,543),
                  (1356,535),(1380,548),(1398,574),(1400,620),(1381,643),
                  (1330,661),(1332,680),(1463,610),(1792,605)]
    elif stem in ['IMG_7286','IMG_7287']:
        points = [(0,548),(345,548),(506,620),(625,682),(745,730),(940,701),
                  (1040,652),(1230,624),(1365,614),(1495,585),(1792,585)]
    else:
        points = [(0,570),(350,570),(510,628),(600,672),(737,740),(920,731),
                  (962,690),(1260,658),(1360,681),(1490,605),(1792,605)]
    return mask_polygon(size, points+[(1792,1008),(0,1008)])


files = json.loads((SOURCE/'source-manifest.json').read_text())['files']
if hulls_only:
    files = [e for e in files if e['category'] == 'hulls']
for entry in sorted(files, key=lambda e: (e['category'], e['title'])):
    p = SOURCE/entry['local']
    assert p.stat().st_size == entry['size'], p
    rgb = Image.open(p).convert('RGB')
    assert rgb.size == (1792,1008), p
    stem, category = p.stem, entry['category']
    hull = category == 'hulls' or stem == 'IMG_7253'
    im, master, unchanged = matte(rgb, hull, stem)
    masters = SOURCE/'pixel-masters'/category
    masters.mkdir(parents=True, exist_ok=True)
    master.save(masters/(stem+'.png'))
    manifest['sources'].append({'name':p.name,'category':category,'drive':entry['url'],
        'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'opaquePixelsPreserved':unchanged})
    if category == 'hulls':
        full = pair(im, 'hulls/'+stem)
        rgba = np.array(im)
        rgba[:, :, 3] *= body_mask(stem, im.size).astype('uint8')
        rgba[rgba[:, :, 3] == 0, :3] = 0
        body = pair(Image.fromarray(rgba), 'bodies/'+stem)
        mounts = [[566,657],[807,695],[1133,650]] if stem=='xray-hull' else (
            [[566,706],[807,744],[1133,704]] if stem in ['IMG_7286','IMG_7287'] else
            [[566,696],[807,794],[1133,727]])
        manifest['hulls'].append({'id':stem,'interior':stem=='xray-hull','full':full,'body':body,'mastMounts':mounts})
        if stem == 'xray-hull':
            xray = im
    elif stem == 'IMG_7253':
        manifest['assembledReference'] = pair(im, 'references/'+stem)
    else:
        sheet = save(im, category+'/'+stem+'.png')
        a = np.array(im)
        labs, entries = components(a[:, :, 3] > 128)
        if category == 'sails':
            assert len(entries) == 5, (stem,len(entries))
            sail_entries = sorted([e for e in entries if e[1][4]>50000], key=lambda e:e[2][0])
            flag_entries = sorted([e for e in entries if e[1][4]<=50000], key=lambda e:e[2][0])
            assert len(sail_entries)==3 and len(flag_entries)==2, stem
            record = {'id':stem,'sheet':sheet,'sails':[],'flags':[]}
            for kind, selected in [('sails',sail_entries),('flags',flag_entries)]:
                for j,(i,_,_) in enumerate(selected):
                    piece,box = cut_component(im,labs==i)
                    name = save(piece, 'sails/parts/'+stem+'-'+kind+'-'+str(j+1)+'.png')
                    part = {'image':name,'sourceBox':box}
                    if kind == 'sails':
                        # Retain complete source components and also extract fabric
                        # below the supplied yard, so the shared mast has one yard.
                        w,h = piece.size
                        if j==1:
                            ends = [[46,43],[w-49,132]]
                        else:
                            ends = [[43,37],[w-31,100]]
                        (ax,ay),(bx,by) = ends
                        yy,xx = np.indices((h,w))
                        cloth = np.array(piece)
                        cloth[:, :, 3] *= (yy >= ay+(xx-ax)*(by-ay)/(bx-ax)).astype('uint8')
                        cloth[cloth[:, :, 3]==0,:3] = 0
                        part['cloth'] = save(Image.fromarray(cloth),'sails/cloth/'+stem+'-'+str(j+1)+'.png')
                        part['attachment'] = ends
                    record[kind].append(part)
            manifest['sailSets'].append(record)
        else:
            # Spatial order only: retain the supplied emblems exactly as drawn.
            entries.sort(key=lambda e:(round(e[2][1]/180),e[2][0]))
            for j,(i,_,_) in enumerate(entries):
                piece,box = cut_component(im,labs==i)
                name = save(piece,'flags/parts/flag-'+str(j+1).zfill(2)+'.png')
                manifest['flags'].append({'id':j+1,'image':name,'sourceBox':box})
            manifest['flagSheet'] = sheet
    print('Prepared', category, stem, flush=True)

# Common mast kit from the x-ray original, preserving full-canvas registration.
# A union of pole/crossbar masks avoids slicing overlapping yards by columns.
mast_specs = [
 ('aft', [566,657], [[(504,121),(619,121),(619,294),(595,310),(610,661),(534,661),(533,308),(504,287)],
                    [(412,273),(681,327),(680,362),(412,307)]], [[432,296],[667,345]], [566,132]),
 ('main',[807,695], [[(755,0),(860,0),(860,165),(838,180),(838,699),(783,699),(774,172),(755,153)],
                    [(644,254),(1010,313),(1010,349),(644,297)]], [[659,276],[993,333]], [807,10]),
 ('fore',[1133,650], [[(1112,148),(1153,148),(1160,654),(1104,654)],
                     [(1025,331),(1284,382),(1284,420),(1025,370)]], [[1041,353],[1266,402]], [1132,159])]
manifest['masts'] = []
for name,pivot,polys,yard,flag in mast_specs:
    mask = np.zeros((1008,1792),bool)
    for poly in polys:
        mask |= mask_polygon(xray.size,poly)
    rgba = np.array(xray)
    rgba[:, :, 3] *= mask.astype('uint8')
    rgba[rgba[:, :, 3] == 0,:3] = 0
    images = pair(Image.fromarray(rgba),'masts/'+name)
    manifest['masts'].append({'id':name,'images':images,'pivot':pivot,
        'yard':yard,'flagAnchor':flag,'mirrorPivot':[1791-pivot[0],pivot[1]]})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Complete:',len(manifest['hulls']),'hulls including x-ray;',len(manifest['sailSets']),
      'sail sets;',len(manifest['flags']),'individual flags; 3 shared masts.')
