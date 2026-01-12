# Universal Agent Platform - Implementation Guide

## Overview

OSSA v0.3.0 transforms the agent platform into a universal runtime that works seamlessly with:
- **OSSA Mesh** - Native OSSA runtime
- **GitLab Duo** - GitLab's AI agent platform
- **Google A2A** - Google's Agent-to-Agent protocol
- **MCP** - Model Context Protocol

## The Problem We Solved

### Before (v0.2.x)
```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514  # HARDCODED
```

**Issues:**
- Model updates require code changes
- No fallback if provider fails
- Can't switch providers without redeployment
- Not compatible with A2A/Duo requirements
- Vendor lock-in

### After (v0.3.0)
```yaml
llm:
  provider: ${LLM_PROVIDER:-anthropic}
  model: ${LLM_MODEL:-claude-sonnet}
  profile: ${LLM_PROFILE:-balanced}
  fallback_models:
    - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
      model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
```

**Benefits:**
- ✅ Runtime model selection
- ✅ Multi-provider fallback
- ✅ A2A/Duo compatible
- ✅ Cost optimization via profiles
- ✅ Zero vendor lock-in

## Architecture

```
┌─────────────────────────────────────────────┐
│      Unified Agent Schema (v0.3.0)          │
│  OSSA + GitLab Duo + Google A2A + MCP       │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
   OSSA Mesh      GitLab Duo      Google A2A
  (Serverless)   (Flow Agents)   (Extensions)
       │               │               │
       └───────┬───────┴───────┬───────┘
               │               │
        Unified LLM Block   Runtime Config
        (no hardcoded)     (multi-platform)
               │               │
               └───────┬───────┘
                       │
              Execution Profiles
           (fast/balanced/deep/safe)
```

## Key Components

### 1. Unified LLM Configuration

**File:** `spec/v0.3.0/schemas/unified-llm.yaml`

```yaml
llm:
  provider: ${LLM_PROVIDER:-anthropic}
  model: ${LLM_MODEL:-claude-sonnet}
  profile: ${LLM_PROFILE:-balanced}
  temperature: ${LLM_TEMPERATURE:-0.1}
  maxTokens: ${LLM_MAX_TOKENS:-16000}
  
  fallback_models:
    - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
      model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
      condition: on_error
```

### 2. Execution Profiles (A2A Compatible)

```yaml
execution_profile:
  default: ${LLM_PROFILE:-balanced}
  profiles:
    fast:      # Quick triage
      maxTokens: 4000
      temperature: 0.0
    balanced:  # General ops
      maxTokens: 16000
      temperature: 0.1
    deep:      # Analysis
      maxTokens: 32000
      temperature: 0.2
      reasoning_enabled: true
    safe:      # Compliance
      temperature: 0.0
      validation_required: true
```

### 3. Runtime Declaration

```yaml
runtime:
  type: ${AGENT_RUNTIME:-unified}
  supports:
    - google-a2a
    - gitlab-duo
    - ossa-mesh
    - mcp
    - local-execution
```

### 4. Capabilities (A2A/Duo Format)

```yaml
capabilities:
  - name: security_scan
    type: action
    runtime: hybrid
    input_schema:
      type: object
      required: [path]
```

### 5. Functions (OpenAI/A2A Format)

```yaml
functions:
  - name: scan_security
    description: "Run security analysis"
    parameters:
      type: object
      properties:
        path:
          type: string
      required: [path]
```

## Migration Path

### Step 1: Run Auto-Migration

```bash
cd /path/to/openstandardagents
./scripts/migrate-to-unified-llm.sh
```

This automatically:
- Replaces hardcoded providers with env vars
- Replaces hardcoded models with env vars
- Adds execution profiles
- Adds runtime declarations
- Creates backups (.backup files)

### Step 2: Add CI Validation

Add to `.gitlab-ci.yml`:

```yaml
include:
  - local: .gitlab/ci/validate-no-hardcoded-models.yml
```

This blocks any MR with hardcoded models.

### Step 3: Update Environment

```bash
# .env or Kubernetes ConfigMap
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4
LLM_PROFILE=balanced

# Fallbacks
LLM_FALLBACK_PROVIDER_1=openai
LLM_FALLBACK_MODEL_1=gpt-4o
LLM_FALLBACK_PROVIDER_2=google
LLM_FALLBACK_MODEL_2=gemini-2.0-flash

# Runtime
AGENT_RUNTIME=unified
AGENT_SCHEDULING=fair
AGENT_PRIORITY=normal
```

### Step 4: Test

```bash
# Validate all agents
ossa validate examples/

# Run specific agent
ossa run examples/unified/security-scanner.ossa.yaml

# Test with different profile
LLM_PROFILE=deep ossa run examples/unified/security-scanner.ossa.yaml
```

## Service Account Agents

All bot agents must adopt the unified schema:

```bash
# List of agents to migrate
@bot-component-trainer
@bot-wiki-aggregator
@bot-component-builder
@bot-ossa-validator
@bot-gitlab-ci-fixer
@bot-drupal-recipe-pub
@bot-issue-worker
@bot-mr-reviewer
# ... (all 15+ bots)
```

Each agent gets:
1. Unified LLM config
2. Execution profiles
3. Runtime declaration
4. Capabilities block
5. Functions block

## Environment-Specific Configs

### Development
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama-3.3-70b
LLM_PROFILE=fast
```

### Staging
```bash
LLM_PROVIDER=anthropic
LLM_MODEL=claude-haiku
LLM_PROFILE=balanced
```

### Production
```bash
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4
LLM_PROFILE=deep
LLM_FALLBACK_PROVIDER_1=openai
LLM_FALLBACK_MODEL_1=gpt-4o
```

## Cost Optimization

Use profiles to optimize costs:

```yaml
# Triage: Use fast/cheap models
LLM_PROFILE=fast → 4K tokens, cheap model

# General: Use balanced
LLM_PROFILE=balanced → 16K tokens, mid-tier model

# Analysis: Use deep
LLM_PROFILE=deep → 32K tokens, best model

# Compliance: Use safe
LLM_PROFILE=safe → Audit logging, validation
```

## Compliance & Audit

The unified schema enables:
- **Audit trail** - Which model was used when
- **Compliance** - Enforce specific models for regulated workloads
- **Cost tracking** - Per-profile cost analysis
- **Performance** - Profile-based optimization

## Generator Usage

```bash
# Generate new agent
./scripts/generate-agent.sh my-security-bot analyzer

# Output: examples/generated/my-security-bot.ossa.yaml
# Already has unified schema, no hardcoded models
```

## Validation

```bash
# Validate single agent
ossa validate examples/unified/security-scanner.ossa.yaml

# Validate all agents
ossa validate examples/

# Strict validation
ossa validate examples/ --strict --version 0.3.0
```

## Next Steps

1. ✅ Run migration script
2. ✅ Add CI validation rule
3. ✅ Update environment configs
4. ✅ Test with different profiles
5. ✅ Deploy to staging
6. ✅ Monitor performance
7. ✅ Roll out to production

## Support

- **Docs:** https://docs.openstandardagents.org
- **Schema:** `spec/v0.3.0/schemas/`
- **Examples:** `examples/unified/`
- **Issues:** https://gitlab.com/blueflyio/openstandardagents/-/issues
