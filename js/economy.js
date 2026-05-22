// ============================================================
// 霍尔木兹狂想曲 — 资源管理
// ============================================================

class Economy {
  constructor() {
    this.money = 350;
    this.reputation = 50;
    this.oilShipsSent = 0;
    this.oilShipsSafe = 0;
    this._sanctionActive = false;
    this._sanctionWaves = 0;
    this._inflationWaves = 0;
  }

  addMoney(amount) {
    this.money += Math.floor(amount);
  }

  spend(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  getInflationMultiplier() {
    return this._inflationWaves > 0 ? 1.2 : 1.0;
  }

  getOilReward() {
    const base = OIL_TANKER.rewardMin + Math.floor(Math.random() * (OIL_TANKER.rewardMax - OIL_TANKER.rewardMin + 1));
    if (this._sanctionActive) return Math.floor(base / 2);
    return base;
  }

  onWaveEnd() {
    if (this._sanctionWaves > 0) {
      this._sanctionWaves--;
      if (this._sanctionWaves <= 0) {
        this._sanctionActive = false;
      }
    }
    if (this._inflationWaves > 0) {
      this._inflationWaves--;
    }
  }

  reset() {
    this.money = 350;
    this.reputation = 50;
    this.oilShipsSent = 0;
    this.oilShipsSafe = 0;
    this._sanctionActive = false;
    this._sanctionWaves = 0;
    this._inflationWaves = 0;
  }
}
