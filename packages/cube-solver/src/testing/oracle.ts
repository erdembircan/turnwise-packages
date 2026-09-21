import type { Face } from '@turnwise/internal';
import { faceOf, turnsOf } from '../move';
import type { Move } from '../move';

/**
 * An independent model of the cube, for tests only. It knows nothing about pieces, permutations or
 * orientations: it is 54 stickers in 3D space, and a move is a real rotation of one layer. It
 * shares no table with the package, so agreement between the two is evidence, not tautology.
 *
 * Axes: x points out of R, y out of U, z out of F (a right-handed frame).
 */

type Vector = readonly [number, number, number];

interface Sticker {
  readonly position: Vector;
  readonly normal: Vector;
  readonly home: Face;
}

export type OracleCube = readonly Sticker[];

const FACE_ORDER: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

const NORMAL: Readonly<Record<Face, Vector>> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

// The direction of increasing column and increasing row on each face, as seen looking straight at
// it: U with B at the top, D with F at the top, the other four with U at the top.
const RIGHT: Readonly<Record<Face, Vector>> = {
  U: [1, 0, 0],
  R: [0, 0, -1],
  F: [1, 0, 0],
  D: [1, 0, 0],
  L: [0, 0, 1],
  B: [-1, 0, 0],
};

const DOWN: Readonly<Record<Face, Vector>> = {
  U: [0, 0, 1],
  R: [0, -1, 0],
  F: [0, -1, 0],
  D: [0, 0, -1],
  L: [0, -1, 0],
  B: [0, -1, 0],
};

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vector, b: Vector): Vector {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// A quarter turn about `axis`, clockwise as seen from the tip of `axis` looking back at the cube.
function clockwise(axis: Vector, v: Vector): Vector {
  const along = dot(axis, v);
  const sideways = cross(axis, v);
  return [
    axis[0] * along - sideways[0],
    axis[1] * along - sideways[1],
    axis[2] * along - sideways[2],
  ];
}

export function solvedOracle(): OracleCube {
  const stickers: Sticker[] = [];
  for (const face of FACE_ORDER) {
    for (const row of [-1, 0, 1]) {
      for (const column of [-1, 0, 1]) {
        const normal = NORMAL[face];
        const right = RIGHT[face];
        const down = DOWN[face];
        stickers.push({
          position: [
            normal[0] + right[0] * column + down[0] * row,
            normal[1] + right[1] * column + down[1] * row,
            normal[2] + right[2] * column + down[2] * row,
          ],
          normal,
          home: face,
        });
      }
    }
  }
  return stickers;
}

export function turnOracle(cube: OracleCube, moves: readonly Move[]): OracleCube {
  let stickers = cube;
  for (const move of moves) {
    const axis = NORMAL[faceOf(move)];
    for (let turn = 0; turn < turnsOf(move); turn++) {
      stickers = stickers.map((sticker) =>
        dot(sticker.position, axis) === 1
          ? {
              position: clockwise(axis, sticker.position),
              normal: clockwise(axis, sticker.normal),
              home: sticker.home,
            }
          : sticker,
      );
    }
  }
  return stickers;
}

/** The oracle's stickers in the same shape as a `FaceGrid`, as plain arrays of face letters. */
export function readOracle(cube: OracleCube): Record<Face, Face[]> {
  const grid: Record<Face, Face[]> = { U: [], R: [], F: [], D: [], L: [], B: [] };
  for (const sticker of cube) {
    const face = FACE_ORDER.find((candidate) => dot(NORMAL[candidate], sticker.normal) === 1);
    if (face === undefined) throw new Error('Oracle sticker is not facing any face.');
    const index =
      (dot(sticker.position, DOWN[face]) + 1) * 3 + (dot(sticker.position, RIGHT[face]) + 1);
    grid[face][index] = sticker.home;
  }
  return grid;
}
