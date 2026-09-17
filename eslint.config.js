import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as dotignoreConfigs } from 'eslint-plugin-dotignore';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

const codeFiles = ['**/*.{js,mjs,cjs,ts}'];

const dotignoreStrict = dotignoreConfigs.strict;
if (dotignoreStrict === undefined) {
  throw new Error('eslint-plugin-dotignore no longer provides its "strict" config.');
}

export default defineConfig(
  { ignores: ['**/dist/', '**/coverage/', '**/node_modules/', '.claude/'] },
  {
    files: codeFiles,
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    ...prettierRecommended,
    files: codeFiles,
    rules: {
      ...prettierRecommended.rules,
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
          endOfLine: 'lf',
        },
      ],
    },
  },
  dotignoreStrict,
);
