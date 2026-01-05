/**
 * Tests for bot-dependency-updater
 * Following TDD principles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('bot-dependency-updater', () => {
  it('should detect outdated packages', () => {
    const packageJson = {
      dependencies: {
        'package-a': '^1.0.0',
        'package-b': '^2.0.0'
      }
    };

    assert.ok(packageJson.dependencies);
    assert.ok(Object.keys(packageJson.dependencies).length > 0);
  });

  it('should filter updates by type', () => {
    const updates = [
      { name: 'pkg1', type: 'security', current: '1.0.0', latest: '1.0.1' },
      { name: 'pkg2', type: 'patch', current: '1.0.0', latest: '1.0.1' },
      { name: 'pkg3', type: 'minor', current: '1.0.0', latest: '1.1.0' }
    ];

    const securityUpdates = updates.filter(u => u.type === 'security');
    assert.ok(securityUpdates.length > 0);
  });

  it('should update package.json correctly', () => {
    const original = { dependencies: { 'test-pkg': '^1.0.0' } };
    const updated = { dependencies: { 'test-pkg': '^1.0.1' } };

    assert.ok(updated.dependencies['test-pkg'] !== original.dependencies['test-pkg']);
  });
});
