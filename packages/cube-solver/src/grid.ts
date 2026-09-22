import { gridOf } from '@turnwise/internal';
import type { FaceGrid } from '@turnwise/internal';
import { stateOf } from './cube';
import type { Cube } from './cube';

/** The stickers of `cube`, for drawing it or for sending it somewhere a `Cube` cannot go. */
export function facesFromCube(cube: Cube): FaceGrid {
  return gridOf(stateOf(cube));
}
