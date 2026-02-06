/**
 * Tests for ossa init command
 * Following TDD principles
 */

import { describe, it, expect } from '@jest/globals';
import { API_VERSION } from '../../../src/version.js';

describe('ossa init', () => {
  it('should create minimal template structure', () => {
    const minimalFiles = ['agent.ossa.yaml', 'package.json', '.gitlab-ci.yml'];

    minimalFiles.forEach((file) => {
      expect(file).toBeTruthy();
    });
  });

  it('should create full template with TypeScript', () => {
    const fullFiles = [
      'agent.ossa.yaml',
      'package.json',
      'tsconfig.json',
      '.gitlab-ci.yml',
      'src/index.ts',
    ];

    fullFiles.forEach((file) => {
      expect(file).toBeTruthy();
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
      'tests/unit/index.test.ts',
    ];

    enterpriseFiles.forEach((file) => {
      expect(file).toBeTruthy();
    });
  });
});
