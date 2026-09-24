import { Moves, formatAlgorithm } from '@turnwise/cube-solver';
import type { Move } from '@turnwise/cube-solver';
import { describe, expect, it } from 'vitest';
import { formatScramble } from './notation';
import type { WideMove } from './notation';

const UNKNOWN_MOVE =
  'A scramble is made of face turns such as "R", "R2" or "R_PRIME", and wide moves such as "Rw" or "Uw_PRIME".';

describe('formatScramble', () => {
  it("writes face turns exactly as the solver's formatAlgorithm does", () => {
    const moves = Object.values(Moves);
    expect(formatScramble(moves)).toBe(formatAlgorithm(moves));
  });

  it('writes every wide move in traditional notation', () => {
    const moves: WideMove[] = ['Rw', 'Rw2', 'Rw_PRIME', 'Fw', 'Fw_PRIME', 'Uw', 'Uw2', 'Uw_PRIME'];
    expect(formatScramble(moves)).toBe("Rw Rw2 Rw' Fw Fw' Uw Uw2 Uw'");
  });

  it('writes a scramble that ends in wide moves, in order', () => {
    const moves: (Move | WideMove)[] = ['R2', 'U_PRIME', 'F', 'Rw', 'Uw_PRIME'];
    expect(formatScramble(moves)).toBe("R2 U' F Rw Uw'");
  });

  it('writes nothing for no moves', () => {
    expect(formatScramble([])).toBe('');
  });

  it('rejects an unknown move with a TypeError that names it', () => {
    for (const unknown of ['R3', 'Fw2', "R'", 'toString', '']) {
      const moves = ['R', unknown] as unknown as Move[];
      expect(() => formatScramble(moves), unknown).toThrow(
        new TypeError(`Unknown move ${JSON.stringify(unknown)}. ${UNKNOWN_MOVE}`),
      );
    }
  });
});
