/**
 * OSSA Orchestra v0.1.8 - Basic Workflow Example
 * Demonstrates multi-agent workflow orchestration capabilities
 */

import {
  OrchestrationEngine,
  AgentDefinition,
  WorkflowDefinition,
  OrchestrationRequest,
  ScalingPolicy,
  LoadBalancerConfig
} from '../src/index';

async function runBasicWorkflowExample() {
  console.log('🎼 OSSA Orchestra v0.1.8 - Basic Workflow Example');
  
  // Initialize the orchestration engine
  const orchestra = new OrchestrationEngine();
  await orchestra.initialize();
  
  try {
    // 1. Register Agents
    console.log('\n📋 Registering agents...');
    
    const analysisAgent: AgentDefinition = {
      id: 'code-analyzer-v1',
      name: 'Code Analysis Agent',
      type: 'analyzer',
      version: '1.0.0',
      endpoint: 'http://localhost:3001/analyze',
      capabilities: [
        {
          id: 'code-quality-analysis',
          name: 'Code Quality Analysis',
          description: 'Analyze code quality, patterns, and conventions',
          inputSchema: {
            type: 'object',
            properties: {
              codebase: { type: 'string' },
              language: { type: 'string' },
              rules: { type: 'array' }
            },
            required: ['codebase']
          },
          outputSchema: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              issues: { type: 'array' },
              recommendations: { type: 'array' }
            }
          },
          performance: {
            responseTime: { target: 2000, max: 5000 },
            throughput: { target: 50, max: 100 },
            errorRate: { max: 5 },
            availability: { target: 99.9 }
          },
          compliance: ['silver'],
          dependencies: []
        },
        {
          id: 'security-scan',
          name: 'Security Vulnerability Scan',
          description: 'Scan for security vulnerabilities and threats',
          inputSchema: {
            type: 'object',
            properties: {
              codebase: { type: 'string' },
              scanType: { type: 'string' }
            },
            required: ['codebase']
          },
          outputSchema: {
            type: 'object',
            properties: {
              vulnerabilities: { type: 'array' },
              riskScore: { type: 'number' },
              recommendations: { type: 'array' }
            }
          },
          performance: {
            responseTime: { target: 3000, max: 8000 },
            throughput: { target: 30, max: 60 },
            errorRate: { max: 3 },
            availability: { target: 99.5 }
          },
          compliance: ['gold'],
          dependencies: []
        }
      ],
      resources: {
        cpu: { min: 1, max: 4 },
        memory: { min: 2048, max: 8192 },
        network: { bandwidth: 1000, latency: 10 }
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        checks: [],
        score: 95
      },
      metadata: {
        tags: ['analysis', 'code-quality', 'security'],
        owner: 'platform-team',
        created: new Date(),
        updated: new Date(),
        priority: 8,
        environment: 'production'
      }
    };
    
    const transformationAgent: AgentDefinition = {
      id: 'code-transformer-v1',
      name: 'Code Transformation Agent',
      type: 'transformer',
      version: '1.0.0',
      endpoint: 'http://localhost:3002/transform',
      capabilities: [
        {
          id: 'code-optimization',
          name: 'Code Optimization',
          description: 'Apply optimization patterns and improvements',
          inputSchema: {
            type: 'object',
            properties: {
              codebase: { type: 'string' },
              optimizations: { type: 'array' }
            },
            required: ['codebase']
          },
          outputSchema: {
            type: 'object',
            properties: {
              optimizedCode: { type: 'string' },
              improvements: { type: 'array' },
              metrics: { type: 'object' }
            }
          },
          performance: {
            responseTime: { target: 4000, max: 10000 },
            throughput: { target: 20, max: 40 },
            errorRate: { max: 5 },
            availability: { target: 99.0 }
          },
          compliance: ['silver'],
          dependencies: ['code-quality-analysis']
        }
      ],
      resources: {
        cpu: { min: 2, max: 8 },
        memory: { min: 4096, max: 16384 },
        network: { bandwidth: 500, latency: 20 }
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        checks: [],
        score: 92
      },
      metadata: {
        tags: ['transformation', 'optimization'],
        owner: 'platform-team',
        created: new Date(),
        updated: new Date(),
        priority: 7,
        environment: 'production'
      }
    };
    
    const validationAgent: AgentDefinition = {
      id: 'code-validator-v1',
      name: 'Code Validation Agent',
      type: 'validator',
      version: '1.0.0',
      endpoint: 'http://localhost:3003/validate',
      capabilities: [
        {
          id: 'final-validation',
          name: 'Final Code Validation',
          description: 'Comprehensive validation of transformed code',
          inputSchema: {
            type: 'object',
            properties: {
              originalCode: { type: 'string' },
              transformedCode: { type: 'string' },
              validationRules: { type: 'array' }
            },
            required: ['originalCode', 'transformedCode']
          },
          outputSchema: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              score: { type: 'number' },
              issues: { type: 'array' }
            }
          },
          performance: {
            responseTime: { target: 1500, max: 3000 },
            throughput: { target: 60, max: 120 },
            errorRate: { max: 2 },
            availability: { target: 99.9 }
          },
          compliance: ['gold'],
          dependencies: ['code-optimization']
        }
      ],
      resources: {
        cpu: { min: 1, max: 2 },
        memory: { min: 1024, max: 4096 },
        network: { bandwidth: 800, latency: 5 }
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        checks: [],
        score: 98
      },
      metadata: {
        tags: ['validation', 'quality-assurance'],
        owner: 'qa-team',
        created: new Date(),
        updated: new Date(),
        priority: 9,
        environment: 'production'
      }
    };
    
    await orchestra.registerAgent(analysisAgent);
    await orchestra.registerAgent(transformationAgent);
    await orchestra.registerAgent(validationAgent);
    console.log('✅ Agents registered successfully');
    
    // 2. Configure Load Balancer
    console.log('\n⚖️ Configuring load balancer...');
    const loadBalancerConfig: LoadBalancerConfig = {
      strategy: {
        type: 'performance',
        healthCheck: true,
        stickiness: 'none'
      },
      healthCheckInterval: 30000,
      failoverTimeout: 5000,
      retryPolicy: {
        maxAttempts: 3,
        backoffType: 'exponential',
        baseDelay: 1000,
        maxDelay: 8000,
        retryOn: ['error', 'timeout']
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        halfOpenRequestsLimit: 3
      }
    };
    
    await orchestra.configureLoadBalancer(loadBalancerConfig);
    console.log('✅ Load balancer configured');
    
    // 3. Add Scaling Policies
    console.log('\n📈 Adding scaling policies...');
    const cpuScalingPolicy: ScalingPolicy = {
      id: 'cpu-high-scale-out',
      name: 'High CPU Scale Out Policy',
      trigger: {
        metric: 'cpu',
        operator: 'gt',
        threshold: 75,
        duration: 300000 // 5 minutes
      },
      action: {
        type: 'scale_out',
        amount: 2,
        target: 'agent'
      },
      constraints: {
        minInstances: 1,
        maxInstances: 10,
        maxConcurrency: 50,
        resourceLimits: {
          cpu: 8,
          memory: 16384,
          network: 2000,
          maxConcurrency: 100
        }
      },
      cooldown: 600000 // 10 minutes
    };
    
    await orchestra.addScalingPolicy(cpuScalingPolicy);
    console.log('✅ Scaling policies added');
    
    // 4. Define and Register Workflow
    console.log('\n🔄 Registering workflow...');
    const codeProcessingWorkflow: WorkflowDefinition = {
      id: 'code-processing-pipeline',
      name: 'Code Processing Pipeline',
      version: '1.0.0',
      type: 'sequential',
      stages: [
        {
          id: 'analyze-code',
          name: 'Analyze Code Quality',
          agentId: 'code-analyzer-v1',
          capabilityId: 'code-quality-analysis',
          input: {
            type: 'from_external',
            schema: {
              type: 'object',
              properties: {
                codebase: { type: 'string' },
                language: { type: 'string' }
              }
            }
          },
          output: {
            type: 'data',
            schema: {
              type: 'object',
              properties: {
                analysisResult: { type: 'object' }
              }
            }
          },
          retry: {
            maxAttempts: 3,
            backoffType: 'exponential',
            baseDelay: 1000,
            maxDelay: 5000,
            retryOn: ['error', 'timeout']
          },
          timeout: 10000,
          priority: 1
        },
        {
          id: 'security-scan',
          name: 'Security Vulnerability Scan',
          agentId: 'code-analyzer-v1',
          capabilityId: 'security-scan',
          input: {
            type: 'from_external',
            schema: {
              type: 'object',
              properties: {
                codebase: { type: 'string' }
              }
            }
          },
          output: {
            type: 'data',
            schema: {
              type: 'object',
              properties: {
                securityResult: { type: 'object' }
              }
            }
          },
          retry: {
            maxAttempts: 2,
            backoffType: 'linear',
            baseDelay: 2000,
            maxDelay: 6000,
            retryOn: ['error']
          },
          timeout: 15000,
          priority: 2
        },
        {
          id: 'optimize-code',
          name: 'Optimize Code',
          agentId: 'code-transformer-v1',
          capabilityId: 'code-optimization',
          input: {
            type: 'from_stage',
            source: 'analyze-code',
            schema: {
              type: 'object',
              properties: {
                codebase: { type: 'string' },
                optimizations: { type: 'array' }
              }
            }
          },
          output: {
            type: 'data',
            schema: {
              type: 'object',
              properties: {
                optimizedCode: { type: 'string' }
              }
            }
          },
          retry: {
            maxAttempts: 2,
            backoffType: 'fixed',
            baseDelay: 3000,
            maxDelay: 3000,
            retryOn: ['error', 'timeout']
          },
          timeout: 20000,
          priority: 3
        },
        {
          id: 'validate-result',
          name: 'Validate Final Code',
          agentId: 'code-validator-v1',
          capabilityId: 'final-validation',
          input: {
            type: 'from_stage',
            source: 'optimize-code',
            schema: {
              type: 'object',
              properties: {
                originalCode: { type: 'string' },
                transformedCode: { type: 'string' }
              }
            }
          },
          output: {
            type: 'data',
            schema: {
              type: 'object',
              properties: {
                validationResult: { type: 'object' }
              }
            }
          },
          retry: {
            maxAttempts: 1,
            backoffType: 'fixed',
            baseDelay: 1000,
            maxDelay: 1000,
            retryOn: ['error']
          },
          timeout: 8000,
          priority: 4
        }
      ],
      dependencies: [
        {
          stageId: 'optimize-code',
          dependsOn: ['analyze-code'],
          type: 'data'
        },
        {
          stageId: 'validate-result',
          dependsOn: ['optimize-code'],
          type: 'data'
        }
      ],
      resources: {
        cpu: 4,
        memory: 8192,
        network: 1000,
        maxConcurrency: 3
      },
      constraints: {
        maxExecutionTime: 60000, // 1 minute
        maxRetries: 3,
        allowedFailures: 1,
        resourceLimits: {
          cpu: 8,
          memory: 16384,
          network: 2000,
          maxConcurrency: 5
        },
        complianceRequired: true
      },
      compliance: [
        {
          level: 'silver',
          policies: ['data-protection', 'security-controls'],
          validation: {
            preExecution: ['pii-encryption-validator'],
            postExecution: ['data-retention-validator'],
            continuous: ['response-time-validator']
          }
        }
      ],
      metadata: {
        description: 'End-to-end code processing pipeline with analysis, optimization, and validation',
        tags: ['code-processing', 'analysis', 'optimization', 'validation'],
        owner: 'platform-team',
        created: new Date(),
        updated: new Date(),
        category: 'code-transformation',
        documentation: 'https://docs.ossa.io/workflows/code-processing-pipeline'
      }
    };
    
    await orchestra.registerWorkflow(codeProcessingWorkflow);
    console.log('✅ Workflow registered successfully');
    
    // 5. Execute Workflow
    console.log('\n🚀 Executing workflow...');
    const executionRequest: OrchestrationRequest = {
      id: `exec-${Date.now()}`,
      workflowId: 'code-processing-pipeline',
      input: {
        codebase: `
          function calculateSum(a, b) {
            // This is a simple function that adds two numbers
            var result = a + b;
            console.log("Sum calculated:", result);
            return result;
          }
          
          // Usage example
          const sum = calculateSum(5, 3);
          console.log("Final result:", sum);
        `,
        language: 'javascript',
        optimizations: ['remove-console-logs', 'use-const-let', 'add-type-hints'],
        validationRules: ['syntax-check', 'best-practices', 'performance-check']
      },
      priority: 1,
      timeout: 120000, // 2 minutes
      metadata: {
        user: 'example-user',
        origin: 'cli-example',
        timestamp: new Date(),
        traceId: `trace-${Date.now()}`,
        context: {
          environment: 'development',
          project: 'ossa-example'
        }
      }
    };
    
    const result = await orchestra.execute(executionRequest);
    
    console.log('\n📊 Execution Results:');
    console.log('─'.repeat(50));
    console.log(`Status: ${result.status}`);
    console.log(`Execution ID: ${result.id}`);
    console.log(`Duration: ${result.metrics.duration}ms`);
    console.log(`Stages Executed: ${result.metrics.stagesExecuted}`);
    console.log(`Agents Used: ${result.metrics.agentsUsed.join(', ')}`);
    console.log(`Compliance Score: ${result.compliance.score}`);
    
    if (result.stages.length > 0) {
      console.log('\n🎭 Stage Results:');
      result.stages.forEach((stage, index) => {
        console.log(`  ${index + 1}. ${stage.stageId}`);
        console.log(`     Status: ${stage.status}`);
        console.log(`     Agent: ${stage.agentId}`);
        console.log(`     Duration: ${stage.metrics.duration}ms`);
        if (stage.status === 'failed' && stage.error) {
          console.log(`     Error: ${stage.error.message}`);
        }
      });
    }
    
    // 6. Get Health Status
    console.log('\n🏥 System Health:');
    const health = await orchestra.getHealth();
    console.log('─'.repeat(50));
    console.log(`Overall Status: ${health.overall}`);
    console.log(`Active Executions: ${health.activeExecutions}`);
    console.log(`Registered Agents: ${health.registeredAgents}`);
    console.log(`Registered Workflows: ${health.registeredWorkflows}`);
    
    console.log('\nComponent Health:');
    Object.entries(health.components).forEach(([component, status]) => {
      console.log(`  ${component}: ${status}`);
    });
    
    // 7. Get Metrics
    console.log('\n📈 Performance Metrics:');
    const metrics = await orchestra.getMetrics();
    console.log('─'.repeat(50));
    console.log(`Timestamp: ${metrics.timestamp}`);
    console.log(`Counters: ${Object.keys(metrics.counters || {}).length}`);
    console.log(`Gauges: ${Object.keys(metrics.gauges || {}).length}`);
    console.log(`Histograms: ${Object.keys(metrics.histograms || {}).length}`);
    
    console.log('\n🎉 Example completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  } finally {
    // Clean up
    await orchestra.shutdown();
    console.log('\n👋 Orchestra shutdown complete');
  }
}

// Run the example
if (require.main === module) {
  runBasicWorkflowExample().catch(console.error);
}

export { runBasicWorkflowExample };