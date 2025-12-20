# GitLab Agents Catalog

OSSA-compliant agents for GitLab CI/CD automation.

**Total Agents**: 1

## Documentation Agent

**ID**: `doc-agent`  
**Role**: `worker`

Automated documentation generation and validation agent

### Capabilities

- **generate_api_docs**: Generate API documentation from OpenAPI specifications
- **generate_cli_docs**: Generate CLI documentation from command source files
- **generate_schema_docs**: Generate schema documentation from JSON Schema
- **validate_docs**: Validate documentation completeness and quality
- **sync_wiki**: Sync documentation to GitLab wiki

**Manifest**: [`.gitlab/agents/doc-agent/manifest.ossa.yaml`](https://gitlab.com/blueflyio/openstandardagents/blob/main/.gitlab/agents/doc-agent/manifest.ossa.yaml)

```bash
# Deploy agent
kubectl apply -f .gitlab/agents/doc-agent/manifest.ossa.yaml
```

