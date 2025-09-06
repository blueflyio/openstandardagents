import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { Server } from 'http';
import request from 'supertest';
import { validAgentSpec } from '../fixtures/agent-specs';

describe('Agent Lifecycle Integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Start the OSSA services
    process.env.NODE_ENV = 'test';
    baseUrl = 'http://localhost:4000';
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  it('should complete full agent registration and discovery workflow', async () => {
    // Step 1: Verify platform health
    const healthCheck = execSync('npx tsx cli/src/index.ts services health', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    
    expect(healthCheck).toContain('OSSA Platform');
    
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
    const discoverOutput = execSync('npx tsx cli/src/index.ts agents discover --capabilities=chat', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(discoverOutput).toContain('Test Agent');
    expect(discoverOutput).toContain('chat');

    // Step 4: List agents via CLI
    const listOutput = execSync('npx tsx cli/src/index.ts agents list', {
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
    const updateOutput = execSync(`npx tsx cli/src/index.ts agents update ${agentId} --version=1.1.0`, {
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
    const unregisterOutput = execSync(`npx tsx cli/src/index.ts agents unregister ${agentId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(unregisterOutput).toContain('Agent unregistered successfully');

    // Step 10: Verify agent is removed
    await request(baseUrl)
      .get(`/agents/${agentId}`)
      .expect(404);

    // Verify agent no longer appears in discovery
    const finalDiscoverOutput = execSync('npx tsx cli/src/index.ts agents discover --capabilities=chat', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(finalDiscoverOutput).not.toContain('Test Agent');
  });

  it('should handle multi-agent orchestration workflow', async () => {
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
      `npx tsx cli/src/index.ts workflows create --name="Test Workflow" --agents="${agentIds.join(',')}"`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    expect(workflowOutput).toContain('Workflow created');
    
    const workflowMatch = workflowOutput.match(/Workflow ID: ([\w-]+)/);
    expect(workflowMatch).toBeTruthy();
    const workflowId = workflowMatch![1];

    // Execute the workflow
    const executeOutput = execSync(`npx tsx cli/src/index.ts workflows execute ${workflowId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(executeOutput).toContain('Workflow execution started');

    // Check workflow status
    const statusOutput = execSync(`npx tsx cli/src/index.ts workflows status ${workflowId}`, {
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
    // Test OSSA compliance validation
    const validationOutput = execSync('npx tsx cli/src/index.ts validate --spec-version=0.1.8', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(validationOutput).toContain('OSSA v0.1.8');
    expect(validationOutput).not.toContain('ERROR');

    // Register a compliant agent
    const agentResponse = await request(baseUrl)
      .post('/agents')
      .set('X-API-Key', 'test-api-key')
      .send(validAgentSpec)
      .expect(201);

    const agentId = agentResponse.body.id;

    // Validate agent spec compliance
    const agentValidationOutput = execSync(`npx tsx cli/src/index.ts agents validate ${agentId}`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(agentValidationOutput).toContain('Validation successful');
    expect(agentValidationOutput).toContain('OSSA v0.1.8 compliant');

    // Test metrics collection
    const metricsOutput = execSync('npx tsx cli/src/index.ts services metrics --timeframe=1h', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(metricsOutput).toContain('Platform Metrics');
    expect(metricsOutput).toContain('Total Agents:');

    // Clean up
    await request(baseUrl)
      .delete(`/agents/${agentId}`)
      .set('X-API-Key', 'test-api-key')
      .expect(204);
  });
});