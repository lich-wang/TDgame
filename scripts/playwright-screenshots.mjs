import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const root = 'dist';
const outDir = 'artifacts/playwright';
mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let filePath = normalize(join(root, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (!existsSync(filePath)) filePath = join(root, 'index.html');
  res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({ headless: true });

async function scenario(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#btn-start');
  await page.screenshot({ path: `${outDir}/start-desktop.png`, fullPage: true });
  await page.click('#btn-start');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    if (game._prepTimer) {
      clearTimeout(game._prepTimer);
      game._prepTimer = null;
    }
    game.economy.money = 2000;
    const placements = [
      ['cannon', MAP.TOWER_SLOTS[0]],
      ['missile', MAP.TOWER_SLOTS[1]],
      ['drone', MAP.TOWER_SLOTS[2]],
      ['radar', MAP.TOWER_SLOTS[3]],
      ['aa', MAP.TOWER_SLOTS[4]],
      ['cannon', MAP.TOWER_SLOTS[5]],
      ['missile', MAP.TOWER_SLOTS[6]],
      ['drone', MAP.TOWER_SLOTS[7]],
      ['radar', MAP.TOWER_SLOTS[8]],
      ['aa', MAP.TOWER_SLOTS[9]],
      ['cannon', MAP.TOWER_SLOTS[10]],
    ];
    for (const [type, slot] of placements) {
      if (!slot.occupied) game._placeTower(type, slot);
    }
    game._placeMinelayer(MAP.MINE_SLOTS[3]);
    game.enemies = [];
    game.projectiles = [];
    game.currentWave = 6;
    game.waveActive = true;
    game._spawnEnemy('carrier');
    game._spawnEnemy('destroyer');
    game._spawnEnemy('sub');
    game._spawnEnemy('fly');
    game.enemies.forEach((enemy, index) => {
      enemy.x = 760 - index * 130;
      enemy.y += index * 18;
    });
    if (game.minelayers[0]) {
      const boat = game.minelayers[0];
      boat.x = 520;
      boat.y = 285;
      boat.mineTimer = 0;
      boat.layMine();
      if (game.enemies[1]) {
        game.enemies[1].x = 570;
        game.enemies[1].y = 260;
        game.enemies[1].attackCooldown = 0;
        game.enemies[1]._attackMinelayers(0.2, game);
      }
    }
    if (game.enemies[0]) {
      game.projectiles.push(new Projectile(420, 150, game.enemies[0], 10, {
        speed: 5,
        size: 6,
        spriteKey: 'missile',
        trail: true,
      }));
    }
    game.render();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/battle-desktop.png`, fullPage: true });
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await scenario(desktop);
await desktop.close();

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
await mobile.click('#btn-start');
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: `${outDir}/mobile-portrait.png` });
await mobile.close();

await browser.close();
server.close();

console.log(`Playwright screenshots saved to ${outDir}`);
