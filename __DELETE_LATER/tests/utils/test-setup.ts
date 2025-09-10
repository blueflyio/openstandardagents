import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';

export function setupTestEnvironment() {
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://localhost:4000';
    process.env.TEST_API_KEY = 'test-api-key';
    
    // Ensure clean test database/state
    try {
      execSync('npm run test:clean', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Test cleanup command not available');
    }
    
    // Wait for services to be ready
    await waitForServices();
  });

  afterAll(async () => {
    // Clean up after tests
    try {
      execSync('npm run test:cleanup', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Test cleanup command not available');
    }
  });

  beforeEach(async () => {
    // Reset state before each test
    await resetTestState();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });
}

async function waitForServices(maxAttempts = 10, delay = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = execSync('npx tsx cli/src/index.ts services health', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      if (result.includes('healthy')) {
        console.log('Services are ready');
        return;
      }
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Services not ready yet`);
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Services failed to start within timeout');
}

async function resetTestState(): Promise<void> {
  // Reset any global test state
  console.log('Resetting test state');
}

async function cleanupTestData(): Promise<void> {
  // Clean up any test data created during the test
  try {
    execSync('npx tsx cli/src/index.ts agents list --format=json', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    // Additional cleanup logic here
  } catch (error) {
    // Ignore cleanup errors in tests
  }
}

export const testConfig = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  apiKey: process.env.TEST_API_KEY || 'test-api-key',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retries: parseInt(process.env.TEST_RETRIES || '2')
};