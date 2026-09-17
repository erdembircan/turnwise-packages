import { describe, expect, it } from 'vitest';
import { Moves, faceOf, formatAlgorithm, inverse, turnsOf, type Move } from './move';
import * as api from './index';

const ALL_MOVES: readonly Move[] = [
  'U',
  'U2',
  'U_PRIME',
  'R',
  'R2',
  'R_PRIME',
  'F',
  'F2',
  'F_PRIME',
  'D',
  'D2',
  'D_PRIME',
  'L',
  'L2',
  'L_PRIME',
  'B',
  'B2',
  'B_PRIME',
];

// Widens a string literal to `string`, standing in for a value a plain-JavaScript caller could
// pass at runtime, where `Move`'s literal-type safety does not apply.
function asRuntimeString(value: string): string {
  return value;
}

const UNKNOWN_MOVE_MESSAGE = (bad: string): string =>
  `Unknown move ${JSON.stringify(bad)}. A move is one of the 18 values in Moves, such as "R", "R2" or "R_PRIME".`;

function expectThrowsUnknownMove(check: () => unknown, message: string): void {
  let caught: unknown;
  try {
    check();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(TypeError);
  if (caught instanceof TypeError) {
    expect(caught.message).toBe(message);
  }
}

describe('Moves', () => {
  it('has keys U, U2, U_PRIME, R, R2, R_PRIME, F, F2, F_PRIME, D, D2, D_PRIME, L, L2, L_PRIME, B, B2, B_PRIME in that order', () => {
    expect(Object.keys(Moves)).toEqual([
      'U',
      'U2',
      'U_PRIME',
      'R',
      'R2',
      'R_PRIME',
      'F',
      'F2',
      'F_PRIME',
      'D',
      'D2',
      'D_PRIME',
      'L',
      'L2',
      'L_PRIME',
      'B',
      'B2',
      'B_PRIME',
    ]);
  });

  it('maps every key to itself', () => {
    for (const key of Object.keys(Moves) as (keyof typeof Moves)[]) {
      expect(Moves[key]).toBe(key);
    }
  });
});

describe('faceOf', () => {
  it('returns the first character of the move name for every move', () => {
    for (const move of ALL_MOVES) {
      expect(faceOf(move)).toBe(move.charAt(0));
    }
  });
});

describe('turnsOf', () => {
  it('returns 1 for a plain move, 2 for a move ending in 2, and 3 for a move ending in _PRIME', () => {
    for (const move of ALL_MOVES) {
      const expected = move.endsWith('_PRIME') ? 3 : move.endsWith('2') ? 2 : 1;
      expect(turnsOf(move)).toBe(expected);
    }
  });
});

describe('inverse', () => {
  describe('single move', () => {
    it('undoes itself when inverted twice', () => {
      for (const move of ALL_MOVES) {
        expect(inverse(inverse(move))).toBe(move);
      }
    });

    it('keeps the same face and has turns that sum to a multiple of 4', () => {
      for (const move of ALL_MOVES) {
        expect(faceOf(inverse(move))).toBe(faceOf(move));
        expect((turnsOf(move) + turnsOf(inverse(move))) % 4).toBe(0);
      }
    });

    it('is its own inverse for every half turn', () => {
      const halfTurns = ALL_MOVES.filter((move) => move.endsWith('2'));
      for (const move of halfTurns) {
        expect(inverse(move)).toBe(move);
      }
    });
  });

  describe('sequence', () => {
    it('inverts every move and reverses their order', () => {
      expect(inverse(['R', 'U', 'F2'])).toEqual(['F2', 'U_PRIME', 'R_PRIME']);
    });

    it('returns a new array and does not mutate its argument', () => {
      const input: Move[] = ['R', 'U'];
      Object.freeze(input);
      const result = inverse(input);
      expect(input).toEqual(['R', 'U']);
      expect(result).not.toBe(input);
    });

    it('returns an empty array for an empty sequence', () => {
      expect(inverse([])).toEqual([]);
    });
  });
});

describe('formatAlgorithm', () => {
  it('formats moves in traditional notation separated by spaces', () => {
    expect(formatAlgorithm(['R', 'U_PRIME', 'F2'])).toBe("R U' F2");
  });

  it('returns an empty string for an empty sequence', () => {
    expect(formatAlgorithm([])).toBe('');
  });
});

describe('unknown move guard', () => {
  it('throws a TypeError from every helper for an unknown move', () => {
    const bad = asRuntimeString('R3');
    const message = UNKNOWN_MOVE_MESSAGE(bad);
    expectThrowsUnknownMove(() => faceOf(bad as Move), message);
    expectThrowsUnknownMove(() => turnsOf(bad as Move), message);
    expectThrowsUnknownMove(() => inverse(bad as Move), message);
    expectThrowsUnknownMove(() => inverse([bad as Move]), message);
    expectThrowsUnknownMove(() => formatAlgorithm([bad as Move]), message);
  });

  it('does not accept inherited property names', () => {
    const bad = asRuntimeString('toString');
    const message = UNKNOWN_MOVE_MESSAGE(bad);
    expectThrowsUnknownMove(() => faceOf(bad as Move), message);
  });
});

describe('index barrel', () => {
  it('re-exports the same bindings as ./move', () => {
    expect(api.Moves).toBe(Moves);
    expect(api.inverse).toBe(inverse);
    expect(api.faceOf).toBe(faceOf);
    expect(api.turnsOf).toBe(turnsOf);
    expect(api.formatAlgorithm).toBe(formatAlgorithm);
  });
});
