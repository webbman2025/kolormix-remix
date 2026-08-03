import { describe, it, expect } from 'vitest';
import {
  canMerge,
  merge,
  resolveWildcardMerge,
  getPrimaryRecipe,
  isMergeAllowedForGoal,
  isPrimaryForGoal,
} from '../src/game/ColorMixer';

describe('ColorMixer', () => {
  it('merges per Kolormix help screen recipes', () => {
    expect(merge('blue', 'red')).toBe('purple');
    expect(merge('blue', 'yellow')).toBe('green');
    expect(merge('red', 'yellow')).toBe('orange');
    expect(merge('red', 'white')).toBe('pink');
    expect(merge('blue', 'white')).toBe('cyan');
    expect(merge('black', 'white')).toBe('grey');
  });

  it('exposes correct recipes for preview goals', () => {
    expect(getPrimaryRecipe('purple')).toEqual(['blue', 'red']);
    expect(getPrimaryRecipe('pink')).toEqual(['red', 'white']);
    expect(getPrimaryRecipe('grey')).toEqual(['black', 'white']);
  });

  it('rejects invalid merges', () => {
    expect(merge('red', 'red')).toBeNull();
    expect(merge('purple', 'green')).toBeNull();
    expect(merge('purple', 'orange')).toBeNull();
    expect(canMerge('purple', 'green')).toBe(false);
    expect(merge('wildcard', 'wildcard')).toBeNull();
  });

  it('wildcard merges with base colors', () => {
    expect(canMerge('wildcard', 'red')).toBe(true);
    expect(resolveWildcardMerge('red')).not.toBeNull();
    expect(resolveWildcardMerge('white')).not.toBeNull();
  });

  it('order does not matter', () => {
    expect(merge('red', 'blue')).toBe('purple');
    expect(merge('white', 'black')).toBe('grey');
  });

  it('restricts selection and merges to the current secondary goal', () => {
    expect(isPrimaryForGoal('red', 'purple')).toBe(true);
    expect(isPrimaryForGoal('blue', 'purple')).toBe(true);
    expect(isPrimaryForGoal('yellow', 'purple')).toBe(false);
    expect(isMergeAllowedForGoal('red', 'blue', 'purple')).toBe(true);
    expect(isMergeAllowedForGoal('red', 'yellow', 'purple')).toBe(false);
    expect(isMergeAllowedForGoal('red', 'yellow', null)).toBe(true);
  });
});
