# OSSA Agent Naming Conventions Standard

**Version:** 1.0.0  
**OSSA Compatibility:** 0.1.8+  
**Status:** Production Ready  
**Last Updated:** September 6, 2025

## Abstract

This document establishes standardized naming conventions for AI agents within the OSSA (Open Standards for Scalable Agents) ecosystem. These conventions ensure consistency, discoverability, and maintainability across all agent implementations while supporting the Universal Agent Discovery Protocol (UADP) and multi-framework interoperability.

##  Core Principles

### 1. Consistency & Predictability
- Uniform naming patterns across all agent types and domains
- Predictable structure that aids in discovery and categorization
- Clear mapping between agent names and their capabilities

### 2. Framework Agnostic
- Naming conventions work across LangChain, CrewAI, AutoGen, OpenAI, and custom frameworks
- No framework-specific prefixes or suffixes unless explicitly required
- Support for multi-framework agents

### 3. Enterprise Ready
- Professional naming suitable for enterprise environments
- Compliance with organizational naming policies
- Audit-trail friendly identifiers

### 4. UADP Compatible
- Names that support Universal Agent Discovery Protocol
- Hierarchical structure for efficient discovery queries
- Capability inference from naming patterns

##  Naming Convention Structure

### Standard Format

```
[scope-]<domain|function>-<role|specialization>[-framework]
```

### Component Definitions

#### Scope (Optional)
Used for organizational or categorical grouping:

- `ossa` - OSSA platform agents
- `api` - API-focused agents  
- `security` - Security-related agents
- `compliance` - Compliance and governance agents
- `enterprise` - Enterprise-specific agents

#### Domain/Function (Required)
The primary area of expertise or functional category:

- `openapi` - OpenAPI specification work
- `workflow` - Workflow management
- `research` - Research and analysis
- `security` - Security assessment
- `compliance` - Compliance checking
- `config` - Configuration management
- `monitoring` - System monitoring
- `orchestration` - Agent coordination

#### Role/Specialization (Required)
The specific role or specialization within the domain:

- `expert` - Domain expertise and consultation
- `validator` - Validation and verification
- `auditor` - Auditing and assessment
- `orchestrator` - Coordination and management
- `analyzer` - Analysis and investigation
- `generator` - Content or code generation
- `monitor` - Monitoring and observation
- `assistant` - General assistance within domain

#### Framework (Optional)
Only used when agent is framework-specific:

- `langchain` - LangChain-specific implementation
- `crewai` - CrewAI-specific implementation  
- `autogen` - AutoGen-specific implementation
- `openai` - OpenAI-specific implementation

## 📋 Naming Examples

### Standard Agent Names

```yaml
# Domain expertise agents
openapi-expert                    # OpenAPI specification expert
security-auditor                  # Security assessment specialist
workflow-orchestrator             # Workflow coordination agent
research-analyst                  # Research and analysis agent
compliance-validator              # Compliance checking agent

# OSSA platform agents  
ossa-compliance-auditor           # OSSA-specific compliance auditor
ossa-spec-validator               # OSSA specification validator
api-documentation-generator       # API documentation specialist

# Enterprise agents
enterprise-governance-monitor     # Enterprise governance monitoring
enterprise-security-assessor      # Enterprise security assessment
```

### Framework-Specific Agents

```yaml
# When framework specificity is required
research-expert-langchain         # LangChain research implementation
workflow-orchestrator-crewai      # CrewAI workflow coordinator
security-auditor-autogen          # AutoGen security auditor
```

### Multi-Capability Agents

```yaml
# Hybrid agents with multiple specializations
api-security-validator           # API + Security validation
research-compliance-auditor      # Research with compliance checking
workflow-security-orchestrator   # Secure workflow orchestration
```

## 🏷 Agent Metadata Integration

### YAML Configuration

```yaml
# agent.yml
metadata:
  name: openapi-expert              # Follows naming convention
  namespace: api-specialists        # Organizational grouping
  version: "1.0.0"
  description: Expert OpenAPI 3.1.0 specification agent
  labels:
    domain: api                     # Maps to naming domain
    specialization: expert          # Maps to naming role
    framework: framework-agnostic   # Multi-framework support
    tier: advanced                  # OSSA conformance tier
  annotations:
    ossa.io/naming-convention: "v1.0.0"
    ossa.io/discovery-priority: "high"
    ossa.io/capability-inference: "enabled"
```

### OpenAPI Integration

```yaml
# openapi.yaml
info:
  title: OpenAPI Expert Agent API
  x-agent-metadata:
    canonical_name: openapi-expert  # Primary identifier
    display_name: "OpenAPI Expert"  # Human-friendly name
    naming_convention: "ossa-v1.0.0"
    discovery_tags:
      - openapi
      - expert
      - validation
      - specification
```

##  Discovery Protocol Support

### UADP Query Patterns

```bash
# Query by domain
ossa agents discover --domain openapi
# Returns: openapi-expert, openapi-validator, api-documentation-generator

# Query by role  
ossa agents discover --role expert
# Returns: openapi-expert, security-expert, workflow-expert

# Query by scope
ossa agents discover --scope ossa
# Returns: ossa-compliance-auditor, ossa-spec-validator

# Combined queries
ossa agents discover --domain security --role auditor
# Returns: security-auditor, enterprise-security-assessor
```

### Discovery Metadata

```yaml
discovery:
  uadp_enabled: true
  naming_metadata:
    domain: "openapi"
    role: "expert" 
    scope: null
    framework: "framework-agnostic"
  search_tags:
    - domain_tags: ["api", "openapi", "specification"]
    - role_tags: ["expert", "specialist", "advisor"]
    - capability_tags: ["validation", "generation", "analysis"]
```

##  Validation Rules

### Mandatory Requirements

1. **Length Constraints**
   - Minimum: 5 characters
   - Maximum: 63 characters (DNS compatible)
   - Must not be empty or whitespace-only

2. **Character Rules**
   - Use lowercase letters, numbers, and hyphens only
   - Must start and end with alphanumeric character
   - No consecutive hyphens
   - No underscores or special characters

3. **Structure Requirements**
   - Must contain at least domain and role components
   - Components separated by single hyphens
   - No trailing or leading hyphens

### Recommended Practices

1. **Clarity Over Brevity**
   - Choose descriptive names over short abbreviations
   - Prefer `security-auditor` over `sec-aud`
   - Use full words when possible

2. **Consistency Across Teams**
   - Standardize domain and role vocabularies
   - Document organizational naming guidelines
   - Use shared naming registries for large deployments

3. **Future-Proof Naming**
   - Avoid version numbers in names
   - Use capabilities rather than implementation details
   - Plan for agent evolution and upgrades

## 🚫 Anti-Patterns

### Avoid These Patterns

```yaml
# ❌ Bad Examples
AI-Agent                          # Too generic, uppercase
myAgent123                        # CamelCase, generic
langchain_research_bot           # Underscores, "bot" suffix
SuperSmartAI                     # Marketing language, CamelCase
agent-v2-final                   # Version numbers, unclear
research_agent_2024              # Underscores, dates
```

### Common Mistakes

1. **Generic Names**: `agent`, `ai-bot`, `assistant`
2. **Framework Coupling**: Always prefixing with framework name
3. **Version Numbers**: Including versions in the name
4. **Marketing Language**: "super", "smart", "advanced", "revolutionary"
5. **Implementation Details**: Technology stack references
6. **Inconsistent Separators**: Mixing hyphens and underscores

##  Implementation Guidelines

### CLI Integration

```bash
# OSSA CLI supports naming validation
ossa create openapi-expert --validate-name
ossa validate agent.yml --check-naming
ossa list --filter-by-naming-pattern "security-*"
```

### Automated Validation

```typescript
// TypeScript validation example
import { validateAgentName } from '@ossa/naming-conventions';

const result = validateAgentName('openapi-expert');
// Returns: { valid: true, components: { domain: 'openapi', role: 'expert' } }

const invalid = validateAgentName('AI_Agent');  
// Returns: { valid: false, errors: ['Contains invalid characters', 'Generic name'] }
```

### Registry Integration

```yaml
# Agent registry entry
agents:
  openapi-expert:
    naming_compliance: "ossa-v1.0.0"
    domain: "openapi"
    role: "expert"
    discovery_priority: "high"
    last_validated: "2025-09-06T10:30:00Z"
```

##  Conformance Levels

### Bronze Level (Minimum Compliance)
-  Follows basic structure: `domain-role`
-  Uses lowercase and hyphens only
-  No generic names or anti-patterns

### Silver Level (Recommended)
-  Bronze requirements +
-  Includes appropriate scope when needed
-  Uses standardized domain/role vocabulary
-  Supports UADP discovery metadata

### Gold Level (Enterprise)
-  Silver requirements +
-  Automated naming validation in CI/CD
-  Registry integration and conflict detection  
-  Organizational naming policy compliance
-  Audit trail for naming decisions

##  Migration Guide

### From Existing Agents

1. **Assess Current Names**
   ```bash
   ossa validate --naming-audit ./agents/
   ```

2. **Generate Compliant Names**
   ```bash
   ossa naming suggest --current-name "MyResearchBot"
   # Suggests: research-analyst, research-expert, research-assistant
   ```

3. **Update Agent Metadata**
   ```yaml
   # Update agent.yml
   metadata:
     name: research-analyst  # New compliant name
     legacy_names:          # Maintain backwards compatibility
       - MyResearchBot
       - research-bot-v2
   ```

4. **Update Discovery Registrations**
   ```bash
   ossa registry update-name --old MyResearchBot --new research-analyst
   ```

### Backwards Compatibility

```yaml
# Support multiple name formats during migration
discovery:
  canonical_name: research-analyst
  aliases:
    - MyResearchBot        # Legacy name
    - research-bot-v2      # Previous version
  migration_date: "2025-09-06"
  deprecation_warnings: true
```

##  Best Practices Summary

1. **Start with Domain**: Identify the primary area of expertise
2. **Define Role Clearly**: Specify the agent's function within that domain  
3. **Add Scope Judiciously**: Only when organizational grouping is needed
4. **Validate Early**: Use automated validation in development
5. **Document Decisions**: Maintain naming rationale for complex cases
6. **Plan for Discovery**: Consider how agents will be found and used
7. **Enable Migration**: Support backwards compatibility during transitions
8. **Monitor Compliance**: Regular audits of naming conventions

##  Related Standards

- **[Agent Specification](../reference/agent-specification.md)** - Core agent format and fields
- **[OSSA Golden Standard](../GOLDEN_STANDARD.md)** - Overall project standards
- **[API First Development](../API_FIRST_CLI_DEVELOPMENT.md)** - Development workflow standards

---

**This naming convention standard ensures consistent, discoverable, and maintainable agent identifiers across the entire OSSA ecosystem while supporting enterprise-grade deployment and governance requirements.**