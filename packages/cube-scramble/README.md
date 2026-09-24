<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../../assets/turnwise-dark.svg">
    <img alt="Turnwise" src="../../assets/turnwise-light.svg" width="360">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@turnwise/cube-scramble"><img alt="npm version" src="https://img.shields.io/npm/v/@turnwise/cube-scramble"></a>
  <a href="https://github.com/erdembircan/turnwise-packages/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/erdembircan/turnwise-packages/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="https://github.com/erdembircan/turnwise-packages/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@turnwise/cube-scramble"></a>
</p>

# @turnwise/cube-scramble

WCA-style scrambles for the 3×3 Rubik's Cube, written in TypeScript, for browsers, workers, Node, Deno and Bun.

Each scramble leads to a random position, and every position that needs at least two moves to solve is equally likely, as WCA Regulation 4b3 asks. Blindfolded scrambles also leave the cube in a random orientation, as Regulation 4b3a asks. The randomness comes from the platform's cryptographically secure generator.

```bash
pnpm add @turnwise/cube-scramble
```

## Get a scramble

```ts
import { formatScramble, scramble } from '@turnwise/cube-scramble';

const moves = scramble();
// ['R2', 'U2', 'L2', …], a different scramble every call

formatScramble(moves);
// for example "R2 U2 L2 D L2 U F2 D L' U2 L2 D2 U R2 D L F L U'"
```

Apply it to a solved cube held white on top and green in front, as WCA Regulation 4d1 describes. In the package's terms that is the U face up and the F face towards you: the moves name faces, not colours.

A scramble is an array of `Move` values, the plain strings `'R2'`, `'U_PRIME'` and so on, so it survives JSON, `postMessage` and a database unchanged. `formatScramble` turns it into the traditional notation people read and other cube programs accept.

## Blindfolded scrambles

Blindfolded events have no inspection, so nobody gets to turn the cube to a favourite side before the clock starts. The WCA makes the orientation part of the scramble instead. `blindfoldedScramble` draws a scramble the same way, then adds up to two wide moves that turn the cube to one of its 24 orientations, each equally likely.

```ts
import { blindfoldedScramble, formatScramble } from '@turnwise/cube-scramble';

const moves = blindfoldedScramble();
// ['L2', 'F2', 'D', …, 'Rw', 'Uw_PRIME'], a different scramble every call

formatScramble(moves);
// for example "L2 F2 D F2 L2 D L2 B2 D L2 D R' D' B L2 U L R' D2 B F' Rw Uw'"
```

Start from white on top and green in front, as for any scramble. A wide move turns a face together with the middle layer next to it, so `Rw` turns the right two layers as one block. For Multi-Blind, call it once for each cube.

## What you get

| Effort | `scramble` | `blindfoldedScramble`, wide moves included |
| --- | --- | --- |
| `Efforts.full`, the default | usually 18 to 22 moves; 16 and 17 are rare; never more than 22 in our measurements | 19 to 25 moves in our measurements |
| `Efforts.fast` | 18 to 24 moves, in a fraction of the time | 19 to 27 moves |

A scramble is never shorter than two moves, and never lands on a position that is solved or one move from solved.

```ts
import { Efforts, scramble } from '@turnwise/cube-scramble';

scramble({ effort: Efforts.fast });
```

Leave an option out to get its default. There is no other way to ask for a default.

## Reproducible scrambles

Pass a `random` function to control where the randomness comes from. It must return numbers from 0 up to, but not including, 1, as `Math.random` does. The same function, started from the same seed, gives the same scramble on every machine. The same goes for `blindfoldedScramble`, orientation included.

```ts
import { formatScramble, scramble } from '@turnwise/cube-scramble';

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
```

Use this for tests, replays and shared practice sets, not for fairness. A generator started from a 32-bit seed can reach at most about four billion scrambles, and a 3×3 cube has about 43 quintillion positions. Leave `random` out when every position must be possible.

## Speed, and where to run it

| | Laptop | iPhone |
| --- | --- | --- |
| `prepare()`, or the first scramble without it | about 0.3 s | about 0.5 s |
| `scramble()` | about 0.1 s | about 0.17 s |
| `scramble({ effort: Efforts.fast })` | a few milliseconds | under 10 ms |

`blindfoldedScramble()` usually takes as long as `scramble()`. About one in three takes two to six times as long, while it finds a last face turn that does not share an axis with the first wide move.

Both are synchronous and keep their thread busy. In a browser, run them in a worker, and call `prepare()` there first so the first scramble does not pay for building its lookup tables. The [documentation](docs/documentation.md#performance-and-threading) has a complete worker.

## When something is wrong

| Error | When |
| --- | --- |
| `RangeError` | Your `random` function returned something outside 0 up to, but not including, 1. |
| `TypeError` | `effort` is not a known effort, or `formatScramble` was given something that is not a move. The compiler rejects both before they can happen, unless the call comes from plain JavaScript or unchecked data. |

## Documentation

**[docs/documentation.md](docs/documentation.md)** is the full reference: what a scramble guarantees, every export with its signature and an example, the exact error messages, and how to run it in a worker.

It ships inside the package, at `node_modules/@turnwise/cube-scramble/docs/documentation.md`, so it always matches the version you have installed. Its examples are compiled against the published types on every change.

| Task | Exports |
| --- | --- |
| Scramble | `scramble`, `blindfoldedScramble`, `ScrambleOptions` |
| Moves | `formatScramble`, `Move`, `WideMove` |
| Setup | `prepare`, `Efforts`, `Effort` |

The package is ESM only. Node 22.12 and later can also load it with `require`.

## License

[Apache-2.0](LICENSE) © Erdem Bircan
