/**
 * Basic OSSA v0.1.9 Specification Tests
 * Verify specification package integrity
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

describe('OSSA v0.1.9 Specification Package', () => {
  test('package.json version should be 0.1.9', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBe('0.1.9');
    expect(packageJson.name).toBe('@bluefly/open-standards-scalable-agents');
    expect(packageJson.description).toContain('Pure Specification Standard');
  });

  test('specification files should exist', () => {
    const specFiles = [
      '../src/api/acdl-specification.yml',
      '../src/api/orchestration.openapi.yml', 
      '../src/api/specification.openapi.yml',
      '../src/api/voice-agent-specification.yml',
      '../src/api/agent-manifest.schema.json',
      '../src/api/workflow.schema.json'
    ];

    specFiles.forEach(file => {
      const filePath = resolve(__dirname, file);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  test('TypeScript compilation should work', () => {
    const distIndexPath = resolve(__dirname, '../dist/index.js');
    expect(existsSync(distIndexPath)).toBe(true);
    
    const distTypesPath = resolve(__dirname, '../dist/index.d.ts');
    expect(existsSync(distTypesPath)).toBe(true);
  });

  test('compiled exports should have correct structure', () => {
    const distIndexPath = resolve(__dirname, '../dist/index.js');
    const indexContent = require('fs').readFileSync(distIndexPath, 'utf8');
    
    // Verify key exports are present
    expect(indexContent).toContain('OSSA_VERSION');
    expect(indexContent).toContain('SPECIFICATION_VERSION');
    expect(indexContent).toContain('SPECIFICATION_FILES');
    expect(indexContent).toContain('PROJECT_URLS');
    expect(indexContent).toContain('IMPLEMENTATION_REFS');
    expect(indexContent).toContain('0.1.9');
  });

  test('should not contain implementation code', () => {
    // Verify no implementation directories exist
    const implDirs = ['../src/cli', '../src/core', '../src/mcp-server', '../src/agents'];
    
    implDirs.forEach(dir => {
      const dirPath = resolve(__dirname, dir);
      expect(existsSync(dirPath)).toBe(false);
    });
  });
});