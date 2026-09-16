// Publish the playable to the PUBLIC play repo, which GitHub Pages serves.
//
// This repo stays PRIVATE: it holds the source, docs, prototypes and art. Only the built game
// (index.html + src/ + public/) is pushed to rburnett66/pirate-bash, and Pages serves that repo's
// main branch at https://rburnett66.github.io/pirate-bash/.
//
// Run:  npm run publish:play        (tests first — a broken build must not ship)
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const PLAY_REPO = 'https://github.com/rburnett66/pirate-bash.git';
const PREFIX = 'pirate-bash';                 // the Pages project path; asset paths are prefixed with it
const SHIP = ['index.html', 'src', 'public', 'Pirate Art'];
const work = path.join(root, '.publish');
const staged = path.join(root, '_site');

const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' });

execFileSync(process.execPath, ['scripts/pages-stage.cjs', '_site', PREFIX],
             { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(path.join(work, '.git'))) {
  fs.rmSync(work, { recursive: true, force: true });
  execFileSync('git', ['clone', '--depth', '1', PLAY_REPO, work], { stdio: 'inherit' });
} else {
  git(['fetch', '--depth', '1', 'origin', 'main'], work);
  git(['reset', '--hard', 'origin/main'], work);
}

for (const item of SHIP) fs.rmSync(path.join(work, item), { recursive: true, force: true });
for (const item of SHIP) fs.cpSync(path.join(staged, item), path.join(work, item), { recursive: true });
fs.rmSync(staged, { recursive: true, force: true });

git(['add', '-A'], work);
if (!git(['status', '--porcelain'], work).trim()) {
  console.log('play repo already matches this build — nothing to publish');
  process.exit(0);
}
const sha = git(['rev-parse', '--short', 'HEAD'], root).trim();
git(['commit', '-m', `PIRATE BASH — playable build from ${sha}`], work);
git(['push', 'origin', 'main'], work);
console.log(`published ${sha} → https://rburnett66.github.io/${PREFIX}/ (Pages redeploys in about a minute)`);
