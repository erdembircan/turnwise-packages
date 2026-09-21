import { stateOf } from './cube';
import type { Cube } from './cube';
import { at } from '@turnwise/internal';
import type { CubieState, Face } from '@turnwise/internal';
import { CORNER_STICKERS, EDGE_STICKERS } from './facelets';

/**
 * The nine stickers of one face, read row by row while looking straight at it:
 *
 * ```
 * 0 1 2
 * 3 4 5
 * 6 7 8
 * ```
 *
 * Each sticker is named by the face it belongs to. Position 4 is the centre, which never moves, so
 * its type is pinned to the face itself and a wrong centre is a compile error.
 *
 * U is read with B at the top. D is read with F at the top. R, F, L and B are read with U at the
 * top.
 */
export type FaceStickers<Centre extends Face = Face> = readonly [
  Face,
  Face,
  Face,
  Face,
  Centre,
  Face,
  Face,
  Face,
  Face,
];

/** All 54 stickers of a cube, face by face. */
export type FaceGrid = { readonly [F in Face]: FaceStickers<F> };

function faceStickers<Centre extends Face>(
  centre: Centre,
  cells: readonly Face[],
): FaceStickers<Centre> {
  return [
    at(cells, 0),
    at(cells, 1),
    at(cells, 2),
    at(cells, 3),
    centre,
    at(cells, 5),
    at(cells, 6),
    at(cells, 7),
    at(cells, 8),
  ];
}

/**
 * The stickers of the cube whose pieces sit as `state` describes. It reads nothing but `state`, so
 * code that holds a piece state without a `Cube` can draw it too.
 */
export function gridOf(state: CubieState): FaceGrid {
  const cells: Readonly<Record<Face, Face[]>> = { U: [], R: [], F: [], D: [], L: [], B: [] };

  for (let position = 0; position < 8; position++) {
    const here = at(CORNER_STICKERS, position);
    const home = at(CORNER_STICKERS, at(state.cp, position));
    const twist = at(state.co, position);
    here.forEach((location, slot) => {
      cells[location.face][location.index] = at(home, (slot - twist + 3) % 3).face;
    });
  }

  for (let position = 0; position < 12; position++) {
    const here = at(EDGE_STICKERS, position);
    const home = at(EDGE_STICKERS, at(state.ep, position));
    const flip = at(state.eo, position);
    here.forEach((location, slot) => {
      cells[location.face][location.index] = at(home, (slot + flip) % 2).face;
    });
  }

  return {
    U: faceStickers('U', cells.U),
    R: faceStickers('R', cells.R),
    F: faceStickers('F', cells.F),
    D: faceStickers('D', cells.D),
    L: faceStickers('L', cells.L),
    B: faceStickers('B', cells.B),
  };
}

/** The stickers of `cube`, for drawing it or for sending it somewhere a `Cube` cannot go. */
export function facesFromCube(cube: Cube): FaceGrid {
  return gridOf(stateOf(cube));
}
