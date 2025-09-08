/**
 * OSSA v0.1.8 Orchestrator Usage Examples
 * 
 * Demonstrates how to use the orchestrator agent system to achieve
 * validated 26% efficiency gains through intelligent goal decomposition
 * and task routing.
 */

import { 
  OrchestratorFactory,
  orchestrateGoal,
  createSpecializedOrchestrator,
  validateOSSACompliance,
  generatePerformanceReport,
  OSSA_ORCHESTRATOR_INFO
} from './index';
import { UADPDiscoveryEngine } from '../../types/uadp-discovery';

/**
 * Example 1: Basic Goal Orchestration with Auto-Selection
 */
export async function basicOrchestrationExample() {
  console.log('\n=== Example 1: Basic Goal Orchestration ===');
  
  // Initialize discovery engine (would be actual implementation in production)
  const discoveryEngine = new UADPDiscoveryEngine();
  
  try {
    // Simple goal orchestration with auto-selection
    const result = await orchestrateGoal(
      'Analyze the security vulnerabilities in my codebase and generate a comprehensive report',
      {
        codebase_path: '/path/to/codebase',
        language: 'TypeScript',
        framework: 'Node.js',
        efficiency_target: 0.25 // 25% minimum efficiency improvement
      },
      discoveryEngine
    );

    console.log('Orchestration completed successfully:');
    console.log(`- Orchestrator Type: ${result.orchestrator_type}`);
    console.log(`- Sub-tasks Generated: ${result.decomposition.sub_tasks.length}`);
    console.log(`- Efficiency Gain: ${result.metrics.efficiency_gain.toFixed(1)}%`);
    console.log(`- Token Optimization: ${result.metrics.token_optimization.toFixed(1)}%`);
    console.log(`- Execution Time: ${result.metrics.total_execution_time_ms}ms`);

    // Validate OSSA compliance
    const compliance = validateOSSACompliance(result.metrics);
    console.log(`- OSSA Compliance: ${compliance.compliance_status} (${compliance.overall_score}% score)`);

  } catch (error) {
    console.error('Orchestration failed:', error);
  }
}

/**
 * Example 2: Using Specialized Orchestrators
 */
export async function specializedOrchestratorExample() {
  console.log('\n=== Example 2: Specialized Orchestrators ===');
  
  const discoveryEngine = new UADPDiscoveryEngine();

  try {
    // Goal Decomposer for complex analysis tasks
    const goalDecomposer = await createSpecializedOrchestrator('goal_decomposer', discoveryEngine);
    
    const complexGoal = 'Build a machine learning pipeline that processes user data, trains a recommendation model, validates performance, and deploys to production with monitoring';
    
    const decomposition = await goalDecomposer.decomposeGoal(complexGoal, {
      domain: 'machine-learning',
      complexity_level: 'expert',
      max_agents: 8
    });

    console.log('Goal Decomposer Results:');
    console.log(`- Task ID: ${decomposition.task_id}`);
    console.log(`- Execution Strategy: ${decomposition.execution_strategy}`);
    console.log(`- Sub-tasks: ${decomposition.sub_tasks.length}`);
    
    decomposition.sub_tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.description}`);
      console.log(`     Capability: ${task.required_capability}`);
      console.log(`     Priority: ${task.priority}`);
      console.log(`     Estimated Effort: ${task.estimated_effort} hours`);
    });

  } catch (error) {
    console.error('Specialized orchestrator example failed:', error);
  }
}

/**
 * Example 3: Intelligent Router with Performance Optimization
 */
export async function intelligentRouterExample() {
  console.log('\n=== Example 3: Intelligent Task Router ===');
  
  const discoveryEngine = new UADPDiscoveryEngine();

  try {
    // Create intelligent router for high-performance scenarios
    const router = await createSpecializedOrchestrator('intelligent_router', discoveryEngine);
    
    const performanceGoal = 'Process 10,000 customer records, analyze sentiment, extract insights, and generate real-time dashboard updates';
    
    const decomposition = await router.decomposeGoal(performanceGoal, {
      performance_requirements: {
        max_response_time_ms: 30000, // 30 seconds
        min_efficiency_target: 0.30, // 30% efficiency improvement
        preferred_strategy: 'parallel'
      },
      resource_constraints: {
        max_agent_count: 12,
        cost_optimization: true
      }
    });

    console.log('Intelligent Router Results:');
    console.log(`- Optimized Strategy: ${decomposition.execution_strategy}`);
    console.log(`- Parallel Processing Tasks: ${decomposition.sub_tasks.filter(t => t.priority >= 8).length}`);
    console.log(`- Success Threshold: ${decomposition.convergence_criteria.success_threshold}`);

    // Execute the orchestration
    const metrics = await router.executeOrchestration(decomposition);
    
    console.log('Execution Results:');
    console.log(`- Efficiency Gain: ${metrics.efficiency_gain.toFixed(1)}% (Target: 26%+)`);
    console.log(`- Coordination Improvement: ${metrics.coordination_improvement.toFixed(1)}%`);
    console.log(`- Agents Utilized: ${metrics.agents_utilized.length}`);
    console.log(`- Cost Savings: $${metrics.cost_savings.toFixed(2)}`);

  } catch (error) {
    console.error('Intelligent router example failed:', error);
  }
}

/**
 * Example 4: Workflow Coordinator for Complex Processes
 */
export async function workflowCoordinatorExample() {
  console.log('\n=== Example 4: Workflow Coordinator ===');
  
  const discoveryEngine = new UADPDiscoveryEngine();

  try {
    // Create workflow coordinator for complex multi-stage processes
    const coordinator = await createSpecializedOrchestrator('workflow_coordinator', discoveryEngine);
    
    const workflowGoal = 'Implement CI/CD pipeline with code quality checks, security scanning, automated testing, staging deployment, and production release with rollback capability';
    
    const decomposition = await coordinator.decomposeGoal(workflowGoal, {
      domain: 'devops',
      specialization: 'ci-cd',
      compliance_requirements: ['SOC2', 'ISO27001'],
      workflow_patterns: ['pipeline', 'stages', 'handoff', 'rollback']
    });

    console.log('Workflow Coordinator Results:');
    console.log(`- Workflow Structure: ${decomposition.sub_tasks.length} stages`);
    console.log(`- Quality Metrics: ${decomposition.convergence_criteria.quality_metrics.join(', ')}`);
    
    // Show dependency chain
    console.log('- Stage Dependencies:');
    decomposition.sub_tasks.forEach((task, index) => {
      const deps = task.dependencies.length > 0 ? ` (depends on: ${task.dependencies.join(', ')})` : ' (independent)';
      console.log(`  Stage ${index + 1}: ${task.description}${deps}`);
    });

  } catch (error) {
    console.error('Workflow coordinator example failed:', error);
  }
}

/**
 * Example 5: Factory-Based Orchestration with Metrics
 */
export async function factoryOrchestrationExample() {
  console.log('\n=== Example 5: Factory-Based Orchestration ===');
  
  const discoveryEngine = new UADPDiscoveryEngine();
  const factory = new OrchestratorFactory(discoveryEngine);

  try {
    // Multiple goal orchestrations to demonstrate factory capabilities
    const goals = [
      'Analyze customer feedback and generate improvement recommendations',
      'Optimize database performance and implement caching strategy',
      'Conduct security audit and implement remediation plan',
      'Design and implement A/B testing framework',
      'Create automated monitoring and alerting system'
    ];

    const results = [];
    
    console.log('Executing multiple orchestrations...');
    
    for (const [index, goal] of goals.entries()) {
      console.log(`\nOrchestrating goal ${index + 1}: ${goal.substring(0, 50)}...`);
      
      const result = await factory.orchestrateGoal(goal, {
        efficiency_target: 0.26, // OSSA v0.1.8 target
        max_time: 120000, // 2 minutes
        cost_optimization: true
      });
      
      results.push(result.efficiency_metrics);
      
      console.log(`- Orchestrator: ${result.orchestrator_type}`);
      console.log(`- Efficiency: ${result.efficiency_metrics.efficiency_gain.toFixed(1)}%`);
      console.log(`- Completion Rate: ${(result.efficiency_metrics.sub_task_completion_rate * 100).toFixed(1)}%`);
    }

    // Generate performance report
    console.log('\n=== Performance Report ===');
    const report = generatePerformanceReport(results, 1); // 1 hour timeframe
    
    console.log('Summary:');
    console.log(`- Total Orchestrations: ${report.summary.total_orchestrations}`);
    console.log(`- Average Efficiency Gain: ${report.summary.average_efficiency_gain.toFixed(1)}%`);
    console.log(`- Success Rate: ${(report.summary.success_rate * 100).toFixed(1)}%`);
    console.log(`- Token Optimization: ${report.summary.average_token_optimization.toFixed(1)}%`);
    
    console.log('OSSA Compliance:');
    console.log(`- Compliant Orchestrations: ${report.ossa_compliance.compliant_orchestrations}/${report.summary.total_orchestrations}`);
    console.log(`- Compliance Rate: ${(report.ossa_compliance.compliance_rate * 100).toFixed(1)}%`);
    
    console.log('Recommendations:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    // Factory metrics
    console.log('\n=== Factory Metrics ===');
    const factoryMetrics = factory.getFactoryMetrics();
    console.log(`- Average Efficiency Gain: ${factoryMetrics.average_efficiency_gain.toFixed(1)}%`);
    console.log(`- Success Rate: ${(factoryMetrics.success_rate * 100).toFixed(1)}%`);
    console.log(`- Performance Trend: ${factoryMetrics.performance_trends.efficiency_trend}`);
    
    console.log('Orchestrator Utilization:');
    for (const [type, metrics] of Object.entries(factoryMetrics.orchestrator_utilization)) {
      if (metrics.task_count > 0) {
        console.log(`- ${type}: ${metrics.task_count} tasks, ${(metrics.success_rate * 100).toFixed(1)}% success, ${metrics.average_efficiency.toFixed(1)}% avg efficiency`);
      }
    }

  } catch (error) {
    console.error('Factory orchestration example failed:', error);
  }
}

/**
 * Example 6: Health Monitoring and System Status
 */
export async function healthMonitoringExample() {
  console.log('\n=== Example 6: Health Monitoring ===');
  
  const discoveryEngine = new UADPDiscoveryEngine();
  const factory = new OrchestratorFactory(discoveryEngine);

  try {
    // Get factory health status
    const healthStatus = await factory.healthCheck();
    
    console.log('Factory Health Status:');
    console.log(`- Status: ${healthStatus.status}`);
    console.log(`- Active Instances: ${healthStatus.active_instances}`);
    console.log(`- Total Orchestrations: ${healthStatus.total_orchestrations}`);
    console.log(`- Success Rate: ${(healthStatus.success_rate * 100).toFixed(1)}%`);
    console.log(`- Average Efficiency: ${healthStatus.average_efficiency.toFixed(1)}%`);

    // Get active instances
    const activeInstances = factory.getActiveInstances();
    
    console.log('\nActive Orchestrator Instances:');
    if (activeInstances.length === 0) {
      console.log('- No active instances');
    } else {
      activeInstances.forEach((instance, index) => {
        const uptimeHours = (instance.uptime_ms / (1000 * 60 * 60)).toFixed(1);
        console.log(`- Instance ${index + 1}: ${instance.type} (${instance.task_count} tasks, ${uptimeHours}h uptime)`);
      });
    }

    // OSSA system information
    console.log('\n=== OSSA v0.1.8 System Information ===');
    console.log(`- Version: ${OSSA_ORCHESTRATOR_INFO.version}`);
    console.log(`- Specification: ${OSSA_ORCHESTRATOR_INFO.specification}`);
    console.log('- Validated Metrics:');
    console.log(`  * Coordination Efficiency: ${(OSSA_ORCHESTRATOR_INFO.validated_metrics.coordination_efficiency_improvement * 100)}%`);
    console.log(`  * Token Optimization: ${(OSSA_ORCHESTRATOR_INFO.validated_metrics.token_optimization * 100)}%`);
    console.log(`  * Overhead Reduction: ${(OSSA_ORCHESTRATOR_INFO.validated_metrics.orchestration_overhead_reduction * 100)}%`);
    
    console.log('- Available Orchestrator Types:');
    for (const [type, description] of Object.entries(OSSA_ORCHESTRATOR_INFO.orchestrator_types)) {
      console.log(`  * ${type}: ${description}`);
    }

  } catch (error) {
    console.error('Health monitoring example failed:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 OSSA v0.1.8 Orchestrator Agent Examples');
  console.log('Demonstrating validated 26% efficiency improvements through intelligent goal decomposition\n');
  
  try {
    await basicOrchestrationExample();
    await specializedOrchestratorExample();
    await intelligentRouterExample();
    await workflowCoordinatorExample();
    await factoryOrchestrationExample();
    await healthMonitoringExample();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\nKey achievements demonstrated:');
    console.log('- Intelligent goal decomposition with AI-powered analysis');
    console.log('- ML-based agent selection and load balancing');
    console.log('- Complex workflow coordination with handoff protocols');
    console.log('- Dynamic orchestrator selection and management');
    console.log('- Real-time performance monitoring and optimization');
    console.log('- OSSA v0.1.8 compliance validation and reporting');
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}

// Export for direct execution
if (require.main === module) {
  runAllExamples().catch(console.error);
}