/**
 * Basic OSSA v0.1.9 Specification Tests
 * Verify specification package integrity
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

describe('OSSA v0.1.2 Specification Package', () => {
  test('package.json version should be 0.1.2', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBe('0.1.2');
    expect(packageJson.name).toBe('@bluefly/open-standards-scalable-agents');
    expect(packageJson.description).toContain('Open Standards for Scalable Agents Specification');
  });

  test('specification files should exist', () => {
    const specFiles = [
      '../src/api/core/acdl-specification.openapi.yml',
      '../src/api/core/ossa-complete.openapi.yml',
      '../src/api/core/specification.openapi.yml',
      '../src/api/core/voice-agent.openapi.yml',
      '../src/api/project/orchestration.openapi.yml',
      '../src/api/schemas/agent-manifest.schema.json',
      '../src/api/schemas/workflow.schema.json'
    ];

    specFiles.forEach((file) => {
      const filePath = resolve(__dirname, file);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  test('TypeScript compilation should work', () => {
    const distTypesPath = resolve(__dirname, '../dist/types/index.js');
    expect(existsSync(distTypesPath)).toBe(true);

    const distTypesDefPath = resolve(__dirname, '../dist/types/index.d.ts');
    expect(existsSync(distTypesDefPath)).toBe(true);
  });

  test('compiled exports should have correct structure', () => {
    const distIndexPath = resolve(__dirname, '../dist/types/index.js');
    const indexContent = require('fs').readFileSync(distIndexPath, 'utf8');

    // Verify key exports are present in compiled types
    expect(indexContent).toContain('export');
    expect(indexContent).toContain('AgentType');
    expect(indexContent).toContain('AgentStatus');
  });

  test('should contain specification and limited implementation', () => {
    // OSSA contains specifications AND some core implementation for validation
    const requiredDirs = ['../src/api', '../src/types'];
    const allowedDirs = ['../src/cli', '../src/core', '../src/mcp'];

    requiredDirs.forEach((dir) => {
      const dirPath = resolve(__dirname, dir);
      expect(existsSync(dirPath)).toBe(true);
    });

    // Verify key implementation directories exist (this is a working specification with tools)
    allowedDirs.forEach((dir) => {
      const dirPath = resolve(__dirname, dir);
      // These may exist as part of the specification tooling
      if (existsSync(dirPath)) {
        console.log(`✓ Implementation directory exists: ${dir}`);
      }
    });
  });
});
