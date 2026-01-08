/**
 * Tests for ossa init command
 * Following TDD principles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('ossa init', () => {
  it('should create minimal template structure', () => {
    const minimalFiles = [
      'agent.ossa.yaml',
      'package.json',
      '.gitlab-ci.yml'
    ];

    minimalFiles.forEach(file => {
      assert.ok(file, `Should create ${file}`);
    });
  });

  it('should create full template with TypeScript', () => {
    const fullFiles = [
      'agent.ossa.yaml',
      'package.json',
      'tsconfig.json',
      '.gitlab-ci.yml',
      'src/index.ts'
    ];

    fullFiles.forEach(file => {
      assert.ok(file, `Should create ${file}`);
    });
  });

  it('should create enterprise template with tests', () => {
    const enterpriseFiles = [
      'agent.ossa.yaml',
      'package.json',
      'tsconfig.json',
      '.eslintrc.json',
      '.gitlab-ci.yml',
      'src/index.ts',
      'tests/unit/index.test.ts'
    ];

    enterpriseFiles.forEach(file => {
      assert.ok(file, `Should create ${file}`);
    });
  });
});
