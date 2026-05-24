// ============================================================
// 霍尔木兹狂想曲 — 主控制器
// ============================================================

const game = new class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.economy = new Economy();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.oilTankers = [];

    this.state = 'menu'; // menu | playing | paused | wave_clear | victory | defeat
    this.currentWave = 0;
    this.waveEnemiesRemaining = 0;
    this.waveActive = false;
    this.waveDelay = 0;   // 波间延迟
    this.spawnQueue = [];  // [{typeKey, delay}]
    this.spawnTimer = 0;
    this.waveOffset = 0;   // 水面动画偏移

    this.selectedTowerType = null;
    this.hoveredTower = null;
    this.lastTime = 0;

    // 油轮计时器
    this.tankerTimer = 0;

    // 跳过波次标记
    this._skipWave = false;

    // 主动出击定时器
    this._strikeDelayTimer = null;
    // 准备阶段定时器
    this._prepTimer = null;
    // Toast 计时器
    this.toastTimer = 0;

    // 事件弹窗计时器
    this.eventPopupTimer = 0;

    // 绑定事件
    this._bindEvents();
    // 竖屏旋转检测
    this._rotated = false;
    this._checkRotation();
    window.addEventListener('resize', () => this._checkRotation());
    window.addEventListener('orientationchange', () => setTimeout(() => this._checkRotation(), 100));
  }

  _checkRotation() {
    const isPortrait = window.innerWidth < 600 && window.innerHeight > window.innerWidth;
    if (isPortrait) {
      document.body.classList.add('rotated');
      this._rotated = true;
    } else {
      document.body.classList.remove('rotated');
      this._rotated = false;
    }
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._onRightClick(e);
    });
  }

  // ============ 开始 ============
  start() {
    document.getElementById('start-screen').style.display = 'none';
    this.economy.reset();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.oilTankers = [];
    this.currentWave = 0;
    this.waveActive = false;
    this.waveDelay = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.tankerTimer = 0;
    this._skipWave = false;
    this.selectedTowerType = null;
    this.hoveredTower = null;
    this.state = 'playing';
    this.lastTime = performance.now();

    // 重置所有槽位
    MAP.TOWER_SLOTS.forEach(s => s.occupied = false);
    MAP.MINE_SLOTS.forEach(s => s.occupied = false);

    // 8秒准备时间后用 setTimeout 启动第一波
    this.showToast('⏳ 8秒后鹰酱舰队抵达！快部署防御设施！');
    this._prepTimer = setTimeout(() => {
      this._prepTimer = null;
      if (this.state === 'playing') this._startNextWave();
    }, 8000);
    requestAnimationFrame((t) => this._loop(t));
  }

  // ============ 主循环 ============
  _loop(now) {
    if (this.state === 'menu') return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap dt
    this.lastTime = now;

    this.waveOffset = (this.waveOffset + dt * 30) % 1000;
    this.update(dt);
    this.render();

    if (this.state !== 'menu') {
      requestAnimationFrame((t) => this._loop(t));
    }
  }

  // ============ 更新 ============
  update(dt) {
    if (this.state !== 'playing') return;

    // Toast 计时（不受波间影响）
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        document.getElementById('toast').classList.remove('show');
      }
    }

    // 事件弹窗计时（不受波间影响）
    if (this.eventPopupTimer > 0) {
      this.eventPopupTimer -= dt;
      if (this.eventPopupTimer <= 0) {
        document.getElementById('event-popup').classList.remove('active');
      }
    }

    // 更新 UI（每帧都做）
    updateUI(this);

    // 检查是否跳过波
    if (this._skipWave) {
      this._skipWave = false;
      this._waveCleared();
      return;
    }

    // 生成敌人
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt * 1000;
      while (this.spawnQueue.length > 0 && this.spawnTimer <= 0) {
        const entry = this.spawnQueue.shift();
        this._spawnEnemy(entry.typeKey);
        this.waveEnemiesRemaining++;
        if (this.spawnQueue.length > 0) {
          this.spawnTimer += this.spawnQueue[0].delay;
        }
      }
    }

    // 更新敌人
    for (const enemy of this.enemies) {
      enemy.update(dt, this.towers, this);
    }

    // 更新塔
    for (const tower of this.towers) {
      tower.update(dt, this.enemies, this.projectiles);
    }

    // 更新投影物
    for (const proj of this.projectiles) {
      proj.update(dt);
    }

    // 清理
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) {
        if (e.reachedEnd) {
          // 敌人穿越海峡
          this.economy.reputation = Math.max(0, this.economy.reputation - 3);
          if (e.landUnit) {
            // 鹰酱大兵登陆成功，攻击随机塔
            this._damageRandomTower(5);
          }
        } else {
          // 击杀赏金
          this.economy.addMoney(e.bounty);
          if (e.type === 'carrier') this.economy.reputation += 20;
          else if (e.type === 'cruiser') this.economy.reputation += 5;
          else if (e.type === 'destroyer') this.economy.reputation += 2;
        }
        this.waveEnemiesRemaining--;
        this.enemies.splice(i, 1);
      }
    }

    // 清理投影物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].alive) {
        this.projectiles.splice(i, 1);
      }
    }

    // 油轮
    this.tankerTimer += dt * 1000;
    if (this.tankerTimer >= OIL_TANKER.intervalMs) {
      this.tankerTimer = 0;
      this._spawnTanker();
    }

    // 更新油轮
    for (const tanker of this.oilTankers) {
      tanker.update(dt, this.enemies);
    }
    for (let i = this.oilTankers.length - 1; i >= 0; i--) {
      const t = this.oilTankers[i];
      if (!t.alive) {
        if (t.safeArrival) {
          const reward = this.economy.getOilReward();
          this.economy.addMoney(reward);
          this.economy.oilShipsSafe++;
          this.showToast(`🛢️ 油轮安全通过！获得 ${reward} 绿纸`);
        } else {
          this.economy.reputation = Math.max(0, this.economy.reputation - 10);
          this.showToast('💥 油轮被击沉！声望 -10');
        }
        this.oilTankers.splice(i, 1);
      }
    }

    // 检查波次结束
    if (this.waveActive && this.spawnQueue.length === 0 && this.waveEnemiesRemaining <= 0) {
      this._waveCleared();
    }

    // 检查失败（声望归零）
    if (this.economy.reputation <= 0) {
      this._gameOver(false);
    }
  }

  // ============ 渲染 ============
  render() {
    const ctx = this.ctx;

    // 清屏
    drawMap(ctx, { waveOffset: this.waveOffset });

    // 绘制油轮
    for (const tanker of this.oilTankers) {
      tanker.draw(ctx);
    }

    // 绘制敌人
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // 绘制投影物
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }

    // 绘制水雷
    for (const tower of this.towers) {
      tower.drawMines(ctx);
    }

    // 绘制塔
    for (const tower of this.towers) {
      tower.hovered = (tower === this.hoveredTower);
      tower.draw(ctx);
    }

    // 放置预览
    if (this.selectedTowerType && this._lastHoverSlot && !this._lastHoverSlot.occupied) {
      const s = this._lastHoverSlot;
      const isMine = this.selectedTowerType === 'mine';
      const clr = isMine ? 'rgba(80,200,240,0.3)' : 'rgba(240,192,80,0.25)';
      const strokeClr = isMine ? '#50c8f0' : '#f0c050';
      const tCfg = TOWER_TYPES[this.selectedTowerType];
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = clr;
      ctx.fill();
      ctx.strokeStyle = strokeClr;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tCfg.icon, s.x, s.y);
      ctx.restore();
    }

    // === 塔悬停 tooltip ===
    if (this.hoveredTower && this.mouseX != null) {
      const t = this.hoveredTower;
      const lv = t.getLevelData();
      const cost = t.getUpgradeCost();
      const infl = this.economy.getInflationMultiplier();
      const lines = [
        `${t.cfg.icon} ${t.name}`,
        `等级 ${t.level + 1}/3  ★${'★'.repeat(t.level)}`,
      ];
      if (t.dmg > 0) lines.push(`伤害 ${t.dmg}`);
      if (t.attackSpeed) lines.push(`攻速 ${t.attackSpeed}s`);
      if (t.range > 0) lines.push(`射程 ${t.range}`);
      if (t.revealRange > 0) lines.push(`雷达 ${t.revealRange}`);
      if (t.isMine) lines.push(`水雷 ${t.minesPlaced.length}/${t.maxMines}`);
      if (cost < Infinity) {
        lines.push(`升级 ¥${Math.floor(cost * infl)}`);
      } else {
        lines.push('已满级');
      }

      const fontSize = 11;
      const lineH = 15;
      const padX = 8;
      const padY = 6;
      const tw = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0) + padX * 2;
      const twReal = Math.max(tw, 140);
      const th = lines.length * lineH + padY * 2;
      let tx = this.mouseX + 18;
      let ty = this.mouseY - th - 8;
      if (tx + twReal > MAP.WIDTH) tx = this.mouseX - twReal - 18;
      if (ty < 0) ty = this.mouseY + 18;

      ctx.save();
      ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(10,10,20,0.92)';
      ctx.strokeStyle = '#f0c050';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const r = 5;
      ctx.moveTo(tx + r, ty);
      ctx.lineTo(tx + twReal - r, ty);
      ctx.arcTo(tx + twReal, ty, tx + twReal, ty + r, r);
      ctx.lineTo(tx + twReal, ty + th - r);
      ctx.arcTo(tx + twReal, ty + th, tx + twReal - r, ty + th, r);
      ctx.lineTo(tx + r, ty + th);
      ctx.arcTo(tx, ty + th, tx, ty + th - r, r);
      ctx.lineTo(tx, ty + r);
      ctx.arcTo(tx, ty, tx + r, ty, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f0c050';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.forEach((l, i) => {
        ctx.fillText(l, tx + padX, ty + padY + i * lineH);
      });
      ctx.restore();
    }

    // === 敌人悬停 tooltip ===
    if (this.hoveredEnemy && this.mouseX != null && !this.hoveredTower) {
      const e = this.hoveredEnemy;
      const lines = [
        `${e.icon} ${e.name}`,
        `血量 ${Math.ceil(e.hp)}/${e.maxHp}`,
        `速度 ${e.speed}`,
      ];
      if (e.stealth) lines.push('🔍 隐形单位');
      if (e.air) lines.push('✈️ 空中单位');
      if (e.spawnFlies) lines.push('🛩️ 释放舰载机');
      lines.push(`赏金 ¥${e.bounty}`);

      const fontSize = 11;
      const lineH = 15;
      const padX = 8;
      const padY = 6;
      const tw = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0) + padX * 2;
      const twReal = Math.max(tw, 130);
      const th = lines.length * lineH + padY * 2;
      let tx = this.mouseX + 18;
      let ty = this.mouseY - th - 8;
      if (tx + twReal > MAP.WIDTH) tx = this.mouseX - twReal - 18;
      if (ty < 0) ty = this.mouseY + 18;

      ctx.save();
      ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(30,10,10,0.92)';
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const r = 5;
      ctx.moveTo(tx + r, ty);
      ctx.lineTo(tx + twReal - r, ty);
      ctx.arcTo(tx + twReal, ty, tx + twReal, ty + r, r);
      ctx.lineTo(tx + twReal, ty + th - r);
      ctx.arcTo(tx + twReal, ty + th, tx + twReal - r, ty + th, r);
      ctx.lineTo(tx + r, ty + th);
      ctx.arcTo(tx, ty + th, tx, ty + th - r, r);
      ctx.lineTo(tx, ty + r);
      ctx.arcTo(tx, ty, tx + r, ty, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffaaaa';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      lines.forEach((l, i) => {
        ctx.fillText(l, tx + padX, ty + padY + i * lineH);
      });
      ctx.restore();
    }
  }

  // ============ 波次管理 ============
  _startNextWave() {
    if (this.currentWave >= WAVES.length) {
      this._gameOver(true);
      return;
    }

    const waveCfg = WAVES[this.currentWave];
    this.currentWave++;
    this.waveActive = true;
    this.waveEnemiesRemaining = 0;
    this.spawnTimer = 0;

    // 生成队列
    this.spawnQueue = [];
    for (const group of waveCfg.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          typeKey: group.type,
          delay: 800 + Math.random() * 1500,
        });
      }
    }
    // 乱序
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }

    // 首个生成延迟
    if (this.spawnQueue.length > 0) {
      this.spawnTimer = 1500;
    }

    // 鹰酱播报
    let news = EAGLE_NEWS[Math.floor(Math.random() * EAGLE_NEWS.length)];
    news = news.replace('{N}', String(Math.floor(Math.random() * 9000) + 1000));
    this.setNews(news);

    // 随机事件
    if (this.currentWave >= 2) {
      setTimeout(() => triggerRandomEvent(this), 3000);
    }

    this.showToast(`${waveCfg.name} 开始了！`);
  }

  _waveCleared() {
    this.waveActive = false;
    this.economy.onWaveEnd();

    if (this.currentWave >= WAVES.length) {
      this._gameOver(true);
      return;
    }

    this.showToast('✅ 波次清除！准备下一波...');
    this.setNews('📢 鹰酱舰队暂时撤退... 下一波正在路上');

    // 用 setTimeout 避免 state 切换阻塞 update 循环
    setTimeout(() => {
      if (this.state === 'playing') {
        this._startNextWave();
      }
    }, 5000);
  }

  _spawnEnemy(typeKey) {
    const cfg = WAVES[this.currentWave - 1];
    const enemy = new Enemy(typeKey, cfg.hpMul);
    this.enemies.push(enemy);
  }

  // ============ 油轮 ============
  _spawnTanker() {
    const tanker = new OilTanker();
    this.oilTankers.push(tanker);
    this.economy.oilShipsSent++;
  }

  spawnFly(x, y) {
    const fly = new Enemy('fly', WAVES[this.currentWave - 1]?.hpMul || 1.0);
    fly.x = x;
    fly.y = y;
    this.enemies.push(fly);
    this.waveEnemiesRemaining++;
  }

  // ============ 塔操作 ============
  selectTowerType(typeKey) {
    if (this.state !== 'playing') return;
    const cost = Math.floor(TOWER_TYPES[typeKey].cost * this.economy.getInflationMultiplier());
    if (this.economy.money < cost) {
      this.showToast('绿纸不足！');
      return;
    }
    this.selectedTowerType = this.selectedTowerType === typeKey ? null : typeKey;
    // 在播报条显示当前选中设施说明
    if (this.selectedTowerType) {
      const tCfg = TOWER_TYPES[this.selectedTowerType];
      this.setNews(`📋 ${tCfg.icon} ${tCfg.name}：${tCfg.desc} | 射程${tCfg.levels[0].range} | 点击空塔位放置 | 右键取消`);
    }
  }

  _onMouseMove(e) {
    let mx, my;
    if (this._rotated) {
      // 旋转90°后：视觉 offsetX→Canvas y，视觉 offsetY→Canvas x(反向)
      mx = MAP.WIDTH * (1 - e.offsetY / this.canvas.clientHeight);
      my = MAP.HEIGHT * (e.offsetX / this.canvas.clientWidth);
    } else {
      const sx = this.canvas.width / this.canvas.clientWidth;
      const sy = this.canvas.height / this.canvas.clientHeight;
      mx = e.offsetX * sx;
      my = e.offsetY * sy;
    }
    this.mouseX = mx;
    this.mouseY = my;

    // 悬停塔
    this.hoveredTower = null;
    for (const tower of this.towers) {
      const d = Math.hypot(tower.x - mx, tower.y - my);
      if (d < 18) {
        this.hoveredTower = tower;
        break;
      }
    }

    // 悬停敌人
    this.hoveredEnemy = null;
    if (!this.hoveredTower) {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const d = Math.hypot(ex - mx, ey - my);
        if (d < enemy.width / 2 + 8) {
          this.hoveredEnemy = enemy;
          break;
        }
      }
    }

    // 放置预览（防御塔位 + 水雷槽位）
    this._lastHoverSlot = null;
    this._lastHoverMineSlot = null;

    // 始终检测普通塔位悬停（未选塔时也能悬停，方便点击自动选塔）
    let closestTowerDist = 24;
    for (const slot of MAP.TOWER_SLOTS) {
      if (slot.occupied) continue;
      const d = Math.hypot(slot.x - mx, slot.y - my);
      if (d < closestTowerDist) {
        closestTowerDist = d;
        this._lastHoverSlot = slot;
      }
    }
    // 始终检测水雷槽位
    for (const slot of MAP.MINE_SLOTS) {
      if (slot.occupied) continue;
      if (Math.hypot(slot.x - mx, slot.y - my) < 24) {
        this._lastHoverMineSlot = slot;
        break;
      }
    }

    if (this.selectedTowerType) {
      const validSlot = this.selectedTowerType === 'mine' ? this._lastHoverMineSlot : this._lastHoverSlot;
      this.canvas.style.cursor = validSlot ? 'crosshair' : 'default';
    } else {
      this.canvas.style.cursor = (this._lastHoverSlot || this._lastHoverMineSlot || this.hoveredTower) ? 'pointer' : 'default';
    }
  }

  _onClick(e) {
    let mx, my;
    if (this._rotated) {
      mx = MAP.WIDTH * (1 - e.offsetY / this.canvas.clientHeight);
      my = MAP.HEIGHT * (e.offsetX / this.canvas.clientWidth);
    } else {
      const sx = this.canvas.width / this.canvas.clientWidth;
      const sy = this.canvas.height / this.canvas.clientHeight;
      mx = e.offsetX * sx;
      my = e.offsetY * sy;
    }

    // 点击水雷槽位 → 自动选铁罐头
    if (this._lastHoverMineSlot && !this._lastHoverMineSlot.occupied) {
      if (!this.selectedTowerType || this.selectedTowerType !== 'mine') {
        const cost = Math.floor(TOWER_TYPES.mine.cost * this.economy.getInflationMultiplier());
        if (this.economy.money < cost) {
          this.showToast('绿纸不足，买不了铁罐头！');
          return;
        }
        this.selectedTowerType = 'mine';
        this.showToast('已选 🥫 铁罐头（水雷），再点水中蓝色槽位放置');
        this.setNews('📋 🥫 铁罐头：水雷 | 触碰引爆 | 点击蓝色水道槽位放置 | 右键取消');
        return;
      }
    }

    // 放置塔/水雷
    if (this._lastHoverSlot && !this._lastHoverSlot.occupied) {
      // 未选塔 → 自动选第一个可负担的
      if (!this.selectedTowerType) {
        const types = ['cannon', 'missile', 'drone', 'mine', 'radar', 'aa'];
        const infl = this.economy.getInflationMultiplier();
        for (const tKey of types) {
          const cost = Math.floor(TOWER_TYPES[tKey].cost * infl);
          if (this.economy.money >= cost) {
            this.selectedTowerType = tKey;
            const tCfg = TOWER_TYPES[tKey];
            this.showToast(`已选择 ${tCfg.name}，再点空位放置`);
            this.setNews(`📋 ${tCfg.icon} ${tCfg.name}：${tCfg.desc} | 射程${tCfg.levels[0].range} | 再点空位放置 | 右键取消`);
            return;
          }
        }
        this.showToast('绿纸不足，建不了任何塔！');
        return;
      }

      const tKey = this.selectedTowerType;
      const cost = Math.floor(TOWER_TYPES[tKey].cost * this.economy.getInflationMultiplier());
      if (this.economy.spend(cost)) {
        const slot = this._lastHoverSlot;
        slot.occupied = true;
        const tower = new Tower(tKey, slot);
        this.towers.push(tower);
        this.showToast(`部署了 ${tower.name}（${tower.cfg.icon}）`);
        this.selectedTowerType = null;
      } else {
        this.showToast('绿纸不足！');
        this.selectedTowerType = null;
      }
      return;
    }

    // 点击已放置的塔 —— 升级
    if (this.hoveredTower) {
      const tower = this.hoveredTower;
      const cost = tower.getUpgradeCost();
      if (cost === Infinity) {
        this.showToast(`${tower.name} 已满级！`);
      } else {
        const adjCost = Math.floor(cost * this.economy.getInflationMultiplier());
        if (this.economy.spend(adjCost)) {
          tower.upgrade();
          this.showToast(`${tower.name} 升级成功！`);
        } else {
          this.showToast(`升级需要 ${adjCost} 绿纸，不够！`);
        }
      }
      return;
    }
  }

  _onRightClick(e) {
    e.preventDefault();
    this.selectedTowerType = null;
  }

  // ============ 主动出击 ============
  doStrike(id) {
    if (this.state !== 'playing') return;
    const opt = STRIKE_OPTIONS[id];
    if (!opt) return;

    if (opt.cost > 0 && !this.economy.spend(opt.cost)) {
      this.showToast('绿纸不足！');
      return;
    }

    const result = opt.apply(this);
    if (result === false) return; // 威慑失败

    this.economy.reputation += 5;
    // 延迟 toast 避免被 apply 内的 toast 覆盖
    setTimeout(() => this.showToast(`🚀 ${opt.name} 声望 +5`), 1500);
  }

  addWaveDelay(ms) {
    // 用 setTimeout 异步延迟下一波，不阻塞主循环
    if (this._strikeDelayTimer) clearTimeout(this._strikeDelayTimer);
    this._strikeDelayTimer = setTimeout(() => {
      this._strikeDelayTimer = null;
      if (this.state === 'playing' && !this.waveActive) {
        this._startNextWave();
      }
    }, ms);
  }

  // ============ 随机事件效果 ============
  destroyRandomTower() {
    if (this.towers.length === 0) {
      this.showToast('小霸王想偷袭，但没有目标！');
      return;
    }
    const idx = Math.floor(Math.random() * this.towers.length);
    const tower = this.towers[idx];
    this.showToast(`💥 小霸王偷袭摧毁了 ${tower.name}！`);
    tower.destroy();
    this.towers.splice(idx, 1);
  }

  _damageRandomTower(amount) {
    // 简化：直接摧毁随机塔（类似鹰酱大兵效果）
    if (this.towers.length === 0) return;
    const idx = Math.floor(Math.random() * this.towers.length);
    const tower = this.towers[idx];
    this.showToast(`💥 鹰酱大兵摧毁了 ${tower.name}！`);
    tower.destroy();
    this.towers.splice(idx, 1);
  }

  // ============ 游戏结束 ============
  _gameOver(victory) {
    this.state = victory ? 'victory' : 'defeat';
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    if (victory) {
      title.textContent = '🎉 胜利！';
      body.textContent = '波斯再次证明了谁才是黄金水道真正的主人！鹰酱舰队灰溜溜地撤回了巴林。';
    } else {
      title.textContent = '💀 失败！';
      body.textContent = '鹰酱宣布"自由航行"取得圆满成功。波斯的黑金出口被完全封锁。';
    }

    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    // 清除所有定时器
    if (this._prepTimer) { clearTimeout(this._prepTimer); this._prepTimer = null; }
    if (this._strikeDelayTimer) { clearTimeout(this._strikeDelayTimer); this._strikeDelayTimer = null; }
    // 重新开始
    document.getElementById('start-screen').style.display = 'flex';
    this.state = 'menu';
    this.currentWave = 0;
    this.waveActive = false;
  }

  // ============ News ============
  setNews(msg) {
    this._lastNews = msg;
    document.getElementById('news-text').textContent = msg;
    document.getElementById('news-text').dataset.prev = msg;
  }

  // ============ Toast ============
  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    this.toastTimer = 2.0;
  }

  // ============ 事件弹窗 ============
  showEventPopup(icon, title, desc) {
    document.getElementById('event-icon').textContent = icon;
    document.getElementById('event-title').textContent = title;
    document.getElementById('event-desc').textContent = desc;
    document.getElementById('event-popup').classList.add('active');
    this.eventPopupTimer = 4.0;
  }
}();

// ============================================================
// 油轮类
// ============================================================
class OilTanker {
  constructor() {
    this.x = MAP.OIL_PATH_START_X;
    this.y = MAP.OIL_PATH_START_Y - OIL_TANKER.height / 2;
    this.width = OIL_TANKER.width;
    this.height = OIL_TANKER.height;
    this.hp = OIL_TANKER.hp;
    this.maxHp = OIL_TANKER.hp;
    this.speed = OIL_TANKER.speed;
    this.alive = true;
    this.safeArrival = false;
    this.damageCooldown = 0;
  }

  update(dt, enemies) {
    if (!this.alive) return;

    // 斜向移动（反向于敌人路径）
    const step = this.speed * 60 * dt;
    this.x -= MAP.PATH_DX * step;  // MAP.PATH_DX 为负，所以反向即为正向
    this.y -= MAP.PATH_DY * step;

    if (this.damageCooldown > 0) this.damageCooldown -= dt;

    // 碰到敌人受伤害
    for (const enemy of enemies) {
      if (!enemy.alive || enemy.air) continue;
      const d = Math.hypot(
        (this.x + this.width / 2) - (enemy.x + enemy.width / 2),
        (this.y + this.height / 2) - (enemy.y + enemy.height / 2)
      );
      // 碰撞半径：两个矩形半宽之和
      const collisionDist = (this.width + enemy.width) / 2 + 16;
      if (d < collisionDist) {
        if (this.damageCooldown <= 0) {
          this.hp -= enemy.dmg * 2;  // 每撞一次扣固定伤害
          this.damageCooldown = 1.0;  // 1秒冷却
          if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
          }
        }
        break;
      }
    }

    // 到达外海
    if (this.x > MAP.OIL_PATH_END_X && this.y < MAP.OIL_PATH_END_Y + 40) {
      this.alive = false;
      this.safeArrival = true;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    // 船体
    ctx.fillStyle = OIL_TANKER.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // 波斯标识
    ctx.fillStyle = '#c4a452';
    ctx.fillRect(this.x + 15, this.y + 2, 8, this.height - 4);
    // 管道
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x + 35, this.y - 4, 10, 4);
    ctx.fillRect(this.x + 40, this.y - 8, 4, 4);
    // 波斯标志
    ctx.fillStyle = '#c0b090';
    ctx.font = '9px sans-serif';
    ctx.fillText('🛢️', this.x + 25, this.y + this.height - 1);

    // 血条
    const barW = this.width;
    const barH = 4;
    const barY = this.y - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x, barY, barW, barH);
    ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#4c4' : '#c44';
    ctx.fillRect(this.x, barY, barW * (this.hp / this.maxHp), barH);
    ctx.restore();
  }
}
