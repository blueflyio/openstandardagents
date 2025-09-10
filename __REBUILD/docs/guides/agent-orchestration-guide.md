# OSSA Agent Orchestration Guide

## How to Spin Up Agents and Allocate Tasks

### Understanding the 360° Feedback Loop

OSSA implements a continuous improvement cycle where each phase has specialized agents:

```
Plan → Execute → Review → Judge → Learn → Govern
```

### Agent Types and Their Roles

#### 1. Orchestrators (Planning Phase)
**Purpose**: Decompose goals, create execution plans, route tasks
```yaml
agentType: orchestrator
responsibilities:
  - Break down complex goals into tasks
  - Create dependency graphs
  - Allocate budgets
  - Route to appropriate workers
```

#### 2. Workers (Execution Phase)
**Purpose**: Execute specific tasks with self-reporting
```yaml
agentType: worker
subtypes:
  - worker.api: API design and implementation
  - worker.docs: Documentation generation
  - worker.test: Test creation and execution
  - worker.data: Data processing
  - worker.devops: Infrastructure tasks
```

#### 3. Critics (Review Phase)
**Purpose**: Multi-dimensional review and feedback
```yaml
agentType: critic
subtypes:
  - critic.security: Security vulnerability assessment
  - critic.performance: Performance analysis
  - critic.quality: Code quality review
  - critic.compliance: Regulatory compliance
```

#### 4. Judges (Decision Phase)
**Purpose**: Make binary decisions through comparison
```yaml
agentType: judge
responsibilities:
  - Compare alternative solutions
  - Rank options using pairwise comparison
  - Make go/no-go decisions
```

#### 5. Trainers (Learning Phase)
**Purpose**: Synthesize feedback into improvements
```yaml
agentType: trainer
responsibilities:
  - Extract patterns from feedback
  - Update agent skills
  - Manage learning curriculum
```

#### 6. Governors (Governance Phase)
**Purpose**: Enforce budgets and policies
```yaml
agentType: governor
subtypes:
  - governor.cost: Token budget management
  - governor.policy: Compliance enforcement
  - governor.resource: Resource allocation
```

## Agent Spinning Strategy

### Step 1: Task Analysis
```typescript
// Analyze the incoming task
const analyzeTask = (task: Task) => {
  return {
    complexity: assessComplexity(task),
    domains: extractDomains(task),
    requirements: {
      capabilities: identifyRequiredCapabilities(task),
      performance: estimatePerformanceNeeds(task),
      budget: calculateTokenBudget(task)
    }
  };
};
```

### Step 2: Agent Selection
```typescript
// Select appropriate agents based on task analysis
const selectAgents = (analysis: TaskAnalysis) => {
  const agents = {
    orchestrator: null,
    workers: [],
    critics: [],
    judge: null,
    governor: null
  };

  // Always need an orchestrator for complex tasks
  if (analysis.complexity > 'simple') {
    agents.orchestrator = findAgent('orchestrator', {
      capabilities: ['planning', 'routing']
    });
  }

  // Select workers based on domains
  analysis.domains.forEach(domain => {
    agents.workers.push(findAgent('worker', {
      subtype: `worker.${domain}`,
      capabilities: analysis.requirements.capabilities
    }));
  });

  // Add critics for quality assurance
  if (analysis.complexity >= 'medium') {
    agents.critics.push(findAgent('critic', {
      subtype: 'critic.quality'
    }));
  }

  // Add governance for budget control
  agents.governor = findAgent('governor', {
    subtype: 'governor.cost',
    budget: analysis.requirements.budget
  });

  return agents;
};
```

### Step 3: Agent Initialization
```typescript
// Initialize and configure agents
const initializeAgents = async (agents: SelectedAgents) => {
  const initialized = {};

  // Initialize orchestrator first
  if (agents.orchestrator) {
    initialized.orchestrator = await spawnAgent({
      type: 'orchestrator',
      config: {
        maxWorkers: agents.workers.length,
        timeout: 30000,
        retryPolicy: 'exponential'
      }
    });
  }

  // Initialize workers in parallel
  initialized.workers = await Promise.all(
    agents.workers.map(worker => 
      spawnAgent({
        type: worker.type,
        subtype: worker.subtype,
        config: worker.config
      })
    )
  );

  return initialized;
};
```

### Step 4: Task Execution Flow
```typescript
// Execute task through feedback loop
const executeTask = async (task: Task, agents: InitializedAgents) => {
  // 1. PLAN - Orchestrator creates execution plan
  const plan = await agents.orchestrator.plan(task);
  
  // 2. EXECUTE - Workers perform tasks
  const results = await Promise.all(
    plan.subtasks.map(subtask => 
      agents.workers[subtask.workerId].execute(subtask)
    )
  );
  
  // 3. REVIEW - Critics evaluate results
  const reviews = await Promise.all(
    agents.critics.map(critic => 
      critic.review(results)
    )
  );
  
  // 4. JUDGE - Judge makes decisions
  const decision = await agents.judge.evaluate(reviews);
  
  // 5. LEARN - Trainer extracts lessons
  const lessons = await agents.trainer.synthesize({
    task,
    results,
    reviews,
    decision
  });
  
  // 6. GOVERN - Governor enforces policies
  const governance = await agents.governor.enforce({
    budget: task.budget,
    usage: calculateUsage(results)
  });
  
  return {
    results,
    reviews,
    decision,
    lessons,
    governance
  };
};
```

## Practical Examples

### Example 1: API Development Task
```yaml
task: "Create REST API for user management"
agents_needed:
  - orchestrator: Plan API structure
  - worker.api: Design OpenAPI spec
  - worker.test: Create test suite
  - worker.docs: Generate documentation
  - critic.security: Review security
  - critic.quality: Review code quality
  - judge: Approve final implementation
  - governor.cost: Monitor token usage
```

### Example 2: Documentation Update
```yaml
task: "Update project documentation"
agents_needed:
  - worker.docs: Update documentation
  - critic.quality: Review accuracy
  - governor.cost: Simple budget control
```

### Example 3: Complex System Refactoring
```yaml
task: "Refactor authentication system"
agents_needed:
  - orchestrator: Plan refactoring strategy
  - worker.api: Update API endpoints
  - worker.test: Update test suite
  - worker.devops: Update deployment configs
  - critic.security: Security review
  - critic.performance: Performance analysis
  - critic.quality: Code quality review
  - judge: Approve changes
  - trainer: Extract patterns for future
  - governor.policy: Ensure compliance
```

## Agent Communication Patterns

### Direct Communication
```typescript
// Worker to Worker
worker1.sendMessage(worker2, {
  type: 'data_request',
  payload: { needed: 'user_schema' }
});
```

### Orchestrated Communication
```typescript
// Through Orchestrator
orchestrator.route({
  from: worker1,
  to: worker2,
  message: payload
});
```

### Broadcast Communication
```typescript
// To all agents of a type
orchestrator.broadcast('critics', {
  type: 'review_request',
  payload: results
});
```

## Budget Management

### Token Allocation
```yaml
default_budgets:
  task: 12000        # Total task budget
  subtask: 4000      # Per subtask
  planning: 2000     # Planning phase
  review: 1000       # Review phase
  governance: 500    # Governance overhead
```

### Budget Enforcement
```typescript
const enforcebudget = (usage: TokenUsage, budget: Budget) => {
  if (usage.total > budget.total) {
    return {
      action: 'block',
      reason: 'Budget exceeded',
      options: ['queue', 'delegate', 'escalate']
    };
  }
  return { action: 'continue' };
};
```

## Monitoring and Observability

### Agent Health Monitoring
```typescript
const monitorAgents = () => {
  return {
    active: getActiveAgents(),
    idle: getIdleAgents(),
    failed: getFailedAgents(),
    metrics: {
      avgResponseTime: calculateAvgResponseTime(),
      successRate: calculateSuccessRate(),
      tokenUsage: getCurrentTokenUsage()
    }
  };
};
```

### Performance Metrics
```yaml
key_metrics:
  - agent_registration_time: < 100ms
  - task_scheduling_time: < 50ms
  - inter_agent_communication: < 10ms
  - workflow_overhead: < 500ms
  - token_efficiency: > 70%
```

## Best Practices

1. **Start Simple**: Begin with minimal agents, add complexity as needed
2. **Monitor Budgets**: Always include a governor for token management
3. **Use Critics**: Add appropriate critics for quality assurance
4. **Plan First**: Use orchestrators for complex multi-step tasks
5. **Learn Continuously**: Include trainers to improve over time
6. **Fail Gracefully**: Implement timeout and retry mechanisms
7. **Log Everything**: Maintain audit trails for compliance

## Common Patterns

### Pattern 1: Simple Task
```
Worker → Governor
```

### Pattern 2: Reviewed Task
```
Worker → Critic → Governor
```

### Pattern 3: Complex Workflow
```
Orchestrator → Workers → Critics → Judge → Trainer → Governor
```

### Pattern 4: Parallel Execution
```
Orchestrator → [Worker1, Worker2, Worker3] → Critic → Judge → Governor
```

## Troubleshooting

### Agent Not Responding
- Check agent health status
- Verify protocol compatibility
- Review timeout settings
- Check resource limits

### Budget Exceeded
- Review token allocation
- Optimize prompts
- Use tiered depth strategy
- Implement caching

### Poor Performance
- Add performance critics
- Review agent selection
- Optimize communication patterns
- Scale horizontally

---

This guide provides the foundation for understanding how to orchestrate agents in OSSA v0.1.9-alpha.1.