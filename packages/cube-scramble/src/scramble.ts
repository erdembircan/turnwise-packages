import { cubeFromFaces, inverse, solve } from '@turnwise/cube-solver';
import type { Effort, Move } from '@turnwise/cube-solver';
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

/**
 * Moves that take a solved cube to a random state, drawn with equal probability from every state
 * that needs at least two moves to solve, as WCA Regulation 4b3 requires.
 */
export function scramble(options: ScrambleOptions = {}): Move[] {
  const state = drawScrambleState(options.random ?? secureRandom);
  const cube = cubeFromFaces(gridOf(state));
  const solution =
    options.effort === undefined ? solve(cube) : solve(cube, { effort: options.effort });
  return inverse(solution);
}
