# OpenAI Swarm Extension for OSSA v0.3.4

## Overview

The `extensions.openai_swarm` schema provides bidirectional mapping between OpenAI's experimental Swarm multi-agent framework and OSSA v0.3.4. This extension enables OSSA agents to operate within Swarm's handoff-based orchestration model while maintaining full OSSA compliance.

**OpenAI Swarm Repository**: https://github.com/openai/swarm

## Key Concepts Mapping

| OpenAI Swarm Concept | OSSA v0.3.4 Equivalent | Description |
|---------------------|------------------------|-------------|
| `Agent` | `kind: Agent` | Autonomous unit with LLM, instructions, and functions |
| `handoff` | `spec.delegation` + `DelegationConfig` | Transfer control to another agent |
| `context_variables` | `spec.state` + `runtime.state` | Shared mutable state across agents |
| `functions` | `spec.capabilities` | Callable tools/actions |
| `instructions` | `spec.systemPrompt` | Agent behavior definition |
| `run()` | Runtime lifecycle | Execute agent loop |
| Agent switching | Workflow transitions | Dynamic agent selection |
| Tool results | Output handling | Function return values |

## Schema Definition

```yaml
extensions:
  openai_swarm:
    type: object
    description: "OpenAI Swarm multi-agent framework integration"
    properties:
      enabled:
        type: boolean
        default: false
        description: "Enable Swarm compatibility mode"

      agents:
        type: array
        description: "Swarm agent definitions (for multi-agent manifests)"
        items:
          $ref: "#/definitions/SwarmAgentConfig"

      handoff_config:
        $ref: "#/definitions/SwarmHandoffConfig"
        description: "Handoff behavior configuration"

      context_variables:
        $ref: "#/definitions/SwarmContextVariables"
        description: "Shared context variable definitions"

      run_config:
        $ref: "#/definitions/SwarmRunConfig"
        description: "Run loop configuration"
```

## Detailed Mappings

### 1. Agent to OSSA Agent Kind

**OpenAI Swarm Agent:**
```python
from swarm import Agent

agent = Agent(
    name="Sales Agent",
    instructions="You are a helpful sales agent.",
    functions=[get_product_info, process_order],
    model="gpt-4"
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: sales-agent
  version: 1.0.0
  labels:
    framework: openai-swarm
    swarm.role: sales

spec:
  description: "You are a helpful sales agent."
  systemPrompt: "You are a helpful sales agent."

  model:
    provider: openai
    name: gpt-4

  capabilities:
    - name: get_product_info
      type: function
      description: "Retrieve product information"
      inputSchema:
        type: object
        properties:
          product_id:
            type: string
        required: [product_id]

    - name: process_order
      type: function
      description: "Process a customer order"
      inputSchema:
        type: object
        properties:
          order_details:
            type: object

extensions:
  openai_swarm:
    enabled: true
    agents:
      - name: sales-agent
        is_primary: true
```

### 2. Handoff to OSSA Delegation

**OpenAI Swarm Handoff:**
```python
def transfer_to_support():
    """Transfer to support agent when customer needs help"""
    return support_agent

sales_agent = Agent(
    name="Sales",
    functions=[transfer_to_support]
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: sales-agent
  version: 1.0.0

spec:
  delegation:
    enabled: true
    allowed_tiers:
      - tier_1_read
      - tier_2_write_limited
    allowed_operations:
      - support_transfer
      - escalation

  capabilities:
    - name: transfer_to_support
      type: delegation
      description: "Transfer to support agent when customer needs help"
      delegateTo:
        agentRef: support-agent
        namespace: default
      inputSchema:
        type: object
        properties:
          reason:
            type: string
          context:
            type: object

extensions:
  openai_swarm:
    enabled: true
    handoff_config:
      strategy: function_return
      preserve_context: true
      handoffs:
        - function: transfer_to_support
          target_agent: support-agent
          conditions:
            - type: explicit_request
            - type: capability_mismatch
```

### 3. Context Variables to OSSA State

**OpenAI Swarm Context Variables:**
```python
from swarm import Swarm

client = Swarm()
response = client.run(
    agent=agent,
    messages=[{"role": "user", "content": "Hello"}],
    context_variables={
        "user_id": "12345",
        "session_id": "abc-xyz",
        "preferences": {"language": "en"}
    }
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: context-aware-agent

spec:
  state:
    schema:
      type: object
      properties:
        user_id:
          type: string
        session_id:
          type: string
        preferences:
          type: object
          properties:
            language:
              type: string
              enum: [en, es, fr, de]

    persistence:
      enabled: true
      store: redis
      ttl_seconds: 3600

    initial:
      preferences:
        language: en

extensions:
  openai_swarm:
    enabled: true
    context_variables:
      mapping:
        user_id: state.user_id
        session_id: state.session_id
        preferences: state.preferences

      propagation: all_agents
      mutability: read_write

      lifecycle:
        inherit_on_handoff: true
        merge_strategy: deep_merge
```

### 4. Functions to OSSA Capabilities

**OpenAI Swarm Functions:**
```python
def get_weather(location: str, unit: str = "celsius") -> str:
    """Get the current weather for a location"""
    # Implementation
    return f"Weather in {location}: 22{unit}"

agent = Agent(
    name="Weather Agent",
    functions=[get_weather]
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: weather-agent

spec:
  capabilities:
    - name: get_weather
      type: function
      description: "Get the current weather for a location"
      inputSchema:
        type: object
        properties:
          location:
            type: string
            description: "City or location name"
          unit:
            type: string
            enum: [celsius, fahrenheit]
            default: celsius
        required: [location]
      outputSchema:
        type: object
        properties:
          temperature:
            type: number
          unit:
            type: string
          description:
            type: string

runtime:
  bindings:
    get_weather:
      handler: "WeatherService::getCurrentWeather"
      mcp_server: weather-mcp

extensions:
  openai_swarm:
    enabled: true
```

### 5. Instructions to OSSA System Prompt

**OpenAI Swarm Instructions:**
```python
# Static instructions
agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant. Be concise."
)

# Dynamic instructions
def dynamic_instructions(context_variables):
    user_name = context_variables.get("user_name", "User")
    return f"Greet the user as {user_name}. Be helpful."

agent = Agent(
    name="Personalized Assistant",
    instructions=dynamic_instructions
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
# Static instructions
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: assistant

spec:
  systemPrompt: "You are a helpful assistant. Be concise."

---
# Dynamic instructions with template
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: personalized-assistant

spec:
  systemPrompt: |
    Greet the user as {{state.user_name | default: "User"}}.
    Be helpful and professional.

  systemPromptTemplate:
    engine: liquid
    variables:
      - name: user_name
        source: state.user_name
        default: "User"

extensions:
  openai_swarm:
    enabled: true
    run_config:
      dynamic_instructions: true
      instruction_source: system_prompt_template
```

### 6. Run Loop to OSSA Runtime Lifecycle

**OpenAI Swarm Run Loop:**
```python
from swarm import Swarm

client = Swarm()
response = client.run(
    agent=agent,
    messages=[{"role": "user", "content": "Hello"}],
    context_variables={"key": "value"},
    max_turns=10,
    model_override="gpt-4-turbo",
    execute_tools=True,
    stream=False
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: run-loop-agent

spec:
  model:
    provider: openai
    name: gpt-4-turbo

  behavior:
    maxIterations: 10
    maxToolCalls: 50
    terminationConditions:
      - type: max_turns
        value: 10
      - type: explicit_stop
      - type: no_tool_calls

runtime:
  scheduling:
    timeout_seconds: 300
    max_concurrent: 1

  transport: sync

extensions:
  openai_swarm:
    enabled: true
    run_config:
      max_turns: 10
      execute_tools: true
      stream: false

      lifecycle:
        on_start: log_execution_start
        on_turn: update_metrics
        on_complete: log_execution_complete
        on_error: handle_swarm_error

      tool_execution:
        parallel: false
        timeout_per_tool: 30
        retry_on_failure: true
        max_retries: 3
```

### 7. Agent Switching to OSSA Workflow Transitions

**OpenAI Swarm Agent Switching:**
```python
def route_to_agent(context_variables):
    intent = context_variables.get("intent")
    if intent == "sales":
        return sales_agent
    elif intent == "support":
        return support_agent
    return default_agent

router = Agent(
    name="Router",
    functions=[route_to_agent]
)
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: agent-router
  version: 1.0.0

spec:
  trigger:
    type: message
    schema:
      type: object
      properties:
        content:
          type: string

  steps:
    - id: classify_intent
      type: agent
      agent:
        ref: intent-classifier
      outputs:
        intent: $.classification.intent

    - id: route_decision
      type: switch
      input:
        intent: $steps.classify_intent.outputs.intent
      cases:
        - when: "intent == 'sales'"
          then: sales_handler
        - when: "intent == 'support'"
          then: support_handler
        - default: default_handler

    - id: sales_handler
      type: agent
      agent:
        ref: sales-agent
      when: $steps.route_decision.case == 'sales_handler'

    - id: support_handler
      type: agent
      agent:
        ref: support-agent
      when: $steps.route_decision.case == 'support_handler'

    - id: default_handler
      type: agent
      agent:
        ref: default-agent
      when: $steps.route_decision.case == 'default_handler'

extensions:
  openai_swarm:
    enabled: true
    agents:
      - name: router
        is_router: true
        routing_function: route_to_agent
```

### 8. Tool Results to OSSA Output Handling

**OpenAI Swarm Tool Results:**
```python
from swarm import Result

def complex_function(args):
    # Perform operation
    return Result(
        value="Operation completed",
        agent=next_agent,  # Optional handoff
        context_variables={"updated": True}
    )
```

**OSSA v0.3.4 Equivalent:**
```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: result-handler-agent

spec:
  capabilities:
    - name: complex_function
      type: function
      description: "Perform complex operation with optional handoff"

      inputSchema:
        type: object
        properties:
          args:
            type: object

      outputSchema:
        type: object
        properties:
          value:
            type: string
          handoff:
            type: object
            properties:
              agent:
                type: string
              context_updates:
                type: object

      behavior:
        can_handoff: true
        updates_context: true

extensions:
  openai_swarm:
    enabled: true
    run_config:
      result_handling:
        parse_agent_handoff: true
        apply_context_updates: true

        output_mapping:
          value: $.result.value
          agent: $.result.agent
          context_variables: $.result.context_updates
```

## Complete Bidirectional Mapping Tables

### Agent Properties Mapping

| Swarm Property | OSSA Path | Direction | Notes |
|----------------|-----------|-----------|-------|
| `name` | `metadata.name` | Bi | Agent identifier |
| `model` | `spec.model.name` | Bi | LLM model name |
| `instructions` | `spec.systemPrompt` | Bi | Static or template |
| `functions` | `spec.capabilities[type=function]` | Bi | Callable functions |
| `tool_choice` | `spec.behavior.toolChoice` | Bi | Tool selection strategy |
| `parallel_tool_calls` | `runtime.tool_execution.parallel` | Bi | Parallel execution |

### Context Variables Mapping

| Swarm Pattern | OSSA Path | Direction | Notes |
|---------------|-----------|-----------|-------|
| `context_variables` | `spec.state.schema` | Bi | State definition |
| Initial values | `spec.state.initial` | Bi | Default values |
| Runtime updates | `runtime.state` | Swarm->OSSA | Mutable state |
| Persistence | `spec.state.persistence` | OSSA only | State storage |

### Run Configuration Mapping

| Swarm Parameter | OSSA Path | Direction | Notes |
|-----------------|-----------|-----------|-------|
| `max_turns` | `spec.behavior.maxIterations` | Bi | Loop limit |
| `model_override` | `spec.model.name` | Bi | Model selection |
| `execute_tools` | `runtime.tool_execution.enabled` | Bi | Tool execution toggle |
| `stream` | `runtime.transport` | Bi | sync/stream |
| `debug` | `runtime.logging.level` | Bi | Debug mode |

### Handoff Mapping

| Swarm Pattern | OSSA Path | Direction | Notes |
|---------------|-----------|-----------|-------|
| `return agent` | `capability.delegateTo` | Bi | Agent handoff |
| `Result(agent=...)` | `capability.behavior.can_handoff` | Bi | Explicit handoff |
| Context preservation | `handoff_config.preserve_context` | Bi | State transfer |
| Handoff functions | `capability[type=delegation]` | Bi | Delegation capability |

## Example Manifests

### Multi-Agent Swarm System

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: customer-service-swarm
  version: 1.0.0
  labels:
    framework: openai-swarm
  annotations:
    ossa.io/swarm-compatible: "true"

spec:
  description: "Multi-agent customer service system with dynamic routing"

  trigger:
    type: message
    schema:
      type: object
      properties:
        content:
          type: string
        user_id:
          type: string

  steps:
    - id: triage
      type: agent
      agent:
        ref: triage-agent
      outputs:
        intent: $.classification
        sentiment: $.sentiment

    - id: route
      type: switch
      input:
        intent: $steps.triage.outputs.intent
      cases:
        - when: "intent == 'billing'"
          then: billing_flow
        - when: "intent == 'technical'"
          then: technical_flow
        - when: "intent == 'sales'"
          then: sales_flow
        - default: general_flow

    - id: billing_flow
      type: agent
      agent:
        ref: billing-agent
      when: $steps.route.case == 'billing_flow'

    - id: technical_flow
      type: agent
      agent:
        ref: technical-agent
      when: $steps.route.case == 'technical_flow'

    - id: sales_flow
      type: agent
      agent:
        ref: sales-agent
      when: $steps.route.case == 'sales_flow'

    - id: general_flow
      type: agent
      agent:
        ref: general-agent
      when: $steps.route.case == 'general_flow'

extensions:
  openai_swarm:
    enabled: true
    agents:
      - name: triage-agent
        is_router: true
      - name: billing-agent
      - name: technical-agent
      - name: sales-agent
      - name: general-agent

    context_variables:
      mapping:
        user_id: state.user_id
        session_id: state.session_id
        conversation_history: state.messages
      propagation: all_agents

    handoff_config:
      strategy: workflow_transition
      preserve_context: true
      allow_cycles: false
      max_handoffs: 5

    run_config:
      max_turns: 20
      execute_tools: true
      stream: true

      lifecycle:
        on_handoff: log_agent_transition
        on_complete: save_conversation
```

### Single Agent with Swarm Functions

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: order-management-agent
  version: 1.0.0
  labels:
    framework: openai-swarm
    domain: ecommerce

spec:
  description: "Order management agent with handoff capabilities"

  systemPrompt: |
    You are an order management assistant. Help customers with:
    - Checking order status
    - Processing returns
    - Updating shipping information

    If the customer needs billing help, transfer to the billing agent.
    If the customer needs technical support, transfer to tech support.

  model:
    provider: openai
    name: gpt-4-turbo

  capabilities:
    - name: get_order_status
      type: function
      description: "Get the status of a customer order"
      inputSchema:
        type: object
        properties:
          order_id:
            type: string
        required: [order_id]
      outputSchema:
        type: object
        properties:
          status:
            type: string
            enum: [pending, processing, shipped, delivered, cancelled]
          tracking_number:
            type: string
          estimated_delivery:
            type: string
            format: date

    - name: process_return
      type: function
      description: "Initiate a return request"
      inputSchema:
        type: object
        properties:
          order_id:
            type: string
          reason:
            type: string
          items:
            type: array
            items:
              type: object
              properties:
                product_id:
                  type: string
                quantity:
                  type: integer
        required: [order_id, reason, items]

    - name: transfer_to_billing
      type: delegation
      description: "Transfer to billing agent for payment issues"
      delegateTo:
        agentRef: billing-agent
        namespace: customer-service
      inputSchema:
        type: object
        properties:
          reason:
            type: string
          context:
            type: object

    - name: transfer_to_tech_support
      type: delegation
      description: "Transfer to technical support for product issues"
      delegateTo:
        agentRef: tech-support-agent
        namespace: customer-service

  delegation:
    enabled: true
    allowed_tiers:
      - tier_2_write_limited
    allowed_operations:
      - billing_transfer
      - support_transfer
    requires:
      - delegation_token
      - audit_trail

  state:
    schema:
      type: object
      properties:
        customer_id:
          type: string
        session_id:
          type: string
        order_history:
          type: array
          items:
            type: object
        preferences:
          type: object
    persistence:
      enabled: true
      store: redis
      ttl_seconds: 3600

  behavior:
    maxIterations: 15
    maxToolCalls: 30

runtime:
  scheduling:
    timeout_seconds: 300

  bindings:
    get_order_status:
      handler: "OrderService::getStatus"
    process_return:
      handler: "ReturnService::initiateReturn"

extensions:
  openai_swarm:
    enabled: true

    agents:
      - name: order-management-agent
        is_primary: true

    context_variables:
      mapping:
        customer_id: state.customer_id
        session_id: state.session_id
        order_history: state.order_history

      propagation: handoff_only
      mutability: read_write

      lifecycle:
        inherit_on_handoff: true
        merge_strategy: shallow_merge

    handoff_config:
      strategy: function_return
      preserve_context: true

      handoffs:
        - function: transfer_to_billing
          target_agent: billing-agent
          conditions:
            - type: explicit_request
            - type: billing_keyword_detected

        - function: transfer_to_tech_support
          target_agent: tech-support-agent
          conditions:
            - type: explicit_request
            - type: technical_issue_detected

    run_config:
      max_turns: 15
      execute_tools: true
      stream: true

      lifecycle:
        on_start: initialize_session
        on_turn: log_interaction
        on_handoff: prepare_handoff_context
        on_complete: save_conversation
        on_error: handle_error_gracefully

      tool_execution:
        parallel: true
        timeout_per_tool: 30
        retry_on_failure: true
        max_retries: 2

      result_handling:
        parse_agent_handoff: true
        apply_context_updates: true
```

## Zod Validation Schema

```typescript
import { z } from 'zod';

// Swarm Agent Configuration
export const SwarmAgentConfigSchema = z.object({
  name: z.string().min(1).max(128),
  is_primary: z.boolean().optional().default(false),
  is_router: z.boolean().optional().default(false),
  routing_function: z.string().optional(),
  model_override: z.string().optional(),
  tool_choice: z.enum(['auto', 'none', 'required']).optional(),
  parallel_tool_calls: z.boolean().optional().default(true),
});

// Handoff Configuration
export const SwarmHandoffConfigSchema = z.object({
  strategy: z.enum(['function_return', 'workflow_transition', 'explicit']).default('function_return'),
  preserve_context: z.boolean().default(true),
  allow_cycles: z.boolean().default(false),
  max_handoffs: z.number().int().min(1).max(100).default(10),
  handoffs: z.array(z.object({
    function: z.string(),
    target_agent: z.string(),
    conditions: z.array(z.object({
      type: z.enum(['explicit_request', 'capability_mismatch', 'billing_keyword_detected', 'technical_issue_detected', 'custom']),
      expression: z.string().optional(),
    })).optional(),
  })).optional(),
});

// Context Variables Configuration
export const SwarmContextVariablesSchema = z.object({
  mapping: z.record(z.string(), z.string()).optional(),
  propagation: z.enum(['all_agents', 'handoff_only', 'none']).default('all_agents'),
  mutability: z.enum(['read_only', 'read_write']).default('read_write'),
  lifecycle: z.object({
    inherit_on_handoff: z.boolean().default(true),
    merge_strategy: z.enum(['shallow_merge', 'deep_merge', 'replace']).default('deep_merge'),
    clear_on_complete: z.boolean().default(false),
  }).optional(),
});

// Run Configuration
export const SwarmRunConfigSchema = z.object({
  max_turns: z.number().int().min(1).max(1000).default(10),
  execute_tools: z.boolean().default(true),
  stream: z.boolean().default(false),
  debug: z.boolean().default(false),
  dynamic_instructions: z.boolean().default(false),
  instruction_source: z.enum(['system_prompt', 'system_prompt_template', 'external']).optional(),

  lifecycle: z.object({
    on_start: z.string().optional(),
    on_turn: z.string().optional(),
    on_handoff: z.string().optional(),
    on_complete: z.string().optional(),
    on_error: z.string().optional(),
  }).optional(),

  tool_execution: z.object({
    parallel: z.boolean().default(false),
    timeout_per_tool: z.number().int().min(1).max(3600).default(30),
    retry_on_failure: z.boolean().default(true),
    max_retries: z.number().int().min(0).max(10).default(3),
  }).optional(),

  result_handling: z.object({
    parse_agent_handoff: z.boolean().default(true),
    apply_context_updates: z.boolean().default(true),
    output_mapping: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

// Complete OpenAI Swarm Extension Schema
export const OpenAISwarmExtensionSchema = z.object({
  enabled: z.boolean().default(false),
  agents: z.array(SwarmAgentConfigSchema).optional(),
  handoff_config: SwarmHandoffConfigSchema.optional(),
  context_variables: SwarmContextVariablesSchema.optional(),
  run_config: SwarmRunConfigSchema.optional(),
});

// Type exports
export type SwarmAgentConfig = z.infer<typeof SwarmAgentConfigSchema>;
export type SwarmHandoffConfig = z.infer<typeof SwarmHandoffConfigSchema>;
export type SwarmContextVariables = z.infer<typeof SwarmContextVariablesSchema>;
export type SwarmRunConfig = z.infer<typeof SwarmRunConfigSchema>;
export type OpenAISwarmExtension = z.infer<typeof OpenAISwarmExtensionSchema>;
```

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: OSSA OpenAI Swarm Extension API
  version: 0.3.4
  description: OpenAI Swarm integration for OSSA agents

paths:
  /agents/{agentId}/swarm/run:
    post:
      summary: Execute agent in Swarm-compatible mode
      operationId: runSwarmAgent
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SwarmRunRequest'
      responses:
        '200':
          description: Successful execution
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SwarmRunResponse'
        '400':
          description: Invalid request
        '404':
          description: Agent not found

  /agents/{agentId}/swarm/handoff:
    post:
      summary: Perform agent handoff
      operationId: handoffSwarmAgent
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SwarmHandoffRequest'
      responses:
        '200':
          description: Handoff successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SwarmHandoffResponse'

  /swarm/context:
    get:
      summary: Get current context variables
      operationId: getSwarmContext
      parameters:
        - name: session_id
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Context variables
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SwarmContextVariables'

    put:
      summary: Update context variables
      operationId: updateSwarmContext
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SwarmContextVariablesUpdate'
      responses:
        '200':
          description: Context updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SwarmContextVariables'

components:
  schemas:
    SwarmRunRequest:
      type: object
      required:
        - messages
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        context_variables:
          type: object
          additionalProperties: true
        max_turns:
          type: integer
          minimum: 1
          default: 10
        model_override:
          type: string
        execute_tools:
          type: boolean
          default: true
        stream:
          type: boolean
          default: false

    SwarmRunResponse:
      type: object
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        agent:
          type: string
          description: Final agent name after any handoffs
        context_variables:
          type: object
          additionalProperties: true

    SwarmHandoffRequest:
      type: object
      required:
        - target_agent
      properties:
        target_agent:
          type: string
        context_variables:
          type: object
          additionalProperties: true
        reason:
          type: string
        preserve_history:
          type: boolean
          default: true

    SwarmHandoffResponse:
      type: object
      properties:
        success:
          type: boolean
        new_agent:
          type: string
        context_variables:
          type: object
          additionalProperties: true

    SwarmContextVariables:
      type: object
      additionalProperties: true

    SwarmContextVariablesUpdate:
      type: object
      required:
        - session_id
        - updates
      properties:
        session_id:
          type: string
        updates:
          type: object
          additionalProperties: true
        merge_strategy:
          type: string
          enum: [shallow_merge, deep_merge, replace]
          default: deep_merge

    Message:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum: [user, assistant, system, tool]
        content:
          type: string
        name:
          type: string
        tool_calls:
          type: array
          items:
            $ref: '#/components/schemas/ToolCall'
        tool_call_id:
          type: string

    ToolCall:
      type: object
      required:
        - id
        - type
        - function
      properties:
        id:
          type: string
        type:
          type: string
          enum: [function]
        function:
          type: object
          required:
            - name
            - arguments
          properties:
            name:
              type: string
            arguments:
              type: string
```

## Adapter Implementation Pattern

```typescript
// swarm-adapter.ts
import { Swarm, Agent as SwarmAgent } from 'openai-swarm';
import { OSSAAgent, OSSAWorkflow } from '@ossa/core';

export class SwarmOSSAAdapter {
  private swarmClient: Swarm;

  constructor() {
    this.swarmClient = new Swarm();
  }

  /**
   * Convert OSSA Agent to Swarm Agent
   */
  toSwarmAgent(ossaAgent: OSSAAgent): SwarmAgent {
    const functions = ossaAgent.spec.capabilities
      .filter(cap => cap.type === 'function' || cap.type === 'delegation')
      .map(cap => this.capabilityToFunction(cap, ossaAgent));

    return new SwarmAgent({
      name: ossaAgent.metadata.name,
      model: ossaAgent.spec.model?.name || 'gpt-4',
      instructions: ossaAgent.spec.systemPrompt,
      functions,
      tool_choice: ossaAgent.spec.behavior?.toolChoice,
      parallel_tool_calls: ossaAgent.extensions?.openai_swarm?.run_config?.tool_execution?.parallel,
    });
  }

  /**
   * Convert Swarm Agent to OSSA Agent
   */
  fromSwarmAgent(swarmAgent: SwarmAgent): OSSAAgent {
    return {
      apiVersion: 'ossa/v0.3.4',
      kind: 'Agent',
      metadata: {
        name: swarmAgent.name,
        version: '1.0.0',
        labels: {
          framework: 'openai-swarm',
        },
      },
      spec: {
        description: swarmAgent.instructions,
        systemPrompt: typeof swarmAgent.instructions === 'string'
          ? swarmAgent.instructions
          : 'Dynamic instructions',
        model: {
          provider: 'openai',
          name: swarmAgent.model || 'gpt-4',
        },
        capabilities: swarmAgent.functions.map(fn => this.functionToCapability(fn)),
      },
      extensions: {
        openai_swarm: {
          enabled: true,
        },
      },
    };
  }

  /**
   * Execute OSSA agent using Swarm runtime
   */
  async run(
    ossaAgent: OSSAAgent,
    messages: any[],
    contextVariables: Record<string, any> = {},
    options: { maxTurns?: number; stream?: boolean } = {}
  ) {
    const swarmAgent = this.toSwarmAgent(ossaAgent);
    const swarmConfig = ossaAgent.extensions?.openai_swarm?.run_config;

    return this.swarmClient.run({
      agent: swarmAgent,
      messages,
      context_variables: this.mapContextVariables(ossaAgent, contextVariables),
      max_turns: options.maxTurns || swarmConfig?.max_turns || 10,
      stream: options.stream || swarmConfig?.stream || false,
    });
  }

  private capabilityToFunction(capability: any, agent: OSSAAgent): any {
    if (capability.type === 'delegation') {
      // Create handoff function
      return {
        name: capability.name,
        description: capability.description,
        parameters: capability.inputSchema,
        handler: async (args: any) => {
          // Return the target agent for handoff
          const targetRef = capability.delegateTo?.agentRef;
          return { agent: targetRef, context_variables: args };
        },
      };
    }

    return {
      name: capability.name,
      description: capability.description,
      parameters: capability.inputSchema,
    };
  }

  private functionToCapability(fn: any): any {
    return {
      name: fn.name,
      type: 'function',
      description: fn.description || '',
      inputSchema: fn.parameters || { type: 'object', properties: {} },
    };
  }

  private mapContextVariables(
    agent: OSSAAgent,
    input: Record<string, any>
  ): Record<string, any> {
    const mapping = agent.extensions?.openai_swarm?.context_variables?.mapping;
    if (!mapping) return input;

    const result: Record<string, any> = {};
    for (const [swarmKey, ossaPath] of Object.entries(mapping)) {
      if (input[swarmKey] !== undefined) {
        result[swarmKey] = input[swarmKey];
      }
    }
    return result;
  }
}
```

## Migration Guide

### From Pure Swarm to OSSA

1. **Extract agent definitions** from Python code
2. **Map functions** to OSSA capabilities
3. **Define context schema** in `spec.state`
4. **Configure handoffs** using delegation capabilities
5. **Add Swarm extension** for compatibility

### From OSSA to Swarm

1. **Generate Swarm agents** using the adapter
2. **Map capabilities** to Swarm functions
3. **Extract context variables** from state schema
4. **Configure handoff functions** from delegation capabilities

## Related Resources

- [OpenAI Swarm Repository](https://github.com/openai/swarm)
- [OSSA v0.3.4 Specification](../UNIFIED-SCHEMA.md)
- [Delegation Configuration](../access_tiers.yaml)
- [Workflow Specification](../schemas/workflow.schema.json)
