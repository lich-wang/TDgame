import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(source, items, label) {
  for (const item of items) {
    check(source.includes(item), `${label} missing ${item}`);
  }
}

const html = read('index.html');
const css = read('css/style.css');
const gameJs = read('js/game.js');
const uiJs = read('js/ui.js');

includesAll(html, [
  'id="game-container"',
  'id="start-screen"',
  'id="top-bar"',
  'id="ops-strip"',
  'id="news-ticker"',
  'id="game-canvas"',
  'id="bottom-panel"',
  'id="wave-info"',
  'id="money-display"',
  'id="oil-ship-count"',
  'id="rep-display"',
  'id="condition-display"',
  'id="selected-display"',
  'id="wave-progress"',
], 'index.html');

const expectedScripts = [
  'js/data.js',
  'js/economy.js',
  'js/projectile.js',
  'js/enemy.js',
  'js/tower.js',
  'js/map.js',
  'js/events.js',
  'js/ui.js',
  'js/game.js',
];
let lastIndex = -1;
for (const script of expectedScripts) {
  const index = html.indexOf(`src="${script}"`);
  check(index > lastIndex, `script order invalid for ${script}`);
  lastIndex = index;
}

includesAll(css, [
  '.start-panel',
  '.start-metrics',
  '#ops-strip',
  '#wave-meter',
  '#wave-progress',
  '.action-group-label',
  '.tower-btn.disabled',
  'body.rotated',
], 'css/style.css');

includesAll(gameJs, [
  '_getCanvasPoint',
  '_placeTower',
  '_lastHoverMineSlot',
  "this.selectedTowerType === 'mine'",
], 'js/game.js');

check(
  gameJs.includes('this._placeTower(this.selectedTowerType, this._lastHoverMineSlot)') ||
    gameJs.includes('this._placeTower(\'mine\', this._lastHoverMineSlot)') ||
    gameJs.includes('this._placeTower("mine", this._lastHoverMineSlot)'),
  'js/game.js must place mines through _lastHoverMineSlot'
);

includesAll(uiJs, [
  'condition-display',
  'selected-display',
  'wave-progress',
], 'js/ui.js');

check(existsSync('wrangler.toml'), 'wrangler.toml missing');
if (existsSync('wrangler.toml')) {
  const wrangler = read('wrangler.toml');
  includesAll(wrangler, [
    'name = "game"',
    'main = "worker.js"',
    'compatibility_date = "2026-05-24"',
  ], 'wrangler.toml');
}

check(existsSync('.github/workflows/deploy.yml'), '.github/workflows/deploy.yml missing');
if (existsSync('.github/workflows/deploy.yml')) {
  const workflow = read('.github/workflows/deploy.yml');
  includesAll(workflow, [
    'branches: [main]',
    'npm run verify',
    'wrangler deploy',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ], '.github/workflows/deploy.yml');
}

check(existsSync('.gitignore'), '.gitignore missing');
if (existsSync('.gitignore')) {
  const gitignore = read('.gitignore');
  includesAll(gitignore, [
    '.env',
    '.env.local',
    '.dev.vars',
    '.wrangler',
    'node_modules',
  ], '.gitignore');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Static project checks passed.');
