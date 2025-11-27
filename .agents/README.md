# OSSA Agents Directory

This directory contains OSSA-compliant agent manifests for major IDE and agent platforms.

## Available Agents

### IDEs

#### Cursor (`cursor/agent.ossa.yaml`)
AI-powered code editor with intelligent completions and refactoring.

**Capabilities:**
- Code completion with context
- Intelligent refactoring
- Code explanation
- Natural language to code generation

**Integration:**
```bash
# Validate
ossa validate .agents/cursor/agent.ossa.yaml

# Use in Cursor IDE
# Copy to your Cursor project and configure via .cursor/config
```

#### Windsurf (`windsurf/agent.ossa.yaml`)
Codeium's AI IDE with contextual generation and semantic search.

**Capabilities:**
- Contextual code generation
- Semantic codebase search
- Workflow automation
- Architectural suggestions

**Integration:**
```bash
# Validate
ossa validate .agents/windsurf/agent.ossa.yaml

# Use in Windsurf
# Import via Windsurf settings → AI Agents
```

#### VS Code (`vscode/agent.ossa.yaml`)
Visual Studio Code with Copilot and extension support.

**Capabilities:**
- Inline completions
- Chat assistance
- Workspace-wide edits
- Diagnostic fixes

**Integration:**
```bash
# Validate
ossa validate .agents/vscode/agent.ossa.yaml

# Use in VS Code
# Install GitHub Copilot extension
# Configure via settings.json
```

#### JetBrains (`jetbrains/agent.ossa.yaml`)
JetBrains IDEs (IntelliJ, PyCharm, WebStorm, etc.) with AI assistance.

**Capabilities:**
- Smart completions
- AI chat
- Refactoring suggestions
- Test generation
- Documentation generation

**Integration:**
```bash
# Validate
ossa validate .agents/jetbrains/agent.ossa.yaml

# Use in JetBrains IDEs
# Enable JetBrains AI Assistant plugin
# Configure via IDE settings
```

### Agent Platforms

#### Kiro CLI (`kiro/agent.ossa.yaml`)
AWS Kiro CLI agent for infrastructure management.

**Capabilities:**
- AWS CLI command execution
- Infrastructure analysis
- Resource management
- Best practices recommendations

**Integration:**
```bash
# Validate
ossa validate .agents/kiro/agent.ossa.yaml

# Use with Kiro CLI
kiro-cli chat --agent .agents/kiro/agent.ossa.yaml
```

#### Claude Desktop (`claude/agent.ossa.yaml`)
Anthropic's Claude Desktop with MCP integration.

**Capabilities:**
- Natural conversation
- File operations via MCP
- Web research
- Code execution

**Integration:**
```bash
# Validate
ossa validate .agents/claude/agent.ossa.yaml

# Use in Claude Desktop
# Add to Claude Desktop MCP configuration
# ~/.config/claude/mcp.json
```

#### GitHub Copilot (`copilot/agent.ossa.yaml`)
GitHub's AI pair programmer.

**Capabilities:**
- Real-time code suggestions
- Chat interaction
- Pull request review
- Security scanning

**Integration:**
```bash
# Validate
ossa validate .agents/copilot/agent.ossa.yaml

# Use with GitHub Copilot
# Install in VS Code or JetBrains
# Configure via GitHub settings
```

#### Cody (`cody/agent.ossa.yaml`)
Sourcegraph's AI assistant with codebase intelligence.

**Capabilities:**
- Context-aware completions
- Codebase chat
- Semantic code search
- Code explanation with context

**Integration:**
```bash
# Validate
ossa validate .agents/cody/agent.ossa.yaml

# Use with Cody
# Install Cody extension in your IDE
# Connect to Sourcegraph instance
```

## Usage

### Validation

Validate all agents:
```bash
for agent in .agents/*/agent.ossa.yaml; do
  echo "Validating $agent..."
  ossa validate "$agent"
done
```

### Running Agents

Run an agent interactively:
```bash
ossa run .agents/kiro/agent.ossa.yaml
```

Single message mode:
```bash
ossa run .agents/cursor/agent.ossa.yaml -m "Explain this code"
```

### Creating Custom Agents

Use these as templates:
```bash
# Copy an existing agent
cp .agents/cursor/agent.ossa.yaml .agents/my-agent/agent.ossa.yaml

# Edit the manifest
vim .agents/my-agent/agent.ossa.yaml

# Validate
ossa validate .agents/my-agent/agent.ossa.yaml
```

## Agent Structure

All agents follow the OSSA v0.2.6 specification:

```yaml
apiVersion: ossa/v0.2.6
kind: Agent

metadata:
  name: agent-name
  version: 1.0.0
  description: Agent description
  labels:
    platform: platform-name
    category: category

spec:
  taxonomy:
    domain: domain
    subdomain: subdomain
    capability: capability

  role: |
    Agent role and responsibilities

  llm:
    provider: provider-name
    model: model-name
    temperature: 0.2
    maxTokens: 4000

  capabilities:
    - name: capability_name
      description: Capability description
      input_schema: { ... }
      output_schema: { ... }

  runtime:
    type: local|cloud|hybrid
    config: { ... }

  integration:
    platform: platform-name
    version: ">=1.0.0"
    configuration: { ... }
```

## Platform-Specific Notes

### Cursor
- Requires Cursor IDE v0.40.0+
- Enable Composer and inline completions
- Configure via `.cursor/config`

### Windsurf
- Requires Windsurf v1.0.0+
- Enable Cascade and Supercomplete
- Import via Windsurf settings

### VS Code
- Requires VS Code v1.85.0+
- Install GitHub Copilot extension
- Enable inline suggestions

### JetBrains
- Requires JetBrains IDE 2024.1+
- Install JetBrains AI Assistant plugin
- Works across all JetBrains IDEs

### Kiro CLI
- Requires AWS credentials configured
- Set `AWS_PROFILE` and `AWS_REGION`
- Enable MCP tools

### Claude Desktop
- Configure MCP servers in `~/.config/claude/mcp.json`
- Enable filesystem and tool access
- Requires Claude Desktop v1.0.0+

### GitHub Copilot
- Requires GitHub Copilot subscription
- Works in VS Code and JetBrains
- Enable in IDE settings

### Cody
- Requires Sourcegraph account
- Configure Sourcegraph URL
- Enable embeddings for better context

## Contributing

To add a new agent:

1. Create directory: `mkdir .agents/platform-name`
2. Create manifest: `touch .agents/platform-name/agent.ossa.yaml`
3. Follow OSSA v0.2.6 specification
4. Validate: `ossa validate .agents/platform-name/agent.ossa.yaml`
5. Document in this README
6. Submit pull request

## Resources

- [OSSA Specification](../spec/v0.2.6/ossa-0.2.6.schema.json)
- [OSSA Documentation](https://openstandardagents.org)
- [Examples](../examples/)
- [CLI Reference](https://openstandardagents.org/docs/cli)

## License

Apache 2.0 - See [LICENSE](../LICENSE)
