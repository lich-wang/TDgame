// ============================================================
// 霍尔木兹狂想曲 — 随机事件
// ============================================================

function triggerRandomEvent(game) {
  const waveIdx = game.currentWave;
  const available = RANDOM_EVENTS.filter(e => waveIdx >= e.minWave);
  if (available.length === 0) return false;

  // 加权随机
  const totalWeight = available.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of available) {
    roll -= event.weight;
    if (roll <= 0) {
      // 执行事件
      game.showEventPopup(event.icon, event.name, event.desc);
      if (event.id === 'sanction') {
        game.economy._sanctionWaves = 3;
        game.economy._sanctionActive = true;
      } else if (event.id === 'camel') {
        game.economy.addMoney(100);
      } else if (event.id === 'blitz') {
        game.destroyRandomTower();
      } else if (event.id === 'inflation') {
        game.economy._inflationWaves = 2;
      } else if (event.id === 'rabbit') {
        game._skipWave = true;
      } else if (event.id === 'nukeLeak') {
        game.economy.reputation = Math.max(0, game.economy.reputation - 20);
      }
      return true;
    }
  }
  return false;
}
