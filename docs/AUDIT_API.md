# OSSA Audit API

API-first agent health auditing system for OSSA manifests.

## Features

- **Folder Scanning**: Recursively scan directories for agent manifests
- **Manifest Validation**: Validate against OSSA spec (v0.3.5+)
- **Health Scoring**: 0-100 health score based on completeness
- **Multiple Output Formats**: Table, JSON, Markdown
- **API-First**: Full OpenAPI 3.1 specification
- **Callable from Other Projects**: Export as npm package

## CLI Usage

```bash
# Scan folder and generate report
ossa audit scan ./packages/@ossa

# Audit specific agent
ossa audit agent task-dispatcher --path ./packages/@ossa/task-dispatcher

# Export as JSON
ossa audit scan --format json --output report.json

# Export as Markdown
ossa audit scan --format markdown --output HEALTH_REPORT.md

# Different validation levels
ossa audit scan --level basic    # Quick scan
ossa audit scan --level full     # Standard validation (default)
ossa audit scan --level strict   # Strict compliance checking
```

## Programmatic Usage

```typescript
import { AgentAuditService } from '@bluefly/openstandardagents/audit';

const service = new AgentAuditService();

const report = await service.scanAndAudit({
  path: './packages/@ossa',
  recursive: true,
  validationLevel: 'full',
  specVersion: '0.3.5'
});

console.log(`Health: ${report.summary.healthPercentage}%`);
console.log(`Total: ${report.summary.total} agents`);
console.log(`Healthy: ${report.summary.healthy}`);
console.log(`Issues: ${report.summary.error} errors, ${report.summary.warning} warnings`);
```

## API Specification

Full OpenAPI 3.1 spec: [`spec/ossa-audit-api.yaml`](../spec/ossa-audit-api.yaml)

### Endpoints

#### `POST /audit/scan`
Scan folder for agents and generate health audit.

**Request:**
```json
{
  "path": "./packages/@ossa",
  "recursive": true,
  "validationLevel": "full",
  "specVersion": "0.3.5"
}
```

**Response:**
```json
{
  "summary": {
    "total": 52,
    "healthy": 40,
    "warning": 10,
    "error": 2,
    "healthPercentage": 76
  },
  "agents": [
    {
      "id": "task-dispatcher",
      "status": "healthy",
      "healthScore": 100,
      "manifestExists": true,
      "manifestValid": true,
      "capabilitiesCount": 5,
      "toolsCount": 3,
      "triggersCount": 2,
      "issues": []
    }
  ],
  "timestamp": "2026-01-29T05:00:00.000Z"
}
```

#### `GET /audit/agent/{agentId}`
Get health status for specific agent.

## Health Scoring

Agents are scored 0-100 based on:

- **Manifest Exists** (30 points): Agent has a manifest file
- **Manifest Valid** (30 points): Passes OSSA spec validation
- **Has Capabilities** (20 points): At least one capability defined
- **Has Tools** (10 points): At least one tool defined
- **Has Triggers** (10 points): At least one trigger defined

**Status Levels:**
- **🟢 Healthy** (80-100): Production-ready
- **🟡 Warning** (50-79): Needs attention
- **🔴 Error** (0-49): Critical issues

## Integration with Other Projects

### agent-buildkit

```typescript
import { AgentAuditService } from '@bluefly/openstandardagents/audit';

// In buildkit deploy command
const audit = new AgentAuditService();
const health = await audit.auditAgent(agentPath);

if (health.status === 'error') {
  throw new Error('Cannot deploy unhealthy agent');
}
```

### compliance-engine

```typescript
// Validate all agents before release
const report = await auditService.scanAndAudit({
  path: './packages/@ossa',
  validationLevel: 'strict'
});

if (report.summary.error > 0) {
  throw new ComplianceError('Agents with errors cannot be released');
}
```

## Examples

### Generate Health Report for CI/CD

```yaml
# .gitlab-ci.yml
audit-agents:
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa audit scan --format markdown --output HEALTH_REPORT.md
    - ossa audit scan --format json --output health.json
  artifacts:
    reports:
      - HEALTH_REPORT.md
      - health.json
```

### Health Check Before Deployment

```bash
#!/bin/bash
# deploy-agents.sh

echo "🔍 Auditing agents before deployment..."
ossa audit scan --format json --output /tmp/health.json

HEALTH=$(jq '.summary.healthPercentage' /tmp/health.json)

if [ "$HEALTH" -lt 80 ]; then
  echo "❌ Health too low: ${HEALTH}%"
  echo "Fix errors before deploying"
  exit 1
fi

echo "✅ Health check passed: ${HEALTH}%"
# Continue with deployment...
```

## Architecture

The audit system follows API-first principles:

1. **OpenAPI Spec First**: API defined before implementation
2. **Service Layer**: Business logic separate from CLI/API
3. **Multiple Consumers**: CLI, API server, programmatic usage
4. **Type-Safe**: Full TypeScript types from spec

```
┌─────────────────────────────────────┐
│ OpenAPI Spec (ossa-audit-api.yaml) │
└───────────┬─────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼────┐    ┌────▼─────┐
│ CLI    │    │ API      │
│ Command│    │ Server   │
└───┬────┘    └────┬─────┘
    │              │
    └──────┬───────┘
           │
    ┌──────▼──────────┐
    │ AgentAuditService│
    └──────────────────┘
```

## See Also

- [OpenAPI Spec](../spec/ossa-audit-api.yaml)
- [Service Implementation](../src/services/audit.ts)
- [CLI Command](../src/cli/commands/audit.ts)
