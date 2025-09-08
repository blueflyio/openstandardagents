#!/usr/bin/env node

/**
 * Multi-Agent Orchestration Demonstration
 * 
 * This script demonstrates all six orchestration patterns supported by OSSA:
 * 1. Sequential Pipeline
 * 2. Parallel Processing  
 * 3. Hierarchical Coordination
 * 4. Consensus Decision Making
 * 5. Dynamic Load Balancing
 * 6. Event-Driven Coordination
 * 
 * Usage: node orchestration-demo.js [--pattern=all|sequential|parallel|hierarchical|consensus|loadbalancing|eventdriven]
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import crypto from 'crypto';

class OrchestrationDemo extends EventEmitter {
  constructor() {
    super();
    this.sessionId = `orchestration-${Date.now()}`;
    this.agentPool = new Map();
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.performanceMetrics = {
      workflowsExecuted: 0,
      averageExecutionTime: 0,
      successRate: 0,
      agentUtilization: 0,
      patternPerformance: new Map()
    };
    
    this.orchestrationPatterns = {
      sequential: this.executeSequentialPipeline.bind(this),
      parallel: this.executeParallelProcessing.bind(this),
      hierarchical: this.executeHierarchicalCoordination.bind(this),
      consensus: this.executeConsensusDecision.bind(this),
      loadbalancing: this.executeDynamicLoadBalancing.bind(this),
      eventdriven: this.executeEventDrivenCoordination.bind(this)
    };
  }

  async initialize() {
    console.log('🎭 Multi-Agent Orchestration Demonstration');
    console.log('=========================================\n');
    
    await this.initializeAgentPool();
    await this.loadWorkflowTemplates();
    
    console.log('✅ Orchestration system initialized successfully\n');
  }

  async initializeAgentPool() {
    console.log('👥 Initializing agent pool...');
    
    const agents = [
      // Orchestrators
      { id: 'orchestrator-01', type: 'orchestration', capabilities: ['workflow_coordination', 'task_planning'], load: 0.2, reliability: 0.95 },
      { id: 'orchestrator-02', type: 'orchestration', capabilities: ['workflow_coordination', 'resource_management'], load: 0.3, reliability: 0.92 },
      
      // Workers
      { id: 'worker-01', type: 'execution', capabilities: ['data_processing', 'analysis'], load: 0.5, reliability: 0.88 },
      { id: 'worker-02', type: 'execution', capabilities: ['content_generation', 'formatting'], load: 0.4, reliability: 0.90 },
      { id: 'worker-03', type: 'execution', capabilities: ['data_validation', 'quality_check'], load: 0.6, reliability: 0.87 },
      { id: 'worker-04', type: 'execution', capabilities: ['report_generation', 'visualization'], load: 0.3, reliability: 0.93 },
      
      // Critics/Reviewers
      { id: 'critic-01', type: 'evaluation', capabilities: ['quality_assessment', 'risk_analysis'], load: 0.4, reliability: 0.91 },
      { id: 'critic-02', type: 'evaluation', capabilities: ['compliance_check', 'audit'], load: 0.2, reliability: 0.96 },
      { id: 'critic-03', type: 'evaluation', capabilities: ['performance_review', 'optimization'], load: 0.5, reliability: 0.89 },
      
      // Specialists
      { id: 'specialist-nlp', type: 'specialist', capabilities: ['nlp_processing', 'text_analysis'], load: 0.1, reliability: 0.94 },
      { id: 'specialist-data', type: 'specialist', capabilities: ['database_operations', 'data_modeling'], load: 0.7, reliability: 0.86 },
      { id: 'specialist-viz', type: 'specialist', capabilities: ['data_visualization', 'dashboard_creation'], load: 0.3, reliability: 0.92 }
    ];

    for (const agent of agents) {
      this.agentPool.set(agent.id, {
        ...agent,
        status: 'available',
        activeWorkflows: [],
        performanceHistory: [],
        lastUpdate: Date.now()
      });
    }

    console.log(`  ✓ Initialized ${agents.length} agents in pool`);
    console.log(`  📊 Agent types: ${this.getAgentTypeDistribution()}`);
  }

  async loadWorkflowTemplates() {
    console.log('📋 Loading workflow templates...');
    
    const templates = {
      sequential_pipeline: {
        name: 'Sequential Pipeline',
        pattern: 'sequential',
        stages: [
          { id: 'input_validation', type: 'validation', capabilities: ['data_validation'] },
          { id: 'data_processing', type: 'processing', capabilities: ['data_processing'] },
          { id: 'analysis', type: 'analysis', capabilities: ['analysis'] },
          { id: 'report_generation', type: 'output', capabilities: ['report_generation'] }
        ],
        dependencies: 'linear',
        estimated_duration: 300 // seconds
      },
      
      parallel_processing: {
        name: 'Parallel Processing',
        pattern: 'parallel',
        branches: [
          { id: 'text_analysis', capabilities: ['nlp_processing', 'text_analysis'] },
          { id: 'data_analysis', capabilities: ['data_processing', 'analysis'] },
          { id: 'quality_check', capabilities: ['quality_assessment'] }
        ],
        synchronization: 'wait_for_all',
        merge_stage: { id: 'consolidation', capabilities: ['content_generation'] },
        estimated_duration: 180
      },
      
      hierarchical_coordination: {
        name: 'Hierarchical Coordination',
        pattern: 'hierarchical',
        levels: [
          {
            level: 1,
            coordinator: { capabilities: ['workflow_coordination'] },
            sub_workflows: [
              { id: 'data_pipeline', stages: 3 },
              { id: 'analysis_pipeline', stages: 2 },
              { id: 'reporting_pipeline', stages: 2 }
            ]
          }
        ],
        estimated_duration: 450
      },
      
      consensus_decision: {
        name: 'Consensus Decision',
        pattern: 'consensus',
        participants: [
          { type: 'critic', count: 3, capabilities: ['quality_assessment', 'risk_analysis'] }
        ],
        consensus_algorithm: 'weighted_voting',
        confidence_threshold: 0.8,
        estimated_duration: 120
      },
      
      dynamic_load_balancing: {
        name: 'Dynamic Load Balancing',
        pattern: 'loadbalancing',
        task_queue: 'dynamic',
        balancing_strategy: 'capability_weighted',
        monitoring_interval: 5, // seconds
        estimated_duration: 240
      },
      
      event_driven_coordination: {
        name: 'Event-Driven Coordination',
        pattern: 'eventdriven',
        triggers: ['data_arrival', 'threshold_exceeded', 'user_request'],
        response_patterns: {
          'data_arrival': { agents: ['data_processing'], priority: 'medium' },
          'threshold_exceeded': { agents: ['analysis', 'alert'], priority: 'high' },
          'user_request': { agents: ['content_generation'], priority: 'low' }
        },
        estimated_duration: 90
      }
    };

    for (const [key, template] of Object.entries(templates)) {
      this.workflowTemplates.set(key, template);
    }

    console.log(`  ✓ Loaded ${Object.keys(templates).length} workflow templates`);
  }

  async runOrchestrationDemo(pattern = 'all') {
    console.log('🚀 Starting Orchestration Pattern Demonstrations');
    console.log('===============================================\n');

    const patternsToRun = pattern === 'all' ? 
      Object.keys(this.orchestrationPatterns) : 
      [pattern];

    for (const patternName of patternsToRun) {
      if (this.orchestrationPatterns[patternName]) {
        await this.demonstratePattern(patternName);
      } else {
        console.log(`❌ Unknown pattern: ${patternName}`);
      }
    }

    await this.generateOrchestrationReport();
  }

  async demonstratePattern(patternName) {
    const patternFunction = this.orchestrationPatterns[patternName];
    const template = this.workflowTemplates.get(`${patternName}_${patternName === 'loadbalancing' ? 'load_balancing' : patternName === 'eventdriven' ? 'event_driven_coordination' : patternName + '_pipeline'}`);
    
    console.log(`🎯 Pattern: ${patternName.toUpperCase()}`);
    console.log('─'.repeat(50));

    const startTime = Date.now();
    
    try {
      const result = await patternFunction();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Pattern completed successfully`);
      console.log(`⏱️  Execution time: ${duration}ms`);
      console.log(`📊 Success rate: ${(result.successRate * 100).toFixed(1)}%`);
      console.log(`👥 Agents used: ${result.agentsUsed}`);
      
      // Update metrics
      this.updatePatternMetrics(patternName, duration, result.successRate, result.agentsUsed);
      
    } catch (error) {
      console.log(`❌ Pattern failed: ${error.message}`);
    }
    
    console.log('');
  }

  // Pattern Implementation Methods

  async executeSequentialPipeline() {
    console.log('📝 Executing Sequential Pipeline...');
    
    const stages = [
      { name: 'Input Validation', capability: 'data_validation' },
      { name: 'Data Processing', capability: 'data_processing' },
      { name: 'Analysis', capability: 'analysis' },
      { name: 'Report Generation', capability: 'report_generation' }
    ];
    
    const workflowId = this.generateWorkflowId();
    let previousResult = { status: 'success', data: 'initial_input' };
    let agentsUsed = 0;
    let successfulStages = 0;
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      console.log(`  ${i + 1}. ${stage.name}`);
      
      if (previousResult.status !== 'success') {
        console.log(`    ⚠️  Skipping due to previous stage failure`);
        break;
      }
      
      const agent = this.selectBestAgent([stage.capability]);
      if (!agent) {
        console.log(`    ❌ No available agent for ${stage.capability}`);
        previousResult = { status: 'failed', error: 'no_agent_available' };
        break;
      }
      
      console.log(`    🤖 Agent: ${agent.id}`);
      
      // Simulate stage execution
      const stageResult = await this.simulateStageExecution(agent, stage, previousResult.data);
      
      if (stageResult.status === 'success') {
        console.log(`    ✅ Completed in ${stageResult.duration}ms`);
        previousResult = stageResult;
        successfulStages++;
        agentsUsed++;
      } else {
        console.log(`    ❌ Failed: ${stageResult.error}`);
        previousResult = stageResult;
        break;
      }
      
      // Release agent
      this.releaseAgent(agent.id);
    }
    
    return {
      workflowId,
      successRate: successfulStages / stages.length,
      agentsUsed,
      finalResult: previousResult
    };
  }

  async executeParallelProcessing() {
    console.log('⚡ Executing Parallel Processing...');
    
    const branches = [
      { name: 'Text Analysis', capability: 'nlp_processing' },
      { name: 'Data Analysis', capability: 'data_processing' },
      { name: 'Quality Check', capability: 'quality_assessment' }
    ];
    
    const workflowId = this.generateWorkflowId();
    
    // Execute branches in parallel
    console.log('  🔀 Starting parallel branches...');
    const branchPromises = branches.map(async (branch, index) => {
      const agent = this.selectBestAgent([branch.capability]);
      if (!agent) {
        return { branchIndex: index, status: 'failed', error: 'no_agent_available' };
      }
      
      console.log(`    ${index + 1}. ${branch.name} → Agent: ${agent.id}`);
      
      const result = await this.simulateStageExecution(agent, branch, 'parallel_input');
      this.releaseAgent(agent.id);
      
      return { branchIndex: index, ...result };
    });
    
    const branchResults = await Promise.all(branchPromises);
    
    // Consolidation phase
    console.log('  🔄 Consolidating results...');
    const consolidationAgent = this.selectBestAgent(['content_generation']);
    let consolidationResult = { status: 'success' };
    
    if (consolidationAgent) {
      console.log(`    🤖 Consolidation Agent: ${consolidationAgent.id}`);
      consolidationResult = await this.simulateStageExecution(
        consolidationAgent, 
        { name: 'Consolidation', capability: 'content_generation' },
        branchResults
      );
      this.releaseAgent(consolidationAgent.id);
    }
    
    const successfulBranches = branchResults.filter(r => r.status === 'success').length;
    
    return {
      workflowId,
      successRate: successfulBranches / branches.length,
      agentsUsed: branchResults.length + (consolidationAgent ? 1 : 0),
      branchResults,
      consolidationResult
    };
  }

  async executeHierarchicalCoordination() {
    console.log('🏛️  Executing Hierarchical Coordination...');
    
    const workflowId = this.generateWorkflowId();
    
    // Level 1: Master Coordinator
    const masterCoordinator = this.selectBestAgent(['workflow_coordination']);
    if (!masterCoordinator) {
      throw new Error('No master coordinator available');
    }
    
    console.log(`  👑 Master Coordinator: ${masterCoordinator.id}`);
    
    // Level 2: Sub-coordinators
    const subWorkflows = [
      { name: 'Data Pipeline', stages: ['validation', 'processing', 'storage'] },
      { name: 'Analysis Pipeline', stages: ['analysis', 'insights'] },
      { name: 'Reporting Pipeline', stages: ['formatting', 'delivery'] }
    ];
    
    let totalAgentsUsed = 1; // Master coordinator
    let successfulSubWorkflows = 0;
    
    for (let i = 0; i < subWorkflows.length; i++) {
      const subWorkflow = subWorkflows[i];
      console.log(`  📋 ${i + 1}. ${subWorkflow.name}`);
      
      const subCoordinator = this.selectBestAgent(['workflow_coordination']);
      if (!subCoordinator) {
        console.log(`    ❌ No sub-coordinator available`);
        continue;
      }
      
      console.log(`    🤖 Sub-coordinator: ${subCoordinator.id}`);
      totalAgentsUsed++;
      
      // Execute sub-workflow stages
      let subWorkflowSuccess = true;
      for (let j = 0; j < subWorkflow.stages.length; j++) {
        const stage = subWorkflow.stages[j];
        const worker = this.selectBestAgent(['data_processing']); // Generic capability
        
        if (!worker) {
          subWorkflowSuccess = false;
          break;
        }
        
        console.log(`      ${j + 1}.${i + 1} ${stage} → ${worker.id}`);
        
        const result = await this.simulateStageExecution(worker, { name: stage }, `input_${j}`);
        this.releaseAgent(worker.id);
        totalAgentsUsed++;
        
        if (result.status !== 'success') {
          subWorkflowSuccess = false;
          break;
        }
      }
      
      this.releaseAgent(subCoordinator.id);
      
      if (subWorkflowSuccess) {
        successfulSubWorkflows++;
        console.log(`    ✅ ${subWorkflow.name} completed`);
      } else {
        console.log(`    ❌ ${subWorkflow.name} failed`);
      }
    }
    
    this.releaseAgent(masterCoordinator.id);
    
    return {
      workflowId,
      successRate: successfulSubWorkflows / subWorkflows.length,
      agentsUsed: totalAgentsUsed
    };
  }

  async executeConsensusDecision() {
    console.log('⚖️  Executing Consensus Decision Making...');
    
    const workflowId = this.generateWorkflowId();
    const decisionTopic = "Should we proceed with the proposed system architecture changes?";
    
    console.log(`  🎯 Decision Topic: ${decisionTopic}`);
    
    // Select expert agents for consensus
    const experts = [
      this.selectBestAgent(['quality_assessment']),
      this.selectBestAgent(['risk_analysis']),
      this.selectBestAgent(['performance_review'])
    ].filter(Boolean);
    
    if (experts.length < 2) {
      throw new Error('Insufficient experts available for consensus');
    }
    
    console.log(`  👥 Expert panel: ${experts.length} agents`);
    
    // Collect expert opinions
    const opinions = [];
    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i];
      console.log(`    ${i + 1}. Expert ${expert.id}`);
      
      const opinion = await this.simulateExpertOpinion(expert, decisionTopic);
      opinions.push(opinion);
      
      console.log(`      📊 Vote: ${opinion.vote}, Confidence: ${(opinion.confidence * 100).toFixed(1)}%`);
      this.releaseAgent(expert.id);
    }
    
    // Calculate consensus
    const consensus = this.calculateConsensus(opinions);
    console.log(`  🎯 Consensus Result: ${consensus.decision}`);
    console.log(`  📊 Confidence Level: ${(consensus.confidence * 100).toFixed(1)}%`);
    
    return {
      workflowId,
      successRate: consensus.confidence,
      agentsUsed: experts.length,
      consensusResult: consensus
    };
  }

  async executeDynamicLoadBalancing() {
    console.log('⚖️  Executing Dynamic Load Balancing...');
    
    const workflowId = this.generateWorkflowId();
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `task_${i + 1}`,
      complexity: Math.random() * 5 + 1, // 1-6 complexity
      capability: ['data_processing', 'analysis', 'content_generation'][Math.floor(Math.random() * 3)]
    }));
    
    console.log(`  📋 Task Queue: ${tasks.length} tasks`);
    
    let completedTasks = 0;
    let totalAgentsUsed = 0;
    
    // Process tasks with dynamic load balancing
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Find least loaded agent with required capability
      const agent = this.selectLeastLoadedAgent([task.capability]);
      if (!agent) {
        console.log(`    ❌ Task ${task.id}: No available agent`);
        continue;
      }
      
      console.log(`    ${i + 1}. Task ${task.id} → Agent ${agent.id} (Load: ${(agent.load * 100).toFixed(0)}%)`);
      
      // Simulate task execution
      const result = await this.simulateTaskExecution(agent, task);
      
      if (result.status === 'success') {
        completedTasks++;
        console.log(`      ✅ Completed in ${result.duration}ms`);
      } else {
        console.log(`      ❌ Failed: ${result.error}`);
      }
      
      // Update agent load and release
      this.updateAgentLoad(agent.id, -task.complexity * 0.1);
      totalAgentsUsed++;
    }
    
    return {
      workflowId,
      successRate: completedTasks / tasks.length,
      agentsUsed: totalAgentsUsed
    };
  }

  async executeEventDrivenCoordination() {
    console.log('⚡ Executing Event-Driven Coordination...');
    
    const workflowId = this.generateWorkflowId();
    
    // Simulate event stream
    const events = [
      { type: 'data_arrival', priority: 'medium', data: 'customer_feedback_batch' },
      { type: 'threshold_exceeded', priority: 'high', data: 'error_rate_spike' },
      { type: 'user_request', priority: 'low', data: 'generate_monthly_report' },
      { type: 'data_arrival', priority: 'medium', data: 'sensor_data_stream' },
      { type: 'threshold_exceeded', priority: 'critical', data: 'system_overload_detected' }
    ];
    
    console.log(`  📡 Event Stream: ${events.length} events`);
    
    let processedEvents = 0;
    let totalAgentsActivated = 0;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`    ${i + 1}. Event: ${event.type} (${event.priority})`);
      
      // Determine response pattern
      const responseAgents = this.determineEventResponse(event);
      
      if (responseAgents.length === 0) {
        console.log(`      ⚠️  No response pattern configured`);
        continue;
      }
      
      // Activate response agents
      const activatedAgents = [];
      for (const agentCapability of responseAgents) {
        const agent = this.selectBestAgent([agentCapability]);
        if (agent) {
          activatedAgents.push(agent);
          totalAgentsActivated++;
        }
      }
      
      console.log(`      🚀 Activated ${activatedAgents.length} agents`);
      
      // Simulate event processing
      const processingResults = await Promise.all(
        activatedAgents.map(agent => 
          this.simulateEventProcessing(agent, event)
        )
      );
      
      const successfulProcessing = processingResults.filter(r => r.status === 'success').length;
      
      if (successfulProcessing > 0) {
        processedEvents++;
        console.log(`      ✅ Event processed successfully`);
      } else {
        console.log(`      ❌ Event processing failed`);
      }
      
      // Release agents
      activatedAgents.forEach(agent => this.releaseAgent(agent.id));
    }
    
    return {
      workflowId,
      successRate: processedEvents / events.length,
      agentsUsed: totalAgentsActivated
    };
  }

  // Helper Methods

  selectBestAgent(requiredCapabilities) {
    const availableAgents = Array.from(this.agentPool.values())
      .filter(agent => 
        agent.status === 'available' &&
        requiredCapabilities.some(cap => 
          agent.capabilities.some(agentCap => 
            agentCap.includes(cap) || cap.includes(agentCap)
          )
        )
      )
      .sort((a, b) => b.reliability - a.reliability);
    
    if (availableAgents.length === 0) return null;
    
    const selectedAgent = availableAgents[0];
    selectedAgent.status = 'busy';
    selectedAgent.lastAssignment = Date.now();
    
    return selectedAgent;
  }

  selectLeastLoadedAgent(requiredCapabilities) {
    const availableAgents = Array.from(this.agentPool.values())
      .filter(agent => 
        requiredCapabilities.some(cap => 
          agent.capabilities.some(agentCap => 
            agentCap.includes(cap) || cap.includes(agentCap)
          )
        )
      )
      .sort((a, b) => a.load - b.load);
    
    if (availableAgents.length === 0) return null;
    
    const selectedAgent = availableAgents[0];
    return selectedAgent;
  }

  releaseAgent(agentId) {
    const agent = this.agentPool.get(agentId);
    if (agent) {
      agent.status = 'available';
      agent.lastRelease = Date.now();
    }
  }

  updateAgentLoad(agentId, loadChange) {
    const agent = this.agentPool.get(agentId);
    if (agent) {
      agent.load = Math.max(0, Math.min(1, agent.load + loadChange));
    }
  }

  async simulateStageExecution(agent, stage, input) {
    // Simulate realistic execution time based on agent performance and stage complexity
    const baseTime = 50 + Math.random() * 100; // 50-150ms base
    const performanceFactor = agent.reliability;
    const loadFactor = 1 + agent.load * 0.5; // Higher load = slower execution
    
    const executionTime = Math.floor(baseTime * loadFactor / performanceFactor);
    
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate success/failure based on agent reliability
    const success = Math.random() < agent.reliability;
    
    return {
      status: success ? 'success' : 'failed',
      duration: executionTime,
      data: success ? `${stage.name}_result` : null,
      error: success ? null : 'execution_failed'
    };
  }

  async simulateTaskExecution(agent, task) {
    const executionTime = Math.floor(task.complexity * 20 * (1 + agent.load));
    
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    const success = Math.random() < agent.reliability;
    
    return {
      status: success ? 'success' : 'failed',
      duration: executionTime,
      error: success ? null : 'task_execution_failed'
    };
  }

  async simulateExpertOpinion(expert, topic) {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // Simulate expert analysis
    const vote = Math.random() > 0.3 ? 'approve' : 'reject'; // 70% approval rate
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
    
    return {
      expertId: expert.id,
      vote,
      confidence,
      reasoning: `Analysis based on ${expert.capabilities.join(' and ')} expertise`
    };
  }

  async simulateEventProcessing(agent, event) {
    const processingTime = event.priority === 'critical' ? 10 : 30 + Math.random() * 50;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const success = Math.random() < agent.reliability;
    
    return {
      status: success ? 'success' : 'failed',
      processingTime,
      agentId: agent.id
    };
  }

  calculateConsensus(opinions) {
    const approveVotes = opinions.filter(op => op.vote === 'approve');
    const rejectVotes = opinions.filter(op => op.vote === 'reject');
    
    // Weighted voting based on confidence
    const approveWeight = approveVotes.reduce((sum, op) => sum + op.confidence, 0);
    const rejectWeight = rejectVotes.reduce((sum, op) => sum + op.confidence, 0);
    
    const totalWeight = approveWeight + rejectWeight;
    const approvalRatio = approveWeight / totalWeight;
    
    return {
      decision: approvalRatio > 0.6 ? 'approve' : 'reject',
      confidence: Math.max(approvalRatio, 1 - approvalRatio),
      approveVotes: approveVotes.length,
      rejectVotes: rejectVotes.length,
      approvalRatio
    };
  }

  determineEventResponse(event) {
    const responsePatterns = {
      'data_arrival': ['data_processing'],
      'threshold_exceeded': ['analysis', 'quality_assessment'],
      'user_request': ['content_generation']
    };
    
    return responsePatterns[event.type] || [];
  }

  updatePatternMetrics(pattern, duration, successRate, agentsUsed) {
    const existing = this.performanceMetrics.patternPerformance.get(pattern) || {
      executions: 0,
      totalDuration: 0,
      totalSuccessRate: 0,
      totalAgentsUsed: 0
    };
    
    existing.executions++;
    existing.totalDuration += duration;
    existing.totalSuccessRate += successRate;
    existing.totalAgentsUsed += agentsUsed;
    
    this.performanceMetrics.patternPerformance.set(pattern, existing);
    
    // Update global metrics
    this.performanceMetrics.workflowsExecuted++;
  }

  async generateOrchestrationReport() {
    console.log('📊 Orchestration Performance Report');
    console.log('==================================\n');

    console.log('🎯 Pattern Performance Summary:');
    for (const [pattern, metrics] of this.performanceMetrics.patternPerformance.entries()) {
      const avgDuration = metrics.totalDuration / metrics.executions;
      const avgSuccessRate = metrics.totalSuccessRate / metrics.executions;
      const avgAgentsUsed = metrics.totalAgentsUsed / metrics.executions;
      
      console.log(`  📋 ${pattern.toUpperCase()}:`);
      console.log(`    ⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
      console.log(`    ✅ Average Success Rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
      console.log(`    👥 Average Agents Used: ${avgAgentsUsed.toFixed(1)}`);
      console.log(`    🔄 Executions: ${metrics.executions}`);
    }

    console.log('\n👥 Agent Pool Utilization:');
    const utilizationStats = this.calculateAgentUtilization();
    console.log(`  📊 Overall Utilization: ${(utilizationStats.overall * 100).toFixed(1)}%`);
    console.log(`  🏆 Most Active Agent: ${utilizationStats.mostActive.id} (${(utilizationStats.mostActive.utilization * 100).toFixed(1)}%)`);
    console.log(`  💤 Least Active Agent: ${utilizationStats.leastActive.id} (${(utilizationStats.leastActive.utilization * 100).toFixed(1)}%)`);

    console.log('\n💡 Optimization Recommendations:');
    const recommendations = this.generateOptimizationRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    // Save detailed report
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metrics: {
        workflowsExecuted: this.performanceMetrics.workflowsExecuted,
        patternPerformance: Object.fromEntries(this.performanceMetrics.patternPerformance),
        agentUtilization: utilizationStats
      },
      recommendations
    };

    await fs.writeFile(
      `orchestration-report-${this.sessionId}.json`,
      JSON.stringify(report, null, 2)
    );

    console.log(`\n📁 Detailed report saved: orchestration-report-${this.sessionId}.json`);
  }

  // Utility methods

  generateWorkflowId() {
    return crypto.randomBytes(4).toString('hex');
  }

  getAgentTypeDistribution() {
    const distribution = {};
    for (const agent of this.agentPool.values()) {
      distribution[agent.type] = (distribution[agent.type] || 0) + 1;
    }
    return Object.entries(distribution).map(([type, count]) => `${type}: ${count}`).join(', ');
  }

  calculateAgentUtilization() {
    const agents = Array.from(this.agentPool.values());
    const totalUtilization = agents.reduce((sum, agent) => sum + agent.load, 0) / agents.length;
    
    const sortedByUtilization = agents.sort((a, b) => b.load - a.load);
    
    return {
      overall: totalUtilization,
      mostActive: { id: sortedByUtilization[0].id, utilization: sortedByUtilization[0].load },
      leastActive: { id: sortedByUtilization[sortedByUtilization.length - 1].id, utilization: sortedByUtilization[sortedByUtilization.length - 1].load }
    };
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Analyze pattern performance
    const patternMetrics = Array.from(this.performanceMetrics.patternPerformance.entries());
    
    if (patternMetrics.length > 0) {
      const slowestPattern = patternMetrics.reduce((a, b) => 
        (a[1].totalDuration / a[1].executions) > (b[1].totalDuration / b[1].executions) ? a : b
      );
      recommendations.push(`Optimize ${slowestPattern[0]} pattern - currently the slowest with ${(slowestPattern[1].totalDuration / slowestPattern[1].executions).toFixed(0)}ms average duration`);
    }
    
    // Agent utilization recommendations
    const utilization = this.calculateAgentUtilization();
    if (utilization.overall < 0.5) {
      recommendations.push('Agent pool is underutilized - consider reducing pool size or increasing workload');
    }
    if (utilization.overall > 0.8) {
      recommendations.push('Agent pool is highly utilized - consider adding more agents to prevent bottlenecks');
    }
    
    recommendations.push('Implement agent performance monitoring to track reliability trends');
    recommendations.push('Consider implementing predictive load balancing based on historical patterns');
    
    return recommendations;
  }
}

// CLI interface
async function main() {
  const patternArg = process.argv.find(arg => arg.startsWith('--pattern='));
  const pattern = patternArg ? patternArg.split('=')[1] : 'all';
  
  const demo = new OrchestrationDemo();

  try {
    await demo.initialize();
    await demo.runOrchestrationDemo(pattern);
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default OrchestrationDemo;