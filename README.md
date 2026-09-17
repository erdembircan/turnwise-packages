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

Releases are cut by hand, from a maintainer's machine. CI only verifies: no workflow publishes anything, and no npm credential is stored in GitHub. That is a deliberate choice, not a gap.

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets). A changeset is a small Markdown file in `.changeset/` that names a package, says how big the change is (`patch`, `minor` or `major`), and gives a sentence or two for the changelog.

### In every pull request that changes a package

```bash
pnpm changeset
```

Answer the prompts and commit the file it writes. Nothing is versioned or published at this point; changesets simply collect on `main` until the next release.

### To cut a release

You need to be logged in to npm (`npm login`) as a member of the `@turnwise` organisation.

Apply the pending changesets:

```bash
pnpm version-packages
```

This sets each changed package's new version (the largest bump among its changesets wins), writes the summaries into its `CHANGELOG.md`, and deletes the changesets it used. Review the diff and commit it.

Publish:

```bash
pnpm release
```

This runs every check, then uploads each package whose version is not yet on npm and tags it in git. Publishing cannot be undone: a version number, once used, can never be used again.

Push the release commit and its tags:

```bash
git push --follow-tags
```

## License

[Apache-2.0](LICENSE) © Erdem Bircan
