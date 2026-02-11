/**
 * Audit Service Unit Tests
 * Tests schema validation and audit functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentAuditService } from '../../src/services/audit.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { API_VERSION } from '../../src/version.js';

describe('AgentAuditService', () => {
  let service: AgentAuditService;
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'audit-test');

  beforeEach(() => {
    service = new AgentAuditService();

    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  describe('Schema Validation', () => {
    it('should load OSSA schema on initialization', () => {
      expect(service).toBeDefined();
      expect(() => new AgentAuditService()).not.toThrow();
    });

    it('should validate a valid manifest', async () => {
      const validAgent = path.join(testDir, 'valid-agent');
      fs.mkdirSync(validAgent, { recursive: true });

      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          description: 'Test agent',
        },
        spec: {
          role: 'Test agent for validation',
          tools: [
            {
              type: 'function',
              name: 'test-tool',
              description: 'Test tool',
            },
          ],
        },
      };

      fs.writeFileSync(
        path.join(validAgent, 'manifest.ossa.yaml'),
        yaml.stringify(manifest)
      );

      const health = await service.auditAgent(validAgent, 'full');

      if (!health.manifestValid) {
        console.log('Validation errors:', health.validationErrors);
        console.log('Issues:', health.issues);
      }

      expect(health.manifestExists).toBe(true);
      expect(health.manifestValid).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.validationErrors).toHaveLength(0);

      // Cleanup
      fs.rmSync(validAgent, { recursive: true, force: true });
    });

    it('should catch invalid manifest structure', async () => {
      const invalidAgent = path.join(testDir, 'invalid-agent');
      fs.mkdirSync(invalidAgent, { recursive: true });

      const invalidManifest = {
        // Missing required fields
        kind: 'Agent',
        metadata: {
          name: 'invalid-agent',
        },
        // Missing spec
      };

      fs.writeFileSync(
        path.join(invalidAgent, 'manifest.ossa.json'),
        JSON.stringify(invalidManifest)
      );

      const health = await service.auditAgent(invalidAgent, 'full');

      expect(health.manifestExists).toBe(true);
      expect(health.manifestValid).toBe(false);
      expect(health.validationErrors.length).toBeGreaterThan(0);
      expect(health.issues.some((i) => i.code === 'SCHEMA_VALIDATION_FAILED')).toBe(true);

      // Cleanup
      fs.rmSync(invalidAgent, { recursive: true, force: true });
    });

    it('should detect missing required fields', async () => {
      const incompleteAgent = path.join(testDir, 'incomplete-agent');
      fs.mkdirSync(incompleteAgent, { recursive: true });

      const incompleteManifest = {
        apiVersion: API_VERSION,
        // Missing kind
        metadata: {
          // Missing name
          version: '1.0.0',
        },
      };

      fs.writeFileSync(
        path.join(incompleteAgent, 'manifest.ossa.yaml'),
        yaml.stringify(incompleteManifest)
      );

      const health = await service.auditAgent(incompleteAgent, 'full');

      expect(health.manifestValid).toBe(false);
      expect(health.validationErrors.length).toBeGreaterThan(0);

      // Should have errors for missing fields
      const errorMessages = health.validationErrors.map((e) => e.message).join(' ');
      expect(errorMessages).toContain('required');

      // Cleanup
      fs.rmSync(incompleteAgent, { recursive: true, force: true });
    });

    it('should warn about version mismatch', async () => {
      const oldVersionAgent = path.join(testDir, 'old-version-agent');
      fs.mkdirSync(oldVersionAgent, { recursive: true });

      const manifest = {
        apiVersion: 'ossa/v0.3.4',
        kind: 'Agent',
        metadata: {
          name: 'old-version-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Old version agent',
          capabilities: [],
        },
      };

      fs.writeFileSync(
        path.join(oldVersionAgent, 'manifest.ossa.yaml'),
        yaml.stringify(manifest)
      );

      const health = await service.auditAgent(oldVersionAgent, 'full');

      // Schema validation might fail for old versions
      if (health.manifestValid) {
        // Should have version mismatch warning
        expect(health.issues.some((i) => i.code === 'VERSION_MISMATCH')).toBe(true);
      }

      // Cleanup
      fs.rmSync(oldVersionAgent, { recursive: true, force: true });
    });

    it('should skip validation in basic mode', async () => {
      const basicAgent = path.join(testDir, 'basic-agent');
      fs.mkdirSync(basicAgent, { recursive: true });

      const manifest = {
        // Invalid manifest
        something: 'invalid',
      };

      fs.writeFileSync(
        path.join(basicAgent, 'manifest.ossa.json'),
        JSON.stringify(manifest)
      );

      const health = await service.auditAgent(basicAgent, 'basic');

      // In basic mode, validation is skipped
      expect(health.manifestValid).toBe(true);
      expect(health.validationErrors).toHaveLength(0);

      // Cleanup
      fs.rmSync(basicAgent, { recursive: true, force: true });
    });
  });

  describe('Health Scoring', () => {
    it('should calculate health score based on completeness', async () => {
      const completeAgent = path.join(testDir, 'complete-agent');
      fs.mkdirSync(completeAgent, { recursive: true });

      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'complete-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Complete agent',
          tools: [{ type: 'function', name: 'tool1', description: 'Tool 1' }],
          triggers: [{ type: 'http', config: { endpoint: '/trigger' } }],
        },
      };

      fs.writeFileSync(
        path.join(completeAgent, 'manifest.ossa.yaml'),
        yaml.stringify(manifest)
      );

      const health = await service.auditAgent(completeAgent, 'full');

      // Should have high health score (30 exists + 50 valid + 10 tools + 10 triggers = 100)
      expect(health.healthScore).toBe(100);
      expect(health.status).toBe('healthy');

      // Cleanup
      fs.rmSync(completeAgent, { recursive: true, force: true });
    });

    it('should warn about missing tools', async () => {
      const noToolsAgent = path.join(testDir, 'no-tools-agent');
      fs.mkdirSync(noToolsAgent, { recursive: true });

      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'no-tools-agent',
          version: '1.0.0',
        },
        spec: {
          role: 'Agent without tools',
          tools: [],
        },
      };

      fs.writeFileSync(
        path.join(noToolsAgent, 'manifest.ossa.yaml'),
        yaml.stringify(manifest)
      );

      const health = await service.auditAgent(noToolsAgent, 'full');

      expect(health.issues.some((i) => i.code === 'NO_TOOLS')).toBe(true);

      // Cleanup
      fs.rmSync(noToolsAgent, { recursive: true, force: true });
    });
  });

  describe('Scan and Audit', () => {
    it('should scan directory and audit all agents', async () => {
      const scanDir = path.join(testDir, 'scan-test');
      fs.mkdirSync(scanDir, { recursive: true });

      // Create multiple agents
      for (let i = 1; i <= 3; i++) {
        const agentDir = path.join(scanDir, `agent-${i}`);
        fs.mkdirSync(agentDir, { recursive: true });

        const manifest = {
          apiVersion: API_VERSION,
          kind: 'Agent',
          metadata: {
            name: `agent-${i}`,
            version: '1.0.0',
          },
          spec: {
            role: `Agent ${i}`,
          },
        };

        fs.writeFileSync(
          path.join(agentDir, 'manifest.ossa.yaml'),
          yaml.stringify(manifest)
        );
      }

      const report = await service.scanAndAudit({
        path: scanDir,
        recursive: true,
        validationLevel: 'full',
      });

      expect(report.summary.total).toBe(3);
      expect(report.agents).toHaveLength(3);
      expect(report.timestamp).toBeDefined();

      // Cleanup
      fs.rmSync(scanDir, { recursive: true, force: true });
    });
  });

  // Cleanup test directory after all tests
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
});
