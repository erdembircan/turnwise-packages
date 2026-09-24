import { SOLVED, gridOf } from '@turnwise/internal';
import type { Face } from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import type { WideMove } from './notation';
import { drawScrambleState } from './randomState';
import { seededRandom } from './testing/rng';
import { turnedFaces } from './turnedFaces';

// Top and front centres after each ending, as confirmed on a real cube.
const CENTRES: readonly (readonly [readonly WideMove[], Face, Face])[] = [
  [[], 'U', 'F'],
  [['Uw'], 'U', 'R'],
  [['Uw2'], 'U', 'B'],
  [['Uw_PRIME'], 'U', 'L'],
  [['Rw'], 'F', 'D'],
  [['Rw', 'Uw'], 'F', 'R'],
  [['Rw', 'Uw2'], 'F', 'U'],
  [['Rw', 'Uw_PRIME'], 'F', 'L'],
  [['Rw2'], 'D', 'B'],
  [['Rw2', 'Uw'], 'D', 'R'],
  [['Rw2', 'Uw2'], 'D', 'F'],
  [['Rw2', 'Uw_PRIME'], 'D', 'L'],
  [['Rw_PRIME'], 'B', 'U'],
  [['Rw_PRIME', 'Uw'], 'B', 'R'],
  [['Rw_PRIME', 'Uw2'], 'B', 'D'],
  [['Rw_PRIME', 'Uw_PRIME'], 'B', 'L'],
  [['Fw'], 'L', 'F'],
  [['Fw', 'Uw'], 'L', 'U'],
  [['Fw', 'Uw2'], 'L', 'B'],
  [['Fw', 'Uw_PRIME'], 'L', 'D'],
  [['Fw_PRIME'], 'R', 'F'],
  [['Fw_PRIME', 'Uw'], 'R', 'D'],
  [['Fw_PRIME', 'Uw2'], 'R', 'B'],
  [['Fw_PRIME', 'Uw_PRIME'], 'R', 'U'],
];

const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

describe('turnedFaces', () => {
  it('is the plain grid when there are no wide moves', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const state = drawScrambleState(seededRandom(seed));
      expect(turnedFaces(state, [])).toEqual(gridOf(state));
    }
  });

  it('turns the right two layers up for Rw', () => {
    expect(turnedFaces(SOLVED, ['Rw']).U).toEqual(['U', 'F', 'F', 'U', 'F', 'F', 'U', 'F', 'F']);
  });

  it('turns the front two layers towards R for Fw', () => {
    expect(turnedFaces(SOLVED, ['Fw']).U).toEqual(['U', 'U', 'U', 'L', 'L', 'L', 'L', 'L', 'L']);
  });

  it('turns the top two layers towards L for Uw', () => {
    expect(turnedFaces(SOLVED, ['Uw']).F).toEqual(['R', 'R', 'R', 'R', 'R', 'R', 'F', 'F', 'F']);
  });

  it('ends each of the 24 orientations with the centres confirmed on a real cube', () => {
    const states = [SOLVED, drawScrambleState(seededRandom(5))];
    for (const state of states) {
      for (const [orientation, top, front] of CENTRES) {
        const faces = turnedFaces(state, orientation);
        expect([faces.U[4], faces.F[4]], orientation.join(' ')).toEqual([top, front]);
      }
    }
  });

  it('keeps nine stickers of every face', () => {
    const state = drawScrambleState(seededRandom(9));
    for (const [orientation] of CENTRES) {
      const stickers = FACES.flatMap((face) => turnedFaces(state, orientation)[face]);
      for (const face of FACES) {
        expect(
          stickers.filter((sticker) => sticker === face),
          orientation.join(' '),
        ).toHaveLength(9);
      }
    }
  });

  it('comes back to the plain grid when a wide move is undone', () => {
    const state = drawScrambleState(seededRandom(12));
    const undone: readonly (readonly WideMove[])[] = [
      ['Rw', 'Rw_PRIME'],
      ['Fw', 'Fw_PRIME'],
      ['Uw', 'Uw_PRIME'],
      ['Rw2', 'Rw2'],
      ['Uw2', 'Uw2'],
    ];
    for (const orientation of undone) {
      expect(turnedFaces(state, orientation), orientation.join(' ')).toEqual(gridOf(state));
    }
  });
});
