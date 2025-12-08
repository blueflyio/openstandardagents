# OSSA: A Unified Schema for Agent-Executable Tasks

## Abstract

The software automation landscape is fragmented. Every framework, every language, and every platform has its own way of defining tasks, workflows, and automated processes. Drupal has five different execution models that can't communicate with each other. Symfony has Messenger. Node.js has a dozen workflow libraries. Python has Celery, Prefect, and Dagster. None of them speak the same language.

The Open Standard Schema for Agents (OSSA) addresses this fragmentation by providing a unified, portable schema for defining agent-executable tasks. OSSA introduces three fundamental kinds—**Task**, **Workflow**, and **Agent**—that can be executed across any runtime, any language, and any platform. This white paper presents the case for standardization, explains OSSA's architecture, and demonstrates how it enables true "write once, run anywhere" automation.

The implications are profound: a content publishing workflow defined in Drupal can be executed by a Symfony application. A data processing pipeline built for Node.js can run in a Python environment. An AI agent manifest works identically whether deployed on AWS Lambda, Kubernetes, or a local development machine. OSSA makes this possible.

---

## 1. Introduction

### The Fragmentation Problem

Consider a modern enterprise that uses multiple technology stacks:

- **Drupal** for content management
- **Symfony** for backend services
- **Node.js** for real-time applications
- **Python** for data processing and ML

Each stack has its own automation tools:

| Stack | Automation Tools |
|-------|------------------|
| Drupal | ECA, Maestro, FlowDrop, AI Agent Runner, Minikanban |
| Symfony | Messenger, Workflow Component, Process |
| Node.js | BullMQ, Temporal, n8n, Node-RED |
| Python | Celery, Prefect, Dagster, Airflow |

These tools cannot interoperate. A workflow defined in Drupal's Maestro cannot be executed by Symfony Messenger. A Temporal workflow cannot run as a Celery task. This fragmentation creates:

1. **Vendor lock-in**: Organizations are tied to specific tools and platforms
2. **Knowledge silos**: Teams must learn multiple systems
3. **Integration overhead**: Custom code to connect systems
4. **Duplication of effort**: Same patterns reimplemented everywhere
5. **Observability gaps**: Different logging, metrics, and tracing approaches

### Why Existing Solutions Fall Short

Previous attempts at standardization have failed because they:

- **Target only workflows**: Ignoring simple tasks and AI agents
- **Require specific runtimes**: Not truly portable
- **Lack capability abstraction**: Tied to specific implementations
- **Ignore observability**: No standard tracing or metrics
- **Miss the AI revolution**: Designed for deterministic processes only

---

## 2. The Case for Standardization

### The Drupal Revelation

In a conversation with James Abrahams, a Drupal architect, the core insight emerged:

> "Drupal has 5 execution models that can't talk to each other. ECA does one thing, Maestro does another, FlowDrop is visual, AI Agent Runner handles LLMs, and Minikanban is for task boards. If we can bring those 5 things together in Drupal, **why can't it be a standard that actually would work outside of Drupal or even outside of PHP?**"

This question sparked the development of OSSA. If a single CMS needs five different execution engines, and those engines could be unified under one schema, then that same schema could unify execution across *all* platforms.

### Similar Fragmentation Everywhere

The pattern repeats across ecosystems:

**Symfony Ecosystem:**
- Messenger (async processing)
- Workflow Component (state machines)
- Process Component (CLI commands)
- Scheduler (cron-like)

**Node.js Ecosystem:**
- BullMQ (Redis-based queues)
- Temporal (durable execution)
- n8n (workflow automation)
- Node-RED (IoT flows)

**Python Ecosystem:**
- Celery (distributed tasks)
- Prefect (dataflow)
- Dagster (data pipelines)
- Airflow (orchestration)
- LangGraph (AI agents)

Each tool solves a subset of the problem. None provides a portable, comprehensive solution.

### The AI Agent Inflection Point

The rise of AI agents creates an urgent need for standardization. Agents are:

- **Non-deterministic**: May take different paths each run
- **Tool-using**: Need capability abstraction
- **Composable**: May orchestrate other agents
- **Observable**: Require detailed tracing for debugging

Existing workflow tools weren't designed for this. OSSA was.

---

## 3. OSSA's Three Kinds

OSSA defines three fundamental kinds of executable manifests:

### 3.1 Task: Deterministic Execution

A **Task** is a deterministic, non-agentic unit of work. Tasks:

- Have a fixed execution path
- Require no LLM or AI
- Complete in bounded time
- Transform inputs to outputs predictably

```yaml
apiVersion: ossa/v0.3.0
kind: Task
metadata:
  name: send-email
  version: 1.0.0

spec:
  execution:
    type: deterministic
    runtime: any
    timeout_seconds: 30

  capabilities:
    - send_email
    - render_template

  input:
    type: object
    properties:
      to: { type: string, format: email }
      template: { type: string }
      variables: { type: object }

  output:
    type: object
    properties:
      message_id: { type: string }
      sent_at: { type: string, format: date-time }
```

**Use cases:**
- Send notifications
- Transform data
- Call external APIs
- Process batch records
- Execute database operations

### 3.2 Workflow: Composed Orchestration

A **Workflow** orchestrates multiple Tasks and/or Agents into a coordinated process. Workflows:

- Define step dependencies
- Support parallel execution
- Enable conditional branching
- Handle errors and compensation

```yaml
apiVersion: ossa/v0.3.0
kind: Workflow
metadata:
  name: content-approval
  version: 1.0.0

spec:
  triggers:
    - type: event
      event: content.submitted

  steps:
    - id: validate
      kind: Task
      ref: ./tasks/validate-content.yaml

    - id: review
      kind: Task
      ref: ./tasks/human-review.yaml
      depends_on: [validate]

    - id: publish
      kind: Task
      ref: ./tasks/publish-content.yaml
      condition: "${{ steps.review.output.approved == true }}"
      depends_on: [review]

    - id: notify
      kind: Agent
      ref: ./agents/notification-agent.yaml
      depends_on: [publish]
```

**Use cases:**
- Content approval pipelines
- Order processing
- User onboarding
- Data ETL pipelines
- CI/CD processes

### 3.3 Agent: Agentic Execution

An **Agent** is a non-deterministic, LLM-powered executor that reasons about tasks. Agents:

- Use LLMs for decision making
- Employ reasoning strategies (ReAct, CoT, ToT)
- Call tools/capabilities dynamically
- May orchestrate other agents

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: content-assistant
  version: 1.0.0

spec:
  model:
    provider: anthropic
    name: claude-sonnet-4-20250514

  system_prompt: |
    You are a content assistant that helps users
    create, edit, and publish content.

  capabilities:
    - create_content
    - edit_content
    - search_content
    - publish_content

  reasoning:
    strategy: react
    max_steps: 10
    trace_export: otel
```

**Use cases:**
- Content generation
- Customer support
- Code assistance
- Data analysis
- Research automation

---

## 4. Interoperability Architecture

### 4.1 Capability Abstraction

OSSA separates *what* an agent can do (capabilities) from *how* it does it (runtime bindings):

```yaml
# Manifest defines abstract capabilities
spec:
  capabilities:
    - send_email
    - create_entity
    - search_content

# Runtime binds to specific implementations
runtime:
  type: drupal
  bindings:
    send_email:
      plugin: "eca_mail:send"
    create_entity:
      service: "@entity_type.manager"
```

The same manifest can have different bindings for different runtimes:

| Capability | Drupal | Symfony | Node.js |
|------------|--------|---------|---------|
| `send_email` | `eca_mail:send` | `MailerInterface::send` | `nodemailer.sendMail` |
| `create_entity` | `entity_type.manager` | `EntityManager::persist` | `prisma.create` |
| `search_content` | `search_api` | `elasticsearch-php` | `@elastic/elasticsearch` |

### 4.2 Runtime Adapters

OSSA defines adapter specifications for major runtimes:

**Drupal Adapter:**
- Maps ECA → Task
- Maps Maestro → Workflow
- Maps AI Agent Runner → Agent
- Bidirectional sync supported

**Symfony Adapter:**
- Messenger for async execution
- Multiple transports (AMQP, Redis, SQS)
- Step orchestration for Workflows

**Node.js Adapter:**
- BullMQ integration
- Temporal support
- Native async/await execution

**Python Adapter:**
- Celery task mapping
- Prefect flow integration
- LangGraph agent support

### 4.3 Transport Independence

OSSA manifests don't dictate transport. The runtime adapter chooses:

```yaml
# Same manifest, different transports
runtime:
  type: symfony
  messenger:
    transport: amqp  # RabbitMQ
    # or: redis, doctrine, sqs
```

---

## 5. Benefits

### 5.1 Write Once, Run Anywhere

Define a Task in OSSA, execute it anywhere:

```yaml
# content-publisher.yaml - runs on any platform
apiVersion: ossa/v0.3.0
kind: Task
metadata:
  name: publish-content
spec:
  capabilities:
    - update_entity
    - clear_cache
    - send_notification
```

Execute with:
- `drush ossa:run task publish-content`
- `php bin/console ossa:dispatch task publish-content`
- `npx ossa run publish-content`
- `python -m ossa run publish-content`

### 5.2 Unified Observability

OSSA defines OpenTelemetry semantic conventions for all executions:

```
ossa.task.name = "publish-content"
ossa.task.version = "1.0.0"
ossa.execution.type = "deterministic"
ossa.runtime = "symfony"
ossa.step.id = "notify"
ossa.step.status = "completed"
ossa.agent.reasoning.strategy = "react"
ossa.agent.reasoning.step = 3
```

One dashboard shows:
- Task execution times across all runtimes
- Workflow step completion rates
- Agent reasoning traces
- Cross-system request flows

### 5.3 Cross-Ecosystem Sharing

Organizations can:

1. **Share manifests** between teams using different stacks
2. **Migrate workflows** from one platform to another
3. **Compose across ecosystems** (Drupal Task → Symfony Workflow → Python Agent)
4. **Centralize definitions** in a manifest registry

### 5.4 AI-Ready Architecture

OSSA was designed with AI agents in mind:

- **Reasoning strategies**: ReAct, Chain of Thought, Tree of Thought
- **Tool calling**: Abstract capability binding
- **Observability**: Full reasoning trace export
- **Guardrails**: Policy enforcement hooks
- **Multi-agent**: Agents can orchestrate agents

---

## 6. Adoption Path

### Phase 1: Define Tasks

Start by converting existing automation to OSSA Tasks:

```bash
# Drupal
drush ossa:export --engine=eca --output=manifests/

# Symfony
php bin/console ossa:export --source=messenger

# Analyze and consolidate
ossa validate manifests/*.yaml
```

### Phase 2: Introduce Workflows

Compose Tasks into Workflows:

```yaml
apiVersion: ossa/v0.3.0
kind: Workflow
metadata:
  name: unified-content-pipeline
spec:
  steps:
    - id: drupal-validate
      kind: Task
      ref: ossa://drupal/validate-content
    - id: python-analyze
      kind: Task
      ref: ossa://python/content-analysis
    - id: symfony-publish
      kind: Task
      ref: ossa://symfony/publish-to-cdn
```

### Phase 3: Add Agents

Introduce AI agents where reasoning is needed:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: content-optimizer
spec:
  capabilities:
    - analyze_content
    - suggest_improvements
    - apply_edits
```

### Phase 4: Full Orchestration

Use OSSA as the unified automation layer:

```
┌─────────────────────────────────────────┐
│           OSSA Manifest Registry        │
│  (Tasks, Workflows, Agents)             │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐  ┌─────▼─────┐  ┌───▼───┐
│Drupal │  │  Symfony  │  │Node.js│
│Adapter│  │  Adapter  │  │Adapter│
└───┬───┘  └─────┬─────┘  └───┬───┘
    │            │            │
    ▼            ▼            ▼
 [Drupal]   [Symfony]    [Node.js]
```

---

## 7. Conclusion

The fragmentation of automation tools is not inevitable. OSSA provides a path to unification—not by replacing existing tools, but by giving them a common language.

With OSSA:

- **Developers** write manifests once, deploy anywhere
- **Organizations** break free from platform lock-in
- **Teams** share workflows across technology boundaries
- **AI agents** have a standard way to be defined and composed
- **Observability** is unified across all executions

The question James Abrahams asked—"why can't it be a standard that would work outside of Drupal?"—has an answer. OSSA is that standard.

### Call to Action

1. **Explore OSSA**: Visit [openstandardagents.org](https://openstandardagents.org)
2. **Try the adapters**: Start with your primary stack
3. **Contribute**: Join the specification development
4. **Share manifests**: Publish reusable Tasks and Workflows
5. **Give feedback**: Help shape the v1.0 release

The future of automation is portable, observable, and AI-ready. The future is OSSA.

---

## Appendix A: Specification References

- OSSA v0.3.0 Specification: `spec/v0.3.0/README.md`
- Task Kind: `spec/v0.3.0/task.md`
- Workflow Kind: `spec/v0.3.0/workflow.md`
- Agent Kind: `spec/v0.3.0/agent.md`
- Capability Registry: `spec/v0.3.0/capability-schema.md`
- Drupal Adapter: `spec/v0.3.0/adapters/drupal.md`
- Symfony Adapter: `spec/v0.3.0/adapters/symfony.md`

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Task** | A deterministic, non-agentic unit of work |
| **Workflow** | An orchestration of Tasks and/or Agents |
| **Agent** | An LLM-powered executor with reasoning |
| **Capability** | An abstract action an executor can perform |
| **Runtime** | The platform executing a manifest |
| **Binding** | A mapping from capability to implementation |
| **Adapter** | A runtime-specific OSSA implementation |

---

*Document Version: 1.0.0*
*OSSA Specification Version: v0.3.0*
*Last Updated: December 2025*
