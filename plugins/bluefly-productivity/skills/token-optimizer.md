---
name: token-optimize
description: "**Token Optimizer**: LLM token usage optimizer for cost-efficient AI operations. Includes ML-powered prediction, budget management, prompt optimization, and usage analytics. - MANDATORY TRIGGERS: tokens, cost, optimize prompt, reduce tokens, LLM cost, budget, usage, token count"
license: "Apache-2.0"
compatibility: "Requires LLM API access. Environment: LLM provider tokens"
allowed-tools: "Read Task mcp__memory__*"
metadata:
  ossa_manifest: ./agent.ossa.yaml
  service_account: token-optimizer
  domain: llm
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
---

# Token Optimizer

**OSSA Agent**: `token-optimizer` | **Version**: 1.0.0 | **Namespace**: blueflyio

Optimizes LLM token usage for cost efficiency and performance.

## Capabilities

| Capability | Category | Description |
|------------|----------|-------------|
| `token_counting` | reasoning | Count tokens in prompts |
| `token-optimization` | reasoning | Optimize token usage |
| `prompt_analysis` | reasoning | Analyze prompt efficiency |
| `context_compression` | action | Compress context windows |
| `cost_estimation` | reasoning | Estimate LLM costs |
| `cost-tracking` | observation | Track costs over time |
| `budget-management` | action | Manage token budgets |
| `usage-analysis` | reasoning | Analyze usage patterns |
| `prompt_optimization` | action | Optimize prompts |
| `model_recommendation` | reasoning | Recommend optimal models |
| `batch_optimization` | action | Optimize batch operations |
| `usage_forecasting` | reasoning | Forecast usage |
| `anomaly-detection` | reasoning | Detect anomalies |
| `pattern-learning` | reasoning | Learn patterns |

## Token Pricing (2025)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| Anthropic | claude-sonnet-4 | $3/1M | $15/1M |
| Anthropic | claude-3-haiku | $0.25/1M | $1.25/1M |
| OpenAI | gpt-4o | $2.50/1M | $10/1M |
| OpenAI | gpt-4o-mini | $0.15/1M | $0.60/1M |

## Optimization Strategies

### 1. Prompt Compression
```yaml
techniques:
  - Remove redundant whitespace
  - Use abbreviations where clear
  - Remove unnecessary examples
  - Compress JSON to minimal format
  - Use references instead of repetition

savings: 20-40% token reduction
```

### 2. Context Window Management
```yaml
techniques:
  - Sliding window for long conversations
  - Summarize old context
  - Prioritize recent messages
  - Remove system prompt repetition

savings: 30-50% for long contexts
```

### 3. Model Selection
```yaml
task_model_mapping:
  simple_classification: claude-3-haiku
  code_generation: claude-sonnet-4
  complex_reasoning: claude-opus-4
  embeddings: text-embedding-3-small

savings: 50-90% by right-sizing
```

### 4. Batch Optimization
```yaml
techniques:
  - Combine related requests
  - Use batch APIs where available
  - Parallelize independent tasks
  - Cache repeated queries

savings: 20-30% API overhead
```

## Usage Analytics

```yaml
metrics:
  daily_tokens:
    input: 1.2M
    output: 450K
    cost: $8.55

  by_agent:
    mr-reviewer: 400K (33%)
    issue-worker: 350K (29%)
    code-reviewer: 250K (21%)
    other: 200K (17%)

  trends:
    week_over_week: +15%
    projected_monthly: $256
```

## Budget Management

```yaml
budgets:
  daily:
    limit: $50
    alert_at: 80%
    action: notify

  monthly:
    limit: $500
    alert_at: 75%
    action: throttle

  per_agent:
    mr-reviewer: $100/month
    issue-worker: $75/month
```

## Examples

### Analyze Prompt
```
User: Analyze my prompt for optimization
Agent: Analyzing prompt (2,450 tokens)...

       Issues found:
       - Redundant whitespace: 120 tokens
       - Repeated system context: 340 tokens
       - Verbose examples: 280 tokens

       Optimized version: 1,710 tokens
       Savings: 30% (740 tokens)
       Cost savings: $0.002/call → $0.60/day
```

### Cost Report
```
User: Show my LLM costs this week
Agent: Weekly Cost Report (Dec 25-31)

       Total: $42.15

       By Model:
       - claude-sonnet-4: $35.20 (84%)
       - claude-3-haiku: $4.50 (11%)
       - gpt-4o-mini: $2.45 (5%)

       By Agent:
       - mr-reviewer: $18.50
       - issue-worker: $12.30
       - code-reviewer: $8.25
       - other: $3.10

       Recommendations:
       - Switch mr-reviewer summaries to haiku
       - Cache repeated code analysis
       - Estimated savings: $8/week
```

### Optimize for Budget
```
User: Stay under $300/month
Agent: Current trajectory: $425/month

       Optimization plan:
       1. Use haiku for triage (-$45)
       2. Compress MR diffs (-$30)
       3. Cache issue analysis (-$25)
       4. Batch security scans (-$20)

       New projection: $295/month ✓
```

## ML Models

```yaml
models:
  usage_forecaster:
    type: time-series
    predicts: daily_usage

  anomaly_detector:
    type: isolation-forest
    detects: unusual_spikes

  pattern_learner:
    type: clustering
    learns: optimization_opportunities
```

## Access Control

```yaml
access:
  tier: tier_1_read
  permissions:
    - read:prompts
    - read:usage_metrics
    - read:billing
  prohibited:
    - write:credentials
    - write:billing
    - execute:purchases
```

## Service Account

- **Account**: token-optimizer
- **Group**: blueflyio
- **Access**: Read-only analytics

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [OpenAI Pricing](https://openai.com/pricing)
