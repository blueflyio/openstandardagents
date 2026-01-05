---
title: "Programmatic API"
---

# Programmatic API

## Overview

RESTful API for programmatic access to OSSA agent operations and GitLab integration.

## Authentication

### API Tokens
```bash
curl -H "Authorization: Bearer $GITLAB_TOKEN" \
  https://gitlab.com/api/v4/projects/{project_id}/issues
```

### Service Accounts
- Bot service accounts for automated access
- Scoped permissions per agent
- Token rotation support

## Endpoints

### Agent Operations
- `POST /api/v1/agents/{id}/execute` - Execute agent
- `GET /api/v1/agents/{id}/status` - Get agent status
- `POST /api/v1/agents/{id}/validate` - Validate agent manifest

### GitLab Integration
- `GET /api/v4/projects/{id}/issues` - List issues
- `POST /api/v4/projects/{id}/merge_requests` - Create MR
- `GET /api/v4/groups/{id}/epics` - List epics

## Usage Examples

### Execute Agent
```bash
curl -X POST \
  -H "Authorization: Bearer $GITLAB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent": "bot-ossa-validator", "input": "manifest.ossa.yaml"}' \
  https://gitlab.com/api/v4/projects/{project_id}/trigger/pipeline
```

### Validate Manifest
```bash
curl -X POST \
  -H "Authorization: Bearer $GITLAB_TOKEN" \
  -d '{"manifest_path": "agent.ossa.yaml"}' \
  https://api.ossa.dev/v1/validate
```

## Related Pages

- [API Reference](../api-reference/index.md)
- [Installation](../getting-started/installation.md)
- [Configuration](../configuration/environment-variables.md)

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
