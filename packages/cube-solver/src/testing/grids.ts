import { cubeFromMoves } from '../cube';
import type { Face } from '@turnwise/internal';
import { facesFromCube } from '../grid';
import type { FaceGrid } from '../grid';
import { Moves } from '../move';
import type { Move } from '../move';
import { at } from '../util';
import { seededRandom } from './rng';

const MOVE_POOL: readonly Move[] = Object.values(Moves);

/** The stickers of a solved cube. */
export function solvedGrid(): FaceGrid {
  return facesFromCube(cubeFromMoves([]));
}

/** A deep, mutable copy of `grid`, for tests that edit individual stickers. */
export function editable(grid: FaceGrid): Record<Face, Face[]> {
  return {
    U: [...grid.U],
    R: [...grid.R],
    F: [...grid.F],
    D: [...grid.D],
    L: [...grid.L],
    B: [...grid.B],
  };
}

/**
 * Hands an edited copy back to the API as a `FaceGrid`. This is the "unchecked data" situation
 * the runtime checks in `fromFaces.ts` exist for, so this is the one place that cast is
 * authorized.
 */
export function asGrid(cells: Record<Face, Face[]>): FaceGrid {
  return cells as unknown as FaceGrid;
}

/** A random sequence of 1..`maxLength` moves, seeded so the sequence is repeatable. */
export function randomMoves(seed: number, maxLength = 40): Move[] {
  const rng = seededRandom(seed);
  const length = 1 + Math.floor(rng() * maxLength);
  const moves: Move[] = [];
  for (let i = 0; i < length; i++) {
    moves.push(at(MOVE_POOL, Math.floor(rng() * MOVE_POOL.length)));
  }
  return moves;
}
