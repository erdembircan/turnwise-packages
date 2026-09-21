import { at } from '@turnwise/internal';
import { read8 } from '../util';

/**
 * The six numbers the two-phase search works with instead of whole cubes.
 *
 * Phase 1 steers the cube into the subgroup reachable with U, D, R2, L2, F2, B2 alone. A cube is
 * in that subgroup exactly when these three are zero:
 * - `twist`: the orientation of the first seven corners, base 3 (the eighth follows from them);
 * - `flip`: the orientation of the first eleven edges, base 2 (the twelfth follows);
 * - `slice`: which four positions hold the four middle-layer edges FR, FL, BL, BR.
 *
 * Phase 2 finishes inside the subgroup, where these three describe everything that is left:
 * - `corners`: the permutation of the eight corners;
 * - `udEdges`: the permutation of the eight U- and D-layer edges among positions 0..7;
 * - `sliceEdges`: the permutation of the four middle-layer edges among positions 8..11.
 */
export const TWIST_COUNT = 2187; // 3^7
export const FLIP_COUNT = 2048; // 2^11
export const SLICE_COUNT = 495; // 12 choose 4
export const CORNERS_COUNT = 40320; // 8!
export const UD_EDGES_COUNT = 40320; // 8!
export const SLICE_EDGES_COUNT = 24; // 4!

const FIRST_SLICE_EDGE = 8;

// CHOOSE[n * 5 + k] is n choose k, for n up to 11 and k up to 4.
const CHOOSE: readonly number[] = [
  1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 2, 1, 0, 0, 1, 3, 3, 1, 0, 1, 4, 6, 4, 1, 1, 5, 10, 10, 5, 1, 6,
  15, 20, 15, 1, 7, 21, 35, 35, 1, 8, 28, 56, 70, 1, 9, 36, 84, 126, 1, 10, 45, 120, 210, 1, 11, 55,
  165, 330,
];

function choose(n: number, k: number): number {
  return k > 4 ? 0 : at(CHOOSE, n * 5 + k);
}

export function twistOf(co: Uint8Array): number {
  let twist = 0;
  for (let i = 0; i < 7; i++) twist = twist * 3 + read8(co, i);
  return twist;
}

export function setTwist(co: Uint8Array, twist: number): void {
  let rest = twist;
  let total = 0;
  for (let i = 6; i >= 0; i--) {
    const digit = rest % 3;
    co[i] = digit;
    total += digit;
    rest = (rest - digit) / 3;
  }
  co[7] = (3 - (total % 3)) % 3;
}

export function flipOf(eo: Uint8Array): number {
  let flip = 0;
  for (let i = 0; i < 11; i++) flip = flip * 2 + read8(eo, i);
  return flip;
}

export function setFlip(eo: Uint8Array, flip: number): void {
  let rest = flip;
  let total = 0;
  for (let i = 10; i >= 0; i--) {
    const digit = rest % 2;
    eo[i] = digit;
    total += digit;
    rest = (rest - digit) / 2;
  }
  eo[11] = total % 2;
}

export function sliceOf(ep: Uint8Array): number {
  let slice = 0;
  let found = 0;
  for (let position = 11; position >= 0; position--) {
    if (read8(ep, position) >= FIRST_SLICE_EDGE) {
      found += 1;
      slice += choose(11 - position, found);
    }
  }
  return slice;
}

/** Fills `ep` with some arrangement whose `sliceOf` is `slice`; which edge goes where is arbitrary. */
export function setSlice(ep: Uint8Array, slice: number): void {
  let rest = slice;
  let missing = 4;
  let other = 0;
  for (let position = 0; position < 12; position++) {
    const ways = choose(11 - position, missing);
    if (missing > 0 && rest >= ways) {
      rest -= ways;
      ep[position] = FIRST_SLICE_EDGE + (4 - missing);
      missing -= 1;
    } else {
      ep[position] = other;
      other += 1;
    }
  }
}

/** The rank of the permutation in `values[start..start + length)`, from 0 to `length! - 1`. */
export function rankOf(values: Uint8Array, start: number, length: number): number {
  let rank = 0;
  for (let i = 0; i < length; i++) {
    const value = read8(values, start + i);
    let smaller = 0;
    for (let j = i + 1; j < length; j++) {
      if (read8(values, start + j) < value) smaller += 1;
    }
    rank = rank * (length - i) + smaller;
  }
  return rank;
}

/** Writes the permutation of `lowest..lowest + length - 1` with the given rank into `values`. */
export function setRank(
  values: Uint8Array,
  start: number,
  length: number,
  lowest: number,
  rank: number,
): void {
  let rest = rank;
  for (let i = length - 1; i >= 0; i--) {
    const base = length - i;
    const digit = rest % base;
    rest = (rest - digit) / base;
    values[start + i] = digit;
    for (let j = i + 1; j < length; j++) {
      const later = read8(values, start + j);
      if (later >= digit) values[start + j] = later + 1;
    }
  }
  for (let i = 0; i < length; i++) values[start + i] = read8(values, start + i) + lowest;
}
