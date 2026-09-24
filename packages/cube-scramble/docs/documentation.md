# @turnwise/cube-scramble documentation

Everything the package exports, what each export does, what it throws, and the ideas you need to use it. This file ships inside the package, at `node_modules/@turnwise/cube-scramble/docs/documentation.md`, so it always matches the version you have installed.

Every `ts` example on this page is compiled against the published types on every change, so the examples cannot drift from the code.

- [Concepts](#concepts)
- [Scrambling](#scrambling): [`scramble`](#scramble), [`blindfoldedScramble`](#blindfoldedscramble), [`ScrambleOptions`](#scrambleoptions)
- [Moves](#moves): [`formatScramble`](#formatscramble), [`Move`](#move), [`WideMove`](#widemove)
- [Setup](#setup): [`prepare`](#prepare), [`Efforts`](#efforts), [`Effort`](#effort)
- [Errors](#errors)
- [Performance and threading](#performance-and-threading)

## Concepts

### What a scramble is

A scramble is a list of moves that takes a solved cube to a random position. Whoever applies it starts from a solved cube and turns the faces in order.

Moves name faces, not colours. Hold the cube with one face up and one face towards you and keep it that way: that is the U face and the F face. WCA Regulation 4d1 has competitors hold a standard cube with white on top and green in front, so on such a cube U is white and F is green.

Each move is one of the eighteen [`Move`](#move) values: a face letter, then nothing for a clockwise quarter turn, `2` for a half turn, or `_PRIME` for a counter-clockwise quarter turn. Clockwise means clockwise as seen looking straight at that face. A blindfolded scramble can also end with up to two [`WideMove`](#widemove) values, which turn a face together with the middle layer next to it.

### The rules it follows

The WCA Regulations say what a fair scramble is, and this package follows them:

- **Regulation 4b3:** a scramble leads to a random position, and every position that needs at least two moves to solve is equally likely. The package draws the position first, uniformly from every legal position, and only then works out the moves that reach it. A draw that lands on a solved position, or on one of the eighteen positions one move from solved, is thrown away and drawn again; that happens about once in two quintillion draws.
- **Regulation 4b1:** scrambles are not picked or filtered. The package has no option that chooses easier, shorter or otherwise preferred scrambles, and it never redraws for any reason except the one above.
- **Regulation 4b3a:** in blindfolded events, the scramble also leaves the cube in a random orientation, each of the 24 equally likely. [`blindfoldedScramble`](#blindfoldedscramble) draws the position as above, then the orientation: first which centre goes to the top, then which goes to the front, with the same wide moves, in the same order, as the WCA's official scrambler.

Like the official scrambler, a blindfolded scramble never ends its face turns on the same axis as the first wide move, so you never see something like `R Rw`. When the solver's moves would end that way, the package finds other moves to the same position. The position and the orientation are drawn before that happens, so it changes neither.

### Where the randomness comes from

By default every draw uses the platform's cryptographically secure generator, `crypto.getRandomValues`, which browsers have and Node has had as a global since version 19. It reaches every position, and nobody can predict a scramble from the ones before it. A blindfolded scramble draws its orientation from the same generator, right after the position.

You can pass your own generator instead, as the [`random`](#scrambleoptions) option. A seeded one makes scrambles reproducible, which suits tests, replays and shared practice sets. It does not suit fairness: a generator started from a 32-bit seed can reach at most about four billion scrambles, and a 3×3 cube has about 43 quintillion positions.

### Length

The moves come from the solver, which finds a short way from the scrambled position back to solved; the scramble is that way, reversed. How hard it looks is the [`effort`](#scrambleoptions) option.

| Effort | `scramble` | `blindfoldedScramble`, wide moves included |
| --- | --- | --- |
| `Efforts.full`, the default | usually 18 to 22 moves; 16 and 17 are rare; never more than 22 in 800 scrambles on two devices | 19 to 25 moves in 300 scrambles |
| `Efforts.fast` | 18 to 24 moves | 19 to 27 moves in 1,000 scrambles |

Every scramble has at least two moves. The same position and effort always give the same moves.

## Scrambling

### `scramble`

```ts signature
function scramble(options?: ScrambleOptions): Move[];
```

The moves that take a solved cube to a random position, drawn as [The rules it follows](#the-rules-it-follows) describes.

```ts
import { Efforts, formatScramble, scramble } from '@turnwise/cube-scramble';

const moves = scramble();
// ['R2', 'U2', 'L2', …], a different scramble every call

formatScramble(moves);
// for example "R2 U2 L2 D L2 U F2 D L' U2 L2 D2 U R2 D L F L U'"

scramble({ effort: Efforts.fast }); // quicker, a few moves longer
```

What you can rely on:

- **Every position that needs at least two moves is equally likely,** with the default randomness.
- **It is at least two moves long.**
- **No scramble turns the same face twice in a row.**
- **With a seeded `random`, it is repeatable:** the same generator from the same seed gives the same moves on every machine.
- **It is synchronous** and keeps its thread busy while it works. See [Performance and threading](#performance-and-threading).

The first call builds the solver's lookup tables, unless [`prepare`](#prepare) already has.

**Throws** `RangeError` when `options.random` returns anything but a number from 0 up to, but not including, 1. **Throws** `TypeError` when `options.effort` is not a known effort, which is only reachable by bypassing the compiler. See [Errors](#errors).

### `blindfoldedScramble`

```ts signature
function blindfoldedScramble(options?: ScrambleOptions): (Move | WideMove)[];
```

A scramble for 3×3 Blindfolded and Multi-Blind: the moves that take a solved cube to a random position, then the wide moves that turn it to a random orientation, drawn as [The rules it follows](#the-rules-it-follows) describes. For Multi-Blind, call it once for each cube.

```ts
import { blindfoldedScramble, formatScramble } from '@turnwise/cube-scramble';

const moves = blindfoldedScramble();
// ['L2', 'F2', 'D', …, 'Rw', 'Uw_PRIME'], a different scramble every call

formatScramble(moves);
// for example "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'"
```

What you can rely on:

- **Every position that needs at least two moves is equally likely, and so is each of the 24 orientations,** with the default randomness.
- **The face turns come first, then zero, one or two wide moves.** There are none in 1 scramble out of 24, when the orientation drawn is the one the cube started in.
- **No face is turned twice in a row, and the last face turn is never on the same axis as the first wide move.**
- **With a seeded `random`, it is repeatable,** orientation included.
- **It is synchronous** and keeps its thread busy while it works. See [Performance and threading](#performance-and-threading).

The first call builds the solver's lookup tables, unless [`prepare`](#prepare) already has.

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

formatScramble(scramble({ random: seeded(42) }));
// "F2 U F2 U' F2 R2 D L2 B R D2 L U2 L2 B2 D' F' U L2 U", every time, on every machine

formatScramble(blindfoldedScramble({ random: seeded(1) }));
// "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'", every time, on every machine
```

## Moves

### `formatScramble`

```ts signature
function formatScramble(moves: readonly (Move | WideMove)[]): string;
```

The moves in traditional cube notation, with a single space between moves. A face turn is its face letter; a wide move is its face letter and `w`. Either is followed by nothing, `2`, or an ASCII apostrophe (`'`) for a counter-clockwise quarter turn. An empty list gives an empty string. Other cube programs and timers read this notation; nothing in this package reads it back.

```ts
import { blindfoldedScramble, formatScramble } from '@turnwise/cube-scramble';

navigator.clipboard.writeText(formatScramble(blindfoldedScramble())).catch(() => undefined);
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

One of the eighteen face turns: see [What a scramble is](#what-a-scramble-is). It is `@turnwise/cube-solver`'s own `Move` type, so moves pass between the two packages as they are. A scramble is plain strings, so it survives JSON, `postMessage` and a database unchanged.

```ts
import { scramble } from '@turnwise/cube-scramble';
import type { Move } from '@turnwise/cube-scramble';

const moves: Move[] = scramble();
const stored = JSON.stringify(moves);
const restored = JSON.parse(stored) as Move[];
```

### `WideMove`

```ts signature
type WideMove = 'Rw' | 'Rw2' | 'Rw_PRIME' | 'Fw' | 'Fw_PRIME' | 'Uw' | 'Uw2' | 'Uw_PRIME';
```

One of the eight wide moves a [`blindfoldedScramble`](#blindfoldedscramble) can end with. A wide move turns a face together with the middle layer next to it, in the same direction as that face's own turn: `Rw` turns the right two layers as one block, the way `R` turns the right one. The name is the face letter and `w`, then nothing, `2` or `_PRIME`, as for a [`Move`](#move).

These eight are all a blindfolded scramble needs to reach every orientation, and they only ever appear at its end.

```ts
import { blindfoldedScramble } from '@turnwise/cube-scramble';
import type { Move, WideMove } from '@turnwise/cube-scramble';

const moves: (Move | WideMove)[] = blindfoldedScramble();
const wideMoves = moves.filter((move) => move.includes('w'));
```

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
| `scramble()` | about 0.1 s | about 0.17 s |
| `scramble({ effort: Efforts.fast })` | a few milliseconds, at most about 50 ms | under 10 ms, at most about 80 ms |

The times were measured inside a worker on a MacBook in Chromium and an iPhone in Safari. They scale with the machine, but the scrambles do not: the same position, effort and randomness give the same moves anywhere.

`blindfoldedScramble()` usually takes as long as `scramble()`. About one in three needs a second look for a last face turn that does not share an axis with the first wide move, and takes two to six times as long. In 300 scrambles on the laptop, in Node, the median was the same as `scramble()`'s and the slowest took 0.77 s.

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
import type { Move, WideMove } from '@turnwise/cube-scramble';

const worker = new Worker(new URL('./scramble.worker.ts', import.meta.url), { type: 'module' });

worker.addEventListener('message', (event: MessageEvent<(Move | WideMove)[]>) => {
  console.log(formatScramble(event.data));
});
worker.postMessage('scramble');
```

A scramble is plain strings, so it crosses `postMessage` as it is.

The package depends on `@turnwise/cube-solver` and imports it rather than carrying a copy. An app that uses both gets one solver, one set of tables and one `prepare()`; a worker that already solves cubes can scramble them too, with no extra start-up cost.

The package is ESM only. Node 22.12 and later can also load it with `require`.
