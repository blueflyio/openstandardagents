# Production-Ready OSSA Agent Examples

This directory contains 5 comprehensive production-ready agent examples showcasing different capabilities, use cases, and patterns in OSSA v0.4.1.

## Overview

These examples demonstrate:
- Different domains and use cases
- A2A (Agent-to-Agent) communication patterns
- Various autonomy modes and human-in-the-loop configurations
- Token efficiency optimization strategies
- Event-driven and scheduled execution
- Multi-agent coordination and team leadership
- Comprehensive observability and monitoring
- Security and compliance patterns

## Examples

### 1. Compliance Checker Agent

**File:** `compliance-checker.ossa.yaml`

**Domain:** Governance / Compliance

**Description:** Enterprise compliance checker for SOC2, HIPAA, and GDPR frameworks with policy validation, audit reporting, and regulatory compliance.

**Key Features:**
- **Frameworks:** SOC2, HIPAA, GDPR
- **Autonomy:** High - Autonomous operation with escalation
- **A2A Enabled:** Yes - Queries policy database, coordinates with other compliance systems
- **Capabilities:**
  - Policy validation against regulatory frameworks
  - Comprehensive compliance audits
  - Regulatory report generation
  - Policy database queries
- **Use Cases:**
  - Continuous compliance monitoring
  - Regulatory audit preparation
  - Policy enforcement
  - Compliance risk assessment

**Notable Configuration:**
```yaml
autonomy:
  mode: autonomous
  humanApproval: false
  escalation:
    enabled: true
    triggers:
      - critical_violation
      - framework_change
      - audit_failure

a2a:
  enabled: true
  capabilities:
    - policy-validation
    - compliance-audit
    - regulatory-reporting
  protocols:
    - rest
    - grpc
    - kafka
```

**Resources:** 2Gi RAM, 1000m CPU, 10Gi Storage

---

### 2. Data Processing Pipeline Agent

**File:** `data-processing-pipeline.ossa.yaml`

**Domain:** Data Engineering / ETL

**Description:** Data processing pipeline agent with ETL, transformation, and validation capabilities using pandas, dbt, and great_expectations.

**Key Features:**
- **Tools:** pandas, dbt, great_expectations
- **Autonomy:** Supervised - Human approval required for critical operations
- **A2A Enabled:** No - Standalone data processing
- **High Resource Requirements:** 8Gi RAM, 4000m CPU, 100Gi Storage
- **Capabilities:**
  - Data extraction from multiple sources (database, API, file, stream)
  - Data transformation using pandas and dbt
  - Data loading to various destinations
  - Data quality validation with great_expectations
- **Use Cases:**
  - Daily batch ETL jobs
  - Real-time data streaming
  - Data warehouse loading
  - Data quality monitoring

**Notable Configuration:**
```yaml
autonomy:
  mode: supervised
  humanApproval: true
  approvalRequired:
    - before_load
    - on_validation_failure
    - on_schema_change

scheduling:
  enabled: true
  cron: "0 2 * * *"  # Daily at 2 AM
  timezone: UTC
  maxConcurrent: 1

retry:
  enabled: true
  maxAttempts: 3
  backoff:
    type: exponential
    initialDelay: 5s
    maxDelay: 300s
```

**Resources:** 8Gi RAM (16Gi limit), 4000m CPU (8000m limit), 100Gi Storage

---

### 3. Team Leader Agent

**File:** `team-leader.ossa.yaml`

**Domain:** Orchestration / Multi-Agent Coordination

**Description:** Multi-agent team leader with task distribution, coordination, and progress tracking capabilities.

**Key Features:**
- **Autonomy:** Autonomous - Full team leadership authority
- **A2A Enabled:** Yes - Leader role with team discovery
- **Team Discovery:** Enabled with auto-registration
- **Capabilities:**
  - Task distribution based on capabilities
  - Team coordination (sequential, parallel, conditional, fan-out/fan-in)
  - Progress tracking and reporting
  - Team member discovery
- **Use Cases:**
  - Multi-agent workflow orchestration
  - Dynamic task assignment
  - Team workload balancing
  - Dependency management

**Notable Configuration:**
```yaml
autonomy:
  mode: autonomous
  humanApproval: false

a2a:
  enabled: true
  role: leader
  capabilities:
    - task-distribution
    - team-coordination
    - progress-tracking
    - agent-discovery
  discovery:
    enabled: true
    broadcast: true
    interval: 60s

teamDiscovery:
  enabled: true
  autoRegister: true
  heartbeat:
    interval: 30s
    timeout: 90s

messaging:
  transport: redis
  events:
    publish:
      - task.assigned
      - task.completed
      - coordination.started
      - team.member.discovered
```

**Resources:** 2Gi RAM, 2000m CPU, 5Gi Storage

---

### 4. Security Scanner Enhanced Agent

**File:** `security-scanner-enhanced.ossa.yaml`

**Domain:** Security Operations

**Description:** Advanced security scanner with vulnerability scanning, penetration testing, and compliance checking using nmap, OWASP ZAP, and custom scanners.

**Key Features:**
- **Tools:** nmap, OWASP ZAP, custom scanners
- **Autonomy:** Medium - Semi-autonomous with approval gates
- **Execution:** Event-driven (kHook triggers)
- **Triggers:** Deployment events, code commits, configuration changes, webhooks, scheduled
- **Capabilities:**
  - Vulnerability scanning (network, web app, container, cloud, API)
  - Penetration testing (authorized scope)
  - Compliance checking (PCI-DSS, ISO27001, NIST, CIS, OWASP Top 10)
- **Use Cases:**
  - Continuous security scanning
  - Pre-deployment security validation
  - Compliance verification
  - Threat detection

**Notable Configuration:**
```yaml
autonomy:
  mode: semi-autonomous
  humanApproval: true
  approvalRequired:
    - before_penetration_test
    - before_production_scan
    - on_critical_finding

triggers:
  khook:
    enabled: true
    events:
      - type: deployment
        action: trigger_scan
        filter:
          environment: [production, staging]
      - type: code_commit
        action: trigger_scan
  webhook:
    enabled: true
  schedule:
    enabled: true
    cron: "0 0 * * 0"  # Weekly

observability:
  alerts:
    - name: critical_vulnerability_found
      condition: vulnerabilities_found{severity="critical"} > 0
      notification: pagerduty
```

**Resources:** 4Gi RAM, 2000m CPU, 20Gi Storage

---

### 5. Customer Support Agent

**File:** `customer-support.ossa.yaml`

**Domain:** Customer Service

**Description:** Intelligent customer support agent with ticket triage, auto-response, escalation, and 70-95% token efficiency optimization.

**Key Features:**
- **LLM:** Claude 3.5 Sonnet with prompt caching
- **Token Efficiency:** 70-95% savings through aggressive caching
- **Autonomy:** Collaborative - Human-in-the-loop for complex cases
- **Capabilities:**
  - Ticket triage with sentiment analysis
  - Automated response generation
  - Smart escalation management
  - Knowledge base integration
- **Use Cases:**
  - First-line customer support
  - Ticket categorization and routing
  - FAQ responses
  - Escalation to human agents

**Notable Configuration:**
```yaml
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  temperature: 0.7
  maxTokens: 8192
  features:
    promptCaching: true
    tokenEfficiency: true
    streamingResponse: true
  caching:
    enabled: true
    strategy: aggressive
    cacheableElements:
      - system_prompt
      - knowledge_base_context
      - company_policies
      - common_faqs
    ttl: 300  # 5 minutes
    targetSavings: 0.85  # Target 85% token savings

autonomy:
  mode: collaborative
  humanInTheLoop:
    enabled: true
    triggers:
      - escalation_requested
      - low_confidence
      - negative_sentiment

sla:
  responseTime:
    urgent: 15m
    high: 1h
    medium: 4h
    low: 24h
```

**Resources:** 2Gi RAM, 1000m CPU, 5Gi Storage

---

## Comparison Matrix

| Agent | Domain | Autonomy | A2A | Token Efficiency | Event-Driven | Resources |
|-------|--------|----------|-----|------------------|--------------|-----------|
| Compliance Checker | Governance | High | Yes | Yes (caching) | No | Medium |
| Data Processing Pipeline | Data Engineering | Supervised | No | No | No | High |
| Team Leader | Orchestration | Autonomous | Yes (Leader) | Yes (caching) | No | Medium |
| Security Scanner | Security | Medium | No | Yes (caching) | Yes (kHook) | Medium-High |
| Customer Support | Support | Collaborative | No | Yes (85% savings) | No | Medium |

## Pattern Demonstrations

### 1. A2A Communication Patterns

**Compliance Checker** and **Team Leader** demonstrate different A2A patterns:
- Compliance Checker: Query-based A2A (policy database)
- Team Leader: Coordination-based A2A (task distribution, team discovery)

### 2. Autonomy Modes

- **Autonomous:** Team Leader, Compliance Checker
- **Semi-Autonomous:** Security Scanner
- **Supervised:** Data Processing Pipeline
- **Collaborative:** Customer Support

### 3. Human-in-the-Loop

Different approval strategies:
- **Pre-operation approval:** Security Scanner (before pen tests)
- **Conditional approval:** Data Processing Pipeline (on validation failure)
- **Escalation-based:** Customer Support (low confidence triggers)

### 4. Token Efficiency

Three approaches to token optimization:
- **Aggressive caching:** Customer Support (85% target savings)
- **Standard caching:** Compliance Checker, Team Leader, Security Scanner
- **No optimization:** Data Processing Pipeline (non-LLM intensive)

### 5. Event-Driven Execution

**Security Scanner** shows comprehensive trigger configuration:
- kHook events (deployment, code commit, configuration change)
- Webhook endpoints
- Scheduled execution (cron)

### 6. Resource Allocation

Different resource profiles for different workloads:
- **High:** Data Processing Pipeline (8-16Gi RAM, 4-8 CPU cores)
- **Medium:** Security Scanner (4Gi RAM, 2 CPU cores)
- **Light:** Compliance Checker, Team Leader, Customer Support (2Gi RAM, 1-2 CPU cores)

## Usage

### Validation

Validate all manifests:

```bash
# Individual validation
npm run validate:manifest -- examples/showcase/compliance-checker.ossa.yaml
npm run validate:manifest -- examples/showcase/data-processing-pipeline.ossa.yaml
npm run validate:manifest -- examples/showcase/team-leader.ossa.yaml
npm run validate:manifest -- examples/showcase/security-scanner-enhanced.ossa.yaml
npm run validate:manifest -- examples/showcase/customer-support.ossa.yaml

# Validate all examples
npm run validate:examples
```

### Export to Platforms

Export to different platforms (LangChain, CrewAI, AutoGen, etc.):

```bash
# Export Compliance Checker to LangChain
npx ossa export examples/showcase/compliance-checker.ossa.yaml --output langchain --output-dir ./exported/compliance-checker

# Export Team Leader to CrewAI
npx ossa export examples/showcase/team-leader.ossa.yaml --output crewai --output-dir ./exported/team-leader

# Export Security Scanner to Kubernetes
npx ossa export examples/showcase/security-scanner-enhanced.ossa.yaml --output kubernetes --output-dir ./exported/security-scanner

# Export all to multiple platforms
for agent in compliance-checker data-processing-pipeline team-leader security-scanner-enhanced customer-support; do
  npx ossa export examples/showcase/$agent.ossa.yaml --output langchain --output-dir ./exported/$agent/langchain
  npx ossa export examples/showcase/$agent.ossa.yaml --output crewai --output-dir ./exported/$agent/crewai
  npx ossa export examples/showcase/$agent.ossa.yaml --output kubernetes --output-dir ./exported/$agent/k8s
done
```

### Deployment

Deploy to Kubernetes:

```bash
# Generate Kubernetes manifests
npx ossa export examples/showcase/compliance-checker.ossa.yaml --output kubernetes --output-dir ./k8s

# Apply to cluster
kubectl apply -f ./k8s/
```

### View Agent Information

```bash
# View detailed agent information
npx ossa info examples/showcase/compliance-checker.ossa.yaml
npx ossa info examples/showcase/team-leader.ossa.yaml
```

## Best Practices Demonstrated

### 1. Observability

All agents include comprehensive observability:
- Prometheus metrics with custom metrics
- Structured JSON logging
- OpenTelemetry tracing
- Custom dashboards (Grafana)

### 2. Security

Production-ready security configurations:
- Authentication (OAuth2, API keys, mutual TLS)
- Authorization (RBAC)
- Encryption (at rest and in transit)
- Data classification
- PII handling

### 3. State Management

Different persistence strategies:
- PostgreSQL: Long-term state (Compliance Checker, Team Leader, Security Scanner)
- Redis: Short-term cache (Data Processing Pipeline, Customer Support)

### 4. Error Handling

Comprehensive retry and error handling:
- Configurable retry policies
- Exponential backoff
- Circuit breakers (Team Leader)
- Escalation on persistent failures

### 5. Resource Management

Production-ready resource configurations:
- Memory limits and requests
- CPU limits and requests
- Storage requirements
- Network policies (Security Scanner)

## Learning Path

Recommended order for understanding OSSA patterns:

1. **Customer Support** - Basic agent with LLM, token efficiency
2. **Compliance Checker** - A2A communication, autonomous operation
3. **Security Scanner** - Event-driven execution, multiple triggers
4. **Data Processing Pipeline** - Supervised autonomy, high resources
5. **Team Leader** - Multi-agent coordination, team discovery

## Contributing

To add new production examples:

1. Create OSSA manifest in `examples/showcase/`
2. Follow naming convention: `{agent-name}.ossa.yaml`
3. Validate: `npm run validate:manifest -- examples/showcase/{agent-name}.ossa.yaml`
4. Update this README with:
   - Agent description
   - Key features
   - Notable configuration
   - Use cases
5. Add to comparison matrix
6. Test export to at least 3 platforms

## License

Apache-2.0

## Support

- Documentation: https://openstandardagents.org
- Issues: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
- Discussions: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues
