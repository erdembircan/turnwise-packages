// Both packages are ESM only. Node 22.12 and later can still load them with require().
const solver = require('@turnwise/cube-solver');
const scrambler = require('@turnwise/cube-scramble');

const solution = solver.solve(solver.cubeFromMoves(['R']));
if (solution.length !== 1 || solution[0] !== 'R_PRIME') {
  throw new Error(`unexpected solution: ${JSON.stringify(solution)}`);
}
console.log('require() works for the solver:', solution.join(' '));

if (scrambler.prepare !== solver.prepare) {
  throw new Error('require() loaded a second copy of the solver');
}
const moves = scrambler.scramble({ effort: scrambler.Efforts.fast });
if (moves.length < 2) {
  throw new Error(`unexpected scramble: ${JSON.stringify(moves)}`);
}
console.log('require() works for the scrambler:', scrambler.formatAlgorithm(moves));
