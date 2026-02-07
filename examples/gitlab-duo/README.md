# GitLab Duo Agent Platform Export

This directory contains examples of GitLab Duo Flow Registry v1 configurations generated from OSSA manifests.

## Overview

The GitLab Duo export transforms OSSA agents into production-ready GitLab Duo flows that can run natively on GitLab's Agent Platform.

## Features

- **Flow Registry v1 Compliance**: Generated flows follow GitLab's Flow Registry v1 specification
- **Automatic Environment Detection**: Selects `ambient`, `chat`, or `chat-partial` based on autonomy level
- **MCP Tool Integration**: Maps OSSA tools to GitLab's built-in MCP tools
- **Inline Prompt Definitions**: Embeds system prompts and LLM configuration
- **Multi-Provider Support**: Works with Anthropic, OpenAI, and Google Vertex AI

## Usage

### Generate Flow from OSSA Manifest

```bash
# Using OSSA CLI
ossa export my-agent.ossa.yaml --platform gitlab --format flow -o .gitlab/duo/flows/

# This generates:
# .gitlab/duo/flows/my-agent.yaml
```

### OSSA Manifest Example

```yaml
apiVersion: ossa/v0.4.4
kind: Agent
metadata:
  name: code-review-agent
  version: 1.0.0
  description: AI-powered code review assistant
spec:
  role: |
    You are an expert code reviewer with deep knowledge of software engineering
    best practices, security vulnerabilities, and performance optimization.
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
    maxTokens: 4096
  autonomy:
    level: supervised
    approvalRequired:
      - critical-actions
    maxTurns: 10
  tools:
    - name: read
      description: Read file contents
    - name: search
      description: Search codebase
    - name: comment
      description: Add comments to merge requests
```

### Generated Flow Structure

```yaml
version: v1                          # Flow Registry v1
environment: chat                    # Collaborative mode
name: code-review-agent
description: AI-powered code review assistant
product_group: agent_foundations

components:
  - name: code_review_agent
    type: AgentComponent             # Multi-turn agent with tools
    prompt_id: code_review_agent_prompt
    toolset:
      - read_file
      - search_files
      - add_comment
    ui_log_events:
      - on_agent_final_answer
      - on_tool_execution_success

routers:
  - from: code_review_agent
    to: end

prompts:
  - prompt_id: code_review_agent_prompt
    model:
      params:
        model_class_provider: anthropic
        model: claude-sonnet-4-20250514
        max_tokens: 4096
        temperature: 0.7
    prompt_template:
      system: "You are an expert code reviewer..."
      user: "{{task}}"
      placeholder: history            # Enable conversation history

flow:
  entry_point: code_review_agent
```

## Environment Types

The generator automatically selects the appropriate environment based on your agent's autonomy configuration:

### `ambient` (Hands-off)
- **When**: `autonomy.level: autonomous` AND no approval requirements
- **Use Case**: Scheduled tasks, automated analysis, background jobs
- **Example**: Nightly security scans, automated dependency updates

### `chat` (Collaborative)
- **When**: `autonomy.level: supervised` OR `autonomy.level: collaborative`
- **Use Case**: Interactive code reviews, pair programming, debugging
- **Example**: On-demand code reviews, interactive issue triage

### `chat-partial` (Simple Conversation)
- **When**: `autonomy.maxTurns: 1` AND no tools
- **Use Case**: Q&A, documentation lookup, simple queries
- **Example**: "What does this function do?", "Explain this error"

## Tool Mapping

OSSA tools are automatically mapped to GitLab's built-in MCP tools:

| OSSA Tool | GitLab MCP Tool | Description |
|-----------|-----------------|-------------|
| `read` | `read_file` | Read file contents |
| `write` | `create_file_with_contents` | Create new files |
| `update` | `update_file` | Modify existing files |
| `list` | `list_dir` | List directory contents |
| `search` | `search_files` | Search across codebase |
| `create-issue` | `create_issue` | Create GitLab issues |
| `create-mr` | `create_merge_request` | Create merge requests |
| `comment` | `add_comment` | Add comments to issues/MRs |
| `shell` | `execute_shell_command` | Execute shell commands |

**Default Tools**: Every agent includes `read_file`, `list_dir`, and `search_files` by default.

## LLM Provider Support

### Anthropic (Claude)
```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  # Also supports: claude-opus-4, claude-haiku-3
```

### OpenAI (GPT)
```yaml
llm:
  provider: openai
  model: gpt-4o-mini
  # Also supports: gpt-4o, gpt-4-turbo
```

### Google Vertex AI (Gemini)
```yaml
llm:
  provider: google
  model: gemini-1.5-pro
  # Also supports: gemini-1.5-flash
```

## Deployment

### 1. Create Flow in GitLab Project

```bash
# Create the flows directory
mkdir -p .gitlab/duo/flows

# Copy generated flow
cp my-agent-flow.yaml .gitlab/duo/flows/

# Commit and push
git add .gitlab/duo/flows/my-agent-flow.yaml
git commit -m "feat: add code review agent flow"
git push
```

### 2. Enable in GitLab Duo

1. Navigate to your project in GitLab
2. Go to **Settings** → **Duo** → **Flows**
3. Your flow should appear in the list
4. Enable the flow
5. Configure triggers (comments, schedules, webhooks)

### 3. Test the Flow

```bash
# Trigger via comment in MR
@my-agent-flow review this code

# Or use GitLab Duo Chat
/duo ask my-agent-flow to analyze this merge request
```

## Advanced Configuration

### Multi-Turn Conversations

Flows automatically support conversation history via the `placeholder: history` field:

```yaml
prompt_template:
  system: "You are a helpful assistant"
  user: "{{task}}"
  placeholder: history  # Enables multi-turn
```

### Custom Timeouts

Adjust execution timeout based on task complexity:

```yaml
params:
  timeout: 300  # 5 minutes for complex tasks
```

### UI Events

Control what gets logged to the GitLab UI:

```yaml
ui_log_events:
  - on_agent_final_answer      # Show final response
  - on_tool_execution_success  # Show successful tool calls
  - on_tool_execution_failed   # Show failed tool calls
  - on_llm_start              # Show LLM invocation start
  - on_llm_end                # Show LLM completion
```

## Examples

### Code Review Agent
See: `code-review-flow.yaml`
- **Environment**: chat (supervised)
- **Tools**: read_file, search_files, add_comment
- **Use Case**: Interactive MR reviews

### Security Scanner Agent
```yaml
environment: ambient  # Autonomous, hands-off
components:
  - name: security_scanner
    type: AgentComponent
    toolset:
      - read_file
      - search_files
      - create_issue
```
**Use Case**: Scheduled security scans, automated issue creation

### Documentation Helper
```yaml
environment: chat-partial  # Simple Q&A
autonomy:
  maxTurns: 1
tools: []  # No tools needed
```
**Use Case**: Quick documentation lookups

## Troubleshooting

### Flow Not Appearing in GitLab

**Check**:
- Flow file is in `.gitlab/duo/flows/` directory
- YAML is valid (run `yamllint`)
- Flow follows v1 specification
- Project has GitLab Duo enabled

### Agent Not Responding

**Check**:
- Triggers are configured correctly
- AI Gateway token is valid
- Model name is correct for provider
- Toolset includes required tools

### Permission Errors

**Check**:
- Agent has GitLab API access
- User mentioning agent has permissions
- Project has Duo agent execution enabled

## Resources

- **GitLab Duo Agent Platform**: https://docs.gitlab.com/user/duo_agent_platform/
- **Flow Registry v1 Spec**: https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md
- **OSSA Specification**: https://openstandardagents.org/
- **MCP Tools Reference**: https://docs.gitlab.com/user/duo_agent_platform/tools/

## Contributing

Improvements to the GitLab Duo export generator are welcome! Key areas:

1. **Router Generation**: Support complex multi-agent workflows
2. **Tool Mapping**: Add more OSSA → GitLab MCP tool mappings
3. **External Agent**: Generate External Agent configurations
4. **Trigger Config**: Automatic trigger configuration generation

See: `src/adapters/gitlab/flow-generator.ts`
