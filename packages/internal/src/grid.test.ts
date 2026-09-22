import { describe, expect, it } from 'vitest';
import { SOLVED } from './cubie';
import { Faces } from './face';
import { gridOf } from './grid';

describe('gridOf', () => {
  it('draws the solved state with every face showing nine of its own letter', () => {
    const grid = gridOf(SOLVED);
    for (const face of Object.values(Faces)) {
      expect(grid[face]).toEqual([face, face, face, face, face, face, face, face, face]);
    }
  });
});
