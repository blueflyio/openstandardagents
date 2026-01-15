import { describe, it, expect, beforeEach } from '@jest/globals';
import { DependenciesValidator } from '../../../src/services/validators/dependencies.validator.js';
import type {
  AgentManifest,
  AgentDependency,
  ValidationResult,
  DependencyConflict,
  CircularDependency,
} from '../../../src/services/validators/dependencies.validator.js';

describe('DependenciesValidator', () => {
  let validator: DependenciesValidator;

  beforeEach(() => {
    validator = new DependenciesValidator();
  });

  describe('validateDependencies', () => {
    it('should return valid for manifests with no dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.contractViolations).toHaveLength(0);
    });

    it('should return valid for manifests with compatible dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b', version: '1.2.0' },
          spec: {},
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.contractViolations).toHaveLength(0);
    });

    it('should detect version conflicts', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^2.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'shared-dep', version: '1.5.0' },
          spec: {},
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].dependency).toBe('shared-dep');
    });

    it('should detect circular dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(false);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
    });

    it('should detect missing required dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'missing-agent',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(false);
      expect(result.missingDependencies).toHaveLength(1);
      expect(result.missingDependencies[0].agent).toBe('agent-a');
      expect(result.missingDependencies[0].dependency).toBe('missing-agent');
    });

    it('should not flag missing optional dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'optional-agent',
                  version: '^1.0.0',
                  required: false,
                },
              ],
            },
          },
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(true);
      expect(result.missingDependencies).toHaveLength(0);
    });

    it('should detect contract violations for missing events', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created', 'user.updated'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [{ channel: 'user.created' }],
            },
          },
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(false);
      expect(result.contractViolations.length).toBeGreaterThan(0);
      expect(result.contractViolations[0].violation).toContain('user.updated');
    });

    it('should validate all contract events are published', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created', 'user.updated'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [
                { channel: 'user.created' },
                { channel: 'user.updated' },
              ],
            },
          },
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(true);
      expect(result.contractViolations).toHaveLength(0);
    });

    it('should handle empty manifests array', () => {
      const manifests: AgentManifest[] = [];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.contractViolations).toHaveLength(0);
    });

    it('should detect all types of issues simultaneously', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
                {
                  name: 'missing-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
                {
                  name: 'shared-dep',
                  version: '^2.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'shared-dep', version: '1.5.0' },
          spec: {},
        },
      ];

      const result = validator.validateDependencies(manifests);

      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
      expect(result.missingDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('detectVersionConflicts', () => {
    it('should return no conflicts for compatible versions', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.2.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts between major versions', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^2.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].dependency).toBe('shared-dep');
      expect(conflicts[0].conflictingVersions).toHaveLength(2);
    });

    it('should detect conflicts with exact versions', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '2.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should handle multiple conflicting versions', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^2.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^3.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictingVersions).toHaveLength(3);
    });

    it('should handle invalid semver ranges', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: 'invalid-version',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should allow same version constraints', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.2.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '^1.2.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle tilde range compatibility', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '~1.2.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'shared-dep',
                  version: '~1.2.3',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const conflicts = (validator as any).detectVersionConflicts(manifests);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should return no cycles for acyclic dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-c',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {},
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles).toHaveLength(0);
    });

    it('should detect simple 2-node cycle', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].cycle.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect 3-node cycle', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-c',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].cycle.length).toBeGreaterThanOrEqual(4);
    });

    it('should detect self-referencing cycle', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should detect multiple independent cycles', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-a',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-d',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-d' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-c',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex dependency graphs without cycles', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                { name: 'agent-b', version: '^1.0.0', required: true },
                { name: 'agent-c', version: '^1.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-d', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-d', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-d' },
          spec: {},
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles).toHaveLength(0);
    });

    it('should handle agents with no dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const cycles = (validator as any).detectCircularDependencies(manifests);

      expect(cycles).toHaveLength(0);
    });
  });

  describe('detectMissingDependencies', () => {
    it('should return no missing deps when all required deps exist', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(0);
    });

    it('should detect single missing required dependency', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'missing-agent',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(1);
      expect(missing[0].agent).toBe('agent-a');
      expect(missing[0].dependency).toBe('missing-agent');
    });

    it('should detect multiple missing dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'missing-1',
                  version: '^1.0.0',
                  required: true,
                },
                {
                  name: 'missing-2',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(2);
    });

    it('should ignore optional missing dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'optional-missing',
                  version: '^1.0.0',
                  required: false,
                },
              ],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(0);
    });

    it('should handle mix of found and missing dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
                {
                  name: 'missing-agent',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(1);
      expect(missing[0].dependency).toBe('missing-agent');
    });

    it('should handle agents with no dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(0);
    });

    it('should handle agents with empty dependencies array', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const missing = (validator as any).detectMissingDependencies(
        manifests,
        agentRegistry
      );

      expect(missing).toHaveLength(0);
    });
  });

  describe('detectContractViolations', () => {
    it('should return no violations when contract is satisfied', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [{ channel: 'user.created' }],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(0);
    });

    it('should detect missing published event', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created', 'user.deleted'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [{ channel: 'user.created' }],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(1);
      expect(violations[0].agent).toBe('agent-a');
      expect(violations[0].dependency).toBe('agent-b');
      expect(violations[0].violation).toContain('user.deleted');
    });

    it('should detect multiple missing events', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created', 'user.updated', 'user.deleted'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [{ channel: 'user.created' }],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(2);
    });

    it('should ignore dependencies without contracts', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(0);
    });

    it('should handle missing target agent', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'missing-agent',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
              ],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(0);
    });

    it('should handle target agent with no messaging', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(1);
    });

    it('should handle target agent with empty publishes', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(1);
    });

    it('should validate contract with multiple dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
                {
                  name: 'agent-c',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['order.placed'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [{ channel: 'user.created' }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            messaging: {
              publishes: [{ channel: 'order.placed' }],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(0);
    });

    it('should validate extra published events are allowed', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                  contract: {
                    publishes: ['user.created'],
                  },
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            messaging: {
              publishes: [
                { channel: 'user.created' },
                { channel: 'user.updated' },
                { channel: 'user.deleted' },
              ],
            },
          },
        },
      ];

      const agentRegistry = new Map(manifests.map((m) => [m.metadata.name, m]));
      const violations = (validator as any).detectContractViolations(
        manifests,
        agentRegistry
      );

      expect(violations).toHaveLength(0);
    });
  });

  describe('generateDependencyGraph', () => {
    it('should generate DOT format for empty manifests', () => {
      const manifests: AgentManifest[] = [];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('digraph AgentDependencies');
      expect(dot).toContain('rankdir=LR');
      expect(dot).toContain('node [shape=box');
    });

    it('should generate DOT format for single agent', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('digraph AgentDependencies');
    });

    it('should include dependency edges with versions', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: true,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('"agent-a" -> "agent-b"');
      expect(dot).toContain('^1.0.0');
      expect(dot).toContain('style=solid');
    });

    it('should use dashed lines for optional dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                {
                  name: 'agent-b',
                  version: '^1.0.0',
                  required: false,
                },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('style=dashed');
      expect(dot).toContain('color=gray');
    });

    it('should generate graph with multiple dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                { name: 'agent-b', version: '^1.0.0', required: true },
                { name: 'agent-c', version: '^2.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {},
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('"agent-a" -> "agent-b"');
      expect(dot).toContain('"agent-a" -> "agent-c"');
    });

    it('should handle complex dependency graphs', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-b', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-c', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {},
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot).toContain('"agent-a" -> "agent-b"');
      expect(dot).toContain('"agent-b" -> "agent-c"');
    });

    it('should properly format DOT output', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-b', version: '^1.0.0', required: true }],
            },
          },
        },
      ];

      const dot = validator.generateDependencyGraph(manifests);

      expect(dot.startsWith('digraph AgentDependencies {')).toBe(true);
      expect(dot.endsWith('}\n')).toBe(true);
    });
  });

  describe('calculateDeploymentOrder', () => {
    it('should return single batch for independent agents', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order).toHaveLength(1);
      expect(order[0]).toHaveLength(2);
      expect(order[0]).toContain('agent-a');
      expect(order[0]).toContain('agent-b');
    });

    it('should order linear dependency chain', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-b', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-c', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order).toHaveLength(3);
      expect(order[0]).toContain('agent-c');
      expect(order[1]).toContain('agent-b');
      expect(order[2]).toContain('agent-a');
    });

    it('should create parallel batches for independent branches', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                { name: 'shared-dep', version: '^1.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [
                { name: 'shared-dep', version: '^1.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'shared-dep' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order).toHaveLength(2);
      expect(order[0]).toContain('shared-dep');
      expect(order[1]).toHaveLength(2);
      expect(order[1]).toContain('agent-a');
      expect(order[1]).toContain('agent-b');
    });

    it('should throw error for circular dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-b', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-a', version: '^1.0.0', required: true }],
            },
          },
        },
      ];

      expect(() => {
        validator.calculateDeploymentOrder(manifests);
      }).toThrow('Circular dependency detected');
    });

    it('should handle diamond dependency pattern', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {
            dependencies: {
              agents: [
                { name: 'agent-b', version: '^1.0.0', required: true },
                { name: 'agent-c', version: '^1.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-d', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {
            dependencies: {
              agents: [{ name: 'agent-d', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-d' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order[0]).toContain('agent-d');
      expect(order[order.length - 1]).toContain('agent-a');
    });

    it('should handle empty manifest list', () => {
      const manifests: AgentManifest[] = [];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order).toHaveLength(0);
    });

    it('should handle complex multi-level dependencies', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'level-3' },
          spec: {
            dependencies: {
              agents: [
                { name: 'level-2-a', version: '^1.0.0', required: true },
                { name: 'level-2-b', version: '^1.0.0', required: true },
              ],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'level-2-a' },
          spec: {
            dependencies: {
              agents: [{ name: 'level-1', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'level-2-b' },
          spec: {
            dependencies: {
              agents: [{ name: 'level-1', version: '^1.0.0', required: true }],
            },
          },
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'level-1' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      expect(order[0]).toContain('level-1');
      expect(order[order.length - 1]).toContain('level-3');
      const batch2 = order[1];
      expect(batch2).toContain('level-2-a');
      expect(batch2).toContain('level-2-b');
    });

    it('should return all agents in deployment order', () => {
      const manifests: AgentManifest[] = [
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-a' },
          spec: {},
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-b' },
          spec: {},
        },
        {
          apiVersion: 'ossa/v0.3.3',
          kind: 'Agent',
          metadata: { name: 'agent-c' },
          spec: {},
        },
      ];

      const order = validator.calculateDeploymentOrder(manifests);

      const allAgents = order.flat();
      expect(allAgents).toHaveLength(3);
      expect(allAgents).toContain('agent-a');
      expect(allAgents).toContain('agent-b');
      expect(allAgents).toContain('agent-c');
    });
  });
});
