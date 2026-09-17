import assert from 'node:assert/strict';

const importStarted = performance.now();
const api = await import('@turnwise/cube-solver');
const importMs = performance.now() - importStarted;

const {
  CornerTwistError,
  FaceletStringError,
  InvalidCubeError,
  applyMoves,
  cubeFromFaces,
  cubeFromMoves,
  facesFromCube,
  formatAlgorithm,
  inverse,
  isSolved,
  parseFaceletString,
  prepare,
  solve,
} = api;

// Importing must not build the tables. They take a few hundred milliseconds; an import that does
// no work takes a few.
assert.ok(importMs < 100, `import took ${importMs.toFixed(1)} ms; it must not build the tables`);

const prepareStarted = performance.now();
prepare();
const prepareMs = performance.now() - prepareStarted;
const againStarted = performance.now();
prepare();
const againMs = performance.now() - againStarted;
assert.ok(againMs < 5, 'a second prepare() must do nothing');

// The three ways in, all describing the same cube.
const scramble = ['F', 'R2', 'U_PRIME', 'B', 'L2', 'D', 'F2', 'R_PRIME', 'U2', 'L'];
const fromMoves = cubeFromMoves(scramble);
const grid = facesFromCube(fromMoves);
const fromFaces = cubeFromFaces(grid);
const text = ['U', 'R', 'F', 'D', 'L', 'B'].map((face) => grid[face].join('')).join('');
const fromString = cubeFromFaces(parseFaceletString(text));

const expected = ['L_PRIME', 'U2', 'R', 'F2', 'D_PRIME', 'L2', 'B_PRIME', 'U', 'R2', 'F_PRIME'];
for (const cube of [fromMoves, fromFaces, fromString]) {
  const solution = solve(cube);
  assert.deepEqual(solution, expected);
  assert.ok(isSolved(applyMoves(cube, solution)));
}
assert.equal(formatAlgorithm(expected), "L' U2 R F2 D' L2 B' U R2 F'");
assert.deepEqual(inverse(expected), scramble);

const fast = solve(fromMoves, { effort: 'fast' });
assert.ok(isSolved(applyMoves(fromMoves, fast)));
assert.ok(fast.length <= 24);

// Named errors survive packaging: classes, names, inheritance, messages.
const twisted = structuredClone(grid);
const solvedGrid = facesFromCube(cubeFromMoves([]));
const twistedSolved = structuredClone(solvedGrid);
[twistedSolved.U[8], twistedSolved.R[0], twistedSolved.F[2]] = ['F', 'U', 'R'];
assert.throws(
  () => cubeFromFaces(twistedSolved),
  (error) =>
    error instanceof CornerTwistError &&
    error instanceof InvalidCubeError &&
    error.name === 'CornerTwistError' &&
    error.message.startsWith('Every piece is present, but one corner is twisted in place'),
);
assert.throws(
  () => parseFaceletString('UUU'),
  (error) => error instanceof FaceletStringError && !(error instanceof InvalidCubeError),
);
assert.throws(() => solve(twisted), TypeError, 'a plain grid is not a Cube');
assert.throws(() => solve(structuredClone(fromMoves)), TypeError, 'a cloned Cube is not a Cube');

// Exactly the documented exports, nothing internal.
assert.deepEqual(Object.keys(api).sort(), [
  'CornerTwistError',
  'DuplicatePieceError',
  'EdgeFlipError',
  'FaceletStringError',
  'Faces',
  'InvalidCubeError',
  'Moves',
  'ParityError',
  'StickerCountError',
  'UnknownPieceError',
  'applyMoves',
  'cubeFromFaces',
  'cubeFromMoves',
  'faceOf',
  'facesFromCube',
  'formatAlgorithm',
  'inverse',
  'isSolved',
  'parseFaceletString',
  'prepare',
  'solve',
  'turnsOf',
]);

console.log(
  `consumer e2e passed: import ${importMs.toFixed(1)} ms, prepare ${prepareMs.toFixed(0)} ms, ` +
    `solution ${formatAlgorithm(expected)}`,
);
