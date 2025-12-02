# `.agents/` - Local Agent Development

This directory is for **local agent development and testing**. It's gitignored to keep your personal agents private.

## Purpose

- Develop and test OSSA-compliant agents locally
- Experiment with agent configurations
- Create custom agents for your projects
- Test agent manifests before deploying to production

## Structure

```
.agents/
├── my-agent/
│   ├── manifest.ossa.yaml    # OSSA agent manifest
│   ├── config.yaml           # Runtime configuration (optional)
│   └── README.md             # Agent documentation
└── another-agent/
    └── manifest.ossa.yaml
```

## Quick Start

### 1. Create a New Agent

```bash
# Generate agent scaffold
ossa generate worker --name "My Agent" --id my-agent --output .agents/my-agent

# Or manually create
mkdir -p .agents/my-agent
```

### 2. Define Agent Manifest

Create `.agents/my-agent/manifest.ossa.yaml`:

```yaml
apiVersion: ossa/v0.2.6
kind: Agent

metadata:
  name: my-agent
  version: 1.0.0
  description: My custom agent

spec:
  taxonomy:
    domain: custom
    subdomain: automation
    capability: task-execution

  role: |
    You are an expert automation agent...

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.7

  capabilities:
    - name: execute_task
      description: Execute automated tasks
      input_schema:
        type: object
        properties:
          task: { type: string }
      output_schema:
        type: object
        properties:
          result: { type: string }
```

### 3. Validate Agent

```bash
ossa validate .agents/my-agent/manifest.ossa.yaml
```

### 4. Test Locally

```bash
# Run agent locally (requires runtime implementation)
buildkit agents run .agents/my-agent/manifest.ossa.yaml
```

## Examples

See `.gitlab/agents/` for production-ready reference implementations:
- `security-scanner` - Vulnerability scanning
- `performance-optimizer` - Resource optimization
- `db-migrator` - Database migrations
- `monitoring-agent` - Metrics and alerting

## Best Practices

1. **Follow OSSA Spec**: Use OSSA v0.2.6 schema
2. **Validate Early**: Run `ossa validate` frequently
3. **Document**: Add README.md to each agent directory
4. **Version Control**: Use semantic versioning
5. **Test Isolated**: Test agents independently before mesh integration

## Migration to Production

When ready to deploy:

1. Move agent to `.gitlab/agents/` or your deployment directory
2. Add to version control
3. Configure mesh integration in `mesh-config.yaml`
4. Deploy to Kubernetes/runtime environment

## Notes

- This directory is **gitignored** - your agents stay private
- Use `.gitlab/agents/` for production/shared agents
- Supports all OSSA v0.2.6 features
