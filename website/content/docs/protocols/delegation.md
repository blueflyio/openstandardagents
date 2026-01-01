---
title: "Delegation Protocol"
description: "OSSA v0.3.2 cross-tier delegation protocol for secure agent task routing with access control"
weight: 4
---

# Cross-Tier Delegation Protocol

Secure task delegation between agents of different access tiers with audit compliance.

## Overview

The Delegation Protocol defines how agents delegate tasks across access tiers while maintaining separation of duties and audit compliance. This protocol ensures that agents can only delegate tasks to appropriate tier levels, preventing privilege escalation and maintaining security boundaries.

## Access Tiers

OSSA defines four access tiers for agents:

| Tier | Name | Permissions | Use Case |
|------|------|-------------|----------|
| 1 | `tier_1_read` | Read-only | Analysis, monitoring, reporting |
| 2 | `tier_2_write_limited` | Limited write | Documentation, configuration |
| 3 | `tier_3_write_elevated` | Elevated write | Operations, deployments |
| 4 | `tier_4_policy` | Policy management | Governance, compliance |

## Delegation Matrix

The delegation matrix defines which tiers can delegate to which other tiers:

### Tier 1 (Read-Only)

```yaml
tier_1_read:
  can_delegate_to:
    - tier_1_read  # Peer delegation OK
  cannot_delegate_to:
    - tier_2_write_limited
    - tier_3_write_elevated
    - tier_4_policy
  reason: "Read-only agents cannot initiate write operations"
```

### Tier 2 (Limited Write)

```yaml
tier_2_write_limited:
  can_delegate_to:
    - tier_1_read  # Can request analysis
    - tier_2_write_limited  # Peer delegation OK
  cannot_delegate_to:
    - tier_3_write_elevated  # Cannot escalate privileges
    - tier_4_policy  # Cannot influence policy
  reason: "Limited write agents cannot escalate to elevated or policy tiers"
```

### Tier 3 (Elevated Write)

```yaml
tier_3_write_elevated:
  can_delegate_to:
    - tier_1_read  # Can request analysis
    - tier_2_write_limited  # Can request documentation
    - tier_3_write_elevated  # Peer delegation with approval
  cannot_delegate_to:
    - tier_4_policy  # Executor/Governor separation
  reason: "Operators cannot influence policy definitions"
```

### Tier 4 (Policy)

```yaml
tier_4_policy:
  can_delegate_to:
    - tier_1_read  # Can request compliance audits
    - tier_4_policy  # Peer delegation for policy review
  cannot_delegate_to:
    - tier_2_write_limited  # Governor/Executor separation
    - tier_3_write_elevated  # Governor/Executor separation
  execution_only_via: "tier_3_write_elevated with approval chain"
  reason: "Policy tier enforces separation - execution through operators only"
```

## Delegation Request

### Request Schema

```yaml
apiVersion: ossa/v0.3.0
kind: DelegationRequest
metadata:
  request_id: "req-550e8400-e29b-41d4-a716-446655440000"
source_agent:
  agent_id: "agent://example.com/tier2-writer"
  tier: tier_2_write_limited
  session_id: "session-abc123"
target_agent:
  agent_id: "agent://example.com/tier1-reader"
  tier: tier_1_read
  capabilities_required:
    - analyze_data
    - generate_report
task:
  type: "analyze_data"
  payload:
    dataset: "sales-2024"
    format: "csv"
  timeout_seconds: 300
  priority: normal
justification: "Quarterly analysis for compliance report"
context:
  parent_request_id: null
  trace_id: "trace-xyz789"
  workflow_id: "workflow-quarterly-review"
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_id` | UUID | Yes | Unique delegation request identifier |
| `source_agent.agent_id` | string | Yes | Source agent URI |
| `source_agent.tier` | enum | Yes | Source agent access tier |
| `target_agent.agent_id` | string | Yes | Target agent URI |
| `target_agent.tier` | enum | Yes | Target agent access tier |
| `target_agent.capabilities_required` | array | No | Required capabilities |
| `task.type` | string | Yes | Task type identifier |
| `task.payload` | object | Yes | Task-specific payload |
| `task.timeout_seconds` | integer | No | Timeout (default: 300) |
| `task.priority` | enum | No | Priority: low, normal, high, critical |
| `justification` | string | Yes | Reason for delegation (min 10 chars) |
| `context.trace_id` | string | No | Distributed tracing ID |

## Delegation Response

### Response Schema

```yaml
apiVersion: ossa/v0.3.0
kind: DelegationResponse
metadata:
  request_id: "req-550e8400-e29b-41d4-a716-446655440000"
status: completed
timestamp: "2025-12-18T14:05:00Z"
result:
  data:
    analysis_complete: true
    records_processed: 50000
    report_url: "https://reports.example.com/quarterly-2024.pdf"
```

### Response Status Values

| Status | Description |
|--------|-------------|
| `accepted` | Delegation accepted, processing |
| `completed` | Task completed successfully |
| `rejected` | Delegation denied (tier violation, etc.) |
| `failed` | Task execution failed |
| `timeout` | Task exceeded timeout |
| `cancelled` | Delegation cancelled by source |

### Error Response

```yaml
apiVersion: ossa/v0.3.0
kind: DelegationResponse
metadata:
  request_id: "req-550e8400-e29b-41d4-a716-446655440000"
status: rejected
timestamp: "2025-12-18T14:00:01Z"
error:
  code: TIER_VIOLATION
  message: "Source tier tier_1_read cannot delegate to target tier tier_2_write_limited"
```

### Error Codes

| Code | Description |
|------|-------------|
| `TIER_VIOLATION` | Delegation matrix violation |
| `CAPABILITY_MISSING` | Target lacks required capability |
| `APPROVAL_REQUIRED` | Needs human approval |
| `APPROVAL_DENIED` | Human rejected delegation |
| `TARGET_UNAVAILABLE` | Target agent not available |
| `EXECUTION_ERROR` | Task execution failed |
| `TIMEOUT` | Task exceeded timeout |
| `RESOURCE_EXHAUSTED` | Rate limit or quota exceeded |

## Approval Chains

For sensitive operations, delegations may require human approval.

### Standard Approval

```yaml
standard:
  description: "Standard approval for tier_3 operations"
  approvers:
    - role: team-lead
    - role: security-reviewer
  require: 1
  timeout_hours: 4
```

### Elevated Approval

```yaml
elevated:
  description: "Elevated approval for sensitive operations"
  approvers:
    - role: security-lead
    - role: compliance-officer
    - role: engineering-manager
  require: 2
  timeout_hours: 8
  escalation:
    after_hours: 2
    to: [cto, ciso]
```

### Critical Approval

```yaml
critical:
  description: "Critical approval for production changes"
  approvers:
    - role: sre-lead
    - role: security-lead
    - role: release-manager
  require: 2
  timeout_hours: 24
```

## Audit Requirements

All delegations are audited based on tier combination:

| Source-Target | Audit Level | Retention |
|---------------|-------------|-----------|
| tier_1 to tier_1 | Standard | 30 days |
| tier_2 to tier_1 | Standard | 30 days |
| tier_3 to any | Detailed | 90 days |
| tier_4 to any | Comprehensive | 365 days |

### Audit Log Format

```json
{
  "timestamp": "2025-12-18T14:00:00Z",
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000",
  "source_agent": {
    "agent_id": "agent://example.com/tier2-writer",
    "tier": "tier_2_write_limited"
  },
  "target_agent": {
    "agent_id": "agent://example.com/tier1-reader",
    "tier": "tier_1_read"
  },
  "task_type": "analyze_data",
  "justification": "Quarterly analysis for compliance report",
  "status": "completed",
  "duration_ms": 5000,
  "approvals": [],
  "trace_id": "trace-xyz789"
}
```

## Rate Limiting

### Per-Source Agent

```yaml
per_source_agent:
  requests_per_minute: 60
  requests_per_hour: 1000
```

### Per-Target Agent

```yaml
per_target_agent:
  concurrent_delegations: 10
  queue_depth: 50
```

## Examples

### Example 1: Analysis Request

Tier 2 agent requests analysis from Tier 1 agent:

```yaml
apiVersion: ossa/v0.3.0
kind: DelegationRequest
metadata:
  request_id: "req-analysis-001"
source_agent:
  agent_id: "agent://example.com/content-manager"
  tier: tier_2_write_limited
target_agent:
  agent_id: "agent://example.com/content-analyzer"
  tier: tier_1_read
  capabilities_required:
    - sentiment_analysis
    - topic_extraction
task:
  type: "analyze_content"
  payload:
    content_ids: ["node-123", "node-456", "node-789"]
    analysis_types: ["sentiment", "topics"]
  priority: normal
justification: "Content quality review before publication"
```

### Example 2: Deployment Orchestration

Tier 4 policy agent coordinates with Tier 3 operator:

```yaml
apiVersion: ossa/v0.3.0
kind: DelegationRequest
metadata:
  request_id: "req-deploy-001"
source_agent:
  agent_id: "agent://example.com/release-policy"
  tier: tier_4_policy
target_agent:
  agent_id: "agent://example.com/deployment-operator"
  tier: tier_3_write_elevated
  capabilities_required:
    - deploy_application
    - rollback_deployment
task:
  type: "deploy_application"
  payload:
    application: "web-frontend"
    version: "2.3.0"
    environment: "production"
    strategy: "blue-green"
  priority: high
  timeout_seconds: 1800
justification: "Scheduled production release per change management ticket CM-2024-456"
context:
  workflow_id: "workflow-release-2.3.0"
```

**Note:** This delegation requires approval chain due to tier_4 to tier_3 path.

### Example 3: Rejected Delegation

Attempt to escalate privileges (blocked by delegation matrix):

```yaml
# Request (will be rejected)
apiVersion: ossa/v0.3.0
kind: DelegationRequest
metadata:
  request_id: "req-invalid-001"
source_agent:
  agent_id: "agent://example.com/reader"
  tier: tier_1_read
target_agent:
  agent_id: "agent://example.com/writer"
  tier: tier_2_write_limited
task:
  type: "update_content"
  payload:
    content_id: "node-123"
justification: "Need to fix typo in content"

---
# Response (rejected)
apiVersion: ossa/v0.3.0
kind: DelegationResponse
metadata:
  request_id: "req-invalid-001"
status: rejected
timestamp: "2025-12-18T14:00:00Z"
error:
  code: TIER_VIOLATION
  message: "tier_1_read cannot delegate to tier_2_write_limited"
```

## OSSA Agent Manifest with Delegation

```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: content-analyzer
  version: 1.0.0
spec:
  role: Content analysis and reporting
  accessTier: tier_1_read
  capabilities:
    - name: analyze_content
      description: Perform content analysis
    - name: generate_report
      description: Generate analysis reports
  delegation:
    accepts_from:
      - tier_1_read
      - tier_2_write_limited
      - tier_3_write_elevated
      - tier_4_policy
    rate_limits:
      concurrent: 10
      per_minute: 60
    audit:
      enabled: true
      retention_days: 90
```

## Security Considerations

1. **Principle of Least Privilege** - Agents should operate at the lowest tier necessary
2. **Separation of Duties** - Policy (tier_4) and execution (tier_3) are separated
3. **Audit Trail** - All delegations are logged with retention based on sensitivity
4. **Approval Chains** - Sensitive operations require human approval
5. **Rate Limiting** - Prevent abuse through per-agent limits

## Best Practices

1. **Always justify** - Provide meaningful justification for audit purposes
2. **Use correlation IDs** - Link related delegations via trace_id
3. **Handle failures gracefully** - Implement retry logic with backoff
4. **Monitor approval queues** - Set up alerts for pending approvals
5. **Review audit logs** - Regularly review delegation patterns

## References

- [OSSA Access Tiers Specification](/docs/schema-reference/access-tiers)
- [OSSA Protocol Overview](/docs/protocols)
- [Multi-Agent Systems](/docs/architecture/multi-agent-systems)

---

**Previous**: [Server-Sent Events (SSE)](./sse) - Server-to-client streaming protocol
