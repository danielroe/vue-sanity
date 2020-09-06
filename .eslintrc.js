module.exports = {
  env: {
    browser: true,
  },
  plugins: ['jest'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'error',
    'no-unused-vars': 'off',
  },
  extends: ['@siroc'],
}
