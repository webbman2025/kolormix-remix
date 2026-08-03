import { describe, it, expect } from 'vitest';
import { SecondaryGoalQueue } from '../src/game/SecondaryGoalQueue';
import { COLOR_GOALS } from '../src/config';

describe('SecondaryGoalQueue', () => {
  it('starts with 25 of each main secondary in the queue', () => {
    const q = new SecondaryGoalQueue();
    const total = COLOR_GOALS.green + COLOR_GOALS.purple + COLOR_GOALS.orange;
    expect(q.peek(total)).toHaveLength(total);
    expect(q.getRemaining('green')).toBe(25);
    expect(q.getRemaining('purple')).toBe(25);
    expect(q.getRemaining('orange')).toBe(25);
  });

  it('peeks at least 3 upcoming main secondary goals', () => {
    const q = new SecondaryGoalQueue();
    const goals = q.peek(3);
    expect(goals).toHaveLength(3);
    goals.forEach((g) => {
      expect(['purple', 'orange', 'green']).toContain(g);
    });
  });

  it('advances only when current goal is matched and decrements remaining', () => {
    const q = new SecondaryGoalQueue();
    const first = q.currentGoal()!;
    const second = q.peek(3)[1];
    expect(q.tryComplete('red')).toBe(false);
    expect(q.currentGoal()).toBe(first);
    expect(q.getRemaining(first as 'green' | 'purple' | 'orange')).toBe(25);
    expect(q.tryComplete(first)).toBe(true);
    expect(q.currentGoal()).toBe(second);
    expect(q.getRemaining(first as 'green' | 'purple' | 'orange')).toBe(24);
  });

  it('reports complete when all 75 goals are finished', () => {
    const q = new SecondaryGoalQueue();
    const total = COLOR_GOALS.green + COLOR_GOALS.purple + COLOR_GOALS.orange;
    for (let i = 0; i < total; i++) {
      const goal = q.currentGoal()!;
      expect(q.tryComplete(goal)).toBe(true);
    }
    expect(q.isComplete()).toBe(true);
    expect(q.currentGoal()).toBeNull();
  });
});
