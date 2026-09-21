import { describe, expect, it } from 'vitest';
import { cubeFromMoves, stateOf } from './cube';
import { SOLVED } from './cubie';
import { Faces } from '@turnwise/internal';
import type { Face } from '@turnwise/internal';
import { cubeFromFaces } from './fromFaces';
import { facesFromCube, gridOf } from './grid';
import type { FaceGrid } from './grid';
import { Moves } from './move';
import type { Move } from './move';
import { randomMoves } from './testing/grids';
import { readOracle, solvedOracle, turnOracle } from './testing/oracle';

const MOVE_POOL: readonly Move[] = Object.values(Moves);
const ALL_FACES: readonly Face[] = Object.values(Faces);

function expectGridMatchesOracle(
  grid: FaceGrid,
  oracleGrid: Record<Face, Face[]>,
  context?: string,
): void {
  for (const face of ALL_FACES) {
    expect(grid[face], context).toEqual(oracleGrid[face]);
  }
}

function expectCentresCorrect(grid: FaceGrid): void {
  for (const face of ALL_FACES) {
    expect(grid[face][4]).toBe(face);
  }
}

describe('facesFromCube', () => {
  it('matches the oracle for a solved cube, with every face nine copies of its own letter', () => {
    const grid = facesFromCube(cubeFromMoves([]));
    const oracleGrid = readOracle(solvedOracle());
    expectGridMatchesOracle(grid, oracleGrid);
    expectCentresCorrect(grid);
    for (const face of ALL_FACES) {
      expect(grid[face]).toEqual([face, face, face, face, face, face, face, face, face]);
    }
  });

  it.each(MOVE_POOL)('matches the oracle after the single move %s', (move) => {
    const grid = facesFromCube(cubeFromMoves([move]));
    const oracleGrid = readOracle(turnOracle(solvedOracle(), [move]));
    expectGridMatchesOracle(grid, oracleGrid, move);
    expectCentresCorrect(grid);
  });

  it('matches the oracle for 300 seeded random sequences', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const sequence = randomMoves(seed);
      const grid = facesFromCube(cubeFromMoves(sequence));
      const oracleGrid = readOracle(turnOracle(solvedOracle(), sequence));
      expectGridMatchesOracle(grid, oracleGrid, `seed ${String(seed)}`);
      expectCentresCorrect(grid);
    }
  });

  it('after U: the front row moves to the right, right to back, back to left, left to front, and U/D are unchanged', () => {
    const solvedGrid = facesFromCube(cubeFromMoves([]));
    const grid = facesFromCube(cubeFromMoves(['U']));
    expect(grid.F.slice(0, 3)).toEqual(['R', 'R', 'R']);
    expect(grid.R.slice(0, 3)).toEqual(['B', 'B', 'B']);
    expect(grid.B.slice(0, 3)).toEqual(['L', 'L', 'L']);
    expect(grid.L.slice(0, 3)).toEqual(['F', 'F', 'F']);
    expect(grid.U).toEqual(solvedGrid.U);
    expect(grid.D).toEqual(solvedGrid.D);
  });

  it('after R: the right column of F becomes D, and the right column of U becomes F', () => {
    const grid = facesFromCube(cubeFromMoves(['R']));
    expect([grid.F[2], grid.F[5], grid.F[8]]).toEqual(['D', 'D', 'D']);
    expect([grid.U[2], grid.U[5], grid.U[8]]).toEqual(['F', 'F', 'F']);
  });
});

describe('gridOf', () => {
  it('draws the solved state as the solved cube', () => {
    expect(gridOf(SOLVED)).toEqual(facesFromCube(cubeFromMoves([])));
  });

  it('is undone exactly by cubeFromFaces for 300 seeded random sequences', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const state = stateOf(cubeFromMoves(randomMoves(seed)));
      expect(stateOf(cubeFromFaces(gridOf(state))), `seed ${String(seed)}`).toEqual(state);
    }
  });
});
