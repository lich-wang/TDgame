// ============================================================
// 霍尔木兹狂想曲 — 地图绘制
// ============================================================

const BATTLEFIELD_IMAGE = new Image();
BATTLEFIELD_IMAGE.src = 'assets/battlefield-hormuz.png';

function drawMap(ctx, gameState) {
  const W = MAP.WIDTH;
  const H = MAP.HEIGHT;
  const hasBattlefieldImage = BATTLEFIELD_IMAGE.complete && BATTLEFIELD_IMAGE.naturalWidth > 0;

  if (hasBattlefieldImage) {
    ctx.drawImage(BATTLEFIELD_IMAGE, 0, 0, W, MAP.WATER_BOT);
    ctx.fillStyle = 'rgba(3, 9, 14, 0.1)';
    ctx.fillRect(0, 0, W, MAP.WATER_BOT);
  } else {
    drawFallbackMap(ctx, W, H, gameState);
  }

  drawWaterMotion(ctx, gameState);
  drawInteractiveSlots(ctx);
  drawCommandBase(ctx, W, H, hasBattlefieldImage);
}

function drawFallbackMap(ctx, W, H, gameState) {
  const sky = ctx.createLinearGradient(0, 0, 0, MAP.SHORE_Y);
  sky.addColorStop(0, '#1a2a4a');
  sky.addColorStop(1, '#5a8aaa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, MAP.SHORE_Y);

  ctx.fillStyle = '#9c8045';
  ctx.fillRect(0, MAP.SHORE_Y - 18, W, 28);

  const water = ctx.createLinearGradient(0, MAP.WATER_TOP, 0, MAP.WATER_BOT);
  water.addColorStop(0, '#1a4a6a');
  water.addColorStop(1, '#152d3a');
  ctx.fillStyle = water;
  ctx.fillRect(0, MAP.WATER_TOP, W, MAP.WATER_BOT - MAP.WATER_TOP);

  ctx.strokeStyle = 'rgba(180,225,240,0.14)';
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 28]);
  ctx.beginPath();
  ctx.moveTo(MAP.PATH_START_X, MAP.PATH_START_Y);
  ctx.lineTo(MAP.PATH_END_X, MAP.PATH_END_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  drawWaterMotion(ctx, gameState);
}

function drawWaterMotion(ctx, gameState) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let y = MAP.WATER_TOP + 14; y < MAP.WATER_BOT; y += 30) {
    ctx.beginPath();
    for (let x = 0; x <= MAP.WIDTH; x += 8) {
      const wy = y + Math.sin((x + gameState.waveOffset) * 0.025) * 3;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawInteractiveSlots(ctx) {
  const pulse = Math.sin(Date.now() / 900) * 0.25 + 0.75;
  for (const slot of MAP.TOWER_SLOTS) {
    if (slot.occupied) continue;
    ctx.save();
    ctx.fillStyle = `rgba(242,190,90,${0.05 * pulse})`;
    ctx.strokeStyle = `rgba(242,190,90,${0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(slot.x, slot.y + 8, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const minePulse = Math.sin(Date.now() / 760 + 1.5) * 0.25 + 0.75;
  for (const slot of MAP.MINE_SLOTS) {
    if (slot.occupied) continue;
    ctx.save();
    ctx.fillStyle = `rgba(85,205,230,${0.035 * minePulse})`;
    ctx.strokeStyle = `rgba(85,205,230,${0.24 * minePulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(slot.x - 6, slot.y);
    ctx.lineTo(slot.x + 6, slot.y);
    ctx.moveTo(slot.x, slot.y - 6);
    ctx.lineTo(slot.x, slot.y + 6);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCommandBase(ctx, W, H, hasBattlefieldImage) {
  const baseGrad = ctx.createLinearGradient(0, MAP.BASE_Y, 0, H);
  baseGrad.addColorStop(0, hasBattlefieldImage ? 'rgba(16,24,32,0.76)' : '#26323f');
  baseGrad.addColorStop(1, hasBattlefieldImage ? 'rgba(8,12,18,0.94)' : '#111722');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, MAP.BASE_Y, W, H - MAP.BASE_Y);

  ctx.fillStyle = 'rgba(220,180,90,0.1)';
  ctx.fillRect(0, MAP.BASE_Y, W, 1);

  ctx.fillStyle = 'rgba(8,14,20,0.74)';
  ctx.fillRect(22, MAP.BASE_Y + 16, 250, 34);
  ctx.strokeStyle = 'rgba(240,192,80,0.28)';
  ctx.strokeRect(22, MAP.BASE_Y + 16, 250, 34);
  ctx.fillStyle = '#f0c050';
  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.fillText('黄金水道防区 01', 36, MAP.BASE_Y + 37);
  ctx.fillStyle = '#80d0c8';
  ctx.fillText('岸基火控在线', 154, MAP.BASE_Y + 37);
}
