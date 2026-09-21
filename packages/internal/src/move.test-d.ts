import { expectTypeOf, it } from 'vitest';
import { Moves, faceOf, formatAlgorithm, inverse, turnsOf, type Move } from './move';
import type { Face } from './face';

it('types Move as the union of all 18 moves', () => {
  expectTypeOf<Move>().toEqualTypeOf<
    | 'U'
    | 'U2'
    | 'U_PRIME'
    | 'R'
    | 'R2'
    | 'R_PRIME'
    | 'F'
    | 'F2'
    | 'F_PRIME'
    | 'D'
    | 'D2'
    | 'D_PRIME'
    | 'L'
    | 'L2'
    | 'L_PRIME'
    | 'B'
    | 'B2'
    | 'B_PRIME'
  >();
});

it('types Moves.R_PRIME, Moves.U, and Moves.B2 as their own literal', () => {
  expectTypeOf(Moves.R_PRIME).toEqualTypeOf<'R_PRIME'>();
  expectTypeOf(Moves.U).toEqualTypeOf<'U'>();
  expectTypeOf(Moves.B2).toEqualTypeOf<'B2'>();
});

it('types (typeof Moves)[Move] as Move', () => {
  expectTypeOf<(typeof Moves)[Move]>().toEqualTypeOf<Move>();
});

function assertMove(value: Move): Move {
  return value;
}

it('rejects values that are not a Move', () => {
  // @ts-expect-error 'R3' is not a valid Move.
  assertMove('R3');
  // @ts-expect-error "R'" is not a valid Move; the counter-clockwise spelling is '_PRIME'.
  assertMove("R'");
  // @ts-expect-error 'X' is not a valid Move.
  assertMove('X');
  // @ts-expect-error 'R_PRIM' is not a valid Move.
  assertMove('R_PRIM');
});

it('types inverse(move) as Move', () => {
  expectTypeOf(inverse('R')).toEqualTypeOf<Move>();
});

it('types inverse(moves) as Move[]', () => {
  expectTypeOf(inverse(['R', 'U'])).toEqualTypeOf<Move[]>();
});

it('accepts a readonly Move[] argument for inverse and formatAlgorithm', () => {
  const seq: readonly Move[] = ['R'];
  inverse(seq);
  formatAlgorithm(seq);
});

it('types turnsOf(move) as 1 | 2 | 3 and faceOf(move) as Face', () => {
  expectTypeOf(turnsOf('R')).toEqualTypeOf<1 | 2 | 3>();
  expectTypeOf(faceOf('R')).toEqualTypeOf<Face>();
});

it('rejects an unknown move passed to inverse', () => {
  // @ts-expect-error 'R3' is not a valid Move.
  inverse('R3');
});
