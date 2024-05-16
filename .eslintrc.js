// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  env: {
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'prettier',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended',
    'plugin:jsdoc/recommended',
    'plugin:unicorn/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'sonarjs', 'import', 'jsdoc'],
  ignorePatterns: ['/node_modules', '/dist', '/src/playground.ts'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // basic rules
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    indent: 'off',
    curly: ['error', 'all'],
    'max-len': ['error', { code: 120 }],
    'no-shadow': 'off', // replaced by ts-eslint rule below
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-restricted-syntax': ['off'],
    'no-fallthrough': 'error',
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { allow: ['constructors'] }],

    // TypeScript rules
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-extra-semi': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_[a-zA-Z]',
        varsIgnorePattern: '^_[a-zA-Z]',
      },
    ],

    // import rules
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        '.spec.ts': 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.e2e-spec.ts',
          '**/*.spec.ts',
          '**/global-setup.ts',
          '**/global-teardown.ts',
        ],
      },
    ],

    // unicorn rules
    'unicorn/no-null': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/no-array-for-each': 'warn',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/catch-error-name': 'error',
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/cognitive-complexity': 'error',
    'unicorn/prevent-abbreviations': [
      'error',
      {
        ignore: ['\\.e2e-spec$', /^ignore/i],
      },
    ],

    // other rules
    'class-methods-use-this': ['error', { exceptMethods: ['configure'] }],
    'no-underscore-dangle': [
      'error',
      {
        allow: [
          '_id',
          '_collection',
          '_v',
          '__MONGOINSTANCE', // used in testing
          '__', // eg. R.__
        ],
      },
    ],
  },
};
