import { at, effectOf } from '@turnwise/internal';
import type { CubieState, Move } from '@turnwise/internal';
import { read16, read32, read8 } from '../util';
import {
  CORNERS_COUNT,
  FLIP_COUNT,
  SLICE_COUNT,
  SLICE_EDGES_COUNT,
  TWIST_COUNT,
  UD_EDGES_COUNT,
  flipOf,
  rankOf,
  setFlip,
  setRank,
  setSlice,
  setTwist,
  sliceOf,
  twistOf,
} from './coordinates';

/** Every move, in the order all tables index them by: face U, R, F, D, L, B, then turns 1, 2, 3. */
export const ALL_MOVES: readonly Move[] = [
  'U',
  'U2',
  'U_PRIME',
  'R',
  'R2',
  'R_PRIME',
  'F',
  'F2',
  'F_PRIME',
  'D',
  'D2',
  'D_PRIME',
  'L',
  'L2',
  'L_PRIME',
  'B',
  'B2',
  'B_PRIME',
];

/** The moves phase 2 may use, as indices into `ALL_MOVES`: U, U2, U', R2, F2, D, D2, D', L2, B2. */
export const PHASE_2_MOVES: readonly number[] = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

export const PHASE_1_MOVE_COUNT = 18;
export const PHASE_2_MOVE_COUNT = 10;

/**
 * Everything the search looks up instead of computing.
 *
 * A move table answers "coordinate `c`, after move `m`" at `table[c * moveCount + m]`. A pruning
 * table holds, for a pair of coordinates, the exact number of moves needed to bring both to zero,
 * which is a lower bound for the whole cube and lets the search abandon hopeless branches early.
 */
export interface Tables {
  readonly twistMove: Uint16Array;
  readonly flipMove: Uint16Array;
  readonly sliceMove: Uint16Array;
  readonly cornersMove: Uint16Array;
  readonly udEdgesMove: Uint16Array;
  readonly sliceEdgesMove: Uint16Array;
  readonly sliceTwistDistance: Uint8Array;
  readonly sliceFlipDistance: Uint8Array;
  readonly cornersSliceDistance: Uint8Array;
  readonly udEdgesSliceDistance: Uint8Array;
}

const UNREACHED = 255;

/**
 * One move table. `write` puts coordinate `c` into the scratch array, `read` takes the coordinate
 * back out after the scratch array has been permuted (and, with `modulus`, re-oriented) by a move.
 */
function moveTable(
  count: number,
  moves: readonly number[],
  size: number,
  write: (scratch: Uint8Array, coordinate: number) => void,
  read: (scratch: Uint8Array) => number,
  permutationOf: (effect: CubieState) => readonly number[],
  orientationOf: ((effect: CubieState) => readonly number[]) | undefined,
  modulus: number,
): Uint16Array {
  const table = new Uint16Array(count * moves.length);
  const before = new Uint8Array(size);
  const after = new Uint8Array(size);
  const effects = moves.map((move) => effectOf(at(ALL_MOVES, move)));
  const permutations = effects.map((effect) => Uint8Array.from(permutationOf(effect)));
  const orientations = effects.map((effect) => Uint8Array.from(orientationOf?.(effect) ?? []));
  for (let coordinate = 0; coordinate < count; coordinate++) {
    write(before, coordinate);
    for (let m = 0; m < effects.length; m++) {
      const permutation = at(permutations, m);
      const orientation = at(orientations, m);
      for (let i = 0; i < size; i++) {
        const moved = read8(before, read8(permutation, i));
        after[i] = orientation.length === 0 ? moved : (moved + read8(orientation, i)) % modulus;
      }
      table[coordinate * effects.length + m] = read(after);
    }
  }
  return table;
}

/**
 * The exact distance to (0, 0) for every pair of two coordinates, by breadth-first search outward
 * from (0, 0). Every move has its inverse in the same move set, so distance from equals distance
 * to. Indexed `first * secondCount + second`.
 */
function distanceTable(
  firstMove: Uint16Array,
  firstCount: number,
  secondMove: Uint16Array,
  secondCount: number,
  moveCount: number,
): Uint8Array {
  const distance = new Uint8Array(firstCount * secondCount).fill(UNREACHED);
  const queue = new Uint32Array(firstCount * secondCount);
  let head = 0;
  let tail = 1;
  distance[0] = 0;
  while (head < tail) {
    const pair = read32(queue, head);
    head += 1;
    const next = read8(distance, pair) + 1;
    const second = pair % secondCount;
    const firstRow = ((pair - second) / secondCount) * moveCount;
    const secondRow = second * moveCount;
    for (let m = 0; m < moveCount; m++) {
      const neighbour =
        read16(firstMove, firstRow + m) * secondCount + read16(secondMove, secondRow + m);
      if (distance[neighbour] === UNREACHED) {
        distance[neighbour] = next;
        queue[tail] = neighbour;
        tail += 1;
      }
    }
  }
  return distance;
}

function build(): Tables {
  const allMoves = ALL_MOVES.map((_, index) => index);
  const corners = (effect: CubieState): readonly number[] => effect.cp;
  const edges = (effect: CubieState): readonly number[] => effect.ep;

  const twistMove = moveTable(TWIST_COUNT, allMoves, 8, setTwist, twistOf, corners, (e) => e.co, 3);
  const flipMove = moveTable(FLIP_COUNT, allMoves, 12, setFlip, flipOf, edges, (e) => e.eo, 2);
  const sliceMove = moveTable(SLICE_COUNT, allMoves, 12, setSlice, sliceOf, edges, undefined, 1);
  const cornersMove = moveTable(
    CORNERS_COUNT,
    PHASE_2_MOVES,
    8,
    (scratch, rank) => {
      setRank(scratch, 0, 8, 0, rank);
    },
    (scratch) => rankOf(scratch, 0, 8),
    corners,
    undefined,
    1,
  );
  // Phase 2 moves never carry an edge between positions 0..7 and 8..11, so the two groups can be
  // tabulated separately, each with the other left in place.
  const udEdgesMove = moveTable(
    UD_EDGES_COUNT,
    PHASE_2_MOVES,
    12,
    (scratch, rank) => {
      setRank(scratch, 0, 8, 0, rank);
      setRank(scratch, 8, 4, 8, 0);
    },
    (scratch) => rankOf(scratch, 0, 8),
    edges,
    undefined,
    1,
  );
  const sliceEdgesMove = moveTable(
    SLICE_EDGES_COUNT,
    PHASE_2_MOVES,
    12,
    (scratch, rank) => {
      setRank(scratch, 0, 8, 0, 0);
      setRank(scratch, 8, 4, 8, rank);
    },
    (scratch) => rankOf(scratch, 8, 4),
    edges,
    undefined,
    1,
  );

  return {
    twistMove,
    flipMove,
    sliceMove,
    cornersMove,
    udEdgesMove,
    sliceEdgesMove,
    sliceTwistDistance: distanceTable(
      sliceMove,
      SLICE_COUNT,
      twistMove,
      TWIST_COUNT,
      PHASE_1_MOVE_COUNT,
    ),
    sliceFlipDistance: distanceTable(
      sliceMove,
      SLICE_COUNT,
      flipMove,
      FLIP_COUNT,
      PHASE_1_MOVE_COUNT,
    ),
    cornersSliceDistance: distanceTable(
      cornersMove,
      CORNERS_COUNT,
      sliceEdgesMove,
      SLICE_EDGES_COUNT,
      PHASE_2_MOVE_COUNT,
    ),
    udEdgesSliceDistance: distanceTable(
      udEdgesMove,
      UD_EDGES_COUNT,
      sliceEdgesMove,
      SLICE_EDGES_COUNT,
      PHASE_2_MOVE_COUNT,
    ),
  };
}

let tables: Tables | undefined;

/** The lookup tables, built on first call (the expensive part of this package) and then kept. */
export function getTables(): Tables {
  tables ??= build();
  return tables;
}
