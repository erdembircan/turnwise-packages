import type { CornerPosition, EdgePosition } from './cubie';
import type { Face } from './face';
import type { StickerLocation } from './facelets';

/** The stickers found at one corner or edge position of a `FaceGrid`. */
export interface ObservedPiece {
  /** The position, named by the faces it touches. */
  readonly position: CornerPosition | EdgePosition;
  /** The stickers found there, in the same order as `locations`. */
  readonly stickers: readonly Face[];
  /** Where those stickers sit in the grid, for highlighting them. */
  readonly locations: readonly StickerLocation[];
}

function list(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;
}

function times(count: number): string {
  return count === 1 ? 'once' : `${String(count)} times`;
}

function describeStickers(piece: ObservedPiece): string {
  const where = piece.locations.map((location) => `${location.face}[${String(location.index)}]`);
  return `${piece.stickers.join(', ')} (at ${where.join(', ')})`;
}

function andOthers(total: number): string {
  const others = total - 1;
  if (others === 0) return '';
  const subject = others === 1 ? '1 more position has' : `${String(others)} more positions have`;
  return ` ${subject} the same problem; the "pieces" property lists them all.`;
}

/**
 * The stickers do not describe a cube that can exist or be solved. Every specific reason is a
 * subclass, so catch this one to handle them all alike, or a subclass to handle one reason.
 */
export abstract class InvalidCubeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCubeError';
  }
}

/** A face letter does not appear on exactly nine stickers. */
export class StickerCountError extends InvalidCubeError {
  /** How many stickers carry each face letter. A legal cube has nine of each. */
  readonly counts: Readonly<Record<Face, number>>;

  constructor(counts: Readonly<Record<Face, number>>) {
    const faces: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    const wrong = faces.filter((face) => counts[face] !== 9);
    const over = wrong.filter((face) => counts[face] === 10);
    const under = wrong.filter((face) => counts[face] === 8);
    const hint =
      wrong.length === 2 && over.length === 1 && under.length === 1
        ? ` One sticker entered as ${over.join('')} is probably ${under.join('')}.`
        : '';
    super(
      `Every face letter must appear on exactly 9 stickers, but ${list(
        wrong.map((face) => `${face} appears ${times(counts[face])}`),
      )}.${hint}`,
    );
    this.name = 'StickerCountError';
    this.counts = counts;
  }
}

/** A corner or edge position shows a combination of stickers that no real piece has. */
export class UnknownPieceError extends InvalidCubeError {
  /** Every position whose stickers match no piece. */
  readonly pieces: readonly ObservedPiece[];

  constructor(pieces: readonly ObservedPiece[], mirrorOf: string | undefined) {
    const first = pieces[0];
    const kind = first?.stickers.length === 3 ? 'corner' : 'edge';
    const described = first === undefined ? '' : describeStickers(first);
    const position = first?.position ?? '';
    const reason =
      mirrorOf === undefined
        ? `and no ${kind} piece has that combination.`
        : `which are the letters of the piece ${mirrorOf} in an order no turn can produce. Two of these stickers are probably swapped.`;
    super(
      `The ${kind} at ${position} shows the stickers ${described}, ${reason}${andOthers(pieces.length)}`,
    );
    this.name = 'UnknownPieceError';
    this.pieces = pieces;
  }
}

/** The same piece appears at more than one position. */
export class DuplicatePieceError extends InvalidCubeError {
  /** Every position that holds a piece also found somewhere else. */
  readonly pieces: readonly ObservedPiece[];

  constructor(piece: string, pieces: readonly ObservedPiece[], positions: readonly string[]) {
    const kind = piece.length === 3 ? 'corner' : 'edge';
    super(
      `The ${kind} piece ${piece} appears ${times(positions.length)}, at ${list(
        positions,
      )}. A cube has exactly one of each piece, so at least one of these positions was entered wrong.`,
    );
    this.name = 'DuplicatePieceError';
    this.pieces = pieces;
  }
}

/** Every piece is present, but one corner is twisted in place. */
export class CornerTwistError extends InvalidCubeError {
  constructor() {
    super(
      'Every piece is present, but one corner is twisted in place, which no sequence of turns can undo. On a real cube, a corner has been rotated by hand. In typed input, the three stickers of one corner are entered in rotated order.',
    );
    this.name = 'CornerTwistError';
  }
}

/** Every piece is present, but one edge is flipped in place. */
export class EdgeFlipError extends InvalidCubeError {
  constructor() {
    super(
      'Every piece is present, but one edge is flipped in place, which no sequence of turns can undo. On a real cube, an edge has been put back the wrong way round. In typed input, the two stickers of one edge are entered swapped.',
    );
    this.name = 'EdgeFlipError';
  }
}

/** Every piece is present and correctly oriented, but two pieces have traded places. */
export class ParityError extends InvalidCubeError {
  constructor() {
    super(
      "Every piece is present and correctly oriented, but two pieces have traded places, which no sequence of turns can undo. On a real cube, two pieces have been put back in each other's place. In typed input, the stickers of two pieces are entered at each other's positions.",
    );
    this.name = 'ParityError';
  }
}

/** A facelet string is not 54 face letters in U, R, F, D, L, B order. */
export class FaceletStringError extends Error {
  /** The index of the offending character, when the problem is a single character. */
  readonly index: number | undefined;

  constructor(message: string, index?: number) {
    super(message);
    this.name = 'FaceletStringError';
    this.index = index;
  }
}
