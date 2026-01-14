# OSSA v0.3.4 - Unified Agent Schema

## The Rocketship 🚀

This schema unifies OSSA, GitLab Duo, Google A2A, and MCP into a single universal agent platform.

### What Changed

**Before (v0.2.x):**
```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
```

**After (v0.3.4):**
```yaml
llm:
  provider: ${LLM_PROVIDER:-anthropic}
  model: ${LLM_MODEL:-claude-sonnet}
  profile: ${LLM_PROFILE:-balanced}
  fallback_models:
    - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
      model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
```

### Key Features

1. **Zero Hardcoded Models** - All LLM config is runtime-configurable
2. **Execution Profiles** - Google A2A compatible (fast/balanced/deep/safe)
3. **Multi-Runtime Support** - Works with Duo, A2A, OSSA, MCP
4. **Fallback Models** - Multi-provider resilience
5. **Structured Functions** - A2A/OpenAI function calling format
6. **Extensions** - Pluggable external behaviors

### Compatibility Matrix

| Feature | OSSA v0.2.x | Duo | A2A | v0.3.4 |
|---------|-------------|-----|-----|--------|
| Runtime-configurable models | ❌ | ❌ | ✅ | ✅ |
| Execution profiles | ❌ | ❌ | ✅ | ✅ |
| Multi-provider fallback | partial | ❌ | ✅ | ✅ |
| Structured functions | ❌ | partial | ✅ | ✅ |
| Extensions | partial | partial | ✅ | ✅ |

### Migration

```bash
# Auto-migrate all agents
./scripts/migrate-to-unified-llm.sh

# Generate new agent
./scripts/generate-agent.sh my-agent worker

# Validate
ossa validate examples/
```

### Environment Variables

```bash
# Primary LLM
export LLM_PROVIDER=anthropic
export LLM_MODEL=claude-sonnet-4
export LLM_PROFILE=balanced

# Fallbacks
export LLM_FALLBACK_PROVIDER_1=openai
export LLM_FALLBACK_MODEL_1=gpt-4o

# Runtime
export AGENT_RUNTIME=unified
export AGENT_SCHEDULING=fair
export AGENT_PRIORITY=normal
```

### Execution Profiles

- **fast** - Quick responses (4K tokens, temp=0.0)
- **balanced** - General ops (16K tokens, temp=0.1)
- **deep** - Analysis (32K tokens, temp=0.2, reasoning enabled)
- **safe** - Compliance (temp=0.0, validation required)

### CI Enforcement

Add to `.gitlab-ci.yml`:

```yaml
include:
  - local: .gitlab/ci/validate-no-hardcoded-models.yml
```

This blocks any MR with hardcoded model names.

### Example Agent

See: `examples/unified/security-scanner.ossa.yaml`

### Schema Files

- `schemas/unified-llm.yaml` - LLM configuration
- `schemas/runtime.yaml` - Runtime declaration
- `schemas/capabilities.yaml` - Capability definitions
- `schemas/functions.yaml` - Function declarations
- `schemas/agent-unified.yaml` - Complete agent schema

### Why This Matters

1. **No More Breaking Changes** - Model updates don't require code changes
2. **Multi-Provider** - Switch between Anthropic/OpenAI/Google/Groq instantly
3. **Future-Proof** - New runtimes (A2A, Duo) work without modification
4. **Cost Optimization** - Use cheap models for triage, expensive for analysis
5. **Compliance** - Audit trail of which models were used when

### Next Steps

1. Run migration: `./scripts/migrate-to-unified-llm.sh`
2. Update CI: Add validation rule
3. Test: `ossa validate examples/`
4. Deploy: Agents auto-detect runtime
