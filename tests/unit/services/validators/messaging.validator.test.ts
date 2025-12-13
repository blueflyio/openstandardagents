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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
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

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.2.9'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate reliability config', () => {
      const messaging = {
        reliability: {
          deliveryGuarantee: 'invalid-guarantee' as any,
        },
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate multiple publishes channels', () => {
      const messaging = {
        publishes: [
          {
            channel: 'valid.channel.one',
            schema: { type: 'object' },
          },
          {
            channel: 'valid.channel.two',
            schema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate multiple subscribes channels', () => {
      const messaging = {
        subscribes: [
          {
            channel: 'event.one',
            handler: 'handleOne',
          },
          {
            channel: 'event.two',
            handler: 'handleTwo',
            priority: 'high',
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate multiple commands', () => {
      const messaging = {
        commands: [
          {
            name: 'command_one',
            inputSchema: { type: 'object' },
            outputSchema: { type: 'object' },
          },
          {
            name: 'command_two',
            inputSchema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate empty messaging config', () => {
      const messaging = {};

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate subscribes with all priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'critical'];

      for (const priority of priorities) {
        const messaging = {
          subscribes: [
            {
              channel: 'test.channel',
              handler: 'handler',
              priority,
            },
          ],
        };

        const errors = validator.validateMessagingExtension(
          messaging,
          'ossa/v0.3.0'
        );
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate command with valid timeout', () => {
      const messaging = {
        commands: [
          {
            name: 'test_command',
            inputSchema: { type: 'object' },
            timeoutSeconds: 300,
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate reliability with valid delivery guarantees', () => {
      const guarantees = ['at-most-once', 'at-least-once', 'exactly-once'];

      for (const guarantee of guarantees) {
        const messaging = {
          reliability: {
            deliveryGuarantee: guarantee,
          },
        };

        const errors = validator.validateMessagingExtension(
          messaging,
          'ossa/v0.3.0'
        );
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle publish with complex schema', () => {
      const messaging = {
        publishes: [
          {
            channel: 'complex.event',
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    nested: { type: 'number' },
                  },
                },
              },
              required: ['id'],
            },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should handle command with complex input and output schemas', () => {
      const messaging = {
        commands: [
          {
            name: 'complex_command',
            inputSchema: {
              type: 'object',
              properties: {
                input: { type: 'string' },
              },
              required: ['input'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                result: { type: 'boolean' },
              },
            },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should reject channel with multiple reserved prefixes', () => {
      const reserved = ['ossa.', 'system.', 'internal.'];

      for (const prefix of reserved) {
        const messaging = {
          publishes: [
            {
              channel: `${prefix}test`,
              schema: { type: 'object' },
            },
          ],
        };

        const errors = validator.validateMessagingExtension(
          messaging,
          'ossa/v0.3.0'
        );
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate channel with dots in the name', () => {
      const messaging = {
        publishes: [
          {
            channel: 'my.app.events.user.created',
            schema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate command with underscores in the name', () => {
      const messaging = {
        commands: [
          {
            name: 'my_command_name',
            inputSchema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate subscribes without priority (uses default)', () => {
      const messaging = {
        subscribes: [
          {
            channel: 'test.channel',
            handler: 'handleEvent',
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate command without timeout (uses default)', () => {
      const messaging = {
        commands: [
          {
            name: 'test_command',
            inputSchema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });

    it('should validate command without output schema', () => {
      const messaging = {
        commands: [
          {
            name: 'void_command',
            inputSchema: { type: 'object' },
          },
        ],
      };

      const errors = validator.validateMessagingExtension(
        messaging,
        'ossa/v0.3.0'
      );
      expect(errors).toHaveLength(0);
    });
  });
});
