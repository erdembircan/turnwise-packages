import { expectTypeOf, it } from 'vitest';
import type { Face } from './face';
import type { FaceGrid } from './grid';

function assertGrid(value: FaceGrid): FaceGrid {
  return value;
}

const OWN_U = ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] as const;
const OWN_R = ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'] as const;
const OWN_F = ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'] as const;
const OWN_D = ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'] as const;
const OWN_L = ['L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L'] as const;
const OWN_B = ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'] as const;

it('accepts a complete grid of own-face stickers', () => {
  const grid = assertGrid({ U: OWN_U, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B });
  expectTypeOf(grid).toEqualTypeOf<FaceGrid>();
});

it('rejects a grid missing face B', () => {
  // @ts-expect-error missing face B
  assertGrid({ U: OWN_U, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L });
});

it('rejects a grid with an extra key X', () => {
  // @ts-expect-error extra key X is not part of FaceGrid
  assertGrid({ U: OWN_U, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B, X: OWN_U });
});

it('rejects a face with 8 stickers', () => {
  const short = ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] as const;
  // @ts-expect-error U has only 8 stickers
  assertGrid({ U: short, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B });
});

it('rejects a face with 10 stickers', () => {
  const long = ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] as const;
  // @ts-expect-error U has 10 stickers
  assertGrid({ U: long, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B });
});

it('rejects a sticker value that is not a Face', () => {
  const bad = ['X', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] as const;
  // @ts-expect-error 'X' is not a Face
  assertGrid({ U: bad, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B });
});

it('rejects a wrong centre on face U', () => {
  const wrongCentre = ['U', 'U', 'U', 'U', 'R', 'U', 'U', 'U', 'U'] as const;
  // @ts-expect-error the centre of U must be 'U'
  assertGrid({ U: wrongCentre, R: OWN_R, F: OWN_F, D: OWN_D, L: OWN_L, B: OWN_B });
});

it('types the centre of U as the literal U, and its other stickers as Face', () => {
  expectTypeOf<FaceGrid['U'][4]>().toEqualTypeOf<'U'>();
  expectTypeOf<FaceGrid['U'][0]>().toEqualTypeOf<Face>();
});
