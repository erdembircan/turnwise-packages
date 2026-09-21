import { describe, expect, it } from 'vitest';
import { compose, effectOf, isSolvedState, SOLVED } from './cubie';
import type { CubieState } from './cubie';
import { Moves, inverse, turnsOf } from './move';
import type { Move } from './move';

const ALL_MOVES: readonly Move[] = Object.values(Moves);
const QUARTER_TURNS: readonly Move[] = ALL_MOVES.filter((move) => turnsOf(move) === 1);
const HALF_TURNS: readonly Move[] = ALL_MOVES.filter((move) => turnsOf(move) === 2);

function cloneState(state: CubieState): CubieState {
  return {
    cp: [...state.cp],
    co: [...state.co],
    ep: [...state.ep],
    eo: [...state.eo],
  };
}

function deepFreeze(state: CubieState): CubieState {
  Object.freeze(state.cp);
  Object.freeze(state.co);
  Object.freeze(state.ep);
  Object.freeze(state.eo);
  return Object.freeze(state);
}

describe('effectOf', () => {
  it('gives a solved state when a quarter turn is composed onto itself four times', () => {
    for (const move of QUARTER_TURNS) {
      let state = SOLVED;
      for (let turn = 0; turn < 4; turn++) state = compose(state, effectOf(move));
      expect(isSolvedState(state)).toBe(true);
    }
  });

  it('gives a solved state when a half turn is composed onto itself twice', () => {
    for (const move of HALF_TURNS) {
      let state = SOLVED;
      for (let turn = 0; turn < 2; turn++) state = compose(state, effectOf(move));
      expect(isSolvedState(state)).toBe(true);
    }
  });

  it('returns the identical object on a second call', () => {
    for (const move of ALL_MOVES) {
      expect(effectOf(move)).toBe(effectOf(move));
    }
  });

  it('composed with the effect of its inverse gives a solved state, for every move', () => {
    for (const move of ALL_MOVES) {
      const composed = compose(effectOf(move), effectOf(inverse(move)));
      expect(isSolvedState(composed)).toBe(true);
    }
  });
});

describe('compose', () => {
  it('does not mutate its arguments', () => {
    const state = deepFreeze(cloneState(SOLVED));
    const effect = deepFreeze(cloneState(effectOf('R')));
    expect(() => compose(state, effect)).not.toThrow();
    expect(state).toEqual(SOLVED);
    expect(effect).toEqual(effectOf('R'));
  });
});

describe('isSolvedState', () => {
  it('is true for SOLVED', () => {
    expect(isSolvedState(SOLVED)).toBe(true);
  });

  it('is false after any single move', () => {
    for (const move of ALL_MOVES) {
      expect(isSolvedState(compose(SOLVED, effectOf(move)))).toBe(false);
    }
  });
});
