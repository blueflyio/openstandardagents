/**
 * CrewAI Observability Demo
 * Demonstrates comprehensive observability integration with Traceloop and Langfuse
 */

import { CrewAIIntegration } from '../../lib/integrations/crewai/index.js';
import { trace, metrics, context } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

async function observabilityDemo() {
  console.log('📊 CrewAI Observability Integration Demo');
  console.log('=========================================\n');

  try {
    // Initialize observability stack
    console.log('🔧 Initializing observability stack...');
    await initializeObservability();
    console.log('✅ Observability stack initialized');
    console.log();

    // Create CrewAI integration with full observability
    const crewaiIntegration = new CrewAIIntegration({
      observabilityEnabled: true,
      tracingProvider: 'both',
      enableMetrics: true,
      enableLogs: true,
      samplingRate: 1.0
    });

    // Create a complex multi-agent team
    const agentSpecs = createObservabilityTestTeam();
    
    console.log(`👥 Created observability test team with ${agentSpecs.length} agents:`);
    agentSpecs.forEach((spec, index) => {
      console.log(`  ${index + 1}. ${spec.metadata.name} - ${spec.spec.agent.expertise}`);
    });
    console.log();

    // Create team with observability-focused tasks
    const teamConfig = {
      process: 'sequential',
      verbose: true,
      memory: true,
      tasks: createObservabilityTasks()
    };

    const crew = await crewaiIntegration.createTeam(agentSpecs, teamConfig);
    console.log('✅ Observability-enabled team created');
    console.log();

    // Execute multiple workflows with different patterns
    const workflows = [
      {
        name: 'Data Pipeline Analysis',
        description: 'Analyze and optimize a complex data processing pipeline',
        inputs: {
          pipeline: {
            stages: ['ingestion', 'transformation', 'validation', 'storage'],
            volume: '10TB daily',
            latency_requirements: '<1 hour'
          }
        }
      },
      {
        name: 'Security Audit',
        description: 'Comprehensive security assessment of microservices architecture',
        inputs: {
          services: ['auth-service', 'user-service', 'payment-service', 'notification-service'],
          compliance_requirements: ['PCI-DSS', 'GDPR', 'SOC2'],
          threat_model: 'high-value-target'
        }
      },
      {
        name: 'Performance Optimization',
        description: 'Identify and resolve performance bottlenecks in distributed system',
        inputs: {
          metrics: {
            response_time: '2.5s avg',
            throughput: '1000 req/s',
            error_rate: '0.5%'
          },
          targets: {
            response_time: '<500ms',
            throughput: '>5000 req/s',
            error_rate: '<0.1%'
          }
        }
      }
    ];

    // Execute workflows with comprehensive observability
    const results = [];
    for (let i = 0; i < workflows.length; i++) {
      const workflow = workflows[i];
      console.log(`🎯 Executing workflow ${i + 1}: ${workflow.name}`);
      console.log(`   Description: ${workflow.description}`);
      
      const executionOptions = {
        sessionId: `workflow-${i + 1}-${Date.now()}`,
        userId: 'demo-user',
        workflowName: workflow.name
      };

      try {
        const result = await crewaiIntegration.executeWorkflow(
          crew, 
          workflow, 
          executionOptions
        );

        results.push({
          workflow: workflow.name,
          success: result.success,
          observability: result.observability,
          error: result.error
        });

        if (result.success) {
          console.log('✅ Workflow completed successfully');
          console.log(`   Duration: ${result.observability?.executionTime || 'N/A'}ms`);
          console.log(`   Session: ${result.observability?.sessionId || 'N/A'}`);
          
          if (result.observability?.tracingData) {
            console.log(`   Trace ID: ${result.observability.tracingData.traceId || 'N/A'}`);
            console.log(`   Span ID: ${result.observability.tracingData.spanId || 'N/A'}`);
            if (result.observability.tracingData.langfuseTraceId) {
              console.log(`   Langfuse: ${result.observability.tracingData.langfuseTraceId}`);
            }
          }
        } else {
          console.log('❌ Workflow failed');
          console.log(`   Error: ${result.error}`);
          console.log(`   Duration: ${result.observability?.executionTime || 'N/A'}ms`);
        }
        
        console.log();

      } catch (error) {
        console.error(`❌ Workflow ${workflow.name} failed:`, error.message);
        results.push({
          workflow: workflow.name,
          success: false,
          error: error.message
        });
      }
    }

    // Display observability summary
    console.log('📈 Observability Summary');
    console.log('========================');
    displayObservabilitySummary(results);

    // Demonstrate custom metrics and spans
    await demonstrateCustomObservability(crewaiIntegration);

    // Flush observability data
    console.log('💾 Flushing observability data...');
    await crewaiIntegration.observability.flush();
    console.log('✅ All observability data flushed');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function initializeObservability() {
  // Initialize OpenTelemetry SDK
  const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations({
      // Disable some instrumentations that might interfere with the demo
      '@opentelemetry/instrumentation-fs': { enabled: false },
    })],
    serviceName: 'ossa-crewai-demo',
    serviceVersion: '1.0.0'
  });

  try {
    sdk.start();
    console.log('  📡 OpenTelemetry SDK started');
  } catch (error) {
    console.log('  ⚠️  OpenTelemetry SDK initialization skipped:', error.message);
  }

  // Check for Langfuse configuration
  if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
    console.log('  🔗 Langfuse configuration detected');
  } else {
    console.log('  ⚠️  Langfuse configuration not found (set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY)');
  }

  // Check for Traceloop configuration
  if (process.env.TRACELOOP_API_KEY) {
    console.log('  🔄 Traceloop configuration detected');
  } else {
    console.log('  ⚠️  Traceloop configuration not found (set TRACELOOP_API_KEY)');
  }
}

function createObservabilityTestTeam() {
  return [
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'performance-analyst',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'performance' },
        description: 'System performance analysis and optimization specialist'
      },
      spec: {
        agent: {
          name: 'Performance Analyst',
          expertise: 'System performance monitoring, bottleneck identification, and optimization strategies'
        },
        capabilities: [
          { name: 'analyze_metrics', description: 'Analyze system performance metrics and identify trends' },
          { name: 'identify_bottlenecks', description: 'Identify performance bottlenecks in distributed systems' },
          { name: 'recommend_optimizations', description: 'Recommend specific optimization strategies' }
        ],
        frameworks: {
          crewai: { enabled: true, role: 'Senior Performance Engineer', allow_delegation: true }
        }
      }
    },
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'security-auditor',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'security' },
        description: 'Comprehensive security audit and compliance specialist'
      },
      spec: {
        agent: {
          name: 'Security Auditor',
          expertise: 'Security vulnerability assessment, compliance auditing, and threat modeling'
        },
        capabilities: [
          { name: 'audit_security', description: 'Perform comprehensive security audits' },
          { name: 'assess_compliance', description: 'Assess compliance with security standards' },
          { name: 'model_threats', description: 'Create and analyze threat models' }
        ],
        frameworks: {
          crewai: { enabled: true, role: 'Principal Security Engineer', allow_delegation: false }
        }
      }
    },
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'data-engineer',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'data' },
        description: 'Data pipeline design and optimization specialist'
      },
      spec: {
        agent: {
          name: 'Data Engineer',
          expertise: 'Data pipeline architecture, ETL optimization, and data quality assurance'
        },
        capabilities: [
          { name: 'design_pipelines', description: 'Design scalable data processing pipelines' },
          { name: 'optimize_etl', description: 'Optimize extract, transform, load processes' },
          { name: 'ensure_quality', description: 'Implement data quality and validation checks' }
        ],
        frameworks: {
          crewai: { enabled: true, role: 'Senior Data Engineer', allow_delegation: true }
        }
      }
    },
    {
      apiVersion: 'open-standards-scalable-agents/v0.1.8',
      kind: 'Agent',
      metadata: {
        name: 'observability-engineer',
        version: '1.0.0',
        labels: { tier: 'core', domain: 'monitoring' },
        description: 'Observability and monitoring systems specialist'
      },
      spec: {
        agent: {
          name: 'Observability Engineer',
          expertise: 'Monitoring systems, alerting, tracing, and observability best practices'
        },
        capabilities: [
          { name: 'design_monitoring', description: 'Design comprehensive monitoring solutions' },
          { name: 'implement_alerting', description: 'Implement intelligent alerting systems' },
          { name: 'analyze_traces', description: 'Analyze distributed traces for insights' }
        ],
        frameworks: {
          crewai: { enabled: true, role: 'Staff Observability Engineer', allow_delegation: false }
        }
      }
    }
  ];
}

function createObservabilityTasks() {
  return [
    {
      description: 'Set up comprehensive monitoring and establish performance baselines',
      expected_output: 'Monitoring dashboard with baseline performance metrics',
      agent_role: 'observability'
    },
    {
      description: 'Analyze current system performance and identify optimization opportunities',
      expected_output: 'Performance analysis report with optimization recommendations',
      agent_role: 'performance'
    },
    {
      description: 'Conduct security audit and compliance assessment',
      expected_output: 'Security audit report with compliance status and recommendations',
      agent_role: 'security'
    },
    {
      description: 'Review and optimize data pipeline architecture',
      expected_output: 'Data pipeline optimization plan with implementation steps',
      agent_role: 'data'
    }
  ];
}

function displayObservabilitySummary(results) {
  const totalWorkflows = results.length;
  const successfulWorkflows = results.filter(r => r.success).length;
  const failedWorkflows = totalWorkflows - successfulWorkflows;

  console.log(`📊 Total Workflows: ${totalWorkflows}`);
  console.log(`✅ Successful: ${successfulWorkflows}`);
  console.log(`❌ Failed: ${failedWorkflows}`);
  console.log(`📈 Success Rate: ${((successfulWorkflows / totalWorkflows) * 100).toFixed(1)}%`);
  console.log();

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.workflow}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    
    if (result.observability) {
      console.log(`   Duration: ${result.observability.executionTime || 'N/A'}ms`);
      console.log(`   Session: ${result.observability.sessionId || 'N/A'}`);
      
      if (result.observability.tracingData) {
        console.log(`   Tracing: Available`);
      }
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  });
}

async function demonstrateCustomObservability(crewaiIntegration) {
  console.log('🔬 Demonstrating Custom Observability Features');
  console.log('==============================================');

  // Custom span example
  await crewaiIntegration.observability.withSpan(
    'custom-analysis-operation',
    async (span) => {
      console.log('  📡 Creating custom span for analysis operation...');
      
      span.setAttributes({
        'operation.type': 'analysis',
        'operation.complexity': 'high',
        'operation.duration_estimate': 5000
      });

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('  ✅ Custom span completed');
      
      return { analysis: 'completed', insights: ['insight1', 'insight2'] };
    },
    {
      'custom.attribute': 'demo-value',
      'operation.category': 'observability-demo'
    }
  );

  // Custom metrics example
  console.log('  📊 Recording custom metrics...');
  crewaiIntegration.observability.recordMetric(
    'workflow_complexity_score',
    8.5,
    { workflow_type: 'multi_agent', team_size: '4' }
  );

  crewaiIntegration.observability.recordMetric(
    'agent_utilization_rate',
    0.75,
    { agent_type: 'performance_analyst', utilization: 'optimal' }
  );

  console.log('  ✅ Custom metrics recorded');
  console.log();
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Set up environment variables for demo (if not already set)
  if (!process.env.LANGFUSE_SECRET_KEY) {
    console.log('ℹ️  Note: Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY for full Langfuse integration');
  }
  
  if (!process.env.TRACELOOP_API_KEY) {
    console.log('ℹ️  Note: Set TRACELOOP_API_KEY for full Traceloop integration');
  }

  observabilityDemo()
    .then(() => {
      console.log('\n🎉 Observability demo completed!');
      console.log('\n📖 Next Steps:');
      console.log('  1. Configure Langfuse/Traceloop API keys for full integration');
      console.log('  2. View traces in your observability platform');
      console.log('  3. Set up alerts based on the demonstrated metrics');
      console.log('  4. Integrate with your existing monitoring infrastructure');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export default observabilityDemo;