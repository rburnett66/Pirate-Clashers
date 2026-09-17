"""Prepare the owner's mast-free interior and replacement masts, without repainting.

Run after prepare-ship-art.py and before build-ship-art-data.py when rebuilding.
Source canvases, opaque RGB pixels and exact horizontal mirrors are preserved.
"""
from pathlib import Path
import hashlib
import json
import cv2
import numpy as np
from scipy import ndimage as nd
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
assert Path.cwd().resolve() == ROOT, 'Run from the project root'
SOURCE = ROOT/'art-review/ship-art-revision'
OUT = ROOT/'public/ship-art'
manifest = json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
sources = json.loads((SOURCE/'source-manifest.json').read_text(encoding='utf-8'))

def cutout(rgb, hull=False):
    a = np.asarray(rgb).astype(float)
    dark, chroma = 255-a.min(2), np.ptp(a, axis=2)
    yy = np.arange(a.shape[0])[:, None]
    shadow = (yy > 916) & (chroma < 20) & (a.mean(2) > 70) if hull else np.zeros(dark.shape, bool)
    foreground = (dark > 20) & ~((chroma < 20) & (a.min(2) > 185)) & ~shadow
    n, labels, stats, _ = cv2.connectedComponentsWithStats(foreground.astype('uint8'), 8)
    foreground = np.isin(labels, [i for i in range(1,n) if stats[i,4] > 300])
    # Estimate coverage only at the existing boundary; the source supplies all color.
    core = nd.binary_erosion(foreground, iterations=2)
    _, nearest = nd.distance_transform_edt(~core, return_indices=True)
    ref = a[nearest[0], nearest[1]]
    edge = nd.binary_dilation(foreground, iterations=2) & ~core
    v = 255-ref
    alpha = foreground.astype(float)
    alpha[edge] = np.clip(np.sum((255-a)*v,axis=2)/np.maximum(1,np.sum(v*v,axis=2)),0,1)[edge]
    alpha[(~foreground)&(dark<8)] = 0
    color = a.copy()
    blend = edge & (alpha>0) & (alpha<1)
    color[blend] = np.clip((a[blend]-255*(1-alpha[blend,None]))/alpha[blend,None],0,255)
    if hull:
        alpha[shadow] = np.clip((255-a.mean(2))/255,0,1)[shadow]
        alpha[shadow & (alpha<.025)] = 0
        color[shadow] = 0
    rgba = np.dstack((np.rint(color),np.rint(alpha*255))).astype('uint8')
    rgba[rgba[:,:,3]==0,:3] = 0
    opaque = core & (rgba[:,:,3]==255)
    assert np.array_equal(rgba[:,:,:3][opaque],np.asarray(rgb)[opaque])
    return Image.fromarray(rgba), Image.fromarray(np.dstack((np.asarray(rgb),rgba[:,:,3]))),int(opaque.sum())

def pair(im, stem):
    paths = {'right':stem+'-right.png','left':stem+'-left.png'}
    for side,p in paths.items():
        target=OUT/p;target.parent.mkdir(parents=True,exist_ok=True)
        (im if side=='right' else ImageOps.mirror(im)).save(target,optimize=True)
    assert np.array_equal(np.asarray(Image.open(OUT/paths['left'])),np.asarray(im)[:,::-1])
    return paths

prepared={};checks=[]
for entry in sources['files']:
    p=SOURCE/entry['local'];assert p.stat().st_size==entry['size']
    rgb=Image.open(p).convert('RGB');assert rgb.size==(1792,1008)
    im,master,opaque=cutout(rgb,'hull' in p.stem)
    prepared[p.stem]=im
    masters=SOURCE/'pixel-masters';masters.mkdir(parents=True,exist_ok=True)
    master.save(masters/p.name)
    record={'name':p.name,'category':'replacement','drive':entry['url'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'opaquePixelsPreserved':opaque}
    manifest['sources']=[s for s in manifest['sources'] if s['name']!=p.name]+[record]
    checks.append(record)

interior=pair(prepared['xray-hull-nomast'],'bodies/xray-hull-nomast')
for h in manifest['hulls']:
    if h['interior']:h['body']=interior

# These are the actual source-image foot, yard and pole-tip coordinates. All
# three masts retain their original registration against the mast-free hull.
specs=[('aft',[562,675],[[430,293],[663,344]],[564,139]),
       ('main',[804,742],[[660,274],[989,333]],[807,10]),
       ('fore',[1134,682],[[1042,357],[1265,396]],[1131,124])]
a=np.asarray(prepared['only-mast']);n,labels,stats,centers=cv2.connectedComponentsWithStats((a[:,:,3]>128).astype('uint8'),8)
objects=sorted([i for i in range(1,n) if stats[i,4]>10000],key=lambda i:centers[i,0]);assert len(objects)==3
manifest['masts']=[]
for (name,pivot,yard,flag),component in zip(specs,objects):
    piece=a.copy();piece[:,:,3]*=nd.binary_dilation(labels==component,iterations=3).astype('uint8');piece[piece[:,:,3]==0,:3]=0
    paths=pair(Image.fromarray(piece),'masts/revised-'+name)
    manifest['masts'].append({'id':name,'images':paths,'pivot':pivot,'yard':yard,'flagAnchor':flag,'mirrorPivot':[1791-pivot[0],pivot[1]]})
for h in manifest['hulls']:h['mastMounts']=[s[1] for s in specs]
template=Image.open(SOURCE/'source/full-ship-template.JPG').convert('RGB')
# The short upper canvases are supplied only in the assembled reference. Cut
# their existing pixels below the yards, keeping the native shape and ratio.
tops=[('main',[(740,151),(925,193),(938,239),(943,278),(936,306),(897,289),(854,279),(803,273),(768,268),(725,266),(734,235),(740,201),(743,173)],[[741,153],[925,193]]),
      ('fore',[(1085,246),(1226,280),(1235,316),(1239,349),(1233,372),(1203,354),(1171,346),(1128,344),(1094,345),(1069,346),(1080,316),(1086,281)],[[1085,248],[1226,280]])]
manifest['upperSails']=[]
for name,poly,attachment in tops:
    alpha=Image.new('L',template.size);ImageDraw.Draw(alpha).polygon(poly,fill=255)
    cloth=template.convert('RGBA');cloth.putalpha(alpha);box=cloth.getbbox();cloth=cloth.crop(box)
    path='sails/cloth/template-upper-'+name+'.png';cloth.save(OUT/path,optimize=True)
    manifest['upperSails'].append({'id':name,'cloth':path,'sourceBox':list(box),'attachment':[[x-box[0],y-box[1]] for x,y in attachment]})
manifest['assemblyTemplate']=sources['template']
exterior=manifest.get('registration',{}).get('exterior')
manifest['registration']={'canvas':[1792,1008],'interior':interior,'mastScale':1,'mastTranslation':[0,0],'source':'owner-supplied mast-free hull and separate masts'}
if exterior:
    manifest['registration']['exterior']=exterior
    manifest['hulls']=[{'id':'revised-hull','interior':False,'body':{'right':'bodies/revised-exterior.png'},'mastMounts':[s[1] for s in specs]}]
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(SOURCE/'verification.json').write_text(json.dumps({'sources':checks,'mirrorPairsChecked':4,'nativeCanvas':[1792,1008]},indent=2)+'\n',encoding='utf-8')
print('Prepared mast-free interior and three registered masts; four exact mirror pairs verified.')
