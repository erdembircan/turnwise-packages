// The package is ESM only. Node 22.12 and later can still load it with require().
const { cubeFromMoves, solve } = require('@turnwise/cube-solver');

const solution = solve(cubeFromMoves(['R']));
if (solution.length !== 1 || solution[0] !== 'R_PRIME') {
  throw new Error(`unexpected solution: ${JSON.stringify(solution)}`);
}
console.log('require() works:', solution.join(' '));
