import { Moves, SOLVED, at, effectOf, isOddPermutation } from '@turnwise/internal';
import type { CubieState } from '@turnwise/internal';

/**
 * A whole number from 0 to `count - 1`, each equally likely, drawn with `random`. Every draw goes
 * through here, so this is where a random function that breaks its contract is caught.
 */
function pick(random: () => number, count: number): number {
  const value = random();
  if (typeof value !== 'number' || !(value >= 0 && value < 1)) {
    throw new RangeError(
      `The random function returned ${String(value)}. It must return a number from 0 up to, but not including, 1, like Math.random does.`,
    );
  }
  return Math.floor(value * count);
}

/** The numbers 0 to `size - 1` in an order drawn uniformly (Fisher–Yates). */
function shuffled(random: () => number, size: number): number[] {
  const order = Array.from({ length: size }, (_, index) => index);
  for (let index = size - 1; index > 0; index--) {
    const other = pick(random, index + 1);
    const held = at(order, index);
    order[index] = at(order, other);
    order[other] = held;
  }
  return order;
}

/** `count` twists or flips drawn uniformly, the last one chosen so their sum is a multiple of `modulus`. */
function orientations(random: () => number, count: number, modulus: number): number[] {
  const drawn = Array.from({ length: count - 1 }, () => pick(random, modulus));
  const total = drawn.reduce((sum, value) => sum + value, 0);
  return [...drawn, (modulus - (total % modulus)) % modulus];
}

/**
 * A cube drawn uniformly from every legal state. Corners and edges are shuffled independently; when
 * their parities disagree, the first two edges trade places. That swap pairs each unreachable
 * arrangement with exactly one reachable one, so every legal arrangement stays equally likely.
 */
export function randomState(random: () => number): CubieState {
  const cp = shuffled(random, 8);
  const ep = shuffled(random, 12);
  if (isOddPermutation(cp) !== isOddPermutation(ep)) {
    const first = at(ep, 0);
    ep[0] = at(ep, 1);
    ep[1] = first;
  }
  return { cp, co: orientations(random, 8, 3), ep, eo: orientations(random, 12, 2) };
}

function sameState(a: CubieState, b: CubieState): boolean {
  const same = (x: readonly number[], y: readonly number[]): boolean =>
    x.every((value, index) => value === y[index]);
  return same(a.cp, b.cp) && same(a.co, b.co) && same(a.ep, b.ep) && same(a.eo, b.eo);
}

/** Whether `state` is solved, or one move away from solved. */
export function isWithinOneMove(state: CubieState): boolean {
  return (
    sameState(state, SOLVED) ||
    Object.values(Moves).some((move) => sameState(state, effectOf(move)))
  );
}

/**
 * The state a scramble leads to: uniform over every legal state that needs at least two moves to
 * solve, as WCA Regulation 4b3 requires. A draw that lands closer is thrown away and drawn again;
 * that happens about once in two quintillion draws.
 */
export function drawScrambleState(random: () => number): CubieState {
  let state = randomState(random);
  while (isWithinOneMove(state)) state = randomState(random);
  return state;
}
