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
const mapJs = read('js/map.js');
const dataJs = read('js/data.js');
const towerJs = read('js/tower.js');
const enemyJs = read('js/enemy.js');
const projectileJs = read('js/projectile.js');

function readPngSize(path, options = {}) {
  const buffer = readFileSync(path);
  const pngSignature = '89504e470d0a1a0a';
  check(buffer.subarray(0, 8).toString('hex') === pngSignature, `${path} must be a PNG bitmap`);
  if (buffer.length < 24) return { width: 0, height: 0 };
  const colorType = buffer[25];
  if (options.alpha) {
    check(colorType === 4 || colorType === 6, `${path} must include an alpha channel`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

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
  'assets/hero-command.png',
  '#ops-strip',
  '#wave-meter',
  '#wave-progress',
  '.action-group-label',
  '.tower-btn.disabled',
  'body.rotated',
], 'css/style.css');

for (const asset of [
  'assets/hero-command.png',
  'assets/battlefield-hormuz.png',
  'assets/sprites/towers.png',
  'assets/sprites/enemies.png',
  'assets/sprites/projectiles.png',
]) {
  check(existsSync(asset), `${asset} missing`);
}

if (existsSync('assets/hero-command.png')) {
  const size = readPngSize('assets/hero-command.png');
  check(size.width >= 1200, 'assets/hero-command.png must be at least 1200px wide');
  check(size.height >= 700, 'assets/hero-command.png must be at least 700px tall');
}

if (existsSync('assets/battlefield-hormuz.png')) {
  const size = readPngSize('assets/battlefield-hormuz.png');
  check(size.width >= 960, 'assets/battlefield-hormuz.png must be at least 960px wide');
  check(size.height >= 480, 'assets/battlefield-hormuz.png must be at least 480px tall');
}

if (existsSync('assets/sprites/towers.png')) {
  const size = readPngSize('assets/sprites/towers.png', { alpha: true });
  check(size.width >= 576, 'assets/sprites/towers.png must be at least 576px wide');
  check(size.height >= 96, 'assets/sprites/towers.png must be at least 96px tall');
}

if (existsSync('assets/sprites/enemies.png')) {
  const size = readPngSize('assets/sprites/enemies.png', { alpha: true });
  check(size.width >= 1120, 'assets/sprites/enemies.png must be at least 1120px wide');
  check(size.height >= 96, 'assets/sprites/enemies.png must be at least 96px tall');
}

if (existsSync('assets/sprites/projectiles.png')) {
  const size = readPngSize('assets/sprites/projectiles.png', { alpha: true });
  check(size.width >= 320, 'assets/sprites/projectiles.png must be at least 320px wide');
  check(size.height >= 64, 'assets/sprites/projectiles.png must be at least 64px tall');
}

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

includesAll(mapJs, [
  'battlefield-hormuz.png',
  'drawImage',
], 'js/map.js');

includesAll(dataJs, [
  'PATH_START_Y = 170',
  'PATH_END_Y   = 382',
  'const towerSlotCoords',
  '[65, 172]',
  '[865, 104]',
], 'js/data.js');

includesAll(towerJs, [
  'GAME_SPRITES.drawTower',
  'GAME_SPRITES.drawProjectile',
], 'js/tower.js');

includesAll(enemyJs, [
  'GAME_SPRITES.drawEnemy',
], 'js/enemy.js');

includesAll(projectileJs, [
  'GAME_SPRITES.drawProjectile',
], 'js/projectile.js');

check(existsSync('js/assets.js'), 'js/assets.js missing');
if (existsSync('js/assets.js')) {
  const assetsJs = read('js/assets.js');
  includesAll(assetsJs, [
    'assets/sprites/towers.png',
    'assets/sprites/enemies.png',
    'assets/sprites/projectiles.png',
    'drawTower',
    'drawEnemy',
    'drawProjectile',
  ], 'js/assets.js');
}

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
