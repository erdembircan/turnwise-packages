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

`pnpm e2e` goes one step further: it packs the package exactly as npm would receive it, installs that tarball into a small project outside the workspace, compiles the README's examples against the published types, and runs the published code under plain Node.

## Releasing

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets).

```bash
pnpm changeset
```

Run that in any pull request that changes a package, and commit the file it writes. To cut a release, `pnpm version-packages` applies the pending changesets, and `pnpm release` runs every check and publishes.

## License

[Apache-2.0](LICENSE) © Erdem Bircan
