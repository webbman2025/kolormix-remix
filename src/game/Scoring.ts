import { CONFIG } from '../config';

export class Scoring {
  score = 0;
  comboCount = 0;
  mergeCount = 0;
  comboBonuses = 0;

  recordMerge(): { points: number; comboBonus: number; isCombo: boolean } {
    this.mergeCount++;
    this.comboCount++;
    let points = CONFIG.SCORE_MERGE;
    let comboBonus = 0;
    let isCombo = false;

    if (this.comboCount >= CONFIG.COMBO_THRESHOLD) {
      comboBonus = CONFIG.SCORE_COMBO_BONUS;
      isCombo = true;
      this.comboBonuses++;
    }

    this.score += points + comboBonus;
    return { points, comboBonus, isCombo };
  }

  recordClear(): number {
    this.score += CONFIG.SCORE_CLEAR_BONUS;
    this.resetCombo();
    return CONFIG.SCORE_CLEAR_BONUS;
  }

  resetCombo(): void {
    this.comboCount = 0;
  }

  addTimeBonus(remainingSeconds: number): number {
    const bonus = remainingSeconds * CONFIG.SCORE_TIME_MULTIPLIER;
    this.score += bonus;
    return bonus;
  }

  reset(): void {
    this.score = 0;
    this.comboCount = 0;
    this.mergeCount = 0;
    this.comboBonuses = 0;
  }
}
