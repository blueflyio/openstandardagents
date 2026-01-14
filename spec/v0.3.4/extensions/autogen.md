# Microsoft AutoGen Extension for OSSA v0.3.3

## Overview

The `extensions.autogen` schema provides comprehensive bidirectional mapping between Microsoft AutoGen's multi-agent conversation framework and OSSA v0.3.3 manifests. This extension enables seamless interoperability between AutoGen agent patterns and OSSA's standardized agent specifications.

AutoGen is Microsoft's open-source framework for building AI agents that can converse with each other to solve tasks. It supports conversable agents, group chats, code execution, function calling, and nested agent architectures.

## Schema Definition

```yaml
extensions:
  autogen:
    type: object
    description: "Microsoft AutoGen multi-agent framework extension for OSSA v0.3.3"
    properties:
      agent_type:
        type: string
        enum:
          - conversable_agent
          - assistant_agent
          - user_proxy_agent
          - group_chat_manager
          - teachable_agent
          - reasoning_agent
          - captain_agent
          - custom_agent
        description: "AutoGen agent class type - determines base behavior and capabilities"
        examples:
          - "assistant_agent"
          - "user_proxy_agent"
          - "group_chat_manager"

      llm_config:
        type: object
        description: "LLM configuration for the agent (mirrors AutoGen's llm_config)"
        properties:
          config_list:
            type: array
            description: "List of LLM configurations (model, api_key reference, base_url)"
            items:
              type: object
              properties:
                model:
                  type: string
                  description: "Model identifier (e.g., gpt-4, claude-3-opus)"
                  examples:
                    - "gpt-4-turbo"
                    - "gpt-4o"
                    - "claude-3-opus"
                api_key_env:
                  type: string
                  description: "Environment variable containing API key (never store keys directly)"
                  pattern: "^[A-Z][A-Z0-9_]*$"
                  examples:
                    - "OPENAI_API_KEY"
                    - "AZURE_OPENAI_API_KEY"
                base_url:
                  type: string
                  format: uri
                  description: "Custom API endpoint (for Azure, local models, etc.)"
                api_type:
                  type: string
                  enum: [openai, azure, anthropic, ollama, litellm]
                  description: "API provider type"
                api_version:
                  type: string
                  description: "API version (required for Azure)"
          temperature:
            type: number
            minimum: 0
            maximum: 2
            default: 0.7
            description: "Sampling temperature"
          timeout:
            type: integer
            minimum: 1
            default: 600
            description: "Request timeout in seconds"
          cache_seed:
            oneOf:
              - type: integer
              - type: "null"
            description: "Seed for response caching (null disables caching)"

      human_input_mode:
        type: string
        enum:
          - ALWAYS
          - NEVER
          - TERMINATE
        default: NEVER
        description: "When to request human input during conversation"

      code_execution_config:
        oneOf:
          - type: object
            description: "Code execution sandbox configuration"
            properties:
              work_dir:
                type: string
                description: "Working directory for code execution"
                default: "workspace"
              use_docker:
                oneOf:
                  - type: boolean
                  - type: string
                description: "Docker image for sandboxed execution (true, false, or image name)"
                default: false
              timeout:
                type: integer
                minimum: 1
                default: 60
                description: "Code execution timeout in seconds"
              last_n_messages:
                type: integer
                minimum: 1
                description: "Number of messages to scan for code blocks"
                default: 1
              executor_type:
                type: string
                enum:
                  - local_command_line
                  - docker_command_line
                  - jupyter
                  - azure_container_instance
                default: local_command_line
                description: "Type of code executor to use"
              allowed_languages:
                type: array
                items:
                  type: string
                  enum:
                    - python
                    - bash
                    - shell
                    - javascript
                    - powershell
                description: "Languages allowed for code execution"
                default: ["python", "bash"]
          - type: boolean
            const: false
            description: "Disable code execution"

      max_consecutive_auto_reply:
        type: integer
        minimum: 0
        description: "Maximum auto-replies before requiring human input"
        default: 10

      termination_config:
        type: object
        description: "Conversation termination settings"
        properties:
          is_termination_msg:
            type: string
            description: "Python lambda or function reference to check for termination"
            examples:
              - "lambda msg: 'TERMINATE' in msg.get('content', '')"
          termination_keywords:
            type: array
            items:
              type: string
            description: "Keywords that trigger conversation termination"
            default: ["TERMINATE"]
          max_turns:
            type: integer
            minimum: 1
            description: "Maximum conversation turns before termination"

      group_chat_config:
        type: object
        description: "GroupChat configuration (for multi-agent orchestration)"
        properties:
          agents:
            type: array
            description: "References to agents participating in group chat"
            items:
              type: string
              description: "OSSA agent name reference"
          max_round:
            type: integer
            minimum: 1
            default: 10
            description: "Maximum conversation rounds"
          admin_name:
            type: string
            description: "Name of the admin agent"
            default: "Admin"
          speaker_selection_method:
            type: string
            enum:
              - auto
              - manual
              - random
              - round_robin
              - custom
            default: auto
            description: "Method for selecting next speaker"
          custom_speaker_selection_func:
            type: string
            description: "Reference to custom speaker selection function"
          allow_repeat_speaker:
            oneOf:
              - type: boolean
              - type: array
                items:
                  type: string
            default: true
            description: "Allow same speaker consecutive turns"
          send_introductions:
            type: boolean
            default: false
            description: "Send agent introductions at start"

      function_map:
        type: object
        description: "Mapping of function names to implementations"
        additionalProperties:
          type: string
          description: "Function reference (module.function or class.method)"

      register_for_llm:
        type: array
        description: "Functions registered for LLM to call (tool definitions)"
        items:
          type: object
          properties:
            name:
              type: string
              description: "Function name"
            description:
              type: string
              description: "Function description for LLM"
            parameters:
              $ref: "#/definitions/JSONSchemaDefinition"
              description: "Function parameter schema"

      register_for_execution:
        type: array
        description: "Functions registered for execution by this agent"
        items:
          type: string
          description: "Function name that this agent can execute"

      nested_chat_config:
        type: object
        description: "Configuration for nested agent conversations"
        properties:
          enabled:
            type: boolean
            default: false
            description: "Enable nested chat delegation"
          inner_agents:
            type: array
            description: "Agents that can be delegated to"
            items:
              type: object
              properties:
                agent_ref:
                  type: string
                  description: "Reference to inner OSSA agent"
                trigger:
                  type: string
                  description: "Trigger condition for delegation"
                max_turns:
                  type: integer
                  description: "Max turns for nested conversation"
          message_transformer:
            type: string
            description: "Function to transform messages between outer/inner chats"

      system_message:
        type: string
        description: "System message/prompt for the agent (maps to OSSA spec.instructions)"

      description:
        type: string
        description: "Short description for speaker selection in group chat"

      teachability_config:
        type: object
        description: "Configuration for TeachableAgent learning capabilities"
        properties:
          enabled:
            type: boolean
            default: false
          verbosity:
            type: integer
            minimum: 0
            maximum: 3
            default: 0
          reset_db:
            type: boolean
            default: false
          path_to_db_dir:
            type: string
            description: "Path to teachability database"
          recall_threshold:
            type: number
            minimum: 0
            maximum: 1
            default: 1.5
```

## Bidirectional Mapping Tables

### AutoGen Agent Types to OSSA

| AutoGen Type | OSSA Kind | OSSA Spec Fields | Notes |
|-------------|-----------|------------------|-------|
| `ConversableAgent` | `Agent` | `spec.model`, `spec.instructions` | Base agent with LLM and messaging |
| `AssistantAgent` | `Agent` | `spec.model`, `spec.capabilities` | LLM-powered assistant with tools |
| `UserProxyAgent` | `Agent` | `spec.humanInLoop.enabled: true` | Human-in-the-loop agent |
| `GroupChatManager` | `Workflow` | `spec.orchestration`, `spec.steps` | Multi-agent orchestrator |
| `TeachableAgent` | `Agent` | `spec.memory.type: "vector"` | Agent with learning capability |
| `ReasoningAgent` | `Agent` | `spec.model.reasoning: true` | Agent with chain-of-thought |
| `CaptainAgent` | `Agent` | `spec.delegation.enabled: true` | Agent that spawns sub-agents |

### OSSA to AutoGen Mapping

| OSSA Concept | AutoGen Equivalent | Mapping |
|-------------|-------------------|---------|
| `spec.model.provider` | `llm_config.config_list[].api_type` | Direct mapping |
| `spec.model.name` | `llm_config.config_list[].model` | Direct mapping |
| `spec.instructions` | `system_message` | Full prompt text |
| `spec.capabilities` | `register_for_llm` + `function_map` | Tool definitions |
| `spec.humanInLoop.enabled` | `human_input_mode: ALWAYS` | When true |
| `spec.humanInLoop.triggers` | `is_termination_msg` | Custom termination logic |
| `spec.sandboxConfig` | `code_execution_config` | Execution sandbox |
| `spec.orchestration.pattern` | `speaker_selection_method` | Group chat selection |
| `spec.steps` | `group_chat_config.agents` | Agent sequence |
| `spec.delegation` | `nested_chat_config` | Agent delegation |
| `spec.memory.type: "vector"` | `teachability_config` | Learning memory |

### Capability Mapping

| OSSA Capability | AutoGen Feature | Implementation |
|-----------------|-----------------|----------------|
| `code_execution` | `code_execution_config` | Enable with work_dir |
| `file_access` | `work_dir` + permissions | Sandbox directory |
| `tool_call` | `register_for_llm` | Function registration |
| `human_approval` | `human_input_mode: TERMINATE` | Terminate for approval |
| `agent_delegation` | `nested_chat_config` | Inner agent calls |
| `memory_persistence` | `teachability_config` | Vector DB storage |

### Access Tier Mapping

| OSSA Access Tier | AutoGen Pattern | Recommended Config |
|------------------|-----------------|-------------------|
| `tier_1_read` | `AssistantAgent` | `code_execution_config: false` |
| `tier_2_write_limited` | `AssistantAgent` | `use_docker: true`, limited tools |
| `tier_3_write_elevated` | `UserProxyAgent` | `human_input_mode: TERMINATE` |
| `tier_4_policy` | `GroupChatManager` | Speaker selection control |

## Use Cases

### 1. Basic Assistant Agent

An OSSA agent mapped to AutoGen's AssistantAgent:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0
  description: "Helpful coding assistant"

spec:
  model:
    provider: openai
    name: gpt-4-turbo
  instructions: |
    You are a helpful coding assistant. You help users write, debug,
    and explain code. Always provide clear explanations with your code.
  capabilities:
    - code_generation
    - code_explanation
    - debugging

extensions:
  autogen:
    agent_type: assistant_agent
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
      temperature: 0.7
    human_input_mode: NEVER
    max_consecutive_auto_reply: 10
    system_message: |
      You are a helpful coding assistant. You help users write, debug,
      and explain code. Always provide clear explanations with your code.
```

### 2. User Proxy Agent with Code Execution

An OSSA agent with human-in-the-loop and code execution:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-executor
  version: 1.0.0
  description: "User proxy that executes code in sandbox"

spec:
  model:
    provider: none
  instructions: "Execute code provided by other agents"
  humanInLoop:
    enabled: true
    triggers:
      - "before_execution"
      - "on_error"
  sandboxConfig:
    enabled: true
    type: docker
    image: python:3.11-slim

extensions:
  autogen:
    agent_type: user_proxy_agent
    human_input_mode: TERMINATE
    code_execution_config:
      work_dir: workspace
      use_docker: python:3.11-slim
      timeout: 120
      last_n_messages: 3
      executor_type: docker_command_line
      allowed_languages:
        - python
        - bash
    max_consecutive_auto_reply: 0
    termination_config:
      termination_keywords:
        - TERMINATE
        - TASK_COMPLETE
```

### 3. Group Chat with Manager

An OSSA Workflow implementing AutoGen GroupChat:

```yaml
apiVersion: ossa/v0.3.3
kind: Workflow
metadata:
  name: research-team
  version: 1.0.0
  description: "Multi-agent research team with manager"

spec:
  orchestration:
    pattern: group_chat
    manager: research-manager
  steps:
    - name: researcher
      agentRef: research-agent
    - name: critic
      agentRef: critic-agent
    - name: writer
      agentRef: writer-agent
  output:
    type: aggregated
    format: markdown

extensions:
  autogen:
    agent_type: group_chat_manager
    group_chat_config:
      agents:
        - research-agent
        - critic-agent
        - writer-agent
      max_round: 20
      admin_name: research-manager
      speaker_selection_method: auto
      allow_repeat_speaker: false
      send_introductions: true
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
      temperature: 0.3
    termination_config:
      termination_keywords:
        - RESEARCH_COMPLETE
        - TERMINATE
      max_turns: 50
```

### 4. Agent with Function Calling

An OSSA agent with registered tools/functions:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: data-analyst
  version: 1.0.0
  description: "Data analysis agent with database access"

spec:
  model:
    provider: openai
    name: gpt-4-turbo
  instructions: |
    You are a data analyst. Use the provided tools to query databases
    and analyze data. Always explain your findings.
  capabilities:
    - query_database
    - analyze_data
    - generate_report

extensions:
  autogen:
    agent_type: assistant_agent
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
      temperature: 0.2
    register_for_llm:
      - name: query_database
        description: "Execute SQL query on the analytics database"
        parameters:
          type: object
          properties:
            query:
              type: string
              description: "SQL query to execute"
            database:
              type: string
              enum: [analytics, reporting, warehouse]
              description: "Target database"
          required: [query, database]
      - name: analyze_data
        description: "Perform statistical analysis on a dataset"
        parameters:
          type: object
          properties:
            data_path:
              type: string
              description: "Path to data file"
            analysis_type:
              type: string
              enum: [descriptive, correlation, regression]
          required: [data_path, analysis_type]
    function_map:
      query_database: "data_tools.database.execute_query"
      analyze_data: "data_tools.analysis.run_analysis"
    register_for_execution:
      - query_database
      - analyze_data
```

### 5. Nested Chat / Delegation Pattern

An OSSA agent that delegates to specialized sub-agents:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: project-coordinator
  version: 1.0.0
  description: "Coordinator that delegates to specialized agents"

spec:
  model:
    provider: openai
    name: gpt-4-turbo
  instructions: |
    You coordinate complex projects by delegating tasks to specialized agents.
    Break down requests and route to appropriate specialists.
  delegation:
    enabled: true
    targets:
      - frontend-specialist
      - backend-specialist
      - devops-specialist

extensions:
  autogen:
    agent_type: assistant_agent
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
    nested_chat_config:
      enabled: true
      inner_agents:
        - agent_ref: frontend-specialist
          trigger: "frontend|react|css|ui|ux"
          max_turns: 10
        - agent_ref: backend-specialist
          trigger: "backend|api|database|server"
          max_turns: 10
        - agent_ref: devops-specialist
          trigger: "deploy|ci|cd|docker|kubernetes"
          max_turns: 10
      message_transformer: "delegation.transform_context"
```

### 6. Teachable Agent with Memory

An OSSA agent that learns from interactions:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: learning-assistant
  version: 1.0.0
  description: "Agent that learns and remembers user preferences"

spec:
  model:
    provider: openai
    name: gpt-4-turbo
  instructions: |
    You are a helpful assistant that learns from our conversations.
    Remember user preferences and apply them to future interactions.
  memory:
    type: vector
    provider: chromadb
    config:
      collection: user_preferences
      persist_directory: ./teachable_db

extensions:
  autogen:
    agent_type: teachable_agent
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
    teachability_config:
      enabled: true
      verbosity: 1
      reset_db: false
      path_to_db_dir: "./teachable_db"
      recall_threshold: 1.5
```

### 7. Custom Speaker Selection Group Chat

Advanced group chat with custom routing:

```yaml
apiVersion: ossa/v0.3.3
kind: Workflow
metadata:
  name: review-pipeline
  version: 1.0.0
  description: "Code review pipeline with role-based routing"

spec:
  orchestration:
    pattern: group_chat
    selection: custom
  steps:
    - name: security-reviewer
      agentRef: security-agent
      tags: [security]
    - name: performance-reviewer
      agentRef: performance-agent
      tags: [performance]
    - name: style-reviewer
      agentRef: style-agent
      tags: [style]

extensions:
  autogen:
    agent_type: group_chat_manager
    group_chat_config:
      agents:
        - security-agent
        - performance-agent
        - style-agent
      max_round: 15
      speaker_selection_method: custom
      custom_speaker_selection_func: "review_pipeline.select_reviewer"
      allow_repeat_speaker:
        - security-agent  # Security can speak multiple times
      send_introductions: true
    llm_config:
      config_list:
        - model: gpt-4-turbo
          api_key_env: OPENAI_API_KEY
      temperature: 0.1
```

## Conversion Functions

### OSSA to AutoGen Python

```python
from autogen import ConversableAgent, AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
import yaml

def ossa_to_autogen(manifest_path: str):
    """Convert OSSA manifest to AutoGen agent configuration."""
    with open(manifest_path) as f:
        manifest = yaml.safe_load(f)

    autogen_ext = manifest.get('extensions', {}).get('autogen', {})
    spec = manifest.get('spec', {})

    agent_type = autogen_ext.get('agent_type', 'assistant_agent')

    # Build llm_config
    llm_config = autogen_ext.get('llm_config', {})
    if not llm_config and spec.get('model'):
        llm_config = {
            'config_list': [{
                'model': spec['model'].get('name', 'gpt-4'),
                'api_key': os.environ.get('OPENAI_API_KEY'),
            }]
        }

    # Map agent type to class
    agent_classes = {
        'conversable_agent': ConversableAgent,
        'assistant_agent': AssistantAgent,
        'user_proxy_agent': UserProxyAgent,
    }

    AgentClass = agent_classes.get(agent_type, AssistantAgent)

    # Build agent kwargs
    kwargs = {
        'name': manifest['metadata']['name'],
        'llm_config': llm_config,
        'system_message': autogen_ext.get('system_message', spec.get('instructions', '')),
        'human_input_mode': autogen_ext.get('human_input_mode', 'NEVER'),
        'max_consecutive_auto_reply': autogen_ext.get('max_consecutive_auto_reply', 10),
    }

    # Add code execution config for UserProxyAgent
    if agent_type == 'user_proxy_agent':
        code_exec = autogen_ext.get('code_execution_config', False)
        kwargs['code_execution_config'] = code_exec

    return AgentClass(**kwargs)
```

### AutoGen to OSSA Manifest

```python
def autogen_to_ossa(agent, version: str = "1.0.0") -> dict:
    """Convert AutoGen agent to OSSA manifest."""
    manifest = {
        'apiVersion': 'ossa/v0.3.3',
        'kind': 'Agent',
        'metadata': {
            'name': agent.name.lower().replace(' ', '-'),
            'version': version,
            'description': agent.description if hasattr(agent, 'description') else '',
        },
        'spec': {
            'instructions': agent.system_message or '',
        },
        'extensions': {
            'autogen': {
                'human_input_mode': agent.human_input_mode,
                'max_consecutive_auto_reply': agent.max_consecutive_auto_reply,
            }
        }
    }

    # Determine agent type
    if isinstance(agent, UserProxyAgent):
        manifest['extensions']['autogen']['agent_type'] = 'user_proxy_agent'
        if agent.code_execution_config:
            manifest['extensions']['autogen']['code_execution_config'] = agent.code_execution_config
    elif isinstance(agent, AssistantAgent):
        manifest['extensions']['autogen']['agent_type'] = 'assistant_agent'
    else:
        manifest['extensions']['autogen']['agent_type'] = 'conversable_agent'

    # Add llm_config
    if agent.llm_config:
        # Sanitize - remove actual API keys
        safe_config = {
            'config_list': [
                {k: v for k, v in config.items() if k != 'api_key'}
                for config in agent.llm_config.get('config_list', [])
            ],
            'temperature': agent.llm_config.get('temperature'),
        }
        manifest['extensions']['autogen']['llm_config'] = safe_config

        # Map to OSSA spec.model
        if safe_config['config_list']:
            manifest['spec']['model'] = {
                'name': safe_config['config_list'][0].get('model'),
                'provider': safe_config['config_list'][0].get('api_type', 'openai'),
            }

    return manifest
```

## OpenAPI Integration

### AutoGen Agent Endpoint

```yaml
openapi: 3.1.0
paths:
  /api/v1/agents/autogen:
    post:
      operationId: createAutoGenAgent
      summary: Create agent from AutoGen configuration
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AutoGenAgentRequest'
      responses:
        '201':
          description: Agent created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OSSAManifest'

  /api/v1/agents/{agentId}/autogen/export:
    get:
      operationId: exportToAutoGen
      summary: Export OSSA agent as AutoGen configuration
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: AutoGen configuration
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AutoGenConfig'

components:
  schemas:
    AutoGenAgentRequest:
      type: object
      required:
        - name
        - agent_type
      properties:
        name:
          type: string
        agent_type:
          type: string
          enum: [conversable_agent, assistant_agent, user_proxy_agent, group_chat_manager]
        llm_config:
          $ref: '#/components/schemas/LLMConfig'
        human_input_mode:
          type: string
          enum: [ALWAYS, NEVER, TERMINATE]
        code_execution_config:
          $ref: '#/components/schemas/CodeExecutionConfig'

    AutoGenConfig:
      type: object
      properties:
        agent_type:
          type: string
        llm_config:
          $ref: '#/components/schemas/LLMConfig'
        human_input_mode:
          type: string
        code_execution_config:
          $ref: '#/components/schemas/CodeExecutionConfig'
        group_chat_config:
          $ref: '#/components/schemas/GroupChatConfig'
```

## Zod Validation Schema

```typescript
import { z } from 'zod';

export const LLMConfigSchema = z.object({
  config_list: z.array(z.object({
    model: z.string(),
    api_key_env: z.string().regex(/^[A-Z][A-Z0-9_]*$/).optional(),
    base_url: z.string().url().optional(),
    api_type: z.enum(['openai', 'azure', 'anthropic', 'ollama', 'litellm']).optional(),
    api_version: z.string().optional(),
  })),
  temperature: z.number().min(0).max(2).default(0.7),
  timeout: z.number().int().min(1).default(600),
  cache_seed: z.number().int().nullable().optional(),
});

export const CodeExecutionConfigSchema = z.union([
  z.object({
    work_dir: z.string().default('workspace'),
    use_docker: z.union([z.boolean(), z.string()]).default(false),
    timeout: z.number().int().min(1).default(60),
    last_n_messages: z.number().int().min(1).default(1),
    executor_type: z.enum([
      'local_command_line',
      'docker_command_line',
      'jupyter',
      'azure_container_instance'
    ]).default('local_command_line'),
    allowed_languages: z.array(
      z.enum(['python', 'bash', 'shell', 'javascript', 'powershell'])
    ).default(['python', 'bash']),
  }),
  z.literal(false),
]);

export const GroupChatConfigSchema = z.object({
  agents: z.array(z.string()),
  max_round: z.number().int().min(1).default(10),
  admin_name: z.string().default('Admin'),
  speaker_selection_method: z.enum([
    'auto', 'manual', 'random', 'round_robin', 'custom'
  ]).default('auto'),
  custom_speaker_selection_func: z.string().optional(),
  allow_repeat_speaker: z.union([
    z.boolean(),
    z.array(z.string())
  ]).default(true),
  send_introductions: z.boolean().default(false),
});

export const TerminationConfigSchema = z.object({
  is_termination_msg: z.string().optional(),
  termination_keywords: z.array(z.string()).default(['TERMINATE']),
  max_turns: z.number().int().min(1).optional(),
});

export const NestedChatConfigSchema = z.object({
  enabled: z.boolean().default(false),
  inner_agents: z.array(z.object({
    agent_ref: z.string(),
    trigger: z.string(),
    max_turns: z.number().int().optional(),
  })).optional(),
  message_transformer: z.string().optional(),
});

export const TeachabilityConfigSchema = z.object({
  enabled: z.boolean().default(false),
  verbosity: z.number().int().min(0).max(3).default(0),
  reset_db: z.boolean().default(false),
  path_to_db_dir: z.string().optional(),
  recall_threshold: z.number().min(0).max(1).default(1.5),
});

export const AutoGenExtensionSchema = z.object({
  agent_type: z.enum([
    'conversable_agent',
    'assistant_agent',
    'user_proxy_agent',
    'group_chat_manager',
    'teachable_agent',
    'reasoning_agent',
    'captain_agent',
    'custom_agent'
  ]),
  llm_config: LLMConfigSchema.optional(),
  human_input_mode: z.enum(['ALWAYS', 'NEVER', 'TERMINATE']).default('NEVER'),
  code_execution_config: CodeExecutionConfigSchema.optional(),
  max_consecutive_auto_reply: z.number().int().min(0).default(10),
  termination_config: TerminationConfigSchema.optional(),
  group_chat_config: GroupChatConfigSchema.optional(),
  function_map: z.record(z.string()).optional(),
  register_for_llm: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown()),
  })).optional(),
  register_for_execution: z.array(z.string()).optional(),
  nested_chat_config: NestedChatConfigSchema.optional(),
  system_message: z.string().optional(),
  description: z.string().optional(),
  teachability_config: TeachabilityConfigSchema.optional(),
});

// Validate AutoGen extension
export function validateAutoGenExtension(data: unknown) {
  return AutoGenExtensionSchema.safeParse(data);
}
```

## Human Input Modes

### `ALWAYS`

Human input is requested after every agent response:

```
Agent receives message -> Agent responds -> WAIT for human input -> Repeat
```

Use case: Interactive tutoring, sensitive operations requiring approval.

### `NEVER`

Fully autonomous operation - no human input requested:

```
Agent receives message -> Agent responds -> Continue automatically
```

Use case: Automated pipelines, background processing.

### `TERMINATE`

Human input requested only on termination conditions:

```
Agent receives message -> Agent responds -> Check termination -> If terminate: WAIT for human
```

Use case: Human approval for final results, error handling.

## Code Execution Security

### Docker Isolation (Recommended)

```yaml
code_execution_config:
  use_docker: python:3.11-slim
  timeout: 60
  allowed_languages:
    - python
```

Docker provides:
- File system isolation
- Network isolation (configurable)
- Resource limits
- Clean environment per execution

### Local Execution (Development Only)

```yaml
code_execution_config:
  use_docker: false
  work_dir: ./sandbox
  timeout: 30
```

**Warning**: Local execution can access host system. Use only in trusted environments.

### OSSA Sandbox Mapping

| OSSA sandboxConfig | AutoGen Equivalent |
|-------------------|-------------------|
| `type: docker` | `use_docker: true` |
| `image: python:3.11` | `use_docker: "python:3.11"` |
| `timeout: 60` | `timeout: 60` |
| `network: none` | Docker network config |
| `memory_limit: "512m"` | Docker resource config |

## Integration Patterns

### Pattern 1: Two-Agent Conversation

```python
# OSSA defines agents, AutoGen runs conversation
assistant = ossa_to_autogen('assistant.ossa.yaml')
user_proxy = ossa_to_autogen('user_proxy.ossa.yaml')

user_proxy.initiate_chat(
    assistant,
    message="Write a Python function to calculate fibonacci numbers"
)
```

### Pattern 2: Group Chat Workflow

```python
# OSSA Workflow -> AutoGen GroupChat
workflow = load_ossa_workflow('research-team.ossa.yaml')
agents = [ossa_to_autogen(ref) for ref in workflow.spec.steps]

groupchat = GroupChat(
    agents=agents,
    **workflow.extensions.autogen.group_chat_config
)
manager = GroupChatManager(groupchat=groupchat)
```

### Pattern 3: Nested Delegation

```python
# Coordinator delegates to specialists via nested chat
coordinator = ossa_to_autogen('coordinator.ossa.yaml')
specialists = {
    'frontend': ossa_to_autogen('frontend.ossa.yaml'),
    'backend': ossa_to_autogen('backend.ossa.yaml'),
}

# Register nested chat handlers
for name, agent in specialists.items():
    coordinator.register_nested_chats(
        trigger=lambda x: name in x['content'].lower(),
        chat_queue=[agent],
    )
```

## Related

- [Microsoft AutoGen Documentation](https://microsoft.github.io/autogen/)
- [AutoGen GitHub Repository](https://github.com/microsoft/autogen)
- [OSSA v0.3.3 Schema](../ossa-0.3.3.schema.json)
- [Agent-to-Agent Messaging Extension](./agent-identity.yaml)
- [Drupal Extension](./drupal.md)
- [MCP Extension](#/definitions/MCPExtension)
