module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  reporters: ['default', '<rootDir>/tests/streamReporter.cjs'],
  roots: ['<rootDir>/tests/frontend/unit'],
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setupTests.ts'],
  collectCoverageFrom: [
    'src/frontend/**/*.{ts,tsx}',
    '!src/frontend/**/*.d.ts',
    '!src/frontend/index.tsx'
  ],
  coverageDirectory: 'coverage/frontend',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.frontend.json'
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/frontend/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};
