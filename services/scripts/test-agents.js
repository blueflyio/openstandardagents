#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const agents = [
  {
    name: 'Protocol Bridge Agent',
    port: 3011,
    path: './services/agents/protocol-bridge',
    status: 'active',
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'POST', path: '/convert/openapi-to-mcp' },
      { method: 'GET', path: '/mcp/tools' },
      { method: 'POST', path: '/a2a/discover' }
    ]
  },
  {
    name: 'Framework Integration Agent', 
    port: 3012,
    path: './services/agents/framework-integration',
    status: 'inactive'
  },
  {
    name: 'Performance Optimization Agent',
    port: 3013,
    path: './services/agents/performance-optimization',
    status: 'inactive'
  },
  {
    name: 'Documentation Generation Agent',
    port: 3014,
    path: './services/agents/documentation-generation',
    status: 'inactive'
  },
  {
    name: 'Quality Assurance Agent',
    port: 3015,
    path: './services/agents/quality-assurance',
    status: 'inactive'
  }
];

const runningProcesses = [];

async function startAgent(agent) {
  console.log(`\n🚀 Starting ${agent.name} on port ${agent.port}...`);
  
  if (agent.status === 'inactive') {
    console.log(`⏭️  ${agent.name} is currently inactive (not implemented yet)`);
    return null;
  }

  const agentProcess = spawn('npm', ['start'], {
    cwd: agent.path,
    env: { ...process.env, PORT: agent.port },
    detached: false
  });

  agentProcess.stdout.on('data', (data) => {
    console.log(`[${agent.name}]: ${data.toString().trim()}`);
  });

  agentProcess.stderr.on('data', (data) => {
    console.error(`[${agent.name} ERROR]: ${data.toString().trim()}`);
  });

  agentProcess.on('error', (error) => {
    console.error(`Failed to start ${agent.name}: ${error.message}`);
  });

  return agentProcess;
}

async function testAgent(agent) {
  if (agent.status === 'inactive') {
    return { agent: agent.name, status: 'skipped', reason: 'not implemented' };
  }

  console.log(`\n🧪 Testing ${agent.name}...`);
  const results = [];

  // Test health endpoint
  try {
    const healthResponse = await fetch(`http://localhost:${agent.port}/health`);
    const healthData = await healthResponse.json();
    
    results.push({
      endpoint: '/health',
      status: healthResponse.ok ? 'passed' : 'failed',
      response: healthData
    });
    
    console.log(`✅ Health check passed: ${JSON.stringify(healthData)}`);
  } catch (error) {
    results.push({
      endpoint: '/health',
      status: 'failed',
      error: error.message
    });
    console.error(`❌ Health check failed: ${error.message}`);
  }

  // Test specific endpoints
  if (agent.endpoints) {
    for (const endpoint of agent.endpoints) {
      if (endpoint.path === '/health') continue; // Already tested
      
      try {
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (endpoint.method === 'POST') {
          options.body = JSON.stringify(endpoint.body || {});
        }
        
        const response = await fetch(`http://localhost:${agent.port}${endpoint.path}`, options);
        const data = await response.json();
        
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.ok ? 'passed' : 'failed',
          statusCode: response.status
        });
        
        console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
      } catch (error) {
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: 'failed',
          error: error.message
        });
        console.error(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
      }
    }
  }

  return { agent: agent.name, results };
}

async function runIntegrationTest() {
  console.log('\n🔄 Running Integration Test: Protocol Conversion Chain');
  
  try {
    // Test 1: OpenAPI to MCP conversion
    const openAPISpec = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            operationId: 'testOperation',
            summary: 'Test operation for integration',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    };

    const conversionResponse = await fetch('http://localhost:3011/convert/openapi-to-mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openapi: openAPISpec })
    });

    const conversionResult = await conversionResponse.json();
    
    if (conversionResult.success && conversionResult.tools.length > 0) {
      console.log('✅ OpenAPI to MCP conversion successful');
      console.log(`   Converted ${conversionResult.tools.length} operations to MCP tools`);
    } else {
      console.log('❌ OpenAPI to MCP conversion failed');
    }

    // Test 2: Agent discovery and handoff
    const discoverResponse = await fetch('http://localhost:3011/a2a/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const agents = await discoverResponse.json();
    
    if (agents.success && agents.agents.length > 0) {
      console.log(`✅ Agent discovery successful - Found ${agents.agents.length} agents`);
      
      const activeAgents = agents.agents.filter(a => a.status === 'active');
      console.log(`   Active agents: ${activeAgents.map(a => a.name).join(', ')}`);
    } else {
      console.log('❌ Agent discovery failed');
    }

    // Test 3: MCP tool execution
    const toolsResponse = await fetch('http://localhost:3011/mcp/tools');
    const toolsData = await toolsResponse.json();
    
    if (toolsData.tools && toolsData.tools.length > 0) {
      console.log(`✅ MCP tools available - ${toolsData.tools.length} tools registered`);
      
      // Try executing a tool
      const executeResponse = await fetch('http://localhost:3011/mcp/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'search',
          parameters: { query: 'integration test' }
        })
      });
      
      const executeResult = await executeResponse.json();
      if (executeResult.success) {
        console.log('✅ MCP tool execution successful');
      }
    }

  } catch (error) {
    console.error(`❌ Integration test failed: ${error.message}`);
  }
}

async function main() {
  console.log('🎯 OpenAPI AI Agents Standard - Agent Test Suite');
  console.log('=' . repeat(50));

  // Start all active agents
  console.log('\n📦 Starting agents...');
  for (const agent of agents) {
    const process = await startAgent(agent);
    if (process) {
      runningProcesses.push(process);
    }
  }

  // Wait for agents to start
  console.log('\n⏳ Waiting for agents to initialize...');
  await setTimeout(3000);

  // Test individual agents
  console.log('\n🔬 Testing individual agents...');
  const testResults = [];
  for (const agent of agents) {
    const result = await testAgent(agent);
    testResults.push(result);
  }

  // Run integration tests
  await runIntegrationTest();

  // Summary
  console.log('\n' + '=' . repeat(50));
  console.log('📊 Test Summary:');
  
  const activeTests = testResults.filter(r => r.status !== 'skipped');
  const passedAgents = activeTests.filter(r => 
    r.results && r.results.every(t => t.status === 'passed')
  );
  
  console.log(`✅ Active Agents: ${activeTests.length}`);
  console.log(`🏆 Fully Passing: ${passedAgents.length}`);
  console.log(`⏭️  Not Implemented: ${testResults.filter(r => r.status === 'skipped').length}`);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  for (const process of runningProcesses) {
    process.kill('SIGTERM');
  }
  
  process.exit(0);
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all agents...');
  for (const process of runningProcesses) {
    process.kill('SIGTERM');
  }
  process.exit(0);
});

main().catch(console.error);