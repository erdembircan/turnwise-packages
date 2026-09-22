import { cubeFromFaces } from '@turnwise/cube-solver';
import { Moves, SOLVED, compose, effectOf, gridOf, isOddPermutation } from '@turnwise/internal';
import type { CubieState } from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import { drawScrambleState, isWithinOneMove, randomState } from './randomState';
import { seededRandom } from './testing/rng';

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isPermutation(values: readonly number[]): boolean {
  return [...values].sort((a, b) => a - b).every((value, index) => value === index);
}

describe('randomState', () => {
  it('always draws a legal state', () => {
    const random = seededRandom(1);
    for (let draw = 0; draw < 2000; draw++) {
      const state = randomState(random);
      expect(isPermutation(state.cp)).toBe(true);
      expect(isPermutation(state.ep)).toBe(true);
      expect(sum(state.co) % 3).toBe(0);
      expect(sum(state.eo) % 2).toBe(0);
      expect(isOddPermutation(state.cp)).toBe(isOddPermutation(state.ep));
    }
  });

  it('draws states the solver accepts', () => {
    const random = seededRandom(2);
    for (let draw = 0; draw < 200; draw++) {
      const state = randomState(random);
      expect(() => cubeFromFaces(gridOf(state))).not.toThrow();
    }
  });

  it('puts every piece at every position, and every twist and flip, equally often', () => {
    const draws = 60000;
    const random = seededRandom(3);
    const corners = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
    const edges = Array.from({ length: 12 }, () => new Array<number>(12).fill(0));
    const twists = new Array<number>(3).fill(0);
    const flips = new Array<number>(2).fill(0);
    let odd = 0;
    for (let draw = 0; draw < draws; draw++) {
      const state = randomState(random);
      state.cp.forEach((piece, position) => {
        const row = corners[position];
        if (row !== undefined) row[piece] = (row[piece] ?? 0) + 1;
      });
      state.ep.forEach((piece, position) => {
        const row = edges[position];
        if (row !== undefined) row[piece] = (row[piece] ?? 0) + 1;
      });
      for (const twist of state.co) twists[twist] = (twists[twist] ?? 0) + 1;
      for (const flip of state.eo) flips[flip] = (flips[flip] ?? 0) + 1;
      if (isOddPermutation(state.cp)) odd += 1;
    }
    // Every count is within 6% of its expected share: several standard deviations for these
    // sample sizes, far below what a biased draw produces.
    const near = (count: number, expected: number): boolean =>
      Math.abs(count - expected) <= expected * 0.06;
    for (const row of corners) for (const count of row) expect(near(count, draws / 8)).toBe(true);
    // Positions 0 and 1 are the two the parity fix swaps, so they are the ones a flawed fix would bias.
    for (const row of edges) for (const count of row) expect(near(count, draws / 12)).toBe(true);
    for (const count of twists) expect(near(count, (draws * 8) / 3)).toBe(true);
    for (const count of flips) expect(near(count, (draws * 12) / 2)).toBe(true);
    expect(near(odd, draws / 2)).toBe(true);
  });
});

describe('isWithinOneMove', () => {
  it('is true for the solved state', () => {
    expect(isWithinOneMove(SOLVED)).toBe(true);
  });

  it('is true for each of the 18 single moves', () => {
    for (const move of Object.values(Moves)) {
      expect(isWithinOneMove(effectOf(move))).toBe(true);
    }
  });

  it('is false two moves from solved', () => {
    expect(isWithinOneMove(compose(effectOf('R'), effectOf('U')))).toBe(false);
  });
});

describe('drawScrambleState', () => {
  it('draws again when the first draw is the solved state', () => {
    // 18 values that keep every piece in place (each shuffle step picks its own index), then 18
    // zero twists and flips: exactly the solved state. After that, ordinary seeded values.
    const seeded = seededRandom(4);
    let calls = 0;
    const random = (): number => {
      calls += 1;
      if (calls <= 18) return 0.999999;
      if (calls <= 36) return 0;
      return seeded();
    };
    const state: CubieState = drawScrambleState(random);
    expect(calls).toBeGreaterThan(36);
    expect(isWithinOneMove(state)).toBe(false);
  });

  it('rejects a random function that returns a value outside [0, 1)', () => {
    expect(() => drawScrambleState(() => 1)).toThrow(RangeError);
    expect(() => drawScrambleState(() => -0.5)).toThrow(RangeError);
    expect(() => drawScrambleState(() => Number.NaN)).toThrow(
      'The random function returned NaN. It must return a number from 0 up to, but not including, 1, like Math.random does.',
    );
  });
});
