// ============================================================
// 霍尔木兹狂想曲 — 数值配置
// ============================================================

const TOWER_TYPES = {
  cannon: {
    name: '波斯拳',
    desc: '岸防炮台',
    icon: '🔫',
    cost: 50,
    levels: [
      { dmg: 8,  speed: 1.0, range: 220, name: '波斯拳 I' },
      { dmg: 12, speed: 0.7, range: 240, name: '波斯拳 II（穿甲）', ap: 5 },
      { dmg: 18, speed: 0.7, range: 270, name: '波斯拳 III（双管）', double: true },
    ],
    projectile: { color: '#ffa500', size: 4, speed: 8, spriteKey: 'shell' },
  },
  missile: {
    name: '窜天猴',
    desc: '反舰导弹',
    icon: '🚀',
    cost: 150,
    levels: [
      { dmg: 40, speed: 3.0, range: 280, name: '窜天猴 I', homing: true },
      { dmg: 60, speed: 2.5, range: 320, name: '窜天猴 II（增程）', homing: true },
      { dmg: 90, speed: 2.0, range: 380, name: '窜天猴 III（高超）', homing: true, pierce: true },
    ],
    projectile: { color: '#ff4444', size: 6, speed: 5, trail: true, spriteKey: 'missile' },
  },
  drone: {
    name: '小摩托大队',
    desc: '无人机蜂群',
    icon: '🛵',
    cost: 100,
    levels: [
      { dmg: 5,  speed: 2.0, range: 220, name: '小摩托 I', swarm: 3 },
      { dmg: 7,  speed: 1.5, range: 240, name: '小摩托 II（蜂群）', swarm: 5 },
      { dmg: 10, speed: 1.2, range: 270, name: '小摩托 III（隐身）', swarm: 8, stealth: true },
    ],
    projectile: { color: '#aaaacc', size: 3, speed: 4, spriteKey: 'drone' },
  },
  mine: {
    name: '布雷艇',
    desc: '移动布雷艇，会出航布雷且可能被敌舰击毁',
    icon: '⛴️',
    cost: 30,
    levels: [
      { dmg: 30, range: 0, name: '布雷艇 I', contact: true, hp: 70, speed: 0.9, mineCount: 3 },
      { dmg: 50, range: 60, name: '布雷艇 II（磁性水雷）', contact: true, magnetic: true, hp: 95, speed: 1.0, mineCount: 4 },
      { dmg: 70, range: 80, name: '布雷艇 III（智能水雷）', contact: true, smart: true, hp: 120, speed: 1.1, mineCount: 5 },
    ],
    projectile: { color: '#333', size: 8, speed: 0, spriteKey: 'mine' },
  },
  radar: {
    name: '波斯之眼',
    desc: '雷达站',
    icon: '📡',
    cost: 80,
    levels: [
      { range: 260, name: '波斯之眼 I', reveal: 260 },
      { range: 320, name: '波斯之眼 II（反隐）', reveal: 320, antiStealth: true },
      { range: 400, name: '波斯之眼 III（火控）', reveal: 400, antiStealth: true, dmgBoost: 0.2 },
    ],
    projectile: null,
  },
  aa: {
    name: '拍苍蝇',
    desc: '防空导弹',
    icon: '🪰',
    cost: 120,
    levels: [
      { dmg: 10, speed: 0.8, range: 240, name: '拍苍蝇 I', airOnly: true },
      { dmg: 15, speed: 0.5, range: 270, name: '拍苍蝇 II（速射）', airOnly: true },
      { dmg: 22, speed: 0.5, range: 300, name: '拍苍蝇 III（双发）', airOnly: true, double: true },
    ],
    projectile: { color: '#ffcc00', size: 3, speed: 12, spriteKey: 'aa' },
  },
};

const UPGRADE_COSTS = {
  cannon:  [60, 120],
  missile: [120, 200],
  drone:   [80, 150],
  mine:    [40, 80],
  radar:   [60, 120],
  aa:      [80, 150],
};

const ENEMY_TYPES = {
  skiff: {
    name: '小舢板', icon: '🚤', hp: 20, speed: 1.5, dmg: 1, bounty: 5,
    air: false, stealth: false, color: '#aaa', width: 30, height: 18,
  },
  destroyer: {
    name: '铁壳船', icon: '🚢', hp: 60, speed: 0.8, dmg: 5, bounty: 25,
    air: false, stealth: false, color: '#7799bb', width: 60, height: 28,
    shoreAttack: true,
  },
  cruiser: {
    name: '大铁壳', icon: '🛳️', hp: 120, speed: 0.5, dmg: 10, bounty: 50,
    air: false, stealth: false, color: '#557799', width: 80, height: 32,
    aoe: true,
  },
  carrier: {
    name: '大铁鸟巢', icon: '🛩️', hp: 500, speed: 0.25, dmg: 20, bounty: 200,
    air: false, stealth: false, color: '#336699', width: 120, height: 40,
    spawnFlies: true, spawnInterval: 5000,
  },
  sub: {
    name: '海底捞', icon: '🦞', hp: 80, speed: 0.6, dmg: 8, bounty: 40,
    air: false, stealth: true, color: '#224455', width: 50, height: 22,
  },
  fly: {
    name: '小苍蝇', icon: '🪰', hp: 15, speed: 2.0, dmg: 3, bounty: 8,
    air: true, stealth: false, color: '#ccc', width: 20, height: 14,
  },
  marine: {
    name: '鹰酱大兵', icon: '💂', hp: 30, speed: 1.0, dmg: 6, bounty: 15,
    air: false, stealth: false, color: '#556b2f', width: 16, height: 20,
    landUnit: true,
  },
};

// 波次配置: { enemies: [{type, count}], hpMul, intervalMs }
const WAVES = [
  // 1-3 自由航行初级
  { enemies: [{ type: 'skiff', count: 5 }],                     hpMul: 1.0, name: '🛥️ 自由航行 I' },
  { enemies: [{ type: 'skiff', count: 12 }],                    hpMul: 1.0, name: '🛥️ 自由航行 II' },
  { enemies: [{ type: 'skiff', count: 10 }, { type: 'destroyer', count: 2 }], hpMul: 1.0, name: '🛥️ 自由航行 III' },
  // 4-6 航行自由中级
  { enemies: [{ type: 'destroyer', count: 5 }, { type: 'skiff', count: 8 }],      hpMul: 1.2, name: '🚢 航行自由 I' },
  { enemies: [{ type: 'destroyer', count: 5 }, { type: 'fly', count: 5 }],        hpMul: 1.2, name: '🚢 航行自由 II' },
  { enemies: [{ type: 'destroyer', count: 5 }, { type: 'cruiser', count: 2 }],    hpMul: 1.3, name: '🚢 航行自由 III' },
  // 7-9 极限施压
  { enemies: [{ type: 'cruiser', count: 3 }, { type: 'sub', count: 2 }],          hpMul: 1.4, name: '🔴 极限施压 I' },
  { enemies: [{ type: 'cruiser', count: 3 }, { type: 'destroyer', count: 4 }, { type: 'fly', count: 6 }], hpMul: 1.4, name: '🔴 极限施压 II' },
  { enemies: [{ type: 'sub', count: 3 }, { type: 'cruiser', count: 3 }, { type: 'marine', count: 5 }], hpMul: 1.5, name: '🔴 极限施压 III' },
  // 10 BOSS
  { enemies: [{ type: 'carrier', count: 1 }, { type: 'destroyer', count: 4 }, { type: 'fly', count: 8 }], hpMul: 1.0, name: '🦅 大铁鸟巢来了！', boss: true },
  // 11-13 鹰酱的关爱
  { enemies: [{ type: 'destroyer', count: 6 }, { type: 'skiff', count: 15 }],    hpMul: 1.6, name: '💔 鹰酱的关爱 I' },
  { enemies: [{ type: 'cruiser', count: 4 }, { type: 'sub', count: 3 }],          hpMul: 1.7, name: '💔 鹰酱的关爱 II' },
  { enemies: [{ type: 'destroyer', count: 6 }, { type: 'cruiser', count: 3 }, { type: 'fly', count: 8 }], hpMul: 1.8, name: '💔 鹰酱的关爱 III' },
  // 14-16 小霸王串门
  { enemies: [{ type: 'destroyer', count: 5 }, { type: 'sub', count: 3 }],        hpMul: 1.9, name: '👑 小霸王串门 I' },
  { enemies: [{ type: 'cruiser', count: 3 }, { type: 'destroyer', count: 6 }],    hpMul: 2.0, name: '👑 小霸王串门 II' },
  { enemies: [{ type: 'destroyer', count: 4 }, { type: 'cruiser', count: 3 }, { type: 'marine', count: 6 }], hpMul: 2.0, name: '👑 小霸王串门 III' },
  // 17 双航母
  { enemies: [{ type: 'carrier', count: 2 }, { type: 'destroyer', count: 5 }, { type: 'fly', count: 10 }], hpMul: 1.5, name: '🦅🦅 第五舰队野餐会', boss: true },
  // 18-19
  { enemies: [{ type: 'cruiser', count: 5 }, { type: 'sub', count: 4 }, { type: 'marine', count: 8 }], hpMul: 2.2, name: '💢 最后的倔强 I' },
  { enemies: [{ type: 'destroyer', count: 6 }, { type: 'cruiser', count: 4 }, { type: 'sub', count: 3 }, { type: 'fly', count: 10 }], hpMul: 2.3, name: '💢 最后的倔强 II' },
  // 20 终局
  { enemies: [{ type: 'carrier', count: 3 }, { type: 'destroyer', count: 6 }, { type: 'cruiser', count: 3 }, { type: 'fly', count: 15 }, { type: 'sub', count: 3 }], hpMul: 2.0, name: '🦅🦅🦅 鹰酱急了！', boss: true },
];

// 鹰酱播报（每波开始随机选一条）
const EAGLE_NEWS = [
  '📢 鹰酱宣布在黄金水道进行"自由航行"演习，强调不针对任何国家。',
  '📢 鹰酱总统: "波斯支持恐怖主义！" 波斯: "你先把航母开走再说。"',
  '📢 鹰酱财政部宣布对波斯实施第{N}轮制裁。（波斯打了个哈欠）',
  '📢 鹰酱舰队司令: "我们只是路过。"（舰队总计携带了2000枚导弹）',
  '📢 骆驼家偷偷向波斯购买了300万桶黑金。鹰酱: "我没看见。"',
  '📢 鹰酱国会批准新一轮军事预算，仅需8860亿绿纸。',
  '📢 波斯外交部: "黄金水道是波斯文明的延伸。" 鹰酱: "不同意！"',
  '📢 国际原子能机构: "波斯核设施没有异常。" 小霸王: "我不信！"',
  '📢 鹰酱航母战斗群在黄金水道附近进行"例行训练"。',
  '📢 波斯革命卫队: "窜天猴已准备就绪。" 鹰酱: "这是挑衅！"',
];

// 随机事件池
const RANDOM_EVENTS = [
  { id: 'sanction', name: '鹰酱的关爱', desc: '鹰酱宣布新一轮制裁！油轮收入减半（持续3波）', icon: '💔', minWave: 4, weight: 15,
    apply(economy) { economy._sanctionWaves = 3; economy._sanctionActive = true; } },
  { id: 'camel', name: '骆驼家的电话', desc: '骆驼家悄悄打来电话，要买黑金。+100绿纸！', icon: '🐪', minWave: 6, weight: 20,
    apply(economy) { economy.addMoney(100); } },
  { id: 'blitz', name: '小霸王偷袭', desc: '小霸王发动突袭！随机摧毁一个防御设施。', icon: '💣', minWave: 11, weight: 10,
    apply(game) { game.destroyRandomTower(); } },
  { id: 'inflation', name: '绿纸贬值', desc: '鹰酱印了太多绿纸！所有费用上涨20%（持续2波）', icon: '💸', minWave: 7, weight: 12,
    apply(economy) { economy._inflationWaves = 2; } },
  { id: 'rabbit', name: '兔子家斡旋', desc: '兔子家出面调解。跳过这一波！', icon: '🐰', minWave: 13, weight: 8,
    apply(game) { game._skipWave = true; } },
  { id: 'nukeLeak', name: '波斯秘宝泄露', desc: '核设施发生"事故"。声望-20。', icon: '☢️', minWave: 10, weight: 5,
    apply(economy) { economy.reputation = Math.max(0, economy.reputation - 20); } },
];

const OIL_TANKER = {
  hp: 30,
  speed: 0.8,
  rewardMin: 50,
  rewardMax: 150,
  intervalMs: 60000,
  color: '#222',
  width: 70,
  height: 24,
};

const STRIKE_OPTIONS = {
  motorbike: {
    name: '小摩托快递',
    desc: '派遣无人机袭扰鹰酱基地',
    cost: 50,
    icon: '🛵💨',
    apply(game) {
      if (Math.random() < 0.5) {
        const reward = 30 + Math.floor(Math.random() * 50);
        game.economy.addMoney(reward);
        game.showToast(`小摩托命中目标！获得 ${reward} 绿纸`);
      } else {
        game.showToast('小摩托被拦截了... 但拖延了时间');
      }
      game.addWaveDelay(10000);
    }
  },
  firecracker: {
    name: '二踢脚警告',
    desc: '弹道导弹袭击鹰酱基地',
    cost: 100,
    icon: '🧨',
    apply(game) {
      const reward = 60 + Math.floor(Math.random() * 90);
      game.economy.addMoney(reward);
      game.showToast(`二踢脚命中鹰酱基地！获得 ${reward} 绿纸 💥`);
      game.addWaveDelay(25000);
    }
  },
  secret: {
    name: '波斯秘宝威慑',
    desc: '宣称核突破（消耗20声望）',
    cost: 0,
    icon: '☢️',
    requires: () => true,
    apply(game) {
      if (game.economy.reputation < 20) {
        game.showToast('声望不足，无法威慑！');
        return false;
      }
      game.economy.reputation -= 20;
      game._skipWave = true;
      game.economy._sanctionWaves = 3;
      game.economy._sanctionActive = true;
      game.showToast('鹰酱被吓到了！跳过本波，但触发了"鹰酱的关爱"');
      return true;
    }
  },
};

// 地图常量
const MAP = {
  WIDTH: 960,
  HEIGHT: 600,
  SHORE_Y: 200,       // 海岸线 y 坐标
  WATER_TOP: 200,
  WATER_BOT: 480,
  BASE_Y: 500,        // 鹰酱基地区域
  SPAWN_X: 980,       // 敌人出生点
  DESPAWN_X: -60,     // 敌人消失点
  PATH_Y: 340,        // 敌人行进路径 y（水道中央）
  OIL_PATH_Y: 340,    // 油轮路径 y
  TOWER_SLOTS: [],    // 动态生成塔位
};

// 斜向水道路径（从右上到左下，约 10° 倾斜）
// 敌人沿此方向行进：[dx=-1, dy=0.173] 每单位像素
MAP.PATH_START_X = MAP.SPAWN_X;
MAP.PATH_START_Y = 170;
MAP.PATH_END_X   = MAP.DESPAWN_X;
MAP.PATH_END_Y   = 382;
// 归一化方向向量
(function() {
  const dx = MAP.PATH_END_X - MAP.PATH_START_X;
  const dy = MAP.PATH_END_Y - MAP.PATH_START_Y;
  const len = Math.sqrt(dx*dx + dy*dy);
  MAP.PATH_DX = dx / len;  // ≈ -0.983
  MAP.PATH_DY = dy / len;  // ≈ 0.185
})();
// 油轮反向：从波斯港（左下）到外海（右上）
MAP.OIL_PATH_START_X = MAP.DESPAWN_X + 30;
MAP.OIL_PATH_START_Y = MAP.PATH_END_Y + 24;
MAP.OIL_PATH_END_X   = MAP.SPAWN_X;
MAP.OIL_PATH_END_Y   = MAP.PATH_START_Y + 36;

MAP.MINE_SLOTS = [];  // 水道中的水雷专用槽位

// 生成防御塔位：每个点都贴合背景图上的真实岸防平台。
(function initTowerSlots() {
  const towerSlotCoords = [
    { x: 28, y: 178, drawX: 25, drawY: 169, scale: 0.43 },
    { x: 84, y: 164, drawX: 82, drawY: 157, scale: 0.47 },
    { x: 155, y: 150, drawX: 153, drawY: 144, scale: 0.5 },
    { x: 246, y: 132, drawX: 244, drawY: 127, scale: 0.5 },
    { x: 348, y: 120, drawX: 347, drawY: 115, scale: 0.49 },
    { x: 442, y: 110, drawX: 441, drawY: 105, scale: 0.47 },
    { x: 535, y: 100, drawX: 535, drawY: 96, scale: 0.46 },
    { x: 636, y: 88, drawX: 635, drawY: 84, scale: 0.45 },
    { x: 734, y: 78, drawX: 733, drawY: 75, scale: 0.43 },
    { x: 835, y: 74, drawX: 834, drawY: 72, scale: 0.42 },
    { x: 915, y: 72, drawX: 914, drawY: 70, scale: 0.4 },
  ];
  for (let c = 0; c < towerSlotCoords.length; c++) {
    const { x, y, drawX, drawY, scale } = towerSlotCoords[c];
    MAP.TOWER_SLOTS.push({
      x,
      y,
      drawX,
      drawY,
      scale,
      occupied: false,
      id: `tower_${c}`,
    });
  }
})();

// 生成水雷槽位（沿斜向水道，1行×8列）
(function initMineSlots() {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const t = 0.12 + (i / (count - 1)) * 0.76;  // 12%~88% 路径
    MAP.MINE_SLOTS.push({
      x: MAP.PATH_START_X + (MAP.PATH_END_X - MAP.PATH_START_X) * t,
      y: MAP.PATH_START_Y + (MAP.PATH_END_Y - MAP.PATH_START_Y) * t,
      t,
      occupied: false,
      id: `mine_${i}`,
    });
  }
})();
