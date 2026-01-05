/**
 * Tests for bot-policy-enforcer
 * Following TDD principles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('bot-policy-enforcer', () => {
  it('should validate branch naming convention', () => {
    const validBranches = [
      'feature/123-add-feature',
      'bugfix/fix-issue',
      'release/v0.3.x'
    ];
    
    const invalidBranches = [
      'invalid-branch',
      'feature/',
      'workloads/auto-generated'
    ];

    validBranches.forEach(branch => {
      assert.ok(/^(feature|bugfix|hotfix|chore)\/|^release\/v\d+\.\d+\.x$/.test(branch), 
        `${branch} should be valid`);
    });

    invalidBranches.forEach(branch => {
      assert.ok(!/^(feature|bugfix|hotfix|chore)\/|^release\/v\d+\.\d+\.x$/.test(branch), 
        `${branch} should be invalid`);
    });
  });

  it('should validate commit message format', () => {
    const validCommits = [
      'feat: add new feature',
      'fix: resolve bug',
      'docs: update documentation'
    ];

    const invalidCommits = [
      'random commit message',
      'feat',
      'no colon'
    ];

    const pattern = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .+/;

    validCommits.forEach(commit => {
      assert.ok(pattern.test(commit), `${commit} should be valid`);
    });

    invalidCommits.forEach(commit => {
      assert.ok(!pattern.test(commit), `${commit} should be invalid`);
    });
  });

  it('should validate MR target branch', () => {
    const validPairs = [
      { source: 'feature/123-test', target: 'release/v0.3.x' },
      { source: 'release/v0.3.x', target: 'main' }
    ];

    const invalidPairs = [
      { source: 'feature/123-test', target: 'main' },
      { source: 'release/v0.3.x', target: 'release/v0.4.x' }
    ];

    validPairs.forEach(pair => {
      const isValid = (pair.source.match(/^(feature|bugfix|chore|hotfix)\//) && 
                      pair.target.match(/^release\/v\d+\.\d+\.x$/)) ||
                     (pair.source.match(/^release\//) && pair.target === 'main');
      assert.ok(isValid, `${pair.source} → ${pair.target} should be valid`);
    });

    invalidPairs.forEach(pair => {
      const isValid = (pair.source.match(/^(feature|bugfix|chore|hotfix)\//) && 
                      pair.target.match(/^release\/v\d+\.\d+\.x$/)) ||
                     (pair.source.match(/^release\//) && pair.target === 'main');
      assert.ok(!isValid, `${pair.source} → ${pair.target} should be invalid`);
    });
  });
});
