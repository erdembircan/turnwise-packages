// Each `@ts-expect-error` below is a promise cube-scramble makes: this mistake is caught by the
// compiler, in a consumer's project, with no code running. If a promise breaks, the directive
// becomes unused and compilation fails.
import { Efforts, blindfoldedScramble, formatScramble, scramble } from '@turnwise/cube-scramble';
import type { FaceGrid, Move, Scramble, ScrambleOptions, WideMove } from '@turnwise/cube-scramble';

// @ts-expect-error unknown effort
scramble({ effort: 'turbo' });

// @ts-expect-error random is a function, not a seed
scramble({ random: 42 });

// @ts-expect-error there is no seed option; pass a seeded random function
scramble({ seed: 42 });

// @ts-expect-error leave an option out for its default (with exactOptionalPropertyTypes)
scramble({ effort: undefined });

// @ts-expect-error a scramble is its moves and its faces, not a list of moves
export const justMoves: Move[] = scramble();

// @ts-expect-error formatScramble takes the moves, not the whole scramble
formatScramble(scramble());

export function overwrite(options: ScrambleOptions, drawn: Scramble): void {
  // @ts-expect-error options are read-only
  options.effort = Efforts.fast;
  // @ts-expect-error a scramble's faces are read-only
  drawn.faces = drawn.faces;
}

// @ts-expect-error blindfoldedScramble takes the same options, with the same checks
blindfoldedScramble({ effort: 'turbo' });

// @ts-expect-error a blindfolded scramble can end in wide moves, so its moves are not a Move[]
export const faceTurnsOnly: Move[] = blindfoldedScramble().moves;

// @ts-expect-error a blindfolded scramble turns the cube, so its faces are not a FaceGrid
export const pinnedCentres: FaceGrid = blindfoldedScramble().faces;

// @ts-expect-error 'Fw2' is not one of the wide moves a scramble uses
export const notWide: WideMove = 'Fw2';

// @ts-expect-error formatScramble takes moves, not notation
formatScramble(["R'"]);
