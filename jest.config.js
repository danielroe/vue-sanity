module.exports = {
  preset: '@siroc/jest-preset',
  setupFiles: ['<rootDir>/test/helpers/setup.ts'],
  verbose: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: ['test', '.babelrc.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 100,
      lines: 90,
      statements: 90,
    },
  },
}
