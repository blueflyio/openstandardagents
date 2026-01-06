# Quick Start Guide - OSSA VS Code Extension

Get started with the OSSA VS Code extension in 5 minutes!

## Installation (After Publishing)

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "OSSA"
4. Click "Install" on "OSSA Language Support"

## Development Installation

```bash
# Clone the repository
git clone https://gitlab.com/blueflyio/ossa/openstandardagents.git
cd openstandardagents/tools/vscode-ossa

# Install dependencies
npm install

# Compile the extension
npm run compile

# Open in VS Code and press F5 to test
code .
```

## Your First OSSA Agent (30 seconds)

### Method 1: Using Commands

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "OSSA: New Agent"
3. Enter agent name: `hello-world`
4. Enter version: `1.0.0`
5. Select provider: `anthropic`
6. Enter model: `claude-sonnet-4-20250514`
7. Done! A new agent manifest is created

### Method 2: Using Snippets

1. Create a new file: `my-agent.ossa.yaml`
2. Type: `ossa-agent`
3. Press `Tab`
4. Fill in the placeholders:
   - Name: `hello-world`
   - Version: `1.0.0`
   - Description: `My first OSSA agent`
   - Role: `You are a helpful assistant`
   - Provider: `anthropic`
   - Model: `claude-sonnet-4-20250514`
5. Done!

## Example: Complete Agent in 1 Minute

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: code-reviewer
  version: 1.0.0
  description: Reviews code for quality and security

spec:
  role: |
    You are a code review assistant. Analyze code for:
    1. Security vulnerabilities
    2. Code quality issues
    3. Best practice violations

    Always be constructive and provide actionable feedback.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.3  # Lower for consistent code analysis

  tools:
    - type: mcp
      name: filesystem
      description: Read code files
      server:
        command: npx
        args:
          - -y
          - "@modelcontextprotocol/server-filesystem"
        env:
          ALLOWED_PATHS: "/workspace"
```

## Available Snippets

| Type This | Get This |
|-----------|----------|
| `ossa-agent` | Minimal agent |
| `ossa-agent-tools` | Agent with tools |
| `ossa-agent-safety` | Agent with safety controls |
| `ossa-task` | Task manifest |
| `ossa-workflow` | Workflow manifest |
| `ossa-tool-mcp` | MCP tool |
| `ossa-tool-http` | HTTP tool |
| `ossa-tool-function` | Function tool |

## Validation

The extension automatically validates your OSSA files:

✅ **Valid manifest** - No errors shown

❌ **Invalid manifest** - Red squiggly underlines with error messages

### Common Errors Fixed

```yaml
# ❌ WRONG - Uppercase name
metadata:
  name: MyAgent  # Error: should be lowercase

# ✅ CORRECT
metadata:
  name: my-agent
```

```yaml
# ❌ WRONG - Missing required field
spec:
  llm:
    provider: anthropic
    # Error: model is required

# ✅ CORRECT
spec:
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
```

## Commands

Access via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- **OSSA: Validate Manifest** - Check current file
- **OSSA: New Agent Manifest** - Create new Agent
- **OSSA: New Task Manifest** - Create new Task
- **OSSA: New Workflow Manifest** - Create new Workflow

## Status Bar

Look for the OSSA indicator in the bottom-right:

- `✓ OSSA` - Extension active
- `✓ OSSA: Valid` - Current file is valid (3 sec)
- `⚠ OSSA: X errors, Y warnings` - Validation issues (5 sec)

## Configuration

Open Settings (`Cmd+,` or `Ctrl+,`) and search for "OSSA":

```json
{
  // Enable/disable validation
  "ossa.validation.enabled": true,

  // Schema version to use
  "ossa.validation.schemaVersion": "v0.3.0",

  // Enable/disable snippets
  "ossa.snippets.enabled": true,

  // Enable/disable diagnostics
  "ossa.diagnostics.enabled": true
}
```

## Next Steps

### 1. Explore Examples
Check out the [OSSA examples](https://gitlab.com/blueflyio/ossa/openstandardagents/tree/main/examples):
- Getting Started examples
- Multi-agent workflows
- Real-world use cases

### 2. Read the Docs
- [OSSA Documentation](https://openstandardagents.org)
- [OSSA Specification](https://openstandardagents.org/schemas/v0.3.0/manifest.json)

### 3. Join the Community
- GitHub: [openstandardagents](https://gitlab.com/blueflyio/ossa/openstandardagents)
- Discord: [OSSA Community](https://discord.gg/ossa) (coming soon)

## Troubleshooting

### Snippets not showing?
1. Ensure file ends with `.ossa.yaml` or `.ossa.json`
2. Check `ossa.snippets.enabled` is `true` in settings
3. Reload VS Code window

### Validation not working?
1. Ensure `ossa.validation.enabled` is `true`
2. Check internet connection (schema fetched remotely)
3. Look for errors in Debug Console (`View` → `Debug Console`)

### Extension not loading?
1. Check VS Code version (need 1.75.0+)
2. Reload window: `Cmd+R` or `Ctrl+R`
3. Check for extension conflicts

## Quick Reference Card

### File Extensions
```
✓ .ossa.yaml
✓ .ossa.yml
✓ .ossa.json
✓ manifest.ossa.yaml
✓ .agents/*/manifest.yaml
```

### Three Resource Kinds
```yaml
kind: Agent     # LLM-powered, can reason
kind: Task      # Deterministic steps
kind: Workflow  # Orchestration
```

### Required Fields (All Kinds)
```yaml
apiVersion: ossa/v0.3.0  # Required
kind: Agent              # Required
metadata:
  name: my-resource      # Required
  version: 1.0.0         # Required
```

### Agent-Specific Required
```yaml
spec:
  role: "System prompt"    # Required (or prompts.system)
  llm:                     # Required
    provider: anthropic    # Required
    model: claude-...      # Required
```

## Real-World Example: Support Agent

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: customer-support
  version: 1.0.0
  description: Customer support agent with knowledge base access

spec:
  role: |
    You are a friendly customer support agent. Help customers with:
    - Product questions
    - Troubleshooting
    - Account issues

    Be empathetic, clear, and always offer next steps.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7

  tools:
    - type: http
      name: knowledge_base
      description: Search company knowledge base
      endpoint: https://api.company.com/kb/search
      method: POST
      auth:
        type: bearer
        token: ${KB_API_TOKEN}

  safety:
    pii:
      detection: enabled
      policy: redact
    rateLimit:
      requestsPerMinute: 100

  autonomy:
    level: supervised
    approval_required: false  # Can handle routine queries
```

---

**Ready to build AI agents?** Start typing `ossa-agent` in a `.ossa.yaml` file! 🚀
