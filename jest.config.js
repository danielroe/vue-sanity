module.exports = {
  verbose: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: ['test', '.babelrc.js'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 95,
      lines: 85,
      statements: 83,
    },
  },
}
