// Every example in the package README, in order, compiled against the published types. If the
// README changes, change this file with it.
import {
  Efforts,
  Faces,
  InvalidCubeError,
  Moves,
  UnknownPieceError,
  applyMoves,
  cubeFromFaces,
  cubeFromMoves,
  formatAlgorithm,
  inverse,
  isSolved,
  parseFaceletString,
  prepare,
  solve,
} from '@turnwise/cube-solver';
import type { FaceGrid, Move, StickerLocation } from '@turnwise/cube-solver';

// Solve a cube from its stickers
const { U, R, F, D, L, B } = Faces;

const cube = cubeFromFaces({
  U: [D, U, B, F, U, D, U, U, R],
  R: [D, L, R, F, R, F, L, D, R],
  F: [F, F, F, B, F, L, R, L, U],
  D: [U, U, B, B, D, R, D, U, U],
  L: [B, D, L, B, L, D, F, R, B],
  B: [D, B, L, R, B, L, F, R, L],
});
const solution: Move[] = solve(cube);
export const notation: string = formatAlgorithm(solution);

// Solve a cube from the moves that scrambled it
const scrambled = cubeFromMoves([
  Moves.F,
  Moves.R2,
  Moves.U_PRIME,
  Moves.B,
  Moves.L2,
  Moves.D,
  Moves.F2,
  Moves.R_PRIME,
  Moves.U2,
  Moves.L,
]);
export const fromMoves: Move[] = solve(scrambled);
export const solved: boolean = isSolved(applyMoves(cube, solution));
export const scramble: Move[] = inverse(solution);

// Read a facelet string from another program
const faces: FaceGrid = parseFaceletString('DUUBULDBFRBFRRULLLBRDFFFBLURDBFDFDRFRULBLUFDURRBLBDUDL');
export const fromString: Move[] = solve(cubeFromFaces(faces));

// When the stickers are wrong
declare function highlight(locations: readonly StickerLocation[]): void;
declare function show(message: string): void;

try {
  cubeFromFaces(faces);
} catch (error) {
  if (error instanceof UnknownPieceError) {
    highlight(error.pieces.flatMap((piece) => piece.locations));
  } else if (error instanceof InvalidCubeError) {
    show(error.message);
  } else {
    throw error;
  }
}

// Speed, and where to run it
prepare();
export const quick: Move[] = solve(cube, { effort: Efforts.fast });
