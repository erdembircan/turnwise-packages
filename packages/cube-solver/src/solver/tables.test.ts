import { beforeAll, describe, expect, it } from 'vitest';
import { compose, effectOf, SOLVED } from '../cubie';
import type { CubieState } from '../cubie';
import { seededRandom } from '../testing/rng';
import { at, read8, read16 } from '../util';
import {
  CORNERS_COUNT,
  FLIP_COUNT,
  SLICE_COUNT,
  SLICE_EDGES_COUNT,
  TWIST_COUNT,
  UD_EDGES_COUNT,
  flipOf,
  rankOf,
  sliceOf,
  twistOf,
} from './coordinates';
import {
  ALL_MOVES,
  PHASE_1_MOVE_COUNT,
  PHASE_2_MOVES,
  PHASE_2_MOVE_COUNT,
  getTables,
} from './tables';
import type { Tables } from './tables';

let tables: Tables;

beforeAll(() => {
  tables = getTables();
});

describe('getTables', () => {
  it('returns the identical object on a second call', () => {
    expect(getTables()).toBe(tables);
  });
});

describe('table sizes', () => {
  it('sizes every move table to coordinate count times move count', () => {
    expect(tables.twistMove.length).toBe(TWIST_COUNT * PHASE_1_MOVE_COUNT);
    expect(tables.flipMove.length).toBe(FLIP_COUNT * PHASE_1_MOVE_COUNT);
    expect(tables.sliceMove.length).toBe(SLICE_COUNT * PHASE_1_MOVE_COUNT);
    expect(tables.cornersMove.length).toBe(CORNERS_COUNT * PHASE_2_MOVE_COUNT);
    expect(tables.udEdgesMove.length).toBe(UD_EDGES_COUNT * PHASE_2_MOVE_COUNT);
    expect(tables.sliceEdgesMove.length).toBe(SLICE_EDGES_COUNT * PHASE_2_MOVE_COUNT);
  });

  it('sizes every distance table to the product of its two coordinate counts', () => {
    expect(tables.sliceTwistDistance.length).toBe(SLICE_COUNT * TWIST_COUNT);
    expect(tables.sliceFlipDistance.length).toBe(SLICE_COUNT * FLIP_COUNT);
    expect(tables.cornersSliceDistance.length).toBe(CORNERS_COUNT * SLICE_EDGES_COUNT);
    expect(tables.udEdgesSliceDistance.length).toBe(UD_EDGES_COUNT * SLICE_EDGES_COUNT);
  });
});

describe('the solved coordinate stays inside the phase 2 subgroup, and only there', () => {
  it('maps coordinate 0 to 0 in twistMove, flipMove and sliceMove under every phase 2 move', () => {
    for (const move of PHASE_2_MOVES) {
      expect(read16(tables.twistMove, move), `move ${String(move)}`).toBe(0);
      expect(read16(tables.flipMove, move), `move ${String(move)}`).toBe(0);
      expect(read16(tables.sliceMove, move), `move ${String(move)}`).toBe(0);
    }
  });

  it('maps coordinate 0 to a non-zero value in at least one of those tables under every other move', () => {
    for (let move = 0; move < PHASE_1_MOVE_COUNT; move++) {
      if (PHASE_2_MOVES.includes(move)) continue;
      const leavesSubgroup =
        read16(tables.twistMove, move) !== 0 ||
        read16(tables.flipMove, move) !== 0 ||
        read16(tables.sliceMove, move) !== 0;
      expect(leavesSubgroup, `move ${String(move)}`).toBe(true);
    }
  });
});

function isPermutationColumn(
  table: Uint16Array,
  count: number,
  moveCount: number,
  column: number,
): boolean {
  const seen = new Uint8Array(count);
  for (let coordinate = 0; coordinate < count; coordinate++) {
    const value = read16(table, coordinate * moveCount + column);
    if (value >= count || seen[value] !== 0) return false;
    seen[value] = 1;
  }
  return true;
}

function expectEveryColumnIsAPermutation(
  table: Uint16Array,
  count: number,
  moveCount: number,
): void {
  for (let column = 0; column < moveCount; column++) {
    expect(isPermutationColumn(table, count, moveCount, column), `column ${String(column)}`).toBe(
      true,
    );
  }
}

describe('every move table column is a permutation of its coordinate range', () => {
  it('holds for the three 18-move tables', () => {
    expectEveryColumnIsAPermutation(tables.twistMove, TWIST_COUNT, PHASE_1_MOVE_COUNT);
    expectEveryColumnIsAPermutation(tables.flipMove, FLIP_COUNT, PHASE_1_MOVE_COUNT);
    expectEveryColumnIsAPermutation(tables.sliceMove, SLICE_COUNT, PHASE_1_MOVE_COUNT);
  });

  it('holds for the three 10-move tables', () => {
    expectEveryColumnIsAPermutation(tables.cornersMove, CORNERS_COUNT, PHASE_2_MOVE_COUNT);
    expectEveryColumnIsAPermutation(tables.udEdgesMove, UD_EDGES_COUNT, PHASE_2_MOVE_COUNT);
    expectEveryColumnIsAPermutation(tables.sliceEdgesMove, SLICE_EDGES_COUNT, PHASE_2_MOVE_COUNT);
  });
});

describe('move tables agree with the cubie model', () => {
  it('agrees for twist, flip and slice, walked with 200 seeded random 18-move sequences', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seededRandom(seed);
      const length = 1 + Math.floor(rng() * 20);
      let state: CubieState = SOLVED;
      let twist = 0;
      let flip = 0;
      let slice = 0;
      for (let i = 0; i < length; i++) {
        const move = Math.floor(rng() * PHASE_1_MOVE_COUNT);
        state = compose(state, effectOf(at(ALL_MOVES, move)));
        twist = read16(tables.twistMove, twist * PHASE_1_MOVE_COUNT + move);
        flip = read16(tables.flipMove, flip * PHASE_1_MOVE_COUNT + move);
        slice = read16(tables.sliceMove, slice * PHASE_1_MOVE_COUNT + move);
      }
      expect(twist, `seed ${String(seed)}`).toBe(twistOf(Uint8Array.from(state.co)));
      expect(flip, `seed ${String(seed)}`).toBe(flipOf(Uint8Array.from(state.eo)));
      expect(slice, `seed ${String(seed)}`).toBe(sliceOf(Uint8Array.from(state.ep)));
    }
  });

  it('agrees for corners, udEdges and sliceEdges, walked with 200 seeded random phase 2 sequences', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seededRandom(seed + 1_000_000);
      const length = 1 + Math.floor(rng() * 20);
      let state: CubieState = SOLVED;
      let corners = 0;
      let udEdges = 0;
      let sliceEdges = 0;
      for (let i = 0; i < length; i++) {
        const m = Math.floor(rng() * PHASE_2_MOVE_COUNT);
        const move = at(PHASE_2_MOVES, m);
        state = compose(state, effectOf(at(ALL_MOVES, move)));
        corners = read16(tables.cornersMove, corners * PHASE_2_MOVE_COUNT + m);
        udEdges = read16(tables.udEdgesMove, udEdges * PHASE_2_MOVE_COUNT + m);
        sliceEdges = read16(tables.sliceEdgesMove, sliceEdges * PHASE_2_MOVE_COUNT + m);
      }
      const edges = Uint8Array.from(state.ep);
      expect(corners, `seed ${String(seed)}`).toBe(rankOf(Uint8Array.from(state.cp), 0, 8));
      expect(udEdges, `seed ${String(seed)}`).toBe(rankOf(edges, 0, 8));
      expect(sliceEdges, `seed ${String(seed)}`).toBe(rankOf(edges, 8, 4));
    }
  });
});

function checkNeighbours(
  distance: Uint8Array,
  index: number,
  firstMove: Uint16Array,
  secondMove: Uint16Array,
  secondCount: number,
  moveCount: number,
  label: string,
): void {
  const second = index % secondCount;
  const first = (index - second) / secondCount;
  const base = read8(distance, index);
  for (let m = 0; m < moveCount; m++) {
    const neighbour =
      read16(firstMove, first * moveCount + m) * secondCount +
      read16(secondMove, second * moveCount + m);
    const neighbourDistance = read8(distance, neighbour);
    expect(
      Math.abs(base - neighbourDistance),
      `${label} index ${String(index)} move ${String(m)}`,
    ).toBeLessThanOrEqual(1);
  }
}

interface DistanceCheck {
  readonly name: string;
  readonly distance: Uint8Array;
  readonly firstMove: Uint16Array;
  readonly secondMove: Uint16Array;
  readonly secondCount: number;
  readonly moveCount: number;
  readonly maxAllowed: number;
}

// Built lazily inside each test, not at describe-body evaluation time: describe bodies run during
// test collection, before beforeAll has set `tables`.
function distanceChecks(): readonly DistanceCheck[] {
  return [
    {
      name: 'sliceTwistDistance',
      distance: tables.sliceTwistDistance,
      firstMove: tables.sliceMove,
      secondMove: tables.twistMove,
      secondCount: TWIST_COUNT,
      moveCount: PHASE_1_MOVE_COUNT,
      maxAllowed: 12,
    },
    {
      name: 'sliceFlipDistance',
      distance: tables.sliceFlipDistance,
      firstMove: tables.sliceMove,
      secondMove: tables.flipMove,
      secondCount: FLIP_COUNT,
      moveCount: PHASE_1_MOVE_COUNT,
      maxAllowed: 12,
    },
    {
      name: 'cornersSliceDistance',
      distance: tables.cornersSliceDistance,
      firstMove: tables.cornersMove,
      secondMove: tables.sliceEdgesMove,
      secondCount: SLICE_EDGES_COUNT,
      moveCount: PHASE_2_MOVE_COUNT,
      maxAllowed: 18,
    },
    {
      name: 'udEdgesSliceDistance',
      distance: tables.udEdgesSliceDistance,
      firstMove: tables.udEdgesMove,
      secondMove: tables.sliceEdgesMove,
      secondCount: SLICE_EDGES_COUNT,
      moveCount: PHASE_2_MOVE_COUNT,
      maxAllowed: 18,
    },
  ];
}

describe('pruning distance tables', () => {
  it('is 0 at the solved pair, never unreached, and never exceeds its known maximum', () => {
    for (const check of distanceChecks()) {
      expect(read8(check.distance, 0), check.name).toBe(0);
      let max = 0;
      for (const value of check.distance) {
        expect(value, check.name).not.toBe(255);
        if (value > max) max = value;
      }
      expect(max, check.name).toBeLessThanOrEqual(check.maxAllowed);
    }
  });

  it('never differs from a neighbour by more than 1, for 2000 seeded random entries per table', () => {
    for (const check of distanceChecks()) {
      const rng = seededRandom(1);
      const total = check.distance.length;
      for (let sample = 0; sample < 2000; sample++) {
        const index = Math.floor(rng() * total);
        checkNeighbours(
          check.distance,
          index,
          check.firstMove,
          check.secondMove,
          check.secondCount,
          check.moveCount,
          check.name,
        );
      }
    }
  });
});
