# OSSA Language Support for VS Code

Official Visual Studio Code extension for **OSSA (Open Standard for Scalable AI Agents)** - the OpenAPI of AI Agents.

## Features

### 🎯 Schema Validation
- **Automatic validation** of `.ossa.yaml` and `.ossa.json` files against the OSSA specification
- **Real-time error detection** as you type
- **IntelliSense** for all OSSA properties with documentation
- Supports multiple OSSA versions (v0.3.0, v0.2.9, v0.2.8, etc.)

### 📝 Code Snippets
Type these prefixes and press Tab to insert templates:

| Prefix | Description |
|--------|-------------|
| `ossa-agent` | Minimal Agent manifest |
| `ossa-agent-tools` | Agent with tools |
| `ossa-agent-safety` | Agent with safety controls |
| `ossa-task` | Task manifest |
| `ossa-workflow` | Workflow manifest |
| `ossa-tool-mcp` | MCP tool definition |
| `ossa-tool-http` | HTTP tool definition |
| `ossa-tool-function` | Function tool definition |
| `ossa-messaging` | Agent-to-Agent messaging |
| `ossa-constraints` | Cost and performance constraints |
| `ossa-observability` | Tracing, metrics, logging |
| `ossa-autonomy` | Autonomy configuration |
| `ossa-agent-complete` | Complete agent with all features |

### 🔍 File Detection
Automatically recognizes OSSA manifests in common locations:
- `*.ossa.yaml` / `*.ossa.yml`
- `*.ossa.json`
- `**/manifest.ossa.yaml`
- `**/.agents/**/manifest.yaml`
- `**/.gitlab/agents/**/manifest.ossa.yaml`

### ⚙️ Configuration
Customize behavior in VS Code settings:

```json
{
  "ossa.validation.enabled": true,
  "ossa.validation.schemaVersion": "v0.3.0",
  "ossa.snippets.enabled": true,
  "ossa.diagnostics.enabled": true
}
```

## Installation

### From VS Code Marketplace (Coming Soon)
1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Type `ext install bluefly.ossa-language-support`
4. Press Enter

### Manual Installation (Development)
1. Clone the repository:
   ```bash
   git clone https://gitlab.com/blueflyio/ossa/openstandardagents.git
   cd openstandardagents/src/tools/vscode-ossa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Press `F5` in VS Code to launch Extension Development Host

## Quick Start

### Create Your First Agent

1. Create a new file: `my-agent.ossa.yaml`
2. Type `ossa-agent` and press Tab
3. Fill in the placeholders:
   - Agent name (e.g., `code-reviewer`)
   - Version (e.g., `1.0.0`)
   - Description
   - LLM provider and model

### Example: Minimal Agent

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: hello-world
  version: 1.0.0
  description: A simple greeting agent

spec:
  role: |
    You are a friendly AI assistant that greets users.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.7
```

### Example: Agent with Tools

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: code-reviewer
  version: 1.0.0

spec:
  role: |
    You are a code review assistant that analyzes code quality.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514

  tools:
    - type: mcp
      name: filesystem
      description: Read and analyze code files
      server:
        command: npx
        args:
          - -y
          - "@modelcontextprotocol/server-filesystem"
        env:
          ALLOWED_PATHS: "/workspace"
```

## Commands

Access these commands via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **OSSA: Validate Manifest** - Validate current OSSA file
- **OSSA: New Agent Manifest** - Create new Agent manifest
- **OSSA: New Task Manifest** - Create new Task manifest
- **OSSA: New Workflow Manifest** - Create new Workflow manifest

## Requirements

- VS Code 1.75.0 or higher
- **Recommended**: [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) for enhanced YAML support

## Related Extensions

For the best OSSA development experience, install:
- [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) - Enhanced YAML language support
- [JSON](https://marketplace.visualstudio.com/items?itemName=ZainChen.json) - JSON formatting and validation

## OSSA Resources

- **Documentation**: [https://openstandardagents.org](https://openstandardagents.org)
- **GitHub**: [https://gitlab.com/blueflyio/ossa/openstandardagents](https://gitlab.com/blueflyio/ossa/openstandardagents)
- **Schema**: [https://openstandardagents.org/schemas/v0.3.0/manifest.json](https://openstandardagents.org/schemas/v0.3.0/manifest.json)
- **Examples**: [https://gitlab.com/blueflyio/ossa/openstandardagents/tree/main/examples](https://gitlab.com/blueflyio/ossa/openstandardagents/tree/main/examples)

## The Three Kinds of OSSA Resources

### 1. Agent (LLM-powered)
```yaml
kind: Agent
spec:
  role: "You are a helpful assistant"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
  tools: [...]
```

### 2. Task (Deterministic)
```yaml
kind: Task
spec:
  steps:
    - name: build
      type: script
      config:
        command: npm run build
```

### 3. Workflow (Orchestration)
```yaml
kind: Workflow
spec:
  entrypoint: main
  nodes:
    - name: main
      type: agent
      ref: code-reviewer
```

## Why OSSA?

Just as **OpenAPI** standardized REST API definitions, **OSSA** standardizes AI agent definitions:

- **Portable**: Write once, deploy on Claude, OpenAI, Google, LangChain, CrewAI, AutoGen
- **Declarative**: YAML/JSON manifests, not imperative code
- **Composable**: Build workflows from Agents, Tasks, and sub-workflows
- **Observable**: Built-in tracing, metrics, and cost tracking
- **Safe**: Policy-driven guardrails, PII detection, rate limits

## Troubleshooting

### Validation not working?
1. Ensure file has `.ossa.yaml` or `.ossa.json` extension
2. Check `ossa.validation.enabled` is `true` in settings
3. Verify internet connectivity (schema fetched from openstandardagents.org)

### Snippets not appearing?
1. Check `ossa.snippets.enabled` is `true`
2. Ensure you're in a YAML or JSON file
3. Try reloading VS Code window

### Schema version mismatch?
Update the schema version in settings:
```json
{
  "ossa.validation.schemaVersion": "v0.3.0"
}
```

## Contributing

We welcome contributions! This extension is part of the OSSA project.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](https://gitlab.com/blueflyio/ossa/openstandardagents/blob/main/CONTRIBUTING.md) for details.

## Support

- **Issues**: [GitHub Issues](https://gitlab.com/blueflyio/ossa/openstandardagents/issues)
- **Discussions**: [GitHub Discussions](https://gitlab.com/blueflyio/ossa/openstandardagents/discussions)
- **Discord**: [Join our community](https://discord.gg/ossa) (coming soon)

## License

Apache 2.0 - See [LICENSE](https://gitlab.com/blueflyio/ossa/openstandardagents/blob/main/LICENSE)

## Changelog

### 0.1.0 (Initial Release)
- Schema validation for OSSA v0.3.0
- 13+ code snippets for Agents, Tasks, Workflows
- IntelliSense and autocomplete
- File type detection
- Multi-version schema support

---

**Made with ❤️ by the OSSA community**

[⭐ Star us on GitHub](https://gitlab.com/blueflyio/ossa/openstandardagents) | [📖 Read the Docs](https://openstandardagents.org)
