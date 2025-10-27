module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    es2020: true,
  },
  ignorePatterns: [
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    'src/test-setup.ts',
    'src/angular/**',
    'src/vue/**',
    'src/lazy/**'
  ],
  rules: {
    // Stricter rules for UI components
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Require proper TypeScript types
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
  },
};