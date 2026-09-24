// Every example in the cube-scramble README, in order, compiled against the published types. If the
// README changes, change this file with it.
import { Efforts, blindfoldedScramble, formatScramble, scramble } from '@turnwise/cube-scramble';
import type { Face, FaceGrid, FaceStickers, Move, WideMove } from '@turnwise/cube-scramble';

// Get a scramble
const { moves, faces } = scramble();
export const notation: string = formatScramble(moves);
export const top: FaceGrid['U'] = faces.U;
export const plainMoves: Move[] = moves;

// Blindfolded scrambles
const blindfolded = blindfoldedScramble();
export const blindfoldedNotation: string = formatScramble(blindfolded.moves);
export const topCentre: Face = blindfolded.faces.U[4];
export const frontCentre: Face = blindfolded.faces.F[4];
export const blindfoldedTop: FaceStickers = blindfolded.faces.U;
export const blindfoldedMoves: (Move | WideMove)[] = blindfolded.moves;

// What you get
export const quick: Move[] = scramble({ effort: Efforts.fast }).moves;

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

export const repeatable: string = formatScramble(scramble({ random: seeded(42) }).moves);
