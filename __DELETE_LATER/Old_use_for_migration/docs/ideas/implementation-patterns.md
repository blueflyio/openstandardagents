# OSSA Implementation Patterns

## Overview

This document provides practical implementation patterns and examples for building OSSA-compliant agents and systems. These patterns are derived from production deployments and validated implementations.

## Agent Configuration Patterns

### Basic OSSA Agent (30 lines) - Core Level
```yaml
# .agents/agent.yml - CORE OSSA CONFORMANCE
ossa: "0.1.8"
spec:
  name: "basic-worker"
  class: "worker"
  domains: ["general"]
  api:
    version: "0.1.8"
    endpoints:
      execute: "/execute"
    protocols: ["rest"]
```

### Enterprise Agent (200 lines) - Governed Level  
```yaml
# .agents/agent.yml - GOVERNED OSSA CONFORMANCE
ossa: "0.1.8"
spec:
  name: "enterprise-worker"
  class: "worker"
  subclass: "worker.drupal"
  domains: ["web", "cms", "php"]
  
  capabilities:
    primary: ["module_development", "theme_creation"]
    secondary: ["testing", "documentation"]
  
  governance:
    budget:
      maxTokensTask: 12000
      maxTokensSubtask: 4000
      enforcement: "strict"
    
    compliance:
      standards: ["WCAG2.1", "GDPR", "SOC2"]
      audit_required: true
  
  integration:
    frameworks: ["drupal", "composer", "phpunit"]
    protocols: ["rest", "graphql"]
    authentication: ["oauth2", "jwt"]
```

### Regulatory Compliant Agent (500+ lines) - Advanced Level
```yaml
# .agents/agent.yml - ADVANCED OSSA CONFORMANCE
ossa: "0.1.8"
spec:
  name: "regulatory-agent"
  class: "governance"
  subclass: "governor.compliance"
  
  governance:
    regulatory:
      frameworks: ["NIST-800-53", "ISO-27001", "FedRAMP"]
      certification_level: "high"
      audit_trail: "immutable"
    
    data_handling:
      classification: ["public", "internal", "confidential", "restricted"]
      encryption: "AES-256"
      retention: "7years"
    
    access_control:
      rbac: true
      abac: true
      mfa_required: true
```

## API Patterns

### Core OSSA API Schema
```yaml
openapi: 3.1.0
info:
  title: "OSSA Agent Control Plane"
  version: "0.1.8"

components:
  schemas:
    AgentRef:
      type: object
      required: [id, agentType]
      properties:
        id: { type: string }
        agentType: { type: string }
        agentSubType: { type: string }
    
    ExecutionReport:
      type: object
      required: [taskId, agent, usage, outputs]
      properties:
        taskId: { type: string }
        agent: { $ref: '#/components/schemas/AgentRef' }
        usage:
          type: object
          properties:
            inputTokens: { type: integer }
            outputTokens: { type: integer }
            totalCostUSD: { type: number }

paths:
  /execute:
    post:
      summary: Execute agent task
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskRequest'
      responses:
        '200':
          description: Execution successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecutionReport'
```

### Multi-Protocol Implementation
```typescript
// REST + gRPC + WebSocket support
export class OSSAAgent {
  // REST endpoint
  async executeREST(request: TaskRequest): Promise<ExecutionReport> {
    return this.execute(request);
  }
  
  // gRPC service
  async executeGRPC(call: grpc.ServerUnaryCall<TaskRequest>): Promise<ExecutionReport> {
    return this.execute(call.request);
  }
  
  // WebSocket handler
  handleWebSocket(ws: WebSocket) {
    ws.on('message', async (data) => {
      const request = JSON.parse(data.toString());
      const result = await this.execute(request);
      ws.send(JSON.stringify(result));
    });
  }
}
```

## Discovery Engine Pattern

### Scalable Agent Discovery
```typescript
export class AgentDiscovery {
  constructor(private registry: AgentRegistry) {}
  
  async discover(criteria: DiscoveryCriteria): Promise<Agent[]> {
    // Level-aware discovery
    const agents = await this.registry.query({
      class: criteria.agentType,
      domains: criteria.domains,
      minLevel: criteria.complianceLevel
    });
    
    return this.rankBySuitability(agents, criteria);
  }
  
  private rankBySuitability(agents: Agent[], criteria: DiscoveryCriteria): Agent[] {
    return agents.sort((a, b) => {
      const scoreA = this.calculateSuitabilityScore(a, criteria);
      const scoreB = this.calculateSuitabilityScore(b, criteria);
      return scoreB - scoreA;
    });
  }
}
```

### Workspace-Level Registry
```yaml
# .agents-workspace/workspace-registry.yml
workspace:
  version: "0.1.8"
  agents:
    discovery:
      auto_scan: true
      levels: ["core", "governed", "advanced"]
      frameworks: ["ossa", "mcp", "langchain"]
  
  orchestration:
    load_balancing: "capability_based"
    fallback_strategy: "graceful_degradation"
    budget_enforcement: "strict"
  
  compliance:
    required_standards: ["OSSA-0.1.8"]
    audit_logging: true
    governance_level: "enterprise"
```

## Workspace Structure Patterns

### Standard Workspace Layout
```
.agents-workspace/
├── plans/              # Execution plans
│   ├── active/         # Currently executing plans
│   └── completed/      # Completed execution history
├── executions/         # Reports and outputs
│   ├── success/        # Successful executions
│   └── failed/         # Failed execution logs
├── feedback/           # Reviews and judgments
│   ├── reviews/        # Multi-dimensional reviews
│   └── decisions/      # Judge decisions
├── learning/           # Signals and updates
│   ├── signals/        # Learning signals
│   └── memory/         # Persistent memory
├── audit/              # Immutable event logs
│   └── events.jsonl    # Append-only audit trail
└── roadmap/            # Machine-lean JSON sitemap
    ├── sitemap.json    # Project roadmap
    └── dita/           # DITA documentation
```

## Integration Patterns

### MCP Server Bridge
```typescript
// OSSA to MCP bridge pattern
export class OSSAMCPBridge {
  constructor(private ossaAgent: OSSAAgent) {}
  
  // MCP protocol handler
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    // Translate MCP to OSSA
    const ossaRequest = this.translateMCPToOSSA(request);
    
    // Execute via OSSA agent
    const ossaResult = await this.ossaAgent.execute(ossaRequest);
    
    // Translate back to MCP
    return this.translateOSSAToMCP(ossaResult);
  }
  
  private translateMCPToOSSA(request: MCPRequest): TaskRequest {
    return {
      taskId: request.id,
      action: request.method,
      parameters: request.params,
      context: request.context
    };
  }
}
```

### LangChain Integration  
```python
# OSSA agents as LangChain tools
from langchain.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field

class OSSAToolInput(BaseModel):
    query: str = Field(description="Task to execute")

class OSSATool(BaseTool):
    name = "ossa_agent"
    description = "OSSA-compliant agent executor"
    args_schema: Type[BaseModel] = OSSAToolInput
    
    def __init__(self, ossa_agent):
        super().__init__()
        self.ossa_agent = ossa_agent
    
    def _run(self, query: str) -> str:
        result = self.ossa_agent.execute({
            "taskId": self.generate_task_id(),
            "action": "process",
            "parameters": {"query": query}
        })
        return result.outputs[0].summary
```

### CrewAI Multi-Agent Pattern
```yaml
# CrewAI configuration using OSSA agents
agents:
  - name: ossa_orchestrator
    role: "Task Coordinator" 
    goal: "Route tasks to appropriate OSSA agents"
    backstory: "Expert in OSSA agent capabilities"
    ossa_config:
      agent_type: "orchestrator"
      compliance_level: "governed"
  
  - name: ossa_worker
    role: "Task Executor"
    goal: "Execute specialized tasks"
    backstory: "Domain expert with OSSA compliance"
    ossa_config:
      agent_type: "worker"
      subtype: "worker.drupal"

tasks:
  - description: "Coordinate multi-agent workflow"
    agent: ossa_orchestrator
    expected_output: "Orchestration plan with agent assignments"
```

## Performance Optimization Patterns

### Token Optimization Implementation
```typescript
export class TokenOptimizer {
  // Strategy 1: Key-based context
  private resolvePropsTokens(prompt: string): string {
    const propsPattern = /@\{([^}]+)\}/g;
    return prompt.replace(propsPattern, (match, key) => {
      return this.resolvePropsToken(key);
    });
  }
  
  // Strategy 2: Delta prompting
  private generateDeltaPrompt(current: string, previous: string): string {
    const diff = this.computeSemanticDiff(current, previous);
    return this.createDeltaPrompt(diff);
  }
  
  // Strategy 3: Tiered depth
  private createTieredPrompt(complexity: 'shallow' | 'medium' | 'deep'): string {
    switch (complexity) {
      case 'shallow':
        return this.summaryTemplate;
      case 'medium': 
        return this.outlineTemplate;
      case 'deep':
        return this.detailedTemplate;
    }
  }
}
```

### Budget Enforcement Pattern
```typescript
export class BudgetEnforcer {
  async enforceTaskBudget(
    taskRequest: TaskRequest, 
    budget: Budget
  ): Promise<ExecutionResult> {
    
    // Pre-flight budget check
    const estimatedTokens = this.estimateTokenUsage(taskRequest);
    
    if (estimatedTokens > budget.maxTokensTask) {
      switch (budget.handoffPolicy) {
        case 'subtask':
          return this.breakIntoSubtasks(taskRequest, budget);
        case 'specialist':
          return this.routeToSpecialist(taskRequest);
        case 'abort':
          throw new BudgetExceededException();
      }
    }
    
    return this.executeWithMonitoring(taskRequest, budget);
  }
}
```

## Production Deployment Patterns

### Enterprise Agent Template
```yaml
# Production-ready agent configuration
ossa: "0.1.8"
metadata:
  name: "production-agent"
  version: "1.0.0"
  environment: "production"
  
spec:
  class: "worker"
  subclass: "worker.api"
  
  resources:
    cpu: "2000m"
    memory: "4Gi" 
    storage: "20Gi"
  
  scaling:
    min_replicas: 2
    max_replicas: 10
    target_cpu: 70
  
  monitoring:
    health_check: "/health"
    metrics_port: 9090
    log_level: "info"
  
  security:
    run_as_non_root: true
    read_only_filesystem: true
    network_policies: ["agent-network-policy"]
```

### CI/CD Integration Pattern
```yaml
# GitLab CI for OSSA agents
stages:
  - validate
  - test
  - deploy

validate_ossa:
  stage: validate
  script:
    - ossa validate .agents/agent.yml
    - ossa compliance-check --standards NIST-800-53

test_agent:
  stage: test
  script:
    - ossa test --integration
    - ossa performance-benchmark

deploy_agent:
  stage: deploy
  script:
    - ossa deploy --environment production
    - ossa monitor --health-check
```

These implementation patterns provide proven approaches for building, deploying, and maintaining OSSA-compliant agent systems in production environments.