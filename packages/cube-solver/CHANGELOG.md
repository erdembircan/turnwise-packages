# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `solve`: Kociemba's two-phase algorithm for the 3×3 cube. The default effort returns about 20 moves in about a tenth of a second; `effort: 'fast'` returns about 23 moves in a few milliseconds. The same cube and effort always give the same solution.
- `prepare`: builds the solver's lookup tables ahead of the first `solve`. Importing the package builds nothing.
- `cubeFromFaces`: a cube from its 54 stickers. The shape of the input, including every centre, is checked by the compiler.
- `cubeFromMoves`: a cube from the moves that scrambled it.
- `parseFaceletString`: reads the 54-character facelet string other cube programs exchange.
- `applyMoves`, `isSolved`, `facesFromCube`: turn a cube, test it, and read its stickers back.
- `inverse`, `faceOf`, `turnsOf`, `formatAlgorithm`: work with moves, and print them in traditional notation.
- `Face` and `Move` as string literal types, with `Faces` and `Moves` as lookup objects for the same values.
- Named errors for cubes that cannot exist: `StickerCountError`, `UnknownPieceError`, `DuplicatePieceError`, `CornerTwistError`, `EdgeFlipError` and `ParityError`, all extending `InvalidCubeError`, plus `FaceletStringError`. Each message says what is wrong, where, and what to check.
