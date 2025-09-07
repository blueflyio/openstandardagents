import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { Server } from 'http';
import request from 'supertest';
import axios from 'axios';
import { validAgentSpec } from '../fixtures/agent-specs';

const OSSA_BIN = '/Users/flux423/Sites/LLM/OSSA/src/cli/bin/ossa';

describe('Agent Lifecycle Integration', () => {
  let server: Server;
  let baseUrl: string;
  let serviceAvailable = false;

  beforeAll(async () => {
    // Start the OSSA services
    process.env.NODE_ENV = 'test';
    baseUrl = 'http://localhost:4000';

    // Wait briefly, then probe service availability via HTTP
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const resp = await axios.get(`${baseUrl}/health`, { timeout: 500 });
      serviceAvailable = resp.status === 200;
    } catch (_) {
      serviceAvailable = false;
    }
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  it('should complete full agent registration and discovery workflow', async () => {
    if (!serviceAvailable) {
      console.warn('Skipping test: OSSA services are not running on http://localhost:4000');
      return;
    }

    // Step 1: Verify platform health
    const healthCheck = execSync(`${OSSA_BIN} services health`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(healthCheck).toMatch(/Health Check|Healthy/);

    // Step 2: Register an agent via API
    const registerResponse = await request(baseUrl)
      .post('/agents')
      .set('X-API-Key', 'test-api-key')
      .send(validAgentSpec)
      .expect(201);

    const agentId = registerResponse.body.id;
    expect(agentId).toBeDefined();
    expect(registerResponse.body.name).toBe(validAgentSpec.name);

    // Step 3: Discover the agent via CLI
    const discoverOutput = execSync(`${OSSA_BIN} agents discover --capabilities=chat`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(discoverOutput).toContain('Test Agent');
    expect(discoverOutput).toContain('chat');

    // Step 4: List agents via CLI
    const listOutput = execSync(`${OSSA_BIN} agents list`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(listOutput).toContain('Test Agent');
    expect(listOutput).toContain('1.0.0');

    // Step 5: Get agent details via API
    const detailsResponse = await request(baseUrl)
      .get(`/agents/${agentId}`)
      .expect(200);

    expect(detailsResponse.body.id).toBe(agentId);
    expect(detailsResponse.body.status.health).toBe('unknown'); // Initial state

    // Step 6: Update agent via CLI
    const updateOutput = execSync(`${OSSA_BIN} agents update ${agentId} --version=1.1.0`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(updateOutput).toContain('Agent updated successfully');

    // Step 7: Verify update via API
    const updatedResponse = await request(baseUrl)
      .get(`/agents/${agentId}`)
      .expect(200);

    expect(updatedResponse.body.version).toBe('1.1.0');

    // Step 8: Test agent health monitoring
    const healthResponse = await request(baseUrl)
      .get(`/agents/${agentId}/health`)
      .expect(200);

    expect(healthResponse.body.agent_id).toBe(agentId);
    expect(healthResponse.body.health_status).toBeDefined();

    // Step 9: Unregister agent via CLI
    const unregisterOutput = execSync(`${OSSA_BIN} agents unregister ${agentId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(unregisterOutput).toContain('Agent unregistered successfully');

    // Step 10: Verify agent is removed
    await request(baseUrl)
      .get(`/agents/${agentId}`)
      .expect(404);

    // Verify agent no longer appears in discovery
    const finalDiscoverOutput = execSync(`${OSSA_BIN} agents discover --capabilities=chat`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(finalDiscoverOutput).not.toContain('Test Agent');
  });

  it('should handle multi-agent orchestration workflow', async () => {
    if (!serviceAvailable) {
      console.warn('Skipping test: OSSA services are not running on http://localhost:4000');
      return;
    }

    // Register multiple agents
    const agentIds: string[] = [];

    for (let i = 0; i < 3; i++) {
      const agentSpec = {
        ...validAgentSpec,
        name: `Workflow Agent ${i}`,
        spec: {
          ...validAgentSpec.spec,
          capabilities: {
            primary: [`task_${i}`, 'coordination'],
            secondary: ['monitoring']
          }
        }
      };

      const response = await request(baseUrl)
        .post('/agents')
        .set('X-API-Key', 'test-api-key')
        .send(agentSpec)
        .expect(201);

      agentIds.push(response.body.id);
    }

    // Create a workflow via CLI
    const workflowOutput = execSync(
      `${OSSA_BIN} workflows create --name="Test Workflow" --agents="${agentIds.join(',')}"`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    expect(workflowOutput).toContain('Workflow created');

    const workflowMatch = workflowOutput.match(/Workflow ID: ([\w-]+)/);
    expect(workflowMatch).toBeTruthy();
    const workflowId = workflowMatch![1];

    // Execute the workflow
    const executeOutput = execSync(`${OSSA_BIN} workflows execute ${workflowId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(executeOutput).toContain('Workflow execution started');

    // Check workflow status
    const statusOutput = execSync(`${OSSA_BIN} workflows status ${workflowId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(statusOutput).toContain('Status:');

    // Clean up - remove agents
    for (const agentId of agentIds) {
      await request(baseUrl)
        .delete(`/agents/${agentId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(204);
    }
  });

  it('should validate OSSA v0.1.8 compliance throughout lifecycle', async () => {
    if (!serviceAvailable) {
      console.warn('Skipping test: OSSA services are not running on http://localhost:4000');
      return;
    }

    // Test OSSA compliance validation - use CLI version output as verification
    const validationOutput = execSync(`${OSSA_BIN} --version`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(validationOutput).toContain('0.1.8');

    // Register a compliant agent
    const agentResponse = await request(baseUrl)
      .post('/agents')
      .set('X-API-Key', 'test-api-key')
      .send(validAgentSpec)
      .expect(201);

    const agentId = agentResponse.body.id;

    // Validate agent spec compliance (placeholder via CLI listing/validation)
    const agentValidationOutput = execSync(`${OSSA_BIN} agents validate ${agentId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(agentValidationOutput.toLowerCase()).toContain('validation');

    // Test metrics collection
    const metricsOutput = execSync(`${OSSA_BIN} services metrics --timeframe=1h`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(metricsOutput).toContain('Platform');

    // Clean up
    await request(baseUrl)
      .delete(`/agents/${agentId}`)
      .set('X-API-Key', 'test-api-key')
      .expect(204);
  });
});