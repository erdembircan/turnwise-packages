import { expectTypeOf, it } from 'vitest';
import { applyMoves, cubeFromMoves, isSolved } from './cube';
import type { Cube } from './cube';
import { facesFromCube } from './grid';
import type { FaceGrid, Move } from '@turnwise/internal';

function assertCube(value: Cube): Cube {
  return value;
}

it('rejects a plain object literal as a Cube', () => {
  // @ts-expect-error A Cube cannot be written by hand.
  assertCube({});
});

it('types cubeFromMoves, applyMoves, isSolved and facesFromCube', () => {
  expectTypeOf(cubeFromMoves([])).toEqualTypeOf<Cube>();
  expectTypeOf(applyMoves(cubeFromMoves([]), [])).toEqualTypeOf<Cube>();
  expectTypeOf(isSolved(cubeFromMoves([]))).toEqualTypeOf<boolean>();
  expectTypeOf(facesFromCube(cubeFromMoves([]))).toEqualTypeOf<FaceGrid>();
});

it('accepts a readonly Move[] for cubeFromMoves and applyMoves', () => {
  const moves: readonly Move[] = ['R'];
  cubeFromMoves(moves);
  applyMoves(cubeFromMoves([]), moves);
});

it('rejects an unknown move passed to cubeFromMoves', () => {
  // @ts-expect-error 'R3' is not a valid Move.
  cubeFromMoves(['R3']);
});
