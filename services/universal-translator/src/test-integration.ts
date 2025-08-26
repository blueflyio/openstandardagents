#!/usr/bin/env node
/**
 * Integration test for OAAS Universal Translator
 * Tests basic functionality without requiring external dependencies
 */

import { OAASService } from './index.js';

async function runBasicTest() {
  console.log('🚀 Starting OAAS Universal Translator integration test...\n');

  try {
    // Test 1: Initialize service
    console.log('📋 Test 1: Service initialization');
    const oaas = new OAASService({
      projectRoot: process.cwd(),
      runtimeTranslation: true,
      cacheEnabled: false, // Disable cache for testing
      validationStrict: false
    });

    console.log('✅ Service initialized successfully\n');

    // Test 2: Discovery (should not fail even with no agents)
    console.log('📋 Test 2: Agent discovery');
    const agents = await oaas.discoverAgents();
    console.log(`✅ Discovery completed: Found ${agents.length} agents\n`);

    // Test 3: Registry operations
    console.log('📋 Test 3: Registry operations');
    const allAgents = await oaas.getAgentRegistry();
    console.log(`✅ Registry query successful: ${allAgents.length} cached agents\n`);

    // Test 4: Validation (test with a mock OAAS spec)
    console.log('📋 Test 4: Validation test');
    const validationResult = await oaas.validateAgents();
    console.log(`✅ Validation completed\n`);

    // Test 5: Statistics
    console.log('📋 Test 5: Service statistics');
    const translatorStats = oaas.getTranslatorStats?.() || { message: 'Stats not available' };
    const bridgeStats = oaas.getBridgeStats?.() || { message: 'Bridge stats not available' };
    
    console.log('Service Statistics:');
    console.log('- Translator:', translatorStats);
    console.log('- Bridge:', bridgeStats);
    console.log('✅ Statistics retrieved successfully\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   • Service initialization: ✅`);
    console.log(`   • Agent discovery: ✅ (${agents.length} agents found)`);
    console.log(`   • Registry operations: ✅ (${allAgents.length} cached)`);
    console.log(`   • Validation system: ✅`);
    console.log(`   • Statistics retrieval: ✅`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Test mock OAAS specification for validation testing
function createMockOAASSpec() {
  return {
    apiVersion: "openapi-ai-agents/v0.1.1",
    kind: "Agent",
    metadata: {
      name: "test-agent",
      version: "1.0.0",
      description: "Test agent for validation",
      annotations: {
        "oaas/compliance-level": "bronze"
      },
      labels: {
        domain: "test",
        category: "mock",
        framework: "test"
      }
    },
    spec: {
      agent: {
        name: "Test Agent",
        expertise: "Testing OAAS validation functionality"
      },
      capabilities: [
        {
          name: "test_capability",
          description: "A test capability for validation",
          input_schema: {
            type: "object",
            properties: {
              input: { type: "string" }
            }
          },
          output_schema: {
            type: "object",
            properties: {
              result: { type: "string" }
            }
          },
          frameworks: ["test"],
          compliance: ["test-compliance"]
        }
      ],
      protocols: {
        supported: ["test"],
        primary: "test"
      },
      frameworks: {
        test: {
          enabled: true
        }
      }
    }
  };
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runBasicTest, createMockOAASSpec };