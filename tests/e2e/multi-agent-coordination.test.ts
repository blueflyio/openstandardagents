/**
 * End-to-End Tests for OSSA Multi-Agent Coordination
 * 
 * Tests the complete multi-agent coordination system including:
 * - Agent discovery and capability matching
 * - Handoff negotiation and consensus mechanisms
 * - Multi-agent judgment and decision making
 * - Load balancing and resource allocation
 * - Conflict resolution and deadlock prevention
 * - Performance optimization and SLA compliance
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { 
  AgentCoordinator, 
  ConsensusAlgorithm, 
  AgentState, 
  TaskPriority,
  Agent,
  TaskRequest,
  HandoffNegotiation,
  ConsensusResult,
  JudgmentRequest
} from '../../src/coordination/agent-coordinator.js';
import { LifecycleManager, LifecycleState } from '../../src/lifecycle/lifecycle-manager.js';
import { OSSAValidator } from '../../src/services/monitoring/src/ossa-validator.js';
import { createTestAgent, createTestTask, createLifecycleConfig, waitForState } from '../fixtures/agent-fixtures.js';

interface CoordinationTestContext {
  coordinator: AgentCoordinator;
  lifecycleManager: LifecycleManager;
  validator: OSSAValidator;
  testAgents: Map<string, Agent>;
  activeNegotiations: Map<string, HandoffNegotiation>;
  coordinationMetrics: {
    successful_handoffs: number;
    consensus_failures: number;
    average_negotiation_time: number;
    resource_conflicts: number;
  };
}

describe('OSSA Multi-Agent Coordination E2E Tests', () => {
  let context: CoordinationTestContext;
  
  beforeAll(async () => {
    context = await setupCoordinationTestEnvironment();
  });
  
  afterAll(async () => {
    await teardownCoordinationTestEnvironment(context);
  });
  
  beforeEach(() => {
    // Reset metrics for each test
    context.coordinationMetrics = {
      successful_handoffs: 0,
      consensus_failures: 0,
      average_negotiation_time: 0,
      resource_conflicts: 0
    };
    context.activeNegotiations.clear();
  });
  
  describe('Agent Discovery and Capability Matching', () => {
    it('should discover and match agents based on capabilities', async () => {
      // Create agents with different capabilities
      const agents = await createDiverseAgentPool(context);
      
      const taskRequest = createTestTask({
        id: 'capability-match-task',
        requiredCapabilities: [
          { capabilityId: 'nlp-analysis', version: '1.0.0', parameters: {}, alternatives: [], weight: 0.8 },
          { capabilityId: 'sentiment-detection', version: '1.0.0', parameters: {}, alternatives: [], weight: 0.6 }
        ],
        priority: TaskPriority.HIGH
      });
      
      const negotiation = await context.coordinator.initiateHandoff(taskRequest);
      
      expect(negotiation.status).toBe('completed');
      expect(negotiation.candidateAgents.length).toBeGreaterThan(0);
      expect(negotiation.selectedAgent).toBeDefined();
      expect(negotiation.proposals.length).toBeGreaterThan(0);
      
      // Verify selected agent has required capabilities
      const selectedAgent = negotiation.candidateAgents.find(a => a.id === negotiation.selectedAgent);
      expect(selectedAgent).toBeDefined();
      expect(selectedAgent!.capabilities.some(cap => cap.id === 'nlp-analysis')).toBe(true);
      
      context.activeNegotiations.set(negotiation.id, negotiation);
      context.coordinationMetrics.successful_handoffs++;
    });
    
    it('should handle capability version compatibility and alternatives', async () => {
      const legacyAgent = createTestAgent({
        id: 'legacy-nlp-agent',
        type: 'nlp',
        capabilities: [{
          id: 'nlp-analysis',
          name: 'NLP Analysis',
          version: '0.9.0', // Older version
          parameters: [],
          constraints: [],
          cost: { baseUnits: 15, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
          sla: { responseTimeMs: 2000, availabilityPercent: 99.0, throughputPerSecond: 5, errorRatePercent: 1.0, recoveryTimeMs: 10000 }
        }],
        state: AgentState.AVAILABLE
      });
      
      const modernAgent = createTestAgent({
        id: 'modern-nlp-agent',
        type: 'nlp',
        capabilities: [{
          id: 'nlp-analysis',
          name: 'NLP Analysis',
          version: '2.0.0', // Newer version
          parameters: [],
          constraints: [],
          cost: { baseUnits: 10, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
          sla: { responseTimeMs: 1000, availabilityPercent: 99.9, throughputPerSecond: 10, errorRatePercent: 0.5, recoveryTimeMs: 5000 }
        }],
        state: AgentState.AVAILABLE
      });
      
      await context.coordinator.registerAgent(legacyAgent);
      await context.coordinator.registerAgent(modernAgent);
      
      const taskRequest = createTestTask({
        id: 'version-compatibility-task',
        requiredCapabilities: [
          { 
            capabilityId: 'nlp-analysis', 
            version: '1.0.0', 
            parameters: {}, 
            alternatives: ['text-processing', 'language-analysis'], 
            weight: 1.0 
          }
        ],
        priority: TaskPriority.MEDIUM
      });
      
      const negotiation = await context.coordinator.initiateHandoff(taskRequest);
      
      expect(negotiation.status).toBe('completed');
      expect(negotiation.candidateAgents.length).toBeGreaterThanOrEqual(1);
      
      // Verify modern agent is preferred due to better SLA and lower cost
      expect(negotiation.selectedAgent).toBe(modernAgent.id);
      
      context.testAgents.set(legacyAgent.id, legacyAgent);
      context.testAgents.set(modernAgent.id, modernAgent);
    });
    
    it('should handle no suitable agents scenario gracefully', async () => {
      const taskRequest = createTestTask({
        id: 'no-match-task',
        requiredCapabilities: [
          { capabilityId: 'quantum-computing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 },
          { capabilityId: 'time-travel', version: '1.0.0', parameters: {}, alternatives: [], weight: 0.8 }
        ],
        priority: TaskPriority.CRITICAL
      });
      
      await expect(context.coordinator.initiateHandoff(taskRequest))
        .rejects.toThrow('No agents found matching requirements');
    });
  });
  
  describe('Handoff Negotiation and Consensus Mechanisms', () => {
    it('should conduct successful handoff negotiation with multiple proposals', async () => {
      // Create competitive agent pool
      const competitiveAgents = [];
      for (let i = 0; i < 5; i++) {
        const agent = createTestAgent({
          id: `competitive-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: 'data-processing',
            name: 'Data Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { 
              baseUnits: 10 + (Math.random() * 10), // Varying costs
              scalingFactor: 1.0 + (Math.random() * 0.5), 
              currency: 'tokens', 
              budgetRequired: false 
            },
            sla: { 
              responseTimeMs: 1000 + (Math.random() * 2000),
              availabilityPercent: 95 + (Math.random() * 4.9),
              throughputPerSecond: 5 + (Math.random() * 10),
              errorRatePercent: Math.random() * 2,
              recoveryTimeMs: 5000 + (Math.random() * 10000)
            }
          }],
          state: AgentState.AVAILABLE,
          trustScore: 0.7 + (Math.random() * 0.29) // Varying trust scores
        });
        competitiveAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      const taskRequest = createTestTask({
        id: 'competitive-bidding-task',
        requiredCapabilities: [
          { capabilityId: 'data-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
        ],
        priority: TaskPriority.HIGH,
        budget: {
          maxTokens: 1000,
          maxCost: 50,
          currency: 'tokens',
          allocation: { planning: 0.1, execution: 0.7, review: 0.1, integration: 0.05, contingency: 0.05 },
          tracking: { spent: 0, allocated: 50, remaining: 50, projectedOverrun: 0, alerts: [] }
        }
      });
      
      const startTime = Date.now();
      const negotiation = await context.coordinator.initiateHandoff(taskRequest);
      const negotiationTime = Date.now() - startTime;
      
      expect(negotiation.status).toBe('completed');
      expect(negotiation.proposals.length).toBe(competitiveAgents.length);
      expect(negotiation.selectedAgent).toBeDefined();
      expect(negotiationTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify proposals are ranked appropriately
      const selectedProposal = negotiation.proposals.find(p => p.agentId === negotiation.selectedAgent);
      expect(selectedProposal).toBeDefined();
      expect(selectedProposal!.estimatedCost).toBeLessThanOrEqual(taskRequest.budget.maxCost);
      
      context.coordinationMetrics.average_negotiation_time = negotiationTime;
      context.coordinationMetrics.successful_handoffs++;
    });
    
    it('should use different consensus algorithms for different scenarios', async () => {
      const agents = await createDiverseAgentPool(context);
      
      const consensusScenarios = [
        {
          name: 'RAFT for leader election',
          algorithm: ConsensusAlgorithm.RAFT,
          scenario: 'high-trust-environment'
        },
        {
          name: 'PBFT for Byzantine fault tolerance',
          algorithm: ConsensusAlgorithm.PBFT,
          scenario: 'untrusted-environment'
        },
        {
          name: 'Simple Majority for quick decisions',
          algorithm: ConsensusAlgorithm.SIMPLE_MAJORITY,
          scenario: 'time-critical'
        }
      ];
      
      for (const scenario of consensusScenarios) {
        const taskRequest = createTestTask({
          id: `consensus-${scenario.algorithm}-task`,
          requiredCapabilities: [
            { capabilityId: 'generic-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: scenario.scenario === 'time-critical' ? TaskPriority.CRITICAL : TaskPriority.MEDIUM,
          metadata: {
            createdBy: 'test-system',
            createdAt: new Date(),
            estimatedDuration: 5000,
            complexity: 'moderate',
            category: scenario.scenario
          }
        });
        
        // Mock algorithm selection in coordinator
        const originalCoordinator = context.coordinator;
        context.coordinator['getConsensusAlgorithmForTask'] = () => scenario.algorithm;
        
        const negotiation = await context.coordinator.initiateHandoff(taskRequest);
        
        expect(negotiation.status).toBe('completed');
        expect(negotiation.metadata.algorithm).toBe(scenario.algorithm);
        expect(negotiation.metadata.consensusReached).toBe(true);
        
        context.activeNegotiations.set(negotiation.id, negotiation);
      }
    });
    
    it('should handle negotiation timeout and fallback mechanisms', async () => {
      // Create slow-responding agents
      const slowAgent = createTestAgent({
        id: 'slow-response-agent',
        type: 'worker',
        capabilities: [{
          id: 'slow-processing',
          name: 'Slow Processing',
          version: '1.0.0',
          parameters: [],
          constraints: [],
          cost: { baseUnits: 20, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
          sla: { responseTimeMs: 30000, availabilityPercent: 90, throughputPerSecond: 1, errorRatePercent: 5, recoveryTimeMs: 60000 }
        }],
        state: AgentState.AVAILABLE
      });
      
      await context.coordinator.registerAgent(slowAgent);
      
      // Mock slow proposal response
      context.coordinator['requestProposalFromAgent'] = async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
        throw new Error('Proposal timeout');
      };
      
      const taskRequest = createTestTask({
        id: 'timeout-handling-task',
        requiredCapabilities: [
          { capabilityId: 'slow-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
        ],
        priority: TaskPriority.HIGH,
        deadline: new Date(Date.now() + 5000) // 5 second deadline
      });
      
      const startTime = Date.now();
      
      // Should handle timeout gracefully
      await expect(context.coordinator.initiateHandoff(taskRequest))
        .rejects.toThrow(); // May throw due to no valid proposals
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(15000); // Should not wait indefinitely
      
      context.testAgents.set(slowAgent.id, slowAgent);
    });
  });
  
  describe('Multi-Agent Judgment and Decision Making', () => {
    it('should conduct multi-agent judgment with evidence aggregation', async () => {
      // Create judge agents with different specializations
      const judges = [];
      const specializations = ['quality', 'security', 'performance', 'compliance'];
      
      for (let i = 0; i < specializations.length; i++) {
        const judge = createTestAgent({
          id: `judge-${specializations[i]}`,
          type: 'judge',
          capabilities: [{
            id: `${specializations[i]}-assessment`,
            name: `${specializations[i]} Assessment`,
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { baseUnits: 5, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 2000, availabilityPercent: 99.5, throughputPerSecond: 3, errorRatePercent: 0.5, recoveryTimeMs: 3000 }
          }],
          state: AgentState.AVAILABLE,
          trustScore: 0.9 + (Math.random() * 0.09) // High trust for judges
        });
        judges.push(judge);
        await context.coordinator.registerAgent(judge);
        context.testAgents.set(judge.id, judge);
      }
      
      const judgmentRequest: JudgmentRequest = {
        id: 'multi-criteria-judgment',
        alternatives: [
          { option: 'A', score: 0.85, risk: 'low' },
          { option: 'B', score: 0.78, risk: 'medium' },
          { option: 'C', score: 0.92, risk: 'high' }
        ],
        criteria: [
          { name: 'quality', weight: 0.4, type: 'numeric', description: 'Overall quality score' },
          { name: 'risk', weight: 0.3, type: 'categorical', description: 'Risk assessment' },
          { name: 'cost', weight: 0.2, type: 'numeric', description: 'Cost efficiency' },
          { name: 'timeline', weight: 0.1, type: 'numeric', description: 'Time to completion' }
        ],
        evidence: [
          { id: 'quality-metrics', type: 'metric', source: 'quality-system', value: { A: 0.85, B: 0.78, C: 0.92 }, reliability: 0.95, relevance: 1.0, timestamp: new Date() },
          { id: 'security-scan', type: 'test', source: 'security-scanner', value: { A: 'pass', B: 'warning', C: 'fail' }, reliability: 0.9, relevance: 0.8, timestamp: new Date() },
          { id: 'performance-benchmark', type: 'benchmark', source: 'perf-suite', value: { A: 1200, B: 1000, C: 1500 }, reliability: 0.85, relevance: 0.9, timestamp: new Date() }
        ],
        metadata: { source: 'test-system', priority: 'high' }
      };
      
      const consensusResult = await context.coordinator.makeMultiAgentJudgment(
        judgmentRequest,
        judges,
        ConsensusAlgorithm.PBFT
      );
      
      expect(consensusResult.confidence).toBeGreaterThan(0.7);
      expect(consensusResult.participantVotes).toHaveLength(judges.length);
      expect(consensusResult.algorithm).toBe(ConsensusAlgorithm.PBFT);
      expect(consensusResult.decision).toBeDefined();
      
      // Verify evidence was considered
      expect(consensusResult.evidence).toHaveLength(judgmentRequest.evidence.length);
      
      // Verify judgment quality metrics
      const qualityMetrics = consensusResult.metadata.qualityMetrics;
      expect(Array.isArray(qualityMetrics)).toBe(true);
      
      context.coordinationMetrics.successful_handoffs++;
    });
    
    it('should handle disagreement and reach consensus through multiple rounds', async () => {
      const judges = [];
      const opinions = ['conservative', 'moderate', 'aggressive'];
      
      for (let i = 0; i < 6; i++) {
        const judge = createTestAgent({
          id: `disagreement-judge-${i}`,
          type: 'judge',
          capabilities: [{
            id: 'judgment-capability',
            name: 'Judgment Capability',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { baseUnits: 5, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 1500, availabilityPercent: 99.0, throughputPerSecond: 2, errorRatePercent: 1.0, recoveryTimeMs: 5000 }
          }],
          state: AgentState.AVAILABLE,
          trustScore: 0.8 + (Math.random() * 0.19),
          metadata: {
            ...createTestAgent({ id: `temp-${i}` }).metadata,
            tags: [opinions[i % opinions.length]] // Bias towards different opinions
          }
        });
        judges.push(judge);
        await context.coordinator.registerAgent(judge);
        context.testAgents.set(judge.id, judge);
      }
      
      const controversialJudgment: JudgmentRequest = {
        id: 'controversial-decision',
        alternatives: [
          { approach: 'safe', innovation: 0.3, risk: 0.1 },
          { approach: 'balanced', innovation: 0.6, risk: 0.4 },
          { approach: 'innovative', innovation: 0.9, risk: 0.8 }
        ],
        criteria: [
          { name: 'innovation', weight: 0.6, type: 'numeric', description: 'Innovation potential' },
          { name: 'risk', weight: 0.4, type: 'numeric', description: 'Risk level' }
        ],
        evidence: [
          { id: 'market-analysis', type: 'expert', source: 'market-researcher', value: 'high_innovation_needed', reliability: 0.8, relevance: 0.9, timestamp: new Date() },
          { id: 'risk-assessment', type: 'metric', source: 'risk-system', value: { safe: 0.1, balanced: 0.4, innovative: 0.8 }, reliability: 0.9, relevance: 0.8, timestamp: new Date() }
        ],
        metadata: { source: 'strategic-planning', priority: 'critical' }
      };
      
      // Mock biased voting based on agent tags
      const originalCollectVote = context.coordinator['collectJudgmentVote'];
      context.coordinator['collectJudgmentVote'] = async (judge: Agent, judgment: JudgmentRequest) => {
        const bias = judge.metadata.tags[0];
        let choice;
        switch (bias) {
          case 'conservative':
            choice = judgment.alternatives[0];
            break;
          case 'moderate':
            choice = judgment.alternatives[1];
            break;
          case 'aggressive':
            choice = judgment.alternatives[2];
            break;
          default:
            choice = judgment.alternatives[1];
        }
        
        return {
          agentId: judge.id,
          choice,
          weight: judge.trustScore,
          confidence: 0.7 + (Math.random() * 0.25),
          reasoning: `${bias} approach preferred`,
          evidence: judgment.evidence,
          timestamp: new Date()
        };
      };
      
      const consensusResult = await context.coordinator.makeMultiAgentJudgment(
        controversialJudgment,
        judges,
        ConsensusAlgorithm.PBFT
      );
      
      expect(consensusResult.confidence).toBeGreaterThan(0.6); // May be lower due to disagreement
      expect(consensusResult.participantVotes).toHaveLength(judges.length);
      
      // Verify consensus metadata reflects the challenging nature
      expect(consensusResult.metadata.dissensus).toBeGreaterThan(0);
      expect(consensusResult.metadata.rounds).toBeGreaterThanOrEqual(1);
      
      // Restore original method
      context.coordinator['collectJudgmentVote'] = originalCollectVote;
    });
    
    it('should fail gracefully when consensus cannot be reached', async () => {
      const judges = [];
      for (let i = 0; i < 4; i++) {
        const judge = createTestAgent({
          id: `stubborn-judge-${i}`,
          type: 'judge',
          capabilities: [{ 
            id: 'stubborn-judgment', 
            name: 'Stubborn Judgment', 
            version: '1.0.0', 
            parameters: [], 
            constraints: [], 
            cost: { baseUnits: 5, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 1000, availabilityPercent: 99.0, throughputPerSecond: 1, errorRatePercent: 2, recoveryTimeMs: 5000 }
          }],
          state: AgentState.AVAILABLE,
          trustScore: 0.75
        });
        judges.push(judge);
        await context.coordinator.registerAgent(judge);
        context.testAgents.set(judge.id, judge);
      }
      
      // Mock completely different votes from each judge
      context.coordinator['collectJudgmentVote'] = async (judge: Agent, judgment: JudgmentRequest) => {
        const judgeIndex = parseInt(judge.id.split('-').pop() || '0');
        return {
          agentId: judge.id,
          choice: `unique_choice_${judgeIndex}`,
          weight: judge.trustScore,
          confidence: 0.9,
          reasoning: `Judge ${judgeIndex} unique perspective`,
          evidence: [],
          timestamp: new Date()
        };
      };
      
      const impossibleJudgment: JudgmentRequest = {
        id: 'impossible-consensus',
        alternatives: ['option1', 'option2', 'option3', 'option4'],
        criteria: [{ name: 'preference', weight: 1.0, type: 'categorical', description: 'Personal preference' }],
        evidence: [],
        metadata: { source: 'consensus-failure-test' }
      };
      
      await expect(context.coordinator.makeMultiAgentJudgment(
        impossibleJudgment,
        judges,
        ConsensusAlgorithm.PBFT
      )).rejects.toThrow('PBFT consensus failed');
      
      context.coordinationMetrics.consensus_failures++;
    });
  });
  
  describe('Load Balancing and Resource Management', () => {
    it('should distribute load evenly across available agents', async () => {
      // Create uniform agent pool
      const agentPool = [];
      for (let i = 0; i < 8; i++) {
        const agent = createTestAgent({
          id: `load-balanced-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: 'uniform-processing',
            name: 'Uniform Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { baseUnits: 10, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 1000, availabilityPercent: 99.0, throughputPerSecond: 10, errorRatePercent: 1, recoveryTimeMs: 5000 }
          }],
          state: AgentState.AVAILABLE,
          currentLoad: 0,
          maxLoad: 10,
          trustScore: 0.85
        });
        agentPool.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Generate multiple tasks to distribute
      const tasks = [];
      for (let i = 0; i < 32; i++) {
        tasks.push(createTestTask({
          id: `load-test-task-${i}`,
          requiredCapabilities: [
            { capabilityId: 'uniform-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.MEDIUM,
          metadata: {
            createdBy: 'load-test',
            createdAt: new Date(),
            estimatedDuration: 1000,
            complexity: 'simple',
            category: 'load-balancing'
          }
        }));
      }
      
      // Track agent assignments
      const assignments: Record<string, number> = {};
      agentPool.forEach(agent => {
        assignments[agent.id] = 0;
      });
      
      // Process tasks and track assignments
      for (const task of tasks) {
        const negotiation = await context.coordinator.initiateHandoff(task);
        if (negotiation.selectedAgent) {
          assignments[negotiation.selectedAgent]++;
          
          // Update agent load to simulate realistic load balancing
          const agent = agentPool.find(a => a.id === negotiation.selectedAgent);
          if (agent) {
            agent.currentLoad++;
          }
        }
      }
      
      // Verify load distribution is reasonably balanced
      const assignmentCounts = Object.values(assignments);
      const avgAssignments = assignmentCounts.reduce((sum, count) => sum + count, 0) / assignmentCounts.length;
      const maxDeviation = Math.max(...assignmentCounts.map(count => Math.abs(count - avgAssignments)));
      
      // Allow for some variance but ensure reasonable distribution
      expect(maxDeviation).toBeLessThan(avgAssignments * 0.5); // Within 50% of average
      expect(Math.min(...assignmentCounts)).toBeGreaterThan(0); // All agents got some work
      
      context.coordinationMetrics.successful_handoffs += tasks.length;
    });
    
    it('should handle resource constraints and prevent overallocation', async () => {
      // Create agents with limited resources
      const resourceConstrainedAgents = [];
      for (let i = 0; i < 4; i++) {
        const agent = createTestAgent({
          id: `resource-constrained-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: 'resource-intensive-processing',
            name: 'Resource Intensive Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [
              { type: 'resource', condition: 'memory < 8GB', value: 8, priority: TaskPriority.HIGH },
              { type: 'resource', condition: 'cpu < 80%', value: 80, priority: TaskPriority.MEDIUM }
            ],
            cost: { baseUnits: 20, scalingFactor: 1.2, currency: 'compute', budgetRequired: true },
            sla: { responseTimeMs: 5000, availabilityPercent: 95.0, throughputPerSecond: 2, errorRatePercent: 2, recoveryTimeMs: 10000 }
          }],
          state: AgentState.AVAILABLE,
          currentLoad: 0,
          maxLoad: 3, // Low capacity
          trustScore: 0.8
        });
        resourceConstrainedAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Create high-resource tasks
      const resourceIntensiveTasks = [];
      for (let i = 0; i < 15; i++) {
        resourceIntensiveTasks.push(createTestTask({
          id: `resource-intensive-task-${i}`,
          requiredCapabilities: [
            { capabilityId: 'resource-intensive-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.HIGH,
          budget: {
            maxTokens: 2000,
            maxCost: 100,
            currency: 'compute',
            allocation: { planning: 0.1, execution: 0.8, review: 0.05, integration: 0.03, contingency: 0.02 },
            tracking: { spent: 0, allocated: 100, remaining: 100, projectedOverrun: 0, alerts: [] }
          }
        }));
      }
      
      // Process tasks and track rejections due to resource constraints
      let successfulAssignments = 0;
      let resourceRejections = 0;
      
      for (const task of resourceIntensiveTasks) {
        try {
          const negotiation = await context.coordinator.initiateHandoff(task);
          if (negotiation.selectedAgent) {
            successfulAssignments++;
            
            // Update agent load
            const agent = resourceConstrainedAgents.find(a => a.id === negotiation.selectedAgent);
            if (agent) {
              agent.currentLoad++;
            }
          }
        } catch (error) {
          if (error.message.includes('No agents found matching requirements')) {
            resourceRejections++;
          }
        }
      }
      
      // Verify resource constraints were respected
      expect(successfulAssignments).toBeGreaterThan(0);
      expect(resourceRejections).toBeGreaterThan(0);
      expect(successfulAssignments + resourceRejections).toBe(resourceIntensiveTasks.length);
      
      // Verify no agent exceeded capacity
      resourceConstrainedAgents.forEach(agent => {
        expect(agent.currentLoad).toBeLessThanOrEqual(agent.maxLoad);
      });
      
      context.coordinationMetrics.resource_conflicts = resourceRejections;
    });
    
    it('should prioritize critical tasks over lower priority ones', async () => {
      const mixedCapacityAgents = [];
      for (let i = 0; i < 3; i++) {
        const agent = createTestAgent({
          id: `priority-test-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: 'priority-processing',
            name: 'Priority Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { baseUnits: 15, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 2000, availabilityPercent: 98.0, throughputPerSecond: 5, errorRatePercent: 1.5, recoveryTimeMs: 7000 }
          }],
          state: AgentState.AVAILABLE,
          currentLoad: 0,
          maxLoad: 2, // Very limited capacity
          trustScore: 0.9
        });
        mixedCapacityAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Create mixed priority tasks
      const mixedTasks = [
        // Critical tasks (should be processed first)
        ...Array.from({ length: 3 }, (_, i) => createTestTask({
          id: `critical-task-${i}`,
          requiredCapabilities: [
            { capabilityId: 'priority-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.CRITICAL,
          deadline: new Date(Date.now() + 10000) // 10 seconds
        })),
        // Low priority tasks (should be processed later)
        ...Array.from({ length: 5 }, (_, i) => createTestTask({
          id: `low-priority-task-${i}`,
          requiredCapabilities: [
            { capabilityId: 'priority-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.LOW,
          deadline: new Date(Date.now() + 60000) // 1 minute
        }))
      ];
      
      // Shuffle tasks to test priority handling
      const shuffledTasks = [...mixedTasks].sort(() => Math.random() - 0.5);
      
      const processedTasks: { taskId: string, priority: TaskPriority, processedAt: Date }[] = [];
      
      for (const task of shuffledTasks) {
        try {
          const negotiation = await context.coordinator.initiateHandoff(task);
          if (negotiation.selectedAgent) {
            processedTasks.push({
              taskId: task.id,
              priority: task.priority,
              processedAt: new Date()
            });
            
            // Update agent load
            const agent = mixedCapacityAgents.find(a => a.id === negotiation.selectedAgent);
            if (agent) {
              agent.currentLoad++;
            }
          }
        } catch (error) {
          // Task rejected due to capacity constraints
        }
      }
      
      // Verify critical tasks were processed before low priority ones
      const criticalTasks = processedTasks.filter(t => t.priority === TaskPriority.CRITICAL);
      const lowPriorityTasks = processedTasks.filter(t => t.priority === TaskPriority.LOW);
      
      expect(criticalTasks.length).toBeGreaterThan(0);
      
      if (lowPriorityTasks.length > 0 && criticalTasks.length > 0) {
        const latestCritical = Math.max(...criticalTasks.map(t => t.processedAt.getTime()));
        const earliestLowPriority = Math.min(...lowPriorityTasks.map(t => t.processedAt.getTime()));
        
        // Some leeway for concurrent processing
        expect(latestCritical).toBeLessThanOrEqual(earliestLowPriority + 1000);
      }
    });
  });
  
  describe('Conflict Resolution and System Resilience', () => {
    it('should resolve conflicts between competing agents', async () => {
      // Create agents with overlapping capabilities but different specializations
      const conflictingAgents = [];
      const specializations = ['speed', 'quality', 'cost'];
      
      for (let i = 0; i < specializations.length; i++) {
        const agent = createTestAgent({
          id: `${specializations[i]}-specialist-agent`,
          type: 'worker',
          capabilities: [{
            id: 'conflicted-processing',
            name: 'Conflicted Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: {
              baseUnits: specializations[i] === 'cost' ? 5 : (specializations[i] === 'quality' ? 25 : 15),
              scalingFactor: 1.0,
              currency: 'tokens',
              budgetRequired: false
            },
            sla: {
              responseTimeMs: specializations[i] === 'speed' ? 500 : (specializations[i] === 'quality' ? 3000 : 1500),
              availabilityPercent: specializations[i] === 'quality' ? 99.9 : 98.0,
              throughputPerSecond: specializations[i] === 'speed' ? 20 : 5,
              errorRatePercent: specializations[i] === 'quality' ? 0.1 : 2.0,
              recoveryTimeMs: 5000
            }
          }],
          state: AgentState.AVAILABLE,
          trustScore: specializations[i] === 'quality' ? 0.95 : 0.8,
          metadata: {
            ...createTestAgent({ id: 'temp' }).metadata,
            tags: [specializations[i]]
          }
        });
        conflictingAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Create conflicting task requests
      const conflictingTasks = [
        createTestTask({
          id: 'urgent-speed-task',
          requiredCapabilities: [
            { capabilityId: 'conflicted-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.CRITICAL,
          deadline: new Date(Date.now() + 2000), // 2 seconds
          slaRequirements: {
            responseTimeMs: 800,
            availabilityPercent: 95.0,
            throughputPerSecond: 15,
            errorRatePercent: 5.0,
            recoveryTimeMs: 3000
          }
        }),
        createTestTask({
          id: 'quality-critical-task',
          requiredCapabilities: [
            { capabilityId: 'conflicted-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.HIGH,
          deadline: new Date(Date.now() + 10000), // 10 seconds
          slaRequirements: {
            responseTimeMs: 2000,
            availabilityPercent: 99.5,
            throughputPerSecond: 3,
            errorRatePercent: 0.5,
            recoveryTimeMs: 2000
          }
        }),
        createTestTask({
          id: 'budget-constrained-task',
          requiredCapabilities: [
            { capabilityId: 'conflicted-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
          ],
          priority: TaskPriority.MEDIUM,
          budget: {
            maxTokens: 100,
            maxCost: 10,
            currency: 'tokens',
            allocation: { planning: 0.1, execution: 0.8, review: 0.05, integration: 0.03, contingency: 0.02 },
            tracking: { spent: 0, allocated: 10, remaining: 10, projectedOverrun: 0, alerts: [] }
          }
        })
      ];
      
      // Process conflicting tasks and verify appropriate agent selection
      const resolutions = [];
      
      for (const task of conflictingTasks) {
        const negotiation = await context.coordinator.initiateHandoff(task);
        expect(negotiation.status).toBe('completed');
        
        const selectedAgent = conflictingAgents.find(a => a.id === negotiation.selectedAgent);
        expect(selectedAgent).toBeDefined();
        
        resolutions.push({
          taskId: task.id,
          selectedAgent: selectedAgent!.id,
          specialization: selectedAgent!.metadata.tags[0],
          rationale: determineSelectionRationale(task, selectedAgent!)
        });
      }
      
      // Verify appropriate agent selection based on task requirements
      const speedTaskResolution = resolutions.find(r => r.taskId === 'urgent-speed-task');
      const qualityTaskResolution = resolutions.find(r => r.taskId === 'quality-critical-task');
      const budgetTaskResolution = resolutions.find(r => r.taskId === 'budget-constrained-task');
      
      expect(speedTaskResolution?.specialization).toBe('speed');
      expect(qualityTaskResolution?.specialization).toBe('quality');
      expect(budgetTaskResolution?.specialization).toBe('cost');
    });
    
    it('should handle deadlock scenarios and prevent system freeze', async () => {
      // Create circular dependency scenario
      const deadlockAgents = [];
      for (let i = 0; i < 3; i++) {
        const agent = createTestAgent({
          id: `deadlock-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: `capability-${i}`,
            name: `Capability ${i}`,
            version: '1.0.0',
            parameters: [],
            constraints: [
              { type: 'dependency', condition: `requires-capability-${(i + 1) % 3}`, value: true, priority: TaskPriority.HIGH }
            ],
            cost: { baseUnits: 10, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 1000, availabilityPercent: 99.0, throughputPerSecond: 5, errorRatePercent: 1, recoveryTimeMs: 5000 }
          }],
          state: AgentState.AVAILABLE,
          currentLoad: 0,
          maxLoad: 1, // Single capacity to force conflicts
          trustScore: 0.8
        });
        deadlockAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Create tasks that could create deadlock
      const deadlockTasks = deadlockAgents.map((_, i) => createTestTask({
        id: `deadlock-task-${i}`,
        requiredCapabilities: [
          { capabilityId: `capability-${i}`, version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 },
          { capabilityId: `capability-${(i + 1) % 3}`, version: '1.0.0', parameters: {}, alternatives: [], weight: 0.8 }
        ],
        priority: TaskPriority.HIGH,
        deadline: new Date(Date.now() + 5000),
        dependencies: [`deadlock-task-${(i + 2) % 3}`] // Circular dependency
      }));
      
      // Attempt to process tasks simultaneously
      const startTime = Date.now();
      const taskPromises = deadlockTasks.map(task => 
        context.coordinator.initiateHandoff(task).catch(error => ({ error: error.message }))
      );
      
      const results = await Promise.all(taskPromises);
      const processingTime = Date.now() - startTime;
      
      // Verify system doesn't freeze (completes within reasonable time)
      expect(processingTime).toBeLessThan(10000); // 10 seconds max
      
      // Verify deadlock detection/prevention
      const errorResults = results.filter((r: any) => r.error);
      expect(errorResults.length).toBeGreaterThan(0); // Some tasks should fail due to deadlock prevention
      
      // Verify system remains responsive
      const healthCheck = context.coordinator['healthCheck'] || (() => ({ status: 'healthy' }));
      expect(healthCheck().status).toBe('healthy');
    });
    
    it('should recover from agent failures during coordination', async () => {
      // Create redundant agent pool
      const redundantAgents = [];
      for (let i = 0; i < 6; i++) {
        const agent = createTestAgent({
          id: `redundant-agent-${i}`,
          type: 'worker',
          capabilities: [{
            id: 'redundant-processing',
            name: 'Redundant Processing',
            version: '1.0.0',
            parameters: [],
            constraints: [],
            cost: { baseUnits: 12, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
            sla: { responseTimeMs: 1500, availabilityPercent: 95.0 + Math.random() * 4, throughputPerSecond: 8, errorRatePercent: 1 + Math.random(), recoveryTimeMs: 6000 }
          }],
          state: AgentState.AVAILABLE,
          trustScore: 0.7 + Math.random() * 0.2
        });
        redundantAgents.push(agent);
        await context.coordinator.registerAgent(agent);
        context.testAgents.set(agent.id, agent);
      }
      
      // Start processing tasks
      const recoveryTask = createTestTask({
        id: 'recovery-test-task',
        requiredCapabilities: [
          { capabilityId: 'redundant-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
        ],
        priority: TaskPriority.HIGH
      });
      
      const negotiation = await context.coordinator.initiateHandoff(recoveryTask);
      expect(negotiation.status).toBe('completed');
      expect(negotiation.selectedAgent).toBeDefined();
      
      const selectedAgent = redundantAgents.find(a => a.id === negotiation.selectedAgent);
      expect(selectedAgent).toBeDefined();
      
      // Simulate agent failure
      selectedAgent!.state = AgentState.FAILED;
      
      // Attempt another task requiring same capability
      const recoveryTask2 = createTestTask({
        id: 'recovery-test-task-2',
        requiredCapabilities: [
          { capabilityId: 'redundant-processing', version: '1.0.0', parameters: {}, alternatives: [], weight: 1.0 }
        ],
        priority: TaskPriority.HIGH
      });
      
      const negotiation2 = await context.coordinator.initiateHandoff(recoveryTask2);
      expect(negotiation2.status).toBe('completed');
      expect(negotiation2.selectedAgent).toBeDefined();
      expect(negotiation2.selectedAgent).not.toBe(selectedAgent!.id); // Different agent selected
      
      // Verify system adapted to agent failure
      const alternativeAgent = redundantAgents.find(a => a.id === negotiation2.selectedAgent);
      expect(alternativeAgent).toBeDefined();
      expect(alternativeAgent!.state).toBe(AgentState.AVAILABLE);
    });
  });
});

// Helper functions
async function setupCoordinationTestEnvironment(): Promise<CoordinationTestContext> {
  const lifecycleConfig = createLifecycleConfig();
  const lifecycleManager = new LifecycleManager(lifecycleConfig);
  
  const coordinatorConfig = {
    loadBalancingStrategy: 'capability_weighted',
    consensusAlgorithms: [ConsensusAlgorithm.RAFT, ConsensusAlgorithm.PBFT, ConsensusAlgorithm.SIMPLE_MAJORITY],
    maxConcurrentNegotiations: 20
  };
  
  const coordinator = new AgentCoordinator(coordinatorConfig);
  
  const validator = new OSSAValidator({
    ossaVersion: '0.1.8',
    enableFeedbackLoop: true,
    enableVortexValidation: true,
    enableActaValidation: true,
    strict: false
  });
  
  return {
    coordinator,
    lifecycleManager,
    validator,
    testAgents: new Map(),
    activeNegotiations: new Map(),
    coordinationMetrics: {
      successful_handoffs: 0,
      consensus_failures: 0,
      average_negotiation_time: 0,
      resource_conflicts: 0
    }
  };
}

async function teardownCoordinationTestEnvironment(context: CoordinationTestContext): Promise<void> {
  try {
    await context.lifecycleManager.shutdown();
    // Additional cleanup for coordinator if needed
  } catch (error) {
    console.warn('Error during coordination test environment teardown:', error);
  }
}

async function createDiverseAgentPool(context: CoordinationTestContext): Promise<Agent[]> {
  const capabilities = [
    'nlp-analysis', 'sentiment-detection', 'text-generation', 'data-processing',
    'image-recognition', 'speech-synthesis', 'translation', 'summarization'
  ];
  
  const agents = [];
  
  for (let i = 0; i < capabilities.length; i++) {
    const capability = capabilities[i];
    const agent = createTestAgent({
      id: `diverse-agent-${capability}`,
      type: 'worker',
      capabilities: [{
        id: capability,
        name: capability.replace('-', ' '),
        version: '1.0.0',
        parameters: [],
        constraints: [],
        cost: { baseUnits: 10 + Math.random() * 10, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
        sla: {
          responseTimeMs: 1000 + Math.random() * 2000,
          availabilityPercent: 95 + Math.random() * 4.9,
          throughputPerSecond: 5 + Math.random() * 10,
          errorRatePercent: Math.random() * 2,
          recoveryTimeMs: 5000 + Math.random() * 10000
        }
      }, {
        id: 'generic-processing',
        name: 'Generic Processing',
        version: '1.0.0',
        parameters: [],
        constraints: [],
        cost: { baseUnits: 8, scalingFactor: 1.0, currency: 'tokens', budgetRequired: false },
        sla: {
          responseTimeMs: 1500,
          availabilityPercent: 98.0,
          throughputPerSecond: 8,
          errorRatePercent: 1.5,
          recoveryTimeMs: 7000
        }
      }],
      state: AgentState.AVAILABLE,
      trustScore: 0.7 + Math.random() * 0.29
    });
    
    agents.push(agent);
    await context.coordinator.registerAgent(agent);
    context.testAgents.set(agent.id, agent);
  }
  
  return agents;
}

function determineSelectionRationale(task: TaskRequest, agent: Agent): string {
  const specialization = agent.metadata.tags?.[0] || 'unknown';
  
  if (task.deadline && task.deadline.getTime() - Date.now() < 3000) {
    return `Selected for speed - ${specialization} optimization`;
  }
  
  if (task.slaRequirements?.errorRatePercent && task.slaRequirements.errorRatePercent < 1.0) {
    return `Selected for quality - ${specialization} optimization`;
  }
  
  if (task.budget?.maxCost && task.budget.maxCost < 15) {
    return `Selected for cost efficiency - ${specialization} optimization`;
  }
  
  return `Selected for general capability match - ${specialization}`;
}
