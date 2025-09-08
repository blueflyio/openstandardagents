#!/usr/bin/env node

/**
 * OSSA 360° Feedback Loop Demonstration
 * 
 * This script demonstrates the complete 360° Feedback Loop cycle:
 * Plan → Execute → Review → Judge → Learn → Govern
 * 
 * Usage: node feedback-loop-demo.js
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

class FeedbackLoopDemo extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.workspaceDir = './.agents-workspace';
    this.sessionId = `demo-${Date.now()}`;
    this.currentPhase = 'initialization';
    this.metrics = {
      tokensUsed: 0,
      phasesCompleted: 0,
      totalTime: 0,
      feedbackQuality: 0
    };
  }

  async initialize() {
    console.log('🚀 OSSA 360° Feedback Loop Demonstration');
    console.log('==========================================\n');
    
    // Initialize agents
    await this.loadAgents();
    
    // Setup workspace
    await this.setupWorkspace();
    
    // Initialize governance
    await this.initializeGovernance();
    
    console.log('✅ Initialization complete. Starting feedback loop...\n');
  }

  async loadAgents() {
    const agentTypes = [
      'orchestrator',
      'worker', 
      'critic',
      'judge',
      'trainer',
      'governor'
    ];

    console.log('📦 Loading OSSA agents...');
    
    for (const type of agentTypes) {
      try {
        const agentConfig = await this.loadAgentConfig(`${type}-agent.yml`);
        this.agents.set(type, {
          config: agentConfig,
          status: 'ready',
          tokensUsed: 0,
          activeTasks: []
        });
        console.log(`  ✓ ${type} agent loaded`);
      } catch (error) {
        console.error(`  ✗ Failed to load ${type} agent:`, error.message);
      }
    }
    console.log('');
  }

  async loadAgentConfig(filename) {
    // Simulate loading YAML configuration
    return {
      name: filename.replace('-agent.yml', ''),
      version: '1.0.0',
      capabilities: ['demo_capability'],
      budget: { default_limit: filename.includes('governor') ? 5000 : 3000 }
    };
  }

  async setupWorkspace() {
    console.log('🏗️  Setting up .agents-workspace structure...');
    
    const dirs = [
      'plans',
      'executions', 
      'feedback',
      'learning',
      'audit',
      'roadmap'
    ];

    try {
      await fs.mkdir(this.workspaceDir, { recursive: true });
      
      for (const dir of dirs) {
        const dirPath = path.join(this.workspaceDir, dir);
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`  ✓ Created ${dir}/ directory`);
      }
    } catch (error) {
      console.error('Failed to setup workspace:', error.message);
    }
    console.log('');
  }

  async initializeGovernance() {
    console.log('🔐 Initializing governance and budgets...');
    
    const budgetConfig = {
      global: 100000,
      project: 10000,
      task: 12000,
      subtask: 4000,
      planning: 2000
    };

    const governanceLog = {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      budget_allocations: budgetConfig,
      policies_active: [
        'token_budget_enforcement',
        'quality_standards',
        'audit_logging',
        'escalation_protocols'
      ]
    };

    await this.writeToWorkspace('audit', 'governance-init.json', governanceLog);
    console.log('  ✓ Budget allocations set');
    console.log('  ✓ Governance policies activated');
    console.log('  ✓ Audit logging enabled\n');
  }

  async runFeedbackLoop() {
    console.log('🔄 Starting 360° Feedback Loop Execution');
    console.log('=======================================\n');
    
    const goal = {
      objective: "Optimize the customer onboarding process",
      constraints: {
        budget: 8000,
        timeline: "2 hours",
        quality_threshold: 85
      },
      success_criteria: [
        "Process time reduced by 20%",
        "User satisfaction > 4.5/5",
        "Error rate < 2%"
      ]
    };

    try {
      // Phase 1: Plan
      const plan = await this.planPhase(goal);
      
      // Phase 2: Execute
      const executionResults = await this.executePhase(plan);
      
      // Phase 3: Review
      const reviews = await this.reviewPhase(executionResults);
      
      // Phase 4: Judge
      const decisions = await this.judgePhase(reviews);
      
      // Phase 5: Learn
      const learnings = await this.learnPhase(decisions, reviews, executionResults);
      
      // Phase 6: Govern
      await this.governPhase(learnings);
      
      // Summary
      await this.generateSummary();
      
    } catch (error) {
      console.error('❌ Feedback loop failed:', error.message);
      await this.handleError(error);
    }
  }

  async planPhase(goal) {
    console.log('📋 Phase 1: PLAN - Goal Decomposition');
    console.log('------------------------------------');
    
    this.currentPhase = 'planning';
    const orchestrator = this.agents.get('orchestrator');
    const governor = this.agents.get('governor');
    
    // Request governance approval for planning
    console.log('🔐 Requesting governance approval for planning phase...');
    const approvalRequest = {
      agent_id: 'orchestrator',
      action_type: 'planning',
      resource_requirements: { tokens: 2000, time: 300 },
      justification: 'Goal decomposition and task planning'
    };
    
    const approval = await this.simulateGovernanceApproval(approvalRequest);
    if (!approval.approved) {
      throw new Error(`Planning not approved: ${approval.reason}`);
    }
    console.log('  ✅ Planning approved by governor\n');

    // Simulate orchestrator decomposing the goal
    console.log('🎯 Orchestrator analyzing goal and creating execution plan...');
    
    const plan = {
      plan_id: `plan-${this.sessionId}`,
      goal: goal,
      subtasks: [
        {
          id: 'subtask-1',
          description: 'Analyze current onboarding process',
          agent_type: 'worker',
          dependencies: [],
          estimated_tokens: 1500,
          priority: 1
        },
        {
          id: 'subtask-2', 
          description: 'Identify optimization opportunities',
          agent_type: 'worker',
          dependencies: ['subtask-1'],
          estimated_tokens: 2000,
          priority: 2
        },
        {
          id: 'subtask-3',
          description: 'Design improved process flow',
          agent_type: 'worker',
          dependencies: ['subtask-2'],
          estimated_tokens: 2500,
          priority: 3
        }
      ],
      timeline: {
        estimated_duration: '90 minutes',
        milestones: ['Analysis complete', 'Opportunities identified', 'Design finalized']
      },
      risk_analysis: [
        {
          risk: 'Data availability for analysis',
          probability: 0.3,
          mitigation: 'Use synthetic data if needed'
        }
      ],
      total_estimated_tokens: 6000
    };

    // Update tokens used
    orchestrator.tokensUsed += 1800;
    this.metrics.tokensUsed += 1800;
    
    await this.writeToWorkspace('plans', `${plan.plan_id}.json`, plan);
    
    console.log(`  ✅ Plan created with ${plan.subtasks.length} subtasks`);
    console.log(`  📊 Estimated tokens: ${plan.total_estimated_tokens}`);
    console.log(`  ⏱️  Estimated duration: ${plan.timeline.estimated_duration}`);
    console.log(`  ⚠️  Risks identified: ${plan.risk_analysis.length}\n`);
    
    this.metrics.phasesCompleted++;
    return plan;
  }

  async executePhase(plan) {
    console.log('⚡ Phase 2: EXECUTE - Task Execution');
    console.log('----------------------------------');
    
    this.currentPhase = 'execution';
    const worker = this.agents.get('worker');
    const results = [];

    for (const subtask of plan.subtasks) {
      console.log(`🔧 Executing: ${subtask.description}`);
      
      // Check dependencies
      if (subtask.dependencies.length > 0) {
        console.log(`  📋 Checking dependencies: ${subtask.dependencies.join(', ')}`);
        const depsSatisfied = subtask.dependencies.every(dep => 
          results.some(r => r.task_id === dep && r.status === 'completed')
        );
        if (!depsSatisfied) {
          throw new Error(`Dependencies not met for ${subtask.id}`);
        }
      }

      // Request budget approval
      const budgetRequest = {
        agent_id: 'worker',
        action_type: 'execute_task',
        resource_requirements: { tokens: subtask.estimated_tokens },
        task_id: subtask.id
      };

      const budgetApproval = await this.simulateGovernanceApproval(budgetRequest);
      if (!budgetApproval.approved) {
        throw new Error(`Budget not approved for ${subtask.id}: ${budgetApproval.reason}`);
      }

      // Simulate task execution
      const startTime = Date.now();
      
      await this.simulateTaskExecution(subtask);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const result = {
        task_id: subtask.id,
        status: 'completed',
        execution_time: executionTime,
        tokens_used: subtask.estimated_tokens * 0.9, // Slight efficiency gain
        quality_score: 88 + Math.random() * 10, // 88-98% quality
        outputs: {
          description: `Results for: ${subtask.description}`,
          deliverables: [`analysis_${subtask.id}.json`, `report_${subtask.id}.md`]
        },
        issues_encountered: [],
        recommendations: [
          'Consider automation for similar tasks',
          'Validate results with stakeholders'
        ]
      };

      results.push(result);
      worker.tokensUsed += result.tokens_used;
      this.metrics.tokensUsed += result.tokens_used;

      console.log(`  ✅ Completed in ${executionTime}ms`);
      console.log(`  📊 Quality: ${result.quality_score.toFixed(1)}%`);
      console.log(`  🎯 Tokens used: ${result.tokens_used}/${subtask.estimated_tokens}\n`);
    }

    const executionReport = {
      plan_id: plan.plan_id,
      execution_summary: {
        start_time: new Date().toISOString(),
        tasks_completed: results.length,
        total_tokens_used: results.reduce((sum, r) => sum + r.tokens_used, 0),
        average_quality: results.reduce((sum, r) => sum + r.quality_score, 0) / results.length
      },
      task_results: results
    };

    await this.writeToWorkspace('executions', `execution-${plan.plan_id}.json`, executionReport);

    console.log(`📈 Execution Summary:`);
    console.log(`  ✅ Tasks completed: ${results.length}`);
    console.log(`  📊 Average quality: ${executionReport.execution_summary.average_quality.toFixed(1)}%`);
    console.log(`  🎯 Total tokens: ${executionReport.execution_summary.total_tokens_used}\n`);

    this.metrics.phasesCompleted++;
    return executionReport;
  }

  async reviewPhase(executionReport) {
    console.log('🔍 Phase 3: REVIEW - Multi-dimensional Analysis');
    console.log('---------------------------------------------');
    
    this.currentPhase = 'review';
    const critic = this.agents.get('critic');
    const reviews = [];

    for (const result of executionReport.task_results) {
      console.log(`📝 Reviewing: ${result.task_id}`);

      const review = {
        review_id: `review-${result.task_id}`,
        task_id: result.task_id,
        overall_score: result.quality_score,
        dimension_scores: {
          quality: result.quality_score,
          performance: 85 + Math.random() * 10,
          compliance: 92 + Math.random() * 5,
          risk: 88 + Math.random() * 8
        },
        strengths: [
          'Clear methodology and execution',
          'Comprehensive output documentation',
          'Good adherence to requirements'
        ],
        weaknesses: [
          'Could benefit from more stakeholder input',
          'Documentation could be more detailed'
        ],
        risks: [
          {
            risk_type: 'implementation',
            probability: 'low',
            impact: 'medium',
            mitigation: 'Conduct pilot testing before full rollout'
          }
        ],
        recommendations: [
          {
            priority: 'medium',
            category: 'quality',
            recommendation: 'Add automated validation checks',
            effort_estimate: 'low',
            expected_impact: 'high'
          }
        ],
        confidence_level: 87 + Math.random() * 10
      };

      reviews.push(review);
      critic.tokensUsed += 2500;
      this.metrics.tokensUsed += 2500;

      console.log(`  📊 Overall score: ${review.overall_score.toFixed(1)}%`);
      console.log(`  ✅ Strengths: ${review.strengths.length}`);
      console.log(`  ⚠️  Risks: ${review.risks.length}`);
      console.log(`  💡 Recommendations: ${review.recommendations.length}\n`);
    }

    const reviewSummary = {
      session_id: this.sessionId,
      reviews: reviews,
      aggregate_scores: {
        overall: reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length,
        quality: reviews.reduce((sum, r) => sum + r.dimension_scores.quality, 0) / reviews.length,
        performance: reviews.reduce((sum, r) => sum + r.dimension_scores.performance, 0) / reviews.length,
        compliance: reviews.reduce((sum, r) => sum + r.dimension_scores.compliance, 0) / reviews.length,
        risk: reviews.reduce((sum, r) => sum + r.dimension_scores.risk, 0) / reviews.length
      }
    };

    await this.writeToWorkspace('feedback', `reviews-${this.sessionId}.json`, reviewSummary);

    console.log('📈 Review Summary:');
    console.log(`  📊 Average overall score: ${reviewSummary.aggregate_scores.overall.toFixed(1)}%`);
    console.log(`  🏆 Quality score: ${reviewSummary.aggregate_scores.quality.toFixed(1)}%`);
    console.log(`  ⚡ Performance score: ${reviewSummary.aggregate_scores.performance.toFixed(1)}%`);
    console.log(`  ✅ Compliance score: ${reviewSummary.aggregate_scores.compliance.toFixed(1)}%\n`);

    this.metrics.phasesCompleted++;
    this.metrics.feedbackQuality = reviewSummary.aggregate_scores.overall;
    return reviewSummary;
  }

  async judgePhase(reviewSummary) {
    console.log('⚖️  Phase 4: JUDGE - Decision Making');
    console.log('----------------------------------');
    
    this.currentPhase = 'judgment';
    const judge = this.agents.get('judge');

    console.log('🔍 Analyzing reviews and making decisions...');

    const decision = {
      decision_id: `decision-${this.sessionId}`,
      recommendation: reviewSummary.aggregate_scores.overall >= 85 ? 'approve' : 'conditional_approve',
      confidence: 92 + Math.random() * 6,
      alternatives_ranking: [
        {
          rank: 1,
          alternative: 'proceed_with_implementation',
          score: reviewSummary.aggregate_scores.overall,
          pros: ['High quality scores', 'Good compliance', 'Clear recommendations'],
          cons: ['Some minor risks identified', 'Could benefit from more testing']
        }
      ],
      justification: {
        summary: 'Work quality meets standards with minor improvements needed',
        key_factors: [
          'Quality scores above threshold',
          'Compliance requirements met',
          'Risks are manageable'
        ],
        decision_logic: 'Aggregate score exceeds 85% threshold with manageable risks'
      },
      conditions: reviewSummary.aggregate_scores.overall < 90 ? [
        'Address identified risks before full deployment',
        'Implement recommended quality improvements'
      ] : [],
      stakeholder_impact: [
        {
          stakeholder: 'customers',
          impact_level: 'positive',
          impact_description: 'Improved onboarding experience'
        },
        {
          stakeholder: 'operations_team',
          impact_level: 'positive',
          impact_description: 'Reduced manual work and errors'
        }
      ]
    };

    judge.tokensUsed += 2200;
    this.metrics.tokensUsed += 2200;

    await this.writeToWorkspace('feedback', `decision-${this.sessionId}.json`, decision);

    console.log(`⚖️  Decision: ${decision.recommendation.toUpperCase()}`);
    console.log(`🎯 Confidence: ${decision.confidence.toFixed(1)}%`);
    console.log(`📋 Conditions: ${decision.conditions.length}`);
    console.log(`👥 Stakeholder impacts: ${decision.stakeholder_impact.length}\n`);

    this.metrics.phasesCompleted++;
    return decision;
  }

  async learnPhase(decision, reviewSummary, executionReport) {
    console.log('🧠 Phase 5: LEARN - Knowledge Synthesis');
    console.log('--------------------------------------');
    
    this.currentPhase = 'learning';
    const trainer = this.agents.get('trainer');

    console.log('📚 Analyzing feedback patterns and extracting insights...');

    const learnings = {
      session_id: this.sessionId,
      analysis_summary: {
        data_points_analyzed: reviewSummary.reviews.length + 1,
        confidence_level: 89,
        analysis_depth: 'comprehensive'
      },
      key_insights: [
        {
          category: 'quality_patterns',
          insight: 'Tasks with clear requirements achieve 12% higher quality scores',
          confidence: 94,
          supporting_evidence: ['Quality correlation analysis', 'Historical data comparison'],
          impact_level: 'high'
        },
        {
          category: 'efficiency_optimization',
          insight: 'Token usage is 10% more efficient when tasks have proper dependencies',
          confidence: 87,
          supporting_evidence: ['Token usage analysis', 'Dependency graph optimization'],
          impact_level: 'medium'
        }
      ],
      patterns_identified: [
        {
          pattern_type: 'execution_efficiency',
          description: 'Tasks with clear dependencies execute more efficiently',
          frequency: 3,
          trend: 'stable',
          affected_areas: ['planning', 'execution']
        }
      ],
      recommendations: [
        {
          priority: 'high',
          category: 'process_improvement',
          recommendation: 'Implement dependency validation in planning phase',
          implementation_effort: 'medium',
          expected_impact: 'high',
          success_metrics: ['Reduced execution errors', 'Improved token efficiency']
        },
        {
          priority: 'medium',
          category: 'quality_assurance',
          recommendation: 'Add automated quality checks during execution',
          implementation_effort: 'low',
          expected_impact: 'medium',
          success_metrics: ['Higher average quality scores', 'Reduced review time']
        }
      ],
      capability_updates: [
        {
          agent_type: 'orchestrator',
          capability: 'dependency_validation',
          update_type: 'enhancement',
          description: 'Improve dependency checking during planning',
          rationale: 'Reduces execution errors and improves efficiency'
        }
      ]
    };

    trainer.tokensUsed += 3200;
    this.metrics.tokensUsed += 3200;

    await this.writeToWorkspace('learning', `insights-${this.sessionId}.json`, learnings);

    console.log('🔍 Learning Summary:');
    console.log(`  💡 Key insights: ${learnings.key_insights.length}`);
    console.log(`  📈 Patterns identified: ${learnings.patterns_identified.length}`);
    console.log(`  🎯 Recommendations: ${learnings.recommendations.length}`);
    console.log(`  🔧 Capability updates: ${learnings.capability_updates.length}\n`);

    this.metrics.phasesCompleted++;
    return learnings;
  }

  async governPhase(learnings) {
    console.log('🔐 Phase 6: GOVERN - Compliance & Optimization');
    console.log('--------------------------------------------');
    
    this.currentPhase = 'governance';
    const governor = this.agents.get('governor');

    console.log('📊 Generating governance report and compliance assessment...');

    const governanceReport = {
      session_id: this.sessionId,
      report_timestamp: new Date().toISOString(),
      budget_performance: {
        total_budget_allocated: 10000,
        total_budget_used: this.metrics.tokensUsed,
        utilization_percentage: (this.metrics.tokensUsed / 10000) * 100,
        budget_efficiency: 'good',
        cost_optimization_opportunities: [
          'Implement token caching for repeated operations',
          'Use smaller models for simple validation tasks'
        ]
      },
      compliance_summary: {
        overall_compliance_score: 96,
        policy_violations: 0,
        successful_enforcements: 6,
        audit_events_logged: 12
      },
      performance_assessment: {
        phases_completed: this.metrics.phasesCompleted,
        average_quality: this.metrics.feedbackQuality,
        efficiency_score: 87,
        success_rate: 100
      },
      recommendations: [
        {
          priority: 'medium',
          category: 'budget_optimization',
          recommendation: 'Implement progressive budget allocation based on task complexity',
          expected_impact: '15% budget savings'
        },
        {
          priority: 'low',
          category: 'process_optimization',
          recommendation: 'Add predictive budget estimation for better planning',
          expected_impact: 'Improved budget accuracy'
        }
      ]
    };

    governor.tokensUsed += 1500;
    this.metrics.tokensUsed += 1500;

    await this.writeToWorkspace('audit', `governance-report-${this.sessionId}.json`, governanceReport);

    console.log('📈 Governance Summary:');
    console.log(`  💰 Budget utilization: ${governanceReport.budget_performance.utilization_percentage.toFixed(1)}%`);
    console.log(`  ✅ Compliance score: ${governanceReport.compliance_summary.overall_compliance_score}%`);
    console.log(`  🚫 Policy violations: ${governanceReport.compliance_summary.policy_violations}`);
    console.log(`  ⚡ Efficiency score: ${governanceReport.performance_assessment.efficiency_score}%\n`);

    this.metrics.phasesCompleted++;
    return governanceReport;
  }

  async generateSummary() {
    console.log('📋 360° FEEDBACK LOOP COMPLETE');
    console.log('===============================\n');

    const summary = {
      session_id: this.sessionId,
      completion_time: new Date().toISOString(),
      phases_completed: this.metrics.phasesCompleted,
      total_tokens_used: this.metrics.tokensUsed,
      average_quality: this.metrics.feedbackQuality,
      agent_utilization: {},
      success_metrics: {
        loop_completion_rate: 100,
        average_phase_quality: 89.5,
        budget_adherence: 95.2,
        compliance_score: 96
      },
      key_outcomes: [
        'Successfully completed all 6 phases of feedback loop',
        'Achieved high quality scores across all dimensions',
        'Maintained budget compliance throughout execution',
        'Generated actionable insights for continuous improvement'
      ]
    };

    // Calculate agent utilization
    for (const [agentType, agent] of this.agents.entries()) {
      summary.agent_utilization[agentType] = {
        tokens_used: agent.tokensUsed,
        budget_limit: agent.config.budget.default_limit,
        utilization_percentage: (agent.tokensUsed / agent.config.budget.default_limit) * 100
      };
    }

    await this.writeToWorkspace('audit', `session-summary-${this.sessionId}.json`, summary);

    console.log('🎉 SUCCESS: 360° Feedback Loop completed successfully!');
    console.log('');
    console.log('📊 Final Metrics:');
    console.log(`  🔄 Phases completed: ${summary.phases_completed}/6`);
    console.log(`  🎯 Total tokens used: ${summary.total_tokens_used.toLocaleString()}`);
    console.log(`  🏆 Average quality: ${summary.average_quality.toFixed(1)}%`);
    console.log(`  💰 Budget adherence: ${summary.success_metrics.budget_adherence}%`);
    console.log(`  ✅ Compliance score: ${summary.success_metrics.compliance_score}%`);
    console.log('');
    console.log('👥 Agent Utilization:');
    for (const [agentType, utilization] of Object.entries(summary.agent_utilization)) {
      console.log(`  ${agentType}: ${utilization.tokens_used}/${utilization.budget_limit} (${utilization.utilization_percentage.toFixed(1)}%)`);
    }
    console.log('');
    console.log('🎯 Key Outcomes:');
    summary.key_outcomes.forEach((outcome, index) => {
      console.log(`  ${index + 1}. ${outcome}`);
    });
    console.log('');
    console.log(`📁 All artifacts saved to: ${this.workspaceDir}`);
    console.log('🔍 Use OSSA CLI to explore results: ossa workspace analyze');
  }

  // Utility methods

  async simulateTaskExecution(subtask) {
    // Simulate realistic execution time
    const baseTime = 200;
    const variability = Math.random() * 300;
    return new Promise(resolve => setTimeout(resolve, baseTime + variability));
  }

  async simulateGovernanceApproval(request) {
    // Simulate governance decision-making
    const approvalProbability = 0.95; // 95% approval rate
    const approved = Math.random() < approvalProbability;
    
    return {
      approved,
      reason: approved ? 'Request meets policy requirements' : 'Budget limit exceeded',
      conditions: approved ? [] : ['Reduce resource requirements', 'Provide additional justification']
    };
  }

  async writeToWorkspace(directory, filename, data) {
    const filepath = path.join(this.workspaceDir, directory, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
  }

  async handleError(error) {
    console.error('❌ Error in feedback loop:', error.message);
    
    const errorReport = {
      session_id: this.sessionId,
      error_timestamp: new Date().toISOString(),
      current_phase: this.currentPhase,
      error_message: error.message,
      stack_trace: error.stack,
      recovery_suggestions: [
        'Check agent configurations',
        'Verify workspace permissions',
        'Validate input data format'
      ]
    };

    try {
      await this.writeToWorkspace('audit', `error-${this.sessionId}.json`, errorReport);
      console.log(`📁 Error report saved to workspace`);
    } catch (saveError) {
      console.error('Failed to save error report:', saveError.message);
    }
  }
}

// Run the demonstration
async function main() {
  const demo = new FeedbackLoopDemo();
  
  try {
    await demo.initialize();
    await demo.runFeedbackLoop();
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default FeedbackLoopDemo;