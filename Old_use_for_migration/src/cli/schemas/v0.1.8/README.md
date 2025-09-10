# OAAS Schemas Directory

This directory contains comprehensive JSON Schema definitions for all OAAS resource types, supporting the progressive complexity model from minimal discovery to enterprise-grade governance.

## 🎯 Progressive Agent Schemas

### Agent Complexity Levels

| Level | Schema File | Description | Use Case |
|-------|-------------|-------------|----------|
| **0** | `agent-minimal.yml` | 7-line minimal (discovery only) | Quick agent registration |
| **1** | `agent-basic.yml` | 30-line basic (MCP ready) | Claude Desktop integration |
| **2** | `agent-integration.yml` | 50-line integration-ready | Multi-framework support |
| **3** | `agent-production.yml` | 200-line production | Enterprise deployment |
| **4** | `agent-enterprise.yml` | 400+ line enterprise | Full governance & compliance |
| **Legacy** | `agent-advanced.yml` | Legacy enterprise schema | Backward compatibility |

### Example Progression

```yaml
# Level 0: Minimal (agent-minimal.yml)
name: my-agent
version: "1.0.0"
expertise: "Code analysis and optimization"
capabilities:
  - code_analysis: "Analyzes code quality"

# Level 1: Basic (agent-basic.yml)
name: my-agent
version: "1.0.0"
expertise: "Advanced code analysis with multiple framework support"
capabilities:
  - name: code_analysis
    description: "Comprehensive code quality analysis"
frameworks:
  mcp: enabled
  langchain: enabled

# Level 2: Integration (agent-integration.yml) - adds OpenAPI, auth, monitoring
# Level 3: Production (agent-production.yml) - adds security, compliance, resources
# Level 4: Enterprise (agent-enterprise.yml) - adds full governance, certifications
```

## 🏗️ Workspace Schemas

### Workspace Configuration Types

| Schema File | Description | Features |
|-------------|-------------|----------|
| `agent-workspace.yml` | Basic workspace configuration | Simple discovery and orchestration |
| `workspace-enterprise.yml` | Enterprise workspace | Full UADP, multi-region, compliance |
| `orchestration-rules.yml` | Advanced orchestration patterns | 6 patterns, security, monitoring |
| `governance-configuration.yml` | Comprehensive governance | ISO 42001, NIST AI RMF, EU AI Act |

## 📋 Schema Validation Levels

### Validation Strategy
- **Level 0-1**: Permissive validation for rapid adoption
- **Level 2-3**: Structured validation with security requirements
- **Level 4**: Strict validation with compliance enforcement

### Usage in Tools
```bash
# TDDAI validation commands use these schemas
tddai agents validate-openapi --level=2 agent.yml
tddai agents validate-compliance --framework=iso-42001 agent.yml

# OAAS CLI validation
oaas validate agent.yml --target-level=3
oaas upgrade agent.yml --from-level=1 --to-level=3
```

## 🎨 Schema Features

### Enterprise Patterns Included

#### Agent Enterprise Schema Features
- **UADP Annotations**: Universal Agent Discovery Protocol metadata
- **Framework Compatibility**: LangChain, CrewAI, OpenAI, Anthropic, Google, AutoGen, MCP
- **Resource Specifications**: Kubernetes-style CPU/Memory/GPU requirements
- **Security Configuration**: Authentication, authorization, encryption, network security
- **Compliance Frameworks**: ISO 42001, NIST AI RMF, EU AI Act, SOX, HIPAA, GDPR
- **Performance Optimization**: Circuit breakers, caching, retry logic, token management
- **Monitoring & Observability**: Metrics, tracing, logging, alerting, health checks
- **Deployment Configuration**: Multi-environment, scaling, rollout strategies

#### Workspace Enterprise Schema Features
- **Multi-Region Deployment**: AWS/GCP/Azure regions with disaster recovery
- **Advanced Orchestration**: 6 orchestration patterns with intelligent routing
- **Cost Management**: Budget controls, token optimization, cost-aware routing
- **Discovery Engine**: Capability-based, load-aware, geo-aware routing
- **Security Policies**: Zero trust, RBAC/ABAC, encryption, incident response
- **Compliance Monitoring**: Automated compliance checking and reporting

#### Orchestration Rules Schema Features
- **Routing Strategies**: Intelligent routing with capability matching
- **Orchestration Patterns**: Sequential, Parallel, Fan-out, Pipeline, MapReduce, Circuit Breaker
- **Team-Based Routing**: RBAC with budget and rate limiting
- **Cost Optimization**: Token budgets, model selection, caching strategies
- **Coordination Mechanisms**: Consensus, conflict resolution, load balancing
- **Security & Compliance**: Inter-agent auth, audit trails, data governance

#### Governance Configuration Schema Features
- **ISO 42001:2023**: Complete AI Management System framework
- **NIST AI RMF 1.0**: All four functions (Govern, Map, Measure, Manage)
- **EU AI Act**: High-risk system requirements and conformity assessment
- **SOX Compliance**: Financial controls for public companies
- **HIPAA Safeguards**: Administrative, physical, and technical controls
- **Security Governance**: Comprehensive policies and vulnerability management
- **Risk Management**: ISO 31000-based framework with KRIs
- **Data Governance**: Classification, lifecycle, privacy, and quality management

## 🔧 Schema Validation Tools

### Built-in Validation
All schemas include:
- **Pattern Validation**: Regex patterns for identifiers and versions
- **Enum Constraints**: Controlled vocabularies for consistency
- **Range Validation**: Min/max values for numeric fields
- **Format Validation**: URI, email, date formats
- **Conditional Logic**: Required fields based on configuration levels

### Custom Validators
```yaml
# Example validation rules
properties:
  name:
    pattern: '^[a-z0-9-]+$'  # Kebab-case identifiers
  version:
    pattern: '^[0-9]+\.[0-9]+\.[0-9]+$'  # Semantic versioning
  capabilities:
    minItems: 1  # At least one capability required
    items:
      oneOf:  # Support both string and object formats
        - type: string
        - type: object
```

## 📚 Usage Examples

### Agent Schema Evolution
```bash
# Start with minimal agent
echo 'name: my-agent
version: "1.0.0"  
expertise: "Code analysis"
capabilities: ["analyze_code"]' > agent.yml

# Upgrade to basic level
oaas upgrade agent.yml --to-level=1

# Add OpenAPI and security for production
oaas upgrade agent.yml --to-level=3

# Full enterprise with governance
oaas upgrade agent.yml --to-level=4
```

### Workspace Configuration
```bash
# Basic workspace setup
oaas init workspace --type=basic

# Enterprise workspace with compliance
oaas init workspace --type=enterprise --compliance=iso-42001,sox,hipaa

# Add orchestration rules
oaas add orchestration-rules --patterns=sequential,parallel,fanout
```

## 🎯 Next Steps

### Schema Evolution Roadmap
1. **v1.2 Enhancements**: Incorporate enterprise patterns from real-world deployments
2. **Framework Extensions**: Add support for emerging AI frameworks
3. **Compliance Updates**: Stay current with evolving regulations
4. **Performance Optimization**: Enhanced caching and routing strategies
5. **Security Hardening**: Advanced threat protection and zero trust features

### Integration Points
- **TDDAI CLI**: Native schema validation and agent generation
- **MCP Bridges**: Automatic bridge generation from schemas  
- **Framework Adapters**: Direct export to LangChain, CrewAI, OpenAI formats
- **Compliance Tools**: Automated compliance reporting and certification
- **Monitoring Integration**: Native metrics and observability configuration