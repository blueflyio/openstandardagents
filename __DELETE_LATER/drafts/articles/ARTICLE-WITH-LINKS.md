## Open Standard for Software Agents ([OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction))

Version 1.0 | December 2025

Authors: Thomas Scola, Founder & CEO, [Bluefly.io](https://bluefly.io?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)

---

## Executive Summary

The AI agent ecosystem is experiencing the same fragmentation crisis that REST APIs faced before OpenAPI. With dozens of competing frameworks—LangChain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel—organizations are locked into vendor-specific implementations that don't interoperate. Enterprise adoption stalls as compliance requirements go unmet, and development teams waste resources rebuilding agents for each new platform.

OSSA ([Open Standard for Software Agents](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)) attempts at solving this by providing a declarative, vendor-neutral specification for defining AI agents. Just as OpenAPI standardized REST API definitions, [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) standardizes agent definitions—enabling true portability across frameworks, runtimes, and organizations.

Key Outcomes:

- Write once, deploy anywhere: Define agents in [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) format, execute on any compliant runtime  

- Framework independence: Switch between LangChain, CrewAI, OpenAI, Anthropic without code changes  

- Enterprise compliance: Built-in support for FedRAMP, NIST-800-53, SOC 2, HIPAA, GDPR  

- Unified task execution: Bridge disparate execution models (workflow engines, BPM, AI agents) with a single schema

---

## The Problem: M×N Framework Fragmentation

### The Current Landscape

Organizations building AI agents face a combinatorial explosion of choices:

| Layer                  | Options                                                            |
| :--------------------- | :----------------------------------------------------------------- |
| LLM Providers          | OpenAI, Anthropic, Google, Azure, Ollama, Mistral, Cohere          |
| Agent Frameworks       | LangChain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel, LangGraph |
| Tool Protocols         | MCP, A2A, OpenAPI, gRPC, GraphQL                                   |
| Execution Environments | Kubernetes, serverless, edge, browser                              |
| Compliance Regimes     | FedRAMP, SOC 2, HIPAA, GDPR, NIST                                  |

This creates an M×N integration problem: for M frameworks and N execution targets, teams must build M×N adapters. Each framework has proprietary agent definitions, tool schemas, and deployment patterns. Switching frameworks means rewriting everything.

### The Hidden Costs

- Vendor Lock-in: Once committed to LangChain or CrewAI, organizations find their agent definitions, tool configurations, and operational knowledge are non-transferable. Migration costs escalate with each deployed agent.

- Compliance Fragmentation: Enterprise security teams must audit each framework's approach to authentication, authorization, data boundaries, and audit logging. No standardized compliance model exists across frameworks.

- Operational Complexity: DevOps teams manage different deployment patterns for each framework. Observability, health monitoring, and lifecycle management vary wildly.

- Duplicated Effort: The open-source community rebuilds the same capabilities across frameworks. A well-designed agent in LangChain provides no value to CrewAI users.

### The Precedent: OpenAPI's Success

REST APIs faced identical challenges in the early 2010s. Each organization defined APIs differently. Documentation was inconsistent. Code generation was impossible. Interoperability was manual.

OpenAPI (originally Swagger) solved this by providing a machine-readable specification format. The result:

- Automated documentation generation  

- Cross-platform client SDK generation  

- Standardized security definitions  

- API gateway interoperability

Today, OpenAPI is the universal standard for REST API definition. [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) applies the same pattern to AI agents.

---

## The Solution: OSSA as the Universal Agent Schema

### Design Principles

1\. Specification, Not Implementation

[OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) is a schema standard, not a framework. It defines the contract for agent definition—compliant runtimes implement the execution. This mirrors OpenAPI's relationship to web frameworks: OpenAPI doesn't implement HTTP servers, it specifies the interface they expose.

2\. Framework-Agnostic Portability

An [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) manifest should execute correctly on any compliant runtime without modification. The same agent.yaml should work whether deployed to a LangChain runtime, an OpenAI Agents runtime, or a Kubernetes-native executor.

3\. Enterprise-First Design

Security, compliance, observability, and governance are first-class concerns, not afterthoughts. [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) includes standardized schemas for:

- Authentication and authorization models  

- Data boundary and PII handling  

- Audit trail and compliance logging  

- Human-in-the-loop approval flows

4\. Extensibility Without Fragmentation

Framework-specific features live in extension blocks that don't affect portability. A LangChain-specific optimization won't break execution on CrewAI—it simply won't apply.

### The OSSA Manifest Structure

See the [OSSA Manifest Schema Reference](https://openstandardagents.org/docs/schema-reference/ossa-manifest?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for complete documentation.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent

metadata:
  name: compliance-auditor
  version: "2.0.0"
  description: Enterprise compliance scanning agent
  labels:
    domain: security
    compliance: fedramp-high

spec:
  role: |
    You are a compliance auditor specializing in FedRAMP 
    and NIST-800-53 frameworks. You analyze infrastructure 
    configurations and identify compliance gaps.
  
  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229
    temperature: 0.3
  
  reasoning:
    strategy: chain_of_thought
    max_steps: 10
    trace_export:
      format: otel
      endpoint: ${OTEL_ENDPOINT}
  
  tools:
    - type: mcp
      server: cloud-scanner
      capabilities:
        - name: scan_aws_config
        - name: scan_kubernetes_rbac
        - name: check_encryption_status
  
  security:
    authentication:
      type: mtls
      certificate_ref: agent-cert
    data_boundaries:
      allowed_regions: [us-east-1, us-west-2]
      pii_handling: redact
  
  observability:
    metrics:
      enabled: true
      endpoint: ${PROMETHEUS_ENDPOINT}
    tracing:
      enabled: true
      sampling_rate: 0.1

extensions:
  langchain:
    memory_type: conversation_buffer
  kagent:
    kubernetes_namespace: agents-prod
```

Learn more about [agent specifications](https://openstandardagents.org/docs/schema-reference/agent-spec?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) and [capability definitions](https://openstandardagents.org/docs/schema-reference/agent-capabilities?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction).

### The Three kind Types

[OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) v0.3.0 introduces three resource types to cover the full spectrum of automated task execution. See the [OSSA Taxonomy](https://openstandardagents.org/docs/schema-reference/taxonomy?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for details:

| Kind     | Purpose                                      | LLM Required | Use Case                                                     |
| :------- | :------------------------------------------- | :----------- | :----------------------------------------------------------- |
| Agent    | Agentic loop with autonomous decision-making | Yes          | Complex reasoning, multi-step problem solving                |
| Task     | Deterministic step execution                 | No           | Data transformation, API orchestration, batch processing     |
| Workflow | Composition with conditions and branching    | Optional     | Business processes, approval flows, multi-agent coordination |

This taxonomy enables [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) to unify previously incompatible execution models. A workflow engine like Apache Airflow can execute kind: Task manifests. An AI agent runtime handles kind: Agent. Orchestration platforms manage kind: Workflow with embedded agents and tasks.

---

## Solving the Drupal Problem: Convergence of 5 Execution Models

### The Challenge

Drupal—the enterprise CMS powering government and healthcare—has developed five separate execution models that cannot interoperate:

1. ECA (Event-Condition-Action): Rule-based automation triggered by content events  

2. Maestro: Business Process Management (BPM) workflow engine  

3. FlowDrop: Visual DAG-based workflow builder  

4. AI Agent Runner: LLM-powered agent execution  

5. Minikanban: Task decomposition and management

Each model has its own definition format, execution engine, and operational model. A workflow defined in Maestro cannot trigger an ECA rule. An AI agent cannot participate in a FlowDrop pipeline.

### OSSA as the Unifying Layer

[OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) provides the common schema that bridges these models. See the [Drupal Integration Guide](https://openstandardagents.org/docs/integrations/drupal?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for implementation details:

| Drupal Model      | OSSA Equivalent                   | Mapping                                           |
| :---------------- | :-------------------------------- | :------------------------------------------------ |
| ECA rules         | kind: Task with triggers          | Event → condition → action maps to step execution |
| Maestro workflows | kind: Workflow                    | BPM stages map to workflow steps                  |
| FlowDrop DAGs     | kind: Workflow with visualization | Visual nodes map to steps with dependencies       |
| AI Agent Runner   | kind: Agent                       | Direct execution of agentic loops                 |
| Minikanban tasks  | kind: Task                        | Task items map to deterministic steps             |

With [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) adapters, a single workflow can:

- Start with an ECA trigger (content published)  

- Execute a Maestro approval flow  

- Invoke an AI agent for content analysis  

- Complete with automated publishing

### The Broader Implication

If [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) can unify Drupal's five models, it can unify any platform's execution models. The same pattern applies to:

- Symfony: Messenger queues, Workflow component, custom services  

- Laravel: Queues, events, scheduled tasks  

- Enterprise: ServiceNow, Salesforce, SAP integration

Explore [framework integrations](https://openstandardagents.org/docs/ecosystem/framework-support?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) and [architecture patterns](https://openstandardagents.org/docs/architecture/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction).

---

## v0.2.9 Feature Highlights

### Reasoning Strategies

OSSA v0.2.9 introduced declarative reasoning configuration. See the [Agent Spec documentation](https://openstandardagents.org/docs/schema-reference/agent-spec?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for details:

```yaml
spec:
  reasoning:
    strategy: react  # or chain_of_thought, tree_of_thought
    max_steps: 15
    max_depth: 5
    trace_export:
      format: otel
      endpoint: https://traces.example.com
    self_reflection:
      enabled: true
      confidence_threshold: 0.7
```

This standardizes how agents approach complex problems—ensuring consistent behavior across runtimes and enabling compliance auditing of reasoning chains.

### Prompt Management

Enterprise-grade prompt templating with versioning:

```yaml
spec:
  prompts:
    system:
      template_file: ./prompts/system-v2.txt
      version: "2.1.0"
    few_shot_examples:
      - role: user
        content: "Analyze this log file for security issues"
      - role: assistant
        content: "I'll examine the log for..."
    registry:
      provider: langfuse
      project_id: compliance-agents
```

### Knowledge Graph Integration

Native support for graph database backends:

```yaml
spec:
  knowledge_graph:
    provider: neo4j
    connection:
      uri: ${NEO4J_URI}
      credentials_ref: neo4j-secret
    schema_constraints:
      entity_types: [Person, Organization, Document]
      relationship_types: [AUTHORED, BELONGS_TO, REFERENCES]
    sync_mode: real_time
```

### Multi-Framework Extensions

v0.2.9 supports 16+ framework extensions. See the [Ecosystem Overview](https://openstandardagents.org/docs/ecosystem/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for complete list:

- agents_md: OpenAI repository-level agent guidance  

- kagent: Kubernetes-native execution  

- mcp: Model Context Protocol integration  

- a2a: Agent-to-Agent protocol support  

- langchain, crewai, autogen, llamaindex, langgraph  

- anthropic, openai_agents, google_adk  

- cursor, langflow, vercel_ai  

- drupal, buildkit, librechat

See [migration guides](https://openstandardagents.org/docs/migration-guides?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for converting from these frameworks to OSSA.

---

## Enterprise Compliance Architecture

### Security Model

[OSSA's](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) security schema addresses enterprise requirements. See [Enterprise Benefits](https://openstandardagents.org/docs/for-audiences/enterprises?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) and [Enterprise Compliance Use Cases](https://openstandardagents.org/docs/use-cases/enterprise-compliance?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction):

```yaml
spec:
  security:
    authentication:
      type: oauth2  # bearer, mtls, apikey, none
      credentials_ref: oauth-client-secret
      scopes: [read:resources, write:reports]
    
    authorization:
      rbac:
        enabled: true
        roles_ref: agent-roles-configmap
      abac:
        enabled: true
        policy_ref: opa-policy
    
    data_boundaries:
      allowed_regions: [us-east-1, eu-west-1]
      pii_handling: redact
      data_classification: confidential
    
    audit:
      enabled: true
      log_level: detailed
      retention_days: 2555  # 7 years for FedRAMP
```

### Compliance Profiles

Pre-built profiles for common frameworks:

| Profile      | Controls                | Audit Requirements                      |
| :----------- | :---------------------- | :-------------------------------------- |
| fedramp-high | NIST 800-53 Rev 5       | Continuous monitoring, 7-year retention |
| soc2-type2   | Trust Services Criteria | Annual audit, encryption at rest        |
| hipaa        | HIPAA Security Rule     | PHI handling, access controls           |
| gdpr         | EU GDPR                 | Data subject rights, consent management |

### Human-in-the-Loop

```yaml
spec:
  safety:
    human_in_the_loop:
      required_actions:
        - delete_production_data
        - approve_deployment
        - authorize_external_api
      approval_flow:
        type: multi_party
        required_approvers: 2
        timeout_action: reject
```

---

## Implementation Roadmap

### Current State (v0.2.9)

- Complete JSON Schema specification - [View Schema](https://openstandardagents.org/schema?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- TypeScript SDK with validation - [CLI Reference](https://openstandardagents.org/docs/cli-reference?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- CLI for validation, generation, migration - [Installation Guide](https://openstandardagents.org/docs/getting-started/installation?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- OpenAI runtime adapter (reference implementation) - [OpenAI Adapter](https://openstandardagents.org/docs/adapters/openai-adapter?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- 16+ framework extensions - [Ecosystem Overview](https://openstandardagents.org/docs/ecosystem/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- npm package: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)

Looking ahead, the roadmap includes near-term priorities (v0.3.0 - Q1 2026) such as kind: Task and kind: Workflow schema finalization ([Schema Reference](https://openstandardagents.org/docs/schema-reference?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)), a Drupal runtime adapter for ECA/Maestro/FlowDrop integration ([Drupal Integration](https://openstandardagents.org/docs/integrations/drupal?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)), Symfony Messenger runtime adapter, expanded conformance test suite, and GitLab Duo native integration ([GitLab Integration](https://openstandardagents.org/docs/cli-reference/ossa-gitlab-agent?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)). Medium-term goals (v0.4.0 - Q2 2026) include a Python SDK, LangChain/CrewAI native adapters ([Migration Guides](https://openstandardagents.org/docs/migration-guides/langchain-to-ossa?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)), visual workflow builder specification, and a certification program for runtime compliance. Long-term vision (v1.0 - Q4 2026) encompasses Linux Foundation governance model, industry working groups, reference architecture for enterprise deployment ([Architecture Documentation](https://openstandardagents.org/docs/architecture/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)), and formal standardization process.

---

## Getting Started

### Installation

See the [Installation Guide](https://openstandardagents.org/docs/getting-started/installation?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for detailed instructions:

```shell
npm install -g @bluefly/openstandardagents
```

### Create Your First Agent

Follow the [Hello World Tutorial](https://openstandardagents.org/docs/getting-started/hello-world?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) or [First Agent Guide](https://openstandardagents.org/docs/getting-started/first-agent?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction):

```shell
ossa init my-agent
cd my-agent
ossa validate my-agent.ossa.yaml
ossa run my-agent.ossa.yaml
```

See the [CLI Reference](https://openstandardagents.org/docs/cli-reference?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for all commands.

### Export to Your Framework

Use the [export command](https://openstandardagents.org/docs/cli-reference/ossa-export?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) to convert OSSA manifests:

```shell
ossa export --to langchain
ossa export --to crewai
ossa export --to cursor
```

See [migration guides](https://openstandardagents.org/docs/migration-guides?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) for framework-specific instructions.

---

## Conclusion

The AI agent ecosystem stands at an inflection point. Without standardization, enterprises will face increasing costs, compliance risks, and operational complexity. OSSA provides the path forward—a vendor-neutral specification that enables true agent portability while meeting enterprise requirements.

OSSA: Write once, deploy anywhere. The OpenAPI for AI Agents.

---

## Resources

- Website: [openstandardagents.org](https://openstandardagents.org?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- Documentation: [Complete Docs](https://openstandardagents.org/docs?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- Specification: [Schema Reference](https://openstandardagents.org/docs/schema-reference?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- Examples: [Examples Catalog](https://openstandardagents.org/examples?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- npm: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- Getting Started: [5-Minute Overview](https://openstandardagents.org/docs/getting-started/5-minute-overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- For Enterprises: [Enterprise Guide](https://openstandardagents.org/docs/for-audiences/enterprises?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)  

- For Architects: [Architecture Overview](https://openstandardagents.org/docs/architecture/overview?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)

---

## About the Author

Thomas Scola is the Founder & CEO of Bluefly.io and the creator of [OSSA](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction), the Open Standard for Systemic Agents. With more than 23 years in digital strategy and platform engineering—including a decade in senior roles at Acquia and GitLab—he brings deep expertise in enterprise architecture, open-source governance, and AI-driven orchestration. Bluefly.io is a GitLab-partnered, cloud-native consultancy delivering Drupal, AI, and platform engineering solutions for government, healthcare, and large-scale enterprise environments.

Learn more [About OSSA](https://openstandardagents.org/about?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction) and the [OSSA Project](https://openstandardagents.org/?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction).

---

*Apache 2.0 Licensed | © 2025 Open Standard Agents Project | [License](https://openstandardagents.org/license?utm_source=medium&utm_medium=article&utm_campaign=ossa-introduction)*

