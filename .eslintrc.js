'use strict';

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    mocha: true,
    node: true,
    es6: true,
  },
  parser: 'babel-eslint',
  plugins: ['react', 'babel'],
  extends: ['prettier', 'eslint:recommended', 'plugin:react/recommended'],
  rules: {
    // Other rules
    'no-console': 'off',
    'valid-jsdoc': ['error', {requireReturn: false}],
    eqeqeq: 'error',
    'react/display-name': 'off',
  },
};
