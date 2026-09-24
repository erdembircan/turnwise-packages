import { cubeFromFaces, inverse, solve } from '@turnwise/cube-solver';
import type { Cube, Effort, FaceGrid, Move } from '@turnwise/cube-solver';
import { gridOf } from '@turnwise/internal';
import { drawScrambleState } from './randomState';
import { secureRandom } from './secureRandom';

/** Options for {@link scramble} and `blindfoldedScramble`. */
export interface ScrambleOptions {
  /** How hard the solver works on the way back. The default is `'full'`. */
  readonly effort?: Effort;
  /**
   * The source of randomness: a function returning a number from 0 up to, but not including, 1.
   * The default is the platform's cryptographically secure generator.
   */
  readonly random?: () => number;
}

/** A scramble, and the cube it leaves. */
export interface Scramble {
  /** The moves, in order, for a solved cube held white on top and green in front. */
  readonly moves: Move[];
  /** The cube after the moves: every sticker, named by the face it belonged to when solved. */
  readonly faces: FaceGrid;
}

/** The moves that take a solved cube to `cube`: the solver's solution, undone. */
export function scrambleOf(cube: Cube, effort: Effort | undefined): Move[] {
  const solution = effort === undefined ? solve(cube) : solve(cube, { effort });
  return inverse(solution);
}

/**
 * A random state, drawn with equal probability from every state that needs at least two moves to
 * solve, as WCA Regulation 4b3 requires, with the moves that reach it.
 */
export function scramble(options: ScrambleOptions = {}): Scramble {
  const faces = gridOf(drawScrambleState(options.random ?? secureRandom));
  return { moves: scrambleOf(cubeFromFaces(faces), options.effort), faces };
}
