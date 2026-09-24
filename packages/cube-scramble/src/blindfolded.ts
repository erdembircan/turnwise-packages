import { cubeFromFaces, cubeFromMoves, faceOf, inverse } from '@turnwise/cube-solver';
import type { Effort, Face, FaceStickers, Move } from '@turnwise/cube-solver';
import { gridOf } from '@turnwise/internal';
import type { WideMove } from './notation';
import { drawOrientation } from './orientation';
import { drawScrambleState } from './randomState';
import { scrambleOf } from './scramble';
import type { ScrambleOptions } from './scramble';
import { secureRandom } from './secureRandom';
import { turnedFaces } from './turnedFaces';

type Axis = 'UD' | 'RL' | 'FB';

const FACE_AXIS: Readonly<Record<Face, Axis>> = {
  U: 'UD',
  D: 'UD',
  R: 'RL',
  L: 'RL',
  F: 'FB',
  B: 'FB',
};

const WIDE_AXIS: Readonly<Record<WideMove, Axis>> = {
  Rw: 'RL',
  Rw2: 'RL',
  Rw_PRIME: 'RL',
  Fw: 'FB',
  Fw_PRIME: 'FB',
  Uw: 'UD',
  Uw2: 'UD',
  Uw_PRIME: 'UD',
};

// For each axis, the turns off it, in the order they are tried as a scramble's last turn.
const TURNS_OFF: Readonly<Record<Axis, readonly Move[]>> = {
  UD: ['R', 'R_PRIME', 'R2', 'F', 'F_PRIME', 'F2', 'L', 'L_PRIME', 'L2', 'B', 'B_PRIME', 'B2'],
  RL: ['U', 'U_PRIME', 'U2', 'F', 'F_PRIME', 'F2', 'D', 'D_PRIME', 'D2', 'B', 'B_PRIME', 'B2'],
  FB: ['U', 'U_PRIME', 'U2', 'R', 'R_PRIME', 'R2', 'D', 'D_PRIME', 'D2', 'L', 'L_PRIME', 'L2'],
};

function lastAxis(moves: readonly Move[]): Axis | undefined {
  const last = moves.at(-1);
  return last === undefined ? undefined : FACE_AXIS[faceOf(last)];
}

/**
 * `moves`, unless its last turn is on `axis`. Then another scramble to the same position that ends
 * with a turn off that axis: the position one such turn before it is solved, and the turn is added.
 * The WCA's official scrambler never ends with, say, `R Rw`; this keeps the same rule without
 * asking anything new of the solver. If no turn off the axis works, `moves` stays.
 */
function endingOffAxis(moves: Move[], axis: Axis, effort: Effort | undefined): Move[] {
  if (lastAxis(moves) !== axis) return moves;
  for (const last of TURNS_OFF[axis]) {
    const before = scrambleOf(cubeFromMoves([...moves, inverse(last)]), effort);
    const previous = before.at(-1);
    if (previous !== undefined && faceOf(previous) !== faceOf(last)) return [...before, last];
  }
  return moves;
}

/** A blindfolded scramble, and the cube it leaves. */
export interface BlindfoldedScramble {
  /**
   * The face turns, then up to two wide moves, for a solved cube held white on top and green in
   * front.
   */
  readonly moves: (Move | WideMove)[];
  /**
   * The cube after the moves, as it is then held: every sticker, named by the face it belonged to
   * when solved. The wide moves turn the whole cube, so the centres show its orientation.
   */
  readonly faces: Readonly<Record<Face, FaceStickers>>;
}

/**
 * A random state in a random orientation, with the moves that reach it: a scramble drawn as
 * `scramble` draws it, then the wide moves that turn the cube to one of its 24 orientations, each
 * equally likely, as WCA Regulation 4b3a requires for blindfolded events.
 */
export function blindfoldedScramble(options: ScrambleOptions = {}): BlindfoldedScramble {
  const random = options.random ?? secureRandom;
  const state = drawScrambleState(random);
  const orientation = drawOrientation(random);
  const faces = turnedFaces(state, orientation);
  const moves = scrambleOf(cubeFromFaces(gridOf(state)), options.effort);
  const first = orientation[0];
  if (first === undefined) return { moves, faces };
  return {
    moves: [...endingOffAxis(moves, WIDE_AXIS[first], options.effort), ...orientation],
    faces,
  };
}
