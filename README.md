# turnwise-packages

Typed Rubik's Cube packages, published under the `@turnwise` npm scope.

| Package | What it does |
| --- | --- |
| [`@turnwise/cube-solver`](packages/cube-solver) | Solves a 3×3 cube with Kociemba's two-phase algorithm. Inputs are checked by the type system before the code ever runs. |

## Development

Requires Node 24 and pnpm 10.

```bash
pnpm install
```

```bash
pnpm check
```

`pnpm check` runs everything CI runs: type checking, linting, tests, the build, and license verification. Each step is also available on its own as `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm license:verify`.

## License

[Apache-2.0](LICENSE) © Erdem Bircan
