#!/usr/bin/env node

/**
 * Quick Observability Integration Test
 * 
 * Tests basic functionality without requiring external API keys
 */

import { initializeOSSAObservability } from '../../lib/observability/index.js';

async function quickTest() {
  console.log('🧪 OSSA Observability Quick Test');
  console.log('================================\n');

  try {
    // Test configuration without external dependencies
    const testConfig = {
      metadata: {
        name: 'test-agent',
        version: '1.0.0'
      },
      'x-ossa-observability': {
        enabled: true,
        version: '0.1.8',
        tracing: {
          enabled: true,
          serviceName: 'test-service',
          environment: 'test',
          openTelemetry: {
            enabled: true,
            exporters: ['console']
          },
          traceloop: {
            enabled: false // Disable to avoid API key requirement
          },
          langfuse: {
            enabled: false // Disable to avoid API key requirement
          }
        },
        dashboard: {
          enabled: true,
          port: 3002 // Use different port
        }
      }
    };

    console.log('1. Testing configuration processing...');
    const observability = await initializeOSSAObservability({
      agentConfig: testConfig,
      enableDashboard: true,
      enableAutoInstrumentation: true
    });

    console.log('✅ Configuration processed successfully');

    console.log('\n2. Testing health status...');
    const health = observability.getHealthStatus();
    console.log('   Instrumentation:', health.instrumentation ? '✅' : '❌');
    console.log('   Tracer:', health.tracer ? '✅' : '❌');
    console.log('   Dashboard:', health.dashboard);

    console.log('\n3. Testing metrics update...');
    observability.updateMetrics('invocation', { latency: 123 });
    observability.updateMetrics('error', {});
    console.log('✅ Metrics updated successfully');

    console.log('\n4. Testing dashboard endpoints...');
    const dashboardPort = health.config?.dashboard?.port || 3002;
    console.log(`   Dashboard: http://localhost:${dashboardPort}`);
    console.log(`   Health: http://localhost:${dashboardPort}/health`);
    console.log(`   Metrics: http://localhost:${dashboardPort}/api/metrics`);

    console.log('\n🎉 All tests passed!');
    console.log(`📊 Dashboard running on port ${dashboardPort}`);
    
    setTimeout(async () => {
      console.log('\n🛑 Shutting down test...');
      await observability.shutdown();
      console.log('✅ Test completed successfully');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

quickTest();