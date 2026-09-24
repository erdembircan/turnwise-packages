import { at } from '@turnwise/internal';
import type { WideMove } from './notation';
import { pick } from './randomState';

// The tables and order of the WCA's official scrambler: first a centre to the top, then a centre to
// the front. The 6 × 4 choices reach each of the cube's 24 orientations exactly once.
const TO_TOP: readonly (readonly WideMove[])[] = [
  [],
  ['Rw'],
  ['Rw2'],
  ['Rw_PRIME'],
  ['Fw'],
  ['Fw_PRIME'],
];
const TO_FRONT: readonly (readonly WideMove[])[] = [[], ['Uw'], ['Uw2'], ['Uw_PRIME']];

/**
 * The wide moves that turn a cube from white on top and green in front to one of its 24
 * orientations, each equally likely, as WCA Regulation 4b3a requires for blindfolded events. Empty
 * in 1 draw out of 24.
 */
export function drawOrientation(random: () => number): WideMove[] {
  const top = at(TO_TOP, pick(random, TO_TOP.length));
  const front = at(TO_FRONT, pick(random, TO_FRONT.length));
  return [...top, ...front];
}
