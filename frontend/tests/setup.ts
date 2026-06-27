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
