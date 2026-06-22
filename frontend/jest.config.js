/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  testTimeout: 10000,
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'types/**/*.ts',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
