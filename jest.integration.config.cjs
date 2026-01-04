module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  reporters: ['default', '<rootDir>/tests/streamReporter.cjs'],
  roots: ['<rootDir>/tests/frontend/integration'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 60000,
  // Run tests sequentially to avoid port conflicts
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        strict: true,
        isolatedModules: true
      }
    }]
  }
};
