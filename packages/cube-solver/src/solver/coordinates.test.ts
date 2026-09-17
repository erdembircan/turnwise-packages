import { describe, expect, it } from 'vitest';
import {
  flipOf,
  rankOf,
  setFlip,
  setRank,
  setSlice,
  setTwist,
  sliceOf,
  twistOf,
} from './coordinates';

function sum(values: Uint8Array): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

describe('twist coordinate', () => {
  it('round-trips all 2187 values through setTwist and twistOf, each summing to a multiple of 3', () => {
    for (let twist = 0; twist < 2187; twist++) {
      const co = new Uint8Array(8);
      setTwist(co, twist);
      expect(twistOf(co), `twist ${String(twist)}`).toBe(twist);
      expect(sum(co) % 3, `twist ${String(twist)}`).toBe(0);
    }
  });
});

describe('flip coordinate', () => {
  it('round-trips all 2048 values through setFlip and flipOf, each summing to an even number', () => {
    for (let flip = 0; flip < 2048; flip++) {
      const eo = new Uint8Array(12);
      setFlip(eo, flip);
      expect(flipOf(eo), `flip ${String(flip)}`).toBe(flip);
      expect(sum(eo) % 2, `flip ${String(flip)}`).toBe(0);
    }
  });
});

describe('slice coordinate', () => {
  it('round-trips all 495 values through setSlice and sliceOf, each holding exactly four slice edges', () => {
    for (let slice = 0; slice < 495; slice++) {
      const ep = new Uint8Array(12);
      setSlice(ep, slice);
      expect(sliceOf(ep), `slice ${String(slice)}`).toBe(slice);
      const sliceEdgeCount = ep.reduce((count, value) => count + (value >= 8 ? 1 : 0), 0);
      expect(sliceEdgeCount, `slice ${String(slice)}`).toBe(4);
    }
  });

  it('is 0 for the identity arrangement', () => {
    expect(sliceOf(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))).toBe(0);
  });
});

describe('rank of a permutation of 0..7', () => {
  it('round-trips all 40320 ranks through setRank and rankOf, each a permutation of 0..7', () => {
    for (let rank = 0; rank < 40320; rank++) {
      const values = new Uint8Array(8);
      setRank(values, 0, 8, 0, rank);
      expect(rankOf(values, 0, 8), `rank ${String(rank)}`).toBe(rank);
      expect(
        [...values].sort((a, b) => a - b),
        `rank ${String(rank)}`,
      ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it('is the identity for rank 0', () => {
    const values = new Uint8Array(8);
    setRank(values, 0, 8, 0, 0);
    expect([...values]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('rank of a permutation of 8..11', () => {
  it('round-trips all 24 ranks through setRank and rankOf, each a permutation of 8..11', () => {
    for (let rank = 0; rank < 24; rank++) {
      const values = new Uint8Array(12);
      setRank(values, 8, 4, 8, rank);
      expect(rankOf(values, 8, 4), `rank ${String(rank)}`).toBe(rank);
      expect(
        [...values.slice(8, 12)].sort((a, b) => a - b),
        `rank ${String(rank)}`,
      ).toEqual([8, 9, 10, 11]);
    }
  });
});
