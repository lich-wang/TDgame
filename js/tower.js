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
    const drewSprite = GAME_SPRITES.drawTower(ctx, this.type, this.level, this.x, this.y);
    if (!drewSprite) {
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
    }

    ctx.restore();
  }

  drawMines(ctx) {
    if (!this.isMine) return;
    for (const mine of this.minesPlaced) {
      ctx.save();
      const drewMine = GAME_SPRITES.drawProjectile(ctx, 'mine', mine.x, mine.y, 13, 0);
      if (!drewMine) {
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#f0c050';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
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

class Minelayer {
  constructor(slot) {
    this.type = 'mine';
    this.cfg = TOWER_TYPES.mine;
    this.level = 0;
    this.slot = slot;
    this.width = 54;
    this.height = 28;

    const lv = this.getLevelData();
    this.maxHp = lv.hp || 70;
    this.hp = this.maxHp;
    this.dmg = lv.dmg || 30;
    this.range = lv.range || 0;
    this.speed = lv.speed || 0.9;
    this.name = lv.name || this.cfg.name;
    this.maxMines = lv.mineCount || 3;
    this.minesPlaced = [];

    this.routeForward = true;
    this.routeStart = this._pointOnRoute(-82, 28);
    this.routeEnd = this._pointOnRoute(82, -20);
    this.x = this.routeStart.x - this.width / 2;
    this.y = this.routeStart.y - this.height / 2;
    this.mineTimer = 0.2;
    this.mineInterval = 1.35;
    this.hitFlash = 0;
    this.alive = true;
    this.destroyed = false;
    this.status = '出航';
  }

  getLevelData() {
    return this.cfg.levels[this.level];
  }

  _pointOnRoute(along, across) {
    const nx = -MAP.PATH_DY;
    const ny = MAP.PATH_DX;
    return {
      x: this.slot.x + MAP.PATH_DX * along + nx * across,
      y: this.slot.y + MAP.PATH_DY * along + ny * across,
    };
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  distTo(x, y) {
    return Math.hypot(this.centerX - x, this.centerY - y);
  }

  update(dt, enemies, projectiles) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    this._move(dt);
    this.mineTimer -= dt;
    if (this.mineTimer <= 0 && this.minesPlaced.length < this.maxMines) {
      this.mineTimer = this.mineInterval;
      this.layMine();
    }
    this._checkMines(enemies, projectiles);
  }

  _move(dt) {
    const target = this.routeForward ? this.routeEnd : this.routeStart;
    const tx = target.x - this.width / 2;
    const ty = target.y - this.height / 2;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * 44 * dt;

    if (dist <= step) {
      this.x = tx;
      this.y = ty;
      this.routeForward = !this.routeForward;
      this.status = this.minesPlaced.length >= this.maxMines ? '巡航警戒' : '转向布雷';
      return;
    }

    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.status = this.minesPlaced.length >= this.maxMines ? '巡航警戒' : '布雷中';
  }

  layMine() {
    if (!this.alive || this.minesPlaced.length >= this.maxMines) return false;
    const lv = this.getLevelData();
    const wakeBack = this.routeForward ? -18 : 18;
    const drift = (this.minesPlaced.length % 2 === 0 ? 1 : -1) * 8;
    const nx = -MAP.PATH_DY;
    const ny = MAP.PATH_DX;
    const mine = {
      x: this.centerX + MAP.PATH_DX * wakeBack + nx * drift,
      y: this.centerY + MAP.PATH_DY * wakeBack + ny * drift,
      dmg: this.dmg,
      range: lv.magnetic ? this.range : 0,
      active: true,
    };
    this.minesPlaced.push(mine);
    this.status = '投放水雷';
    return true;
  }

  _checkMines(enemies, projectiles) {
    for (const mine of this.minesPlaced) {
      if (!mine.active) continue;
      for (const enemy of enemies) {
        if (!enemy.alive || enemy.air) continue;
        const d = enemy.distTo(mine.x, mine.y);
        const triggerRange = mine.range > 0 ? mine.range : 25;
        if (d < triggerRange) {
          mine.active = false;
          enemy.takeDamage(mine.dmg);
          projectiles.push(new ExplosionEffect(mine.x, mine.y, 24));
          break;
        }
      }
    }
    this.minesPlaced = this.minesPlaced.filter(mine => mine.active);
  }

  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.hitFlash = 0.18;
    this.status = '遭攻击';
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.destroyed = true;
      this.slot.occupied = false;
      this.status = '被击毁';
      return true;
    }
    return false;
  }

  drawMines(ctx) {
    for (const mine of this.minesPlaced) {
      ctx.save();
      const drewMine = GAME_SPRITES.drawProjectile(ctx, 'mine', mine.x, mine.y, 12, 0);
      if (!drewMine) {
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#20252a';
        ctx.fill();
        ctx.strokeStyle = '#d7b56a';
        ctx.stroke();
      }
      if (mine.range > 0) {
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(230,70,60,0.18)';
        ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    if (this.hitFlash > 0) ctx.globalAlpha = 0.62;

    const cx = this.centerX;
    const cy = this.centerY;
    const angle = Math.atan2(MAP.PATH_DY, MAP.PATH_DX) + (this.routeForward ? 0 : Math.PI);

    ctx.save();
    ctx.translate(cx, cy + 12);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const drewBoat = GAME_SPRITES.drawTower(ctx, 'mine', this.level, cx, cy + 7, { angle, scale: 0.62 });
    if (!drewBoat) {
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = '#52636b';
      ctx.strokeStyle = '#1e2a31';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(14, -10);
      ctx.lineTo(-24, -8);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-24, 8);
      ctx.lineTo(14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b6c2c8';
      ctx.fillRect(-2, -7, 16, 14);
    }
    ctx.restore();

    ctx.save();
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(4,8,12,0.72)';
    ctx.fillRect(cx - 24, cy - 24, 48, 5);
    ctx.fillStyle = hpPct > 0.45 ? '#70d090' : '#e06a5a';
    ctx.fillRect(cx - 24, cy - 24, 48 * hpPct, 5);
    ctx.fillStyle = '#d8ecf2';
    ctx.font = '9px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.minesPlaced.length}/${this.maxMines}`, cx, cy + 25);
    ctx.restore();
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
