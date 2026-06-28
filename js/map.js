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
    ctx.fillStyle = 'rgba(4, 10, 14, 0.12)';
    ctx.fillRect(0, 0, W, MAP.WATER_BOT);
  }

  // === 天空 ===
  const skyGrad = ctx.createLinearGradient(0, 0, 0, MAP.SHORE_Y);
  skyGrad.addColorStop(0, hasBattlefieldImage ? 'rgba(26,42,74,0.2)' : '#1a2a4a');
  skyGrad.addColorStop(0.5, hasBattlefieldImage ? 'rgba(42,74,106,0.12)' : '#2a4a6a');
  skyGrad.addColorStop(1, hasBattlefieldImage ? 'rgba(90,138,170,0.1)' : '#5a8aaa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, MAP.SHORE_Y);

  // 星空
  ctx.fillStyle = '#ffffff88';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + 50) % W;
    const sy = (i * 89 + 30) % (MAP.SHORE_Y - 20);
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // === 海岸线区域 ===
  // 沙子
  ctx.fillStyle = hasBattlefieldImage ? 'rgba(196,164,82,0.22)' : '#c4a452';
  ctx.fillRect(0, MAP.SHORE_Y - 20, W, 30);
  // 海岸地面
  const shoreGrad = ctx.createLinearGradient(0, MAP.SHORE_Y - 20, 0, MAP.SHORE_Y);
  shoreGrad.addColorStop(0, hasBattlefieldImage ? 'rgba(212,180,98,0.28)' : '#d4b462');
  shoreGrad.addColorStop(1, hasBattlefieldImage ? 'rgba(138,106,58,0.22)' : '#8a6a3a');
  ctx.fillStyle = shoreGrad;
  ctx.fillRect(0, MAP.SHORE_Y - 20, W, 25);

  // 波斯旗帜（左上角）
  ctx.fillStyle = '#228833';
  ctx.fillRect(10, 8, 30, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 8, 30, 6);
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(10, 20, 30, 6);
  ctx.fillStyle = '#c0b090';
  ctx.font = '9px sans-serif';
  ctx.fillText('波斯', 11, 30);

  // === 水道 ===
  const waterGrad = ctx.createLinearGradient(0, MAP.WATER_TOP, 0, MAP.WATER_BOT);
  waterGrad.addColorStop(0, hasBattlefieldImage ? 'rgba(26,74,106,0.18)' : '#1a4a6a');
  waterGrad.addColorStop(0.3, hasBattlefieldImage ? 'rgba(26,85,112,0.12)' : '#1a5570');
  waterGrad.addColorStop(0.7, hasBattlefieldImage ? 'rgba(26,74,101,0.14)' : '#1a4a65');
  waterGrad.addColorStop(1, hasBattlefieldImage ? 'rgba(21,45,58,0.2)' : '#152d3a');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, MAP.WATER_TOP, W, MAP.WATER_BOT - MAP.WATER_TOP);

  // 战区水面光带
  const laneGrad = ctx.createLinearGradient(MAP.PATH_START_X, MAP.PATH_START_Y, MAP.PATH_END_X, MAP.PATH_END_Y);
  laneGrad.addColorStop(0, 'rgba(255,95,80,0.22)');
  laneGrad.addColorStop(0.5, 'rgba(240,192,80,0.12)');
  laneGrad.addColorStop(1, 'rgba(80,200,240,0.16)');
  ctx.save();
  ctx.lineWidth = 64;
  ctx.strokeStyle = laneGrad;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(MAP.PATH_START_X, MAP.PATH_START_Y);
  ctx.lineTo(MAP.PATH_END_X, MAP.PATH_END_Y);
  ctx.stroke();
  ctx.restore();

  // 水面波纹
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let y = MAP.WATER_TOP + 10; y < MAP.WATER_BOT; y += 25) {
    ctx.beginPath();
    for (let x = 0; x < W; x += 5) {
      const wy = y + Math.sin((x + gameState.waveOffset) * 0.03) * 4;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  // 航道虚线（斜向）
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([20, 30]);
  ctx.beginPath();
  ctx.moveTo(MAP.PATH_START_X, MAP.PATH_START_Y);
  ctx.lineTo(MAP.PATH_END_X, MAP.PATH_END_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  // 舰队方向箭头
  ctx.save();
  ctx.fillStyle = 'rgba(255,210,120,0.52)';
  for (let i = 0; i < 5; i++) {
    const t = 0.16 + i * 0.16 + (gameState.waveOffset % 120) / 900;
    const px = MAP.PATH_START_X + (MAP.PATH_END_X - MAP.PATH_START_X) * (t % 0.94);
    const py = MAP.PATH_START_Y + (MAP.PATH_END_Y - MAP.PATH_START_Y) * (t % 0.94);
    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px + 8, py - 8);
    ctx.lineTo(px + 4, py);
    ctx.lineTo(px + 8, py + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // 油轮航道（虚线、不同颜色）
  ctx.strokeStyle = 'rgba(200,180,100,0.1)';
  ctx.setLineDash([10, 25]);
  ctx.beginPath();
  ctx.moveTo(MAP.OIL_PATH_START_X, MAP.OIL_PATH_START_Y);
  ctx.lineTo(MAP.OIL_PATH_END_X, MAP.OIL_PATH_END_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // === 鹰酱基地（底部） ===
  const baseGrad = ctx.createLinearGradient(0, MAP.BASE_Y, 0, H);
  baseGrad.addColorStop(0, hasBattlefieldImage ? 'rgba(42,58,74,0.62)' : '#2a3a4a');
  baseGrad.addColorStop(1, hasBattlefieldImage ? 'rgba(26,26,46,0.7)' : '#1a1a2e');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, MAP.BASE_Y, W, H - MAP.BASE_Y);

  // 基地标志
  ctx.fillStyle = '#334455';
  ctx.fillRect(W - 160, MAP.BASE_Y + 10, 140, 50);
  ctx.fillStyle = '#445566';
  ctx.fillRect(W - 160, MAP.BASE_Y + 10, 140, 3);
  ctx.fillStyle = '#cc3333';
  ctx.fillRect(W - 160, MAP.BASE_Y + 13, 140, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(W - 160, MAP.BASE_Y + 16, 140, 3);
  ctx.fillStyle = '#cc3333';
  ctx.fillRect(W - 160, MAP.BASE_Y + 19, 140, 3);

  // 鹰酱基地标牌
  ctx.fillStyle = '#ffcccc';
  ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
  ctx.fillText('🦅 鹰酱第五舰队基地', W - 150, MAP.BASE_Y + 42);
  ctx.fillStyle = '#999';
  ctx.font = '9px sans-serif';
  ctx.fillText('（自由航行指挥部）', W - 130, MAP.BASE_Y + 55);

  // 波斯港口标记（左下角）
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(5, MAP.SHORE_Y + 5, 80, 25);
  ctx.fillStyle = '#c0b090';
  ctx.font = '10px sans-serif';
  ctx.fillText('🛢️ 波斯港', 10, MAP.SHORE_Y + 22);

  // 指挥标尺
  ctx.fillStyle = 'rgba(6,12,18,0.72)';
  ctx.fillRect(100, 12, 236, 28);
  ctx.strokeStyle = 'rgba(240,192,80,0.34)';
  ctx.strokeRect(100, 12, 236, 28);
  ctx.fillStyle = '#f0c050';
  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.fillText('黄金水道 / 防区 01', 112, 30);
  ctx.fillStyle = '#80d0c8';
  ctx.fillText('雷达链在线', 232, 30);

  // === 防御塔位（金色） ===
  const pulse = Math.sin(Date.now() / 800) * 0.3 + 0.7;
  for (const slot of MAP.TOWER_SLOTS) {
    if (!slot.occupied) {
      // 外圈脉冲光晕
      ctx.fillStyle = `rgba(240,192,80,${0.1 * pulse})`;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 24, 0, Math.PI * 2);
      ctx.fill();
      // 投影底座
      ctx.fillStyle = 'rgba(20,18,12,0.55)';
      ctx.beginPath();
      ctx.ellipse(slot.x, slot.y + 11, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // 实心内圈
      ctx.fillStyle = `rgba(240,192,80,${0.18 * pulse})`;
      ctx.strokeStyle = `rgba(240,192,80,${0.55})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 十字准星
      ctx.strokeStyle = `rgba(240,192,80,${0.4 * pulse})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(slot.x - 8, slot.y);
      ctx.lineTo(slot.x + 8, slot.y);
      ctx.moveTo(slot.x, slot.y - 8);
      ctx.lineTo(slot.x, slot.y + 8);
      ctx.stroke();
    }
  }

  // === 水雷槽位（蓝色，沿水道） ===
  const minePulse = Math.sin(Date.now() / 700 + 1.5) * 0.3 + 0.7;
  for (const slot of MAP.MINE_SLOTS) {
    if (!slot.occupied) {
      // 外圈
      ctx.fillStyle = `rgba(80,180,220,${0.1 * minePulse})`;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 20, 0, Math.PI * 2);
      ctx.fill();
      // 内圈
      ctx.fillStyle = `rgba(80,180,220,${0.2 * minePulse})`;
      ctx.strokeStyle = `rgba(80,200,240,${0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 十字
      ctx.strokeStyle = `rgba(80,200,240,${0.45 * minePulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(slot.x - 7, slot.y);
      ctx.lineTo(slot.x + 7, slot.y);
      ctx.moveTo(slot.x, slot.y - 7);
      ctx.lineTo(slot.x, slot.y + 7);
      ctx.stroke();
    }
  }
}
