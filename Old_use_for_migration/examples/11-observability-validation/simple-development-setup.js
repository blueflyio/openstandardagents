#!/usr/bin/env node

/**
 * Simple OSSA Observability Development Setup
 * 
 * Quick start example for development with observability enabled.
 * Run with: node examples/observability/simple-development-setup.js
 */

import { setupDevelopmentObservability } from '../../lib/observability/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔍 OSSA Observability Development Setup');
  console.log('=====================================\n');

  try {
    // 1. Initialize observability for development
    console.log('1. Initializing observability stack...');
    const observability = await setupDevelopmentObservability('dev-data-analyst');
    
    console.log('✅ Observability stack initialized');
    console.log(`📊 Dashboard available at: http://localhost:3001`);
    console.log('🔧 Tracing: Enabled (console output)');
    console.log('📈 Metrics: Enabled (in-memory)\n');

    // 2. Create an observable agent
    console.log('2. Creating observable agent...');
    const agentConfigPath = path.join(__dirname, 'agent-with-full-observability.yml');
    
    const agent = await observability.agentFactory.createBasicAgent(
      agentConfigPath,
      {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.1
      }
    );
    
    console.log('✅ Observable agent created');
    console.log('🤖 Agent type:', agent.type);
    console.log('🎯 Observability features:', Object.keys(agent.getObservabilityConfig().observabilityFeatures));
    console.log();

    // 3. Demonstrate traced execution
    console.log('3. Demonstrating traced agent execution...');
    
    // First invocation - will be traced
    console.log('   → Invoking agent with sample task...');
    const result1 = await agent.invoke({
      input: "Hello! Can you analyze some sample data for me?",
      task: "general greeting and data analysis request"
    });
    
    console.log('   ✅ First invocation complete');
    console.log('   📊 Trace ID:', result1.metadata?.observability?.traceId || 'available in logs');
    console.log('   ⏱️  Duration:', result1.metadata?.observability?.duration_ms + 'ms' || 'tracked');
    
    // Simulate metrics update
    observability.updateMetrics('invocation', { latency: result1.metadata?.observability?.duration_ms || 150 });
    
    // Second invocation to show multiple traces
    console.log('   → Second invocation for metrics demonstration...');
    const result2 = await agent.invoke({
      input: "What's the weather like for data analysis today?",
      task: "casual question"
    });
    
    console.log('   ✅ Second invocation complete');
    observability.updateMetrics('invocation', { latency: result2.metadata?.observability?.duration_ms || 200 });
    
    console.log();

    // 4. Show health status
    console.log('4. Current observability health status:');
    const health = observability.getHealthStatus();
    console.log('   🔧 Instrumentation:', health.instrumentation ? '✅ Active' : '❌ Inactive');
    console.log('   🔍 Tracer:', health.tracer ? '✅ Active' : '❌ Inactive');
    console.log('   📊 Dashboard:', health.dashboard);
    console.log('   🔌 Providers:');
    console.log('      - Traceloop:', health.providers.traceloop ? '✅ Enabled' : '⚠️  Not configured');
    console.log('      - Langfuse:', health.providers.langfuse ? '✅ Enabled' : '⚠️  Not configured');
    console.log('      - OpenTelemetry:', health.providers.openTelemetry ? '✅ Enabled' : '❌ Disabled');
    console.log();

    // 5. Dashboard and API information
    console.log('5. Available endpoints:');
    console.log('   📊 Dashboard:     http://localhost:3001');
    console.log('   📈 Metrics API:   http://localhost:3001/api/metrics');
    console.log('   🔍 Traces API:    http://localhost:3001/api/traces');
    console.log('   🤖 Agents API:    http://localhost:3001/api/agents');
    console.log('   ❤️  Health Check: http://localhost:3001/health');
    console.log();

    console.log('🎉 Development setup complete!');
    console.log('💡 Visit the dashboard to see real-time metrics and traces');
    console.log('🔍 Check the console for trace output');
    console.log();
    console.log('Press Ctrl+C to shutdown observability stack');

    // Keep process alive for dashboard access
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down observability stack...');
      await observability.shutdown();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });

    // Simulate some activity for demonstration
    let counter = 1;
    const interval = setInterval(async () => {
      try {
        console.log(`\n📊 Simulated activity #${counter}...`);
        
        const testResult = await agent.invoke({
          input: `Test invocation ${counter} for observability demonstration`,
          task: "observability demo"
        });
        
        observability.updateMetrics('invocation', { 
          latency: testResult.metadata?.observability?.duration_ms || 100 + Math.random() * 200 
        });
        
        console.log(`   ✅ Activity #${counter} traced and metrics updated`);
        counter++;
        
        if (counter > 10) {
          console.log('\n🔄 Demo activity complete. Dashboard remains active...');
          clearInterval(interval);
        }
        
      } catch (error) {
        console.error('   ❌ Error in simulated activity:', error.message);
      }
    }, 10000); // Every 10 seconds

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔍 Troubleshooting tips:');
    console.error('   1. Ensure port 3001 is available');
    console.error('   2. Check Node.js version (>=18 required)');
    console.error('   3. Verify agent configuration file exists');
    console.error('   4. Check console for detailed error messages');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

main().catch(console.error);