module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  reporters: ['default', '<rootDir>/tests/streamReporter.cjs'],
  roots: ['<rootDir>/tests/backend'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  // Run tests sequentially to avoid database race conditions
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    '!src/backend/**/*.d.ts'
  ],
  coverageDirectory: 'coverage/backend',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        esModuleInterop: true,
        strict: true,
        isolatedModules: true
      }
    }]
  }
};
