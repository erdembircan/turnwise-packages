import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
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
