# Skills Extension Tutorial

> **OSSA v0.3.3** - Complete guide to building Skills-compatible agents

## What is the Skills Extension?

The Skills Extension enables OSSA agents to be packaged and distributed as **Anthropic Skills**, making them compatible with:
- Claude (Desktop & Web)
- Claude Code
- Cursor IDE
- Kiro Platform
- AgentSkills.io Marketplace

## Quick Start (5 minutes)

### Step 1: Enable Skills in Your Manifest

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: my-skill-agent
  version: 1.0.0
  description: My first Skills-compatible agent
spec:
  role: You are a helpful assistant
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
extensions:
  skills:
    enabled: true
    platforms:
      - Claude
      - Cursor
    allowedTools:
      - Read
      - Write
```

### Step 2: Export to Skills Format

```bash
# Install OSSA CLI
npm install -g @bluefly/openstandardagents

# Export your agent
ossa export --format skills --output ./my-skill/
```

### Step 3: Test in Claude/Cursor

1. Copy the exported skill directory to your Skills folder:
   - **Claude Desktop**: `~/Library/Application Support/Claude/claude_skills/`
   - **Cursor**: `~/.cursor/skills/`

2. Restart Claude/Cursor

3. Your agent is now available as a Skill!

## Deep Dive

### Progressive Disclosure Pattern

Skills use a token-budgeted disclosure pattern to optimize performance:

```yaml
extensions:
  skills:
    enabled: true
    progressiveDisclosure:
      metadataTokens: 100      # Name, description (always loaded)
      instructionsTokens: 5000 # Full SKILL.md body (loaded on demand)
      resourcesTokens: 10000   # Documentation, examples (loaded when needed)
```

**How it works:**
1. **Metadata Stage**: Agent name and description (100 tokens)
2. **Instructions Stage**: Full role and capabilities (5000 tokens)
3. **Resources Stage**: Documentation, examples, schemas (10000 tokens)

### Platform-Specific Configuration

Different platforms have different requirements:

```yaml
extensions:
  skills:
    enabled: true
    platforms:
      - Claude          # Full Skills format
      - Claude Code     # Code-focused tools
      - Cursor          # IDE integration
      - Kiro            # Enterprise platform
    platformConfig:
      claude:
        maxTokens: 100000
        streaming: true
      cursor:
        workspaceAccess: true
        fileOperations: true
      kiro:
        enterpriseFeatures: true
```

### Tool Mapping

Map OSSA capabilities to Skills tools:

```yaml
spec:
  capabilities:
    - type: function
      name: read_file
      description: Read a file from the workspace
    - type: function
      name: write_file
      description: Write content to a file
extensions:
  skills:
    enabled: true
    allowedTools:
      - Read      # Maps to read_file
      - Write     # Maps to write_file
      - Bash      # Maps to shell execution
      - HTTP      # Maps to HTTP requests
```

## Advanced Patterns

### Multi-Platform Skills

Create a single agent that works across all platforms:

```yaml
extensions:
  skills:
    enabled: true
    platforms:
      - Claude
      - Claude Code
      - Cursor
      - Kiro
    directories:
      skill:
        path: ./skill
        include:
          - SKILL.md
          - resources/
          - examples/
      metadata:
        path: ./skill/metadata.json
```

### Skills with Resources

Include documentation and examples:

```yaml
extensions:
  skills:
    enabled: true
    directories:
      resources:
        path: ./skill/resources
        files:
          - api-reference.md
          - examples/
          - schemas/
```

### Importing Existing Skills

Convert existing Skills to OSSA format:

```bash
# Import a Skill
ossa import --format skills --path ./existing-skill/

# This creates an OSSA manifest from the Skill
```

## CLI Commands

### Export Commands

```bash
# Export to Skills format
ossa export --format skills --output ./my-skill/

# Export with specific platform
ossa export --format skills --platform cursor --output ./cursor-skill/

# Export with resources
ossa export --format skills --include-resources --output ./full-skill/
```

### Import Commands

```bash
# Import Skills to OSSA
ossa import --format skills --path ./my-skill/

# Import and validate
ossa import --format skills --path ./my-skill/ --validate

# Import with conversion
ossa import --format skills --path ./my-skill/ --convert-to v0.3.3
```

### Validation

```bash
# Validate Skills compatibility
ossa validate --check-skills agent.ossa.yaml

# Validate against Skills schema
ossa validate --schema skills agent.ossa.yaml
```

## Best Practices

### 1. Token Budget Management

Keep metadata small, instructions concise:

```yaml
metadata:
  name: code-reviewer
  description: Reviews code for bugs and improvements  # < 100 tokens
spec:
  role: |
    You review code for:
    - Security vulnerabilities
    - Performance issues
    - Best practices
    # Keep under 5000 tokens
```

### 2. Tool Selection

Only include tools you actually use:

```yaml
extensions:
  skills:
    allowedTools:
      - Read      # ✅ Used
      - Write     # ✅ Used
      # - Bash    # ❌ Not used - don't include
```

### 3. Platform Targeting

Target specific platforms for better optimization:

```yaml
extensions:
  skills:
    platforms:
      - Cursor    # If only for IDE use
      # Don't include Claude if not needed
```

### 4. Resource Organization

Organize resources for progressive loading:

```
skill/
├── SKILL.md              # Main instructions (5000 tokens)
├── metadata.json         # Name, description (100 tokens)
└── resources/
    ├── api-reference.md  # Loaded on demand
    ├── examples/         # Loaded when needed
    └── schemas/          # Loaded for validation
```

## Troubleshooting

### Skill Not Appearing in Claude/Cursor

1. **Check directory location**:
   - Claude: `~/Library/Application Support/Claude/claude_skills/`
   - Cursor: `~/.cursor/skills/`

2. **Verify manifest structure**:
   ```bash
   ossa validate --check-skills agent.ossa.yaml
   ```

3. **Check platform compatibility**:
   ```yaml
   extensions:
     skills:
       platforms:
         - Claude  # Must match your platform
   ```

### Export Errors

```bash
# Check for missing dependencies
ossa export --format skills --debug

# Validate before export
ossa validate agent.ossa.yaml
ossa export --format skills --output ./skill/
```

### Import Errors

```bash
# Check Skill structure
ossa import --format skills --path ./skill/ --debug

# Validate Skill format
ossa validate --format skills ./skill/
```

## Examples

### Example 1: Code Reviewer Skill

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: code-reviewer
  version: 1.0.0
  description: Reviews code for bugs, security, and best practices
spec:
  role: |
    You are an expert code reviewer. You analyze code for:
    - Security vulnerabilities
    - Performance bottlenecks
    - Code quality issues
    - Best practice violations
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
  capabilities:
    - type: function
      name: read_file
      description: Read source code files
    - type: function
      name: analyze_code
      description: Analyze code for issues
extensions:
  skills:
    enabled: true
    platforms:
      - Claude Code
      - Cursor
    allowedTools:
      - Read
      - Write
    progressiveDisclosure:
      metadataTokens: 100
      instructionsTokens: 3000
```

### Example 2: Data Analysis Skill

```yaml
apiVersion: ossa/v0.3.2
kind: Agent
metadata:
  name: data-analyst
  version: 1.0.0
  description: Analyzes data and generates insights
spec:
  role: You analyze datasets and provide insights
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
  capabilities:
    - type: function
      name: read_csv
      description: Read CSV files
    - type: function
      name: analyze_data
      description: Perform data analysis
extensions:
  skills:
    enabled: true
    platforms:
      - Claude
      - Kiro
    allowedTools:
      - Read
      - HTTP
```

## Next Steps

1. **Try the playground**: Test your Skills manifest at `/playground`
2. **Read the migration guide**: Upgrade from v0.3.2 → v0.3.3
3. **Join the community**: Share your Skills and get feedback
4. **Build more Skills**: Create a library of reusable Skills

## Resources

- [Skills Extension Reference](../skills-extension.md)
- [Migration Guide](../migration-v0.3.2-to-v0.3.3.md)
- [Anthropic Skills Docs](https://github.com/anthropics/skills)
- [AgentSkills.io](https://agentskills.io)
