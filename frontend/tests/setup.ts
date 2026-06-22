/**
 * Jest Setup File
 * Configure environment variables and mocks for testing
 */

import { execSync } from 'child_process';

// Set up environment variables for tests
process.env.NEXT_PUBLIC_COMPUTE_ROUTER = 'https://router-api.0g.ai/v1';
process.env.REPO_STORAGE_PATH = './storage/repos';
process.env.NEXT_PUBLIC_APP_DOMAIN = 'localhost';
process.env.PORT = '3000';
process.env.OG_COMPUTE_API_KEY = 'test-api-key';

// Mock child_process for git operations
jest.mock('child_process', () => ({
  execSync: jest.fn((command: string, options?: any) => {
    // For git operations, just return empty
    return '';
  }),
  spawn: jest.fn(() => ({
    on: jest.fn(),
    stdout: {
      on: jest.fn(),
      pipe: jest.fn()
    },
    stderr: {
      on: jest.fn(),
      pipe: jest.fn()
    },
    kill: jest.fn(),
    write: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('')
}));

// Mock path module to return test paths
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

// Global test setup
beforeAll(() => {
  console.log('Jest Setup: Initializing test environment...');
});

afterAll(() => {
  console.log('Jest Setup: Cleaning up test environment...');
  jest.restoreAllMocks();
});

// Mock console methods to prevent output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  jest.clearAllMocks();
});
