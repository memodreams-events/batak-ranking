import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/*.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Los DTO y los controladores usan decoradores y tipos de Nest/React que
      // el linter no puede inferir; no queremos ruido por eso.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: { globals: { describe: 'readonly', it: 'readonly', expect: 'readonly' } },
  },
);
