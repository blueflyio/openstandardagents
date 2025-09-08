# 360° Feedback Loop Implementation

This example demonstrates the complete 360° Feedback Loop system that forms the core of OSSA's continuous improvement architecture.

## Architecture Overview

The 360° Feedback Loop operates on a continuous cycle:
**Plan → Execute → Review → Judge → Learn → Govern**

## Agent Types & Roles

### Orchestrators
- **Primary Role**: Decompose goals into executable plans
- **Capabilities**: Task decomposition, resource allocation, scheduling
- **Output**: Structured execution plans with subtasks and dependencies

### Workers (Executors)
- **Primary Role**: Execute tasks with self-reporting capabilities
- **Capabilities**: Task execution, progress reporting, error handling
- **Output**: Execution reports with results and performance metrics

### Critics (Reviewers)
- **Primary Role**: Provide multi-dimensional reviews
- **Capabilities**: Quality assessment, risk analysis, improvement suggestions
- **Output**: Structured feedback with scores and recommendations

### Judges
- **Primary Role**: Make binary decisions through pairwise comparisons
- **Capabilities**: Decision making, consensus building, conflict resolution
- **Output**: Binary decisions with confidence scores and reasoning

### Trainers (Learning)
- **Primary Role**: Synthesize feedback into learning signals
- **Capabilities**: Pattern recognition, model updates, knowledge synthesis
- **Output**: Learning signals and updated agent capabilities

### Governors
- **Primary Role**: Enforce budgets and compliance
- **Capabilities**: Budget monitoring, policy enforcement, audit trails
- **Output**: Compliance reports and enforcement actions

## Token Budget Management

Default budget allocations:
- **Task**: 12,000 tokens
- **Subtask**: 4,000 tokens  
- **Planning**: 2,000 tokens

Enforcement policies:
- **Block**: Stop execution when budget exceeded
- **Queue**: Defer execution until budget available
- **Delegate**: Pass to lower-cost agent
- **Escalate**: Request budget increase

## Implementation Files

- `orchestrator-agent.yml` - Planning and task decomposition agent
- `worker-agent.yml` - Task execution agent
- `critic-agent.yml` - Review and feedback agent  
- `judge-agent.yml` - Decision making agent
- `trainer-agent.yml` - Learning and improvement agent
- `governor-agent.yml` - Budget and compliance enforcement
- `feedback-loop-demo.js` - Complete workflow demonstration
- `workspace-setup.js` - Initialize .agents-workspace structure

## Key Features Demonstrated

1. **Structured Planning**: Goal decomposition with dependency tracking
2. **Self-Reporting Execution**: Workers provide detailed progress updates
3. **Multi-Dimensional Review**: Critics assess quality, risks, and improvements
4. **Consensus Decision Making**: Judges resolve conflicts and make final decisions
5. **Continuous Learning**: Trainers extract patterns and update agent knowledge
6. **Budget Governance**: Governors enforce token limits and compliance policies

## Usage

```bash
# Initialize the workspace
node workspace-setup.js

# Run the complete feedback loop demonstration
node feedback-loop-demo.js

# Validate all agent configurations
ossa validate *.yml

# Monitor the feedback loop execution
ossa monitor --workspace .agents-workspace
```

This example shows how multiple specialized agents work together in a continuous improvement cycle, with proper governance and learning mechanisms built in.