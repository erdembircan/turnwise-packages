import { cubeFromFaces, inverse, solve } from '@turnwise/cube-solver';
import type { Cube, Effort, Move } from '@turnwise/cube-solver';
import { gridOf } from '@turnwise/internal';
import { drawScrambleState } from './randomState';
import { secureRandom } from './secureRandom';

/** Options for {@link scramble}. */
export interface ScrambleOptions {
  /** How hard the solver works on the way back. The default is `'full'`. */
  readonly effort?: Effort;
  /**
   * The source of randomness: a function returning a number from 0 up to, but not including, 1.
   * The default is the platform's cryptographically secure generator.
   */
  readonly random?: () => number;
}

/** The moves that take a solved cube to `cube`: the solver's solution, undone. */
export function scrambleOf(cube: Cube, effort: Effort | undefined): Move[] {
  const solution = effort === undefined ? solve(cube) : solve(cube, { effort });
  return inverse(solution);
}

/**
 * Moves that take a solved cube to a random state, drawn with equal probability from every state
 * that needs at least two moves to solve, as WCA Regulation 4b3 requires.
 */
export function scramble(options: ScrambleOptions = {}): Move[] {
  const state = drawScrambleState(options.random ?? secureRandom);
  return scrambleOf(cubeFromFaces(gridOf(state)), options.effort);
}
