module.exports = {
  env: {
    browser: true,
  },
  plugins: ['jest'],
  rules: {
    '@typescript-eslint/no-inferrable-types': 1,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
  },
  extends: ['@siroc'],
}
