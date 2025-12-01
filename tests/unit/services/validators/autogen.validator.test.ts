import { describe, it, expect, beforeEach } from '@jest/globals';
import { AutoGenValidator } from '../../../../src/services/validators/autogen.validator.js';

describe('AutoGenValidator', () => {
  let validator: AutoGenValidator;

  beforeEach(() => {
    validator = new AutoGenValidator();
  });

  describe('validate', () => {
    it('should validate manifest without autogen extension', () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.8',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' }
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate with disabled autogen', () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.8',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
        extensions: { autogen: { enabled: false } }
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });

    it('should validate with valid autogen config', () => {
      const manifest = {
        apiVersion: 'ossa/v0.2.8',
        kind: 'Agent',
        metadata: { name: 'test', version: '1.0.0' },
        spec: { role: 'assistant' },
        extensions: {
          autogen: {
            enabled: true,
            agent_type: 'assistant'
          }
        }
      };
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });
});
