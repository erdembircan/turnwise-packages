import { describe, expect, it } from 'vitest';
import { Faces } from './face';
import { Faces as FacesFromIndex } from './index';

describe('Faces', () => {
  it('has keys U, R, F, D, L, B in that order', () => {
    expect(Object.keys(Faces)).toEqual(['U', 'R', 'F', 'D', 'L', 'B']);
  });

  it('maps every key to itself', () => {
    for (const key of Object.keys(Faces) as (keyof typeof Faces)[]) {
      expect(Faces[key]).toBe(key);
    }
  });

  it('is the same object whether imported from ./index or ./face', () => {
    expect(FacesFromIndex).toBe(Faces);
  });
});
