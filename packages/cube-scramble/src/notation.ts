import { Moves, formatAlgorithm } from '@turnwise/cube-solver';
import type { Move } from '@turnwise/cube-solver';

/**
 * One of the wide moves a blindfolded scramble can end with, to leave the cube in a random
 * orientation. A wide move turns a face together with the middle layer next to it.
 *
 * The name is the face letter and `w`, followed by nothing for a clockwise quarter turn, `2` for a
 * half turn, or `_PRIME` for a counter-clockwise quarter turn.
 */
export type WideMove = 'Rw' | 'Rw2' | 'Rw_PRIME' | 'Fw' | 'Fw_PRIME' | 'Uw' | 'Uw2' | 'Uw_PRIME';

const WIDE_NOTATION: Readonly<Record<WideMove, string>> = {
  Rw: 'Rw',
  Rw2: 'Rw2',
  Rw_PRIME: "Rw'",
  Fw: 'Fw',
  Fw_PRIME: "Fw'",
  Uw: 'Uw',
  Uw2: 'Uw2',
  Uw_PRIME: "Uw'",
};

function isWideMove(move: string): move is WideMove {
  return Object.hasOwn(WIDE_NOTATION, move);
}

function isMove(move: string): move is Move {
  return Object.hasOwn(Moves, move);
}

// The type system already rules out an unknown move. This guards callers writing plain JavaScript.
function notationOf(move: Move | WideMove): string {
  if (isWideMove(move)) return WIDE_NOTATION[move];
  if (isMove(move)) return formatAlgorithm([move]);
  throw new TypeError(
    `Unknown move ${JSON.stringify(move)}. A scramble is made of face turns such as "R", "R2" or "R_PRIME", and wide moves such as "Rw" or "Uw_PRIME".`,
  );
}

/**
 * A scramble in traditional cube notation, moves separated by spaces: `R U' F2 Rw Uw'`. For
 * display only. The package never reads this notation back.
 */
export function formatScramble(moves: readonly (Move | WideMove)[]): string {
  return moves.map(notationOf).join(' ');
}
