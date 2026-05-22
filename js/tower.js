// ============================================================
// 霍尔木兹狂想曲 — 防御设施
// ============================================================

class Tower {
  constructor(typeKey, slot) {
    this.type = typeKey;
    this.cfg = TOWER_TYPES[typeKey];
    this.level = 0; // 0-based index
    this.slot = slot;
    this.x = slot.x;
    this.y = slot.y;

    const lv = this.cfg.levels[this.level];
    this.dmg = lv.dmg || 0;
    this.attackSpeed = lv.speed || 0;
    this.range = lv.range || 0;
    this.name = lv.name || this.cfg.name;
    this.isRadar = typeKey === 'radar';
    this.isMine = typeKey === 'mine';

    // 攻击计时器
    this.cooldown = 0;
    // 水雷已放置
    this.minesPlaced = [];
    this.maxMines = typeKey === 'mine' ? 3 : 0;

    // 雷达覆盖效果
    this.revealRange = lv.reveal || 0;
    this.antiStealth = lv.antiStealth || false;
    this.dmgBoost = lv.dmgBoost || 0;
  }

  getLevelData() {
    return this.cfg.levels[this.level];
  }

  getUpgradeCost() {
    if (this.level >= 2) return Infinity;
    return UPGRADE_COSTS[this.type][this.level];
  }

  upgrade() {
    if (this.level >= 2) return false;
    this.level++;
    const lv = this.cfg.levels[this.level];
    this.dmg = lv.dmg || 0;
    this.attackSpeed = lv.speed || 0;
    this.range = lv.range || 0;
    this.name = lv.name;
    this.revealRange = lv.reveal || 0;
    this.antiStealth = lv.antiStealth || false;
    this.dmgBoost = lv.dmgBoost || 0;
    if (this.type === 'mine') this.maxMines = 4 + this.level;
    return true;
  }

  findTarget(enemies) {
    let best = null;
    let bestDist = Infinity;
    const effectiveRange = this.range;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      // 防空只打空中
      if (this.type === 'aa' && !enemy.air) continue;
      // 非防空不打空中（除非反舰导弹也能打？暂不允许）
      if (this.type !== 'aa' && enemy.air) continue;
      // 水雷不寻敌
      if (this.isMine) continue;
      // 雷达不攻击
      if (this.isRadar) continue;

      const d = enemy.distTo(this.x, this.y);
      if (d <= effectiveRange && d < bestDist) {
        // 隐身的且未被反隐且非雷达塔则不可见
        if (enemy.stealth && !enemy.revealed) continue;
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  update(dt, enemies, projectiles) {
    // 雷达效果：揭露隐形敌人
    if (this.isRadar && this.revealRange > 0) {
      for (const enemy of enemies) {
        if (enemy.stealth && enemy.alive) {
          const d = enemy.distTo(this.x, this.y);
          if (d <= this.revealRange) enemy.revealed = true;
          else if (!this.antiStealth) enemy.revealed = false;
        }
      }
      return;
    }

    // 水雷：自动在范围内放置
    if (this.isMine && this.minesPlaced.length < this.maxMines) {
      const lv = this.getLevelData();
      const magRange = lv.magnetic ? lv.range : 0;
      // 沿斜向水道随机放置
      const t = 0.08 + Math.random() * 0.84;  // 路径 8%~92%
      const mx = MAP.PATH_START_X + (MAP.PATH_END_X - MAP.PATH_START_X) * t;
      const my = MAP.PATH_START_Y + (MAP.PATH_END_Y - MAP.PATH_START_Y) * t + (Math.random() - 0.5) * 30;
      this.minesPlaced.push({ x: mx, y: my, dmg: this.dmg, range: magRange, active: true });
    }

    // 水雷检测碰撞
    if (this.isMine) {
      for (const mine of this.minesPlaced) {
        if (!mine.active) continue;
        for (const enemy of enemies) {
          if (!enemy.alive || enemy.air) continue;
          const d = enemy.distTo(mine.x, mine.y);
          const triggerRange = mine.range > 0 ? mine.range : 25;
          if (d < triggerRange) {
            mine.active = false;
            enemy.takeDamage(mine.dmg);
            // 添加爆炸特效
            projectiles.push(new ExplosionEffect(mine.x, mine.y, 20));
            break;
          }
        }
      }
      this.minesPlaced = this.minesPlaced.filter(m => m.active);
      return;
    }

    // 攻击
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return;
    }

    const target = this.findTarget(enemies);
    if (!target) return;

    // 发射投影物
    const pcfg = this.cfg.projectile;
    const lv = this.getLevelData();

    // 窜天猴 homing
    const isHoming = lv.homing || false;
    const isPierce = lv.pierce || false;

    // 小摩托 swarm
    if (lv.swarm) {
      for (let i = 0; i < lv.swarm; i++) {
        const spreadTarget = enemies.filter(e => e.alive && !e.air)[
          Math.floor(Math.random() * enemies.filter(e => e.alive && !e.air).length)
        ];
        if (spreadTarget) {
          const px = this.x + (Math.random() - 0.5) * 20;
          const py = this.y + (Math.random() - 0.5) * 20;
          projectiles.push(new Projectile(px, py, spreadTarget, this.dmg, {
            ...pcfg,
            homing: true,
            speed: pcfg.speed + Math.random() * 2,
          }));
        }
      }
    }
    // 双管
    else if (lv.double) {
      projectiles.push(new Projectile(this.x - 4, this.y, target, this.dmg, { ...pcfg, homing: isHoming }));
      projectiles.push(new Projectile(this.x + 4, this.y, target, this.dmg, { ...pcfg, homing: isHoming }));
    }
    // 普通
    else {
      projectiles.push(new Projectile(this.x, this.y, target, this.dmg, { ...pcfg, homing: isHoming }));
    }

    this.cooldown = this.attackSpeed;
  }

  draw(ctx) {
    // 射程圈（选中时）
    ctx.save();
    if (this.range > 0 && this.hovered) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(240,192,80,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 雷达范围
    if (this.isRadar && this.revealRange > 0 && this.hovered) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.revealRange, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,200,80,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 塔本体
    const icon = this.cfg.icon;
    const size = this.isRadar ? 16 : 14;
    ctx.save();
    // 底座
    ctx.fillStyle = '#3a3020';
    ctx.beginPath();
    ctx.arc(this.x, this.y, size + 2, 0, Math.PI * 2);
    ctx.fill();

    // 底色
    const levelColors = ['#6a5a3a', '#8a6a3a', '#aa7a3a'];
    ctx.fillStyle = levelColors[this.level] || '#6a5a3a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0c05044';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 图标
    ctx.font = `${this.isRadar ? 18 : size + 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, this.x, this.y - 1);

    // 等级标记
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#f0c050';
    ctx.fillText('★'.repeat(this.level + 1), this.x, this.y + size + 10);

    // 水雷数
    if (this.isMine) {
      ctx.fillText(`🥫×${this.minesPlaced.length}/${this.maxMines}`, this.x, this.y + size + 20);
    }

    ctx.restore();
  }

  drawMines(ctx) {
    if (!this.isMine) return;
    for (const mine of this.minesPlaced) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      ctx.strokeStyle = '#f0c050';
      ctx.lineWidth = 1;
      ctx.stroke();
      // 磁性环
      if (mine.range > 0) {
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240,50,50,0.2)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  destroy() {
    this.slot.occupied = false;
  }
}

// 爆炸特效
class ExplosionEffect {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.alive = true;
    this.age = 0;
    this.duration = 0.3;
  }

  update(dt) {
    this.age += dt;
    if (this.age > this.duration) this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;
    const t = this.age / this.duration;
    const r = this.maxRadius * (1 + t * 2);
    const alpha = 1 - t;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,150,30,${alpha * 0.6})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,100,${alpha * 0.8})`;
    ctx.fill();
    ctx.restore();
  }
}
