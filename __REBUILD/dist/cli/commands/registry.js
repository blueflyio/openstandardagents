import { Command } from 'commander';
import { RegistryService } from '../../core/registry/index.js';
/**
 * CLI commands for managing the OSSA Registry Service
 */
export function createRegistryCommand() {
    const registry = new Command('registry');
    registry.description('Manage the OSSA Registry Service');
    // Start registry service command
    registry
        .command('start')
        .description('Start the OSSA Registry Service')
        .option('-p, --port <port>', 'Port to run the registry service on', '8080')
        .option('--no-metrics', 'Disable metrics collection')
        .option('--no-health-checks', 'Disable health monitoring')
        .option('-e, --environment <env>', 'Environment (development|production)', 'development')
        .action(async (options) => {
        try {
            console.log('🏛️  OSSA Registry Service - REGISTRY-CORE');
            console.log('📋 Version: 0.1.9-alpha.1');
            console.log('🎯 Mode: Production Registry & Discovery');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const service = new RegistryService();
            const config = {
                port: parseInt(options.port),
                enableMetrics: options.metrics,
                enableHealthChecks: options.healthChecks
            };
            // Set environment variables
            process.env.NODE_ENV = options.environment;
            await service.start(config);
            // Graceful shutdown handling
            process.on('SIGTERM', async () => {
                console.log('\\n🛑 Received SIGTERM, shutting down gracefully...');
                await service.shutdown();
                process.exit(0);
            });
            process.on('SIGINT', async () => {
                console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
                await service.shutdown();
                process.exit(0);
            });
            console.log('\\n🎉 Registry Service is now ready to serve agent operations');
            console.log(`📡 API Endpoints available at http://localhost:${config.port}/api/v1/`);
            console.log(`📊 Health Check: http://localhost:${config.port}/api/health`);
            console.log(`📚 Documentation: http://localhost:${config.port}/api/docs`);
            console.log('\\n✨ Press Ctrl+C to stop the service');
        }
        catch (error) {
            console.error('❌ Failed to start Registry Service:', error);
            process.exit(1);
        }
    });
    // Status command
    registry
        .command('status')
        .description('Check the status of the running registry service')
        .option('-u, --url <url>', 'Registry service URL', 'http://localhost:8080')
        .action(async (options) => {
        try {
            const { default: fetch } = await import('node-fetch');
            const response = await fetch(`${options.url}/api/health`);
            if (response.ok) {
                const health = await response.json();
                console.log('✅ Registry Service Status: HEALTHY');
                console.log(`📊 Active Agents: ${health.registry.activeAgents}`);
                console.log(`📈 Total Registrations: ${health.registry.totalRegistrations}`);
                console.log(`⏱️  Uptime: ${Math.round(health.uptime)}s`);
                console.log(`🔄 API Requests: ${health.api.totalRequests}`);
            }
            else {
                console.log('⚠️  Registry Service Status: UNHEALTHY');
                console.log(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        catch (error) {
            console.log('❌ Registry Service Status: UNREACHABLE');
            console.log('Make sure the registry service is running');
        }
    });
    // Test registration command
    registry
        .command('test-register')
        .description('Test agent registration with sample ACDL manifest')
        .option('-u, --url <url>', 'Registry service URL', 'http://localhost:8080')
        .option('-t, --token <token>', 'Bearer token for authentication', 'test-token')
        .action(async (options) => {
        try {
            const sampleManifest = {
                agentId: 'test-worker-v1.0.0',
                agentType: 'worker',
                agentSubType: 'worker.documentation',
                version: '1.0.0',
                capabilities: {
                    domains: ['documentation', 'api-design'],
                    operations: [
                        {
                            name: 'generate',
                            description: 'Generate API documentation',
                            inputSchema: { type: 'object' },
                            outputSchema: { type: 'object' }
                        }
                    ]
                },
                protocols: {
                    supported: [
                        {
                            name: 'rest',
                            version: '1.0',
                            endpoint: 'http://localhost:3000/api/v1',
                            authentication: { type: 'none', details: {} }
                        }
                    ],
                    preferred: 'rest'
                },
                performance: {
                    throughput: {
                        requestsPerSecond: 100,
                        concurrentRequests: 10
                    },
                    latency: {
                        p50: 50,
                        p95: 150,
                        p99: 250
                    }
                }
            };
            const { default: fetch } = await import('node-fetch');
            const response = await fetch(`${options.url}/api/v1/agents/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${options.token}`,
                    'X-Tenant-ID': 'test-tenant'
                },
                body: JSON.stringify(sampleManifest)
            });
            const result = await response.json();
            if (response.ok) {
                console.log('✅ Test Registration Successful!');
                console.log(`🆔 Registration ID: ${result.registrationId}`);
                console.log(`📊 Status: ${result.status}`);
                console.log(`✅ Validation Results: ${result.validationResults?.length || 0} checks passed`);
            }
            else {
                console.log('❌ Test Registration Failed');
                console.log(`Error: ${result.error}`);
                console.log(`Message: ${result.message}`);
            }
        }
        catch (error) {
            console.error('❌ Test registration failed:', error instanceof Error ? error.message : error);
        }
    });
    // Discovery test command
    registry
        .command('test-discovery')
        .description('Test agent discovery with sample query')
        .option('-u, --url <url>', 'Registry service URL', 'http://localhost:8080')
        .option('-t, --token <token>', 'Bearer token for authentication', 'test-token')
        .action(async (options) => {
        try {
            const sampleQuery = {
                domains: ['documentation'],
                operations: ['generate'],
                agentType: 'worker',
                performance: {
                    minThroughput: 50,
                    maxLatencyP99: 500
                }
            };
            const { default: fetch } = await import('node-fetch');
            const response = await fetch(`${options.url}/api/v1/discovery/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${options.token}`,
                    'X-Tenant-ID': 'test-tenant'
                },
                body: JSON.stringify(sampleQuery)
            });
            const result = await response.json();
            if (response.ok) {
                console.log('✅ Discovery Query Successful!');
                console.log(`🔍 Found ${result.totalFound} matching agents`);
                console.log(`⏱️  Query Time: ${result.queryTime}ms`);
                if (result.agents.length > 0) {
                    console.log('\\n📋 Top Matches:');
                    result.agents.slice(0, 3).forEach((agent, index) => {
                        console.log(`  ${index + 1}. ${agent.agentId} (score: ${(agent.score * 100).toFixed(1)}%)`);
                    });
                }
            }
            else {
                console.log('❌ Discovery Query Failed');
                console.log(`Error: ${result.error}`);
                console.log(`Message: ${result.message}`);
            }
        }
        catch (error) {
            console.error('❌ Discovery test failed:', error instanceof Error ? error.message : error);
        }
    });
    // Metrics command
    registry
        .command('metrics')
        .description('Get registry service metrics')
        .option('-u, --url <url>', 'Registry service URL', 'http://localhost:8080')
        .option('-t, --token <token>', 'Bearer token for authentication', 'test-token')
        .action(async (options) => {
        try {
            const { default: fetch } = await import('node-fetch');
            const response = await fetch(`${options.url}/api/v1/registry/metrics`, {
                headers: {
                    'Authorization': `Bearer ${options.token}`
                }
            });
            if (response.ok) {
                const metrics = await response.json();
                console.log('📊 OSSA Registry Metrics');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`🔢 Total Registrations: ${metrics.registry.totalRegistrations}`);
                console.log(`✅ Active Agents: ${metrics.registry.activeAgents}`);
                console.log(`🔍 Discovery Queries: ${metrics.registry.totalDiscoveryQueries}`);
                console.log(`🎯 Match Requests: ${metrics.registry.totalMatchRequests}`);
                console.log(`⚡ Avg Discovery Latency: ${metrics.registry.averageDiscoveryLatency.toFixed(1)}ms`);
                console.log(`🏥 Healthy Agents: ${metrics.registry.healthyAgents}`);
                console.log(`⚠️  Degraded Agents: ${metrics.registry.degradedAgents}`);
                console.log(`❌ Unhealthy Agents: ${metrics.registry.unhealthyAgents}`);
                console.log(`\\n🌐 API Metrics:`);
                console.log(`📈 Total API Requests: ${metrics.api.totalRequests}`);
                console.log(`🔗 Active Connections: ${metrics.api.activeConnections}`);
                console.log(`⏱️  Avg Response Time: ${metrics.api.averageResponseTime.toFixed(1)}ms`);
            }
            else {
                console.log('❌ Failed to retrieve metrics');
            }
        }
        catch (error) {
            console.error('❌ Metrics retrieval failed:', error instanceof Error ? error.message : error);
        }
    });
    return registry;
}
//# sourceMappingURL=registry.js.map