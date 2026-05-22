// ============================================================
// 霍尔木兹狂想曲 — UI 管理
// ============================================================

function updateUI(game) {
  const eco = game.economy;
  document.getElementById('money-display').textContent = eco.money;
  document.getElementById('rep-display').textContent = `声望:${eco.reputation}`;
  document.getElementById('oil-ship-count').textContent =
    `油轮:${eco.oilShipsSafe}/${eco.oilShipsSent}`;

  const wTotal = WAVES.length;
  document.getElementById('wave-info').textContent = `波次 ${game.currentWave}/${wTotal}`;

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
