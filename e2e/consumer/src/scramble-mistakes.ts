// Each `@ts-expect-error` below is a promise cube-scramble makes: this mistake is caught by the
// compiler, in a consumer's project, with no code running. If a promise breaks, the directive
// becomes unused and compilation fails.
import { Efforts, scramble } from '@turnwise/cube-scramble';
import type { Move, ScrambleOptions } from '@turnwise/cube-scramble';

// @ts-expect-error unknown effort
scramble({ effort: 'turbo' });

// @ts-expect-error random is a function, not a seed
scramble({ random: 42 });

// @ts-expect-error there is no seed option; pass a seeded random function
scramble({ seed: 42 });

// @ts-expect-error leave an option out for its default (with exactOptionalPropertyTypes)
scramble({ effort: undefined });

// @ts-expect-error a scramble is a list of moves, not one move
export const oneMove: Move = scramble();

export function overwrite(options: ScrambleOptions): void {
  // @ts-expect-error options are read-only
  options.effort = Efforts.fast;
}
