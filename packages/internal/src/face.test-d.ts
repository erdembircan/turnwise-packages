import { expectTypeOf, it } from 'vitest';
import { Faces, type Face } from './face';

it('types Faces.U and Faces.B as their own literal', () => {
  expectTypeOf(Faces.U).toEqualTypeOf<'U'>();
  expectTypeOf(Faces.B).toEqualTypeOf<'B'>();
});

it('types (typeof Faces)[Face] as Face', () => {
  expectTypeOf<(typeof Faces)[Face]>().toEqualTypeOf<Face>();
});

function assertFace(value: Face): Face {
  return value;
}

it('rejects values that are not a Face', () => {
  // @ts-expect-error 'X' is not a valid Face.
  assertFace('X');
  // @ts-expect-error 'u' (lowercase) is not a valid Face.
  assertFace('u');
});
