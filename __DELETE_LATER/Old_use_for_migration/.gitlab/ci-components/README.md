# GitLab CI/CD Components for OpenAPI AI Agents

Ready-to-use GitLab CI/CD components for validating, testing, and deploying AI agents that comply with the OpenAPI for AI Agents Standard.

## Available Components

### 1. Agent Validator
Validates OpenAPI specifications against the AI Agents standard.

```yaml
include:
  - component: gitlab.com/openapi-ai-agents/components/agent-validator@1.0.0
    inputs:
      agent-spec-file: "openapi.yaml"
      certification-target: "silver"
      strict-mode: true
```

**Features:**
- OpenAPI 3.1 validation
- Certification level assessment (Bronze/Silver/Gold)
- Breaking change detection
- Compliance readiness check
- Multiple output formats (text, JSON, JUnit, Markdown)

### 2. Token Monitor
Monitors and optimizes token usage across AI agents.

```yaml
include:
  - component: gitlab.com/openapi-ai-agents/components/token-monitor@1.0.0
    inputs:
      token-budget: 100000
      alert-threshold: 80
      optimization-level: "aggressive"
```

**Features:**
- Real-time token usage tracking
- Cost estimation and alerts
- Tiktoken integration
- Budget enforcement
- Optimization recommendations

### 3. Security Scanner
Comprehensive security scanning using MAESTRO framework.

```yaml
include:
  - component: gitlab.com/openapi-ai-agents/components/security-scan@1.0.0
    inputs:
      scan-level: "comprehensive"
      frameworks: ["maestro", "owasp"]
      fail-on-critical: true
```

**Features:**
- MAESTRO threat assessment
- Vulnerability scanning
- Secret detection
- Dependency analysis
- Compliance validation

### 4. Agent Deployer
Automated deployment of AI agents to multiple environments.

```yaml
include:
  - component: gitlab.com/openapi-ai-agents/components/agent-deploy@1.0.0
    inputs:
      environment: "staging"
      protocol-bridges: ["mcp", "a2a"]
      health-check: true
```

**Features:**
- Multi-environment deployment
- Protocol bridge configuration
- Health check integration
- Rollback capabilities
- Kubernetes support

## Quick Start

### Basic Setup

```yaml
# .gitlab-ci.yml
include:
  # Include all standard components
  - component: gitlab.com/openapi-ai-agents/components/agent-validator@1.0.0
  - component: gitlab.com/openapi-ai-agents/components/token-monitor@1.0.0
  - component: gitlab.com/openapi-ai-agents/components/security-scan@1.0.0
  - component: gitlab.com/openapi-ai-agents/components/agent-deploy@1.0.0

stages:
  - validate
  - test
  - security
  - deploy

variables:
  AGENT_SPEC: "openapi.yaml"
  CERTIFICATION_TARGET: "silver"
```

### Advanced Configuration

```yaml
# .gitlab-ci.yml with custom configuration
include:
  - component: gitlab.com/openapi-ai-agents/components/agent-validator@1.0.0
    inputs:
      agent-spec-file: "api/openapi.yaml"
      certification-target: "gold"
      strict-mode: true
      output-format: "json"

  - component: gitlab.com/openapi-ai-agents/components/token-monitor@1.0.0
    inputs:
      token-budget: 500000
      alert-threshold: 75
      optimization-level: "aggressive"
      tiktoken-encoding: "cl100k_base"
      
  - component: gitlab.com/openapi-ai-agents/components/security-scan@1.0.0
    inputs:
      scan-level: "paranoid"
      frameworks: ["maestro", "owasp", "cis"]
      fail-on-critical: true
      generate-sbom: true

# Custom stages and jobs
stages:
  - validate
  - test
  - security
  - compliance
  - deploy
  - monitor

# Override or extend component jobs
validate:custom:
  stage: validate
  script:
    - echo "Running custom validation..."
  needs:
    - validate:openapi-spec  # From agent-validator component
```

## Component Inputs Reference

### Common Inputs (All Components)

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `enabled` | Enable/disable component | `true` | No |
| `stage` | CI stage to run in | Component-specific | No |
| `allow-failure` | Allow job to fail | `false` | No |

### Agent Validator Inputs

| Input | Description | Default | Options |
|-------|-------------|---------|---------|
| `agent-spec-file` | Path to OpenAPI spec | `openapi.yaml` | Any file path |
| `certification-target` | Target certification level | `silver` | `bronze`, `silver`, `gold` |
| `strict-mode` | Fail on warnings | `false` | `true`, `false` |
| `output-format` | Report format | `text` | `text`, `json`, `junit`, `markdown` |

### Token Monitor Inputs

| Input | Description | Default | Range |
|-------|-------------|---------|-------|
| `token-budget` | Daily token budget | `100000` | 1-10000000 |
| `alert-threshold` | Alert percentage | `80` | 1-100 |
| `optimization-level` | Optimization aggressiveness | `standard` | `none`, `standard`, `aggressive` |
| `tiktoken-encoding` | Token encoding | `cl100k_base` | Various encodings |

### Security Scanner Inputs

| Input | Description | Default | Options |
|-------|-------------|---------|---------|
| `scan-level` | Scanning depth | `standard` | `basic`, `standard`, `comprehensive`, `paranoid` |
| `frameworks` | Security frameworks | `["maestro"]` | Array of frameworks |
| `fail-on-critical` | Fail on critical issues | `true` | `true`, `false` |
| `generate-sbom` | Generate SBOM | `false` | `true`, `false` |

### Agent Deployer Inputs

| Input | Description | Default | Options |
|-------|-------------|---------|---------|
| `environment` | Target environment | `staging` | `dev`, `staging`, `production` |
| `protocol-bridges` | Enabled bridges | `["mcp"]` | Array of protocols |
| `health-check` | Run health checks | `true` | `true`, `false` |
| `rollback-on-failure` | Auto rollback | `true` | `true`, `false` |

## GitLab Integration Features

### Merge Request Integration

Components automatically enhance merge requests with:
- Validation reports as MR comments
- Certification level badges
- Breaking change warnings
- Token usage comparisons
- Security scan results

### Pipeline Dashboards

Components provide metrics for GitLab dashboards:
- Agent certification levels
- Token usage trends
- Security posture
- Compliance status
- Deployment success rates

### GitLab Duo Enhancement

When GitLab Duo is enabled, components provide:
- AI-powered fix suggestions
- Automatic issue resolution
- Code quality improvements
- Documentation generation

## Best Practices

1. **Start with Bronze Certification**
   - Begin with `certification-target: bronze`
   - Gradually increase to silver, then gold

2. **Enable Token Monitoring Early**
   - Set conservative budgets initially
   - Monitor usage patterns
   - Optimize based on data

3. **Security First**
   - Always run security scans
   - Fix critical issues immediately
   - Regular dependency updates

4. **Progressive Deployment**
   - Deploy to staging first
   - Use health checks
   - Enable automatic rollback

## Troubleshooting

### Component Not Found

```yaml
# Ensure you're using the correct component path
include:
  - component: gitlab.com/openapi-ai-agents/components/agent-validator@1.0.0
  # NOT: gitlab.com/your-group/components/...
```

### Version Conflicts

```yaml
# Pin specific versions for stability
include:
  - component: gitlab.com/openapi-ai-agents/components/agent-validator@1.0.0
  # NOT: @latest or @main
```

### Input Validation Errors

```yaml
# Check input types and values
inputs:
  token-budget: 100000  # Number, not string
  strict-mode: true     # Boolean, not string
  frameworks: ["maestro", "owasp"]  # Array, not string
```

## Support

- **Documentation**: [docs.openapi-ai-agents.org/gitlab](https://docs.openapi-ai-agents.org/gitlab)
- **Issues**: [gitlab.com/openapi-ai-agents/components/issues](https://gitlab.com/openapi-ai-agents/components/issues)
- **Discord**: [discord.gg/openapi-agents](https://discord.gg/openapi-agents)
- **Email**: gitlab-support@openapi-ai-agents.org

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](../../LICENSE) for details.