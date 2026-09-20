# @turnwise/cube-solver documentation

Everything the package exports, what each export does, what it throws, and the ideas you need to use it. This file ships inside the package, at `node_modules/@turnwise/cube-solver/docs/documentation.md`, so it always matches the version you have installed.

Every `ts` example on this page is compiled against the published types on every change, so the examples cannot drift from the code.

- [Concepts](#concepts)
- [Making a cube](#making-a-cube): [`cubeFromFaces`](#cubefromfaces), [`cubeFromMoves`](#cubefrommoves), [`parseFaceletString`](#parsefaceletstring)
- [Solving](#solving): [`solve`](#solve), [`prepare`](#prepare), [`SolveOptions`](#solveoptions), [`Effort`](#effort), [`Efforts`](#efforts)
- [Working with a cube](#working-with-a-cube): [`applyMoves`](#applymoves), [`isSolved`](#issolved), [`facesFromCube`](#facesfromcube)
- [Working with moves](#working-with-moves): [`inverse`](#inverse), [`faceOf`](#faceof), [`turnsOf`](#turnsof), [`formatAlgorithm`](#formatalgorithm)
- [Values and types](#values-and-types): [`Face`](#face), [`Faces`](#faces), [`Move`](#move), [`Moves`](#moves), [`Cube`](#cube), [`FaceGrid`](#facegrid), [`FaceStickers`](#facestickers), [`StickerLocation`](#stickerlocation), [`CornerPosition`](#cornerposition), [`EdgePosition`](#edgeposition), [`ObservedPiece`](#observedpiece)
- [Errors](#errors): [`InvalidCubeError`](#invalidcubeerror), [`StickerCountError`](#stickercounterror), [`UnknownPieceError`](#unknownpieceerror), [`DuplicatePieceError`](#duplicatepieceerror), [`CornerTwistError`](#cornertwisterror), [`EdgeFlipError`](#edgefliperror), [`ParityError`](#parityerror), [`FaceletStringError`](#faceletstringerror)
- [Performance and threading](#performance-and-threading)

## Concepts

### Three layers of checking

The package checks your input in three places, and each has its own kind of failure.

| Layer | What it checks | How it fails |
| --- | --- | --- |
| The compiler | The shape of the input: six faces, nine stickers each, only face letters, every centre on its own face, only real moves. | A compile error in your editor. Nothing runs. |
| A runtime shape guard | The same things, for callers the compiler never saw: plain JavaScript, or data cast from `JSON.parse`. | A `TypeError`. |
| Cube validation | Whether well-shaped stickers form a cube that can exist and be solved. | A subclass of [`InvalidCubeError`](#invalidcubeerror). |

Once you hold a [`Cube`](#cube), all three have passed. Nothing that takes a `Cube` can reject it.

### Holding the cube

Hold the cube with one face up and one face towards you, and keep it that way. The six faces are then named by where they are:

| Letter | Face |
| --- | --- |
| `U` | up |
| `R` | right |
| `F` | front, towards you |
| `D` | down |
| `L` | left |
| `B` | back |

Centres never move, so the centre of a face tells you which face it is. The package never deals in colours. If your input has colours, the face a sticker belongs to is the face whose centre has the same colour.

### Reading a face

A face is nine stickers, read row by row, left to right, while you look straight at that face:

```
0 1 2
3 4 5
6 7 8
```

Position 4 is the centre. Which way is "up" while you look at a face:

| Face you are reading | What is at the top of the grid |
| --- | --- |
| `U` | the `B` face |
| `D` | the `F` face |
| `R`, `F`, `L`, `B` | the `U` face |

Unfolded, with each face in the orientation it is read in:

```
        ┌───────┐
        │ U U U │
        │ U U U │
        │ U U U │
┌───────┼───────┼───────┬───────┐
│ L L L │ F F F │ R R R │ B B B │
│ L L L │ F F F │ R R R │ B B B │
│ L L L │ F F F │ R R R │ B B B │
└───────┼───────┼───────┴───────┘
        │ D D D │
        │ D D D │
        │ D D D │
        └───────┘
```

A sticker's value is the name of the face it belongs to: one of the six values in [`Faces`](#faces). On a solved cube every sticker of `U` is `Faces.U`. After the single move `Moves.U`, the top row of `F` reads `Faces.R`, `Faces.R`, `Faces.R`: a clockwise turn of the top layer, seen from above, carries the right face's stickers round to the front.

### Moves

A move turns one face. Its name is the face letter followed by:

| Suffix | Turn | Traditional notation |
| --- | --- | --- |
| none, as in `R` | a quarter turn clockwise | `R` |
| `2`, as in `R2` | a half turn | `R2` |
| `_PRIME`, as in `R_PRIME` | a quarter turn counter-clockwise | `R'` |

Clockwise means clockwise as seen looking straight at that face. This is standard cube notation (the notation of the World Cube Association) for all six faces.

There are exactly eighteen moves. There are no slice moves, wide moves or whole-cube rotations. Traditional notation with an apostrophe is produced by [`formatAlgorithm`](#formatalgorithm) for display, and is never read back.

## Making a cube

There are three ways to make a [`Cube`](#cube). All three give the same kind of value, and a cube made one way is indistinguishable from the same cube made another way.

### `cubeFromFaces`

```ts signature
function cubeFromFaces(faces: FaceGrid): Cube;
```

The cube that shows the stickers in `faces`. See [Reading a face](#reading-a-face) for how to fill in a [`FaceGrid`](#facegrid).

```ts
import { Faces, cubeFromFaces } from '@turnwise/cube-solver';

const { U, R, F, D, L, B } = Faces;

const cube = cubeFromFaces({
  U: [D, U, B, F, U, D, U, U, R],
  R: [D, L, R, F, R, F, L, D, R],
  F: [F, F, F, B, F, L, R, L, U],
  D: [U, U, B, B, D, R, D, U, U],
  L: [B, D, L, B, L, D, F, R, B],
  B: [D, B, L, R, B, L, F, R, L],
});
```

The compiler rejects a grid of the wrong shape:

```ts
import { Faces } from '@turnwise/cube-solver';
import type { FaceGrid, FaceStickers } from '@turnwise/cube-solver';

const { U, R } = Faces;
declare const rest: Omit<FaceGrid, 'U'>;

// @ts-expect-error a face has nine stickers, not eight
const eight: FaceStickers<'U'> = [U, U, U, U, U, U, U, U];

// @ts-expect-error the centre of U must be U
const centre: FaceStickers<'U'> = [U, U, U, U, R, U, U, U, U];

// @ts-expect-error 'X' is not a face
const letter: FaceStickers<'U'> = ['X', U, U, U, U, U, U, U, U];

// @ts-expect-error the U face is missing
const missing: FaceGrid = { ...rest };
```

**Throws**, in this order, so you always hear about the most basic problem first:

1. `TypeError`, when the value is not shaped like a `FaceGrid` at all. Only reachable by bypassing the compiler.
2. [`StickerCountError`](#stickercounterror)
3. For the eight corners: [`UnknownPieceError`](#unknownpieceerror), then [`DuplicatePieceError`](#duplicatepieceerror)
4. For the twelve edges: the same two checks
5. [`CornerTwistError`](#cornertwisterror)
6. [`EdgeFlipError`](#edgefliperror)
7. [`ParityError`](#parityerror)

Everything from item 2 on extends [`InvalidCubeError`](#invalidcubeerror). Only the first problem found is thrown.

Validation is cheap: it takes microseconds and needs none of the solver's lookup tables, so it is safe on a browser's main thread.

### `cubeFromMoves`

```ts signature
function cubeFromMoves(moves: readonly Move[]): Cube;
```

The cube reached by applying `moves`, in order, to a solved cube. An empty list gives the solved cube, which is how you get one.

```ts
import { Moves, cubeFromMoves, isSolved } from '@turnwise/cube-solver';

const scrambled = cubeFromMoves([
  Moves.F,
  Moves.R2,
  Moves.U_PRIME,
  Moves.B,
  Moves.L2,
  Moves.D,
  Moves.F2,
  Moves.R_PRIME,
  Moves.U2,
  Moves.L,
]);
const solved = cubeFromMoves([]);

isSolved(solved); // true
```

Every list of moves leads to a legal cube, so this never rejects a typed input. The compiler rejects anything that is not a move:

```ts
import { Moves, cubeFromMoves } from '@turnwise/cube-solver';

// @ts-expect-error there is no Moves.R_PRIM
cubeFromMoves([Moves.R, Moves.U, Moves.R_PRIM]);
```

**Throws** `TypeError` for an unknown move, which is only reachable by bypassing the compiler.

### `parseFaceletString`

```ts signature
function parseFaceletString(input: string): FaceGrid;
```

Reads the 54-character facelet string that many cube programs exchange: nine stickers per face, the faces in the order `U`, `R`, `F`, `D`, `L`, `B`, each face read as in [Reading a face](#reading-a-face). The character at index `i` is sticker `i % 9` of face number `Math.floor(i / 9)` in that order.

This is the only function in the package that takes a string, and it turns the string into the same typed [`FaceGrid`](#facegrid) as everywhere else. It checks the format only. Pass the result to [`cubeFromFaces`](#cubefromfaces) to check the cube.

```ts
import { cubeFromFaces, parseFaceletString } from '@turnwise/cube-solver';

const faces = parseFaceletString('DUUBULDBFRBFRRULLLBRDFFFBLURDBFDFDRFRULBLUFDURRBLBDUDL');
const cube = cubeFromFaces(faces);
```

To write one, join the faces of a grid in the same order:

```ts
import { Faces, Moves, cubeFromMoves, facesFromCube } from '@turnwise/cube-solver';
import type { Face } from '@turnwise/cube-solver';

const order: readonly Face[] = Object.values(Faces);
const grid = facesFromCube(cubeFromMoves([Moves.R, Moves.U]));
const text = order.map((face) => grid[face].join('')).join('');
```

**Throws** [`FaceletStringError`](#faceletstringerror) when the string is not 54 characters, contains a character other than the six face letters (lowercase letters count as wrong), or has a centre that is not its own face's letter. Throws `TypeError` when `input` is not a string.

## Solving

### `solve`

```ts signature
function solve(cube: Cube, options?: SolveOptions): Move[];
```

A short sequence of moves that solves `cube`, found with Kociemba's two-phase algorithm. A solved cube gives an empty list.

```ts
import {
  Moves,
  applyMoves,
  cubeFromMoves,
  formatAlgorithm,
  isSolved,
  solve,
} from '@turnwise/cube-solver';

const cube = cubeFromMoves([
  Moves.F,
  Moves.R2,
  Moves.U_PRIME,
  Moves.B,
  Moves.L2,
  Moves.D,
  Moves.F2,
  Moves.R_PRIME,
  Moves.U2,
  Moves.L,
]);

const solution = solve(cube);
// [Moves.L_PRIME, Moves.U2, Moves.R, Moves.F2, Moves.D_PRIME, Moves.L2, Moves.B_PRIME, Moves.U, Moves.R2, Moves.F_PRIME]

formatAlgorithm(solution); // "L' U2 R F2 D' L2 B' U R2 F'"
isSolved(applyMoves(cube, solution)); // true
```

What you can rely on:

- **It always succeeds.** Every `Cube` is legal, so `solve` never rejects its input and never fails to find a solution.
- **It is repeatable.** Work is counted in positions examined, not in time, so the same cube and the same effort give the same solution on every machine.
- **No solution turns the same face twice in a row.**
- **The result is near-optimal, not optimal.** No cube needs more than 20 moves; this method usually finds 19 to 22. See [`Effort`](#effort) for the two efforts.
- **It is synchronous** and keeps its thread busy while it works. See [Performance and threading](#performance-and-threading).

The first call builds the solver's lookup tables, unless [`prepare`](#prepare) already has.

**Throws** `TypeError` when `cube` is not a `Cube` made by this package, or `options.effort` is not a known effort. Both are only reachable by bypassing the compiler. It never throws for a real `Cube`.

```ts
import { Moves, cubeFromMoves, facesFromCube, solve } from '@turnwise/cube-solver';

const cube = cubeFromMoves([Moves.R]);

// @ts-expect-error solve takes a Cube, not its stickers: pass them through cubeFromFaces
solve(facesFromCube(cube));
```

### `prepare`

```ts signature
function prepare(): void;
```

Builds the solver's lookup tables, if they are not built yet: about 0.3 seconds and 6 MB, once per thread. Calling it again does nothing.

Importing the package builds nothing. Without `prepare`, the first [`solve`](#solve) pays for the tables. Call `prepare` to pay at a moment of your choosing, such as the start of a worker.

Only `solve` and `prepare` use the tables. Everything else in the package is instant.

```ts
import { prepare } from '@turnwise/cube-solver';

prepare();
```

### `SolveOptions`

```ts signature
interface SolveOptions {
  readonly effort?: Effort;
}
```

The options of [`solve`](#solve). There is one: how hard to look. Leave it out for [`Efforts.full`](#efforts).

```ts
import { Efforts, Moves, cubeFromMoves, solve } from '@turnwise/cube-solver';

const cube = cubeFromMoves([Moves.R, Moves.U, Moves.F2]);

const quick = solve(cube, { effort: Efforts.fast });
const short = solve(cube, { effort: Efforts.full }); // the same as solve(cube)
```

### `Effort`

```ts signature
type Effort = 'fast' | 'full';
```

How hard [`solve`](#solve) looks for a short solution.

| Effort | Time per cube | A scrambled cube | A cube a few moves from solved |
| --- | --- | --- | --- |
| `Efforts.full`, the default | about 0.1 s | about 20 moves | solved in that few moves |
| `Efforts.fast` | a few milliseconds | about 23 moves, 24 at most in practice | may get a longer answer than it needs |

Both efforts always succeed and are repeatable. `full` keeps improving on its first solution for a fixed amount of work; `fast` stops almost at once.

### `Efforts`

An object with one constant per [`Effort`](#effort), each holding its own name: `Efforts.fast === 'fast'`, with the type `'fast'`. It follows the same pattern as [`Faces`](#faces) and [`Moves`](#moves).

```ts
import { Efforts, Moves, cubeFromMoves, solve } from '@turnwise/cube-solver';

const cube = cubeFromMoves([Moves.R]);

// @ts-expect-error there are two efforts, and no Efforts.turbo
solve(cube, { effort: Efforts.turbo });

// @ts-expect-error the string is rejected as well
solve(cube, { effort: 'turbo' });
```

## Working with a cube

A [`Cube`](#cube) never changes. Functions that turn it return a new one.

### `applyMoves`

```ts signature
function applyMoves(cube: Cube, moves: readonly Move[]): Cube;
```

The cube reached by applying `moves`, in order, to `cube`. `cube` itself is left as it was.

```ts
import { Moves, applyMoves, cubeFromMoves } from '@turnwise/cube-solver';

const start = cubeFromMoves([Moves.R, Moves.U]);
const next = applyMoves(start, [Moves.R_PRIME]);
// start still describes R U; next describes R U R'
```

**Throws** `TypeError` when `cube` is not a `Cube` made by this package, or for an unknown move.

### `isSolved`

```ts signature
function isSolved(cube: Cube): boolean;
```

Whether every sticker of `cube` is on its own face.

**Throws** `TypeError` when `cube` is not a `Cube` made by this package.

### `facesFromCube`

```ts signature
function facesFromCube(cube: Cube): FaceGrid;
```

The stickers of `cube`, as a new [`FaceGrid`](#facegrid). Use it to draw a cube, to compare two cubes, or to send a cube somewhere a `Cube` cannot go, such as a worker or a file.

```ts
import { Faces, Moves, cubeFromFaces, cubeFromMoves, facesFromCube } from '@turnwise/cube-solver';

const grid = facesFromCube(cubeFromMoves([Moves.U]));
grid[Faces.F][0]; // Faces.R
grid[Faces.U][4]; // Faces.U, always

const same = cubeFromFaces(grid); // the round trip gives an equal cube
```

**Throws** `TypeError` when `cube` is not a `Cube` made by this package.

## Working with moves

### `inverse`

```ts signature
function inverse(move: Move): Move;
function inverse(moves: readonly Move[]): Move[];
```

For one move: the move that undoes it. A half turn undoes itself.

For a list: the sequence that undoes the whole list, which is every move inverted, in reverse order. It returns a new array and leaves the input as it was. The inverse of a solution is a scramble that produces the cube it solves.

```ts
import { Moves, inverse } from '@turnwise/cube-solver';

inverse(Moves.R); // Moves.R_PRIME
inverse(Moves.F2); // Moves.F2
inverse([Moves.R, Moves.U2, Moves.F_PRIME]); // [Moves.F, Moves.U2, Moves.R_PRIME]
```

**Throws** `TypeError` for an unknown move.

### `faceOf`

```ts signature
function faceOf(move: Move): Face;
```

The face a move turns.

### `turnsOf`

```ts signature
function turnsOf(move: Move): 1 | 2 | 3;
```

How far a move turns its face, in clockwise quarter turns: `1` for a quarter turn, `2` for a half turn, `3` for a counter-clockwise quarter turn.

```ts
import { Moves, faceOf, turnsOf } from '@turnwise/cube-solver';

faceOf(Moves.R_PRIME); // Faces.R
turnsOf(Moves.R_PRIME); // 3

// For an animation, a counter-clockwise turn is better shown as one quarter turn backwards
// than as three forwards.
const quarterTurns = turnsOf(Moves.R_PRIME) === 3 ? -1 : turnsOf(Moves.R_PRIME);
```

Both throw `TypeError` for an unknown move.

### `formatAlgorithm`

```ts signature
function formatAlgorithm(moves: readonly Move[]): string;
```

The moves in traditional cube notation, separated by spaces. An empty list gives an empty string. This is for showing to people; nothing in the package reads it back.

```ts
import { Moves, formatAlgorithm } from '@turnwise/cube-solver';

formatAlgorithm([Moves.R, Moves.U_PRIME, Moves.F2]); // "R U' F2"
```

**Throws** `TypeError` for an unknown move.

## Values and types

`Faces`, `Moves` and [`Efforts`](#efforts) hold every face, move and effort as constants, and they are the recommended way to write one: your editor completes `Moves.` into the eighteen real moves, and a typo cannot hide inside a string.

The constants are plain strings, `Moves.R_PRIME === 'R_PRIME'`, which is why a sticker grid and a solution survive `JSON.stringify`, `postMessage` and a database unchanged. `Face` and `Move` are the unions of those strings, so a string literal is accepted wherever a constant is, and data read back from storage needs no conversion.

### `Face`

```ts signature
type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
```

One of the six faces. Also the value of a sticker: see [Holding the cube](#holding-the-cube).

### `Faces`

```ts signature
const Faces: { readonly U: 'U'; readonly R: 'R'; readonly F: 'F'; readonly D: 'D'; readonly L: 'L'; readonly B: 'B' };
```

```ts
import { Faces } from '@turnwise/cube-solver';
import type { Face } from '@turnwise/cube-solver';

const { U, R, F, D, B } = Faces;
const top = [D, U, B, F, U, D, U, U, R] as const; // destructured, a face reads like a sticker chart

const all: Face[] = Object.values(Faces); // every face, in the order U, R, F, D, L, B
```

### `Move`

```ts signature
type Move =
  | 'U' | 'U2' | 'U_PRIME'
  | 'R' | 'R2' | 'R_PRIME'
  | 'F' | 'F2' | 'F_PRIME'
  | 'D' | 'D2' | 'D_PRIME'
  | 'L' | 'L2' | 'L_PRIME'
  | 'B' | 'B2' | 'B_PRIME';
```

One of the eighteen moves: see [Moves](#moves).

```ts
import { Moves } from '@turnwise/cube-solver';
import type { Move } from '@turnwise/cube-solver';

const fine: Move = Moves.R_PRIME;

// @ts-expect-error there is no such move
const three: Move = 'R3';

// @ts-expect-error and there is no such constant
const alsoThree: Move = Moves.R3;

// @ts-expect-error traditional notation is output only
const apostrophe: Move = "R'";
```

### `Moves`

An object with one constant per [`Move`](#move), each holding its own name: `Moves.R_PRIME === 'R_PRIME'`, with the type `'R_PRIME'`.

```ts
import { Moves, cubeFromMoves } from '@turnwise/cube-solver';
import type { Move } from '@turnwise/cube-solver';

cubeFromMoves([Moves.R, Moves.U, Moves.R_PRIME, Moves.U_PRIME]);

const all: Move[] = Object.values(Moves); // all eighteen, for a move picker or a random scramble
```

### `Cube`

A 3×3 cube in a legal, solvable state.

A `Cube` is opaque. It has no readable properties and cannot be written by hand; only [`cubeFromFaces`](#cubefromfaces), [`cubeFromMoves`](#cubefrommoves) and [`applyMoves`](#applymoves) create one. That is what lets every function that takes a `Cube` skip validation and never fail.

A `Cube` never changes, and it is tied to the thread and the copy of the package that made it. It does **not** survive `JSON.stringify`, `structuredClone` or `postMessage`: what arrives is an empty object, and passing it to the package throws a `TypeError`. To store or send a cube, use its [`FaceGrid`](#facegrid) from [`facesFromCube`](#facesfromcube), or the moves that produced it, and rebuild it on the other side.

```ts
import type { Cube } from '@turnwise/cube-solver';

// @ts-expect-error a Cube cannot be written by hand
const cube: Cube = {};
```

### `FaceGrid`

```ts signature
type FaceGrid = { readonly [F in Face]: FaceStickers<F> };
```

All 54 stickers of a cube: one [`FaceStickers`](#facestickers) per face. A `FaceGrid` is plain data, so it survives JSON and `postMessage`. Data that arrives that way is no longer checked by the compiler; [`cubeFromFaces`](#cubefromfaces) checks its shape again at runtime.

### `FaceStickers`

```ts signature
type FaceStickers<Centre extends Face = Face> =
  readonly [Face, Face, Face, Face, Centre, Face, Face, Face, Face];
```

The nine stickers of one face, in the order given in [Reading a face](#reading-a-face). The centre's type is pinned to the face itself, which is how a wrong centre becomes a compile error.

### `StickerLocation`

```ts signature
interface StickerLocation {
  readonly face: Face;
  readonly index: number; // 0..8
}
```

One sticker's place in a [`FaceGrid`](#facegrid): `grid[location.face][location.index]`.

### `CornerPosition`

```ts signature
type CornerPosition = 'URF' | 'UFL' | 'ULB' | 'UBR' | 'DFR' | 'DLF' | 'DBL' | 'DRB';
```

One of the eight corner positions, named by the three faces it touches. The same names identify the corner pieces, by the position each occupies on a solved cube.

| Position | Its stickers, in order |
| --- | --- |
| `URF` | `U[8]`, `R[0]`, `F[2]` |
| `UFL` | `U[6]`, `F[0]`, `L[2]` |
| `ULB` | `U[0]`, `L[0]`, `B[2]` |
| `UBR` | `U[2]`, `B[0]`, `R[2]` |
| `DFR` | `D[2]`, `F[8]`, `R[6]` |
| `DLF` | `D[0]`, `L[8]`, `F[6]` |
| `DBL` | `D[6]`, `B[8]`, `L[6]` |
| `DRB` | `D[8]`, `R[8]`, `B[6]` |

### `EdgePosition`

```ts signature
type EdgePosition = 'UR' | 'UF' | 'UL' | 'UB' | 'DR' | 'DF' | 'DL' | 'DB' | 'FR' | 'FL' | 'BL' | 'BR';
```

One of the twelve edge positions, named by the two faces it touches. The same names identify the edge pieces.

| Position | Its stickers, in order | Position | Its stickers, in order |
| --- | --- | --- | --- |
| `UR` | `U[5]`, `R[1]` | `DL` | `D[3]`, `L[7]` |
| `UF` | `U[7]`, `F[1]` | `DB` | `D[7]`, `B[7]` |
| `UL` | `U[3]`, `L[1]` | `FR` | `F[5]`, `R[3]` |
| `UB` | `U[1]`, `B[1]` | `FL` | `F[3]`, `L[5]` |
| `DR` | `D[5]`, `R[7]` | `BL` | `B[5]`, `L[3]` |
| `DF` | `D[1]`, `F[7]` | `BR` | `B[3]`, `R[5]` |

### `ObservedPiece`

```ts signature
interface ObservedPiece {
  readonly position: CornerPosition | EdgePosition;
  readonly stickers: readonly Face[];
  readonly locations: readonly StickerLocation[];
}
```

What [`cubeFromFaces`](#cubefromfaces) found at one position: the position, the stickers it read there, and where in the grid it read them. `stickers[i]` is the sticker at `locations[i]`, in the order of the tables above. Errors carry these so an interface can highlight the stickers in question without parsing a message.

## Errors

```
Error
├─ InvalidCubeError        (abstract: catch it, never thrown itself)
│  ├─ StickerCountError
│  ├─ UnknownPieceError
│  ├─ DuplicatePieceError
│  ├─ CornerTwistError
│  ├─ EdgeFlipError
│  └─ ParityError
├─ FaceletStringError
└─ TypeError               (built in: the caller bypassed the compiler)
```

Every error class sets `name` to its class name as a string, so the name survives a minifier. Every message is written to be shown to a person: it says what is wrong, where, and what to check. The error classes are exported so you can test with `instanceof`; they are not meant to be constructed by your code.

```ts
import { InvalidCubeError, UnknownPieceError, cubeFromFaces } from '@turnwise/cube-solver';
import type { FaceGrid, StickerLocation } from '@turnwise/cube-solver';

declare const faces: FaceGrid;
declare function highlight(locations: readonly StickerLocation[]): void;
declare function show(message: string): void;

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

### `InvalidCubeError`

The stickers do not describe a cube that can exist or be solved. It is abstract: [`cubeFromFaces`](#cubefromfaces) always throws one of the six subclasses below, and this class exists so you can catch them all at once.

### `StickerCountError`

A face letter does not appear on exactly nine stickers.

| Field | Type | Meaning |
| --- | --- | --- |
| `counts` | `Readonly<Record<Face, number>>` | How many stickers carry each letter. |

> Every face letter must appear on exactly 9 stickers, but U appears 8 times and R appears 10 times. One sticker entered as R is probably U.

The closing hint appears only when exactly one letter is one over and one letter is one under.

### `UnknownPieceError`

A corner or edge position shows a combination of stickers that no real piece has: two stickers of the same face, stickers of opposite faces, or the letters of a real piece in mirror-image order.

| Field | Type | Meaning |
| --- | --- | --- |
| `pieces` | `readonly ObservedPiece[]` | Every position of that kind (all corners, or all edges) whose stickers match no piece. The message describes the first. |

> The corner at URF shows the stickers U, F, R (at U[8], R[0], F[2]), which are the letters of the piece URF in an order no turn can produce. Two of these stickers are probably swapped.

> The edge at UF shows the stickers U, D (at U[7], F[1]), and no edge piece has that combination. 1 more position has the same problem; the "pieces" property lists them all.

### `DuplicatePieceError`

Every position shows a real piece, but the same piece appears at more than one position.

| Field | Type | Meaning |
| --- | --- | --- |
| `pieces` | `readonly ObservedPiece[]` | Every position that holds a piece also found somewhere else. The message names the first duplicated piece. |

> The edge piece UR appears 2 times, at UR and UF. A cube has exactly one of each piece, so at least one of these positions was entered wrong.

### `CornerTwistError`

Every piece is present exactly once, but one corner is twisted in place, which no sequence of turns can undo. It has no fields: the stickers cannot say which corner it was.

> Every piece is present, but one corner is twisted in place, which no sequence of turns can undo. On a real cube, a corner has been rotated by hand. In typed input, the three stickers of one corner are entered in rotated order.

### `EdgeFlipError`

Every piece is present exactly once, but one edge is flipped in place. It has no fields.

> Every piece is present, but one edge is flipped in place, which no sequence of turns can undo. On a real cube, an edge has been put back the wrong way round. In typed input, the two stickers of one edge are entered swapped.

### `ParityError`

Every piece is present and correctly oriented, but two pieces have traded places. It has no fields.

> Every piece is present and correctly oriented, but two pieces have traded places, which no sequence of turns can undo. On a real cube, two pieces have been put back in each other's place. In typed input, the stickers of two pieces are entered at each other's positions.

### `FaceletStringError`

Thrown by [`parseFaceletString`](#parsefaceletstring). It does not extend `InvalidCubeError`: it is about the format of a string, not about a cube.

| Field | Type | Meaning |
| --- | --- | --- |
| `index` | `number \| undefined` | The index of the offending character. `undefined` when the problem is the length. |

> A facelet string has exactly 54 characters, one per sticker. This one has 53.

> The character at index 17 of the facelet string is "X". Only the face letters U, R, F, D, L and B are allowed. That character is sticker 8 of face R.

> The centre of face U, at index 4 of the facelet string, is "R". A centre always carries its own face's letter, so this string either lists its faces in another order than U, R, F, D, L, B, or describes a cube held in another orientation.

### The built-in `TypeError`, for callers who bypass the compiler

TypeScript callers cannot reach these. They exist for plain JavaScript and for data cast from an unchecked source.

| Thrown by | When | Message |
| --- | --- | --- |
| Anything that takes a move | The value is not one of the eighteen moves. | `Unknown move "R3". A move is one of the 18 values in Moves, such as "R", "R2" or "R_PRIME".` |
| Anything that takes a `Cube` | The value was not made by this package, or lost its identity in JSON, `structuredClone` or `postMessage`. | `Expected a Cube created by this package. A Cube cannot be written by hand, and does not survive JSON or postMessage.` |
| `cubeFromFaces` | The value is not shaped like a `FaceGrid`. | `Expected a FaceGrid: an object with the keys U, R, F, D, L and B, each holding an array of 9 face letters.` followed by the detail, such as `Face B is missing.`, `Face U has 8 stickers.`, `Sticker R[3] is "X".` or `The centre of face U is "R"; it must be "U".` |
| `parseFaceletString` | The value is not a string. | `Expected a facelet string, but received number.` |
| `solve` | `effort` is not a known effort. | `Unknown effort "turbo". Use "fast" or "full".` |

## Performance and threading

| | Cost |
| --- | --- |
| Importing the package | nothing: no tables are built, and unused exports can be tree-shaken away |
| The first `solve`, or `prepare()` | about 0.3 s and 6 MB, once per thread |
| `solve(cube)` | about 0.1 s |
| `solve(cube, { effort: Efforts.fast })` | a few milliseconds |
| Everything else, including validation | microseconds |

Times are for a current laptop. They scale with the machine, but the solutions do not: see [`solve`](#solve).

`solve` and `prepare` are synchronous. On a browser's main thread they freeze the page while they run, so run them in a worker. Everything else is safe anywhere.

The package contains no worker code, because how a worker is created depends on your bundler and runtime. A worker around it is a few lines:

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
import type { FaceGrid, Move } from '@turnwise/cube-solver';

declare const faces: FaceGrid;

const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });

cubeFromFaces(faces); // wrong stickers throw here, where the user interface can respond
worker.postMessage(faces);
worker.addEventListener('message', (event: MessageEvent<Move[]>) => {
  console.log(event.data); // the solution
});
```

Two things make this pattern work:

- **Send the `FaceGrid` or the moves, never the `Cube`.** A [`Cube`](#cube) does not survive `postMessage`. A `FaceGrid` and a `Move[]` are plain strings and arrays, and do.
- **Validate on both sides.** Checking the stickers on the main thread gives the user a named error at once; checking them again in the worker is what makes the `Cube` there. It costs microseconds.

Each thread that calls `solve` builds its own tables. In Node, the same pattern applies with `node:worker_threads`; a script, a command-line tool or a server job that can afford a tenth of a second per cube needs no worker at all.

[Turnwise](https://erdembircan.github.io/turnwise/) runs the package this way in the browser: a pool of workers, each building its tables before it accepts a request, and nothing but plain stickers crossing between them.

The package is ESM only. Node 22.12 and later can also load it with `require`.
