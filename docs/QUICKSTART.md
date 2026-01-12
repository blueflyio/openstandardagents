# OSSA Quickstart Guide

Get running with OSSA in 60 seconds.

## Table of Contents

- [One-Command Quickstart](#one-command-quickstart)
- [Manual Setup](#manual-setup)
- [What Gets Created](#what-gets-created)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

---

## One-Command Quickstart

The fastest way to get started with OSSA:

### macOS / Linux

```bash
# Download and run quickstart script
curl -fsSL https://ossa.dev/quickstart.sh | bash

# Or run locally if you have the repo
bash scripts/quickstart.sh
```

### Windows PowerShell

```powershell
# Download and run quickstart script
iwr -useb https://ossa.dev/quickstart.ps1 | iex

# Or run locally if you have the repo
.\scripts\quickstart.ps1
```

### Using npx (Works Everywhere)

```bash
# No installation required
npx @bluefly/ossa-cli quickstart

# With custom options
npx @bluefly/ossa-cli quickstart --output my-agent.ossa.yaml --provider openai
```

**What the script does:**

1. ✓ Checks for Node.js and npm
2. ✓ Installs OSSA CLI globally (or uses npx)
3. ✓ Creates a sample agent manifest
4. ✓ Validates the manifest
5. ✓ Shows next steps

**Expected output:**

```
🚀 OSSA Quickstart
══════════════════

[1/4] Checking dependencies...
     ✓ Node.js v20.10.0
     ✓ npm v10.2.3

[2/4] Installing OSSA CLI...
     ✓ @bluefly/ossa-cli@0.3.0 installed

[3/4] Creating your first agent...
     ✓ Created: my-first-agent.ossa.yaml

[4/4] Validating...
     ✓ Schema valid
     ✓ LLM config valid
     ✓ Ready to run!

═══════════════════════════════════════════════════════════════
🎉 SUCCESS! Your first OSSA agent is ready.

Next steps:
  1. Set your API key:
     export ANTHROPIC_API_KEY=sk-ant-...

  2. Run your agent:
     ossa run my-first-agent.ossa.yaml --interactive

  3. Learn more:
     https://openstandardagents.org/docs/getting-started

═══════════════════════════════════════════════════════════════
```

---

## Manual Setup

If you prefer step-by-step control:

### Step 1: Install the OSSA CLI

```bash
npm install -g @bluefly/ossa-cli
```

Verify installation:

```bash
ossa --version
# Output: 0.3.0
```

### Step 2: Set Your API Key

Choose one of the supported providers:

**Anthropic (Claude):**

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# Get key: https://console.anthropic.com
```

**OpenAI (GPT):**

```bash
export OPENAI_API_KEY=sk-...
# Get key: https://platform.openai.com/api-keys
```

**Google (Gemini):**

```bash
export GOOGLE_API_KEY=...
# Get key: https://makersuite.google.com/app/apikey
```

**Ollama (Local, Free):**

```bash
# No API key needed - install Ollama first
# https://ollama.ai

# Pull a model
ollama pull llama3.1

# Use in OSSA
export LLM_PROVIDER=ollama
export LLM_MODEL=llama3.1
```

### Step 3: Create Your First Agent

**Using the CLI:**

```bash
ossa quickstart
```

**Or manually create `my-first-agent.ossa.yaml`:**

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: my-first-agent
  version: 1.0.0
  description: A friendly AI assistant

spec:
  role: |
    You are a friendly and helpful AI assistant.
    Answer questions clearly and accurately.

  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7
```

### Step 4: Validate the Manifest

```bash
ossa validate my-first-agent.ossa.yaml
```

**Expected output:**

```
✓ Schema validation passed
✓ LLM configuration valid
✓ Ready to run
```

### Step 5: Run Your Agent

```bash
# Interactive mode (chat in terminal)
ossa run my-first-agent.ossa.yaml --interactive

# Single query mode
ossa run my-first-agent.ossa.yaml --query "What is OSSA?"

# API mode (starts HTTP server)
ossa run my-first-agent.ossa.yaml --api --port 3000
```

---

## What Gets Created

The quickstart creates a minimal but complete OSSA agent manifest with:

### Required Fields

- **apiVersion**: `ossa/v0.3.0` - The OSSA specification version
- **kind**: `Agent` - The resource type (Agent, Task, or Workflow)
- **metadata**: Name, version, description, labels

### Agent Configuration

- **spec.role**: The system prompt (who the agent is and how it behaves)
- **spec.llm**: LLM provider configuration (vendor-neutral)

### Example Structure

```yaml
apiVersion: ossa/v0.3.0 # Specification version
kind: Agent # Resource type

metadata:
  name: my-first-agent # Unique identifier
  version: 1.0.0 # Semantic version
  description: A friendly AI assistant
  labels:
    created-by: ossa-quickstart
    difficulty: beginner

spec:
  role: | # System prompt
    You are a friendly and helpful AI assistant...

  llm: # LLM configuration
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7
```

---

## Next Steps

### 1. Learn Core Concepts

- [Agent Manifests](./spec/agents.md) - Deep dive into agent configuration
- [Tools & Capabilities](./spec/tools.md) - Add external capabilities
- [Safety & Compliance](./spec/safety.md) - Production-ready guardrails

### 2. Explore Examples

Browse production-ready examples:

```bash
# List all examples
ls examples/

# Run an example
ossa run examples/getting-started/02-agent-with-tools.ossa.yaml --interactive
```

**Notable examples:**

- `examples/getting-started/` - Progressive tutorial series
- `examples/real-world/` - Production-ready templates
- `examples/multi-agent/` - Agent orchestration patterns
- `examples/kagent/` - Kubernetes-integrated agents

### 3. Add Tools to Your Agent

Extend your agent with external capabilities:

```yaml
spec:
  tools:
    - type: mcp_server
      name: filesystem
      config:
        allowed_directories: ["/tmp"]

    - type: function
      name: get_weather
      capabilities:
        - weather
```

[Learn more about tools](./spec/tools.md)

### 4. Enable Safety Controls

Add production-ready guardrails:

```yaml
spec:
  safety:
    pii_detection:
      enabled: true
      actions: ["redact"]

    rate_limiting:
      requests_per_minute: 60

    content_filtering:
      enabled: true
      block_categories: ["violence", "hate_speech"]
```

[Learn more about safety](./spec/safety.md)

### 5. Build Workflows

Compose multiple agents into workflows:

```yaml
apiVersion: ossa/v0.3.0
kind: Workflow

metadata:
  name: content-pipeline

spec:
  steps:
    - name: write
      agent: content-writer
      input: ${{ workflow.input }}

    - name: review
      agent: content-reviewer
      input: ${{ steps.write.output }}

    - name: publish
      agent: content-publisher
      input: ${{ steps.review.output }}
```

[Learn more about workflows](./spec/workflows.md)

---

## Troubleshooting

### Command Not Found: `ossa`

**Problem:** After installing, `ossa` command is not found.

**Solution:**

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"

# Or use npx instead
npx @bluefly/ossa-cli --help
```

### API Key Not Detected

**Problem:** CLI says "No LLM API key detected"

**Solution:**

```bash
# Check if key is set
echo $ANTHROPIC_API_KEY

# Set permanently (add to ~/.bashrc or ~/.zshrc)
export ANTHROPIC_API_KEY=sk-ant-...

# Or use .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
ossa run my-agent.ossa.yaml --env-file .env
```

### Validation Failed

**Problem:** `ossa validate` reports errors

**Common issues:**

1. **Invalid YAML syntax**

   ```bash
   # Fix: Validate YAML first
   yq eval . my-agent.ossa.yaml
   ```

2. **Missing required fields**

   ```bash
   # Fix: Ensure apiVersion, kind, metadata.name, spec.role, spec.llm are present
   ```

3. **Incorrect schema version**
   ```bash
   # Fix: Use ossa/v0.3.0 (latest)
   apiVersion: ossa/v0.3.0
   ```

### Provider Not Supported

**Problem:** Your LLM provider isn't recognized

**Solution:**

OSSA supports 20+ providers. Check the [supported providers list](./spec/llm-providers.md):

```bash
# Anthropic
export LLM_PROVIDER=anthropic

# OpenAI
export LLM_PROVIDER=openai

# Google
export LLM_PROVIDER=google

# Azure
export LLM_PROVIDER=azure

# Ollama (local)
export LLM_PROVIDER=ollama

# And many more...
```

### Permission Denied (macOS/Linux)

**Problem:** `npm install -g` fails with permission errors

**Solutions:**

1. **Use npx (no installation needed):**

   ```bash
   npx @bluefly/ossa-cli quickstart
   ```

2. **Fix npm permissions:**

   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   npm install -g @bluefly/ossa-cli
   ```

3. **Use Node Version Manager (recommended):**
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   # Install Node.js
   nvm install 20
   nvm use 20
   # Now install OSSA
   npm install -g @bluefly/ossa-cli
   ```

---

## Additional Resources

- **Documentation**: https://openstandardagents.org/docs
- **Specification**: https://openstandardagents.org/spec
- **Examples**: https://github.com/blueflyio/openstandardagents/tree/main/examples
- **GitHub**: https://github.com/blueflyio/openstandardagents
- **Discord**: https://discord.gg/ossa

---

## Quick Reference Card

```bash
# Installation
npm install -g @bluefly/ossa-cli

# Quickstart
ossa quickstart

# Validate
ossa validate <file>

# Run
ossa run <file> --interactive

# Create new agent
ossa init <name> --type agent

# Generate from template
ossa init <name> --template advanced

# Export to framework
ossa export <file> --format langchain

# Migrate old version
ossa migrate <file> --to v0.3.0

# Show schema
ossa schema --version v0.3.0

# Get help
ossa --help
ossa <command> --help
```

---

**Next:** [Getting Started Guide](./getting-started.md) | [Full Documentation](./README.md)
