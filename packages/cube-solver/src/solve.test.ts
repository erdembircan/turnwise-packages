import { describe, expect, it } from 'vitest';
import { applyMoves, cubeFromMoves, isSolved } from './cube';
import type { Cube } from './cube';
import { Moves, at, faceOf, inverse } from '@turnwise/internal';
import type { Face, Move } from '@turnwise/internal';
import { cubeFromFaces } from './fromFaces';
import { Efforts, prepare, solve } from './solve';
import { Efforts as EffortsFromIndex } from './index';
import { asGrid, randomMoves } from './testing/grids';
import { readOracle, solvedOracle, turnOracle } from './testing/oracle';
import { seededRandom } from './testing/rng';

const MOVE_POOL: readonly Move[] = Object.values(Moves);
const SOLVED_GRID = readOracle(solvedOracle());

// Widens a string literal to `string`, standing in for a value a plain-JavaScript caller could
// pass at runtime, where the literal-type safety of SolveOptions['effort'] does not apply.
function asRuntimeString(value: string): string {
  return value;
}

/** A scramble of exactly `length` random moves, no two consecutive moves turning the same face. */
function nonRepeatingScrambleOf(seed: number, length: number): Move[] {
  const rng = seededRandom(seed);
  const moves: Move[] = [];
  let lastFace: Face | undefined;
  while (moves.length < length) {
    const candidate = at(MOVE_POOL, Math.floor(rng() * MOVE_POOL.length));
    if (faceOf(candidate) === lastFace) continue;
    moves.push(candidate);
    lastFace = faceOf(candidate);
  }
  return moves;
}

function expectSolvedOnOracle(
  scramble: readonly Move[],
  solution: readonly Move[],
  label: string,
): void {
  const result = readOracle(turnOracle(solvedOracle(), [...scramble, ...solution]));
  expect(result, label).toEqual(SOLVED_GRID);
}

function expectNoRepeatedFace(solution: readonly Move[], label: string): void {
  for (let i = 1; i < solution.length; i++) {
    expect(faceOf(at(solution, i)), `${label} move ${String(i)}`).not.toBe(
      faceOf(at(solution, i - 1)),
    );
  }
}

// prepare's declared return type is void, which the runtime still fills with an actual
// `undefined`. This widens it to `unknown` so the value can be asserted on, the same widening
// technique used elsewhere in this file for values TypeScript's types would otherwise keep out of
// reach of a runtime assertion.
function asReturningUnknown(fn: () => void): () => unknown {
  return fn;
}

const callPrepare = asReturningUnknown(prepare);

describe('Efforts', () => {
  it('has keys fast, full in that order', () => {
    expect(Object.keys(Efforts)).toEqual(['fast', 'full']);
  });

  it('maps every key to itself', () => {
    for (const key of Object.keys(Efforts) as (keyof typeof Efforts)[]) {
      expect(Efforts[key]).toBe(key);
    }
  });

  it('is the same object whether imported from ./index or ./solve', () => {
    expect(EffortsFromIndex).toBe(Efforts);
  });

  it('gives the same solution as the matching string literal, for 3 seeds', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const cube = cubeFromMoves(randomMoves(seed));
      const label = `seed ${String(seed)}`;
      expect(solve(cube, { effort: Efforts.fast }), label).toEqual(solve(cube, { effort: 'fast' }));
      expect(solve(cube, { effort: Efforts.full }), label).toEqual(solve(cube));
    }
  });
});

describe('solve', () => {
  it('returns an empty solution for a solved cube', () => {
    expect(solve(cubeFromMoves([]))).toEqual([]);
  });

  it('solves single-move and two-move cubes optimally', () => {
    expect(solve(cubeFromMoves(['R']))).toEqual(['R_PRIME']);
    expect(solve(cubeFromMoves(['U_PRIME', 'L2']))).toEqual(['L2', 'U']);
  });

  it("solves random scrambles on the oracle at 'fast' effort, within 24 moves and with no repeated face", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const scramble = randomMoves(seed, 60);
      const solution = solve(cubeFromMoves(scramble), { effort: 'fast' });
      const label = `seed ${String(seed)}`;
      expectSolvedOnOracle(scramble, solution, label);
      expect(solution.length, label).toBeLessThanOrEqual(24);
      expectNoRepeatedFace(solution, label);
    }
  });

  it("solves random scrambles on the oracle at 'full' effort, within 23 moves, at least as well as 'fast', and with no repeated face", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const scramble = randomMoves(seed, 60);
      const cube = cubeFromMoves(scramble);
      const fastSolution = solve(cube, { effort: 'fast' });
      const fullSolution = solve(cube);
      const label = `seed ${String(seed)}`;
      expectSolvedOnOracle(scramble, fullSolution, label);
      expect(fullSolution.length, label).toBeLessThanOrEqual(23);
      expect(fullSolution.length, label).toBeLessThanOrEqual(fastSolution.length);
      expectNoRepeatedFace(fullSolution, label);
    }
  });

  it('solves short scrambles within their own length, at full effort, with no repeated face', () => {
    for (let n = 1; n <= 7; n++) {
      for (let seed = 1; seed <= 20; seed++) {
        const scramble = nonRepeatingScrambleOf(n * 1000 + seed, n);
        const solution = solve(cubeFromMoves(scramble));
        const label = `n ${String(n)} seed ${String(seed)}`;
        expectSolvedOnOracle(scramble, solution, label);
        expect(solution.length, label).toBeLessThanOrEqual(n);
        expectNoRepeatedFace(solution, label);
      }
    }
  });

  it('gives the same solution for the same cube, for both efforts, for 10 seeds', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const cube = cubeFromMoves(randomMoves(seed));
      const label = `seed ${String(seed)}`;
      expect(solve(cube, { effort: 'fast' }), label).toEqual(solve(cube, { effort: 'fast' }));
      expect(solve(cube), label).toEqual(solve(cube));
    }
  });

  it('accepts a cube built by cubeFromFaces, from a grid built by the oracle, for 5 seeds', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const scramble = randomMoves(seed);
      const grid = asGrid(readOracle(turnOracle(solvedOracle(), scramble)));
      const solution = solve(cubeFromFaces(grid));
      expectSolvedOnOracle(scramble, solution, `seed ${String(seed)}`);
    }
  });

  it('is undone by applying its own solution to the inverse of that solution, for 10 seeds', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const scramble = randomMoves(seed);
      const solution = solve(cubeFromMoves(scramble));
      const cube = applyMoves(cubeFromMoves(inverse(solution)), solution);
      expect(isSolved(cube), `seed ${String(seed)}`).toBe(true);
    }
  });

  it('throws for a cube not created by this package, and for an unknown effort', () => {
    let caughtCube: unknown;
    try {
      solve({} as Cube);
    } catch (error) {
      caughtCube = error;
    }
    expect(caughtCube).toBeInstanceOf(TypeError);
    if (caughtCube instanceof TypeError) {
      expect(caughtCube.message).toBe(
        'Expected a Cube created by this package. A Cube cannot be written by hand, and does not survive JSON or postMessage.',
      );
    }

    let caughtEffort: unknown;
    try {
      solve(cubeFromMoves([]), { effort: asRuntimeString('turbo') as 'fast' | 'full' });
    } catch (error) {
      caughtEffort = error;
    }
    expect(caughtEffort).toBeInstanceOf(TypeError);
    if (caughtEffort instanceof TypeError) {
      expect(caughtEffort.message).toBe('Unknown effort "turbo". Use "fast" or "full".');
    }
  });

  it('lets prepare be called repeatedly and returns nothing', () => {
    expect(callPrepare()).toBeUndefined();
    expect(callPrepare()).toBeUndefined();
  });
});
