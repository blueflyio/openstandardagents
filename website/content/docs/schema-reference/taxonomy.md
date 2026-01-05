---
title: "Taxonomy"
description: "Agent classification by domain, subdomain, and capability"
weight: 5
---

# Taxonomy Object

The `taxonomy` object in `spec.taxonomy` classifies agents by functional domain, subdomain, and specific capability. This enables agent discovery, organization, routing, and analytics.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `domain` | string | **Yes** | Primary domain classification. Examples: `infrastructure`, `security`, `compliance`, `documentation` |
| `subdomain` | string | No | Secondary classification within domain. Examples: `kubernetes`, `vulnerability`, `generation` |
| `capability` | string | No | Specific capability or function. Examples: `troubleshooting`, `scanning`, `optimization` |

## Purpose

Taxonomy provides hierarchical classification for:

- **Discovery** - Find agents by functional area: "Show me all security agents"
- **Organization** - Group related agents in dashboards and registries
- **Routing** - Direct user requests to specialized agents
- **Analytics** - Track agent usage and performance by category
- **Documentation** - Auto-generate agent catalogs organized by domain

## Examples

### Infrastructure Domain

```yaml
# Kubernetes troubleshooting
taxonomy:
  domain: infrastructure
  subdomain: kubernetes
  capability: troubleshooting

# Container optimization
taxonomy:
  domain: infrastructure
  subdomain: containers
  capability: optimization

# Network diagnostics
taxonomy:
  domain: infrastructure
  subdomain: networking
  capability: diagnostics

# Database performance tuning
taxonomy:
  domain: infrastructure
  subdomain: databases
  capability: performance-tuning
```

### Security Domain

```yaml
# Vulnerability scanning
taxonomy:
  domain: security
  subdomain: vulnerability-management
  capability: scanning

# Threat detection
taxonomy:
  domain: security
  subdomain: threat-intelligence
  capability: detection

# Access control review
taxonomy:
  domain: security
  subdomain: identity-access-management
  capability: audit

# Security policy enforcement
taxonomy:
  domain: security
  subdomain: compliance
  capability: policy-enforcement
```

### Compliance Domain

```yaml
# GDPR compliance checking
taxonomy:
  domain: compliance
  subdomain: data-privacy
  capability: gdpr-audit

# SOC 2 reporting
taxonomy:
  domain: compliance
  subdomain: audit
  capability: soc2-reporting

# Policy validation
taxonomy:
  domain: compliance
  subdomain: governance
  capability: policy-validation

# Risk assessment
taxonomy:
  domain: compliance
  subdomain: risk-management
  capability: assessment
```

### Documentation Domain

```yaml
# API documentation generation
taxonomy:
  domain: documentation
  subdomain: api
  capability: generation

# Code commenting
taxonomy:
  domain: documentation
  subdomain: code
  capability: annotation

# User guide writing
taxonomy:
  domain: documentation
  subdomain: user-guides
  capability: authoring

# Technical diagram creation
taxonomy:
  domain: documentation
  subdomain: diagrams
  capability: generation
```

### Development Domain

```yaml
# Code review
taxonomy:
  domain: development
  subdomain: quality-assurance
  capability: code-review

# Test generation
taxonomy:
  domain: development
  subdomain: testing
  capability: test-generation

# Refactoring
taxonomy:
  domain: development
  subdomain: maintenance
  capability: refactoring

# Bug fixing
taxonomy:
  domain: development
  subdomain: debugging
  capability: bug-fixing
```

### Data Domain

```yaml
# Data analysis
taxonomy:
  domain: data
  subdomain: analytics
  capability: exploratory-analysis

# Data quality checking
taxonomy:
  domain: data
  subdomain: quality
  capability: validation

# ETL pipeline management
taxonomy:
  domain: data
  subdomain: engineering
  capability: pipeline-management

# Machine learning model training
taxonomy:
  domain: data
  subdomain: machine-learning
  capability: model-training
```

### Operations Domain

```yaml
# Incident response
taxonomy:
  domain: operations
  subdomain: incident-management
  capability: response

# Change management
taxonomy:
  domain: operations
  subdomain: change-control
  capability: approval

# Capacity planning
taxonomy:
  domain: operations
  subdomain: resource-management
  capability: capacity-planning

# Cost optimization
taxonomy:
  domain: operations
  subdomain: finops
  capability: cost-optimization
```

### Customer Support Domain

```yaml
# Technical support
taxonomy:
  domain: customer-support
  subdomain: technical
  capability: troubleshooting

# Account management
taxonomy:
  domain: customer-support
  subdomain: accounts
  capability: management

# Knowledge base maintenance
taxonomy:
  domain: customer-support
  subdomain: knowledge-management
  capability: content-curation

# Customer onboarding
taxonomy:
  domain: customer-support
  subdomain: onboarding
  capability: guidance
```

## Hierarchical Structure

Taxonomy follows a three-level hierarchy:

```
domain (required)
  └── subdomain (optional)
      └── capability (optional)
```

**Specificity increases at each level:**

```yaml
# Broad classification
taxonomy:
  domain: security

# More specific
taxonomy:
  domain: security
  subdomain: vulnerability-management

# Most specific
taxonomy:
  domain: security
  subdomain: vulnerability-management
  capability: container-scanning
```

## Common Domain Values

| Domain | Description | Example Subdomains |
|--------|-------------|-------------------|
| `infrastructure` | Infrastructure management and operations | `kubernetes`, `containers`, `networking`, `storage` |
| `security` | Security and threat management | `vulnerability-management`, `threat-intelligence`, `identity-access-management` |
| `compliance` | Compliance, governance, and risk | `data-privacy`, `audit`, `risk-management`, `governance` |
| `documentation` | Documentation creation and maintenance | `api`, `code`, `user-guides`, `diagrams` |
| `development` | Software development and engineering | `quality-assurance`, `testing`, `debugging`, `maintenance` |
| `data` | Data management and analytics | `analytics`, `quality`, `engineering`, `machine-learning` |
| `operations` | IT operations and service management | `incident-management`, `change-control`, `resource-management` |
| `customer-support` | Customer service and support | `technical`, `accounts`, `knowledge-management`, `onboarding` |
| `finance` | Financial operations and analysis | `accounting`, `budgeting`, `forecasting`, `reporting` |
| `marketing` | Marketing and communications | `content`, `campaigns`, `analytics`, `automation` |
| `sales` | Sales operations and enablement | `pipeline`, `forecasting`, `enablement`, `crm` |
| `hr` | Human resources and people operations | `recruiting`, `onboarding`, `performance`, `benefits` |

## Naming Conventions

### Domain Names
- Lowercase
- Hyphenated for multi-word domains
- Broad categories
- Examples: `infrastructure`, `customer-support`, `data-privacy`

### Subdomain Names
- Lowercase
- Hyphenated for multi-word subdomains
- More specific than domain
- Examples: `kubernetes`, `threat-intelligence`, `quality-assurance`

### Capability Names
- Lowercase
- Hyphenated for multi-word capabilities
- Action-oriented or functional
- Examples: `troubleshooting`, `scanning`, `code-review`, `test-generation`

## Complete Examples

### Infrastructure Kubernetes Troubleshooting Agent

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: k8s-troubleshooter
  version: 1.0.0
  description: Kubernetes cluster troubleshooting and diagnostics agent
  labels:
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting

spec:
  taxonomy:
    domain: infrastructure
    subdomain: kubernetes
    capability: troubleshooting

  role: |
    You are a Kubernetes troubleshooting expert specializing in
    diagnosing pod failures, resource constraints, networking issues,
    and cluster health problems.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.3

  tools:
    - type: kubernetes
      capabilities:
        - get_pods
        - get_logs
        - describe_pod
        - get_events
```

### Security Vulnerability Scanner

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: vulnerability-scanner
  version: 2.1.0
  description: Automated security vulnerability scanner for container images and dependencies
  labels:
    domain: security
    subdomain: vulnerability-management
    capability: scanning

spec:
  taxonomy:
    domain: security
    subdomain: vulnerability-management
    capability: scanning

  role: |
    You are a security vulnerability scanning specialist. Analyze container
    images, dependency manifests, and source code for known vulnerabilities.
    Provide severity ratings and remediation recommendations.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.2

  tools:
    - type: mcp
      server: filesystem
    - type: http
      name: trivy
      endpoint: https://trivy.example.com/api
```

### Documentation Generator

```yaml
apiVersion: ossa/v0.3.x
kind: Agent
metadata:
  name: api-doc-generator
  version: 1.5.0
  description: Automated API documentation generator from OpenAPI specs
  labels:
    domain: documentation
    subdomain: api
    capability: generation

spec:
  taxonomy:
    domain: documentation
    subdomain: api
    capability: generation

  role: |
    You are an API documentation specialist. Generate comprehensive,
    accurate, and user-friendly API documentation from OpenAPI/Swagger
    specifications. Include examples, authentication guides, and best practices.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.4
    maxTokens: 8192

  tools:
    - type: mcp
      server: filesystem
    - type: http
      name: swagger-parser
      endpoint: https://parser.swagger.io/api
```

## Label Alignment

Best practice: Align `metadata.labels` with `spec.taxonomy`:

```yaml
metadata:
  name: code-reviewer
  labels:
    domain: development                    # Matches taxonomy.domain
    subdomain: quality-assurance          # Matches taxonomy.subdomain
    capability: code-review               # Matches taxonomy.capability
    team: platform-engineering            # Additional organizational label
    environment: production               # Deployment-specific label

spec:
  taxonomy:
    domain: development
    subdomain: quality-assurance
    capability: code-review
```

This enables filtering by both:
- **Labels** - For Kubernetes-style selection and filtering
- **Taxonomy** - For agent-specific functional categorization

## Discovery Patterns

### Find all security agents
```yaml
# Query by taxonomy.domain
SELECT * WHERE taxonomy.domain = 'security'
```

### Find Kubernetes troubleshooting agents
```yaml
# Query by taxonomy.subdomain
SELECT * WHERE taxonomy.subdomain = 'kubernetes'
  AND taxonomy.capability = 'troubleshooting'
```

### Find all scanning capabilities
```yaml
# Query by taxonomy.capability
SELECT * WHERE taxonomy.capability LIKE '%scanning%'
```

## Best Practices

1. **Be consistent** - Use standardized domain/subdomain values across agents
2. **Be specific** - Use all three levels when possible
3. **Align with labels** - Mirror taxonomy in metadata.labels
4. **Document domains** - Maintain a domain registry for your organization
5. **Use hyphens** - Always use `kebab-case` for multi-word values
6. **Start broad** - Begin with domain, add subdomain and capability as needed
7. **Avoid overlaps** - Don't duplicate information across levels
8. **Think hierarchical** - Each level should narrow the scope
9. **Enable routing** - Design taxonomy to support agent selection logic
10. **Plan for growth** - Leave room for new subdomains and capabilities

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing taxonomy
- [OSSA Manifest](./ossa-manifest.md) - Metadata labels alignment
- [Examples](/docs/examples) - Real-world taxonomy usage

## Validation

- `domain` is **required**
- `subdomain` and `capability` are optional
- All values are strings with no format restrictions
- Recommended: Use lowercase with hyphens (`kebab-case`)
