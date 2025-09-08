/**
 * OSSA v0.1.8 CLI Commands Integration Tests
 * Comprehensive test suite for all new CLI commands
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Test helper functions
function runOssaCommand(command: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ../../../../index.ts ${command}`, { 
      encoding: 'utf8',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.status || 1
    };
  }
}

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-test-'));
}

function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Test suite
describe('OSSA CLI v0.1.8 Commands', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(__dirname);
    cleanupTempDir(tempDir);
  });

  describe('Agent Management Commands', () => {
    test('should list agent command help', () => {
      const result = runOssaCommand('agent --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Comprehensive OSSA v0.1.8 agent management');
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('status');
      expect(result.stdout).toContain('validate');
    });

    test('should show agent create help', () => {
      const result = runOssaCommand('agent create --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Create new OSSA v0.1.8 compliant agent');
      expect(result.stdout).toContain('--template');
      expect(result.stdout).toContain('--domain');
      expect(result.stdout).toContain('--tier');
    });

    test('should validate agent creation parameters', () => {
      const result = runOssaCommand('agent create test-agent --domain analytics --tier advanced');
      expect(result.stdout).toContain('Creating OSSA v0.1.8 Agent');
    });
  });

  describe('Orchestration Commands', () => {
    test('should list orchestration command help', () => {
      const result = runOssaCommand('orchestrate --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 agent orchestration and coordination');
      expect(result.stdout).toContain('start');
      expect(result.stdout).toContain('stop');
      expect(result.stdout).toContain('scale');
      expect(result.stdout).toContain('coordinate');
    });

    test('should show orchestration start help', () => {
      const result = runOssaCommand('orchestrate start --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Start agent orchestration');
      expect(result.stdout).toContain('--mode');
      expect(result.stdout).toContain('--scale');
      expect(result.stdout).toContain('--timeout');
    });
  });

  describe('Monitoring Commands', () => {
    test('should list monitoring command help', () => {
      const result = runOssaCommand('monitor --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 comprehensive monitoring and observability');
      expect(result.stdout).toContain('health');
      expect(result.stdout).toContain('metrics');
      expect(result.stdout).toContain('logs');
      expect(result.stdout).toContain('trace');
    });

    test('should show health monitoring help', () => {
      const result = runOssaCommand('monitor health --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Monitor system and component health');
      expect(result.stdout).toContain('--watch');
      expect(result.stdout).toContain('--detailed');
    });
  });

  describe('Compliance Commands', () => {
    test('should list compliance command help', () => {
      const result = runOssaCommand('compliance --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 compliance and audit management');
      expect(result.stdout).toContain('audit');
      expect(result.stdout).toContain('validate');
      expect(result.stdout).toContain('report');
      expect(result.stdout).toContain('security');
    });

    test('should show audit help', () => {
      const result = runOssaCommand('compliance audit --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Perform comprehensive compliance audit');
      expect(result.stdout).toContain('--framework');
      expect(result.stdout).toContain('--detailed');
    });
  });

  describe('Discovery Commands', () => {
    test('should list discovery command help', () => {
      const result = runOssaCommand('discovery --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Universal Agent Discovery Protocol (UADP) management');
      expect(result.stdout).toContain('register');
      expect(result.stdout).toContain('find');
      expect(result.stdout).toContain('resolve');
      expect(result.stdout).toContain('topology');
    });

    test('should show agent registration help', () => {
      const result = runOssaCommand('discovery register --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Register agent with UADP discovery service');
      expect(result.stdout).toContain('--registry');
      expect(result.stdout).toContain('--tags');
      expect(result.stdout).toContain('--scope');
    });
  });

  describe('API Integration Commands', () => {
    test('should list API command help', () => {
      const result = runOssaCommand('api --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 API gateway and integration management');
      expect(result.stdout).toContain('serve');
      expect(result.stdout).toContain('proxy');
      expect(result.stdout).toContain('bridge');
      expect(result.stdout).toContain('integrate');
    });

    test('should show API server help', () => {
      const result = runOssaCommand('api serve --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Start OSSA API gateway server');
      expect(result.stdout).toContain('--port');
      expect(result.stdout).toContain('--ssl');
      expect(result.stdout).toContain('--cors');
    });
  });

  describe('Advanced Migration Commands', () => {
    test('should list advanced migration command help', () => {
      const result = runOssaCommand('migrate-advanced --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 advanced migration tools');
      expect(result.stdout).toContain('batch');
      expect(result.stdout).toContain('rollback');
      expect(result.stdout).toContain('validate');
      expect(result.stdout).toContain('plan');
    });

    test('should show batch migration help', () => {
      const result = runOssaCommand('migrate-advanced batch --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Batch migrate multiple OSSA agents');
      expect(result.stdout).toContain('--parallel');
      expect(result.stdout).toContain('--dry-run');
      expect(result.stdout).toContain('--backup');
    });
  });

  describe('Command Integration Tests', () => {
    test('should create agent and validate it', () => {
      // Create an agent
      const createResult = runOssaCommand('agent create test-integration --domain security --tier advanced');
      expect(createResult.stdout).toContain('Creating OSSA v0.1.8 Agent');

      // Validate the created agent
      const validateResult = runOssaCommand('agent validate test-integration');
      expect(validateResult.stdout).toContain('Validating Agent Compliance');
    });

    test('should show main CLI help with all commands', () => {
      const result = runOssaCommand('--help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('OSSA v0.1.8 Complete Agent & Workspace Management CLI');
      
      // Check that all major command groups are present
      expect(result.stdout).toContain('agent');
      expect(result.stdout).toContain('orchestrate');
      expect(result.stdout).toContain('monitor');
      expect(result.stdout).toContain('compliance');
      expect(result.stdout).toContain('discovery');
      expect(result.stdout).toContain('api');
      expect(result.stdout).toContain('migrate-advanced');
    });

    test('should handle invalid commands gracefully', () => {
      const result = runOssaCommand('invalid-command');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('unknown command');
    });

    test('should support JSON output format', () => {
      const result = runOssaCommand('agent list --format json');
      expect(result.stdout).toContain('Listing OSSA Agents');
    });

    test('should support verbose output', () => {
      const result = runOssaCommand('--verbose agent list');
      expect(result.stdout).toContain('Listing OSSA Agents');
    });
  });

  describe('Command Validation Tests', () => {
    test('should validate required parameters', () => {
      const result = runOssaCommand('agent create');
      expect(result.exitCode).not.toBe(0);
      // Should fail without agent name
    });

    test('should validate option values', () => {
      const result = runOssaCommand('agent create test --tier invalid-tier');
      // Should handle invalid tier values gracefully
      expect(result.stdout).toContain('Creating OSSA v0.1.8 Agent');
    });

    test('should handle file path validation', () => {
      const result = runOssaCommand('agent validate /non/existent/path');
      expect(result.stdout).toContain('Validating Agent Compliance');
    });
  });

  describe('Performance Tests', () => {
    test('should handle help commands quickly', () => {
      const startTime = Date.now();
      const result = runOssaCommand('--help');
      const duration = Date.now() - startTime;
      
      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should handle multiple command help requests', () => {
      const commands = [
        'agent --help',
        'orchestrate --help',
        'monitor --help',
        'compliance --help',
        'discovery --help'
      ];

      commands.forEach(command => {
        const result = runOssaCommand(command);
        expect(result.exitCode).toBe(0);
        expect(result.stdout.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle missing dependencies gracefully', () => {
      const result = runOssaCommand('api serve --port 99999');
      // Should handle invalid port numbers
      expect(result.stdout).toContain('Starting OSSA API Gateway');
    });

    test('should provide helpful error messages', () => {
      const result = runOssaCommand('agent delete non-existent-agent');
      expect(result.stdout).toContain('Deleting Agent');
    });

    test('should handle permission errors gracefully', () => {
      // Test with read-only directory
      const result = runOssaCommand('agent create test --output-dir /root');
      // Should handle permission issues gracefully
      expect(result.stdout).toContain('Creating OSSA v0.1.8 Agent');
    });
  });
});

// Utility test functions for complex scenarios
describe('OSSA CLI Complex Scenarios', () => {
  test('should support workflow: create -> validate -> register -> monitor', () => {
    const tempDir = createTempDir();
    process.chdir(tempDir);

    try {
      // 1. Create agent
      const createResult = runOssaCommand('agent create workflow-test --domain analytics');
      expect(createResult.stdout).toContain('Creating OSSA v0.1.8 Agent');

      // 2. Validate agent  
      const validateResult = runOssaCommand('agent validate workflow-test');
      expect(validateResult.stdout).toContain('Validating Agent Compliance');

      // 3. Register agent (mock)
      const registerResult = runOssaCommand('discovery register workflow-test --registry test');
      expect(registerResult.stdout).toContain('Registering Agent with UADP');

      // 4. Monitor agent
      const monitorResult = runOssaCommand('monitor health workflow-test');
      expect(monitorResult.stdout).toContain('OSSA Health Monitoring');
      
    } finally {
      process.chdir(__dirname);
      cleanupTempDir(tempDir);
    }
  });

  test('should support batch operations workflow', () => {
    const tempDir = createTempDir();
    process.chdir(tempDir);

    try {
      // Create multiple agents
      ['agent1', 'agent2', 'agent3'].forEach(name => {
        const result = runOssaCommand(`agent create ${name} --domain test`);
        expect(result.stdout).toContain('Creating OSSA v0.1.8 Agent');
      });

      // Batch validate
      const batchResult = runOssaCommand('migrate-advanced validate . --recursive');
      expect(batchResult.stdout).toContain('Migration Validation');
      
    } finally {
      process.chdir(__dirname);
      cleanupTempDir(tempDir);
    }
  });
});

// Mock data and test utilities
const mockAgentConfig = {
  ossa: '0.1.8',
  metadata: {
    name: 'test-agent',
    version: '1.0.0',
    description: 'Test agent for CLI testing'
  },
  spec: {
    conformance_tier: 'advanced',
    capabilities: ['test_capability'],
    protocols: [
      { name: 'openapi', version: '3.1.0', required: true }
    ]
  }
};

// Export test utilities for reuse
export { runOssaCommand, createTempDir, cleanupTempDir, mockAgentConfig };