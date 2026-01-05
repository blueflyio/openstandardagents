/**
 * Tests for bot-security-scanner
 * Following TDD principles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('bot-security-scanner', () => {
  it('should detect secrets in code', () => {
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
      /secret\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
      /glpat-[a-zA-Z0-9_-]+/i
    ];

    const codeWithSecrets = [
      'const api_key = "glpat-1234567890abcdef"',
      'secret: "my-super-secret-key-12345"',
      'API_KEY=sk-ant-abcdef123456'
    ];

    const codeWithoutSecrets = [
      'const apiKey = process.env.API_KEY',
      'const secret = getSecret()',
      'API_KEY=${API_KEY}'
    ];

    codeWithSecrets.forEach(code => {
      const hasSecret = secretPatterns.some(pattern => pattern.test(code));
      assert.ok(hasSecret, `Should detect secret in: ${code}`);
    });

    codeWithoutSecrets.forEach(code => {
      const hasSecret = secretPatterns.some(pattern => pattern.test(code));
      assert.ok(!hasSecret, `Should not detect secret in: ${code}`);
    });
  });

  it('should detect code injection risks', () => {
    const injectionPatterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /Function\s*\(/i,
      /innerHTML\s*=/
    ];

    const riskyCode = [
      'eval(userInput)',
      'exec(command)',
      'element.innerHTML = data',
      'new Function(code)'
    ];

    const safeCode = [
      'evaluateExpression(expr)',
      'executeCommand(cmd)',
      'element.textContent = data',
      'function parse() {}'
    ];

    riskyCode.forEach(code => {
      const hasRisk = injectionPatterns.some(pattern => pattern.test(code));
      assert.ok(hasRisk, `Should detect injection risk in: ${code}`);
    });

    safeCode.forEach(code => {
      const hasRisk = injectionPatterns.some(pattern => pattern.test(code));
      assert.ok(!hasRisk, `Should not detect injection risk in: ${code}`);
    });
  });
});
