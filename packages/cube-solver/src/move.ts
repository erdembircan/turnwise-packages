import type { Face } from '@turnwise/internal';

/**
 * One of the 18 face turns of a 3×3 cube.
 *
 * The name is the face letter, followed by nothing for a clockwise quarter turn, `2` for a half
 * turn, or `_PRIME` for a counter-clockwise quarter turn. Clockwise means clockwise as seen when
 * looking straight at that face.
 */
export type Move = `${Face}${'' | '2' | '_PRIME'}`;

/**
 * Every {@link Move}, keyed by itself, for callers who prefer `Moves.R_PRIME` to the literal
 * `'R_PRIME'`. Both spellings are the same value and the same type.
 */
export const Moves: { readonly [M in Move]: M } = {
  U: 'U',
  U2: 'U2',
  U_PRIME: 'U_PRIME',
  R: 'R',
  R2: 'R2',
  R_PRIME: 'R_PRIME',
  F: 'F',
  F2: 'F2',
  F_PRIME: 'F_PRIME',
  D: 'D',
  D2: 'D2',
  D_PRIME: 'D_PRIME',
  L: 'L',
  L2: 'L2',
  L_PRIME: 'L_PRIME',
  B: 'B',
  B2: 'B2',
  B_PRIME: 'B_PRIME',
};

interface MoveInfo {
  readonly face: Face;
  readonly turns: 1 | 2 | 3;
  readonly inverse: Move;
  readonly notation: string;
}

const MOVE_INFO: Readonly<Record<Move, MoveInfo>> = {
  U: { face: 'U', turns: 1, inverse: 'U_PRIME', notation: 'U' },
  U2: { face: 'U', turns: 2, inverse: 'U2', notation: 'U2' },
  U_PRIME: { face: 'U', turns: 3, inverse: 'U', notation: "U'" },
  R: { face: 'R', turns: 1, inverse: 'R_PRIME', notation: 'R' },
  R2: { face: 'R', turns: 2, inverse: 'R2', notation: 'R2' },
  R_PRIME: { face: 'R', turns: 3, inverse: 'R', notation: "R'" },
  F: { face: 'F', turns: 1, inverse: 'F_PRIME', notation: 'F' },
  F2: { face: 'F', turns: 2, inverse: 'F2', notation: 'F2' },
  F_PRIME: { face: 'F', turns: 3, inverse: 'F', notation: "F'" },
  D: { face: 'D', turns: 1, inverse: 'D_PRIME', notation: 'D' },
  D2: { face: 'D', turns: 2, inverse: 'D2', notation: 'D2' },
  D_PRIME: { face: 'D', turns: 3, inverse: 'D', notation: "D'" },
  L: { face: 'L', turns: 1, inverse: 'L_PRIME', notation: 'L' },
  L2: { face: 'L', turns: 2, inverse: 'L2', notation: 'L2' },
  L_PRIME: { face: 'L', turns: 3, inverse: 'L', notation: "L'" },
  B: { face: 'B', turns: 1, inverse: 'B_PRIME', notation: 'B' },
  B2: { face: 'B', turns: 2, inverse: 'B2', notation: 'B2' },
  B_PRIME: { face: 'B', turns: 3, inverse: 'B', notation: "B'" },
};

// The type system already rules out an unknown move. This guards callers writing plain JavaScript.
function infoOf(move: Move): MoveInfo {
  if (!Object.hasOwn(MOVE_INFO, move)) {
    throw new TypeError(
      `Unknown move ${JSON.stringify(move)}. A move is one of the 18 values in Moves, such as "R", "R2" or "R_PRIME".`,
    );
  }
  return MOVE_INFO[move];
}

/** The face a move turns. */
export function faceOf(move: Move): Face {
  return infoOf(move).face;
}

/**
 * How far a move turns its face, in clockwise quarter turns: 1 for a quarter turn, 2 for a half
 * turn, 3 for a counter-clockwise quarter turn.
 */
export function turnsOf(move: Move): 1 | 2 | 3 {
  return infoOf(move).turns;
}

/** The move that undoes `move`. A half turn undoes itself. */
export function inverse(move: Move): Move;
/**
 * The sequence that undoes `moves`: every move inverted, in reverse order. Returns a new array and
 * leaves `moves` untouched.
 */
export function inverse(moves: readonly Move[]): Move[];
export function inverse(input: Move | readonly Move[]): Move | Move[] {
  if (typeof input === 'string') return infoOf(input).inverse;
  return input.map((move) => infoOf(move).inverse).reverse();
}

/**
 * Moves in traditional cube notation, separated by spaces: `R U' F2`. For display only. The
 * package never reads this notation back.
 */
export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map((move) => infoOf(move).notation).join(' ');
}
