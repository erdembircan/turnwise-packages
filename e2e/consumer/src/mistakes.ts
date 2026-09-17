// Each `@ts-expect-error` below is a promise the package makes: this mistake is caught by the
// compiler, in a consumer's project, with no code running. If a promise breaks, the directive
// becomes unused and compilation fails.
import { cubeFromFaces, cubeFromMoves, inverse, solve } from '@turnwise/cube-solver';
import type { Cube, FaceGrid, Move } from '@turnwise/cube-solver';

const row = ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'] as const;
const side = <Centre extends 'R' | 'F' | 'D' | 'L' | 'B'>(centre: Centre) =>
  [centre, centre, centre, centre, centre, centre, centre, centre, centre] as const;

export const valid: FaceGrid = {
  U: row,
  R: side('R'),
  F: side('F'),
  D: side('D'),
  L: side('L'),
  B: side('B'),
};

// @ts-expect-error a face is missing
export const missingFace: FaceGrid = { U: row, R: side('R'), F: side('F'), D: side('D'), L: side('L') };

export const eightStickers: FaceGrid = {
  ...valid,
  // @ts-expect-error a face with eight stickers
  U: ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'],
};

export const unknownLetter: FaceGrid = {
  ...valid,
  // @ts-expect-error 'X' is not a face
  U: ['X', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'],
};

export const wrongCentre: FaceGrid = {
  ...valid,
  // @ts-expect-error the centre of U must be 'U'
  U: ['U', 'U', 'U', 'U', 'R', 'U', 'U', 'U', 'U'],
};

// @ts-expect-error 'R3' is not a move
export const notAMove: Move = 'R3';

// @ts-expect-error traditional notation is output only
export const apostrophe: Move = "R'";

// @ts-expect-error a misspelt move inside a list
cubeFromMoves(['R', 'U', 'R_PRIM']);

// @ts-expect-error strings go through parseFaceletString
cubeFromFaces('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');

// @ts-expect-error a Cube cannot be written by hand
export const handMade: Cube = {};

// @ts-expect-error solve takes a Cube, not a grid
solve(valid);

// @ts-expect-error unknown effort
solve(cubeFromMoves([]), { effort: 'turbo' });

// @ts-expect-error inverse takes moves
inverse('R3');
