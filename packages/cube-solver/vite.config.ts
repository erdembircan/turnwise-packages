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
      tsconfigPath: './tsconfig.src.json',
      exclude: ['src/**/*.test.ts', 'src/**/*.test-d.ts', 'src/testing/**'],
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
