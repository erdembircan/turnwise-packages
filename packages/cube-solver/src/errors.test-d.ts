import { expectTypeOf, it } from 'vitest';
import type { Cube } from './cube';
import { InvalidCubeError, UnknownPieceError } from './errors';
import type { FaceletStringError, ObservedPiece, StickerCountError } from './errors';
import type { Face, FaceGrid } from '@turnwise/internal';
import { parseFaceletString } from './faceletString';
import { cubeFromFaces } from './fromFaces';

it('types cubeFromFaces as (grid: FaceGrid) => Cube', () => {
  expectTypeOf(cubeFromFaces).parameter(0).toEqualTypeOf<FaceGrid>();
  expectTypeOf(cubeFromFaces).returns.toEqualTypeOf<Cube>();
});

it('types parseFaceletString as returning FaceGrid', () => {
  expectTypeOf(parseFaceletString).returns.toEqualTypeOf<FaceGrid>();
});

it('types the data carried by each error', () => {
  expectTypeOf<StickerCountError['counts']>().toEqualTypeOf<Readonly<Record<Face, number>>>();
  expectTypeOf<UnknownPieceError['pieces']>().toEqualTypeOf<readonly ObservedPiece[]>();
  expectTypeOf<FaceletStringError['index']>().toEqualTypeOf<number | undefined>();
});

it('rejects constructing InvalidCubeError directly, since it is abstract', () => {
  // @ts-expect-error InvalidCubeError is abstract and cannot be constructed directly.
  new InvalidCubeError('x');
});

it('narrows a caught unknown error to UnknownPieceError and its pieces property', () => {
  const error = {} as unknown;
  if (error instanceof UnknownPieceError) {
    expectTypeOf(error.pieces).toEqualTypeOf<readonly ObservedPiece[]>();
  }
});

it('rejects a string argument to cubeFromFaces, since strings must go through parseFaceletString', () => {
  // @ts-expect-error cubeFromFaces takes a FaceGrid, not a facelet string.
  cubeFromFaces('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
});
