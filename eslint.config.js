import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // argsIgnorePattern matters for the `({ icon: Icon }) => <Icon />`
      // destructuring used throughout the UI — the binding is a component
      // rendered in JSX, which the base rule cannot see as a "use".
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]|^_' },
      ],

      // Reduced to a warning: the remaining occurrences are the documented
      // "synchronise with an external system" case — resolving a fetch,
      // or reacting to a router navigation — not cascading render bugs.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Context modules intentionally export a provider component *and* its
    // hook. Splitting them to satisfy Fast Refresh would mean two files per
    // context for no runtime benefit.
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
