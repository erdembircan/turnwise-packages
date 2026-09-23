import assert from 'node:assert/strict';

const importStarted = performance.now();
const api = await import('@turnwise/cube-scramble');
const importMs = performance.now() - importStarted;
const solver = await import('@turnwise/cube-solver');

const { Efforts, formatAlgorithm, prepare, scramble } = api;

// Importing must not build the solver's tables.
assert.ok(importMs < 100, `import took ${importMs.toFixed(1)} ms; it must not build the tables`);

// Exactly the documented exports, nothing internal.
assert.deepEqual(Object.keys(api).sort(), ['Efforts', 'formatAlgorithm', 'prepare', 'scramble']);

// One solver for the whole app: the re-exports are the solver's own bindings, so a second copy of
// the solver would show up here as different functions and objects.
assert.equal(prepare, solver.prepare);
assert.equal(formatAlgorithm, solver.formatAlgorithm);
assert.equal(Efforts, solver.Efforts);

const prepareStarted = performance.now();
prepare();
const prepareMs = performance.now() - prepareStarted;

// Default randomness: valid, never solved, never the same face twice in a row, different each call.
const moveValues = new Set(Object.values(solver.Moves));
const scrambleStarted = performance.now();
const first = scramble();
const scrambleMs = performance.now() - scrambleStarted;
const second = scramble();
for (const moves of [first, second]) {
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
assert.notDeepEqual(first, second, 'the default randomness gives a different scramble every call');

// A seeded generator repeats, on every machine: this is the README's example and its output.
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
assert.equal(
  formatAlgorithm(scramble({ random: seeded(42) })),
  "F2 U F2 U' F2 R2 D L2 B R D2 L U2 L2 B2 D' F' U L2 U",
);

const fast = scramble({ effort: Efforts.fast });
assert.ok(fast.length >= 2 && fast.every((move) => moveValues.has(move)));

// The documented errors, with their documented messages.
assert.throws(
  () => scramble({ random: () => 1 }),
  (error) =>
    error instanceof RangeError &&
    error.message ===
      'The random function returned 1. It must return a number from 0 up to, but not including, 1, like Math.random does.',
);
assert.throws(
  () => scramble({ effort: 'turbo' }),
  (error) => error instanceof TypeError && error.message === 'Unknown effort "turbo". Use "fast" or "full".',
);

console.log(
  `scramble e2e passed: import ${importMs.toFixed(1)} ms, prepare ${prepareMs.toFixed(0)} ms, ` +
    `scramble ${scrambleMs.toFixed(0)} ms, ${formatAlgorithm(first)}`,
);
