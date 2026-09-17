import { describe, expect, it } from 'vitest';
import { cubeFromMoves } from './cube';
import { FaceletStringError, InvalidCubeError } from './errors';
import { parseFaceletString } from './faceletString';
import { cubeFromFaces } from './fromFaces';
import { facesFromCube } from './grid';
import type { FaceGrid } from './grid';
import { randomMoves, solvedGrid } from './testing/grids';

const SOLVED_STRING = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

function catchError(fn: () => unknown): unknown {
  try {
    fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

function gridToFaceletString(grid: FaceGrid): string {
  return (['U', 'R', 'F', 'D', 'L', 'B'] as const).map((face) => grid[face].join('')).join('');
}

describe('parseFaceletString', () => {
  it('parses the solved facelet string into the solved grid', () => {
    expect(parseFaceletString(SOLVED_STRING)).toEqual(solvedGrid());
  });

  it('round-trips through facesFromCube and back, for 100 seeds', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const sequence = randomMoves(seed);
      const grid = facesFromCube(cubeFromMoves(sequence));
      const text = gridToFaceletString(grid);
      const parsed = parseFaceletString(text);
      expect(parsed, `seed ${String(seed)}`).toEqual(grid);
      cubeFromFaces(parsed);
    }
  });

  it('accepts the published example facelet string', () => {
    const text = 'DUUBULDBFRBFRRULLLBRDFFFBLURDBFDFDRFRULBLUFDURRBLBDUDL';
    const grid = parseFaceletString(text);
    expect(() => cubeFromFaces(grid)).not.toThrow();
  });

  it('rejects a string that is not 54 characters', () => {
    const error = catchError(() => parseFaceletString('UUU'));
    expect(error).toBeInstanceOf(FaceletStringError);
    if (error instanceof FaceletStringError) {
      expect(error.name).toBe('FaceletStringError');
      expect(error.index).toBeUndefined();
      expect(error.message).toBe(
        'A facelet string has exactly 54 characters, one per sticker. This one has 3.',
      );
    }
  });

  it('rejects a character that is not a face letter', () => {
    const text = SOLVED_STRING.slice(0, 17) + 'X' + SOLVED_STRING.slice(18);
    const error = catchError(() => parseFaceletString(text));
    expect(error).toBeInstanceOf(FaceletStringError);
    if (error instanceof FaceletStringError) {
      expect(error.index).toBe(17);
      expect(error.message).toBe(
        'The character at index 17 of the facelet string is "X". Only the face letters U, R, F, D, L and B are allowed. That character is sticker 8 of face R.',
      );
    }
  });

  it('rejects a lowercase letter, and reports its index correctly', () => {
    const text = 'u' + SOLVED_STRING.slice(1);
    const error = catchError(() => parseFaceletString(text));
    expect(error).toBeInstanceOf(FaceletStringError);
    if (error instanceof FaceletStringError) {
      expect(error.index).toBe(0);
    }
  });

  it('rejects a centre that does not carry its own face letter', () => {
    const text = SOLVED_STRING.slice(9, 18) + SOLVED_STRING.slice(0, 9) + SOLVED_STRING.slice(18);
    const error = catchError(() => parseFaceletString(text));
    expect(error).toBeInstanceOf(FaceletStringError);
    if (error instanceof FaceletStringError) {
      expect(error.index).toBe(4);
      expect(error.message).toBe(
        'The centre of face U, at index 4 of the facelet string, is "R". A centre always carries its own face\'s letter, so this string either lists its faces in another order than U, R, F, D, L, B, or describes a cube held in another orientation.',
      );
    }
  });

  it('does not extend InvalidCubeError', () => {
    const error = new FaceletStringError('placeholder message for this check only');
    expect(error).not.toBeInstanceOf(InvalidCubeError);
  });

  it('rejects a non-string input', () => {
    const bad = 42 as unknown as string;
    const error = catchError(() => parseFaceletString(bad));
    expect(error).toBeInstanceOf(TypeError);
    if (error instanceof TypeError) {
      expect(error.message).toBe('Expected a facelet string, but received number.');
    }
  });
});
