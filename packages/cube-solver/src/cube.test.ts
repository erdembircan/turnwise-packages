import { describe, expect, it } from 'vitest';
import { applyMoves, cubeFromMoves, isSolved } from './cube';
import type { Cube } from './cube';
import { facesFromCube } from './grid';
import { Moves, at, inverse } from '@turnwise/internal';
import type { Move } from '@turnwise/internal';
import { randomMoves } from './testing/grids';
import { seededRandom } from './testing/rng';

const MOVE_POOL: readonly Move[] = Object.values(Moves);

// Widens a string literal to `string`, standing in for a value a plain-JavaScript caller could
// pass at runtime, where `Move`'s literal-type safety does not apply.
function asRuntimeString(value: string): string {
  return value;
}

// Draws `length` moves from an already-created rng, so two sequences can be drawn back to back
// from the same continuing stream. `randomMoves` (from testing/grids) always starts a fresh rng
// from a seed, which does not fit that.
function movesFrom(rng: () => number, length: number): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < length; i++) {
    moves.push(at(MOVE_POOL, Math.floor(rng() * MOVE_POOL.length)));
  }
  return moves;
}

const CUBE_GUARD_MESSAGE =
  'Expected a Cube created by this package. A Cube cannot be written by hand, and does not survive JSON or postMessage.';

function expectThrowsCubeGuard(check: () => unknown): void {
  let caught: unknown;
  try {
    check();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(TypeError);
  if (caught instanceof TypeError) {
    expect(caught.message).toBe(CUBE_GUARD_MESSAGE);
  }
}

const UNKNOWN_MOVE_MESSAGE = (bad: string): string =>
  `Unknown move ${JSON.stringify(bad)}. A move is one of the 18 values in Moves, such as "R", "R2" or "R_PRIME".`;

describe('cubeFromMoves', () => {
  it('gives a solved cube for an empty list of moves', () => {
    expect(isSolved(cubeFromMoves([]))).toBe(true);
  });

  it('gives an unsolved cube for a single move', () => {
    expect(isSolved(cubeFromMoves(['R']))).toBe(false);
  });

  it('gives a frozen, propertyless value', () => {
    const cube = cubeFromMoves(['R', 'U']);
    expect(Object.isFrozen(cube)).toBe(true);
    expect(Object.keys(cube).length).toBe(0);
  });

  it('throws the unknown move TypeError for an unknown move at runtime', () => {
    const bad = asRuntimeString('R3');
    let caught: unknown;
    try {
      cubeFromMoves([bad as Move]);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(TypeError);
    if (caught instanceof TypeError) {
      expect(caught.message).toBe(UNKNOWN_MOVE_MESSAGE(bad));
    }
  });
});

describe('applyMoves', () => {
  it('returns a different object and leaves the original cube unchanged', () => {
    const original = cubeFromMoves(['R']);
    const originalFaces = facesFromCube(original);
    const next = applyMoves(original, ['U']);
    expect(next).not.toBe(original);
    expect(facesFromCube(original)).toEqual(originalFaces);
  });

  it('undoes a random sequence with its inverse, for 200 seeded sequences', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const sequence = randomMoves(seed);
      const cube = applyMoves(cubeFromMoves(sequence), inverse(sequence));
      expect(isSolved(cube), `seed ${String(seed)}`).toBe(true);
    }
  });

  it('agrees with cubeFromMoves on the concatenation, for 50 seeded pairs', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = seededRandom(seed);
      const a = movesFrom(rng, 1 + Math.floor(rng() * 20));
      const b = movesFrom(rng, 1 + Math.floor(rng() * 20));
      const combined = cubeFromMoves([...a, ...b]);
      const applied = applyMoves(cubeFromMoves(a), b);
      expect(facesFromCube(applied), `seed ${String(seed)}`).toEqual(facesFromCube(combined));
    }
  });

  it('solves after six repeats of the sexy move, and not before', () => {
    const sexyMove: readonly Move[] = ['R', 'U', 'R_PRIME', 'U_PRIME'];
    let cube: Cube = cubeFromMoves([]);
    for (let repeat = 1; repeat <= 6; repeat++) {
      cube = applyMoves(cube, sexyMove);
      if (repeat < 6) {
        expect(isSolved(cube), `repeat ${String(repeat)}`).toBe(false);
      } else {
        expect(isSolved(cube), `repeat ${String(repeat)}`).toBe(true);
      }
    }
  });
});

describe('runtime guard', () => {
  it('throws from isSolved, applyMoves and facesFromCube for a plain object', () => {
    const fake = {} as Cube;
    expectThrowsCubeGuard(() => isSolved(fake));
    expectThrowsCubeGuard(() => applyMoves(fake, []));
    expectThrowsCubeGuard(() => facesFromCube(fake));
  });

  // structuredClone is not declared under this package's tsconfig (lib: ["ES2022"], types: []
  // — it is only in lib.dom.d.ts / lib.webworker.d.ts), so the structuredClone half of this guard
  // check is skipped here, per the plan's allowance. Reported in the final report.
});
