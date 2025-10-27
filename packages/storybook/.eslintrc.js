module.exports = {
  extends: ['../../.eslintrc.js', 'plugin:storybook/recommended'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Storybook-specific rules
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Allow inline styles in Storybook stories for demonstration purposes
    'react/forbid-dom-props': 'off',
    
    // Storybook stories can be more flexible
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // Allow console.log in stories for demonstration
    'no-console': 'off',
    
    // Stories can have any exports
    'react-refresh/only-export-components': 'off',
  },
};