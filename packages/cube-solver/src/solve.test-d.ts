import { expectTypeOf, it } from 'vitest';
import { cubeFromMoves } from './cube';
import type { Cube } from './cube';
import { facesFromCube } from './grid';
import { inverse } from './move';
import type { Move } from './move';
import { prepare, solve } from './solve';
import type { SolveOptions } from './solve';

const cube: Cube = cubeFromMoves([]);

it('types solve as returning Move[], with an optional second parameter', () => {
  expectTypeOf(solve(cube)).toEqualTypeOf<Move[]>();
  expectTypeOf(solve).parameter(1).toEqualTypeOf<SolveOptions | undefined>();
});

it("types SolveOptions['effort']", () => {
  expectTypeOf<SolveOptions['effort']>().toEqualTypeOf<'fast' | 'full' | undefined>();
});

it('rejects an unknown effort', () => {
  // @ts-expect-error 'turbo' is not a valid effort.
  solve(cube, { effort: 'turbo' });
});

it('accepts only a Cube, not a string or a FaceGrid', () => {
  // @ts-expect-error A string is not a Cube.
  solve('U');
  // @ts-expect-error A FaceGrid is not a Cube.
  solve(facesFromCube(cube));
});

it('accepts a solution back as input to cubeFromMoves and inverse', () => {
  cubeFromMoves(solve(cube));
  inverse(solve(cube));
});

it('types prepare as returning void', () => {
  expectTypeOf(prepare).returns.toBeVoid();
});
