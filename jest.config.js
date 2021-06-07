module.exports = {
  transform: {
    '\\.(js|ts)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    ],
  },
  setupFiles: ['<rootDir>/test/helpers/setup.ts'],
  verbose: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: ['test', '.babelrc.js', 'lib'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 100,
      lines: 90,
      statements: 90,
    },
  },
}
