import { describe, it, expect } from 'vitest';
import { Scoring } from '../src/game/Scoring';
import { CONFIG } from '../src/config';

describe('Scoring', () => {
  it('awards points per merge', () => {
    const scoring = new Scoring();
    const { points } = scoring.recordMerge();
    expect(points).toBe(CONFIG.SCORE_MERGE);
    expect(scoring.score).toBe(CONFIG.SCORE_MERGE);
  });

  it('awards combo bonus at threshold', () => {
    const scoring = new Scoring();
    scoring.recordMerge();
    scoring.recordMerge();
    const { comboBonus, isCombo } = scoring.recordMerge();
    expect(isCombo).toBe(true);
    expect(comboBonus).toBe(CONFIG.SCORE_COMBO_BONUS);
    expect(scoring.score).toBe(CONFIG.SCORE_MERGE * 3 + CONFIG.SCORE_COMBO_BONUS);
  });

  it('calculates time bonus', () => {
    const scoring = new Scoring();
    const bonus = scoring.addTimeBonus(45);
    expect(bonus).toBe(90);
    expect(scoring.score).toBe(90);
  });

  it('awards clear bonus and resets combo', () => {
    const scoring = new Scoring();
    scoring.recordMerge();
    scoring.recordMerge();
    scoring.recordMerge();
    expect(scoring.comboCount).toBe(3);
    const bonus = scoring.recordClear();
    expect(bonus).toBe(CONFIG.SCORE_CLEAR_BONUS);
    expect(scoring.comboCount).toBe(0);
  });

  it('awards wildcard collect bonus', () => {
    const scoring = new Scoring();
    const bonus = scoring.recordWildcardCollect();
    expect(bonus).toBe(CONFIG.SCORE_COMBO_BONUS);
    expect(scoring.score).toBe(CONFIG.SCORE_COMBO_BONUS);
  });
});
