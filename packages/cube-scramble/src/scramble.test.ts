import * as solver from '@turnwise/cube-solver';
import { Efforts, cubeFromMoves, facesFromCube, isSolved, applyMoves } from '@turnwise/cube-solver';
import { gridOf } from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import * as api from './index';
import { drawScrambleState } from './randomState';
import { scramble } from './scramble';
import { secureRandom } from './secureRandom';
import { seededRandom } from './testing/rng';

describe('scramble', () => {
  it('gives the same moves for the same seed, and different moves for another seed', () => {
    const first = scramble({ random: seededRandom(7), effort: Efforts.fast });
    expect(scramble({ random: seededRandom(7), effort: Efforts.fast })).toEqual(first);
    expect(scramble({ random: seededRandom(8), effort: Efforts.fast })).not.toEqual(first);
  });

  it('takes a solved cube exactly to the state drawn from the same seed', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const moves = scramble({ random: seededRandom(seed), effort: Efforts.fast });
      const drawn = drawScrambleState(seededRandom(seed));
      expect(facesFromCube(cubeFromMoves(moves)), `seed ${String(seed)}`).toEqual(gridOf(drawn));
    }
  });

  it('works at both efforts, and every scramble is undone by solving it', () => {
    for (const effort of [Efforts.fast, Efforts.full]) {
      const moves = scramble({ random: seededRandom(11), effort });
      expect(moves.length).toBeGreaterThanOrEqual(2);
      const scrambled = cubeFromMoves(moves);
      expect(isSolved(applyMoves(scrambled, solver.solve(scrambled)))).toBe(true);
    }
  });

  it('uses full effort when none is given', () => {
    expect(scramble({ random: seededRandom(3) })).toEqual(
      scramble({ random: seededRandom(3), effort: Efforts.full }),
    );
  });

  it('draws from the secure generator when no random function is given', () => {
    const first = scramble({ effort: Efforts.fast });
    const second = scramble({ effort: Efforts.fast });
    expect(first.length).toBeGreaterThanOrEqual(2);
    expect(second).not.toEqual(first);
  });

  it("rejects an unknown effort with the solver's TypeError", () => {
    const effort = 'turbo' as unknown as solver.Effort;
    expect(() => scramble({ random: seededRandom(1), effort })).toThrow(TypeError);
  });
});

describe('secureRandom', () => {
  it('returns numbers from 0 up to, but not including, 1', () => {
    const values = Array.from({ length: 10000 }, () => secureRandom());
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(9990);
  });
});

describe('the package entry', () => {
  it("re-exports the solver's own bindings, not copies", () => {
    expect(api.formatAlgorithm).toBe(solver.formatAlgorithm);
    expect(api.Efforts).toBe(solver.Efforts);
    expect(api.prepare).toBe(solver.prepare);
  });
});
