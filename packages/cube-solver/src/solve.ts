import { stateOf } from './cube';
import type { Cube } from './cube';
import type { Move } from '@turnwise/internal';
import { search } from './solver/search';
import { getTables } from './solver/tables';

/**
 * How hard {@link solve} looks for a short solution. Both efforts always succeed.
 *
 * - `'full'` keeps improving on its first solution for a fixed amount of work: about a tenth of a
 *   second. A scrambled cube comes back in about 20 moves, and a cube that is only a few moves from
 *   solved comes back in that few.
 * - `'fast'` stops almost at once, after a few milliseconds. A scrambled cube comes back in about
 *   23 moves, 24 at most in practice. A cube that is only a few moves from solved may still get a
 *   longer answer than it needs.
 *
 * Work is counted in positions examined, not in time, so the same cube and effort always give the
 * same solution.
 */
export type Effort = 'fast' | 'full';

/**
 * Every {@link Effort}, keyed by itself, for callers who prefer `Efforts.fast` to the literal
 * `'fast'`. Both spellings are the same value and the same type.
 */
export const Efforts: { readonly [E in Effort]: E } = {
  fast: 'fast',
  full: 'full',
};

/** Options for {@link solve}. */
export interface SolveOptions {
  /** How hard to look for a short solution. The default is `'full'`. */
  readonly effort?: Effort;
}

const NODE_BUDGET: Readonly<Record<Effort, number>> = {
  fast: 100_000,
  full: 5_000_000,
};

/**
 * Builds the lookup tables the solver needs, if they are not built yet.
 *
 * Importing this package costs nothing; the first {@link solve} pays for the tables instead, about
 * a third of a second and 6 MB of memory. Call `prepare` to pay at a moment of your choosing, such as the start of a
 * worker. Calling it again does nothing.
 */
export function prepare(): void {
  getTables();
}

/**
 * A short sequence of moves that solves `cube`, by Kociemba's two-phase algorithm. A solved cube
 * gives an empty list.
 *
 * Every `Cube` is legal, so this never rejects its input. It runs synchronously and keeps the
 * thread busy while it works; in a browser, call it from a worker.
 */
export function solve(cube: Cube, options: SolveOptions = {}): Move[] {
  const effort = options.effort ?? 'full';
  // The type system already rules out an unknown effort. This guards callers writing plain
  // JavaScript.
  if (!Object.hasOwn(NODE_BUDGET, effort)) {
    throw new TypeError(`Unknown effort ${JSON.stringify(effort)}. Use "fast" or "full".`);
  }
  return search(stateOf(cube), NODE_BUDGET[effort]);
}
