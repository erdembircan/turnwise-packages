import { compose, effectOf, gridOf } from '@turnwise/internal';
import type { CubieState, Face, FaceStickers, Move } from '@turnwise/internal';
import type { WideMove } from './notation';

/**
 * All 54 stickers of a cube as it is held, face by face and read as a `FaceGrid` is read, each
 * named by the face it belonged to on the solved cube. Unlike in a `FaceGrid`, a centre can be any
 * face: the wide moves at the end of a blindfolded scramble turn the whole cube.
 */
export type TurnedFaceGrid = Readonly<Record<Face, FaceStickers>>;

type Rotation = 'x' | 'y' | 'z';
type Point = readonly [number, number, number];

const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

// Each wide move turns the layer opposite its face, and the whole cube the way its face turns.
const WIDE: Readonly<
  Record<WideMove, { readonly layer: Face; readonly rotation: Rotation; readonly turns: 1 | 2 | 3 }>
> = {
  Rw: { layer: 'L', rotation: 'x', turns: 1 },
  Rw2: { layer: 'L', rotation: 'x', turns: 2 },
  Rw_PRIME: { layer: 'L', rotation: 'x', turns: 3 },
  Fw: { layer: 'B', rotation: 'z', turns: 1 },
  Fw_PRIME: { layer: 'B', rotation: 'z', turns: 3 },
  Uw: { layer: 'D', rotation: 'y', turns: 1 },
  Uw2: { layer: 'D', rotation: 'y', turns: 2 },
  Uw_PRIME: { layer: 'D', rotation: 'y', turns: 3 },
};

const MOVE_OF: Readonly<Record<Face, Readonly<Record<1 | 2 | 3, Move>>>> = {
  U: { 1: 'U', 2: 'U2', 3: 'U_PRIME' },
  R: { 1: 'R', 2: 'R2', 3: 'R_PRIME' },
  F: { 1: 'F', 2: 'F2', 3: 'F_PRIME' },
  D: { 1: 'D', 2: 'D2', 3: 'D_PRIME' },
  L: { 1: 'L', 2: 'L2', 3: 'L_PRIME' },
  B: { 1: 'B', 2: 'B2', 3: 'B_PRIME' },
};

/**
 * Where sticker `index` of `face` sits, as a point in space: x towards R, y towards U, z towards F.
 * Each point is twice the position of the sticker's piece plus the direction the sticker faces, so
 * no two stickers share one.
 */
function pointOf(face: Face, index: number): Point {
  const row = Math.floor(index / 3) - 1;
  const column = (index % 3) - 1;
  switch (face) {
    case 'U':
      return [2 * column, 3, 2 * row];
    case 'R':
      return [3, -2 * row, -2 * column];
    case 'F':
      return [2 * column, -2 * row, 3];
    case 'D':
      return [2 * column, -3, -2 * row];
    case 'L':
      return [-3, -2 * row, 2 * column];
    case 'B':
      return [-2 * column, -2 * row, -3];
  }
}

/** `point` after a quarter turn of the whole cube the way R (x), U (y) or F (z) turns. */
function turned(point: Point, rotation: Rotation): Point {
  const [x, y, z] = point;
  if (rotation === 'x') return [x, z, -y];
  if (rotation === 'y') return [-z, y, x];
  return [y, -x, z];
}

function keyOf(point: Point): string {
  return point.map((value) => String(value)).join(',');
}

/** The face whose centre is at `point`. */
function faceAt(point: Point): Face {
  const face = FACES.find((candidate) => keyOf(pointOf(candidate, 4)) === keyOf(point));
  if (face === undefined) throw new RangeError('Internal error: no centre at that point.');
  return face;
}

/** `grid` after a quarter turn of the whole cube. */
function turnedGrid(grid: TurnedFaceGrid, rotation: Rotation): TurnedFaceGrid {
  const moved = new Map<string, Face>();
  for (const face of FACES) {
    grid[face].forEach((sticker, index) => {
      moved.set(keyOf(turned(pointOf(face, index), rotation)), sticker);
    });
  }
  const stickers = (face: Face): TurnedFaceGrid[Face] => {
    const read = (index: number): Face => {
      const sticker = moved.get(keyOf(pointOf(face, index)));
      if (sticker === undefined) throw new RangeError('Internal error: a sticker went missing.');
      return sticker;
    };
    return [read(0), read(1), read(2), read(3), read(4), read(5), read(6), read(7), read(8)];
  };
  return {
    U: stickers('U'),
    R: stickers('R'),
    F: stickers('F'),
    D: stickers('D'),
    L: stickers('L'),
    B: stickers('B'),
  };
}

/**
 * The cube as it is held after reaching `state` from solved, held white on top and green in
 * front, and then turning `orientation`'s wide moves.
 */
export function turnedFaces(state: CubieState, orientation: readonly WideMove[]): TurnedFaceGrid {
  let layersTurned = state;
  // Which face's centre is at each position, after the whole-cube turns so far.
  let holding: Readonly<Record<Face, Face>> = { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
  const rotations: Rotation[] = [];
  for (const wide of orientation) {
    const { layer, rotation, turns } = WIDE[wide];
    layersTurned = compose(layersTurned, effectOf(MOVE_OF[holding[layer]][turns]));
    for (let turn = 0; turn < turns; turn++) {
      const next = { ...holding };
      for (const face of FACES) next[faceAt(turned(pointOf(face, 4), rotation))] = holding[face];
      holding = next;
      rotations.push(rotation);
    }
  }
  let grid: TurnedFaceGrid = gridOf(layersTurned);
  for (const rotation of rotations) grid = turnedGrid(grid, rotation);
  return grid;
}
