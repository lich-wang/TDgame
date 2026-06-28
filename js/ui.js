// ============================================================
// 霍尔木兹狂想曲 — UI 管理
// ============================================================

function updateUI(game) {
  const eco = game.economy;
  document.getElementById('money-display').textContent = eco.money;
  document.getElementById('rep-display').textContent = eco.reputation;
  document.getElementById('oil-ship-count').textContent =
    `${eco.oilShipsSafe}/${eco.oilShipsSent}`;

  const wTotal = WAVES.length;
  document.getElementById('wave-info').textContent = `${game.currentWave}/${wTotal}`;

  const conditionEl = document.getElementById('condition-display');
  const selectedEl = document.getElementById('selected-display');
  const waveProgressEl = document.getElementById('wave-progress');

  if (conditionEl) {
    let condition = '整备中';
    if (game.waveActive) {
      condition = game.waveEnemiesRemaining > 0 ? `交战 ${Math.max(0, game.waveEnemiesRemaining)}` : '接敌中';
    } else if (game.currentWave > 0) {
      condition = '补给窗口';
    }
    if (eco._sanctionActive) condition = `${condition} / 制裁`;
    if (eco._inflationWaves > 0) condition = `${condition} / 通胀`;
    conditionEl.textContent = condition;
  }

  if (selectedEl) {
    if (game.selectedTowerType) {
      const tCfg = TOWER_TYPES[game.selectedTowerType];
      const cost = Math.floor(tCfg.cost * eco.getInflationMultiplier());
      selectedEl.textContent = `${tCfg.icon} ${tCfg.name} ¥${cost}`;
    } else if (game.hoveredMinelayer) {
      selectedEl.textContent = `${game.hoveredMinelayer.cfg.icon} ${game.hoveredMinelayer.status}`;
    } else if (game.hoveredTower) {
      selectedEl.textContent = `${game.hoveredTower.cfg.icon} ${game.hoveredTower.name}`;
    } else if (game.minelayers && game.minelayers.length > 0) {
      selectedEl.textContent = `⛴️ 布雷艇 ${game.minelayers.length}`;
    } else {
      selectedEl.textContent = '待命';
    }
  }

  if (waveProgressEl) {
    let progress = wTotal > 0 ? (game.currentWave / wTotal) * 100 : 0;
    if (game.waveActive) {
      const alivePressure = Math.min(1, Math.max(0, game.waveEnemiesRemaining) / 20);
      progress = Math.max(progress, ((game.currentWave - 1) / wTotal) * 100 + alivePressure * (100 / wTotal));
    }
    waveProgressEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  // 塔按钮更新
  const panel = document.getElementById('bottom-panel');
  const towerBtns = panel.querySelectorAll('.tower-btn');
  const types = ['cannon', 'missile', 'drone', 'mine', 'radar', 'aa'];
  const inflation = eco.getInflationMultiplier();

  towerBtns.forEach((btn, i) => {
    if (i >= types.length) return;
    const tKey = types[i];
    const tCfg = TOWER_TYPES[tKey];
    const cost = Math.floor(tCfg.cost * inflation);
    const affordable = eco.money >= cost;
    btn.classList.toggle('disabled', !affordable);
    btn.querySelector('.cost').textContent = `¥${cost}`;
  });

  // 主动出击按钮
  const strikeBtn1 = document.getElementById('btn-strike1');
  const strikeBtn2 = document.getElementById('btn-strike2');
  const strikeBtn3 = document.getElementById('btn-strike3');
  strikeBtn1.classList.toggle('disabled', eco.money < 50);
  strikeBtn2.classList.toggle('disabled', eco.money < 100);
  strikeBtn3.classList.toggle('disabled', eco.reputation < 20);
}

// 初始化塔按钮
function initTowerButtons() {
  const panel = document.getElementById('bottom-panel');
  const types = ['cannon', 'missile', 'drone', 'mine', 'radar', 'aa'];

  types.forEach(tKey => {
    const tCfg = TOWER_TYPES[tKey];
    const lv = tCfg.levels[0];
    let title = `${tCfg.icon} ${tCfg.name} — ${tCfg.desc}`;
    if (lv.dmg) title += ` | 伤害:${lv.dmg}`;
    if (lv.speed) title += ` | 攻速:${lv.speed}s`;
    if (lv.range) title += ` | 射程:${lv.range}`;
    if (lv.swarm) title += ` | 蜂群:${lv.swarm}架`;
    if (lv.reveal) title += ` | 雷达:${lv.reveal}`;
    if (lv.contact) title += ` | 触碰引爆`;
    title += ` | 费用:¥${tCfg.cost}`;

    const btn = document.createElement('button');
    btn.className = 'tower-btn';
    btn.title = title;
    btn.innerHTML = `
      <span class="icon">${tCfg.icon}</span>
      <span class="name">${tCfg.name}</span>
      <span class="cost">¥${tCfg.cost}</span>
    `;
    btn.onclick = () => game.selectTowerType(tKey);
    btn.onmouseenter = () => {
      document.getElementById('news-text').textContent = `📋 ${title}`;
    };
    btn.onmouseleave = () => {
      document.getElementById('news-text').textContent = document.getElementById('news-text').dataset.prev || '';
    };
    panel.insertBefore(btn, panel.querySelector('.divider'));
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initTowerButtons();
});
