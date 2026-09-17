# @turnwise/cube-solver

Solves a 3×3 Rubik's Cube with Kociemba's two-phase algorithm. Written in TypeScript, with no dependencies, for browsers, workers, Node, Deno and Bun.

The idea that shapes the whole API: **describe the cube in types, and let the compiler catch the mistakes it can.** A missing face, a face with eight stickers, a misspelt move or a centre on the wrong face is an error in your editor, before anything runs. What only running code can know, such as a corner twisted in place, comes back as a named error that says what is wrong and where.

```bash
pnpm add @turnwise/cube-solver
```

## Solve a cube from its stickers

Name every sticker by the face it belongs to, which is the face whose centre has the same colour. That keeps the input independent of any colour scheme.

```ts
import { cubeFromFaces, formatAlgorithm, solve } from '@turnwise/cube-solver';

const cube = cubeFromFaces({
  U: ['D', 'U', 'B', 'F', 'U', 'D', 'U', 'U', 'R'],
  R: ['D', 'L', 'R', 'F', 'R', 'F', 'L', 'D', 'R'],
  F: ['F', 'F', 'F', 'B', 'F', 'L', 'R', 'L', 'U'],
  D: ['U', 'U', 'B', 'B', 'D', 'R', 'D', 'U', 'U'],
  L: ['B', 'D', 'L', 'B', 'L', 'D', 'F', 'R', 'B'],
  B: ['D', 'B', 'L', 'R', 'B', 'L', 'F', 'R', 'L'],
});

const solution = solve(cube);
// ['L_PRIME', 'U2', 'R', 'F2', 'D_PRIME', 'L2', 'B_PRIME', 'U', 'R2', 'F_PRIME']

formatAlgorithm(solution);
// "L' U2 R F2 D' L2 B' U R2 F'"
```

Each face is nine stickers, read row by row while looking straight at that face:

```
0 1 2
3 4 5      4 is the centre. It never moves, so its type is fixed:
6 7 8      the centre of U must be 'U', or the code does not compile.
```

Hold the cube with U on top and F towards you. Read U with B at the top, D with F at the top, and R, F, L and B with U at the top.

`Faces.U` is the same value as `'U'`, if you prefer a lookup to a literal:

```ts
import { Faces } from '@turnwise/cube-solver';

const { U, R, F, D, L, B } = Faces;
const top = [D, U, B, F, U, D, U, U, R] as const;
```

## Solve a cube from the moves that scrambled it

```ts
import { cubeFromMoves, solve } from '@turnwise/cube-solver';

const cube = cubeFromMoves(['F', 'R2', 'U_PRIME', 'B', 'L2', 'D', 'F2', 'R_PRIME', 'U2', 'L']);
const solution = solve(cube);
```

There are exactly eighteen moves, and `Move` is the union of their names: a face letter, then nothing for a clockwise quarter turn, `2` for a half turn, or `_PRIME` for a counter-clockwise quarter turn. Clockwise means clockwise as seen looking straight at the face, as in standard cube notation. `'R3'`, `'X'` and `"R'"` do not compile. `Moves.R_PRIME` is the same value as `'R_PRIME'`.

A solution is an array of the same `Move` values, so it can go straight back in:

```ts
import { applyMoves, inverse, isSolved } from '@turnwise/cube-solver';

isSolved(applyMoves(cube, solution)); // true
inverse(solution); // a scramble that produces this cube
```

## Read a facelet string from another program

Many cube programs exchange a cube as 54 letters: nine per face, faces in the order U, R, F, D, L, B. Strings enter this package through one door, and come out as the same typed grid as above:

```ts
import { cubeFromFaces, parseFaceletString, solve } from '@turnwise/cube-solver';

const faces = parseFaceletString('DUUBULDBFRBFRRULLLBRDFFFBLURDBFDFDRFRULBLUFDURRBLBDUDL');
const solution = solve(cubeFromFaces(faces));
```

## When the stickers are wrong

`cubeFromFaces` throws a subclass of `InvalidCubeError`. Catch the base class to handle them all, or one subclass to handle one cause. They are checked in this order, so you always hear about the most basic problem first.

| Error | Meaning | Data |
| --- | --- | --- |
| `StickerCountError` | A face letter is not on exactly nine stickers. | `counts` per letter |
| `UnknownPieceError` | A corner or edge shows stickers no real piece has. | `pieces`, with sticker locations |
| `DuplicatePieceError` | The same piece appears in two places. | `pieces`, with sticker locations |
| `CornerTwistError` | One corner is twisted in place. | |
| `EdgeFlipError` | One edge is flipped in place. | |
| `ParityError` | Two pieces have traded places. | |

The messages are written to be shown to a person:

```
The corner at URF shows the stickers U, F, R (at U[8], R[0], F[2]), which are the
letters of the piece URF in an order no turn can produce. Two of these stickers are
probably swapped.
```

```ts
import { cubeFromFaces, InvalidCubeError, UnknownPieceError } from '@turnwise/cube-solver';

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
```

`parseFaceletString` throws `FaceletStringError`, with the `index` of the offending character. Code that gets past the compiler, such as plain JavaScript or unchecked JSON, gets a `TypeError`.

Once you hold a `Cube`, it is legal. `solve` never rejects one and never fails to solve one.

## Speed, and where to run it

| | Time | Result |
| --- | --- | --- |
| Importing the package | nothing | |
| First `solve`, or `prepare()` | about 0.3 s, once | builds 6 MB of lookup tables |
| `solve(cube)` | about 0.1 s | about 20 moves |
| `solve(cube, { effort: 'fast' })` | a few milliseconds | about 23 moves |

With the default effort, a cube that is only a few moves from solved comes back in that few moves. With `'fast'` it may get a longer answer than it needs.

Work is counted in positions examined, not in time, so the same cube and effort always give the same solution.

`solve` is synchronous and keeps its thread busy. In a browser, run it in a worker, and call `prepare()` there first so the tables are ready before the first request:

```ts
// solver.worker.ts
import { cubeFromFaces, prepare, solve } from '@turnwise/cube-solver';
import type { FaceGrid } from '@turnwise/cube-solver';

prepare();

addEventListener('message', (event: MessageEvent<FaceGrid>) => {
  postMessage(solve(cubeFromFaces(event.data)));
});
```

```ts
// main thread
import { cubeFromFaces } from '@turnwise/cube-solver';

const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });

cubeFromFaces(faces); // wrong stickers throw here, where the user interface can respond
worker.postMessage(faces);
worker.addEventListener('message', (event) => {
  console.log(event.data); // the solution
});
```

Send the `FaceGrid` (or the moves) to the worker, not the `Cube`. A `Cube` is deliberately opaque and does not survive `postMessage` or `JSON.stringify`; `facesFromCube(cube)` turns one back into a grid. Checking the stickers twice costs microseconds.

## Everything it exports

| | |
| --- | --- |
| Make a cube | `cubeFromFaces`, `cubeFromMoves`, `parseFaceletString` |
| Solve | `solve`, `prepare` |
| Work with a cube | `applyMoves`, `isSolved`, `facesFromCube` |
| Work with moves | `inverse`, `faceOf`, `turnsOf`, `formatAlgorithm` |
| Values | `Faces`, `Moves` |
| Types | `Cube`, `Face`, `Move`, `FaceGrid`, `FaceStickers`, `SolveOptions`, `ObservedPiece`, `StickerLocation`, `CornerPosition`, `EdgePosition` |
| Errors | `InvalidCubeError`, `StickerCountError`, `UnknownPieceError`, `DuplicatePieceError`, `CornerTwistError`, `EdgeFlipError`, `ParityError`, `FaceletStringError` |

Every export carries its documentation into your editor.

The package is ESM only. Node 22.12 and later can also load it with `require`.

## License

[Apache-2.0](LICENSE) © Erdem Bircan
