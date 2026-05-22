// ============================================================
// 霍尔木兹狂想曲 — 敌人 AI
// ============================================================

class Enemy {
  constructor(typeKey, hpMul) {
    const cfg = ENEMY_TYPES[typeKey];
    this.type = typeKey;
    this.name = cfg.name;
    this.icon = cfg.icon;
    this.maxHp = Math.floor(cfg.hp * hpMul);
    this.hp = this.maxHp;
    this.speed = cfg.speed;
    this.dmg = cfg.dmg;
    this.bounty = cfg.bounty;
    this.air = cfg.air || false;
    this.stealth = cfg.stealth || false;
    this.color = cfg.color;
    this.width = cfg.width;
    this.height = cfg.height;
    this.landUnit = cfg.landUnit || false;
    this.shoreAttack = cfg.shoreAttack || false;
    this.spawnFlies = cfg.spawnFlies || false;
    this.spawnInterval = cfg.spawnInterval || 5000;

    // 位置（沿斜向路径）
    this.x = MAP.PATH_START_X;
    this.y = this.landUnit ? MAP.SHORE_Y - 30 : MAP.PATH_START_Y - this.height / 2;
    if (this.air) this.y = MAP.PATH_START_Y - 60;

    this.alive = true;
    this.reachedEnd = false;

    // 航母专属计时器
    this.spawnTimer = 0;
    // 被高亮（雷达反隐）
    this.revealed = false;

    // 减速效果
    this.slowAmount = 0;
    this.slowTimer = 0;
  }

  update(dt, towers, game) {
    if (!this.alive || this.reachedEnd) return;

    const effectiveSpeed = this.speed > 0 ? this.speed * (1 - this.slowAmount) : 0;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowAmount = 0;
    }

    // 移动（斜向路径）
    if (this.landUnit) {
      // 鹰酱大兵冲上海岸线
      this.x -= effectiveSpeed * 60 * dt;
      if (this.x <= 40) {
        this.reachedEnd = true;
        this.alive = false;
      }
    } else if (this.air) {
      // 飞行单位沿路径飞行
      const step = effectiveSpeed * 60 * dt;
      this.x += MAP.PATH_DX * step;
      this.y += MAP.PATH_DY * step;
      if (this.x < MAP.DESPAWN_X) {
        this.reachedEnd = true;
        this.alive = false;
      }
    } else {
      // 水面舰艇沿斜向水道
      const step = effectiveSpeed * 60 * dt;
      this.x += MAP.PATH_DX * step;
      this.y += MAP.PATH_DY * step;
      if (this.x < MAP.DESPAWN_X) {
        this.reachedEnd = true;
        this.alive = false;
      }
    }

    // 航母放小苍蝇
    if (this.spawnFlies) {
      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        game.spawnFly(this.x, this.y - 30);
      }
    }

    // 铁壳船对岸射击
    if (this.shoreAttack && towers.length > 0) {
      // 不在 update 中处理攻击，由 game 处理
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true; // 死亡
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();

    if (this.stealth && !this.revealed) ctx.globalAlpha = 0.3;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#223';
    ctx.lineWidth = 1;

    if (this.air) {
      // === 小苍蝇：战斗机 ===
      const bx = this.x, by = this.y;
      // 机身
      ctx.fillStyle = '#aabbcc'; ctx.strokeStyle = '#334';
      ctx.beginPath();
      ctx.moveTo(bx + w, cy);         // 机头
      ctx.lineTo(cx, by);             // 右翼尖
      ctx.lineTo(bx + w * 0.3, cy);   // 后缘
      ctx.lineTo(cx, by + h);         // 左翼尖
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 尾焰
      ctx.fillStyle = '#ff8844';
      ctx.fillRect(bx - 3, cy - 2, 6, 4);

    } else if (this.landUnit) {
      // === 鹰酱大兵：小人 ===
      ctx.fillStyle = '#556b2f'; ctx.strokeStyle = '#334';
      // 身体
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 躯干
      ctx.fillRect(cx - 3, cy + 2, 6, 8);
      // 腿
      ctx.fillRect(cx - 4, cy + 10, 4, 6);
      ctx.fillRect(cx + 1, cy + 10, 4, 6);
      // 枪
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 14, cy - 3);
      ctx.stroke();

    } else if (this.type === 'sub') {
      // === 海底捞：潜艇 ===
      const sx = this.x, sy = this.y;
      ctx.fillStyle = '#224455'; ctx.strokeStyle = '#113';
      // 艇体椭圆
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 指挥塔
      ctx.fillStyle = '#335566';
      ctx.fillRect(cx + w * 0.15, sy - 2, w * 0.2, h * 0.4);
      // 螺旋桨
      ctx.fillStyle = '#445';
      ctx.fillRect(sx + w - 4, cy - 2, 5, 4);

    } else if (this.type === 'carrier') {
      // === 大铁鸟巢：航母 ===
      const ax = this.x, ay = this.y;
      ctx.fillStyle = '#335566'; ctx.strokeStyle = '#224';
      // 船底
      ctx.beginPath();
      ctx.moveTo(ax + 8, ay + h);
      ctx.lineTo(ax + 15, ay + h * 0.6);
      ctx.lineTo(ax + w - 15, ay + h * 0.6);
      ctx.lineTo(ax + w - 8, ay + h);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 甲板
      ctx.fillStyle = '#446677';
      ctx.fillRect(ax + 10, ay, w - 20, h * 0.6);
      ctx.strokeRect(ax + 10, ay, w - 20, h * 0.6);
      // 舰岛
      ctx.fillStyle = '#556677';
      ctx.fillRect(ax + w * 0.6, ay - h * 0.4, w * 0.18, h * 0.5);
      ctx.strokeRect(ax + w * 0.6, ay - h * 0.4, w * 0.18, h * 0.5);
      // 舰载机标记
      ctx.fillStyle = '#8899aa';
      for (let fi = 0; fi < 3; fi++) {
        const fx = ax + 20 + fi * 25;
        ctx.beginPath();
        ctx.moveTo(fx + 12, ay + 2);
        ctx.lineTo(fx + 6, ay - 2);
        ctx.lineTo(fx + 6, ay + 6);
        ctx.closePath(); ctx.fill();
      }

    } else if (this.type === 'cruiser') {
      // === 大铁壳：巡洋舰 ===
      const cx2 = this.x;
      ctx.fillStyle = '#557799'; ctx.strokeStyle = '#335';
      // 船体
      ctx.beginPath();
      ctx.moveTo(cx2 + 6, cy + h / 2);
      ctx.lineTo(cx2 + 14, cy - h / 2 + 4);
      ctx.lineTo(cx2 + w - 10, cy - h / 2 + 4);
      ctx.lineTo(cx2 + w - 3, cy + h / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 上层建筑
      ctx.fillStyle = '#6688aa';
      ctx.fillRect(cx2 + w * 0.25, cy - h / 2 - 4, w * 0.35, h * 0.35);
      ctx.strokeRect(cx2 + w * 0.25, cy - h / 2 - 4, w * 0.35, h * 0.35);
      // 炮塔
      ctx.fillStyle = '#445';
      ctx.beginPath(); ctx.arc(cx2 + w * 0.2, cy - 2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 + w * 0.65, cy - 2, 6, 0, Math.PI * 2); ctx.fill();

    } else if (this.type === 'destroyer') {
      // === 铁壳船：驱逐舰 ===
      const dx = this.x;
      ctx.fillStyle = '#7799bb'; ctx.strokeStyle = '#446';
      // 船体
      ctx.beginPath();
      ctx.moveTo(dx + 5, cy + h / 2);
      ctx.lineTo(dx + 12, cy - h / 2 + 3);
      ctx.lineTo(dx + w - 8, cy - h / 2 + 3);
      ctx.lineTo(dx + w - 3, cy + h / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 舰桥
      ctx.fillStyle = '#88aacc';
      ctx.fillRect(dx + w * 0.3, cy - h / 2 - 3, w * 0.25, h * 0.3);
      ctx.strokeRect(dx + w * 0.3, cy - h / 2 - 3, w * 0.25, h * 0.3);
      // 炮塔
      ctx.fillStyle = '#445';
      ctx.beginPath(); ctx.arc(dx + w * 0.22, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(dx + w * 0.7, cy - 2, 5, 0, Math.PI * 2); ctx.fill();

    } else {
      // === 小舢板：巡逻艇 ===
      const bx = this.x;
      ctx.fillStyle = '#999'; ctx.strokeStyle = '#555';
      // 尖头船体
      ctx.beginPath();
      ctx.moveTo(bx + w, cy);            // 船头
      ctx.lineTo(bx + w * 0.7, cy - h / 2 + 2);
      ctx.lineTo(bx + 2, cy - h / 2 + 4);
      ctx.lineTo(bx, cy + 2);
      ctx.lineTo(bx + 2, cy + h / 2);
      ctx.lineTo(bx + w * 0.7, cy + h / 2 - 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 驾驶舱
      ctx.fillStyle = '#bbb';
      ctx.fillRect(bx + w * 0.5, cy - 3, w * 0.25, 6);
      ctx.strokeRect(bx + w * 0.5, cy - 3, w * 0.25, 6);
    }

    // === 兵棋符号标识（右上角小标） ===
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.icon, cx + w * 0.3, cy - h * 0.4);

    // === 血条 ===
    const barW = w;
    const barH = 4;
    const barY = this.y - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x, barY, barW, barH);
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#cc4' : '#c44';
    ctx.fillRect(this.x, barY, barW * hpPct, barH);

    // 减速标记
    if (this.slowAmount > 0) {
      ctx.fillStyle = '#88ccff88';
      ctx.fillRect(this.x, barY - 2, barW, barH + 4);
    }

    ctx.restore();
  }

  distTo(x, y) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
  }
}
