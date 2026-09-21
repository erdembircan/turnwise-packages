import { Faces as FacesFromInternal } from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import { Faces } from './index';

describe('Faces', () => {
  it('is the object the shared source defines, re-exported unchanged', () => {
    expect(Faces).toBe(FacesFromInternal);
  });
});
