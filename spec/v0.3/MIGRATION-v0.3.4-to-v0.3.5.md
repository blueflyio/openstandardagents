# Migration Guide: OSSA v0.3.4 → v0.3.5

**Target Audience**: Agent developers, platform builders, framework maintainers

---

## OVERVIEW

OSSA v0.3.5 introduces **10 major enhancements** that transform the specification into the definitive OpenAPI for Software Agents. This guide helps you migrate existing agents and adopt new features.

---

## BREAKING CHANGES

**None**. OSSA v0.3.5 is **100% backward compatible** with v0.3.4. All new features are optional extensions.

---

## MIGRATION STEPS

### Step 1: Update API Version

```yaml
# Before (v0.3.4)
apiVersion: ossa/v0.3.4

# After (v0.3.5)
apiVersion: ossa/v0.3.5
```

### Step 2: Add Completion Signals (Recommended)

**Why**: Enables intelligent workflow orchestration.

```yaml
# Add to spec section
spec:
  completion:
    default_signal: complete
    signals:
      - signal: continue
        condition: "iteration_count < max_iterations"
      - signal: blocked
        condition: "confidence < 0.5"
    max_iterations: 10
```

**Impact**: Orchestrators can make intelligent decisions about workflow progression.

---

### Step 3: Enable Checkpointing (For Long-Running Agents)

**Why**: Enables fault tolerance and cost optimization.

```yaml
# Add to spec section
spec:
  checkpointing:
    enabled: true
    interval: iteration
    interval_value: 5
    storage:
      backend: agent-brain
```

**Impact**: Agents can pause/resume, reducing costs and improving reliability.

---

### Step 4: Add MoE Extension (For Cost Optimization)

**Why**: 30% cost reduction via intelligent expert selection.

```yaml
# Add to extensions section
extensions:
  experts:
    registry:
      - id: reasoning-expert
        model:
          provider: anthropic
          model: claude-opus-4-5-20251101
        specializations: [complex_reasoning, planning]
        cost_tier: premium
      - id: speed-expert
        model:
          provider: google
          model: gemini-2.0-flash
        specializations: [quick_responses]
        cost_tier: economy
    selection_strategy: agent_controlled
```

**Impact**: Agents can select optimal experts based on task requirements.

---

### Step 5: Configure MOE Metrics (For Performance Tracking)

**Why**: Data-driven agent improvement.

```yaml
# Add to extensions section
extensions:
  moe:
    primary:
      metric: review_accuracy
      target: 0.95
      measurement:
        type: ratio
        numerator: approved_reviews_without_issues
        denominator: total_reviews
    secondary:
      - metric: review_latency_p95
        target: 600
        unit: seconds
    operational:
      - metric: uptime
        target: 0.999
```

**Impact**: Standardized performance evaluation and improvement tracking.

---

### Step 6: Add BAT Framework (For Technology Selection)

**Why**: Consistent, auditable technology selection.

```yaml
# Add to extensions section
extensions:
  bat:
    selection_criteria:
      - dimension: reasoning_depth
        required: true
        options:
          - value: deep
            technologies: [claude-opus, gpt-4-turbo]
            cost_tier: premium
          - value: balanced
            technologies: [claude-sonnet, gpt-4o]
            cost_tier: standard
```

**Impact**: Systematic technology selection with audit trail.

---

### Step 7: Enable Capability Discovery (For Runtime Adaptation)

**Why**: Agents adapt to infrastructure changes automatically.

```yaml
# Add to extensions section
extensions:
  capabilities:
    discovery:
      enabled: true
      registry: agent-mesh
      refresh_interval: 60s
```

**Impact**: Agents discover new capabilities at runtime.

---

### Step 8: Add Feedback Loops (For Learning)

**Why**: Continuous agent improvement.

```yaml
# Add to extensions section
extensions:
  feedback:
    tools:
      - name: record_feedback
      - name: get_feedback_summary
      - name: suggest_improvements
    learning:
      enabled: true
      strategy: reinforcement
```

**Impact**: Agents learn from feedback and improve over time.

---

## MIGRATION CHECKLIST

### Basic Migration (Minimal Changes)

- [ ] Update `apiVersion` to `ossa/v0.3.5`
- [ ] Test agent still works (backward compatibility)
- [ ] Update documentation

### Recommended Migration (Adopt Key Features)

- [ ] Add `completion` signals
- [ ] Enable `checkpointing` (if long-running)
- [ ] Add `moe` metrics
- [ ] Configure `experts` registry (if cost-sensitive)

### Full Migration (All Features)

- [ ] Add all extensions (MoE, BAT, MOE, Capabilities, Feedback)
- [ ] Configure infrastructure substrate
- [ ] Add Flow kind support
- [ ] Enable enhanced A2A protocol

---

## EXAMPLE: Minimal Migration

```yaml
# Before (v0.3.4)
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: my-agent
spec:
  identity:
    id: "@my-agent"
  llm:
    provider: anthropic
    model: claude-sonnet-4

# After (v0.3.5) - Minimal
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: my-agent
spec:
  identity:
    id: "@my-agent"
  llm:
    provider: anthropic
    model: claude-sonnet-4
  completion:
    default_signal: complete
```

**That's it!** Your agent is now v0.3.5 compatible.

---

## EXAMPLE: Full Migration

See [forward-thinking-agent.ossa.yaml](./examples/forward-thinking-agent.ossa.yaml) for a complete example with all v0.3.5 features.

---

## VALIDATION

After migration, validate your agent:

```bash
# Validate schema
ossa validate my-agent.ossa.yaml

# Check for v0.3.5 features
ossa validate --version 0.3.5 my-agent.ossa.yaml

# Test backward compatibility
ossa validate --version 0.3.4 my-agent.ossa.yaml
```

---

## ROLLBACK PLAN

If you encounter issues:

1. **Revert API version**: Change `apiVersion` back to `ossa/v0.3.4`
2. **Remove extensions**: Comment out new extension sections
3. **Test**: Verify agent works with v0.3.4 runtime

**Note**: v0.3.5 agents are backward compatible with v0.3.4 runtimes (new features ignored).

---

## SUPPORT

- **Documentation**: [README.md](./README.md)
- **Examples**: [examples/](./examples/)
- **Schema Files**: [*.schema.json](./)
- **Enhancement Plan**: [ENHANCEMENT-PLAN.md](./ENHANCEMENT-PLAN.md)

---

**Migration is optional but recommended. Start with minimal changes and adopt features incrementally.**
