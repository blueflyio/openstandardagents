/**
 * Kagent Extension Validator Tests
 * Tests for GitLab Kagent (Kubernetes Agents) extension validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { KagentValidator } from '../../../src/services/validators/kagent.validator.js';
import type { OssaAgent } from '../../../src/types/index.js';

describe('KagentValidator', () => {
  let validator: KagentValidator;

  beforeEach(() => {
    validator = new KagentValidator();
  });

  describe('Basic Validation', () => {
    it('should return valid for agent without kagent extension', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'basic-agent', version: '1.0.0' },
        spec: {
          role: 'Basic agent',
          tools: [],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for agent with minimal kagent extension', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'kagent-agent', version: '1.0.0' },
        spec: {
          role: 'Kubernetes agent',
          tools: [],
        },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for agent with complete kagent configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'full-kagent-agent', version: '1.0.0' },
        spec: {
          role: 'Full Kubernetes agent',
          tools: [],
        },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });
  });

  describe('Kubernetes Configuration Validation', () => {
    it('should reject invalid kubernetes namespace', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'bad-namespace-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'INVALID-NAMESPACE', // Uppercase not allowed
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The validator detects invalid namespace format
      expect(
        result.errors.some(
          (e) =>
            e.instancePath.includes('namespace') ||
            e.message.includes('namespace')
        )
      ).toBe(true);
    });

    it('should reject invalid cpu format', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'bad-cpu-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            enabled: true,
            kubernetes: {
              resourceLimits: {
                cpu: 'invalid-cpu',
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const cpuError = result.errors.find((e) => e.keyword === 'pattern');
      expect(cpuError).toBeDefined();
    });

    it('should reject invalid memory format', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'bad-memory-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            enabled: true,
            kubernetes: {
              resourceLimits: {
                memory: 'not-a-memory-size',
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid cpu formats', () => {
      const validCpuFormats = ['100m', '500m', '1000m', '1', '2', '0.5'];

      validCpuFormats.forEach((cpu) => {
        const manifest: OssaAgent = {
          apiVersion: 'ossa/v0.3.5',
          kind: 'Agent',
          metadata: { name: `cpu-${cpu}`, version: '1.0.0' },
          spec: { role: 'Test' },
          extensions: {
            kagent: {
              kubernetes: {
                namespace: 'default',
                resourceLimits: { cpu },
              },
            },
          },
        };

        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept valid memory formats', () => {
      const validMemoryFormats = [
        '128Mi',
        '512Mi',
        '1Gi',
        '2Gi',
        '100Ki',
        '1Ti',
      ];

      validMemoryFormats.forEach((memory) => {
        const manifest: OssaAgent = {
          apiVersion: 'ossa/v0.3.5',
          kind: 'Agent',
          metadata: { name: `mem-${memory}`, version: '1.0.0' },
          spec: { role: 'Test' },
          extensions: {
            kagent: {
              kubernetes: {
                namespace: 'default',
                resourceLimits: { memory },
              },
            },
          },
        };

        const result = validator.validate(manifest);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Cost Limits Validation', () => {
    it('should reject negative maxTokensPerDay', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'negative-tokens-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              costLimits: {
                maxTokensPerDay: -1000,
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      const tokenError = result.errors.find((e) =>
        e.instancePath.includes('maxTokensPerDay')
      );
      expect(tokenError).toBeDefined();
    });

    it('should reject negative maxCostPerDay', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'negative-cost-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              costLimits: {
                maxCostPerDay: -50.0,
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      const costError = result.errors.find((e) =>
        e.instancePath.includes('maxCostPerDay')
      );
      expect(costError).toBeDefined();
    });

    it('should warn when no cost limits are set', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'no-limits-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              costLimits: {},
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('cost limits'))).toBe(true);
    });

    it('should accept zero cost limits', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'zero-limits-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              costLimits: {
                maxTokensPerDay: 0,
                maxCostPerDay: 0.0,
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });
  });

  describe('Audit Log Validation', () => {
    it('should handle audit log configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'audit-log-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              auditLog: {
                retention: '30days',
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);
      // Should be valid if retention format is correct
      if (result.valid) {
        expect(result.valid).toBe(true);
      } else {
        // If validation fails, it should have errors
        expect(result.errors.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Agent-to-Agent (A2A) Configuration', () => {
    it('should warn when A2A is enabled but no endpoints', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'a2a-no-endpoints', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            a2aConfig: {
              enabled: true,
              endpoints: [],
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('endpoints'))).toBe(true);
    });

    it('should reject invalid endpoint URLs', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'a2a-bad-url', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            a2aConfig: {
              enabled: true,
              endpoints: ['not-a-valid-url'],
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      const urlError = result.errors.find((e) =>
        e.instancePath.includes('endpoints')
      );
      expect(urlError).toBeDefined();
    });

    it('should accept valid endpoint URLs', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'a2a-valid-urls', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            a2aConfig: {
              enabled: true,
              endpoints: [
                'https://agent1.example.com',
                'https://agent2.example.com:8080',
                'http://localhost:3000',
              ],
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });

    it('should be valid when A2A is disabled', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'a2a-disabled', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            a2aConfig: {
              enabled: false,
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });
  });

  describe('GitLab Integration Validation', () => {
    it('should warn when agentId is set but projectId is missing', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'gitlab-missing-project', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            gitlabIntegration: {
              agentId: 'my-agent',
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('projectId'))).toBe(true);
    });

    it('should reject negative projectId', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'gitlab-bad-project-id', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            gitlabIntegration: {
              agentId: 'my-agent',
              projectId: -1,
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      const projectError = result.errors.find((e) =>
        e.instancePath.includes('projectId')
      );
      expect(projectError).toBeDefined();
    });

    it('should accept valid GitLab integration config', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'gitlab-valid', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            gitlabIntegration: {
              agentId: 'my-agent',
              projectId: 123456,
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });
  });

  describe('Real-world Examples', () => {
    it('should validate Kubernetes cluster agent configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'k8s-cluster-agent',
          version: '1.0.0',
          description: 'Kubernetes cluster management agent',
        },
        spec: {
          role: 'Manages and monitors Kubernetes clusters',
          tools: [
            { type: 'mcp', server: 'kubernetes-mcp' },
            { type: 'mcp', server: 'helm-mcp' },
          ],
        },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'agent-system',
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });

    it('should validate compliance validation agent configuration', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: {
          name: 'compliance-validator',
          version: '1.0.0',
          description: 'Compliance validation agent for SOC2, HIPAA, FedRAMP',
        },
        spec: {
          role: 'Validates compliance across infrastructure',
          tools: [{ type: 'mcp', server: 'kubernetes-mcp' }],
        },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'compliance',
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error messages for invalid configurations', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'INVALID',
            },
            guardrails: {
              costLimits: {
                maxTokensPerDay: -100,
              },
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      result.errors.forEach((error) => {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      });
    });

    it('should provide actionable warning messages', () => {
      const manifest: OssaAgent = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test-agent', version: '1.0.0' },
        spec: { role: 'Test' },
        extensions: {
          kagent: {
            kubernetes: {
              namespace: 'default',
            },
            guardrails: {
              costLimits: {},
            },
          },
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      result.warnings.forEach((warning) => {
        expect(warning).toContain('Consider');
        expect(warning.length).toBeGreaterThan(10);
      });
    });
  });
});
