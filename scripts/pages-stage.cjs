// Stage the playable for GitHub Pages, which serves a project site under /<repo>/.
//
// The game loads its assets by ROOT-ABSOLUTE path (/src/..., /public/...), which resolves to the
// domain root and 404s under a project URL. Rather than change the game's source — those paths are
// correct for `npm start` and for any root-served host — this prefixes them in the PUBLISHED COPY
// only. A prefix keeps every path absolute, so a module shared by pages at different depths (index
// at the root, public/ship.html one down) resolves identically from both.
//
// Usage: node scripts/pages-stage.cjs <outDir> <urlPrefix>   e.g. ... _site /Pirate-Clashers
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const [outDir, rawPrefix] = process.argv.slice(2);
if (!outDir || !rawPrefix) throw Error('usage: pages-stage.cjs <outDir> <urlPrefix>');
const prefix = '/' + rawPrefix.replace(/^\/|\/$/g, '');

const SHIP = ['index.html', 'src', 'public', 'Pirate Art'];   // only what the game needs to run
// `Pirate Art` ships because the crew portraits load from /Pirate%20Art/pirate_segments/...;
// it was missing from the first publish and the characters did not render.
const REWRITE = /\.(html|js|mjs|css|webmanifest|json)$/i;
const out = path.join(root, outDir);

fs.rmSync(out, { recursive: true, force: true });
let copied = 0, rewritten = 0, hits = 0;

const rewrite = (text) => {
  let n = 0;
  const done = text.replace(/(["'`(])\/(src|public|Pirate%20Art|Pirate Art)\//g, (_m, q, dir) => { n++; return `${q}${prefix}/${dir}/`; });
  hits += n;
  return { done, n };
};

const walk = (rel) => {
  const from = path.join(root, rel);
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(path.join(out, rel), { recursive: true });
    for (const entry of fs.readdirSync(from)) walk(path.join(rel, entry));
    return;
  }
  const to = path.join(out, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (REWRITE.test(rel)) {
    const { done, n } = rewrite(fs.readFileSync(from, 'utf8'));
    fs.writeFileSync(to, done);
    if (n) rewritten++;
  } else {
    fs.copyFileSync(from, to);
  }
  copied++;
};

for (const item of SHIP) walk(item);

// The manifest's own scope/start_url are root-absolute for the same reason.
const manifestPath = path.join(out, 'public', 'game.webmanifest');
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  m.id = m.start_url = m.scope = prefix + '/';
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
}

// FAIL LOUD: a staged copy that still points at the domain root would 404 every asset, and the
// page would still return 200 — the failure this script exists to prevent.
const leftovers = [];
const scan = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(p); continue; }
    if (!REWRITE.test(p)) continue;
    if (/(["'`(])\/(src|public|Pirate%20Art|Pirate Art)\//.test(fs.readFileSync(p, 'utf8'))) leftovers.push(path.relative(out, p));
  }
};
scan(out);
if (leftovers.length) throw Error('root-absolute paths survived staging: ' + leftovers.join(', '));
if (!hits) throw Error('no paths were rewritten — the staging step is not doing anything');

console.log(`staged ${copied} file(s) into ${outDir}; ${hits} path(s) prefixed with ${prefix} across ${rewritten} file(s)`);
