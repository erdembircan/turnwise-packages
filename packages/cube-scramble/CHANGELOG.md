# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `scramble`: WCA-style scrambles for the 3×3 cube. Every position that needs at least two moves to solve is equally likely (WCA Regulation 4b3), drawn with the platform's cryptographically secure generator. It returns the moves and the cube they leave, so a scan can be checked against it. The `effort` option trades a few extra moves for speed, and the `random` option takes your own generator for reproducible scrambles.
- `blindfoldedScramble`: scrambles for 3×3 Blindfolded and Multi-Blind. They end with up to two wide moves that leave the cube in one of its 24 orientations, each equally likely (WCA Regulation 4b3a), and the returned cube shows that orientation in its centres. Same options as `scramble`.
- `formatScramble`, and the types `Scramble`, `BlindfoldedScramble`, `Move`, `WideMove`, `FaceGrid`, `FaceStickers` and `Face`: scrambles as plain data, and in the traditional notation people read.
- `prepare`, `Efforts` and the type `Effort`, for setting up and choosing how hard to work.
