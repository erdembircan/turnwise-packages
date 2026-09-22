import { makeCube } from './cube';
import type { Cube } from './cube';
import {
  CORNER_POSITIONS,
  CORNER_STICKERS,
  EDGE_POSITIONS,
  EDGE_STICKERS,
  at,
} from '@turnwise/internal';
import type {
  CornerPosition,
  EdgePosition,
  Face,
  FaceGrid,
  StickerLocation,
} from '@turnwise/internal';
import {
  CornerTwistError,
  DuplicatePieceError,
  EdgeFlipError,
  ParityError,
  StickerCountError,
  UnknownPieceError,
} from './errors';
import type { ObservedPiece } from './errors';

const FACE_ORDER: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

function shapeError(detail: string): TypeError {
  return new TypeError(
    `Expected a FaceGrid: an object with the keys U, R, F, D, L and B, each holding an array of 9 face letters. ${detail}`,
  );
}

// The type system already guarantees all of this. It guards callers writing plain JavaScript, and
// grids that arrive as unchecked data.
function assertShape(faces: FaceGrid): void {
  const grid: Partial<Record<string, unknown>> = faces;
  for (const face of FACE_ORDER) {
    const stickers = grid[face];
    if (!Array.isArray(stickers)) throw shapeError(`Face ${face} is missing.`);
    if (stickers.length !== 9) {
      throw shapeError(`Face ${face} has ${String(stickers.length)} stickers.`);
    }
    stickers.forEach((sticker: unknown, index) => {
      if (!FACE_ORDER.some((letter) => letter === sticker)) {
        throw shapeError(`Sticker ${face}[${String(index)}] is ${JSON.stringify(sticker)}.`);
      }
    });
    if (stickers[4] !== face) {
      throw shapeError(
        `The centre of face ${face} is ${JSON.stringify(stickers[4])}; it must be "${face}".`,
      );
    }
  }
}

function countStickers(faces: FaceGrid): Record<Face, number> {
  const counts: Record<Face, number> = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (const face of FACE_ORDER) {
    for (const sticker of faces[face]) counts[sticker] += 1;
  }
  return counts;
}

interface Match {
  readonly piece: number;
  readonly orientation: number;
}

/**
 * Which piece shows `stickers`, and turned how far. A piece turned by `orientation` shows its home
 * sticker `(slot - orientation)` at `slot`, which is exactly how a real piece can sit in a
 * position; a mirror image of a piece matches nothing.
 */
function identify(
  stickers: readonly Face[],
  homes: readonly (readonly StickerLocation[])[],
): Match | undefined {
  const size = stickers.length;
  for (let piece = 0; piece < homes.length; piece++) {
    const home = at(homes, piece);
    for (let orientation = 0; orientation < size; orientation++) {
      const matches = stickers.every(
        (sticker, slot) => sticker === at(home, (slot - orientation + size) % size).face,
      );
      if (matches) return { piece, orientation };
    }
  }
  return undefined;
}

function sameLetters(stickers: readonly Face[], home: readonly StickerLocation[]): boolean {
  const seen = [...stickers].sort().join('');
  const wanted = home
    .map((location) => location.face)
    .sort()
    .join('');
  return seen === wanted;
}

interface Layer {
  readonly names: readonly (CornerPosition | EdgePosition)[];
  readonly homes: readonly (readonly StickerLocation[])[];
}

interface Resolved {
  readonly pieces: number[];
  readonly orientations: number[];
}

function resolve(faces: FaceGrid, layer: Layer): Resolved {
  const observed: ObservedPiece[] = layer.names.map((position, index) => {
    const locations = at(layer.homes, index);
    return {
      position,
      locations,
      stickers: locations.map((location) => at(faces[location.face], location.index)),
    };
  });
  const matches = observed.map((piece) => identify(piece.stickers, layer.homes));

  const unknown = observed.filter((_, index) => matches[index] === undefined);
  const firstUnknown = unknown[0];
  if (firstUnknown !== undefined) {
    const mirrored = layer.homes.findIndex((home) => sameLetters(firstUnknown.stickers, home));
    throw new UnknownPieceError(unknown, mirrored === -1 ? undefined : at(layer.names, mirrored));
  }

  const pieces = matches.map((match) => match?.piece ?? -1);
  const isRepeated = (piece: number): boolean =>
    pieces.indexOf(piece) !== pieces.lastIndexOf(piece);
  const repeated = pieces.find(isRepeated);
  if (repeated !== undefined) {
    throw new DuplicatePieceError(
      at(layer.names, repeated),
      observed.filter((_, index) => isRepeated(at(pieces, index))),
      layer.names.filter((_, index) => pieces[index] === repeated),
    );
  }

  return { pieces, orientations: matches.map((match) => match?.orientation ?? 0) };
}

function isOddPermutation(permutation: readonly number[]): boolean {
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

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * The cube that shows the stickers in `faces`.
 *
 * The compiler checks the shape of `faces`: six faces, nine stickers each, only face letters, and
 * every centre on its own face. Whether those stickers form a cube that can exist and be solved is
 * checked here, and each way it can fail has its own error, thrown in this order:
 * {@link StickerCountError}, {@link UnknownPieceError}, {@link DuplicatePieceError},
 * {@link CornerTwistError}, {@link EdgeFlipError}, {@link ParityError}. All of them extend
 * {@link InvalidCubeError}.
 */
export function cubeFromFaces(faces: FaceGrid): Cube {
  assertShape(faces);

  const counts = countStickers(faces);
  if (FACE_ORDER.some((face) => counts[face] !== 9)) throw new StickerCountError(counts);

  const corners = resolve(faces, { names: CORNER_POSITIONS, homes: CORNER_STICKERS });
  const edges = resolve(faces, { names: EDGE_POSITIONS, homes: EDGE_STICKERS });

  if (sum(corners.orientations) % 3 !== 0) throw new CornerTwistError();
  if (sum(edges.orientations) % 2 !== 0) throw new EdgeFlipError();
  if (isOddPermutation(corners.pieces) !== isOddPermutation(edges.pieces)) throw new ParityError();

  return makeCube({
    cp: corners.pieces,
    co: corners.orientations,
    ep: edges.pieces,
    eo: edges.orientations,
  });
}
