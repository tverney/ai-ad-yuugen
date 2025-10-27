module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Stricter rules for developer portal
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Prevent inline styles - use Tailwind CSS classes instead
    'react/forbid-dom-props': [
      'error',
      {
        forbid: [
          {
            propName: 'style',
            message: 'Use Tailwind CSS classes instead of inline styles. Add styles to your CSS file or use utility classes.',
          },
        ],
      },
    ],
    
    // Dashboard-specific rules
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    
    // Performance rules for dashboard
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
  },
};