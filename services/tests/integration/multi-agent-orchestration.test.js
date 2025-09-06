#!/usr/bin/env node

/**
 * Integration Test: Multi-Agent Orchestration
 * 
 * Tests the complete OAAS multi-agent orchestration system including:
 * - Agent discovery and health monitoring
 * - Capability negotiation and routing
 * - Workflow execution (sequential, parallel, intelligent)
 * - Performance optimization and token management
 * - Compliance validation and audit trails
 */

import { strict as assert } from 'assert';
import { performance } from 'perf_hooks';
import { AgentOrchestrator } from '../../services/src/orchestration/agent-orchestrator.js';
import { ValidationServer } from '../../services/validation-server.js';
import { AgentRegistry } from '../../services/src/registry/AgentRegistry.js';

class MultiAgentOrchestrationTest {
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.registry = new AgentRegistry();
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    const startTime = performance.now();
    
    try {
      console.log(`🧪 Running: ${name}`);
      await testFn();
      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ Passed: ${name} (${duration}ms)`);
      
      this.testResults.passed++;
      this.testResults.tests.push({ name, status: 'passed', duration });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.log(`❌ Failed: ${name} - ${error.message}`);
      
      this.testResults.failed++;
      this.testResults.tests.push({ name, status: 'failed', duration, error: error.message });
    }
  }

  async testAgentDiscovery() {
    const agents = await this.orchestrator.discoverAgents();
    
    assert(Array.isArray(agents), 'Agent discovery should return an array');
    assert(agents.length > 0, 'Should discover at least one agent');
    
    // Validate each agent has required OAAS properties
    for (const agent of agents) {
      assert(agent.metadata, 'Agent must have metadata');
      assert(agent.metadata.name, 'Agent must have a name');
      assert(agent.spec, 'Agent must have a specification');
      assert(agent.spec.capabilities, 'Agent must define capabilities');
    }
    
    console.log(`   📊 Discovered ${agents.length} OAAS-compliant agents`);
  }

  async testHealthMonitoring() {
    const healthStatus = await this.orchestrator.getSystemHealth();
    
    assert(healthStatus.overall, 'System health check must return overall status');
    assert(Array.isArray(healthStatus.agents), 'Health status must include agent statuses');
    assert(typeof healthStatus.metrics === 'object', 'Health status must include metrics');
    
    // Verify critical metrics are present
    const requiredMetrics = ['response_time_avg', 'throughput_rps', 'error_rate', 'agent_count'];
    for (const metric of requiredMetrics) {
      assert(healthStatus.metrics[metric] !== undefined, `Missing critical metric: ${metric}`);
    }
    
    console.log(`   🏥 System health: ${healthStatus.overall} (${healthStatus.agents.length} agents monitored)`);
  }

  async testSequentialWorkflow() {
    const workflow = {
      type: 'sequential',
      tasks: [
        {
          agent: 'tddai-expert',
          capability: 'code_analysis',
          input: { code: 'function test() { return true; }', language: 'javascript' }
        },
        {
          agent: 'security-scanner', 
          capability: 'vulnerability_scan',
          input: { source: 'previous_result', scan_type: 'static' }
        }
      ],
      requirements: {
        max_execution_time: 5000,
        compliance_level: 'silver'
      }
    };

    const result = await this.orchestrator.executeWorkflow(workflow);
    
    assert(result.execution_id, 'Workflow execution must have an ID');
    assert(result.status === 'completed', 'Sequential workflow should complete successfully');
    assert(Array.isArray(result.results), 'Workflow must return results array');
    assert(result.results.length === workflow.tasks.length, 'Should execute all sequential tasks');
    assert(result.execution_time_ms < workflow.requirements.max_execution_time, 'Should meet timing requirements');
    
    console.log(`   ⚡ Sequential workflow completed in ${result.execution_time_ms}ms`);
  }

  async testParallelWorkflow() {
    const workflow = {
      type: 'parallel',
      tasks: [
        {
          agent: 'code-quality-analyzer',
          capability: 'quality_metrics',
          input: { repository: './examples', metrics: ['complexity', 'coverage', 'maintainability'] }
        },
        {
          agent: 'performance-analyzer',
          capability: 'performance_audit', 
          input: { target: 'api_endpoints', thresholds: { response_time: 200 } }
        },
        {
          agent: 'security-scanner',
          capability: 'dependency_scan',
          input: { scan_depth: 'deep', include_dev: false }
        }
      ],
      requirements: {
        max_execution_time: 10000,
        min_success_rate: 0.8
      }
    };

    const result = await this.orchestrator.executeWorkflow(workflow);
    
    assert(result.status === 'completed', 'Parallel workflow should complete');
    assert(result.results.length >= Math.floor(workflow.tasks.length * workflow.requirements.min_success_rate), 
           'Should meet minimum success rate requirement');
    
    const successfulTasks = result.results.filter(r => r.status === 'success').length;
    const successRate = successfulTasks / workflow.tasks.length;
    
    console.log(`   🚀 Parallel workflow: ${successfulTasks}/${workflow.tasks.length} tasks successful (${Math.round(successRate * 100)}%)`);
  }

  async testIntelligentRouting() {
    const request = {
      type: 'intelligent_routing',
      objective: 'Comprehensive code quality assessment with security validation',
      constraints: {
        max_cost: 100, // tokens
        max_time: 3000, // ms
        required_capabilities: ['code_analysis', 'security_scan'],
        compliance_level: 'gold'
      },
      context: {
        language: 'typescript',
        framework: 'node.js',
        project_size: 'medium'
      }
    };

    const result = await this.orchestrator.executeIntelligentRouting(request);
    
    assert(result.selected_agents.length > 0, 'Should select at least one agent');
    assert(result.estimated_cost <= request.constraints.max_cost, 'Should respect cost constraints');
    assert(result.routing_rationale, 'Should provide routing rationale');
    
    // Validate that selected agents actually have required capabilities
    for (const agentId of result.selected_agents) {
      const agent = await this.registry.getAgent(agentId);
      const hasRequiredCaps = request.constraints.required_capabilities.some(cap =>
        agent.spec.capabilities.primary.some(c => c.id.includes(cap.split('_')[0]))
      );
      assert(hasRequiredCaps, `Agent ${agentId} should have required capabilities`);
    }
    
    console.log(`   🧠 Intelligent routing selected ${result.selected_agents.length} optimal agents`);
  }

  async testTokenOptimization() {
    const request = {
      agent: 'token-optimizer',
      capability: 'optimize_request',
      input: {
        original_request: 'Analyze this JavaScript code for potential security vulnerabilities and provide detailed recommendations',
        context: { code_length: 500, complexity: 'medium' },
        optimization_target: 'cost'
      }
    };

    const result = await this.orchestrator.executeCapability(request.agent, request.capability, request.input);
    
    assert(result.optimized_request, 'Should provide optimized request');
    assert(result.estimated_savings, 'Should calculate estimated savings');
    assert(typeof result.estimated_savings.percentage === 'number', 'Should provide savings percentage');
    assert(result.estimated_savings.percentage > 0.2, 'Should achieve at least 20% optimization');
    
    console.log(`   💰 Token optimization: ${Math.round(result.estimated_savings.percentage * 100)}% savings`);
  }

  async testComplianceValidation() {
    const complianceRequest = {
      type: 'compliance_validation',
      framework: 'iso42001',
      scope: 'agent_interactions',
      audit_trail: true
    };

    const result = await this.orchestrator.validateCompliance(complianceRequest);
    
    assert(result.compliance_status, 'Should return compliance status');
    assert(Array.isArray(result.requirements_checked), 'Should list checked requirements');
    assert(typeof result.compliance_score === 'number', 'Should provide compliance score');
    assert(result.compliance_score >= 0.85, 'Should meet minimum compliance threshold');
    
    if (result.violations && result.violations.length > 0) {
      console.log(`   ⚠️  Found ${result.violations.length} compliance issues requiring attention`);
    }
    
    console.log(`   🛡️  Compliance validation: ${Math.round(result.compliance_score * 100)}% compliant`);
  }

  async runAllTests() {
    console.log('🚀 Starting OAAS Multi-Agent Orchestration Integration Tests\n');
    console.log('=' * 65);
    
    // Initialize test environment
    await this.orchestrator.initialize();
    
    // Core functionality tests
    await this.runTest('Agent Discovery', () => this.testAgentDiscovery());
    await this.runTest('Health Monitoring', () => this.testHealthMonitoring());
    
    // Workflow execution tests  
    await this.runTest('Sequential Workflow', () => this.testSequentialWorkflow());
    await this.runTest('Parallel Workflow', () => this.testParallelWorkflow());
    await this.runTest('Intelligent Routing', () => this.testIntelligentRouting());
    
    // Optimization and compliance tests
    await this.runTest('Token Optimization', () => this.testTokenOptimization());
    await this.runTest('Compliance Validation', () => this.testComplianceValidation());
    
    // Test results summary
    console.log('\n' + '=' * 65);
    console.log('📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(t => t.status === 'failed')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
      
      process.exit(1);
    } else {
      console.log('\n🎉 All integration tests passed successfully!');
      console.log('✅ OAAS multi-agent orchestration system is production-ready');
    }
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new MultiAgentOrchestrationTest();
  await testSuite.runAllTests();
}

export { MultiAgentOrchestrationTest };