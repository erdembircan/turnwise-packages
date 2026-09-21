import { at, compose, effectOf, isSolvedState } from '@turnwise/internal';
import type { CubieState, Move } from '@turnwise/internal';
import { read16, read8 } from '../util';
import {
  FLIP_COUNT,
  SLICE_EDGES_COUNT,
  TWIST_COUNT,
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

const NO_FACE = -1;
const LONGEST_PHASE_1 = 12;
const LONGEST_PHASE_2 = 18;
// First look only for solutions of at most 24 moves, which exist for practically every cube and keep
// phase 2 shallow and fast. The last bound is the proven worst case of the two phases, so it cannot
// fail.
const LENGTH_BOUNDS: readonly number[] = [24, LONGEST_PHASE_1 + LONGEST_PHASE_2];

// Never turn the same face twice in a row, and turn opposite faces in one fixed order only (U
// before D, R before L, F before B): the other order reaches the same positions.
function isRedundant(face: number, lastFace: number): boolean {
  return face === lastFace || face + 3 === lastFace;
}

// Phase 2 may open with the face phase 1 closed on, so the joined path can turn one face twice in a
// row. Merging such pairs keeps every solution free of them.
function simplify(path: readonly number[]): number[] {
  const merged: number[] = [];
  for (const move of path) {
    const previous = merged[merged.length - 1];
    if (previous === undefined || Math.floor(previous / 3) !== Math.floor(move / 3)) {
      merged.push(move);
      continue;
    }
    merged.pop();
    const turns = ((previous % 3) + (move % 3) + 2) % 4;
    if (turns !== 0) merged.push(Math.floor(move / 3) * 3 + turns - 1);
  }
  return merged;
}

class Search {
  readonly #tables: Tables;
  readonly #start: CubieState;
  readonly #nodeBudget: number;
  readonly #path: number[] = [];
  #best: number[] | undefined;
  #bound: number;
  #nodes = 0;

  constructor(tables: Tables, start: CubieState, nodeBudget: number, bound: number) {
    this.#tables = tables;
    this.#start = start;
    this.#nodeBudget = nodeBudget;
    this.#bound = bound;
  }

  run(): number[] | undefined {
    const twist = twistOf(Uint8Array.from(this.#start.co));
    const flip = flipOf(Uint8Array.from(this.#start.eo));
    const slice = sliceOf(Uint8Array.from(this.#start.ep));
    for (let depth = 0; depth <= LONGEST_PHASE_1 && depth <= this.#bound; depth++) {
      if (this.#phase1(twist, flip, slice, depth, NO_FACE)) break;
    }
    return this.#best;
  }

  #isDone(): boolean {
    if (this.#best === undefined) return false;
    return this.#nodes >= this.#nodeBudget;
  }

  /** Returns true when the whole search should stop. */
  #phase1(
    twist: number,
    flip: number,
    slice: number,
    remaining: number,
    lastFace: number,
  ): boolean {
    this.#nodes += 1;
    const tables = this.#tables;
    const distance = Math.max(
      read8(tables.sliceTwistDistance, slice * TWIST_COUNT + twist),
      read8(tables.sliceFlipDistance, slice * FLIP_COUNT + flip),
    );
    if (distance > remaining) return false;
    if (remaining === 0) return this.#enterPhase2();

    for (let move = 0; move < PHASE_1_MOVE_COUNT; move++) {
      const face = Math.floor(move / 3);
      if (isRedundant(face, lastFace)) continue;
      this.#path.push(move);
      const stop = this.#phase1(
        read16(tables.twistMove, twist * PHASE_1_MOVE_COUNT + move),
        read16(tables.flipMove, flip * PHASE_1_MOVE_COUNT + move),
        read16(tables.sliceMove, slice * PHASE_1_MOVE_COUNT + move),
        remaining - 1,
        face,
      );
      this.#path.pop();
      if (stop) return true;
    }
    return false;
  }

  #enterPhase2(): boolean {
    // A phase 1 that ends on a phase 2 move is the same solution as a shorter phase 1, which has
    // already been tried.
    const lastMove = this.#path[this.#path.length - 1];
    if (lastMove !== undefined && PHASE_2_MOVES.includes(lastMove)) return false;

    let state = this.#start;
    for (const move of this.#path) state = compose(state, effectOf(at(ALL_MOVES, move)));
    const edges = Uint8Array.from(state.ep);
    const corners = rankOf(Uint8Array.from(state.cp), 0, 8);
    const udEdges = rankOf(edges, 0, 8);
    const sliceEdges = rankOf(edges, 8, 4);

    const phase1Length = this.#path.length;
    const longest = Math.min(LONGEST_PHASE_2, this.#bound - phase1Length);
    for (let depth = 0; depth <= longest; depth++) {
      if (this.#phase2(corners, udEdges, sliceEdges, depth, NO_FACE)) {
        this.#best = simplify(this.#path);
        this.#bound = this.#best.length - 1;
        this.#path.length = phase1Length;
        return this.#isDone();
      }
    }
    return this.#isDone();
  }

  /** Returns true when the path now ends in a solved cube. */
  #phase2(
    corners: number,
    udEdges: number,
    sliceEdges: number,
    remaining: number,
    lastFace: number,
  ): boolean {
    this.#nodes += 1;
    const tables = this.#tables;
    const distance = Math.max(
      read8(tables.cornersSliceDistance, corners * SLICE_EDGES_COUNT + sliceEdges),
      read8(tables.udEdgesSliceDistance, udEdges * SLICE_EDGES_COUNT + sliceEdges),
    );
    if (distance > remaining) return false;
    if (remaining === 0) return true;

    for (let m = 0; m < PHASE_2_MOVE_COUNT; m++) {
      const move = at(PHASE_2_MOVES, m);
      const face = Math.floor(move / 3);
      if (isRedundant(face, lastFace)) continue;
      this.#path.push(move);
      const found = this.#phase2(
        read16(tables.cornersMove, corners * PHASE_2_MOVE_COUNT + m),
        read16(tables.udEdgesMove, udEdges * PHASE_2_MOVE_COUNT + m),
        read16(tables.sliceEdgesMove, sliceEdges * PHASE_2_MOVE_COUNT + m),
        remaining - 1,
        face,
      );
      if (found) return true;
      this.#path.pop();
    }
    return false;
  }
}

/**
 * A short sequence of moves that solves `start`.
 *
 * Always finds one: the search first looks for solutions of at most 24 moves, and falls back to the
 * proven worst case of the method if there is none. After the first solution it keeps looking for
 * shorter ones until it has examined `nodeBudget` positions, so a budget of 0 returns the first
 * solution found. The budget counts positions, not time, which makes the result repeatable.
 */
export function search(start: CubieState, nodeBudget: number): Move[] {
  if (isSolvedState(start)) return [];
  const tables = getTables();
  for (const bound of LENGTH_BOUNDS) {
    const best = new Search(tables, start, nodeBudget, bound).run();
    if (best !== undefined) return best.map((move) => at(ALL_MOVES, move));
  }
  throw new Error('Internal error: the two-phase search found no solution for a legal cube.');
}
