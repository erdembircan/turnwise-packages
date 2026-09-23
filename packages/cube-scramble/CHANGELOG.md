# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `scramble`: WCA-style scrambles for the 3×3 cube. Every position that needs at least two moves to solve is equally likely (WCA Regulation 4b3), drawn with the platform's cryptographically secure generator. The `effort` option trades a few extra moves for speed, and the `random` option takes your own generator for reproducible scrambles.
- `formatAlgorithm`, `prepare`, `Efforts` and the types `Move` and `Effort`, re-exported from `@turnwise/cube-solver`, so this package is all you need to import.
