'use strict';

module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2022: true,
    mocha: true,
    node: true,
  },
  plugins: ['react', 'babel', 'jsdoc'],
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:jsdoc/recommended',
  ],
  rules: {
    // Other rules
    'no-console': 'off',
    'eqeqeq': 'error',
    'react/display-name': 'off',
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        destructuredArrayIgnorePattern: '^_',
      },
    ],
  },
};
