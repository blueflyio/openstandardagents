import { describe, test, expect } from '@jest/globals';

describe('OSSA v0.1.9 Specification Package', () => {
  test('package.json version should be 0.1.9', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBe('0.1.9');
    expect(packageJson.name).toBe('@bluefly/open-standards-scalable-agents');
    expect(packageJson.description).toContain('Open Standards for Scalable Agents Specification');
  });

  test('should have required implementation directories', () => {
    const fs = require('fs');
    const path = require('path');
    
    const requiredDirs = [
      path.join(__dirname, '../src/cli'),
      path.join(__dirname, '../src/core'),
      path.join(__dirname, '../src/mcp')
    ];
    
    requiredDirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      console.log(`${exists ? '✓' : '✗'} Implementation directory exists: ${dir.replace(process.cwd(), '')}`);
      expect(exists).toBe(true);
    });
  });
});
