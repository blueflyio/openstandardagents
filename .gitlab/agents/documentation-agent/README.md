# OSSA Documentation Agent

## Purpose

Updates and maintains OSSA project documentation. Syncs docs to GitLab wiki, generates examples index, and updates website.

## Capabilities

- **Wiki Synchronization** - Syncs markdown docs to GitLab wiki
- **Examples Indexing** - Generates examples index from examples/ directory
- **Version Updates** - Updates website version files
- **Link Validation** - Validates all documentation links
- **API Documentation** - Generates API docs from OpenAPI specs

## Usage

### In GitLab CI

```yaml
pages:
  script:
    - ossa run .gitlab/agents/documentation-agent/agent.ossa.yaml
```

### Standalone

```bash
ossa run .gitlab/agents/documentation-agent/agent.ossa.yaml --tool sync_wiki
```

## Tools

- `sync_wiki` - Syncs markdown to GitLab wiki
- `generate_examples_index` - Generates examples index
- `update_website_versions` - Updates website version files
- `validate_links` - Validates documentation links
- `generate_api_docs` - Generates API documentation

## Configuration

- **LLM**: OpenAI GPT-4 Turbo
- **State**: Stateless (24h retention for doc history)
- **Performance**: Max 600s latency (for large doc syncs)

## Related

- [Website](../../../website/)
- [Documentation](../../../website/content/docs/)

