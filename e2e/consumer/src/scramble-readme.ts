// Every example in the cube-scramble README, in order, compiled against the published types. If the
// README changes, change this file with it.
import { Efforts, formatAlgorithm, scramble } from '@turnwise/cube-scramble';
import type { Move } from '@turnwise/cube-scramble';

// Get a scramble
const moves: Move[] = scramble();
export const notation: string = formatAlgorithm(moves);

// What you get
export const quick: Move[] = scramble({ effort: Efforts.fast });

// Reproducible scrambles
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export const repeatable: string = formatAlgorithm(scramble({ random: seeded(42) }));
