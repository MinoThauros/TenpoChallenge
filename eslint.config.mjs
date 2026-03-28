import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { fixupPluginRules } from '@eslint/compat';
import react from 'eslint-plugin-react';
import json from 'eslint-plugin-json';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Build scripts (CJS, not app code)
    'scripts/**/*.cjs',
    'scripts/**/*.sh',
  ]),
  // Allow unused variables that start with underscore
  {
    plugins: {
      react,
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'jsx-quotes': ['error', 'prefer-single'],
      'no-unused-expressions': 'off',
      'semi': ['warn', 'always'],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      }],
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      }],
      'react/jsx-indent': ['error', 2],
      'react/jsx-curly-spacing': [1, {
        when: 'never',
        allowMultiline: false,
        children: {
          when: 'never',
        },
      }],
      'react/jsx-indent-props': [2, 2],
      'react/jsx-first-prop-new-line': [0, 'multiline'],
      'react/jsx-one-expression-per-line': [0, {
        allow: 'none',
      }],
      'no-return-assign': 'off',
      'prefer-promise-reject-errors': 'off',
      quotes: ['error', 'single'],
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'ignore',
      }],
      indent: ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'before'],
    },
  },
  {
    files: ['**/*.json'],
    plugins: {
      json: fixupPluginRules(json),
    },
    rules: {
      'json/*': ['warn', { allowComments: false }],
      indent: ['error', 2],
      'no-trailing-spaces': 'off',
      'eol-last': 'off',
      quotes: ['error', 'double'],
      'quote-props': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'comma-dangle': 'off',
      semi: 'off',
    },
  },
]);

export default eslintConfig;
