/**
 * 360° Feedback Loop Integration Tests - OSSA v0.1.8
 * 
 * Tests the complete feedback loop system including:
 * - Agent performance monitoring and feedback collection
 * - Multi-agent coordination with feedback integration
 * - Continuous improvement loops with learning adaptation
 * - Quality judge integration and decision feedback
 * - Performance critic feedback and optimization
 * - Cross-agent learning and knowledge sharing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setTimeout as delay } from 'timers/promises';
import axios from 'axios';

// Import OSSA components for feedback loop testing
import { BaseJudgeAgent } from '../../src/agents/judges/base-judge-agent';
import { ComplianceJudge } from '../../src/agents/judges/compliance-judge';
import { QualityJudge } from '../../src/agents/judges/quality-judge';
import { PerformanceCritic } from '../../src/agents/critics/performance-critic';
import { WorkflowCoordinator } from '../../src/agents/orchestrators/workflow-coordinator';
import { IntelligentRouter } from '../../src/agents/orchestrators/intelligent-router';
import { AgentCoordinator } from '../../src/coordination/agent-coordinator';
import { EvidenceTrailManager } from '../../src/agents/judges/evidence-trail';

// Test configuration
interface FeedbackLoopTestConfig {
  baseUrl: string;
  timeout: number;
  maxIterations: number;
  performanceThresholds: {
    responseTime: number;
    successRate: number;
    improvementRate: number;
    learningEfficiency: number;
  };
}

// Feedback loop metrics for validation
interface FeedbackMetrics {
  iterationCount: number;
  responseTimeMs: number;
  successRate: number;
  qualityScore: number;
  complianceScore: number;
  improvementDelta: number;
  learningVelocity: number;
  crossAgentKnowledge: number;
  feedbackLatency: number;
  adaptationAccuracy: number;
}

// Mock agent performance data
interface AgentPerformanceData {
  agentId: string;
  taskCompletionRate: number;
  averageResponseTime: number;
  errorRate: number;
  qualityMetrics: {
    accuracy: number;
    completeness: number;
    coherence: number;
    relevance: number;
  };
  learningMetrics: {
    adaptationSpeed: number;
    knowledgeRetention: number;
    transferLearning: number;
  };
}

describe('360° Feedback Loop Integration Tests', () => {
  let testConfig: FeedbackLoopTestConfig;
  let feedbackLoopId: string;
  let baselineMetrics: FeedbackMetrics;
  let serviceAvailable = false;

  beforeAll(async () => {
    testConfig = {
      baseUrl: 'http://localhost:4000',
      timeout: 30000,
      maxIterations: 10,
      performanceThresholds: {
        responseTime: 2000, // 2 seconds max
        successRate: 0.95,  // 95% success rate
        improvementRate: 0.15, // 15% improvement per cycle
        learningEfficiency: 0.8 // 80% learning efficiency
      }
    };

    // Check service availability
    try {
      const resp = await axios.get(`${testConfig.baseUrl}/health`, { 
        timeout: 5000 
      });
      serviceAvailable = resp.status === 200;
      console.log('✅ OSSA services available for feedback loop testing');
    } catch (error) {
      console.warn('⚠️  OSSA services not available, some tests will be skipped');
      serviceAvailable = false;
    }
  });

  afterAll(async () => {
    // Cleanup any active feedback loops
    if (feedbackLoopId && serviceAvailable) {
      try {
        await axios.delete(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}`);
      } catch (error) {
        console.warn('Failed to cleanup feedback loop:', error);
      }
    }
  });

  describe('Feedback Loop Initialization', () => {
    it('should initialize a complete 360° feedback loop system', async () => {
      if (!serviceAvailable) return;

      const startTime = Date.now();
      
      // Initialize feedback loop components
      const feedbackLoop = {
        id: `feedback-loop-${Date.now()}`,
        agents: [
          { type: 'judge', subtype: 'quality', weight: 0.3 },
          { type: 'judge', subtype: 'compliance', weight: 0.2 },
          { type: 'critic', subtype: 'performance', weight: 0.3 },
          { type: 'orchestrator', subtype: 'coordinator', weight: 0.2 }
        ],
        feedbackFrequency: 1000, // 1 second for testing
        adaptationThreshold: 0.1,
        learningRate: 0.05,
        crossAgentSharing: true,
        evidenceCollection: true
      };

      const response = await axios.post(
        `${testConfig.baseUrl}/feedback-loops`,
        feedbackLoop,
        { timeout: testConfig.timeout }
      );

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.status).toBe('active');
      
      feedbackLoopId = response.data.id;
      
      const initTime = Date.now() - startTime;
      expect(initTime).toBeLessThan(5000); // Should initialize within 5 seconds
      
      console.log(`✅ Feedback loop initialized in ${initTime}ms`);
    });

    it('should establish agent interconnections for 360° feedback', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Verify agent connections
      const connectionsResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/connections`
      );

      expect(connectionsResponse.status).toBe(200);
      const connections = connectionsResponse.data.connections;
      
      // Should have bidirectional connections between all agent types
      expect(connections).toHaveLength(12); // 4 agents * 3 connections each
      
      // Verify connection types
      const connectionTypes = connections.map((conn: any) => conn.type);
      expect(connectionTypes).toContain('judge-to-critic');
      expect(connectionTypes).toContain('critic-to-orchestrator');
      expect(connectionTypes).toContain('orchestrator-to-judge');
      expect(connectionTypes).toContain('peer-to-peer-learning');
    });

    it('should initialize evidence collection system', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Verify evidence trail setup
      const evidenceResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/evidence`
      );

      expect(evidenceResponse.status).toBe(200);
      expect(evidenceResponse.data.trailActive).toBe(true);
      expect(evidenceResponse.data.collectors).toHaveLength(4); // One per agent type
      expect(evidenceResponse.data.retentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('Feedback Collection and Processing', () => {
    beforeEach(async () => {
      // Capture baseline metrics before each test
      if (serviceAvailable && feedbackLoopId) {
        const metricsResponse = await axios.get(
          `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/metrics`
        );
        baselineMetrics = metricsResponse.data;
      }
    });

    it('should collect comprehensive performance feedback from all agent types', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Simulate agent tasks to generate feedback
      const testTasks = [
        { type: 'quality-assessment', complexity: 'high', expectedDuration: 2000 },
        { type: 'compliance-check', complexity: 'medium', expectedDuration: 1500 },
        { type: 'performance-analysis', complexity: 'low', expectedDuration: 1000 },
        { type: 'workflow-coordination', complexity: 'high', expectedDuration: 3000 }
      ];

      const taskPromises = testTasks.map(task =>
        axios.post(`${testConfig.baseUrl}/tasks`, {
          ...task,
          feedbackLoopId,
          collectFeedback: true
        })
      );

      const taskResults = await Promise.all(taskPromises);
      
      // All tasks should complete successfully
      taskResults.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.data.taskId).toBeDefined();
      });

      // Wait for feedback collection
      await delay(3000);

      // Verify feedback collection
      const feedbackResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/feedback/recent`
      );

      expect(feedbackResponse.status).toBe(200);
      const feedback = feedbackResponse.data.feedback;
      
      expect(feedback).toHaveLength(testTasks.length);
      
      // Verify feedback contains required fields
      feedback.forEach((fb: any) => {
        expect(fb.agentType).toBeDefined();
        expect(fb.performanceMetrics).toBeDefined();
        expect(fb.qualityScore).toBeGreaterThanOrEqual(0);
        expect(fb.qualityScore).toBeLessThanOrEqual(100);
        expect(fb.timestamp).toBeDefined();
        expect(fb.evidence).toBeDefined();
      });
    });

    it('should process cross-agent feedback and identify improvement opportunities', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Generate diverse feedback scenarios
      const feedbackScenarios = [
        {
          agentType: 'quality-judge',
          performance: { accuracy: 0.92, completeness: 0.88, responseTime: 1200 },
          issues: ['inconsistent-criteria-application', 'slow-evidence-processing']
        },
        {
          agentType: 'compliance-judge', 
          performance: { accuracy: 0.95, completeness: 0.90, responseTime: 1800 },
          issues: ['framework-update-lag', 'manual-control-verification']
        },
        {
          agentType: 'performance-critic',
          performance: { accuracy: 0.89, completeness: 0.94, responseTime: 900 },
          issues: ['limited-historical-context', 'narrow-optimization-scope']
        }
      ];

      // Submit feedback scenarios
      const feedbackPromises = feedbackScenarios.map(scenario =>
        axios.post(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/feedback`, {
          ...scenario,
          timestamp: new Date().toISOString(),
          source: 'integration-test'
        })
      );

      await Promise.all(feedbackPromises);

      // Process cross-agent analysis
      const analysisResponse = await axios.post(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/analyze`,
        { includeCorrelations: true, identifyPatterns: true }
      );

      expect(analysisResponse.status).toBe(200);
      const analysis = analysisResponse.data;

      // Verify comprehensive analysis
      expect(analysis.correlations).toBeDefined();
      expect(analysis.patterns).toBeDefined();
      expect(analysis.improvementOpportunities).toBeDefined();
      expect(analysis.recommendedActions).toHaveLength(3); // One per agent type
      
      // Verify improvement opportunity identification
      const opportunities = analysis.improvementOpportunities;
      expect(opportunities.some((op: any) => op.type === 'cross-agent-learning')).toBe(true);
      expect(opportunities.some((op: any) => op.type === 'performance-optimization')).toBe(true);
      expect(opportunities.some((op: any) => op.type === 'workflow-enhancement')).toBe(true);
    });

    it('should implement adaptive learning based on feedback patterns', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Create learning scenario with repeated pattern
      const learningPattern = {
        scenario: 'quality-assessment-optimization',
        iterations: 5,
        baselineAccuracy: 0.85,
        targetImprovement: 0.12,
        adaptationMethod: 'gradient-descent',
        feedbackWeight: 0.3
      };

      let currentAccuracy = learningPattern.baselineAccuracy;
      const learningResults: number[] = [];

      // Execute learning iterations
      for (let i = 0; i < learningPattern.iterations; i++) {
        const iterationResponse = await axios.post(
          `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/learn`,
          {
            currentPerformance: currentAccuracy,
            feedbackPattern: learningPattern,
            iteration: i + 1
          }
        );

        expect(iterationResponse.status).toBe(200);
        const iterationResult = iterationResponse.data;
        
        currentAccuracy = iterationResult.updatedPerformance;
        learningResults.push(currentAccuracy);
        
        // Wait for adaptation
        await delay(500);
      }

      // Verify learning progression
      const finalAccuracy = learningResults[learningResults.length - 1];
      const improvement = finalAccuracy - learningPattern.baselineAccuracy;
      
      expect(improvement).toBeGreaterThan(learningPattern.targetImprovement * 0.8); // At least 80% of target
      expect(learningResults.every((acc, idx) => idx === 0 || acc >= learningResults[idx - 1])).toBe(true);
      
      // Verify learning efficiency
      const learningVelocity = improvement / learningPattern.iterations;
      expect(learningVelocity).toBeGreaterThan(0.02); // Minimum learning rate
      
      console.log(`✅ Adaptive learning achieved ${(improvement * 100).toFixed(1)}% improvement`);
    });
  });

  describe('Performance Validation and Metrics', () => {
    it('should validate feedback loop performance meets claimed metrics', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      const performanceTest = {
        testDuration: 30000, // 30 seconds
        taskFrequency: 500,  // Every 500ms
        expectedMetrics: {
          responseTime: testConfig.performanceThresholds.responseTime,
          successRate: testConfig.performanceThresholds.successRate,
          improvementRate: testConfig.performanceThresholds.improvementRate,
          learningEfficiency: testConfig.performanceThresholds.learningEfficiency
        }
      };

      const startTime = Date.now();
      const taskResults: any[] = [];
      let completedTasks = 0;
      let failedTasks = 0;

      // Run continuous performance test
      const testInterval = setInterval(async () => {
        try {
          const taskStart = Date.now();
          const response = await axios.post(
            `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/task`,
            {
              type: 'performance-validation',
              complexity: 'medium',
              timestamp: new Date().toISOString()
            }
          );

          const taskTime = Date.now() - taskStart;
          taskResults.push({
            responseTime: taskTime,
            success: response.status === 200,
            qualityScore: response.data.qualityScore || 0
          });

          completedTasks++;
        } catch (error) {
          failedTasks++;
        }
      }, performanceTest.taskFrequency);

      // Wait for test duration
      await delay(performanceTest.testDuration);
      clearInterval(testInterval);

      const totalTasks = completedTasks + failedTasks;
      const successRate = completedTasks / totalTasks;
      const averageResponseTime = taskResults.reduce((sum, result) => sum + result.responseTime, 0) / taskResults.length;

      // Validate performance metrics
      expect(successRate).toBeGreaterThanOrEqual(performanceTest.expectedMetrics.successRate);
      expect(averageResponseTime).toBeLessThanOrEqual(performanceTest.expectedMetrics.responseTime);

      // Get final feedback loop metrics
      const finalMetricsResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/metrics/comprehensive`
      );

      const finalMetrics = finalMetricsResponse.data;
      
      // Validate improvement metrics
      if (baselineMetrics) {
        const qualityImprovement = (finalMetrics.qualityScore - baselineMetrics.qualityScore) / baselineMetrics.qualityScore;
        expect(qualityImprovement).toBeGreaterThanOrEqual(0); // Should not degrade
        
        const responseTimeImprovement = (baselineMetrics.responseTimeMs - finalMetrics.responseTimeMs) / baselineMetrics.responseTimeMs;
        expect(responseTimeImprovement).toBeGreaterThanOrEqual(-0.1); // Allow 10% degradation tolerance
      }

      console.log(`✅ Performance validation completed:`);
      console.log(`   Success rate: ${(successRate * 100).toFixed(1)}%`);
      console.log(`   Avg response time: ${averageResponseTime.toFixed(0)}ms`);
      console.log(`   Total tasks processed: ${totalTasks}`);
    });

    it('should demonstrate continuous improvement over multiple feedback cycles', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      const improvementTest = {
        cycles: 8,
        tasksPerCycle: 10,
        expectedImprovementRate: 0.05 // 5% per cycle minimum
      };

      const cycleResults: any[] = [];

      for (let cycle = 0; cycle < improvementTest.cycles; cycle++) {
        const cycleStart = Date.now();
        const cycleTasks: Promise<any>[] = [];

        // Execute tasks for this cycle
        for (let task = 0; task < improvementTest.tasksPerCycle; task++) {
          cycleTasks.push(
            axios.post(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/task`, {
              type: 'improvement-cycle',
              cycle: cycle + 1,
              task: task + 1,
              complexity: 'variable'
            })
          );
        }

        const results = await Promise.all(cycleTasks);
        const cycleTime = Date.now() - cycleStart;

        // Collect cycle metrics
        const successCount = results.filter(r => r.status === 200).length;
        const qualityScores = results.map(r => r.data.qualityScore || 0);
        const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

        cycleResults.push({
          cycle: cycle + 1,
          duration: cycleTime,
          successRate: successCount / improvementTest.tasksPerCycle,
          averageQuality,
          timestamp: new Date()
        });

        // Wait for feedback processing between cycles
        await delay(1000);
      }

      // Analyze improvement trend
      const qualityTrend = cycleResults.map(r => r.averageQuality);
      const timeTrend = cycleResults.map(r => r.duration);

      // Validate continuous improvement
      let improvingCycles = 0;
      for (let i = 1; i < qualityTrend.length; i++) {
        if (qualityTrend[i] >= qualityTrend[i - 1]) {
          improvingCycles++;
        }
      }

      const improvementRatio = improvingCycles / (improvementTest.cycles - 1);
      expect(improvementRatio).toBeGreaterThanOrEqual(0.6); // 60% of cycles should show improvement

      // Validate overall improvement
      const totalImprovement = (qualityTrend[qualityTrend.length - 1] - qualityTrend[0]) / qualityTrend[0];
      expect(totalImprovement).toBeGreaterThanOrEqual(improvementTest.expectedImprovementRate * improvementTest.cycles * 0.5);

      console.log(`✅ Continuous improvement validated:`);
      console.log(`   Improving cycles: ${improvementRatio * 100}%`);
      console.log(`   Total quality improvement: ${(totalImprovement * 100).toFixed(1)}%`);
      console.log(`   Average cycle time: ${(timeTrend.reduce((a, b) => a + b) / timeTrend.length).toFixed(0)}ms`);
    });
  });

  describe('Cross-Agent Learning and Knowledge Sharing', () => {
    it('should facilitate knowledge transfer between agent types', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      const knowledgeTransferTest = {
        sourceAgent: 'quality-judge',
        targetAgent: 'compliance-judge',
        knowledgeDomain: 'assessment-criteria-optimization',
        transferMethod: 'pattern-abstraction',
        expectedEfficiency: 0.7
      };

      // Create knowledge transfer scenario
      const transferResponse = await axios.post(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/knowledge-transfer`,
        {
          ...knowledgeTransferTest,
          sourceKnowledge: {
            patterns: ['quality-pattern-1', 'quality-pattern-2'],
            strategies: ['adaptive-weighting', 'context-awareness'],
            performance: { accuracy: 0.92, speed: 1.8 }
          }
        }
      );

      expect(transferResponse.status).toBe(200);
      const transferResult = transferResponse.data;

      expect(transferResult.transferId).toBeDefined();
      expect(transferResult.status).toBe('initiated');

      // Wait for knowledge transfer completion
      await delay(3000);

      // Verify knowledge transfer completion
      const transferStatusResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/knowledge-transfer/${transferResult.transferId}`
      );

      const transferStatus = transferStatusResponse.data;
      expect(transferStatus.status).toBe('completed');
      expect(transferStatus.efficiency).toBeGreaterThanOrEqual(knowledgeTransferTest.expectedEfficiency);

      // Validate target agent performance improvement
      const performanceResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/agent-performance/${knowledgeTransferTest.targetAgent}`
      );

      const performance = performanceResponse.data;
      expect(performance.knowledgeTransferImpact).toBeDefined();
      expect(performance.knowledgeTransferImpact.improvement).toBeGreaterThan(0);
    });

    it('should maintain shared learning repository across the feedback loop', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Add diverse learning experiences
      const learningExperiences = [
        {
          agentType: 'quality-judge',
          scenario: 'complex-multi-criteria-assessment',
          outcome: 'success',
          insights: ['criteria-prioritization', 'context-weighting'],
          performance: { before: 0.78, after: 0.89 }
        },
        {
          agentType: 'performance-critic',
          scenario: 'bottleneck-identification',
          outcome: 'success',
          insights: ['dependency-analysis', 'resource-optimization'],
          performance: { before: 0.82, after: 0.91 }
        },
        {
          agentType: 'workflow-coordinator',
          scenario: 'dynamic-workload-balancing',
          outcome: 'partial-success',
          insights: ['load-prediction', 'adaptive-routing'],
          performance: { before: 0.75, after: 0.83 }
        }
      ];

      // Submit learning experiences
      const submissionPromises = learningExperiences.map(experience =>
        axios.post(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/learning-repository`, experience)
      );

      const submissions = await Promise.all(submissionPromises);
      submissions.forEach(submission => {
        expect(submission.status).toBe(201);
      });

      // Retrieve shared learning repository
      const repositoryResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/learning-repository`
      );

      expect(repositoryResponse.status).toBe(200);
      const repository = repositoryResponse.data;

      expect(repository.experiences).toHaveLength(learningExperiences.length);
      expect(repository.sharedInsights).toBeDefined();
      expect(repository.crossAgentPatterns).toBeDefined();

      // Verify cross-agent pattern recognition
      const patterns = repository.crossAgentPatterns;
      expect(patterns.some((p: any) => p.type === 'performance-optimization')).toBe(true);
      expect(patterns.some((p: any) => p.applicability === 'cross-agent')).toBe(true);

      // Verify insights consolidation
      const insights = repository.sharedInsights;
      expect(insights.length).toBeGreaterThan(learningExperiences.length); // Should generate additional insights
      expect(insights.some((i: any) => i.source === 'cross-correlation')).toBe(true);
    });
  });

  describe('System Resilience and Error Handling', () => {
    it('should maintain feedback loop integrity under component failures', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Simulate component failures
      const failureScenarios = [
        { component: 'quality-judge', failureType: 'timeout', duration: 2000 },
        { component: 'evidence-collector', failureType: 'connection-loss', duration: 1500 },
        { component: 'learning-repository', failureType: 'storage-error', duration: 1000 }
      ];

      const resilienceResults: any[] = [];

      for (const scenario of failureScenarios) {
        // Simulate component failure
        await axios.post(
          `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/simulate-failure`,
          scenario
        );

        // Continue normal operations during failure
        const taskResponse = await axios.post(
          `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/task`,
          { type: 'resilience-test', failureSimulation: scenario }
        );

        expect(taskResponse.status).toBe(200); // Should still function
        expect(taskResponse.data.degradedMode).toBe(true); // Should indicate degraded operation

        // Wait for failure duration
        await delay(scenario.duration);

        // Verify recovery
        const statusResponse = await axios.get(
          `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/status`
        );

        expect(statusResponse.data.status).toBe('active');
        expect(statusResponse.data.degradedComponents).toContain(scenario.component);

        resilienceResults.push({
          scenario,
          maintainedOperation: taskResponse.data.success,
          recoveryTime: scenario.duration
        });
      }

      // Verify all scenarios maintained operation
      expect(resilienceResults.every(r => r.maintainedOperation)).toBe(true);
    });

    it('should recover gracefully from network partitions and connectivity issues', async () => {
      if (!serviceAvailable || !feedbackLoopId) return;

      // Simulate network partition
      const partitionResponse = await axios.post(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/simulate-partition`,
        { duration: 5000, affectedComponents: ['quality-judge', 'compliance-judge'] }
      );

      expect(partitionResponse.status).toBe(200);

      // Continue operations during partition
      const operationsPromises = [];
      for (let i = 0; i < 5; i++) {
        operationsPromises.push(
          axios.post(`${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/task`, {
            type: 'partition-resilience-test',
            iteration: i + 1
          }).catch(error => ({ error: error.code, iteration: i + 1 }))
        );
        await delay(1000);
      }

      const results = await Promise.all(operationsPromises);

      // Should have some successful operations (not all will fail)
      const successfulOperations = results.filter(r => !r.error).length;
      expect(successfulOperations).toBeGreaterThan(0);

      // Wait for partition resolution
      await delay(6000);

      // Verify full recovery
      const recoveryResponse = await axios.get(
        `${testConfig.baseUrl}/feedback-loops/${feedbackLoopId}/status`
      );

      expect(recoveryResponse.data.status).toBe('active');
      expect(recoveryResponse.data.partitioned).toBe(false);
    });
  });
});