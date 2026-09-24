import { Efforts, Moves, cubeFromMoves, faceOf, facesFromCube } from '@turnwise/cube-solver';
import type { Effort, Move } from '@turnwise/cube-solver';
import { at, gridOf } from '@turnwise/internal';
import { describe, expect, it } from 'vitest';
import { blindfoldedScramble } from './blindfolded';
import { formatScramble } from './notation';
import type { WideMove } from './notation';
import { drawOrientation } from './orientation';
import { drawScrambleState } from './randomState';
import { scramble } from './scramble';
import { seededRandom } from './testing/rng';
import { turnedFaces } from './turnedFaces';

const isMove = (move: Move | WideMove): move is Move => Object.hasOwn(Moves, move);
const isWideMove = (move: Move | WideMove): move is WideMove => !isMove(move);

function axisOf(move: Move | WideMove): string {
  const face = move.charAt(0);
  if (face === 'U' || face === 'D') return 'UD';
  if (face === 'R' || face === 'L') return 'RL';
  return 'FB';
}

describe('blindfoldedScramble', () => {
  it('draws the position, then the orientation, from one random stream', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { moves } = blindfoldedScramble({ random: seededRandom(seed), effort: Efforts.fast });
      const random = seededRandom(seed);
      const drawn = drawScrambleState(random);
      const orientation = drawOrientation(random);
      const faceTurns = moves.filter(isMove);
      expect(moves.slice(faceTurns.length), `seed ${String(seed)}`).toEqual(orientation);
      expect(facesFromCube(cubeFromMoves(faceTurns)), `seed ${String(seed)}`).toEqual(
        gridOf(drawn),
      );
    }
  });

  it('returns the cube as held after the wide moves as its faces', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { faces } = blindfoldedScramble({ random: seededRandom(seed), effort: Efforts.fast });
      const random = seededRandom(seed);
      const drawn = drawScrambleState(random);
      expect(faces, `seed ${String(seed)}`).toEqual(turnedFaces(drawn, drawOrientation(random)));
    }
  });

  it('gives the same scramble for the same seed, and a different one for another seed', () => {
    const first = blindfoldedScramble({ random: seededRandom(7), effort: Efforts.fast });
    expect(blindfoldedScramble({ random: seededRandom(7), effort: Efforts.fast })).toEqual(first);
    expect(blindfoldedScramble({ random: seededRandom(8), effort: Efforts.fast })).not.toEqual(
      first,
    );
  });

  it('never ends its face turns on the axis of the first wide move', () => {
    let reworked = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const { moves } = blindfoldedScramble({ random: seededRandom(seed), effort: Efforts.fast });
      const faceTurns = moves.filter(isMove);
      const random = seededRandom(seed);
      const drawn = drawScrambleState(random);
      expect(facesFromCube(cubeFromMoves(faceTurns)), `seed ${String(seed)}`).toEqual(
        gridOf(drawn),
      );
      faceTurns.forEach((move, index) => {
        if (index > 0) {
          expect(faceOf(move), `seed ${String(seed)}`).not.toBe(faceOf(at(faceTurns, index - 1)));
        }
      });
      const firstWide = moves.find(isWideMove);
      if (firstWide === undefined) continue;
      expect(axisOf(at(faceTurns, faceTurns.length - 1)), `seed ${String(seed)}`).not.toBe(
        axisOf(firstWide),
      );
      const plain = scramble({ random: seededRandom(seed), effort: Efforts.fast }).moves;
      if (JSON.stringify(faceTurns) !== JSON.stringify(plain)) reworked += 1;
    }
    expect(reworked, 'some seeds must need a new last turn').toBeGreaterThan(0);
  });

  it('uses full effort when none is given', () => {
    expect(blindfoldedScramble({ random: seededRandom(3) })).toEqual(
      blindfoldedScramble({ random: seededRandom(3), effort: Efforts.full }),
    );
  });

  it("rejects an unknown effort with the solver's TypeError", () => {
    const effort = 'turbo' as unknown as Effort;
    expect(() => blindfoldedScramble({ random: seededRandom(1), effort })).toThrow(TypeError);
  });
});

describe('drawOrientation', () => {
  it('gives each of the 24 pairs of draws its own wide moves, in the official order', () => {
    const drawn: string[] = [];
    for (let top = 0; top < 6; top++) {
      for (let front = 0; front < 4; front++) {
        const values = [(top + 0.5) / 6, (front + 0.5) / 4];
        drawn.push(formatScramble(drawOrientation(() => values.shift() ?? 0)));
      }
    }
    expect(drawn).toEqual([
      '',
      'Uw',
      'Uw2',
      "Uw'",
      'Rw',
      'Rw Uw',
      'Rw Uw2',
      "Rw Uw'",
      'Rw2',
      'Rw2 Uw',
      'Rw2 Uw2',
      "Rw2 Uw'",
      "Rw'",
      "Rw' Uw",
      "Rw' Uw2",
      "Rw' Uw'",
      'Fw',
      'Fw Uw',
      'Fw Uw2',
      "Fw Uw'",
      "Fw'",
      "Fw' Uw",
      "Fw' Uw2",
      "Fw' Uw'",
    ]);
  });

  it('rejects a random function that breaks its contract', () => {
    expect(() => drawOrientation(() => 1)).toThrow(RangeError);
  });
});
