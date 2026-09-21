import {
  Moves as MovesFromInternal,
  faceOf,
  formatAlgorithm,
  inverse,
  turnsOf,
} from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import * as api from './index';

describe('Moves and move helpers', () => {
  it('are the bindings the shared source defines, re-exported unchanged', () => {
    expect(api.Moves).toBe(MovesFromInternal);
    expect(api.inverse).toBe(inverse);
    expect(api.faceOf).toBe(faceOf);
    expect(api.turnsOf).toBe(turnsOf);
    expect(api.formatAlgorithm).toBe(formatAlgorithm);
  });
});
