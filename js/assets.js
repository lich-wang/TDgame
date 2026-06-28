// ============================================================
// 霍尔木兹狂想曲 — 位图资产
// ============================================================

const GAME_SPRITES = (() => {
  const sheets = {
    towers: loadImage('assets/sprites/towers.png'),
    enemies: loadImage('assets/sprites/enemies.png'),
    projectiles: loadImage('assets/sprites/projectiles.png'),
  };

  const towerFrames = {
    cannon: 0,
    missile: 1,
    drone: 2,
    mine: 3,
    radar: 4,
    aa: 5,
  };

  const enemyFrames = {
    skiff: 0,
    destroyer: 1,
    cruiser: 2,
    carrier: 3,
    sub: 4,
    fly: 5,
    marine: 6,
  };

  const projectileFrames = {
    shell: 0,
    missile: 1,
    drone: 2,
    aa: 3,
    mine: 4,
  };

  const projectileAngleOffsets = {
    shell: 0,
    missile: 0,
    drone: 0,
    aa: 0,
    mine: 0,
  };

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function ready(image) {
    return image.complete && image.naturalWidth > 0;
  }

  function drawFrame(ctx, image, frame, frameW, frameH, x, y, w, h, angle = 0, alpha = 1) {
    if (!ready(image) || frame == null) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, frame * frameW, 0, frameW, frameH, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function drawTower(ctx, type, level, x, y, options = {}) {
    const baseScale = type === 'mine' ? 0.62 : type === 'radar' ? 0.58 : 0.56;
    const scale = options.scale || baseScale;
    const w = 96 * scale;
    const h = 96 * scale;
    const bob = type === 'mine' ? Math.sin(Date.now() / 500 + level) * 1.2 : 0;
    const yOffset = options.yOffset ?? (type === 'mine' ? -8 : -9);
    const drawY = y + yOffset + bob;
    const drew = drawFrame(ctx, sheets.towers, towerFrames[type], 96, 96, x, drawY, w, h, options.angle || 0);
    if (drew && options.turretAngle != null && (type === 'cannon' || type === 'missile' || type === 'aa')) {
      drawTowerDirection(ctx, type, x, drawY, scale, options.turretAngle);
    }
    return drew;
  }

  function drawTowerDirection(ctx, type, x, y, scale, turretAngle) {
    ctx.save();
    ctx.translate(x, y - 3 * scale);
    ctx.rotate(turretAngle);
    ctx.lineCap = 'round';
    if (type === 'cannon') {
      ctx.strokeStyle = 'rgba(80,218,232,0.88)';
      ctx.lineWidth = Math.max(2, 5 * scale);
      ctx.beginPath();
      ctx.moveTo(2 * scale, 0);
      ctx.lineTo(34 * scale, 0);
      ctx.stroke();
      ctx.fillStyle = 'rgba(245,210,130,0.88)';
      ctx.beginPath();
      ctx.arc(35 * scale, 0, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'missile' || type === 'aa') {
      ctx.strokeStyle = type === 'missile' ? 'rgba(255,190,95,0.8)' : 'rgba(120,225,245,0.82)';
      ctx.lineWidth = Math.max(2, 4 * scale);
      for (const offset of [-7, 0, 7]) {
        ctx.beginPath();
        ctx.moveTo(-2 * scale, offset * scale);
        ctx.lineTo(26 * scale, offset * scale);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawEnemy(ctx, type, x, y, w, h, options = {}) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const typeScale = {
      skiff: [1.55, 2.25],
      destroyer: [1.35, 2.15],
      cruiser: [1.28, 2.05],
      carrier: [1.22, 2.15],
      sub: [1.38, 2.0],
      fly: [2.6, 3.4],
      marine: [3.1, 3.4],
    }[type] || [1.3, 2.0];
    return drawFrame(
      ctx,
      sheets.enemies,
      enemyFrames[type],
      160,
      96,
      cx,
      cy,
      w * typeScale[0],
      h * typeScale[1],
      0,
      options.alpha ?? 1
    );
  }

  function drawProjectile(ctx, type, x, y, size, angle = 0) {
    const frame = projectileFrames[type] ?? projectileFrames.shell;
    const scale = type === 'mine' ? Math.max(28, size * 2.2) : Math.max(22, size * 4.2);
    const correctedAngle = angle + (projectileAngleOffsets[type] ?? 0);
    return drawFrame(ctx, sheets.projectiles, frame, 64, 64, x, y, scale, scale, correctedAngle);
  }

  return {
    drawTower,
    drawEnemy,
    drawProjectile,
  };
})();
