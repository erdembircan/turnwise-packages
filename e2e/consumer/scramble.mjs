import assert from 'node:assert/strict';

const importStarted = performance.now();
const api = await import('@turnwise/cube-scramble');
const importMs = performance.now() - importStarted;
const solver = await import('@turnwise/cube-solver');

const { Efforts, blindfoldedScramble, formatScramble, prepare, scramble } = api;

// Importing must not build the solver's tables.
assert.ok(importMs < 100, `import took ${importMs.toFixed(1)} ms; it must not build the tables`);

// Exactly the documented exports, nothing internal.
assert.deepEqual(Object.keys(api).sort(), [
  'Efforts',
  'blindfoldedScramble',
  'formatScramble',
  'prepare',
  'scramble',
]);

// One solver for the whole app: the re-exports are the solver's own bindings, so a second copy of
// the solver would show up here as different functions and objects.
assert.equal(prepare, solver.prepare);
assert.equal(Efforts, solver.Efforts);

const prepareStarted = performance.now();
prepare();
const prepareMs = performance.now() - prepareStarted;

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const moveValues = new Set(Object.values(solver.Moves));
const wideValues = new Set(['Rw', 'Rw2', 'Rw_PRIME', 'Fw', 'Fw_PRIME', 'Uw', 'Uw2', 'Uw_PRIME']);
const axisOf = (move) => ({ U: 'UD', D: 'UD', R: 'RL', L: 'RL', F: 'FB', B: 'FB' })[move[0]];

function checkFaceTurns(moves) {
  assert.ok(moves.length >= 2, 'a scramble is at least two moves long');
  assert.ok(
    moves.every((move) => moveValues.has(move)),
    'a scramble is made of Move values',
  );
  assert.ok(
    moves.every((move, index) => index === 0 || solver.faceOf(move) !== solver.faceOf(moves[index - 1])),
    'a scramble never turns the same face twice in a row',
  );
  assert.ok(!solver.isSolved(solver.cubeFromMoves(moves)), 'a scramble never ends solved');
}

function checkStickerCounts(faces) {
  assert.deepEqual(Object.keys(faces).sort(), [...FACES].sort());
  const stickers = FACES.flatMap((face) => faces[face]);
  for (const face of FACES) {
    assert.equal(stickers.filter((sticker) => sticker === face).length, 9, 'nine of each face');
  }
}

// Default randomness: valid, never solved, different each call, and faces is the cube reached.
const scrambleStarted = performance.now();
const first = scramble();
const scrambleMs = performance.now() - scrambleStarted;
const second = scramble();
for (const { moves, faces } of [first, second]) {
  checkFaceTurns(moves);
  checkStickerCounts(faces);
  assert.deepEqual(solver.facesFromCube(solver.cubeFromMoves(moves)), faces, 'faces is the cube reached');
  assert.ok(FACES.every((face) => faces[face][4] === face), 'centres stay put');
}
assert.notDeepEqual(first, second, 'the default randomness gives a different scramble every call');

// Blindfolded: face turns, then at most two wide moves, off the axis of the last face turn.
const blindfoldedStarted = performance.now();
const blindfolded = [blindfoldedScramble(), blindfoldedScramble()];
const blindfoldedMs = (performance.now() - blindfoldedStarted) / 2;
for (const { moves, faces } of blindfolded) {
  const faceTurns = moves.filter((move) => moveValues.has(move));
  const wideMoves = moves.slice(faceTurns.length);
  checkFaceTurns(faceTurns);
  checkStickerCounts(faces);
  assert.ok(wideMoves.length <= 2, 'at most two wide moves');
  assert.ok(
    wideMoves.every((move) => wideValues.has(move)),
    'the wide moves come last, and are WideMove values',
  );
  if (wideMoves.length > 0) {
    assert.notEqual(axisOf(faceTurns.at(-1)), axisOf(wideMoves[0]), 'no R Rw');
  } else {
    assert.deepEqual(solver.facesFromCube(solver.cubeFromMoves(faceTurns)), faces);
  }
}
assert.notDeepEqual(blindfolded[0], blindfolded[1]);

// A seeded generator repeats, on every machine: these are the documentation's examples and outputs.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
const fortyTwo = scramble({ random: seeded(42) });
assert.equal(formatScramble(fortyTwo.moves), "F2 U F2 U' F2 R2 D L2 B R D2 L U2 L2 B2 D' F' U L2 U");
assert.deepEqual(fortyTwo.faces.U, ['F', 'R', 'U', 'B', 'U', 'B', 'B', 'D', 'U']);
const one = blindfoldedScramble({ random: seeded(1) });
assert.equal(
  formatScramble(one.moves),
  "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'",
);
assert.deepEqual([one.faces.U[4], one.faces.F[4]], ['F', 'L'], 'Rw Uw\' ends green on top, orange in front');

// formatScramble writes face turns exactly as the solver does.
assert.equal(formatScramble(first.moves), solver.formatAlgorithm(first.moves));

checkFaceTurns(scramble({ effort: Efforts.fast }).moves);

// The documented errors, with their documented messages.
assert.throws(
  () => scramble({ random: () => 1 }),
  (error) =>
    error instanceof RangeError &&
    error.message ===
      'The random function returned 1. It must return a number from 0 up to, but not including, 1, like Math.random does.',
);
assert.throws(
  () => blindfoldedScramble({ effort: 'turbo' }),
  (error) => error instanceof TypeError && error.message === 'Unknown effort "turbo". Use "fast" or "full".',
);
assert.throws(
  () => formatScramble(['R3']),
  (error) =>
    error instanceof TypeError &&
    error.message ===
      'Unknown move "R3". A scramble is made of face turns such as "R", "R2" or "R_PRIME", and wide moves such as "Rw" or "Uw_PRIME".',
);

console.log(
  `scramble e2e passed: import ${importMs.toFixed(1)} ms, prepare ${prepareMs.toFixed(0)} ms, ` +
    `scramble ${scrambleMs.toFixed(0)} ms, blindfolded ${blindfoldedMs.toFixed(0)} ms, ` +
    `${formatScramble(blindfolded[0].moves)} (top ${blindfolded[0].faces.U[4]}, front ${blindfolded[0].faces.F[4]})`,
);
