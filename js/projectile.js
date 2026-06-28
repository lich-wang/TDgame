// ============================================================
// 霍尔木兹狂想曲 — 弹道系统
// ============================================================

class Projectile {
  constructor(x, y, target, dmg, config) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.speed = config.speed || 5;
    this.color = config.color || '#fff';
    this.size = config.size || 3;
    this.trail = config.trail || false;
    this.alive = true;
    this.age = 0;
    this.homing = config.homing || false;
    this.pierce = config.pierce || false;
    this.air = config.air || false;
    this.spriteKey = config.spriteKey || (this.trail ? 'missile' : this.air ? 'aa' : this.size <= 4 ? 'drone' : 'shell');

    // 朝向（用于绘制弹药形状）
    this.angle = 0;
    if (target) {
      this.angle = Math.atan2(
        target.y + target.height / 2 - y,
        target.x + target.width / 2 - x
      );
    }
  }

  update(dt) {
    if (!this.alive) return;
    if (!this.target || this.target.hp <= 0) {
      this.alive = false;
      return;
    }

    const tx = this.target.x + this.target.width / 2;
    const ty = this.target.y + this.target.height / 2;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      this.alive = false;
      this.target.takeDamage(this.dmg);
      return;
    }

    this.angle = Math.atan2(dy, dx);
    const move = this.speed * 60 * dt;
    this.x += Math.cos(this.angle) * move;
    this.y += Math.sin(this.angle) * move;
    this.age += dt;
  }

  draw(ctx) {
    if (!this.alive) return;
    if (GAME_SPRITES.drawProjectile(ctx, this.spriteKey, this.x, this.y, this.size, this.angle)) {
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const isTrail = this.trail;
    const isSwarm = this.size <= 4 && !isTrail;

    if (isTrail) {
      // === 窜天猴：反舰导弹 ===
      // 弹体
      ctx.fillStyle = '#ddd';
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size + 3, this.size - 1, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 弹头
      ctx.fillStyle = '#cc3333';
      ctx.beginPath();
      ctx.arc(this.size + 1, 0, this.size - 1, 0, Math.PI * 2);
      ctx.fill();
      // 尾翼
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(-this.size - 3, -3);
      ctx.lineTo(-this.size - 1, 0);
      ctx.lineTo(-this.size - 3, 3);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-this.size - 3, 0);
      ctx.lineTo(-this.size - 1, -3);
      ctx.lineTo(-this.size - 1, 3);
      ctx.closePath(); ctx.fill();
      // 尾焰
      const flicker = 1 + Math.sin(this.age * 20) * 0.3;
      ctx.fillStyle = '#ff8844';
      ctx.beginPath();
      ctx.moveTo(-this.size - 4, -2);
      ctx.lineTo(-this.size - 10 * flicker, 0);
      ctx.lineTo(-this.size - 4, 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.moveTo(-this.size - 3, -1);
      ctx.lineTo(-this.size - 6 * flicker, 0);
      ctx.lineTo(-this.size - 3, 1);
      ctx.closePath(); ctx.fill();
      // 尾迹线
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-this.size - 4, 0);
      ctx.lineTo(-this.size - 30, 0);
      ctx.stroke();

    } else if (isSwarm) {
      // === 小摩托：无人机蜂群 ===
      // 机身菱形
      ctx.fillStyle = '#aabbbb';
      ctx.strokeStyle = '#667';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 旋翼横线
      ctx.strokeStyle = '#889';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
      // 尾焰小点
      ctx.fillStyle = '#ff884488';
      ctx.beginPath();
      ctx.arc(-7, 0, 2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // === 波斯拳 / 拍苍蝇：炮弹/防空导弹 ===
      const isAA = this.air;
      // 弹体
      const bodyColor = isAA ? '#ffcc00' : this.color;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size + 1, this.size - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // 弹头亮色
      ctx.fillStyle = isAA ? '#fff' : '#ffe8a0';
      ctx.beginPath();
      ctx.arc(this.size, 0, this.size - 2, 0, Math.PI * 2);
      ctx.fill();
      // 尾焰
      const flick = 1 + Math.sin(this.age * 25) * 0.25;
      ctx.fillStyle = isAA ? '#ff6600' : '#ffaa44';
      ctx.beginPath();
      ctx.moveTo(-this.size - 1, -1.5);
      ctx.lineTo(-this.size - 5 * flick, 0);
      ctx.lineTo(-this.size - 1, 1.5);
      ctx.closePath(); ctx.fill();
      // 拖尾痕迹
      ctx.fillStyle = bodyColor + '33';
      ctx.fillRect(-this.size - 8, -1, -8, 2);
    }

    ctx.restore();
  }
}
