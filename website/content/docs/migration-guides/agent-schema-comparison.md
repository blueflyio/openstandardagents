# Agent Schema Comparison: GitLab Duo Agent vs General Agent

## Overview

This document compares the GitLab Duo Agent API schema with a generalized agent schema to highlight the differences, similarities, and architectural approaches.

## 1. Core Agent Entity Comparison

### GitLab Duo Agent (CLIAgent)
```yaml
CLIAgent:
  type: object
  properties:
    id: string (uuid)
    project_id: integer
    service_account_id: string
    service_account_username: string
    flow_id: string (uuid)
    status: [active, inactive, error]
    last_invocation: string (date-time, nullable)
    total_invocations: integer (default: 0)
    created_at: string (date-time)
```

### General Agent
```yaml
Agent:
  type: object
  properties:
    id: string (uuid)
    name: string
    description: string
    agent_type: [cli, web, chat, workflow, autonomous]
    status: [active, inactive, paused, error, training]
    capabilities: array of strings
    configuration: object (model, provider, temperature, max_tokens)
    permissions: array of strings
    created_at: string (date-time)
    updated_at: string (date-time)
    last_activity: string (date-time)
    metadata: object
```

## 2. Key Differences

### A. Scope and Purpose
- **GitLab Duo Agent**: Highly specialized for GitLab integration, focused on CLI agents that work within GitLab projects
- **General Agent**: Universal design for various agent types (CLI, web, chat, workflow, autonomous)

### B. Integration Context
- **GitLab Duo Agent**: 
  - Tightly coupled with GitLab projects (`project_id`)
  - Uses GitLab service accounts for authentication
  - Linked to specific AI flows (`flow_id`)
  - Designed for GitLab-specific triggers (issue comments, MR comments, epic comments)

- **General Agent**:
  - Platform-agnostic design
  - Generic permission system
  - Self-contained configuration
  - Supports various trigger types (manual, scheduled, event-based, API calls, webhooks)

### C. Status Management
- **GitLab Duo Agent**: Simple 3-state system (`active`, `inactive`, `error`)
- **General Agent**: More comprehensive 5-state system (`active`, `inactive`, `paused`, `error`, `training`)

### D. Capabilities Model
- **GitLab Duo Agent**: Implicit capabilities through flow types (code_generation, code_review, etc.)
- **General Agent**: Explicit capabilities array with predefined skill types

## 3. Execution Model Comparison

### GitLab Duo Agent Execution
```yaml
InvokeCLIAgentRequest:
  required:
    - task_description
    - trigger_context
  properties:
    task_description: string
    trigger_context:
      trigger_type: [issue_comment, merge_request_comment, epic_comment]
      issue_iid: integer
      merge_request_iid: integer
      epic_id: integer
      comment_id: integer
      mentioned_by_user: string

AgentInvocationResult:
  properties:
    invocation_id: string (uuid)
    status: [accepted, running, completed, failed]
    pipeline_id: integer (nullable)
    response_comment_id: integer (nullable)
    error_message: string (nullable)
```

### General Agent Execution
```yaml
AgentExecution:
  properties:
    execution_id: string (uuid)
    agent_id: string (uuid)
    task:
      description: string
      input_data: object
      context: object
    status: [pending, running, completed, failed, cancelled]
    result:
      output: string
      artifacts: array
      metrics: object
    logs: array of log objects
    started_at: string (date-time)
    completed_at: string (date-time)
    duration_ms: integer
```

### Key Execution Differences
- **GitLab Duo**: Focused on GitLab-specific responses (pipeline creation, comment responses)
- **General Agent**: Generic execution with comprehensive logging and metrics
- **GitLab Duo**: Simpler status tracking
- **General Agent**: More detailed execution tracking with duration and metrics

## 4. Flow vs Agent Architecture

### GitLab Duo: Flow-Centric Architecture
```yaml
AIFlow:
  properties:
    id: string (uuid)
    project_id: integer
    name: string
    description: string
    config_path: string
    flow_type: [code_generation, code_review, issue_analysis, merge_request_analysis, documentation_generation, testing_assistance, custom]
    ai_provider: [anthropic_claude, openai_codex, gitlab_managed]
    configuration: object (model, temperature, max_tokens, use_gitlab_managed_credentials)
    environment_variables: array
    status: [active, inactive, error]
    created_at: string (date-time)
    updated_at: string (date-time)
```

### General Agent: Agent-Centric Architecture
```yaml
Agent:
  # Direct agent capabilities and configuration
  # No separate flow concept - agents contain their own capabilities
```

### Architectural Difference
- **GitLab Duo**: Separates AI capabilities (flows) from execution agents (CLI agents)
- **General Agent**: Combines capabilities and execution in a single agent entity

## 5. Trigger System Comparison

### GitLab Duo Triggers
```yaml
FlowTrigger:
  properties:
    id: string (uuid)
    project_id: integer
    name: string
    service_account_id: string
    config_path: string
    event_types: [issue_comment_created, merge_request_comment_created, epic_comment_created]
    status: [active, inactive]
    created_at: string (date-time)
```

### General Agent Triggers
```yaml
AgentTrigger:
  properties:
    id: string (uuid)
    agent_id: string (uuid)
    name: string
    trigger_type: [manual, scheduled, event_based, api_call, webhook]
    event_config:
      events: array
      conditions: object
    schedule:
      cron_expression: string
      timezone: string
    status: [active, inactive]
    created_at: string (date-time)
    last_triggered: string (date-time, nullable)
```

### Trigger Differences
- **GitLab Duo**: Limited to GitLab-specific events, project-scoped
- **General Agent**: Universal trigger types with scheduling support
- **GitLab Duo**: Simple event configuration
- **General Agent**: Complex event conditions and scheduling

## 6. Advanced Features

### General Agent Exclusive Features
1. **Agent Skills**: Modular capability system with input/output schemas
2. **Agent Memory**: Memory management with different memory types and embeddings
3. **Comprehensive Logging**: Structured logging with multiple levels
4. **Metrics and Performance**: Execution duration and performance tracking
5. **Metadata System**: Flexible metadata for extensibility

### GitLab Duo Exclusive Features
1. **GitLab Integration**: Deep integration with GitLab projects and service accounts
2. **AI Gateway**: Managed AI provider credentials through GitLab
3. **Environment Variables**: Project-specific environment variable management
4. **Pipeline Integration**: Direct CI/CD pipeline creation and management

## 7. Summary

### GitLab Duo Agent Schema Strengths
- **Specialized**: Optimized for GitLab ecosystem integration
- **Practical**: Focused on real-world GitLab automation scenarios
- **Integrated**: Seamless connection with GitLab authentication and authorization
- **Production-Ready**: Designed for actual deployment in GitLab environments

### General Agent Schema Strengths
- **Universal**: Platform-agnostic design suitable for various environments
- **Extensible**: Modular architecture with skills and memory systems
- **Comprehensive**: Rich feature set for advanced agent capabilities
- **Flexible**: Supports multiple agent types and execution patterns

### Architectural Philosophies
- **GitLab Duo**: "Integration-first" - designed to work seamlessly within GitLab
- **General Agent**: "Capability-first" - designed to maximize agent functionality

### Use Case Recommendations
- **Use GitLab Duo Agent** when: Building GitLab-specific automation and AI assistants
- **Use General Agent** when: Building universal agents that work across platforms or need advanced capabilities like memory, skills, and complex scheduling
