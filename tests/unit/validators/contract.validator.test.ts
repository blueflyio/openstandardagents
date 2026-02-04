import { describe, it, expect, beforeEach } from '@jest/globals';
import { ContractValidator } from '../../../src/services/validators/contract.validator.js';

describe('ContractValidator', () => {
  let validator: ContractValidator;

  beforeEach(() => {
    validator = new ContractValidator();
  });

  describe('validateAgentContract', () => {
    it('should return valid for agent with valid contract', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'test.event',
                description: 'Test event',
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                  required: ['message'],
                },
                examples: [{ message: 'Hello World' }],
              },
            ],
            commands: [
              {
                name: 'test.command',
                description: 'Test command',
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
                    result: { type: 'string' },
                  },
                },
              },
            ],
          },
        },
      };

      const result = validator.validateAgentContract(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing published events at runtime', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'declared.event',
                schema: { type: 'object' },
              },
            ],
          },
        },
      };

      const runtimeEvents = ['other.event']; // Not publishing declared event

      const result = validator.validateAgentContract(
        manifest,
        runtimeEvents,
        []
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('missing_event');
      expect(result.errors[0].message).toContain('declared.event');
    });

    it('should warn about undeclared published events', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          messaging: {
            publishes: [],
          },
        },
      };

      const runtimeEvents = ['undeclared.event'];

      const result = validator.validateAgentContract(
        manifest,
        runtimeEvents,
        []
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('undeclared.event');
    });

    it('should detect missing commands at runtime', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          messaging: {
            commands: [
              {
                name: 'declared.command',
                inputSchema: { type: 'object' },
              },
            ],
          },
        },
      };

      const runtimeCommands = ['other.command']; // Not exposing declared command

      const result = validator.validateAgentContract(
        manifest,
        [],
        runtimeCommands
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('missing_command');
      expect(result.errors[0].message).toContain('declared.command');
    });

    it('should detect invalid event schemas', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'test.event',
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                  },
                  required: ['value'],
                },
                examples: [
                  { value: 123 }, // Wrong type
                ],
              },
            ],
          },
        },
      };

      const result = validator.validateAgentContract(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'schema_mismatch')).toBe(
        true
      );
    });

    it('should warn about missing schemas', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'test.event',
                // No schema
              },
            ],
            commands: [
              {
                name: 'test.command',
                // No inputSchema
              },
            ],
          },
        },
      };

      const result = validator.validateAgentContract(manifest);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('no schema'))).toBe(true);
    });

    it('should handle agent with no messaging configuration', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {},
      };

      const result = validator.validateAgentContract(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('no messaging configuration');
    });
  });

  describe('testContractBetweenAgents', () => {
    it('should validate compatible contracts', () => {
      const consumer = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'consumer' },
        spec: {
          messaging: {
            subscribes: [
              {
                channel: 'data.updated',
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                },
              },
            ],
          },
        },
      };

      const provider = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'provider' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'data.updated',
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    timestamp: { type: 'number' },
                  },
                  required: ['id'],
                },
              },
            ],
          },
        },
      };

      const result = validator.testContractBetweenAgents(consumer, provider);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing published channels', () => {
      const consumer = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'consumer' },
        spec: {
          messaging: {
            subscribes: [
              {
                channel: 'missing.channel',
              },
            ],
          },
        },
      };

      const provider = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'provider' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'other.channel',
                schema: { type: 'object' },
              },
            ],
          },
        },
      };

      const result = validator.testContractBetweenAgents(consumer, provider);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('missing.channel'))).toBe(
        true
      );
    });

    it('should detect schema incompatibility', () => {
      const consumer = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'consumer' },
        spec: {
          messaging: {
            subscribes: [
              {
                channel: 'data.event',
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                  },
                  required: ['value'],
                },
              },
            ],
          },
        },
      };

      const provider = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'provider' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'data.event',
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' }, // Incompatible type
                  },
                  required: ['value'],
                },
              },
            ],
          },
        },
      };

      const result = validator.testContractBetweenAgents(consumer, provider);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'schema_mismatch')).toBe(
        true
      );
    });

    it('should detect missing expected commands', () => {
      const consumer = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'consumer' },
        spec: {
          dependencies: {
            agents: [
              {
                name: 'provider',
                version: '^1.0.0',
                required: true,
                contract: {
                  commands: ['execute.task'],
                },
              },
            ],
          },
          messaging: {
            subscribes: [],
          },
        },
      };

      const provider = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'provider' },
        spec: {
          messaging: {
            commands: [
              {
                name: 'other.task',
                inputSchema: { type: 'object' },
              },
            ],
          },
        },
      };

      const result = validator.testContractBetweenAgents(consumer, provider);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'missing_command')).toBe(
        true
      );
      expect(
        result.errors.some((e) => e.message.includes('execute.task'))
      ).toBe(true);
    });

    it('should handle agents with no messaging configuration', () => {
      const consumer = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'consumer' },
        spec: {},
      };

      const provider = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'provider' },
        spec: {},
      };

      const result = validator.testContractBetweenAgents(consumer, provider);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('detectBreakingChanges', () => {
    it('should detect no breaking changes for compatible versions', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'data.event',
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                  required: ['id'],
                },
              },
            ],
            commands: [
              {
                name: 'process.data',
                inputSchema: {
                  type: 'object',
                  properties: {
                    data: { type: 'string' },
                  },
                  required: ['data'],
                },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '1.1.0' },
        spec: {
          messaging: {
            publishes: [
              ...oldManifest.spec.messaging.publishes,
              {
                channel: 'new.event', // Added event (non-breaking)
                schema: { type: 'object' },
              },
            ],
            commands: oldManifest.spec.messaging.commands,
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.hasBreakingChanges).toBe(false);
      expect(result.summary.major).toBe(0);
    });

    it('should detect removed event as breaking change', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'removed.event',
                schema: { type: 'object' },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '2.0.0' },
        spec: {
          messaging: {
            publishes: [], // Event removed
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.hasBreakingChanges).toBe(true);
      expect(result.summary.major).toBeGreaterThan(0);
      expect(result.changes.some((c) => c.type === 'removed_event')).toBe(true);
      expect(result.changes.some((c) => c.resource === 'removed.event')).toBe(
        true
      );
    });

    it('should detect removed command as breaking change', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            commands: [
              {
                name: 'old.command',
                inputSchema: { type: 'object' },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '2.0.0' },
        spec: {
          messaging: {
            commands: [], // Command removed
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.hasBreakingChanges).toBe(true);
      expect(result.changes.some((c) => c.type === 'removed_command')).toBe(
        true
      );
      expect(result.changes.some((c) => c.resource === 'old.command')).toBe(
        true
      );
    });

    it('should detect incompatible schema change as breaking', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'data.event',
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                  },
                },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '2.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'data.event',
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' }, // Type changed
                  },
                },
              },
            ],
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.hasBreakingChanges).toBe(true);
      expect(result.changes.some((c) => c.type === 'schema_incompatible')).toBe(
        true
      );
    });

    it('should detect new required field as breaking change', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            commands: [
              {
                name: 'process',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                  required: ['id'],
                },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '2.0.0' },
        spec: {
          messaging: {
            commands: [
              {
                name: 'process',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    newField: { type: 'string' },
                  },
                  required: ['id', 'newField'], // New required field
                },
              },
            ],
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.hasBreakingChanges).toBe(true);
      expect(result.changes.some((c) => c.type === 'signature_changed')).toBe(
        true
      );
    });

    it('should throw error when comparing different agents', () => {
      const manifest1 = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'agent-a', version: '1.0.0' },
        spec: {},
      };

      const manifest2 = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'agent-b', version: '1.0.0' },
        spec: {},
      };

      expect(() => {
        validator.detectBreakingChanges(manifest1, manifest2);
      }).toThrow('Cannot compare different agents');
    });

    it('should summarize breaking changes correctly', () => {
      const oldManifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              { channel: 'event1', schema: { type: 'object' } },
              { channel: 'event2', schema: { type: 'object' } },
            ],
            commands: [
              {
                name: 'cmd1',
                inputSchema: { type: 'object' },
                outputSchema: {
                  type: 'object',
                  properties: { result: { type: 'string' } },
                },
              },
            ],
          },
        },
      };

      const newManifest = {
        ...oldManifest,
        metadata: { ...oldManifest.metadata, version: '2.0.0' },
        spec: {
          messaging: {
            publishes: [
              { channel: 'event1', schema: { type: 'object' } }, // event2 removed
            ],
            commands: [
              {
                name: 'cmd1',
                inputSchema: { type: 'object' },
                outputSchema: {
                  type: 'array', // Output changed (minor)
                },
              },
            ],
          },
        },
      };

      const result = validator.detectBreakingChanges(oldManifest, newManifest);

      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.major).toBeGreaterThan(0);
      expect(result.changes.length).toBe(result.summary.total);
    });
  });

  describe('extractContract', () => {
    it('should extract complete contract', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {
          messaging: {
            publishes: [
              {
                channel: 'test.event',
                description: 'Test event',
                schema: { type: 'object' },
              },
            ],
            subscribes: [
              {
                channel: 'input.event',
                description: 'Input event',
              },
            ],
            commands: [
              {
                name: 'test.command',
                description: 'Test command',
                inputSchema: { type: 'object' },
              },
            ],
          },
        },
      };

      const contract = validator.extractContract(manifest);

      expect(contract.name).toBe('test-agent');
      expect(contract.version).toBe('1.0.0');
      expect(contract.publishes).toHaveLength(1);
      expect(contract.subscribes).toHaveLength(1);
      expect(contract.commands).toHaveLength(1);
    });

    it('should handle agent with no messaging', () => {
      const manifest = {
        apiVersion: 'ossa/v0.4.1',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: {},
      };

      const contract = validator.extractContract(manifest);

      expect(contract.name).toBe('test-agent');
      expect(contract.publishes).toHaveLength(0);
      expect(contract.subscribes).toHaveLength(0);
      expect(contract.commands).toHaveLength(0);
    });
  });

  describe('validateAllContracts', () => {
    it('should validate multiple agents', () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            messaging: {
              publishes: [
                {
                  channel: 'test.event',
                  schema: { type: 'object' },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              commands: [
                {
                  name: 'test.command',
                  inputSchema: { type: 'object' },
                },
              ],
            },
          },
        },
      ];

      const result = validator.validateAllContracts(manifests);

      expect(result.valid).toBe(true);
    });

    it('should aggregate errors from multiple agents', () => {
      const manifests = [
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            messaging: {
              publishes: [
                {
                  channel: 'test.event',
                  schema: { type: 'invalid' }, // Invalid schema
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.4.1',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              commands: [
                {
                  name: 'test.command',
                  inputSchema: { type: 'invalid' }, // Invalid schema
                },
              ],
            },
          },
        },
      ];

      const result = validator.validateAllContracts(manifests);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
