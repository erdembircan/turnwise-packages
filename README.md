<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/turnwise-dark.svg">
    <img alt="Turnwise" src="assets/turnwise-light.svg" width="360">
  </picture>
</p>

# turnwise-packages

Typed Rubik's Cube packages, published under the `@turnwise` npm scope.

| Package | What it does |
| --- | --- |
| [`@turnwise/cube-solver`](packages/cube-solver) | Solves a 3×3 cube with Kociemba's two-phase algorithm. Inputs are checked by the type system before the code ever runs. |
| [`@turnwise/cube-scramble`](packages/cube-scramble) | WCA-style scrambles for the 3×3 cube: every position that needs at least two moves to solve is equally likely. Built on the solver. |

[Turnwise](https://erdembircan.github.io/turnwise/) is built on `@turnwise/cube-solver`, and the quickest way to see it work.

## Development

Requires Node 24 and pnpm 10.

```bash
pnpm install
```

```bash
pnpm check
```

`pnpm check` runs everything CI runs: type checking, linting, tests, the build, and license verification. Each step is also available on its own as `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm license:verify`.

`pnpm e2e` goes one step further: it packs the package exactly as npm would receive it, installs that tarball into a small project outside the workspace, compiles every example in the README and the documentation against the published types, checks that every export is documented, and runs the published code under plain Node.

`packages/internal` holds source that more than one package uses. It is private and never published: each package bundles the parts it uses into its own build, so no published package depends on it. `pnpm e2e` fails if a published package's code or types ever refer to it.

## Releasing

Releases are cut by hand, from a maintainer's machine. CI only verifies: no workflow publishes anything, and no npm credential is stored in GitHub. That is a deliberate choice, not a gap.

Each package keeps a hand-written `CHANGELOG.md` in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. A pull request that changes a package adds a line under that changelog's `## [Unreleased]` heading, in the group it belongs to: Added, Changed, Deprecated, Removed, Fixed or Security.

To cut a release of a package, you need to be logged in to npm (`npm login`) as a member of the `@turnwise` organisation. Then:

1. In the package's `CHANGELOG.md`, rename `## [Unreleased]` to the new version and today's date, such as `## [1.0.0] - 2026-09-17`, and add a fresh, empty `## [Unreleased]` above it.
2. Set the same version in the package's `package.json`. Choose it by [Semantic Versioning](https://semver.org/spec/v2.0.0.html): a breaking change is a major release, a new feature is a minor one, a fix is a patch.
3. Commit both files.
4. Publish from the package's folder. Every check runs first, and the publish stops if one fails:

```bash
pnpm publish
```

5. Tag the commit with the package name and version, then push the commit and the tag:

```bash
git tag @turnwise/cube-solver@1.0.0
```

```bash
git push --follow-tags
```

Publishing cannot be undone: a version number, once used, can never be used again.

## License

[Apache-2.0](LICENSE) © Erdem Bircan
