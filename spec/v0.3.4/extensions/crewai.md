# CrewAI Extension for OSSA v0.3.4

## Overview

The `extensions.crewai` schema provides comprehensive bidirectional mapping between CrewAI's multi-agent orchestration framework and OSSA v0.3.4 specifications. This extension enables:

- Converting CrewAI crews to OSSA Workflows with multiple agents
- Mapping CrewAI agent roles to OSSA Agent taxonomy
- Translating CrewAI tasks to OSSA Task kind
- Binding CrewAI tools to OSSA capabilities
- Supporting sequential and hierarchical process types
- Enabling delegation patterns through OSSA DelegationConfig
- Persisting memory state via OSSA state management
- Integrating callbacks with OSSA observability

## Schema Definition

```yaml
extensions:
  crewai:
    type: object
    description: "CrewAI multi-agent orchestration framework extension"
    properties:
      crew_name:
        type: string
        description: "Name of the CrewAI crew"
        pattern: "^[a-z][a-z0-9_-]*$"
        examples:
          - "research-team"
          - "content-creation-crew"

      agents:
        type: array
        description: "CrewAI agents mapped to OSSA agents"
        items:
          $ref: "#/definitions/CrewAIAgent"

      tasks:
        type: array
        description: "CrewAI tasks mapped to OSSA workflow steps"
        items:
          $ref: "#/definitions/CrewAITask"

      process_type:
        type: string
        enum:
          - sequential
          - hierarchical
          - consensual
        default: sequential
        description: "Process execution pattern - maps to OSSA workflow step ordering"

      delegation_enabled:
        type: boolean
        default: true
        description: "Enable agent-to-agent delegation"

      memory_config:
        $ref: "#/definitions/CrewAIMemory"
        description: "Memory system configuration"

      manager_llm:
        type: object
        description: "LLM configuration for hierarchical manager (when process_type=hierarchical)"
        properties:
          provider:
            type: string
            enum: [openai, anthropic, google, azure, ollama]
          model:
            type: string
        additionalProperties: true

      max_rpm:
        type: integer
        minimum: 1
        description: "Maximum requests per minute for rate limiting"

      share_crew:
        type: boolean
        default: false
        description: "Share telemetry data with CrewAI platform"

      callbacks:
        $ref: "#/definitions/CrewAICallbacks"
        description: "Callback hooks for observability integration"

      verbose:
        type: boolean
        default: false
        description: "Enable verbose logging"

      language:
        type: string
        default: "en"
        description: "Primary language for agent interactions"
```

## Bidirectional Mapping Tables

### CrewAI Crew to OSSA Workflow

| CrewAI Crew Field | OSSA Workflow Field | Notes |
|-------------------|---------------------|-------|
| `name` | `metadata.name` | Converted to DNS-1123 format |
| `agents` | `extensions.crewai.agents` + separate Agent manifests | Each agent becomes OSSA Agent |
| `tasks` | `spec.steps[]` | Tasks become WorkflowStep |
| `process` | `extensions.crewai.process_type` | Sequential/hierarchical patterns |
| `verbose` | `spec.observability.logging.level` | Maps to debug/info |
| `memory` | `extensions.crewai.memory_config` | Short/long-term memory |
| `cache` | `runtime.caching` | Result caching |
| `max_rpm` | `extensions.crewai.max_rpm` | Rate limiting |
| `share_crew` | `extensions.crewai.share_crew` | Telemetry sharing |
| `manager_llm` | `extensions.crewai.manager_llm` | Hierarchical manager |
| `step_callback` | `extensions.crewai.callbacks.on_step` | Step completion hook |
| `task_callback` | `extensions.crewai.callbacks.on_task` | Task completion hook |

### CrewAI Agent to OSSA Agent

| CrewAI Agent Field | OSSA Agent Field | Notes |
|--------------------|------------------|-------|
| `role` | `spec.role` | System prompt / role definition |
| `goal` | `metadata.annotations["crewai.goal"]` | Agent goal |
| `backstory` | `spec.prompts.system.template` | Combined with role |
| `llm` | `spec.llm` | LLM configuration |
| `tools` | `spec.tools[]` | Tool bindings |
| `allow_delegation` | `spec.delegation.enabled` | Delegation capability |
| `verbose` | `spec.observability.logging.level` | Logging verbosity |
| `memory` | `spec.state.persistence` | Memory persistence |
| `max_iter` | `spec.autonomy.max_iterations` | Iteration limit |
| `max_rpm` | `spec.constraints.rate_limit.requests_per_minute` | Rate limit |
| `step_callback` | `spec.observability.callbacks.on_step` | Step hook |

### CrewAI Agent Role to OSSA Taxonomy

| CrewAI Role Pattern | OSSA Taxonomy Domain | OSSA Agent Type | Access Tier |
|--------------------|----------------------|-----------------|-------------|
| `researcher`, `analyst` | `data` | `analyzer` | `tier_1_read` |
| `writer`, `content creator` | `content` | `worker` | `tier_2_write_limited` |
| `editor`, `reviewer` | `documentation` | `critic` | `tier_1_read` |
| `manager`, `coordinator` | `agents` | `orchestrator` | `tier_3_write_elevated` |
| `developer`, `coder` | `development` | `worker` | `tier_2_write_limited` |
| `qa`, `tester` | `development` | `analyzer` | `tier_1_read` |
| `security analyst` | `security` | `analyzer` | `tier_1_read` |
| `devops`, `operator` | `infrastructure` | `operator` | `tier_3_write_elevated` |

### CrewAI Task to OSSA Task/WorkflowStep

| CrewAI Task Field | OSSA Field | Notes |
|-------------------|------------|-------|
| `description` | `metadata.description` | Task description |
| `agent` | `spec.steps[].ref` | Reference to agent |
| `expected_output` | `spec.output` | Output schema |
| `tools` | `spec.capabilities[]` | Required capabilities |
| `context` | `spec.steps[].input` | Input from previous tasks |
| `async_execution` | `spec.batch.enabled` | Async pattern |
| `callback` | `extensions.crewai.callbacks.on_task` | Task hook |
| `output_json` | `spec.output.type: object` | JSON output |
| `output_pydantic` | `spec.output` + Zod validation | Structured output |
| `output_file` | `spec.output` + file capability | File output |
| `human_input` | `spec.safety.human_approval.required` | Human-in-loop |

### CrewAI Tools to OSSA Capabilities

| CrewAI Tool Type | OSSA Capability | OSSA Tool Type |
|------------------|-----------------|----------------|
| `@tool` decorator | Custom capability | `function` |
| `SerperDevTool` | `web_search` | `http` |
| `ScrapeWebsiteTool` | `web_scrape` | `http` |
| `FileReadTool` | `file_read` | `function` |
| `DirectoryReadTool` | `directory_read` | `function` |
| `MDXSearchTool` | `document_search` | `function` |
| `PDFSearchTool` | `pdf_search` | `function` |
| `DOCXSearchTool` | `docx_search` | `function` |
| `CSVSearchTool` | `csv_search` | `function` |
| `JSONSearchTool` | `json_search` | `function` |
| `XMLSearchTool` | `xml_search` | `function` |
| `CodeInterpreterTool` | `code_execute` | `function` |
| `BrowserbaseLoadTool` | `browser_automation` | `http` |
| `GithubSearchTool` | `github_search` | `api` |
| `YoutubeChannelSearchTool` | `youtube_search` | `api` |
| `YoutubeVideoSearchTool` | `youtube_video_search` | `api` |
| `RagTool` | `rag_query` | `function` |
| `LlamaIndexTool` | `llama_index` | `function` |
| `SeleniumScrapingTool` | `web_scrape_dynamic` | `http` |

### CrewAI Process Types to OSSA Workflow Patterns

| CrewAI Process | OSSA Pattern | Description |
|----------------|--------------|-------------|
| `Process.sequential` | Linear `steps[]` | Tasks execute in order |
| `Process.hierarchical` | Manager agent + `Parallel` steps | Manager delegates to workers |
| `Process.consensual` | `Parallel` with voting step | Agents reach consensus |

### CrewAI Memory to OSSA State

| CrewAI Memory Type | OSSA State Field | Notes |
|--------------------|------------------|-------|
| `short_term` | `spec.state.context_window` | Recent interaction memory |
| `long_term` | `spec.state.persistence.type: database` | Persistent memory |
| `entity` | `spec.state.memory.entities` | Entity extraction |
| `contextual` | `spec.state.memory.contextual` | RAG-based memory |
| `embeddings` | `spec.state.memory.embeddings` | Vector store |

### CrewAI Callbacks to OSSA Observability

| CrewAI Callback | OSSA Observability | Notes |
|-----------------|-------------------|-------|
| `step_callback` | `spec.observability.tracing.on_step` | Step completion |
| `task_callback` | `spec.observability.tracing.on_task` | Task completion |
| `on_run_start` | `spec.observability.callbacks.before_execute` | Crew start |
| `on_run_end` | `spec.observability.callbacks.after_execute` | Crew end |
| `on_agent_start` | `spec.observability.callbacks.agent_start` | Agent activation |
| `on_agent_end` | `spec.observability.callbacks.agent_end` | Agent completion |

## Definitions

### CrewAIAgent

```yaml
CrewAIAgent:
  type: object
  required:
    - role
    - goal
  properties:
    role:
      type: string
      description: "Agent's role/persona"
      examples:
        - "Senior Research Analyst"
        - "Technical Writer"
        - "Quality Assurance Engineer"

    goal:
      type: string
      description: "Agent's primary objective"

    backstory:
      type: string
      description: "Background context for the agent persona"

    llm:
      type: object
      description: "LLM configuration for this agent"
      properties:
        provider:
          type: string
          enum: [openai, anthropic, google, azure, ollama, groq]
        model:
          type: string
        temperature:
          type: number
          minimum: 0
          maximum: 2

    tools:
      type: array
      description: "Tools available to this agent"
      items:
        type: string

    allow_delegation:
      type: boolean
      default: true
      description: "Can this agent delegate to others"

    max_iter:
      type: integer
      default: 25
      minimum: 1
      description: "Maximum reasoning iterations"

    max_rpm:
      type: integer
      description: "Rate limit for this agent"

    max_execution_time:
      type: integer
      description: "Maximum execution time in seconds"

    verbose:
      type: boolean
      default: false
      description: "Enable verbose logging"

    cache:
      type: boolean
      default: true
      description: "Enable response caching"

    system_template:
      type: string
      description: "Custom system prompt template"

    prompt_template:
      type: string
      description: "Custom prompt template"

    response_template:
      type: string
      description: "Custom response template"

    allow_code_execution:
      type: boolean
      default: false
      description: "Allow code execution capability"

    code_execution_mode:
      type: string
      enum: [safe, unsafe]
      default: safe
      description: "Code execution security mode"

    ossa_agent_ref:
      type: string
      description: "Reference to OSSA Agent manifest file"
      examples:
        - "./agents/researcher.ossa.yaml"
        - "ossa://agents/content-writer"
```

### CrewAITask

```yaml
CrewAITask:
  type: object
  required:
    - description
    - agent
  properties:
    description:
      type: string
      description: "Detailed task description"

    agent:
      type: string
      description: "Agent role assigned to this task"

    expected_output:
      type: string
      description: "Description of expected output format"

    tools:
      type: array
      items:
        type: string
      description: "Specific tools for this task"

    context:
      type: array
      items:
        type: string
      description: "References to other tasks providing context"

    async_execution:
      type: boolean
      default: false
      description: "Execute asynchronously"

    output_json:
      type: object
      description: "JSON schema for structured output"

    output_pydantic:
      type: string
      description: "Pydantic model class name for validation"

    output_file:
      type: string
      description: "File path for output"

    human_input:
      type: boolean
      default: false
      description: "Require human input before completion"

    converter_cls:
      type: string
      description: "Custom output converter class"

    ossa_task_ref:
      type: string
      description: "Reference to OSSA Task manifest file"
      examples:
        - "./tasks/research.ossa.yaml"
```

### CrewAIMemory

```yaml
CrewAIMemory:
  type: object
  description: "Memory system configuration"
  properties:
    enabled:
      type: boolean
      default: false
      description: "Enable memory system"

    short_term:
      type: object
      description: "Short-term memory (within session)"
      properties:
        provider:
          type: string
          enum: [rag, simple, custom]
          default: rag
        embedder:
          type: object
          properties:
            provider:
              type: string
              enum: [openai, cohere, google, huggingface]
            model:
              type: string
            config:
              type: object
              additionalProperties: true

    long_term:
      type: object
      description: "Long-term memory (persistent)"
      properties:
        provider:
          type: string
          enum: [rag, sqlite, custom]
          default: rag
        storage:
          type: object
          properties:
            type:
              type: string
              enum: [chroma, qdrant, pinecone, weaviate, pgvector]
            connection:
              type: string
              description: "Connection string or path"

    entity:
      type: object
      description: "Entity memory (extracted entities)"
      properties:
        enabled:
          type: boolean
          default: false
        provider:
          type: string
          enum: [rag, spacy, custom]

    contextual:
      type: object
      description: "Contextual memory (RAG-based)"
      properties:
        enabled:
          type: boolean
          default: false
        retriever:
          type: object
          properties:
            k:
              type: integer
              default: 5
              description: "Number of results to retrieve"
            threshold:
              type: number
              default: 0.7
              description: "Similarity threshold"
```

### CrewAICallbacks

```yaml
CrewAICallbacks:
  type: object
  description: "Callback configuration for observability"
  properties:
    on_step:
      type: object
      description: "Step completion callback"
      properties:
        handler:
          type: string
          description: "Handler function/class reference"
        otel_export:
          type: boolean
          default: true
          description: "Export to OpenTelemetry"
        include_output:
          type: boolean
          default: false
          description: "Include step output in trace"

    on_task:
      type: object
      description: "Task completion callback"
      properties:
        handler:
          type: string
        otel_export:
          type: boolean
          default: true
        include_output:
          type: boolean
          default: false

    on_crew_start:
      type: object
      description: "Crew start callback"
      properties:
        handler:
          type: string
        otel_export:
          type: boolean
          default: true

    on_crew_end:
      type: object
      description: "Crew completion callback"
      properties:
        handler:
          type: string
        otel_export:
          type: boolean
          default: true
        include_final_output:
          type: boolean
          default: true

    on_agent_action:
      type: object
      description: "Agent action callback"
      properties:
        handler:
          type: string
        otel_export:
          type: boolean
          default: true

    on_tool_use:
      type: object
      description: "Tool usage callback"
      properties:
        handler:
          type: string
        otel_export:
          type: boolean
          default: true
        track_latency:
          type: boolean
          default: true
```

## Example Manifests

### Example 1: Research Crew as OSSA Workflow

CrewAI Python code:

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI",
    backstory="You are a seasoned researcher at a tech think tank.",
    tools=[SerperDevTool(), ScrapeWebsiteTool()],
    allow_delegation=False,
    verbose=True
)

writer = Agent(
    role="Tech Content Writer",
    goal="Write engaging tech content based on research",
    backstory="You are a renowned content writer for tech blogs.",
    tools=[],
    verbose=True
)

research_task = Task(
    description="Research the latest AI developments in 2024",
    agent=researcher,
    expected_output="A comprehensive list of AI developments"
)

write_task = Task(
    description="Write a blog post about the AI developments",
    agent=writer,
    expected_output="A blog post in markdown format",
    context=[research_task]
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    memory=True,
    verbose=True
)
```

Equivalent OSSA Workflow:

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: ai-research-crew
  version: 1.0.0
  description: "Research and write about AI developments"
  labels:
    framework: crewai
    domain: research

spec:
  triggers:
    - type: manual

  inputs:
    type: object
    properties:
      topic:
        type: string
        default: "AI developments"
      year:
        type: integer
        default: 2024

  steps:
    - id: research
      name: "Research AI Developments"
      kind: Agent
      ref: "./agents/researcher.ossa.yaml"
      input:
        topic: "${{ workflow.input.topic }}"
        year: "${{ workflow.input.year }}"
      output:
        to: research_results

    - id: write
      name: "Write Blog Post"
      kind: Agent
      ref: "./agents/writer.ossa.yaml"
      depends_on:
        - research
      input:
        research: "${{ steps.research.output }}"
      output:
        to: blog_post

  outputs:
    type: object
    properties:
      blog_post:
        type: string

  observability:
    tracing:
      enabled: true
      propagate_context: true
    metrics:
      enabled: true
      custom_labels:
        crew: ai-research-crew

extensions:
  crewai:
    crew_name: ai-research-crew
    process_type: sequential
    delegation_enabled: false
    verbose: true
    memory_config:
      enabled: true
      short_term:
        provider: rag
      long_term:
        provider: rag
    callbacks:
      on_step:
        otel_export: true
      on_task:
        otel_export: true
      on_crew_end:
        include_final_output: true

    agents:
      - role: "Senior Research Analyst"
        goal: "Uncover cutting-edge developments in AI"
        backstory: "You are a seasoned researcher at a tech think tank."
        tools:
          - web_search
          - web_scrape
        allow_delegation: false
        verbose: true
        ossa_agent_ref: "./agents/researcher.ossa.yaml"

      - role: "Tech Content Writer"
        goal: "Write engaging tech content based on research"
        backstory: "You are a renowned content writer for tech blogs."
        tools: []
        verbose: true
        ossa_agent_ref: "./agents/writer.ossa.yaml"

    tasks:
      - description: "Research the latest AI developments in 2024"
        agent: "Senior Research Analyst"
        expected_output: "A comprehensive list of AI developments"
        ossa_task_ref: "./tasks/research.ossa.yaml"

      - description: "Write a blog post about the AI developments"
        agent: "Tech Content Writer"
        expected_output: "A blog post in markdown format"
        context:
          - "Research the latest AI developments in 2024"
        ossa_task_ref: "./tasks/write-blog.ossa.yaml"
```

### Example 2: Researcher Agent Manifest

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: researcher
  version: 1.0.0
  description: "Senior Research Analyst - uncovers cutting-edge developments"
  labels:
    framework: crewai
    crew: ai-research-crew
  annotations:
    crewai.goal: "Uncover cutting-edge developments in AI"

spec:
  role: |
    You are a Senior Research Analyst at a leading tech think tank.
    Your primary goal is to uncover cutting-edge developments in AI.
    You are known for your thoroughness and ability to find key insights.

  prompts:
    system:
      template: |
        You are a seasoned researcher at a tech think tank.
        Your analysis should be comprehensive, data-driven, and insightful.
        Always cite your sources and provide verifiable information.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.7

  tools:
    - type: http
      name: serper-search
      config:
        endpoint: "https://google.serper.dev/search"
        method: POST
    - type: http
      name: web-scraper
      config:
        endpoint: "internal://scraper"

  autonomy:
    level: semi
    max_iterations: 25
    checkpoint_frequency: 5

  constraints:
    rate_limit:
      requests_per_minute: 60
    resource_limits:
      max_execution_time_seconds: 300

  state:
    persistence:
      enabled: true
      type: memory
    context_window: 10

  observability:
    logging:
      level: debug
    tracing:
      enabled: true
    metrics:
      enabled: true

  delegation:
    enabled: false

  taxonomy:
    domain: data
    subdomain: research
    capability: analyze_trends
    concerns:
      - quality
      - reliability

  access:
    tier: tier_1_read
    permissions:
      - read_code
      - read_configs
      - execute_queries
    audit_level: detailed

runtime:
  type: unified
  supports:
    - local-execution
    - kubernetes
```

### Example 3: Hierarchical Crew Pattern

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: content-production-crew
  version: 1.0.0
  description: "Hierarchical content production with manager delegation"
  labels:
    framework: crewai
    process: hierarchical

spec:
  steps:
    - id: manager-orchestration
      name: "Manager Orchestration"
      kind: Parallel
      parallel:
        - id: researcher-1
          kind: Agent
          ref: "./agents/researcher.ossa.yaml"
          input:
            topic: "Technical trends"
        - id: researcher-2
          kind: Agent
          ref: "./agents/researcher.ossa.yaml"
          input:
            topic: "Market analysis"
        - id: analyst
          kind: Agent
          ref: "./agents/analyst.ossa.yaml"
          input:
            topic: "Competitive landscape"

    - id: synthesis
      kind: Agent
      ref: "./agents/synthesizer.ossa.yaml"
      depends_on:
        - manager-orchestration
      input:
        research_1: "${{ steps.researcher-1.output }}"
        research_2: "${{ steps.researcher-2.output }}"
        analysis: "${{ steps.analyst.output }}"

    - id: review
      kind: Agent
      ref: "./agents/reviewer.ossa.yaml"
      depends_on:
        - synthesis
      input:
        content: "${{ steps.synthesis.output }}"

extensions:
  crewai:
    crew_name: content-production-crew
    process_type: hierarchical
    delegation_enabled: true
    manager_llm:
      provider: anthropic
      model: claude-sonnet-4-20250514
      temperature: 0.3
    memory_config:
      enabled: true
      short_term:
        provider: rag
      long_term:
        provider: rag
        storage:
          type: chroma
          connection: "./data/chroma_db"
    callbacks:
      on_step:
        handler: "metrics.CrewStepCallback"
        otel_export: true
      on_tool_use:
        track_latency: true
```

### Example 4: OSSA to CrewAI Conversion

Given an OSSA Workflow, convert to CrewAI Python code:

```python
# Auto-generated from OSSA manifest: ai-research-crew.ossa.yaml

from crewai import Agent, Task, Crew, Process
from crewai.tools import SerperDevTool, ScrapeWebsiteTool

# Agent: researcher (from ./agents/researcher.ossa.yaml)
researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI",
    backstory="""You are a seasoned researcher at a tech think tank.
Your analysis should be comprehensive, data-driven, and insightful.
Always cite your sources and provide verifiable information.""",
    llm="gpt-4o",
    tools=[SerperDevTool(), ScrapeWebsiteTool()],
    allow_delegation=False,
    verbose=True,
    max_iter=25,
    cache=True
)

# Agent: writer (from ./agents/writer.ossa.yaml)
writer = Agent(
    role="Tech Content Writer",
    goal="Write engaging tech content based on research",
    backstory="You are a renowned content writer for tech blogs.",
    llm="gpt-4o",
    tools=[],
    verbose=True,
    max_iter=25
)

# Task: research (from ./tasks/research.ossa.yaml)
research_task = Task(
    description="Research the latest AI developments in 2024",
    agent=researcher,
    expected_output="A comprehensive list of AI developments"
)

# Task: write-blog (from ./tasks/write-blog.ossa.yaml)
write_task = Task(
    description="Write a blog post about the AI developments",
    agent=writer,
    expected_output="A blog post in markdown format",
    context=[research_task]
)

# Crew: ai-research-crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    memory=True,
    verbose=True,
    max_rpm=60
)

# Execute
result = crew.kickoff()
```

## Process Type Mappings

### Sequential Process

```yaml
# CrewAI
process: Process.sequential

# OSSA Workflow
spec:
  steps:
    - id: step-1
      # ...
    - id: step-2
      depends_on:
        - step-1
    - id: step-3
      depends_on:
        - step-2
```

### Hierarchical Process

```yaml
# CrewAI
process: Process.hierarchical
manager_llm: ChatOpenAI(model="gpt-4")

# OSSA Workflow
spec:
  steps:
    - id: manager
      kind: Agent
      ref: "./agents/manager.ossa.yaml"
      input:
        available_agents:
          - researcher
          - writer
          - analyst
    - id: workers
      kind: Parallel
      depends_on:
        - manager
      parallel:
        - id: researcher
          kind: Agent
          ref: "./agents/researcher.ossa.yaml"
          condition: "${{ steps.manager.output.delegate_to contains 'researcher' }}"
        - id: writer
          kind: Agent
          ref: "./agents/writer.ossa.yaml"
          condition: "${{ steps.manager.output.delegate_to contains 'writer' }}"

extensions:
  crewai:
    process_type: hierarchical
    manager_llm:
      provider: openai
      model: gpt-4
```

### Consensual Process (Future)

```yaml
# OSSA Workflow pattern for consensus
spec:
  steps:
    - id: parallel-analysis
      kind: Parallel
      parallel:
        - id: agent-1
          kind: Agent
          ref: "./agents/analyst-1.ossa.yaml"
        - id: agent-2
          kind: Agent
          ref: "./agents/analyst-2.ossa.yaml"
        - id: agent-3
          kind: Agent
          ref: "./agents/analyst-3.ossa.yaml"

    - id: vote
      kind: Task
      ref: "./tasks/consensus-vote.ossa.yaml"
      depends_on:
        - parallel-analysis
      input:
        votes:
          - "${{ steps.agent-1.output.decision }}"
          - "${{ steps.agent-2.output.decision }}"
          - "${{ steps.agent-3.output.decision }}"

    - id: final-decision
      kind: Conditional
      depends_on:
        - vote
      branches:
        - condition: "${{ steps.vote.output.consensus == true }}"
          steps:
            - id: execute-decision
              kind: Task
              ref: "./tasks/execute.ossa.yaml"
      else:
        - id: escalate
          kind: Task
          ref: "./tasks/escalate.ossa.yaml"
```

## Delegation Configuration

### CrewAI Delegation

```python
# CrewAI allows delegation between agents
agent = Agent(
    role="Manager",
    allow_delegation=True,
    # When True, agent can delegate tasks to other agents
)
```

### OSSA Delegation Mapping

```yaml
spec:
  delegation:
    enabled: true
    allowed_tiers:
      - tier_1_read
      - tier_2_write_limited
    allowed_operations:
      - research
      - analysis
      - writing
    requires:
      - delegation_token
      - audit_trail
      - task_specification

  separation:
    role: orchestrator
    can_delegate_to:
      - analyzer
      - worker
    conflicts_with:
      - executor
      - approver
```

## Memory System Integration

### Short-term Memory

```yaml
extensions:
  crewai:
    memory_config:
      short_term:
        provider: rag
        embedder:
          provider: openai
          model: text-embedding-3-small

# Maps to OSSA
spec:
  state:
    context_window: 10
    memory:
      type: conversation
      max_tokens: 4096
```

### Long-term Memory

```yaml
extensions:
  crewai:
    memory_config:
      long_term:
        provider: rag
        storage:
          type: chroma
          connection: "./data/chroma"

# Maps to OSSA
spec:
  state:
    persistence:
      enabled: true
      type: database
      provider: vector
      config:
        store: chroma
        path: "./data/chroma"
```

## Callback Integration with OpenTelemetry

```yaml
extensions:
  crewai:
    callbacks:
      on_step:
        handler: "observability.StepCallback"
        otel_export: true
        include_output: false
      on_task:
        handler: "observability.TaskCallback"
        otel_export: true
      on_crew_end:
        handler: "observability.CrewCallback"
        include_final_output: true

# Maps to OSSA observability
spec:
  observability:
    tracing:
      enabled: true
      sample_rate: 1.0
      exporter: otlp
      endpoint: "http://localhost:4317"
    metrics:
      enabled: true
      custom_labels:
        framework: crewai
        crew: "${{ metadata.name }}"
    logging:
      level: info
      structured: true
```

## Zod Validation Schema

```typescript
import { z } from 'zod';

// CrewAI Agent validation
const CrewAIAgentSchema = z.object({
  role: z.string().min(1),
  goal: z.string().min(1),
  backstory: z.string().optional(),
  llm: z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'ollama', 'groq']),
    model: z.string(),
    temperature: z.number().min(0).max(2).optional()
  }).optional(),
  tools: z.array(z.string()).optional(),
  allow_delegation: z.boolean().default(true),
  max_iter: z.number().int().positive().default(25),
  max_rpm: z.number().int().positive().optional(),
  verbose: z.boolean().default(false),
  cache: z.boolean().default(true),
  ossa_agent_ref: z.string().optional()
});

// CrewAI Task validation
const CrewAITaskSchema = z.object({
  description: z.string().min(1),
  agent: z.string().min(1),
  expected_output: z.string().optional(),
  tools: z.array(z.string()).optional(),
  context: z.array(z.string()).optional(),
  async_execution: z.boolean().default(false),
  output_json: z.record(z.unknown()).optional(),
  output_file: z.string().optional(),
  human_input: z.boolean().default(false),
  ossa_task_ref: z.string().optional()
});

// CrewAI Memory validation
const CrewAIMemorySchema = z.object({
  enabled: z.boolean().default(false),
  short_term: z.object({
    provider: z.enum(['rag', 'simple', 'custom']).default('rag'),
    embedder: z.object({
      provider: z.enum(['openai', 'cohere', 'google', 'huggingface']),
      model: z.string(),
      config: z.record(z.unknown()).optional()
    }).optional()
  }).optional(),
  long_term: z.object({
    provider: z.enum(['rag', 'sqlite', 'custom']).default('rag'),
    storage: z.object({
      type: z.enum(['chroma', 'qdrant', 'pinecone', 'weaviate', 'pgvector']),
      connection: z.string()
    }).optional()
  }).optional(),
  entity: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['rag', 'spacy', 'custom']).optional()
  }).optional()
});

// CrewAI Callbacks validation
const CrewAICallbacksSchema = z.object({
  on_step: z.object({
    handler: z.string().optional(),
    otel_export: z.boolean().default(true),
    include_output: z.boolean().default(false)
  }).optional(),
  on_task: z.object({
    handler: z.string().optional(),
    otel_export: z.boolean().default(true),
    include_output: z.boolean().default(false)
  }).optional(),
  on_crew_start: z.object({
    handler: z.string().optional(),
    otel_export: z.boolean().default(true)
  }).optional(),
  on_crew_end: z.object({
    handler: z.string().optional(),
    otel_export: z.boolean().default(true),
    include_final_output: z.boolean().default(true)
  }).optional()
});

// Full CrewAI Extension validation
export const CrewAIExtensionSchema = z.object({
  crew_name: z.string().regex(/^[a-z][a-z0-9_-]*$/),
  agents: z.array(CrewAIAgentSchema).optional(),
  tasks: z.array(CrewAITaskSchema).optional(),
  process_type: z.enum(['sequential', 'hierarchical', 'consensual']).default('sequential'),
  delegation_enabled: z.boolean().default(true),
  memory_config: CrewAIMemorySchema.optional(),
  manager_llm: z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'ollama']),
    model: z.string(),
    temperature: z.number().min(0).max(2).optional()
  }).optional(),
  max_rpm: z.number().int().positive().optional(),
  share_crew: z.boolean().default(false),
  callbacks: CrewAICallbacksSchema.optional(),
  verbose: z.boolean().default(false),
  language: z.string().default('en')
});

// Type inference
export type CrewAIExtension = z.infer<typeof CrewAIExtensionSchema>;
export type CrewAIAgent = z.infer<typeof CrewAIAgentSchema>;
export type CrewAITask = z.infer<typeof CrewAITaskSchema>;
```

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: OSSA CrewAI Extension API
  version: 0.3.4

paths:
  /api/v1/crewai/crews:
    get:
      summary: List all CrewAI crews
      operationId: listCrews
      responses:
        '200':
          description: List of crews
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CrewSummary'
    post:
      summary: Create a new crew from OSSA workflow
      operationId: createCrew
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCrewRequest'
      responses:
        '201':
          description: Crew created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Crew'

  /api/v1/crewai/crews/{crewId}:
    get:
      summary: Get crew details
      operationId: getCrew
      parameters:
        - name: crewId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Crew details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Crew'
    put:
      summary: Update crew
      operationId: updateCrew
      parameters:
        - name: crewId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCrewRequest'
      responses:
        '200':
          description: Crew updated
    delete:
      summary: Delete crew
      operationId: deleteCrew
      parameters:
        - name: crewId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Crew deleted

  /api/v1/crewai/crews/{crewId}/kickoff:
    post:
      summary: Execute crew
      operationId: kickoffCrew
      parameters:
        - name: crewId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                inputs:
                  type: object
                  additionalProperties: true
      responses:
        '202':
          description: Crew execution started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CrewExecution'

  /api/v1/crewai/convert/to-ossa:
    post:
      summary: Convert CrewAI Python to OSSA manifest
      operationId: convertToOSSA
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                python_code:
                  type: string
                  description: CrewAI Python code
      responses:
        '200':
          description: OSSA manifest
          content:
            application/yaml:
              schema:
                type: string

  /api/v1/crewai/convert/from-ossa:
    post:
      summary: Convert OSSA manifest to CrewAI Python
      operationId: convertFromOSSA
      requestBody:
        required: true
        content:
          application/yaml:
            schema:
              type: string
      responses:
        '200':
          description: CrewAI Python code
          content:
            text/x-python:
              schema:
                type: string

components:
  schemas:
    CrewSummary:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        process_type:
          type: string
          enum: [sequential, hierarchical, consensual]
        agent_count:
          type: integer
        task_count:
          type: integer
        created_at:
          type: string
          format: date-time

    Crew:
      type: object
      properties:
        id:
          type: string
        manifest:
          $ref: '#/components/schemas/OSSAWorkflow'
        crewai_extension:
          $ref: '#/components/schemas/CrewAIExtension'

    CrewAIExtension:
      type: object
      properties:
        crew_name:
          type: string
        agents:
          type: array
          items:
            $ref: '#/components/schemas/CrewAIAgent'
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/CrewAITask'
        process_type:
          type: string
          enum: [sequential, hierarchical, consensual]
        delegation_enabled:
          type: boolean
        memory_config:
          $ref: '#/components/schemas/CrewAIMemory'

    CrewAIAgent:
      type: object
      required:
        - role
        - goal
      properties:
        role:
          type: string
        goal:
          type: string
        backstory:
          type: string
        tools:
          type: array
          items:
            type: string
        allow_delegation:
          type: boolean
        max_iter:
          type: integer

    CrewAITask:
      type: object
      required:
        - description
        - agent
      properties:
        description:
          type: string
        agent:
          type: string
        expected_output:
          type: string
        context:
          type: array
          items:
            type: string

    CrewAIMemory:
      type: object
      properties:
        enabled:
          type: boolean
        short_term:
          type: object
        long_term:
          type: object

    CrewExecution:
      type: object
      properties:
        execution_id:
          type: string
        status:
          type: string
          enum: [pending, running, completed, failed]
        started_at:
          type: string
          format: date-time
        trace_id:
          type: string
          description: OpenTelemetry trace ID

    OSSAWorkflow:
      type: object
      description: Full OSSA Workflow manifest
```

## Related

- [CrewAI Documentation](https://docs.crewai.com/)
- [OSSA v0.3.4 Specification](../ossa-0.3.4.schema.json)
- [OSSA Workflow Kind](../UNIFIED-SCHEMA.md)
- [Agent Taxonomy](../taxonomy.yaml)
- [Delegation Configuration](../access_tiers.yaml)
