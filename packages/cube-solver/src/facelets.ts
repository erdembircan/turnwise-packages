import type { Face } from '@turnwise/internal';

/** One sticker's place on the cube: a face, and a position 0..8 on it, read row by row. */
export interface StickerLocation {
  readonly face: Face;
  readonly index: number;
}

type CornerStickers = readonly [StickerLocation, StickerLocation, StickerLocation];
type EdgeStickers = readonly [StickerLocation, StickerLocation];

// The three stickers of each corner position, clockwise, starting with the one on U or D. Indexed
// like CORNER_POSITIONS. The faces also name the piece that lives there when solved.
export const CORNER_STICKERS: readonly CornerStickers[] = [
  [
    { face: 'U', index: 8 },
    { face: 'R', index: 0 },
    { face: 'F', index: 2 },
  ], // URF
  [
    { face: 'U', index: 6 },
    { face: 'F', index: 0 },
    { face: 'L', index: 2 },
  ], // UFL
  [
    { face: 'U', index: 0 },
    { face: 'L', index: 0 },
    { face: 'B', index: 2 },
  ], // ULB
  [
    { face: 'U', index: 2 },
    { face: 'B', index: 0 },
    { face: 'R', index: 2 },
  ], // UBR
  [
    { face: 'D', index: 2 },
    { face: 'F', index: 8 },
    { face: 'R', index: 6 },
  ], // DFR
  [
    { face: 'D', index: 0 },
    { face: 'L', index: 8 },
    { face: 'F', index: 6 },
  ], // DLF
  [
    { face: 'D', index: 6 },
    { face: 'B', index: 8 },
    { face: 'L', index: 6 },
  ], // DBL
  [
    { face: 'D', index: 8 },
    { face: 'R', index: 8 },
    { face: 'B', index: 6 },
  ], // DRB
];

// The two stickers of each edge position, starting with the one on U or D, or on F or B for the
// four edges of the middle layer. Indexed like EDGE_POSITIONS.
export const EDGE_STICKERS: readonly EdgeStickers[] = [
  [
    { face: 'U', index: 5 },
    { face: 'R', index: 1 },
  ], // UR
  [
    { face: 'U', index: 7 },
    { face: 'F', index: 1 },
  ], // UF
  [
    { face: 'U', index: 3 },
    { face: 'L', index: 1 },
  ], // UL
  [
    { face: 'U', index: 1 },
    { face: 'B', index: 1 },
  ], // UB
  [
    { face: 'D', index: 5 },
    { face: 'R', index: 7 },
  ], // DR
  [
    { face: 'D', index: 1 },
    { face: 'F', index: 7 },
  ], // DF
  [
    { face: 'D', index: 3 },
    { face: 'L', index: 7 },
  ], // DL
  [
    { face: 'D', index: 7 },
    { face: 'B', index: 7 },
  ], // DB
  [
    { face: 'F', index: 5 },
    { face: 'R', index: 3 },
  ], // FR
  [
    { face: 'F', index: 3 },
    { face: 'L', index: 5 },
  ], // FL
  [
    { face: 'B', index: 5 },
    { face: 'L', index: 3 },
  ], // BL
  [
    { face: 'B', index: 3 },
    { face: 'R', index: 5 },
  ], // BR
];
