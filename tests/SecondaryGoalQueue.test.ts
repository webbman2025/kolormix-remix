import { describe, it, expect } from 'vitest';
import { SecondaryGoalQueue, isMainSecondaryGoal } from '../src/game/SecondaryGoalQueue';
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

  it('advances the mix preview only when the current goal is matched', () => {
    const q = new SecondaryGoalQueue();
    const first = q.currentGoal()!;
    const second = q.peek(3)[1];

    expect(q.tryComplete('red')).toBe(false);
    expect(q.currentGoal()).toBe(first);
    expect(q.getRemaining(first as 'green' | 'purple' | 'orange')).toBe(25);

    expect(q.tryComplete(first)).toBe(true);
    expect(q.currentGoal()).toBe(second);
    expect(q.getRemaining(first as 'green' | 'purple' | 'orange')).toBe(25);
  });

  it('deducts clear counters without changing the mix preview queue', () => {
    const q = new SecondaryGoalQueue();
    const first = q.currentGoal()!;

    expect(q.recordClear('pink', 5)).toBe(0);
    expect(q.recordClear('green', 3)).toBe(3);
    expect(q.getRemaining('green')).toBe(22);
    expect(q.currentGoal()).toBe(first);
    expect(q.peek(75)).toHaveLength(75);
  });

  it('reports complete when all clear counters reach zero', () => {
    const q = new SecondaryGoalQueue();
    expect(isMainSecondaryGoal('green')).toBe(true);

    q.recordClear('green', COLOR_GOALS.green);
    q.recordClear('purple', COLOR_GOALS.purple);
    q.recordClear('orange', COLOR_GOALS.orange);

    expect(q.isComplete()).toBe(true);
    expect(q.currentGoal()).not.toBeNull();
    expect(q.getRemaining('green')).toBe(0);
    expect(q.getRemaining('purple')).toBe(0);
    expect(q.getRemaining('orange')).toBe(0);
  });
});
