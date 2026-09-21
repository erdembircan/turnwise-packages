import { describe, expect, it } from 'vitest';
import { applyMoves, cubeFromMoves, isSolved } from './cube';
import {
  CornerTwistError,
  DuplicatePieceError,
  EdgeFlipError,
  InvalidCubeError,
  ParityError,
  StickerCountError,
  UnknownPieceError,
} from './errors';
import { inverse } from '@turnwise/internal';
import type { Face } from '@turnwise/internal';
import { CORNER_STICKERS, EDGE_STICKERS } from './facelets';
import { cubeFromFaces } from './fromFaces';
import { facesFromCube } from './grid';
import type { FaceGrid } from './grid';
import { asGrid, editable, randomMoves, solvedGrid } from './testing/grids';
import { readOracle, solvedOracle, turnOracle } from './testing/oracle';
import { seededRandom } from './testing/rng';
import { at } from './util';

function catchError(fn: () => unknown): unknown {
  try {
    fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

function flipEdgeInPlace(cells: Record<Face, Face[]>, index: number): void {
  const [a, b] = at(EDGE_STICKERS, index);
  const valueA = at(cells[a.face], a.index);
  const valueB = at(cells[b.face], b.index);
  cells[a.face][a.index] = valueB;
  cells[b.face][b.index] = valueA;
}

function twistCornerInPlace(cells: Record<Face, Face[]>, index: number): void {
  const locations = at(CORNER_STICKERS, index);
  const values = locations.map((location) => at(cells[location.face], location.index));
  locations.forEach((location, slot) => {
    cells[location.face][location.index] = at(values, (slot + 1) % 3);
  });
}

function swapEdgesInPlace(cells: Record<Face, Face[]>, indexA: number, indexB: number): void {
  const locationsA = at(EDGE_STICKERS, indexA);
  const locationsB = at(EDGE_STICKERS, indexB);
  locationsA.forEach((location, slot) => {
    const other = at(locationsB, slot);
    const valueHere = at(cells[location.face], location.index);
    const valueThere = at(cells[other.face], other.index);
    cells[location.face][location.index] = valueThere;
    cells[other.face][other.index] = valueHere;
  });
}

describe('cubeFromFaces', () => {
  describe('accepts every real cube', () => {
    it('matches the oracle for a random sequence built straight from stickers, for 300 seeds', () => {
      for (let seed = 1; seed <= 300; seed++) {
        const sequence = randomMoves(seed);
        const grid = asGrid(readOracle(turnOracle(solvedOracle(), sequence)));
        expect(facesFromCube(cubeFromFaces(grid)), `seed ${String(seed)}`).toEqual(
          facesFromCube(cubeFromMoves(sequence)),
        );
      }
    });

    it('accepts the solved grid', () => {
      expect(isSolved(cubeFromFaces(solvedGrid()))).toBe(true);
    });

    it('turns exactly like a cube built from the same moves, for 50 seeds', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const sequence = randomMoves(seed);
        const grid = facesFromCube(cubeFromMoves(sequence));
        const cube = applyMoves(cubeFromFaces(grid), inverse(sequence));
        expect(isSolved(cube), `seed ${String(seed)}`).toBe(true);
      }
    });
  });

  describe('rejects impossible cubes', () => {
    it('flags a single miscounted sticker as a StickerCountError, with counts and a hint', () => {
      const cells = editable(solvedGrid());
      cells.U[0] = 'R';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(StickerCountError);
      expect(error).toBeInstanceOf(InvalidCubeError);
      if (error instanceof StickerCountError) {
        expect(error.name).toBe('StickerCountError');
        expect(error.counts).toEqual({ U: 8, R: 10, F: 9, D: 9, L: 9, B: 9 });
        expect(error.message).toBe(
          'Every face letter must appear on exactly 9 stickers, but U appears 8 times and R appears 10 times. One sticker entered as R is probably U.',
        );
      }
    });

    it('flags three miscounted stickers as a StickerCountError with no hint', () => {
      const cells = editable(solvedGrid());
      cells.U[0] = 'R';
      cells.U[1] = 'R';
      cells.U[2] = 'F';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(StickerCountError);
      if (error instanceof StickerCountError) {
        expect(error.message).toBe(
          'Every face letter must appear on exactly 9 stickers, but U appears 6 times, R appears 11 times and F appears 10 times.',
        );
      }
    });

    it('flags a mirror-image corner as an UnknownPieceError naming the piece it mirrors', () => {
      const cells = editable(solvedGrid());
      cells.U[8] = 'U';
      cells.R[0] = 'F';
      cells.F[2] = 'R';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(UnknownPieceError);
      expect(error).toBeInstanceOf(InvalidCubeError);
      if (error instanceof UnknownPieceError) {
        expect(error.name).toBe('UnknownPieceError');
        expect(error.pieces).toHaveLength(1);
        expect(at(error.pieces, 0)).toEqual({
          position: 'URF',
          stickers: ['U', 'F', 'R'],
          locations: [
            { face: 'U', index: 8 },
            { face: 'R', index: 0 },
            { face: 'F', index: 2 },
          ],
        });
        expect(error.message).toBe(
          'The corner at URF shows the stickers U, F, R (at U[8], R[0], F[2]), which are the letters of the piece URF in an order no turn can produce. Two of these stickers are probably swapped.',
        );
      }
    });

    it('flags an impossible edge with legal sticker counts as an UnknownPieceError listing every affected position', () => {
      const cells = editable(solvedGrid());
      cells.F[1] = 'D';
      cells.D[1] = 'F';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(UnknownPieceError);
      if (error instanceof UnknownPieceError) {
        expect(error.pieces.map((piece) => piece.position)).toEqual(['UF', 'DF']);
        expect(error.message).toBe(
          'The edge at UF shows the stickers U, D (at U[7], F[1]), and no edge piece has that combination. 1 more position has the same problem; the "pieces" property lists them all.',
        );
      }
    });

    it('flags two duplicated pieces with legal counts as a DuplicatePieceError listing every affected position', () => {
      const cells = editable(solvedGrid());
      cells.F[1] = 'R';
      cells.R[7] = 'F';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(DuplicatePieceError);
      if (error instanceof DuplicatePieceError) {
        expect(error.message).toBe(
          'The edge piece UR appears 2 times, at UR and UF. A cube has exactly one of each piece, so at least one of these positions was entered wrong.',
        );
        expect(error.pieces.map((piece) => piece.position)).toEqual(['UR', 'UF', 'DR', 'DF']);
      }
    });

    it('flags a single twisted corner as a CornerTwistError', () => {
      const cells = editable(solvedGrid());
      cells.U[8] = 'F';
      cells.R[0] = 'U';
      cells.F[2] = 'R';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(CornerTwistError);
      expect(error).toBeInstanceOf(InvalidCubeError);
      if (error instanceof CornerTwistError) {
        expect(error.name).toBe('CornerTwistError');
      }
    });

    it('flags a single flipped edge as an EdgeFlipError', () => {
      const cells = editable(solvedGrid());
      cells.U[7] = 'F';
      cells.F[1] = 'U';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(EdgeFlipError);
      expect(error).toBeInstanceOf(InvalidCubeError);
      if (error instanceof EdgeFlipError) {
        expect(error.name).toBe('EdgeFlipError');
      }
    });

    it('flags two swapped edges as a ParityError', () => {
      const cells = editable(solvedGrid());
      cells.U[7] = 'U';
      cells.F[1] = 'R';
      cells.U[5] = 'U';
      cells.R[1] = 'F';
      const error = catchError(() => cubeFromFaces(asGrid(cells)));
      expect(error).toBeInstanceOf(ParityError);
      expect(error).toBeInstanceOf(InvalidCubeError);
      if (error instanceof ParityError) {
        expect(error.name).toBe('ParityError');
      }
    });

    describe('order of checks', () => {
      it('reports the corner twist before a flipped edge when both are present', () => {
        const cells = editable(solvedGrid());
        cells.U[8] = 'F';
        cells.R[0] = 'U';
        cells.F[2] = 'R';
        cells.U[7] = 'F';
        cells.F[1] = 'U';
        const error = catchError(() => cubeFromFaces(asGrid(cells)));
        expect(error).toBeInstanceOf(CornerTwistError);
      });

      it('reports the sticker count before a flipped edge when both are present', () => {
        const cells = editable(solvedGrid());
        cells.U[0] = 'R';
        cells.U[7] = 'F';
        cells.F[1] = 'U';
        const error = catchError(() => cubeFromFaces(asGrid(cells)));
        expect(error).toBeInstanceOf(StickerCountError);
      });
    });

    describe('oracle-driven corruption of a random real cube, 50 seeds each', () => {
      it('flips one random edge in place and always gets an EdgeFlipError', () => {
        for (let seed = 1; seed <= 50; seed++) {
          const cells = editable(facesFromCube(cubeFromMoves(randomMoves(seed))));
          const rng = seededRandom(seed);
          flipEdgeInPlace(cells, Math.floor(rng() * EDGE_STICKERS.length));
          const error = catchError(() => cubeFromFaces(asGrid(cells)));
          expect(error, `seed ${String(seed)}`).toBeInstanceOf(EdgeFlipError);
        }
      });

      it('twists one random corner in place and always gets a CornerTwistError', () => {
        for (let seed = 1; seed <= 50; seed++) {
          const cells = editable(facesFromCube(cubeFromMoves(randomMoves(seed))));
          const rng = seededRandom(seed);
          twistCornerInPlace(cells, Math.floor(rng() * CORNER_STICKERS.length));
          const error = catchError(() => cubeFromFaces(asGrid(cells)));
          expect(error, `seed ${String(seed)}`).toBeInstanceOf(CornerTwistError);
        }
      });

      it('swaps the stickers of two random different edges and always gets a ParityError', () => {
        for (let seed = 1; seed <= 50; seed++) {
          const cells = editable(facesFromCube(cubeFromMoves(randomMoves(seed))));
          const rng = seededRandom(seed);
          const indexA = Math.floor(rng() * EDGE_STICKERS.length);
          let indexB = Math.floor(rng() * EDGE_STICKERS.length);
          while (indexB === indexA) indexB = Math.floor(rng() * EDGE_STICKERS.length);
          swapEdgesInPlace(cells, indexA, indexB);
          const error = catchError(() => cubeFromFaces(asGrid(cells)));
          expect(error, `seed ${String(seed)}`).toBeInstanceOf(ParityError);
        }
      });
    });
  });

  describe('runtime shape guard', () => {
    const SHAPE_MESSAGE_PREFIX =
      'Expected a FaceGrid: an object with the keys U, R, F, D, L and B, each holding an array of 9 face letters. ';

    function asFaceGrid(value: unknown): FaceGrid {
      return value as FaceGrid;
    }

    function expectShapeError(build: () => FaceGrid, ending: string): void {
      const error = catchError(() => cubeFromFaces(build()));
      expect(error).toBeInstanceOf(TypeError);
      expect(error).not.toBeInstanceOf(InvalidCubeError);
      if (error instanceof TypeError) {
        expect(error.message).toBe(`${SHAPE_MESSAGE_PREFIX}${ending}`);
      }
    }

    it('rejects a grid with face B missing', () => {
      const grid = editable(solvedGrid());
      const partial: Partial<Record<Face, Face[]>> = {
        U: grid.U,
        R: grid.R,
        F: grid.F,
        D: grid.D,
        L: grid.L,
      };
      expectShapeError(() => asFaceGrid(partial), 'Face B is missing.');
    });

    it('rejects a grid where face U has 8 stickers', () => {
      expectShapeError(() => {
        const cells = editable(solvedGrid());
        cells.U = cells.U.slice(0, 8);
        return asGrid(cells);
      }, 'Face U has 8 stickers.');
    });

    it('rejects a grid with a sticker that is not a face letter', () => {
      expectShapeError(() => {
        const cells = editable(solvedGrid());
        cells.R[3] = 'X' as unknown as Face;
        return asGrid(cells);
      }, 'Sticker R[3] is "X".');
    });

    it('rejects a grid with the wrong centre on face U', () => {
      expectShapeError(() => {
        const cells = editable(solvedGrid());
        cells.U[4] = 'R';
        return asGrid(cells);
      }, 'The centre of face U is "R"; it must be "U".');
    });

    it('rejects null and undefined instead of a grid', () => {
      expect(catchError(() => cubeFromFaces(asFaceGrid(null)))).toBeInstanceOf(TypeError);
      expect(catchError(() => cubeFromFaces(asFaceGrid(undefined)))).toBeInstanceOf(TypeError);
    });
  });
});
