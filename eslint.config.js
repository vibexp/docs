import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import astro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // Build output, generated types, and deps.
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // The Astro config runs in Node at build time and reads env-driven,
    // tenant-neutral config (Sentry org/project) from `process.env`.
    files: ['astro.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    // Ambient declaration files (e.g. src/env.d.ts) use triple-slash references
    // by design — that is Astro's own convention for wiring generated and
    // package-internal type declarations into the project.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  }
)
