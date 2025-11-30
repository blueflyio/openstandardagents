# OSSA → GitLab Duo Adapter

## Purpose
Bridge between OSSA agent definitions and GitLab Duo Agent Platform.

## Architecture

```
OSSA Agent Definition (YAML/JSON)
    ↓
OSSA Adapter
    ↓
GitLab Duo API
    ↓
Custom Agent in GitLab
```

## Mapping

### OSSA → GitLab Duo

| OSSA Field | GitLab Duo Field | Transformation |
|------------|------------------|----------------|
| `agent.name` | Display Name | Direct |
| `agent.description` | Description | Direct |
| `agent.capabilities` | System Prompt | Generate from capabilities |
| `agent.capabilities[].tools` | Tools | Map to built-in tools |
| `metadata.labels` | Tags | Direct |

### Capability → System Prompt Generation

```yaml
# OSSA Input
capabilities:
  - name: analyze-issue
    type: query
    description: Analyze issue content

# Generated System Prompt
You are an agent that can analyze issue content.
When asked to analyze an issue, you should:
1. Read the issue title and description
2. Extract key information
3. Provide structured analysis

Available tools: [analyze-text, search-issues]
```

### OSSA Tools → GitLab Built-in Tools

| OSSA Capability Type | GitLab Tool |
|---------------------|-------------|
| `create-issue` | Create issue |
| `create-merge-request` | Create merge request |
| `search-code` | Code search |
| `analyze-security` | Security scanner |

## Implementation

### 1. Parser
```typescript
interface OSSAAgent {
  ossaVersion: string;
  agent: {
    id: string;
    name: string;
    description: string;
    capabilities: Capability[];
  };
}

function parseOSSA(yaml: string): OSSAAgent {
  // Parse YAML to OSSA structure
}
```

### 2. Transformer
```typescript
interface GitLabDuoAgent {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  visibility: 'public' | 'private';
}

function transformToGitLabDuo(ossa: OSSAAgent): GitLabDuoAgent {
  return {
    name: ossa.agent.name,
    description: ossa.agent.description,
    systemPrompt: generateSystemPrompt(ossa.agent.capabilities),
    tools: mapTools(ossa.agent.capabilities),
    visibility: 'private'
  };
}
```

### 3. Deployer
```typescript
async function deployToGitLab(
  agent: GitLabDuoAgent,
  projectId: string,
  token: string
): Promise<void> {
  // Use GitLab API to create custom agent
  await fetch(`https://gitlab.com/api/v4/projects/${projectId}/ai/agents`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(agent)
  });
}
```

## Usage

### CLI
```bash
# Deploy OSSA agent to GitLab Duo
ossa deploy gitlab-duo \
  --agent agents/issue-triage-agent.yaml \
  --project blueflyio/openstandardagents \
  --token $GITLAB_TOKEN

# Sync all agents
ossa sync gitlab-duo \
  --directory agents/gitlab-automation/ \
  --project blueflyio/openstandardagents
```

### Programmatic
```typescript
import { OSSAAdapter } from '@bluefly/ossa-gitlab-adapter';

const adapter = new OSSAAdapter({
  gitlabUrl: 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN
});

// Deploy agent
await adapter.deploy({
  agentPath: 'agents/issue-triage-agent.yaml',
  projectId: 'blueflyio/openstandardagents',
  visibility: 'private'
});

// List deployed agents
const agents = await adapter.list('blueflyio/openstandardagents');
```

## Benefits

1. **Single Source of Truth** - Define agents in OSSA
2. **Portability** - Same agent works across platforms
3. **Version Control** - Git-based agent definitions
4. **Validation** - OSSA schema validation before deployment
5. **Documentation** - Self-documenting agent capabilities

## External Agent Integration

For external agents (Claude, OpenAI, etc.):

```yaml
# OSSA External Agent
ossaVersion: '0.2.6'
agent:
  id: claude-code-reviewer
  name: Claude Code Reviewer
  external:
    provider: anthropic
    model: claude-sonnet-4
    endpoint: https://api.anthropic.com/v1/messages
  capabilities:
    - name: review-code
      type: query
```

Adapter creates GitLab external agent that proxies to Claude via OSSA interface.

## Roadmap

- [ ] Implement OSSA parser
- [ ] Build system prompt generator
- [ ] Create tool mapper
- [ ] Implement GitLab API client
- [ ] Add CLI commands
- [ ] Support external agents
- [ ] Add validation and testing
- [ ] Document all mappings
