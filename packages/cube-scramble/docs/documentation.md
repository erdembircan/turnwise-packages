# @turnwise/cube-scramble documentation

Everything the package exports, what each export does, what it throws, and the ideas you need to use it. This file ships inside the package, at `node_modules/@turnwise/cube-scramble/docs/documentation.md`, so it always matches the version you have installed.

Every `ts` example on this page is compiled against the published types on every change, so the examples cannot drift from the code.

- [Concepts](#concepts)
- [Scrambling](#scrambling): [`scramble`](#scramble), [`blindfoldedScramble`](#blindfoldedscramble), [`ScrambleOptions`](#scrambleoptions), [`Scramble`](#scramble-1), [`BlindfoldedScramble`](#blindfoldedscramble-1)
- [Moves](#moves): [`formatScramble`](#formatscramble), [`Move`](#move), [`WideMove`](#widemove)
- [The cube](#the-cube): [`FaceGrid`](#facegrid), [`FaceStickers`](#facestickers), [`Face`](#face)
- [Setup](#setup): [`prepare`](#prepare), [`Efforts`](#efforts), [`Effort`](#effort)
- [Errors](#errors)
- [Performance and threading](#performance-and-threading)

## Concepts

### What a scramble is

A scramble is a list of moves that takes a solved cube to a random position, and the cube it leaves. Whoever applies it starts from a solved cube and turns the faces in order.

Moves name faces, not colours. Hold the cube with one face up and one face towards you and keep it that way: that is the U face and the F face. WCA Regulation 4d1 has competitors hold a standard cube with white on top and green in front, so on such a cube U is white and F is green.

Each move is one of the eighteen [`Move`](#move) values: a face letter, then nothing for a clockwise quarter turn, `2` for a half turn, or `_PRIME` for a counter-clockwise quarter turn. Clockwise means clockwise as seen looking straight at that face. A blindfolded scramble can also end with up to two [`WideMove`](#widemove) values, which turn a face together with the middle layer next to it.

The cube a scramble leaves comes as `faces`: all 54 stickers, face by face, each named by the face it belonged to on the solved cube. On a standard cube `'U'` is white, `'F'` green, `'R'` red, `'L'` orange, `'D'` yellow and `'B'` blue. Compare it with a scan to check that a scramble was applied correctly.

### The rules it follows

The WCA Regulations say what a fair scramble is, and this package follows them:

- **Regulation 4b3:** a scramble leads to a random position, and every position that needs at least two moves to solve is equally likely. The package draws the position first, uniformly from every legal position, and only then works out the moves that reach it. A draw that lands on a solved position, or on one of the eighteen positions one move from solved, is thrown away and drawn again; that happens about once in two quintillion draws.
- **Regulation 4b1:** scrambles are not picked or filtered. The package has no option that chooses easier, shorter or otherwise preferred scrambles, and it never redraws for any reason except the one above.
- **Regulation 4b3a:** in blindfolded events, the scramble also leaves the cube in a random orientation, each of the 24 equally likely. [`blindfoldedScramble`](#blindfoldedscramble) draws the position as above, then the orientation: first which centre goes to the top, then which goes to the front, with the same wide moves, in the same order, as the WCA's official scrambler.

Like the official scrambler, a blindfolded scramble never ends its face turns on the same axis as the first wide move, so you never see something like `R Rw`. When the solver's moves would end that way, the package finds other moves to the same position. The position and the orientation are drawn before that happens, so it changes neither.

### Performing the wide moves

The wide moves come last, on the same scrambled cube, still held white on top and green in front. Do not turn the cube in your hands before them. Each turns two layers together as one block:

- `Rw` turns the right face and the middle layer next to it, the way `R` turns: the front of that block goes up. The left layer stays still.
- `Fw` turns the front face and the middle layer behind it, the way `F` turns: the top of that block goes to the right. The back layer stays still.
- `Uw` turns the top face and the middle layer below it, the way `U` turns: the front of that block goes to the left. The bottom layer stays still.

`2` turns twice, and `_PRIME` (written `'`) turns the other way. Clockwise is judged looking straight at that face, as for any move.

Afterwards the cube's orientation is read from its centres: the one on top and the one in front. The returned `faces` shows the same thing, in `faces.U[4]` and `faces.F[4]`. One scramble in 24 has no wide moves, and the cube stays white on top and green in front.

### Where the randomness comes from

By default every draw uses the platform's cryptographically secure generator, `crypto.getRandomValues`, which browsers have and Node has had as a global since version 19. It reaches every position, and nobody can predict a scramble from the ones before it. A blindfolded scramble draws its orientation from the same generator, right after the position.

You can pass your own generator instead, as the [`random`](#scrambleoptions) option. A seeded one makes scrambles reproducible, which suits tests, replays and shared practice sets. It does not suit fairness: a generator started from a 32-bit seed can reach at most about four billion scrambles, and a 3×3 cube has about 43 quintillion positions.

### Length

The moves come from the solver, which finds a short way from the scrambled position back to solved; the scramble is that way, reversed. How hard it looks is the [`effort`](#scrambleoptions) option.

| Effort | `scramble` | `blindfoldedScramble`, wide moves included |
| --- | --- | --- |
| `Efforts.full`, the default | usually 18 to 22 moves; 16 and 17 are rare; never more than 22 in 800 scrambles on two devices | 19 to 25 moves in 400 scrambles on three machines |
| `Efforts.fast` | 18 to 24 moves | 18 to 27 moves in 1,100 scrambles on three machines |

Every scramble has at least two moves. The same position and effort always give the same moves.

## Scrambling

### `scramble`

```ts signature
function scramble(options?: ScrambleOptions): Scramble;
```

A random position, drawn as [The rules it follows](#the-rules-it-follows) describes, with the moves that take a solved cube there. Returns a [`Scramble`](#scramble-1): the `moves`, and the `faces` of the cube they leave.

```ts
import { Efforts, formatScramble, scramble } from '@turnwise/cube-scramble';

const { moves, faces } = scramble();

formatScramble(moves);
// for example "R2 U2 L2 D L2 U F2 D L' U2 L2 D2 U R2 D L F L U'"

faces.U;
// the nine stickers on top afterwards, for example ['F', 'R', 'U', 'B', 'U', 'B', 'B', 'D', 'U']

scramble({ effort: Efforts.fast }); // quicker, a few moves longer
```

What you can rely on:

- **Every position that needs at least two moves is equally likely,** with the default randomness.
- **It is at least two moves long.**
- **No scramble turns the same face twice in a row.**
- **`faces` is exactly the cube the moves leave,** starting from solved.
- **With a seeded `random`, it is repeatable:** the same generator from the same seed gives the same moves and faces on every machine.
- **It is synchronous** and keeps its thread busy while it works. See [Performance and threading](#performance-and-threading).

The first call builds the solver's lookup tables, unless [`prepare`](#prepare) already has.

**Throws** `RangeError` when `options.random` returns anything but a number from 0 up to, but not including, 1. **Throws** `TypeError` when `options.effort` is not a known effort, which is only reachable by bypassing the compiler. See [Errors](#errors).

### `blindfoldedScramble`

```ts signature
function blindfoldedScramble(options?: ScrambleOptions): BlindfoldedScramble;
```

A scramble for 3×3 Blindfolded and Multi-Blind: a random position and a random orientation, drawn as [The rules it follows](#the-rules-it-follows) describes, with the moves that take a solved cube there. Returns a [`BlindfoldedScramble`](#blindfoldedscramble-1): the `moves`, face turns first and then the wide moves, and the `faces` of the cube as it is then held. For Multi-Blind, call it once for each cube.

```ts
import { blindfoldedScramble, formatScramble } from '@turnwise/cube-scramble';

const { moves, faces } = blindfoldedScramble();

formatScramble(moves);
// for example "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'"

faces.U[4]; // 'F': the cube ends with the green centre on top
faces.F[4]; // 'L': and the orange centre in front
```

What you can rely on:

- **Every position that needs at least two moves is equally likely, and so is each of the 24 orientations,** with the default randomness.
- **The face turns come first, then zero, one or two wide moves.** There are none in 1 scramble out of 24, when the orientation drawn is the one the cube started in.
- **No face is turned twice in a row, and the last face turn is never on the same axis as the first wide move.**
- **`faces` is exactly the cube the moves leave, as it is then held,** so its centres show the orientation.
- **With a seeded `random`, it is repeatable,** orientation included.
- **It is synchronous** and keeps its thread busy while it works. See [Performance and threading](#performance-and-threading).

[Performing the wide moves](#performing-the-wide-moves) says how to do the last moves by hand. The first call builds the solver's lookup tables, unless [`prepare`](#prepare) already has.

**Throws** the same errors as [`scramble`](#scramble), in the same cases.

### `ScrambleOptions`

```ts signature
interface ScrambleOptions {
  readonly effort?: Effort;
  readonly random?: () => number;
}
```

The options of [`scramble`](#scramble) and [`blindfoldedScramble`](#blindfoldedscramble). Leave an option out to get its default. There is no other way to ask for a default.

| Option | Default | What it does |
| --- | --- | --- |
| `effort` | `Efforts.full` | How hard the solver looks for a short scramble. See [Length](#length). |
| `random` | the platform's cryptographically secure generator | Where every draw comes from. It must return a number from 0 up to, but not including, 1, as `Math.random` does. |

```ts
import { blindfoldedScramble, formatScramble, scramble } from '@turnwise/cube-scramble';

// Any seeded generator works; this one is mulberry32.
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

formatScramble(scramble({ random: seeded(42) }).moves);
// "F2 U F2 U' F2 R2 D L2 B R D2 L U2 L2 B2 D' F' U L2 U", every time, on every machine

formatScramble(blindfoldedScramble({ random: seeded(1) }).moves);
// "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'", every time, on every machine
```

### `Scramble`

```ts signature
interface Scramble {
  readonly moves: Move[];
  readonly faces: FaceGrid;
}
```

What [`scramble`](#scramble) returns: the `moves`, in order, for a solved cube held white on top and green in front, and the [`faces`](#facegrid) of the cube they leave. A scramble never turns the whole cube, so every centre stays where it started, as a `FaceGrid` requires.

```ts
import { scramble } from '@turnwise/cube-scramble';
import type { Face, FaceGrid, Scramble } from '@turnwise/cube-scramble';

const drawn: Scramble = scramble();
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

function sameCube(scanned: FaceGrid, expected: FaceGrid): boolean {
  return FACES.every((face) => {
    const seen: readonly Face[] = scanned[face];
    const wanted: readonly Face[] = expected[face];
    return seen.every((sticker, index) => sticker === wanted[index]);
  });
}

sameCube(drawn.faces, drawn.faces); // true
```

### `BlindfoldedScramble`

```ts signature
interface BlindfoldedScramble {
  readonly moves: (Move | WideMove)[];
  readonly faces: Readonly<Record<Face, FaceStickers>>;
}
```

What [`blindfoldedScramble`](#blindfoldedscramble) returns: the `moves`, face turns and then up to two wide moves, for a solved cube held white on top and green in front, and the `faces` of the cube as it is then held.

The wide moves turn the whole cube, so a centre can end up anywhere: `faces` has the shape of a [`FaceGrid`](#facegrid), but each face is a plain [`FaceStickers`](#facestickers), whose centre can be any face. `faces.U[4]` is the centre now on top, and `faces.F[4]` the one in front.

```ts
import { blindfoldedScramble } from '@turnwise/cube-scramble';
import type { BlindfoldedScramble, Face } from '@turnwise/cube-scramble';

const drawn: BlindfoldedScramble = blindfoldedScramble();

const COLOURS: Record<Face, string> = {
  U: 'white',
  F: 'green',
  R: 'red',
  L: 'orange',
  D: 'yellow',
  B: 'blue',
};

const endsWith = `${COLOURS[drawn.faces.U[4]]} on top, ${COLOURS[drawn.faces.F[4]]} in front`;
```

## Moves

### `formatScramble`

```ts signature
function formatScramble(moves: readonly (Move | WideMove)[]): string;
```

The moves in traditional cube notation, with a single space between moves. A face turn is its face letter; a wide move is its face letter and `w`. Either is followed by nothing, `2`, or an ASCII apostrophe (`'`) for a counter-clockwise quarter turn. An empty list gives an empty string. Other cube programs and timers read this notation; nothing in this package reads it back.

```ts
import { blindfoldedScramble, formatScramble } from '@turnwise/cube-scramble';

navigator.clipboard.writeText(formatScramble(blindfoldedScramble().moves)).catch(() => undefined);
```

**Throws** `TypeError` when a move is neither a [`Move`](#move) nor a [`WideMove`](#widemove), which is only reachable by bypassing the compiler. See [Errors](#errors).

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

One of the eighteen face turns: see [What a scramble is](#what-a-scramble-is). It is `@turnwise/cube-solver`'s own `Move` type, so moves pass between the two packages as they are. Moves are plain strings, so a scramble survives JSON, `postMessage` and a database unchanged.

```ts
import { scramble } from '@turnwise/cube-scramble';
import type { Move } from '@turnwise/cube-scramble';

const { moves } = scramble();
const stored = JSON.stringify(moves);
const restored = JSON.parse(stored) as Move[];
```

### `WideMove`

```ts signature
type WideMove = 'Rw' | 'Rw2' | 'Rw_PRIME' | 'Fw' | 'Fw_PRIME' | 'Uw' | 'Uw2' | 'Uw_PRIME';
```

One of the eight wide moves a [`blindfoldedScramble`](#blindfoldedscramble) can end with. A wide move turns a face together with the middle layer next to it, in the same direction as that face's own turn: `Rw` turns the right two layers as one block, the way `R` turns the right one. The name is the face letter and `w`, then nothing, `2` or `_PRIME`, as for a [`Move`](#move). [Performing the wide moves](#performing-the-wide-moves) describes each one.

These eight are all a blindfolded scramble needs to reach every orientation, and they only ever appear at its end.

```ts
import { blindfoldedScramble } from '@turnwise/cube-scramble';
import type { Move, WideMove } from '@turnwise/cube-scramble';

const { moves } = blindfoldedScramble();
const wideMoves = moves.filter((move): move is WideMove => move.includes('w'));
const faceTurns = moves.filter((move): move is Move => !move.includes('w'));
```

## The cube

`FaceGrid`, `FaceStickers` and `Face` are `@turnwise/cube-solver`'s own types, passed through unchanged, so a cube from this package can go straight into the solver and back.

### `FaceGrid`

```ts signature
type FaceGrid = { readonly [F in Face]: FaceStickers<F> };
```

All 54 stickers of a cube whose centres are where they started: each face's nine [`FaceStickers`](#facestickers), with the centre pinned to that face. This is the `faces` of a [`Scramble`](#scramble-1).

Each face is read row by row, looking straight at it. U is read with B at the top, D with F at the top, and R, F, L and B with U at the top. Each sticker is named by the face it belonged to on the solved cube.

```ts
import { scramble } from '@turnwise/cube-scramble';
import type { FaceGrid } from '@turnwise/cube-scramble';

const faces: FaceGrid = scramble().faces;
const topCentre = faces.U[4]; // always 'U'
```

### `FaceStickers`

```ts signature
type FaceStickers<Centre extends Face = Face> = readonly [
  Face, Face, Face,
  Face, Centre, Face,
  Face, Face, Face,
];
```

The nine stickers of one face, row by row:

```
0 1 2
3 4 5
6 7 8
```

Position 4 is the centre. In a [`FaceGrid`](#facegrid) it is pinned to its own face; in a [`BlindfoldedScramble`](#blindfoldedscramble-1)'s `faces`, which can turn the whole cube, it can be any face.

```ts
import { blindfoldedScramble } from '@turnwise/cube-scramble';
import type { FaceStickers } from '@turnwise/cube-scramble';

const top: FaceStickers = blindfoldedScramble().faces.U;
const centre = top[4];
```

### `Face`

```ts signature
type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
```

One of the six faces: up, right, front, down, left and back. In `faces`, a key is a position on the cube as it is held, and a sticker is the face it belonged to on the solved cube, which on a standard cube is its colour.

## Setup

`prepare`, `Efforts` and `Effort` are `@turnwise/cube-solver`'s own exports, passed through unchanged. They are the same function and the same values, not copies: if your app also imports the solver, `prepare` from either package builds the same tables. The [solver's documentation](https://github.com/erdembircan/turnwise-packages/blob/main/packages/cube-solver/docs/documentation.md) describes them in full.

### `prepare`

```ts signature
function prepare(): void;
```

Builds the solver's lookup tables, if they are not built yet: about 0.3 seconds on a laptop and 0.5 seconds on a phone, and 6 MB, once per thread. Calling it again does nothing. Without it, the first [`scramble`](#scramble) or [`blindfoldedScramble`](#blindfoldedscramble) pays for the tables.

```ts
import { prepare } from '@turnwise/cube-scramble';

prepare();
```

### `Efforts`

An object with one constant per [`Effort`](#effort), each holding its own name: `Efforts.fast === 'fast'`.

```ts
import { Efforts, scramble } from '@turnwise/cube-scramble';

scramble({ effort: Efforts.full });

// @ts-expect-error there are two efforts, and no Efforts.turbo
scramble({ effort: Efforts.turbo });
```

### `Effort`

```ts signature
type Effort = 'fast' | 'full';
```

How hard the solver looks for a short answer. See [Length](#length) for what each gives.

## Errors

`scramble`, `blindfoldedScramble` and `formatScramble` throw only built-in errors. Each means the call itself was wrong, not that a scramble went wrong.

### The built-in `RangeError`, for a `random` that breaks its contract

Thrown by `scramble` and `blindfoldedScramble` when the `random` option returns anything but a number from 0 up to, but not including, 1. The message names the value it got:

> The random function returned NaN. It must return a number from 0 up to, but not including, 1, like Math.random does.

```ts
import { scramble } from '@turnwise/cube-scramble';

try {
  scramble({ random: () => 1 });
} catch (error) {
  if (error instanceof RangeError) {
    console.error(error.message);
  }
}
```

### The built-in `TypeError`, for callers who bypass the compiler

The types rule out both cases. Only plain JavaScript, or values built from unchecked data, can reach them.

Thrown by the solver, through `scramble` and `blindfoldedScramble`, when `effort` is not a known effort:

> Unknown effort "turbo". Use "fast" or "full".

Thrown by `formatScramble` when a move is neither a `Move` nor a `WideMove`. The message names the value it got:

> Unknown move "R3". A scramble is made of face turns such as "R", "R2" or "R_PRIME", and wide moves such as "Rw" or "Uw_PRIME".

## Performance and threading

| | Laptop | iPhone |
| --- | --- | --- |
| Importing the package | nothing | nothing |
| [`prepare()`](#prepare), or the first scramble without it | about 0.3 s | about 0.5 s |
| `scramble()` | about 0.1 s | about 0.1 s |
| `scramble({ effort: Efforts.fast })` | a few milliseconds, at most about 50 ms | under 10 ms, at most about 80 ms |
| `blindfoldedScramble()` | about 0.1 s; one in ten over 0.19 s; at most about 0.34 s | about 0.1 s; one in ten over 0.21 s; at most about 0.32 s |
| `blindfoldedScramble({ effort: Efforts.fast })` | a few milliseconds, at most about 45 ms | a few milliseconds, at most about 70 ms |

The times were measured inside a worker on a MacBook in Chromium and an iPhone in Safari. They scale with the machine, but the scrambles do not: the same position, effort and randomness give the same moves anywhere.

A blindfolded scramble takes longer than a plain one about one time in three, when its last face turn would share an axis with the first wide move and it needs a second solve to find another.

`scramble`, `blindfoldedScramble` and `prepare` are synchronous. On a browser's main thread they freeze the page while they run, so run them in a worker. A worker around the package is a few lines:

```ts
// scramble.worker.ts
import { blindfoldedScramble, prepare } from '@turnwise/cube-scramble';

prepare();

addEventListener('message', () => {
  postMessage(blindfoldedScramble());
});
```

```ts
// main thread
import { formatScramble } from '@turnwise/cube-scramble';
import type { BlindfoldedScramble } from '@turnwise/cube-scramble';

const worker = new Worker(new URL('./scramble.worker.ts', import.meta.url), { type: 'module' });

worker.addEventListener('message', (event: MessageEvent<BlindfoldedScramble>) => {
  console.log(formatScramble(event.data.moves), event.data.faces.U[4]);
});
worker.postMessage('scramble');
```

A scramble is plain arrays and strings, so it crosses `postMessage` as it is.

The package depends on `@turnwise/cube-solver` and imports it rather than carrying a copy. An app that uses both gets one solver, one set of tables and one `prepare()`; a worker that already solves cubes can scramble them too, with no extra start-up cost.

The package is ESM only. Node 22.12 and later can also load it with `require`.
