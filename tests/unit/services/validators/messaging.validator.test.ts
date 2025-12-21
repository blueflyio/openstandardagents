import { describe, it, expect } from '@jest/globals';
import { MessagingValidator } from '../../../../src/services/validators/messaging.validator.js';

describe('MessagingValidator', () => {
  const validator = new MessagingValidator();

  describe('validateMessagingExtension', () => {
    it('should return no errors for valid messaging config', () => {
      const messaging = {
        publishes: [
          {
            channel: 'security.vulnerabilities',
            schema: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
              },
            },
          },
        ],
        subscribes: [
          {
            channel: 'dependency.updates',
            handler: 'process_update',
          },
        ],
        commands: [
          {
            name: 'scan_package',
            inputSchema: {
              type: 'object',
              properties: {
                package: { type: 'string' },
              },
            },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors).toHaveLength(0);
    });

    it('should validate channel name pattern', () => {
      const messaging = {
        publishes: [
          {
            channel: 'INVALID_CHANNEL_NAME',
            schema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].path).toContain('channel');
    });

    it('should reject reserved channel prefixes', () => {
      const messaging = {
        publishes: [
          {
            channel: 'ossa.internal.channel',
            schema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('reserved prefixes');
    });

    it('should validate command name pattern', () => {
      const messaging = {
        commands: [
          {
            name: 'Invalid-Command-Name',
            inputSchema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].path).toContain('name');
    });

    it('should validate subscription priority', () => {
      const messaging = {
        subscribes: [
          {
            channel: 'test.channel',
            priority: 'invalid-priority' as any,
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate timeoutSeconds range', () => {
      const messaging = {
        commands: [
          {
            name: 'test_command',
            inputSchema: { type: 'object' },
            timeoutSeconds: 5000,
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('timeoutSeconds');
    });

    it('should skip validation for v0.2.x and earlier', () => {
      const messaging = {
        publishes: [
          {
            channel: 'INVALID',
            schema: {},
          },
        ],
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.2.9');
      expect(errors).toHaveLength(0);
    });

    it('should validate reliability config', () => {
      const messaging = {
        reliability: {
          deliveryGuarantee: 'invalid-guarantee' as any,
        },
      };

      const errors = validator.validateMessagingExtension(messaging, 'ossa/v0.3.0');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
