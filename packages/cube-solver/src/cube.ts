import { SOLVED, compose, effectOf, isSolvedState } from '@turnwise/internal';
import type { CubieState, Move } from '@turnwise/internal';

declare const cubeBrand: unique symbol;

/**
 * A 3×3 cube in a legal, solvable state.
 *
 * A `Cube` has no readable properties and cannot be written by hand: only this package creates
 * one, which is what guarantees that every `Cube` can be solved. Read its stickers with
 * `facesFromCube`. A `Cube` never changes; functions that turn it return a new one.
 *
 * A `Cube` does not survive `JSON.stringify` or `postMessage`. To move one between threads, send
 * its `FaceGrid` or the moves that produced it, and rebuild it on the other side.
 */
export interface Cube {
  readonly [cubeBrand]: true;
}

const states = new WeakMap<Cube, CubieState>();

export function makeCube(state: CubieState): Cube {
  const cube = Object.freeze({}) as Cube;
  states.set(cube, state);
  return cube;
}

// The type system already rules out anything but a Cube. This guards callers writing plain
// JavaScript, and cubes that lost their identity by being cloned or sent between threads.
export function stateOf(cube: Cube): CubieState {
  const state = states.get(cube);
  if (state === undefined) {
    throw new TypeError(
      'Expected a Cube created by this package. A Cube cannot be written by hand, and does not survive JSON or postMessage.',
    );
  }
  return state;
}

function turn(state: CubieState, moves: readonly Move[]): CubieState {
  return moves.reduce((current, move) => compose(current, effectOf(move)), state);
}

/**
 * The cube reached by applying `moves`, in order, to a solved cube. An empty list gives the solved
 * cube. Every list of moves is a legal cube, so this never rejects its input.
 */
export function cubeFromMoves(moves: readonly Move[]): Cube {
  return makeCube(turn(SOLVED, moves));
}

/** The cube reached by applying `moves`, in order, to `cube`. `cube` itself is left unchanged. */
export function applyMoves(cube: Cube, moves: readonly Move[]): Cube {
  return makeCube(turn(stateOf(cube), moves));
}

/** Whether every sticker of `cube` is on its own face. */
export function isSolved(cube: Cube): boolean {
  return isSolvedState(stateOf(cube));
}
