/**
 * Test Fixtures and Utilities for OSSA Agent Testing
 * 
 * Provides comprehensive test fixtures, utilities, and helper functions for
 * testing OSSA agent lifecycles, coordination, and compliance validation.
 */

import { 
  Agent, 
  AgentState, 
  TaskRequest, 
  TaskPriority, 
  Capability, 
  ServiceLevelAgreement,
  AgentMetadata,
  Budget,
  TaskContext,
  SecurityContext,
  TaskMetadata
} from '../../src/coordination/agent-coordinator.js';
import { 
  LifecycleManager,
  LifecycleState,
  HealthStatus,
  FailureAction,
  HeartbeatConfig,
  HealthCheckConfig,
  FailureDetectionConfig,
  ShutdownConfig,
  HotSwapConfig,
  DependencyConfig
} from '../../src/lifecycle/lifecycle-manager.js';

/**
 * Configuration for creating test agents
 */
export interface TestAgentConfig {
  id: string;
  name?: string;
  type?: string;
  capabilities?: string[] | Capability[];
  state?: AgentState;
  trustScore?: number;
  currentLoad?: number;
  maxLoad?: number;
  sla?: Partial<ServiceLevelAgreement>;
  metadata?: Partial<AgentMetadata>;
}

/**
 * Configuration for creating test tasks
 */
export interface TestTaskConfig {
  id: string;
  workflowId?: string;
  requiredCapabilities?: any[];
  priority?: TaskPriority;
  deadline?: Date;
  budget?: Partial<Budget>;
  context?: Partial<TaskContext>;
  dependencies?: string[];
  slaRequirements?: Partial<ServiceLevelAgreement>;
  metadata?: Partial<TaskMetadata>;
}

/**
 * Creates a test agent with reasonable defaults
 */
export function createTestAgent(config: TestAgentConfig): Agent {
  const now = new Date();
  
  const capabilities: Capability[] = Array.isArray(config.capabilities) 
    ? (typeof config.capabilities[0] === 'string' 
        ? (config.capabilities as string[]).map((cap, index) => createTestCapability(cap, index))
        : config.capabilities as Capability[])
    : [createTestCapability('default-capability', 0)];
  
  const defaultSLA: ServiceLevelAgreement = {
    responseTimeMs: 2000,
    availabilityPercent: 99.0,
    throughputPerSecond: 10,
    errorRatePercent: 1.0,
    recoveryTimeMs: 5000
  };
  
  const defaultMetadata: AgentMetadata = {
    version: '1.0.0',
    framework: 'ossa',
    region: 'local',
    tags: ['test', config.type || 'worker'],
    owner: 'test-system',
    createdAt: now,
    lastUpdated: now
  };
  
  return {
    id: config.id,
    name: config.name || config.id.replace(/-/g, ' '),
    type: config.type || 'worker',
    capabilities,
    state: config.state || AgentState.AVAILABLE,
    currentLoad: config.currentLoad || 0,
    maxLoad: config.maxLoad || 10,
    sla: { ...defaultSLA, ...config.sla },
    trustScore: config.trustScore || 0.85,
    lastHeartbeat: now,
    metadata: { ...defaultMetadata, ...config.metadata }
  };
}

/**
 * Creates a test capability with defaults
 */
export function createTestCapability(name: string, index: number): Capability {
  return {
    id: `capability-${name}-${index}`,
    name: name.replace('-', ' '),
    version: '1.0.0',
    parameters: [],
    constraints: [],
    cost: {
      baseUnits: 10,
      scalingFactor: 1.0,
      currency: 'tokens',
      budgetRequired: false
    },
    sla: {
      responseTimeMs: 1500,
      availabilityPercent: 99.5,
      throughputPerSecond: 8,
      errorRatePercent: 0.5,
      recoveryTimeMs: 3000
    }
  };
}

/**
 * Creates a test task with reasonable defaults
 */
export function createTestTask(config: TestTaskConfig): TaskRequest {
  const now = new Date();
  
  const defaultBudget: Budget = {
    maxTokens: 1000,
    maxCost: 50,
    currency: 'tokens',
    allocation: {
      planning: 0.1,
      execution: 0.7,
      review: 0.1,
      integration: 0.05,
      contingency: 0.05
    },
    tracking: {
      spent: 0,
      allocated: 50,
      remaining: 50,
      projectedOverrun: 0,
      alerts: []
    }
  };
  
  const defaultContext: TaskContext = {
    agentId: 'test-agent',
    stepId: 'step-1',
    previousResults: [],
    environmentVariables: {},
    securityContext: {
      permissions: ['read', 'process'],
      restrictions: [],
      auditRequired: false,
      encryptionLevel: 'standard'
    }
  };
  
  const defaultSLA: ServiceLevelAgreement = {
    responseTimeMs: 5000,
    availabilityPercent: 99.0,
    throughputPerSecond: 5,
    errorRatePercent: 2.0,
    recoveryTimeMs: 10000
  };
  
  const defaultMetadata: TaskMetadata = {
    createdBy: 'test-system',
    createdAt: now,
    estimatedDuration: 5000,
    complexity: 'moderate',
    category: 'test'
  };
  
  return {
    id: config.id,
    workflowId: config.workflowId || `workflow-${config.id}`,
    requiredCapabilities: config.requiredCapabilities || [{
      capabilityId: 'default-capability',
      version: '1.0.0',
      parameters: {},
      alternatives: [],
      weight: 1.0
    }],
    priority: config.priority || TaskPriority.MEDIUM,
    deadline: config.deadline,
    budget: { ...defaultBudget, ...config.budget },
    context: { ...defaultContext, ...config.context },
    dependencies: config.dependencies || [],
    slaRequirements: { ...defaultSLA, ...config.slaRequirements },
    metadata: { ...defaultMetadata, ...config.metadata }
  };
}

/**
 * Creates a lifecycle manager configuration for testing
 */
export function createLifecycleConfig() {
  const heartbeat: HeartbeatConfig = {
    interval: 1000,
    timeout: 5000,
    retryAttempts: 3,
    escalationDelay: 1000
  };
  
  const healthCheck: HealthCheckConfig = {
    endpoint: '/health',
    method: 'GET',
    timeout: 2000,
    interval: 3000,
    failureThreshold: 3,
    successThreshold: 2
  };
  
  const failureDetection: FailureDetectionConfig = {
    tiers: {
      heartbeat: {
        enabled: true,
        threshold: 3,
        action: FailureAction.RESTART,
        escalationTime: 5000
      },
      health_check: {
        enabled: true,
        threshold: 3,
        action: FailureAction.RESTART,
        escalationTime: 10000
      },
      performance: {
        enabled: true,
        threshold: 5,
        action: FailureAction.ISOLATE,
        escalationTime: 15000
      },
      dependency: {
        enabled: true,
        threshold: 2,
        action: FailureAction.ESCALATE,
        escalationTime: 20000
      },
      resource: {
        enabled: true,
        threshold: 1,
        action: FailureAction.REPLACE,
        escalationTime: 30000
      }
    },
    circuit_breaker: {
      enabled: true,
      failure_threshold: 5,
      recovery_timeout: 30000,
      half_open_max_calls: 3
    }
  };
  
  const shutdown: ShutdownConfig = {
    graceful_timeout: 10000,
    force_timeout: 5000,
    cleanup_tasks: ['save_state', 'close_connections', 'release_resources'],
    drain_connections: true,
    save_state: true
  };
  
  const hotSwap: HotSwapConfig = {
    enabled: true,
    preparation_timeout: 5000,
    swap_timeout: 10000,
    rollback_timeout: 8000,
    health_check_delay: 2000,
    compatibility_check: true
  };
  
  const dependency: DependencyConfig = {
    resolution_strategy: 'breadth_first',
    circular_detection: true,
    max_dependency_depth: 10,
    startup_order_timeout: 30000,
    shutdown_order_timeout: 20000
  };
  
  return {
    heartbeat,
    healthCheck,
    failureDetection,
    shutdown,
    hotSwap,
    dependency
  };
}

/**
 * Utility to wait for agent state transition
 */
export async function waitForState(
  lifecycleManager: LifecycleManager, 
  agentId: string, 
  expectedState: LifecycleState, 
  timeoutMs: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkState = () => {
      const agent = lifecycleManager['agents'].get(agentId);
      if (agent && agent.lifecycle.state === expectedState) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeoutMs) {
        resolve(false);
        return;
      }
      
      setTimeout(checkState, 100);
    };
    
    checkState();
  });
}

/**
 * Utility to wait for health status change
 */
export async function waitForHealthStatus(
  lifecycleManager: LifecycleManager,
  agentId: string,
  expectedStatus: HealthStatus,
  timeoutMs: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkHealth = () => {
      const health = lifecycleManager.getAgentHealth(agentId);
      if (health.status === expectedStatus) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeoutMs) {
        resolve(false);
        return;
      }
      
      setTimeout(checkHealth, 100);
    };
    
    checkHealth();
  });
}

/**
 * Creates a set of agents representing all feedback loop phases
 */
export async function createFeedbackLoopAgents() {
  const phaseAgents = [
    createTestAgent({ id: 'orchestrator-agent', type: 'orchestrator', capabilities: ['planning', 'orchestration'] }),
    createTestAgent({ id: 'worker-agent-1', type: 'worker', capabilities: ['execution', 'processing'] }),
    createTestAgent({ id: 'worker-agent-2', type: 'worker', capabilities: ['execution', 'processing'] }),
    createTestAgent({ id: 'critic-agent', type: 'critic', capabilities: ['critique', 'quality-assessment'] }),
    createTestAgent({ id: 'judge-agent-1', type: 'judge', capabilities: ['judgment', 'decision-making'] }),
    createTestAgent({ id: 'judge-agent-2', type: 'judge', capabilities: ['judgment', 'arbitration'] }),
    createTestAgent({ id: 'integrator-agent', type: 'integrator', capabilities: ['integration', 'merging'] }),
    createTestAgent({ id: 'trainer-agent', type: 'trainer', capabilities: ['learning', 'model-updating'] }),
    createTestAgent({ id: 'governor-agent', type: 'governor', capabilities: ['governance', 'policy-enforcement'] }),
    createTestAgent({ id: 'telemetry-agent', type: 'telemetry', capabilities: ['monitoring', 'metrics-collection'] })
  ];
  
  return phaseAgents;
}

/**
 * Creates a diverse pool of test agents with different specializations
 */
export function createDiverseAgentPool(count: number = 10) {
  const agentTypes = ['nlp', 'vision', 'reasoning', 'planning', 'execution', 'validation', 'integration', 'monitoring'];
  const agents = [];
  
  for (let i = 0; i < count; i++) {
    const type = agentTypes[i % agentTypes.length];
    const agent = createTestAgent({
      id: `diverse-agent-${type}-${i}`,
      name: `Diverse ${type} Agent ${i}`,
      type,
      capabilities: [`${type}-processing`, 'generic-capability'],
      trustScore: 0.7 + Math.random() * 0.29,
      currentLoad: Math.floor(Math.random() * 3),
      maxLoad: 5 + Math.floor(Math.random() * 10)
    });
    agents.push(agent);
  }
  
  return agents;
}

/**
 * Creates test tasks with various complexity levels
 */
export function createComplexityTestTasks() {
  const complexities: Array<'simple' | 'moderate' | 'complex' | 'critical'> = ['simple', 'moderate', 'complex', 'critical'];
  const priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL];
  
  return complexities.map((complexity, index) => 
    createTestTask({
      id: `${complexity}-task-${index}`,
      priority: priorities[index],
      deadline: new Date(Date.now() + (4 - index) * 10000), // Shorter deadlines for higher complexity
      metadata: {
        createdBy: 'test-system',
        createdAt: new Date(),
        estimatedDuration: (index + 1) * 2000,
        complexity,
        category: `${complexity}-processing`
      }
    })
  );
}

/**
 * Mock data generator for performance testing
 */
export class PerformanceDataGenerator {
  static generateMetricsHistory(points: number, baseValue: number, variance: number) {
    const history = [];
    let currentValue = baseValue;
    
    for (let i = 0; i < points; i++) {
      // Add trend and random variance
      const trend = Math.sin(i * 0.1) * variance * 0.3;
      const randomVariance = (Math.random() - 0.5) * variance;
      currentValue = Math.max(0, Math.min(100, baseValue + trend + randomVariance));
      
      history.push({
        timestamp: new Date(Date.now() - (points - i) * 60000), // 1 minute intervals
        value: Math.round(currentValue * 100) / 100
      });
    }
    
    return history;
  }
  
  static generateLatencyDistribution(samples: number, meanMs: number, stdDevMs: number) {
    const distribution = [];
    
    for (let i = 0; i < samples; i++) {
      // Generate normal distribution using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const latency = Math.max(0, meanMs + z0 * stdDevMs);
      
      distribution.push(Math.round(latency));
    }
    
    return distribution.sort((a, b) => a - b);
  }
  
  static calculatePercentiles(values: number[], percentiles: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const result: Record<string, number> = {};
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      result[`p${p}`] = sorted[Math.max(0, index)];
    });
    
    return result;
  }
}

/**
 * Test event collector for monitoring test execution
 */
export class TestEventCollector {
  private events: Array<{ type: string; timestamp: Date; data: any }> = [];
  
  collect(type: string, data: any) {
    this.events.push({
      type,
      timestamp: new Date(),
      data: { ...data }
    });
  }
  
  getEvents(type?: string) {
    return type 
      ? this.events.filter(e => e.type === type)
      : [...this.events];
  }
  
  getEventsByTimeRange(start: Date, end: Date) {
    return this.events.filter(e => 
      e.timestamp >= start && e.timestamp <= end
    );
  }
  
  clear() {
    this.events = [];
  }
  
  getStats() {
    const typeCount = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: this.events.length,
      byType: typeCount,
      timeSpan: this.events.length > 0 ? {
        start: this.events[0].timestamp,
        end: this.events[this.events.length - 1].timestamp
      } : null
    };
  }
}

/**
 * Resource monitor for testing resource usage and limits
 */
export class TestResourceMonitor {
  private resources: Record<string, { used: number; limit: number; history: number[] }> = {};
  
  setLimit(resource: string, limit: number) {
    if (!this.resources[resource]) {
      this.resources[resource] = { used: 0, limit, history: [] };
    } else {
      this.resources[resource].limit = limit;
    }
  }
  
  allocate(resource: string, amount: number): boolean {
    if (!this.resources[resource]) {
      this.setLimit(resource, 100); // Default limit
    }
    
    const resourceData = this.resources[resource];
    if (resourceData.used + amount > resourceData.limit) {
      return false; // Allocation would exceed limit
    }
    
    resourceData.used += amount;
    resourceData.history.push(resourceData.used);
    return true;
  }
  
  release(resource: string, amount: number) {
    if (this.resources[resource]) {
      this.resources[resource].used = Math.max(0, this.resources[resource].used - amount);
      this.resources[resource].history.push(this.resources[resource].used);
    }
  }
  
  getUsage(resource: string) {
    return this.resources[resource]?.used || 0;
  }
  
  getUtilization(resource: string): number {
    const resourceData = this.resources[resource];
    return resourceData ? (resourceData.used / resourceData.limit) : 0;
  }
  
  getStats() {
    const stats: Record<string, any> = {};
    
    Object.entries(this.resources).forEach(([name, data]) => {
      stats[name] = {
        used: data.used,
        limit: data.limit,
        utilization: data.used / data.limit,
        peakUsage: Math.max(...data.history),
        avgUsage: data.history.reduce((sum, val) => sum + val, 0) / data.history.length || 0
      };
    });
    
    return stats;
  }
  
  reset() {
    Object.values(this.resources).forEach(resource => {
      resource.used = 0;
      resource.history = [];
    });
  }
}

/**
 * Utility functions for test assertions and validation
 */
export const TestUtils = {
  /**
   * Checks if a value is within a percentage range of expected value
   */
  isWithinPercentage(actual: number, expected: number, percentage: number): boolean {
    const tolerance = Math.abs(expected * (percentage / 100));
    return Math.abs(actual - expected) <= tolerance;
  },
  
  /**
   * Calculates improvement percentage between two values
   */
  calculateImprovement(baseline: number, improved: number): number {
    if (baseline === 0) return 0;
    return ((baseline - improved) / baseline) * 100;
  },
  
  /**
   * Generates a UUID for test purposes
   */
  generateId(): string {
    return 'test-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  },
  
  /**
   * Creates a delay promise for test timing
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Retries an async operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>, 
    maxAttempts: number = 3, 
    baseDelayMs: number = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await this.delay(delayMs);
      }
    }
    
    throw lastError!;
  },
  
  /**
   * Validates that metrics meet OSSA v0.1.8 targets
   */
  validateOSSATargets(metrics: {
    coordinationEfficiency?: number;
    tokenOptimization?: number;
    orchestrationOverhead?: number;
    taskCompletionRate?: number;
  }) {
    const targets = {
      coordinationEfficiency: 26, // 26% improvement
      tokenOptimization: 67,      // 67% optimization
      orchestrationOverhead: 34,  // 34% reduction
      taskCompletionRate: 90      // 90% completion rate
    };
    
    const results: Record<string, boolean> = {};
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined && targets[key as keyof typeof targets] !== undefined) {
        results[key] = value >= targets[key as keyof typeof targets];
      }
    });
    
    return {
      results,
      allTargetsMet: Object.values(results).every(met => met),
      targetsMetCount: Object.values(results).filter(met => met).length,
      totalTargets: Object.keys(results).length
    };
  }
};

/**
 * Custom matchers for test assertions
 */
export const customMatchers = {
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received} not to be within range ${min}-${max}`
          : `Expected ${received} to be within range ${min}-${max}`
    };
  },
  
  toMeetOSSATarget(received: number, target: number) {
    const pass = received >= target;
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to meet OSSA target of ${target}`
          : `Expected ${received} to meet OSSA target of ${target}`
    };
  }
};

// Extend expect with custom matchers
declare global {
  namespace Vi {
    interface Assertion {
      toBeWithinRange(min: number, max: number): void;
      toMeetOSSATarget(target: number): void;
    }
  }
}
