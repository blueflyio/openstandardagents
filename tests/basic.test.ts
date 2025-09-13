/**
 * Basic OSSA v0.1.9 Tests
 * Verify core functionality for release
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

describe('OSSA v0.1.9 Basic Functionality', () => {
  test('package.json version should be 0.1.9', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBe('0.1.9');
  });

  test('TypeScript compilation should work', () => {
    // Test that compiled files exist
    const distIndexPath = resolve(__dirname, '../dist/index.js');
    expect(existsSync(distIndexPath)).toBe(true);
  });

  test('CLI should be exportable', () => {
    const cliPath = resolve(__dirname, '../dist/cli/index.js');
    expect(existsSync(cliPath)).toBe(true);
  });

  test('Types should be available', () => {
    const typesPath = resolve(__dirname, '../dist/types/index.js');
    expect(existsSync(typesPath)).toBe(true);
  });
});