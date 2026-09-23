import { at } from '@turnwise/internal';

// The Web Crypto API is a global in every browser and in Node 19 and later. This package compiles
// without the DOM or Node type libraries, so it declares the one method it uses.
declare const crypto: { getRandomValues(array: Uint32Array): Uint32Array };

const TWO_POW_26 = 67108864;
const TWO_POW_53 = 9007199254740992;

/**
 * A number from 0 up to, but not including, 1, drawn from the platform's cryptographically secure
 * generator. It carries 53 random bits, as many as a double holds, so every value in that range is
 * reachable and none is more likely than another.
 */
export function secureRandom(): number {
  const words = crypto.getRandomValues(new Uint32Array(2));
  return ((at(words, 0) >>> 5) * TWO_POW_26 + (at(words, 1) >>> 6)) / TWO_POW_53;
}
