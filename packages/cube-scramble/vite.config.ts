import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    // The solver is a dependency, installed next to this package, so it is imported rather than
    // copied in: users who also use the solver share one copy. Only the private shared source is
    // bundled.
    rollupOptions: {
      external: ['@turnwise/cube-solver'],
    },
    sourcemap: true,
    minify: false,
    target: 'es2022',
  },
  plugins: [
    dts({
      bundleTypes: true,
      // This config also compiles the shared source in packages/internal, so the published types
      // contain it instead of importing a package that is never published.
      tsconfigPath: './tsconfig.dts.json',
    }),
  ],
  // Inside the workspace, tests read the solver's source rather than its build, so they never run
  // against a stale or missing dist/.
  ssr: {
    resolve: {
      conditions: ['@turnwise/source', ...defaultServerConditions],
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 120_000,
    typecheck: {
      enabled: true,
      include: ['src/**/*.test-d.ts'],
      tsconfig: './tsconfig.src.json',
    },
  },
});
