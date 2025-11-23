/**
 * Cursor Validator Tests
 */

import { describe, it, expect } from '@jest/globals';
import { CursorValidator } from '../../../../src/services/validators/cursor.validator.js';

describe('CursorValidator', () => {
  const validator = new CursorValidator();

  it('should validate valid Cursor extension', () => {
    const manifest = {
      apiVersion: 'ossa/v0.2.4',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: { role: 'Test agent' },
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'composer',
          workspace_config: {
            rules_file: '.cursor/.cursorrules',
            context_files: ['src/**/*.ts'],
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid agent_type', () => {
    const manifest = {
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'invalid_type',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('agent_type');
  });

  it('should validate all agent types', () => {
    const validTypes = ['composer', 'chat', 'background', 'cloud'];

    validTypes.forEach((type) => {
      const manifest = {
        extensions: {
          cursor: {
            enabled: true,
            agent_type: type,
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should return warnings for missing best practices', () => {
    const manifest = {
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'composer',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should skip validation if extension is disabled', () => {
    const manifest = {
      extensions: {
        cursor: {
          enabled: false,
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
