import { Efforts, Moves, cubeFromMoves, solve } from '@turnwise/cube-solver';
import { describe, expect, it } from 'vitest';

describe('@turnwise/cube-solver in the workspace', () => {
  it('can be imported and used by tests without being built first', () => {
    expect(solve(cubeFromMoves([Moves.R]), { effort: Efforts.fast })).toEqual([Moves.R_PRIME]);
  });
});
