import type { Face } from './face';
import { faceOf, turnsOf } from './move';
import type { Move } from './move';
import { at } from './util';

/** The eight corner positions, named by the three faces they touch, in table order. */
export type CornerPosition = 'URF' | 'UFL' | 'ULB' | 'UBR' | 'DFR' | 'DLF' | 'DBL' | 'DRB';

/** The twelve edge positions, named by the two faces they touch, in table order. */
export type EdgePosition =
  'UR' | 'UF' | 'UL' | 'UB' | 'DR' | 'DF' | 'DL' | 'DB' | 'FR' | 'FL' | 'BL' | 'BR';

export const CORNER_POSITIONS: readonly CornerPosition[] = [
  'URF',
  'UFL',
  'ULB',
  'UBR',
  'DFR',
  'DLF',
  'DBL',
  'DRB',
];

export const EDGE_POSITIONS: readonly EdgePosition[] = [
  'UR',
  'UF',
  'UL',
  'UB',
  'DR',
  'DF',
  'DL',
  'DB',
  'FR',
  'FL',
  'BL',
  'BR',
];

/**
 * A cube at the level of its 20 movable pieces. `cp[i]` and `ep[i]` name the piece (by its home
 * index) now sitting at position `i`; `co[i]` (0..2) and `eo[i]` (0..1) say how that piece is
 * twisted or flipped there. The same shape also describes what a move does to a solved cube,
 * which is what lets {@link compose} apply moves.
 */
export interface CubieState {
  readonly cp: readonly number[];
  readonly co: readonly number[];
  readonly ep: readonly number[];
  readonly eo: readonly number[];
}

export const SOLVED: CubieState = {
  cp: [0, 1, 2, 3, 4, 5, 6, 7],
  co: [0, 0, 0, 0, 0, 0, 0, 0],
  ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// The six clockwise quarter turns, as published for the two-phase algorithm. Every other move is
// composed from these.
const QUARTER_TURN: Readonly<Record<Face, CubieState>> = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

/** `state` with `effect` applied on top of it. */
export function compose(state: CubieState, effect: CubieState): CubieState {
  const cp: number[] = [];
  const co: number[] = [];
  for (let i = 0; i < 8; i++) {
    const from = at(effect.cp, i);
    cp.push(at(state.cp, from));
    co.push((at(state.co, from) + at(effect.co, i)) % 3);
  }
  const ep: number[] = [];
  const eo: number[] = [];
  for (let i = 0; i < 12; i++) {
    const from = at(effect.ep, i);
    ep.push(at(state.ep, from));
    eo.push((at(state.eo, from) + at(effect.eo, i)) % 2);
  }
  return { cp, co, ep, eo };
}

const effects = new Map<Move, CubieState>();

/** What `move` does to a solved cube. Built on first use, then cached. */
export function effectOf(move: Move): CubieState {
  let effect = effects.get(move);
  if (effect === undefined) {
    const quarterTurn = QUARTER_TURN[faceOf(move)];
    effect = SOLVED;
    for (let turn = 0; turn < turnsOf(move); turn++) effect = compose(effect, quarterTurn);
    effects.set(move, effect);
  }
  return effect;
}

export function isSolvedState(state: CubieState): boolean {
  return (
    state.cp.every((piece, position) => piece === position) &&
    state.co.every((twist) => twist === 0) &&
    state.ep.every((piece, position) => piece === position) &&
    state.eo.every((flip) => flip === 0)
  );
}

/** Whether `permutation` is odd: built from the identity by an odd number of swaps. */
export function isOddPermutation(permutation: readonly number[]): boolean {
  const seen = permutation.map(() => false);
  let odd = false;
  for (let start = 0; start < permutation.length; start++) {
    let length = 0;
    for (let index = start; seen[index] === false; index = at(permutation, index)) {
      seen[index] = true;
      length += 1;
    }
    if (length > 0 && length % 2 === 0) odd = !odd;
  }
  return odd;
}
